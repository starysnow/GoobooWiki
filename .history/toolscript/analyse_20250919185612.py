# master_processor.py
import os
import subprocess
import json
import re
import time
import google.generativeai as genai
from pathlib import Path

# --- 全局配置 ---
API_KEY = 'curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: GEMINI_API_KEY' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }''  # <--- 在这里输入你的API密钥
MODEL_NAME = 'gemini-2.0-flash'
JS_MODULES_DIR = 'js_modules'
ZH_MAP_PATH = 'public/zh_map.json'
TEMP_BUILD_DIR = 'temp_build'
TEMP_JSON_DIR = 'temp_json'
FINAL_OUTPUT_DIR = 'wiki_output'

# --- 阶段一：使用 esbuild 打包 ---
def run_esbuild():
    print("--- 阶段一：使用 esbuild 打包 JS 模块 ---")
    if not os.path.exists(TEMP_BUILD_DIR):
        os.makedirs(TEMP_BUILD_DIR)

    entry_points = []
    for root, _, files in os.walk(JS_MODULES_DIR):
        for file in files:
            if file.endswith('.js'):
                entry_points.append(os.path.join(root, file))

    if not entry_points:
        print("错误：在 'js_modules' 目录中没有找到 JS 文件。")
        return False

    command = [
        'npx', 'esbuild',
        *entry_points,
        '--bundle',
        '--format=esm',
        f'--outdir={TEMP_BUILD_DIR}'
    ]

    print(f"执行命令: {' '.join(command)}")
    try:
        subprocess.run(command, check=True, shell=os.name == 'nt')
        print("esbuild 打包成功。")
        return True
    except subprocess.CalledProcessError as e:
        print(f"esbuild 打包失败: {e}")
        return False
    except FileNotFoundError:
        print("错误: 'npx' 命令未找到。请确保 Node.js 和 npm 已安装并位于您的 PATH 中。")
        return False

# --- 阶段二：使用 Node.js 执行并导出为 JSON ---
def run_node_exporter():
    print("\n--- 阶段二：执行打包后的代码并导出为 JSON ---")
    if not os.path.exists(TEMP_JSON_DIR):
        os.makedirs(TEMP_JSON_DIR)

    exporter_script_content = """
    import fs from 'fs';
    import path from 'path';

    const buildDir = process.argv[2];
    const jsonDir = process.argv[3];
    const originalSrcDir = process.argv[4];

    if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
    }

    const files = fs.readdirSync(buildDir);

    for (const file of files) {
        if (file.endsWith('.js')) {
            const modulePath = path.resolve(buildDir, file);
            import(`file://${modulePath}`).then(module => {
                if (module.default) {
                    const jsonString = JSON.stringify(module.default, (key, value) => {
                        return typeof value === 'function' ? value.toString() : value;
                    }, 2);

                    // 构造原始路径对应的输出文件名
                    const originalRelativePath = path.relative(originalSrcDir, path.join(originalSrcDir, file));
                    const outputFilename = originalRelativePath.replace(/\\//g, '_').replace('.js', '.json');
                    const outputPath = path.join(jsonDir, outputFilename);

                    fs.writeFileSync(outputPath, jsonString);
                    console.log(`  -> 已导出 ${file} 到 ${outputPath}`);
                }
            }).catch(err => console.error(`加载模块 ${file} 失败:`, err));
        }
    }
    """

    script_path = 'exporter.js'
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(exporter_script_content)

    command = ['node', script_path, TEMP_BUILD_DIR, TEMP_JSON_DIR, JS_MODULES_DIR]
    print(f"执行命令: {' '.join(command)}")
    try:
        # 给 import() 一些时间来完成
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')
        stdout, stderr = process.communicate(timeout=30)
        print(stdout)
        if stderr:
            print("Node.js 脚本错误:\n", stderr)

        # 移除临时脚本
        os.remove(script_path)
        print("JSON 导出完成。")
        return True
    except subprocess.TimeoutExpired:
        print("Node.js 脚本超时。可能存在导入循环或长时间运行的代码。")
        os.remove(script_path)
        return False
    except Exception as e:
        print(f"执行 Node.js 导出器失败: {e}")
        os.remove(script_path)
        return False

# --- 阶段三：使用 Gemini API 处理 JSON 文件 ---
# (这部分代码与之前的 `stage2_process_with_gemini.py` 类似，但源是 .json 文件)

def translate(key, zh_map, context=None, default=None):
    # (此函数与之前的版本相同，但现在将 zh_map 作为参数传入)
    if context:
        data = zh_map
        try:
            for k in context: data = data[k]
            if isinstance(data, dict) and 'name' in data: return data['name']
            if isinstance(data, str): return data
        except (KeyError, TypeError): pass

    search_areas = ['gooboo', 'mult', 'upgrade', 'currency', 'relic', 'farm', 'horde', 'gallery', 'event', 'treasure', 'consumable', 'feature', 'subfeature']
    for area in search_areas:
        if area in zh_map and key in zh_map.get(area, {}):
            node = zh_map[area][key]
            if isinstance(node, dict) and 'name' in node: return node['name']
            if isinstance(node, str): return node
            break

    return default if default is not None else key.replace('_', ' ').replace('-', ' ').title()

def generate_gemini_prompt(module_name, json_data_str, zh_map):
    # 根据模块名称提取相关翻译以减小提示大小
    relevant_translations = {}
    context = module_name.split('_')
    if len(context) > 1 and context[1] in zh_map.get('feature', {}):
        relevant_translations['feature_name'] = zh_map['feature'][context[1]]

    prompt = f"""
    你是一个游戏维基数据分析师，任务是将 JSON 游戏数据转换为格式良好、翻译准确的中文 Markdown 表格。

    **任务:**
    将下面的 JSON 数据块转换为一个或多个中文 Markdown 表格。这个JSON是从JavaScript代码生成的，所以一些值可能是代表函数的字符串。

    **格式化规则:**
    1.  **翻译:** 使用提供的“翻译参考”将所有英文键名和一些特定值翻译成中文。模块标题应为“模块: `{module_name.replace('_', '/')}` (中文名)”。
    2.  **表格化:** 如果数据是对象的集合，请将其转换为一个表格。表格的第一列应该是条目的名称。
    3.  **LaTeX 公式:** 将所有形如 `(lvl) => ...` 或 `lvl => ...` 的函数字符串转换为 LaTeX 数学公式。
    4.  **`buildNum` 函数:** 将 `buildNum(10, "K")` 这样的字符串转换为科学记数法，例如 `$10 \times 10^3$`。
    5.  **效果列表:** 将 `effect` 数组格式化为一个 HTML `<ul><li>` 列表。
    6.  **图标:** 将 `icon` 的值用反引号 `` 包裹起来。
    7.  **简洁性:** 省略不重要的元数据，专注于核心数据。

    **翻译参考 (部分):**
    ```json
    {json.dumps(relevant_translations, ensure_ascii=False, indent=2)}
    ```

    **输入 JSON 数据块 (`{module_name}`):**
    ```json
    {json_data_str}
    ```

    请直接输出 Markdown 结果，不要包含任何解释性文字。
    """
    return prompt

def process_with_gemini():
    print("\n--- 阶段三：使用 Gemini API 将 JSON 转换为 Markdown ---")
    if not API_KEY or API_KEY == 'YOUR_API_KEY':
        print("错误：Gemini API 密钥未设置。请在脚本中编辑 API_KEY 变量。")
        return

    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(MODEL_NAME)

    if not os.path.exists(FINAL_OUTPUT_DIR):
        os.makedirs(FINAL_OUTPUT_DIR)

    zh_map_data = json.load(open(ZH_MAP_PATH, 'r', encoding='utf-8'))

    json_files = [f for f in os.listdir(TEMP_JSON_DIR) if f.endswith('.json')]

    for filename in json_files:
        module_name = filename.replace('.json', '')
        print(f"处理模块: {module_name}...")

        filepath = os.path.join(TEMP_JSON_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            json_data_str = f.read()

        prompt = generate_gemini_prompt(module_name, json_data_str, zh_map_data)

        try:
            response = model.generate_content(prompt)
            cleaned_response = response.text.replace('```markdown', '').replace('```', '').strip()

            output_path = os.path.join(FINAL_OUTPUT_DIR, filename.replace('.json', '.md'))
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_response)
            print(f"  -> 成功生成: {output_path}")

        except Exception as e:
            print(f"  - 调用 Gemini API 时出错: {e}")

        time.sleep(1.5)

# --- 主函数 ---
def main():
    if run_esbuild():
        if run_node_exporter():
            process_with_gemini()

    # 清理临时文件
    # print("\n清理临时文件...")
    # import shutil
    # if os.path.exists(TEMP_BUILD_DIR): shutil.rmtree(TEMP_BUILD_DIR)
    # if os.path.exists(TEMP_JSON_DIR): shutil.rmtree(TEMP_JSON_DIR)

    print("\n所有流程已完成！")

if __name__ == "__main__":
    main()