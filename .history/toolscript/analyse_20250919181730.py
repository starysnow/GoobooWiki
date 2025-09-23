import json
import re
import os

# --- 1. 配置和数据加载 ---
# 直接读取JS文件作为文本，并加载翻译JSON
JS_FILE_PATH = 'public/combined.js'
ZH_MAP_PATH = 'public/zh_map.json'
OUTPUT_DIR = 'data' # 输出到当前目录

def load_json_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误：找不到文件 {path}。")
        return None
    except json.JSONDecodeError as e:
        print(f"错误：解析JSON文件 {path} 时出错 - {e}。")
        return None

zh_map = load_json_file(ZH_MAP_PATH)
if zh_map is None:
    exit()

# --- 2. 翻译辅助函数 ---
def translate(key, context_keys=None, default=None):
    if not isinstance(key, str):
        return key
    if context_keys:
        data = zh_map
        try:
            for k in context_keys:
                data = data[k]
            if isinstance(data, dict) and 'name' in data:
                return data['name']
            if isinstance(data, str):
                return data
        except (KeyError, TypeError):
            pass
    search_areas = ['gooboo', 'mult', 'relic']
    for area in search_areas:
        if area in zh_map and key in zh_map[area]:
            node = zh_map[area][key]
            if isinstance(node, dict) and 'name' in node:
                return node['name']
            if isinstance(node, str):
                return node
            break
    return default if default is not None else key.replace('_', ' ').title()

# --- 3. 核心提取与解析函数 (已修复) ---
def extract_js_object_as_text(js_content, object_key):
    """
    使用手动括号匹配从JS文本中提取特定对象的内容，以避免递归错误。
    """
    # 找到 object_key 的起始位置
    key_pattern = f"{re.escape(object_key)}:"
    start_index = js_content.find(key_pattern)
    if start_index == -1:
        return None

    # 从 object_key 后面找到第一个 '{'
    try:
        open_brace_index = js_content.index('{', start_index + len(key_pattern))
    except ValueError:
        return None

    brace_level = 1
    # 从第一个 '{' 之后开始搜索
    for i in range(open_brace_index + 1, len(js_content)):
        char = js_content[i]
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1

        if brace_level == 0:
            # 找到了匹配的 '}'
            end_brace_index = i
            # 提取从第一个 '{' 到最后一个 '}' 的所有内容
            return js_content[open_brace_index : end_brace_index + 1]

    return None # 如果没有找到匹配的括号

def parse_pseudo_json(text_block):
    """
    将提取出的JS对象文本块转换为Python字典。
    """
    # 为所有键添加双引号
    text_block = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', text_block)
    # 将单引号转换为双引号
    text_block = text_block.replace("'", '"')
    # 修复尾随逗号
    text_block = re.sub(r',\s*([}\]])', r'\1', text_block)

    try:
        # 特殊处理 buildNum, 临时将其转换为字符串
        text_block = re.sub(r'buildNum\(([^)]+)\)', r'"buildNum(\1)"', text_block)
        return json.loads(text_block)
    except json.JSONDecodeError as e:
        print(f"解析提取的文本块时出错: {e}")
        print("--- 无法解析的文本块 ---")
        print(text_block)
        print("--------------------------")
        return None

def build_num_to_latex(num, suffix):
    power_map = {'K': 3, 'M': 6, 'B': 9, 'T': 12, 'Qa': 15, 'Qi': 18, 'Sx': 21, 'Sp': 24, 'O': 27, 'N': 30, 'D': 33, 'UD': 36, 'DD': 39, 'TD': 42, 'QaD': 45, 'QiD': 48, 'SxD': 51, 'SpD': 54, 'OD': 57, 'ND': 60, 'V': 63, 'UV': 66}
    if suffix in power_map:
        return f"{num.strip()} \\times 10^{{{power_map[suffix]}}}"
    return f"{num.strip()} \\text{{{suffix}}}"

# --- 4. 主执行函数 ---
def main():
    try:
        with open(JS_FILE_PATH, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误：输入文件 {JS_FILE_PATH} 未找到。")
        return

    achievement_module_text = extract_js_object_as_text(js_content, '"modules/achievement"')
    if not achievement_module_text:
        print("错误：在JS文件中找不到 'modules/achievement' 模块。")
        return

    relic_object_text = extract_js_object_as_text(achievement_module_text, 'relic')
    if not relic_object_text:
        print("错误：在 'modules/achievement' 模块中找不到 'relic' 对象。")
        return

    relic_data = parse_pseudo_json(relic_object_text)
    if not relic_data:
        return

    # --- 生成 Markdown 输出 ---
    md_output = []
    md_output.append("### 圣遗物 (Relics)\n")
    md_output.append("| 圣遗物名称 | 图标 | 颜色 | 适用功能 | 效果 |")
    md_output.append("| :--- | :--- | :--- | :--- | :--- |")

    for relic_name, relic_info in relic_data.items():
        name_zh = translate(relic_name, context_keys=['relic', relic_name])
        icon = f"`{relic_info['icon']}`"
        color = relic_info['color']
        features = ", ".join([translate(f, context_keys=['feature', f]) for f in relic_info['feature']])

        effects_output_lines = []
        for effect in relic_info['effect']:
             name_zh_effect = translate(effect['name'], context_keys=['mult', effect['name']])
             type_str = ""
             value_raw = effect['value']

             if isinstance(value_raw, str) and value_raw.startswith("buildNum"):
                 match = re.search(r'buildNum\(([^,]+),\s*"([^"]+)"\)', value_raw)
                 num, suffix = match.groups()
                 value_str = f"$ {build_num_to_latex(num, suffix)} $"
             else:
                 value_str = str(value_raw)

             if effect['type'] == 'mult':
                 type_str = "x"
             elif effect['type'] in ['base', 'bonus']:
                 try:
                     if float(value_raw) > 0: type_str = "+"
                 except: pass

             if '$' in value_str:
                 formatted_value = f"{type_str}{value_str}"
             else:
                 formatted_value = f"`{type_str}{value_str}`"

             effects_output_lines.append(f"<li>{name_zh_effect}: {formatted_value}</li>")

        effects = "".join(effects_output_lines)
        md_output.append(f"| {name_zh} | {icon} | {color} | {features} | {effects} |")

    final_output = "\n".join(md_output)

    print(final_output)

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    output_path = os.path.join(OUTPUT_DIR, 'achievement_relics.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_output)
    print(f"\n输出已成功保存到: {output_path}")

if __name__ == "__main__":
    main()