# process_enhancements.py
import re
import json
import os

# --- 1. 配置文件路径 ---

JS_FILE_PATH = 'js/modules/mining/enhancement.js'  # <-- 修改这里：你的JS文件路径
ZH_MAP_PATH = 'zh_map.json'                      # <-- 修改这里：你的翻译文件路径
OUTPUT_DIR = 'output'                            # <-- 修改这里：你希望Markdown文件保存的文件夹
OUTPUT_FILENAME = 'mining_enhancements.md'       # <-- 修改这里：输出的Markdown文件名

# --- 2. 翻译映射表 (现在从文件加载) ---
def load_translation_map(filepath):
    """从 zh_map.json 加载完整的翻译数据。"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误: 翻译文件 '{filepath}' 未找到。")
        return None
    except json.JSONDecodeError as e:
        print(f"错误: 解析翻译文件 '{filepath}' 时出错: {e}")
        return None

def translate(key, translation_data):
    """根据加载的翻译数据翻译键名。"""
    if not translation_data:
        return key.replace('_', ' ').title()

    # 在通用区域查找
    search_areas = ['gooboo', 'mult', 'relic']
    for area in search_areas:
        if area in translation_data and key in translation_data[area]:
            node = translation_data[area][key]
            if isinstance(node, dict) and 'name' in node:
                return node['name']
            if isinstance(node, str):
                return node

    # 如果找不到，返回格式化的默认值
    return key.replace('_', ' ').title()

# --- 3. JS 到 LaTeX 公式转换器 (无变化) ---
def js_formula_to_latex(formula_string):
    if not isinstance(formula_string, str):
        return str(formula_string)
    formula_body = re.sub(r'^\s*lvl\s*=>\s*', '', formula_string).strip()
    formula_body = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', formula_body)
    formula_body = re.sub(r'getSequence\(([^,]+),\s*([^)]+)\)', r'\\sum_{i=1}^{\2} (i+\1-1)', formula_body)
    formula_body = formula_body.replace('*', r' \cdot ')
    formula_body = formula_body.replace('(', '{').replace(')', '}')
    return f"$ {formula_body} $"

# --- 4. JS 预处理器 (无变化) ---
def preprocess_js_to_json_string(js_content):
    content = re.search(r'export default\s*(\{[\s\S]*\})', js_content)
    if not content:
        raise ValueError("无法在JS文件中找到 'export default' 对象")
    js_object_str = content.group(1)
    js_object_str = re.sub(r'(lvl\s*=>\s*[^,}]+)', r'"__FUNC__\1"', js_object_str)
    js_object_str = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_object_str)
    js_object_str = re.sub(r',\s*([}\]])', r'\1', js_object_str)
    return js_object_str

# --- 5. 主处理和输出函数 ---
def process_file(js_filepath, translation_data):
    """完整处理流程：读取、解析、格式化并返回Markdown字符串。"""
    try:
        with open(js_filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误: 输入的JS文件 '{js_filepath}' 未找到。")
        return None

    json_string = preprocess_js_to_json_string(js_content)
    data = json.loads(json_string)

    md_output = []
    # 从文件名动态生成标题
    module_name = os.path.splitext(os.path.basename(js_filepath))[0].title()
    md_output.append(f"### {module_name}\n")
    md_output.append("| 金属锭 | 效果 |")
    md_output.append("| :--- | :--- |")

    for bar_name, bar_data in data.items():
        name_zh = translate(bar_name, translation_data)

        effects_list = []
        if 'effect' in bar_data:
            for effect in bar_data['effect']:
                effect_name_zh = translate(effect['name'], translation_data)

                formula_str = effect['value']
                if formula_str.startswith("__FUNC__"):
                    formula_str = formula_str.replace("__FUNC__", "")
                    latex_formula = js_formula_to_latex(formula_str)
                else:
                    latex_formula = f"`{formula_str}`"

                effects_list.append(f"<li>{effect_name_zh}: {latex_formula}</li>")

        effects_html = "<ul>" + "".join(effects_list) + "</ul>"
        md_output.append(f"| {name_zh} | {effects_html} |")

    return "\n".join(md_output)

# --- 执行 ---
if __name__ == "__main__":
    # 加载翻译数据
    translation_data = load_translation_map(ZH_MAP_PATH)

    if translation_data:
        # 处理JS文件
        markdown_table = process_file(JS_FILE_PATH, translation_data)

        if markdown_table:
            print("--- 生成的 Markdown 内容 ---")
            print(markdown_table)

            # 确保输出目录存在
            if not os.path.exists(OUTPUT_DIR):
                os.makedirs(OUTPUT_DIR)

            # 将结果保存到文件
            output_filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
            with open(output_filepath, 'w', encoding='utf-8') as f:
                f.write(markdown_table)
            print(f"\n结果已成功保存到: '{output_filepath}'")