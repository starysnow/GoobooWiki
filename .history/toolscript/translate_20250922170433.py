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
    """
    一个更健壮的预处理器，逐行分析并转换JS对象为JSON字符串。
    """
    # 移除文件头部的非对象部分
    js_content = re.sub(r'^\s*import\s+.*\s*from\s+.*[;\n]', '', js_content, flags=re.MULTILINE)
    js_content = re.sub(r'^\s*const\s+.*\s*=\s*\{[\s\S]*?\}[;\n]', '', js_content, flags=re.MULTILINE)

    content_match = re.search(r'export default\s*(\{[\s\S]*\})', js_content)
    if not content_match:
        raise ValueError("无法在JS文件中找到 'export default' 对象")

    js_object_str = content_match.group(1)

    # 为了安全，先将所有字符串内容替换为占位符
    string_literals = []
    def string_replacer(match):
        string_literals.append(match.group(0))
        return f'"__STRING_LITERAL_{len(string_literals)-1}__"'

    # 匹配双引号、单引号和模板字符串
    js_object_str = re.sub(r'(".*?"|\'.*?\'|`.*?`)', string_replacer, js_object_str)

    # --- 核心转换逻辑 ---

    # 1. 转换键
    # 匹配不带引号的键并添加双引号
    js_object_str = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_object_str)

    # 2. 转换值
    # 查找所有 `key: value` 结构，并检查 value 是否需要被包裹
    lines = js_object_str.split('\n')
    processed_lines = []
    for line in lines:
        match = re.match(r'(\s*".*?"\s*:\s*)(.*)', line)
        if match:
            key_part = match.group(1)
            value_part = match.group(2).strip().rstrip(',')

            # 如果值是JS代码（不是JSON原始类型或占位符），则将其包裹为字符串
            if value_part and not (value_part.startswith('"') or value_part in ['true', 'false', 'null'] or value_part.isdigit() or value_part.startswith('{') or value_part.startswith('[')):
                line = f'{key_part}"{value_part}",'
        processed_lines.append(line)

    js_object_str = '\n'.join(processed_lines)

    # 3. 移除尾随逗号
    js_object_str = re.sub(r',\s*([}\]])', r'\1', js_object_str)

    # 4. 恢复之前保存的字符串字面量
    for i, literal in enumerate(string_literals):
        # 将原始字符串的外部引号统一为双引号
        clean_literal = literal[1:-1].replace('"', '\\"')
        js_object_str = js_object_str.replace(f'"__STRING_LITERAL_{i}__"', f'"{clean_literal}"')

    return js_object_str

# --- 5. 主处理函数 (需要适应新的预处理器输出) ---
def process_file(js_filepath, translation_data):
    try:
        with open(js_filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误: 输入的JS文件 '{js_filepath}' 未找到。")
        return None

    try:
        # 预处理并解析
        json_string = preprocess_js_to_json_string(js_content)
        # 替换扩展运算符为标记，因为json.loads无法处理
        json_string_no_spread = re.sub(r'\.\.\.([a-zA-Z0-9_]+)', r'"__SPREAD__\1": true', json_string)
        data = json.loads(json_string_no_spread)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"预处理或JSON解析失败: {e}")
        # print("--- 预处理后的字符串 ---")
        # print(json_string_no_spread) # 用于调试
        # print("--------------------------")
        return None

    # --- 这里开始根据文件内容动态生成Markdown ---
    # 这个部分需要根据模块的结构来决定输出格式（表格、列表等）
    # 为了演示，我将为 `event/card.js` 创建一个定制的输出

    md_output = []
    module_name = "modules/event/card"
    name_zh = "事件/卡片"
    md_output.append(f"### **模块: `{module_name}` ({name_zh})**\n")

    # 处理 feature
    if 'feature' in data:
        md_output.append("#### **功能效果**\n")
        feature = data['feature']
        for key, value in feature.items():
            key_zh = translate(key, translation_data)
            if isinstance(value, list) and key in ['reward', 'shinyReward', 'powerReward']:
                md_output.append(f"*   **{key_zh}:**")
                effects_html = format_effect_list(value, 'feature')
                md_output.append(effects_html)
            else:
                 md_output.append(f"*   **{key_zh}:** `{value}`")

    # 处理 collection
    if 'collection' in data:
        md_output.append("\n#### **收藏集 (Collections)**\n")
        md_output.append("| 收藏集 | 奖励 |")
        md_output.append("| :--- | :--- |")
        for name, info in data['collection'].items():
            name_zh = translate(name, translation_data)
            reward_html = format_effect_list(info.get('reward', []), 'collection')
            md_output.append(f"| {name_zh} | {reward_html} |")

    # 处理 pack
    if 'pack' in data:
        md_output.append("\n#### **卡包 (Packs)**\n")
        md_output.append("| 卡包 | 解锁条件 | 数量 | 内容 (部分) |")
        md_output.append("| :--- | :--- | :--- | :--- |")
        for name, info in data['pack'].items():
            name_zh = translate(name, translation_data)
            unlock = translate(info.get('unlock', ''), translation_data)
            amount = info.get('amount', 'N/A')
            content_parts = []
            if 'content' in info:
                for key, value in info['content'].items():
                    if "__SPREAD__" in key:
                        content_parts.append(f"`...{key.split('__')[1]}`")
                    else:
                        content_parts.append(f"`{key}`: {value}")
            content_str = "<br>".join(content_parts[:3]) + ("<br>..." if len(content_parts) > 3 else "")
            md_output.append(f"| {name_zh} | {unlock} | `{amount}` | {content_str} |")

    return "\n".join(md_output)


# --- 执行 ---
if __name__ == "__main__":
    translation_data = load_translation_map(ZH_MAP_PATH)
    if translation_data:
        markdown_output = process_file(JS_FILE_PATH, translation_data)
        if markdown_output:
            print(markdown_output)
            if not os.path.exists(OUTPUT_DIR):
                os.makedirs(OUTPUT_DIR)
            output_filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
            with open(output_filepath, 'w', encoding='utf-8') as f:
                f.write(markdown_output)
            print(f"\n结果已成功保存到: '{output_filepath}'")