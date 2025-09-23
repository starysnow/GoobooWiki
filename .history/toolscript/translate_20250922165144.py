import re
import json
import os

# --- 1. 配置文件路径 ---
JS_FILE_PATH = 'js/modules/mining/enhancement.js'  # <-- 修改这里：你的JS文件路径
ZH_MAP_PATH = 'public/zh_map.json'                      # <-- 修改这里：你的翻译文件路径
OUTPUT_DIR = 'data/md'                            # <-- 修改这里：你希望Markdown文件保存的文件夹
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
    """将更复杂的JS对象字面量文本转换为严格的JSON格式字符串。"""
    # 移除 import, const, export default
    js_content = re.sub(r'^\s*import\s+.*\s+from\s+.*[;\n]', '', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^\s*const\s+.*\s*=\s*.*[;\n]', '', js_content, flags=re.MULTILINE)

    content_match = re.search(r'export default\s*(\{[\s\S]*\})', js_content)
    if not content_match:
        raise ValueError("无法在JS文件中找到 'export default' 对象")

    js_object_str = content_match.group(1)

    # 1. 将所有箭头函数转换为带标记的字符串
    js_object_str = re.sub(r'(\w+\s*=>\s*[^,}]+(?:\(.*\))?|\(\w+\)\s*=>\s*[^,}]+)', r'"__FUNC__\1"', js_object_str)

    # 2. 将扩展运算符 ...var 转换为带标记的字符串
    js_object_str = re.sub(r'\.\.\.([a-zA-Z0-9_]+)', r'"__SPREAD__\1"', js_object_str)

    # 3. 将变量作为值的情况 (如 card: cardList) 转换为字符串
    # 查找 `key: variableName` 模式，其中 variableName 不是一个数字、字符串、true/false/null
    js_object_str = re.sub(r':\s*([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*[,}\n])', r': "__VAR__\1"', js_object_str)

    # 4. 为所有未加引号的键添加双引号
    js_object_str = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_object_str)

    # 5. 将单引号转换为双引号 (安全地，不影响字符串内部的单引号)
    js_object_str = re.sub(r"'([^']*)'", r'"\1"', js_object_str)

    # 6. 移除尾随逗号
    js_object_str = re.sub(r',\s*([}\]])', r'\1', js_object_str)

    return js_object_str

# --- 5. 主处理和输出函数 (现在处理新的标记) ---
def process_file(js_filepath, translation_data):
    try:
        with open(js_filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误: 输入的JS文件 '{js_filepath}' 未找到。")
        return None

    try:
        json_string = preprocess_js_to_json_string(js_content)
        data = json.loads(json_string)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"预处理或JSON解析失败: {e}")
        # print("--- 预处理后的字符串 ---")
        # print(json_string) # 取消注释以进行调试
        # print("--------------------------")
        return None

    md_output = []
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

                value_str = effect['value']

                # 处理我们之前添加的标记
                if isinstance(value_str, str):
                    if value_str.startswith("__FUNC__"):
                        formula = value_str.replace("__FUNC__", "")
                        formatted_value = js_formula_to_latex(formula)
                    elif value_str.startswith("__SPREAD__"):
                        var_name = value_str.replace("__SPREAD__", "")
                        formatted_value = f"扩展自 `{var_name}`"
                    elif value_str.startswith("__VAR__"):
                        var_name = value_str.replace("__VAR__", "")
                        formatted_value = f"引用变量 `{var_name}`"
                    else:
                        formatted_value = f"`{value_str}`"
                else:
                    formatted_value = f"`{value_str}`"

                effects_list.append(f"<li>{effect_name_zh}: {formatted_value}</li>")

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

            if not os.path.exists(OUTPUT_DIR):
                os.makedirs(OUTPUT_DIR)

            output_filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
            with open(output_filepath, 'w', encoding='utf-8') as f:
                f.write(markdown_table)
            print(f"\n结果已成功保存到: '{output_filepath}'")