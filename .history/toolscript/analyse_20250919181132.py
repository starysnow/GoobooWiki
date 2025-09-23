import json
import re
import os

# --- 1. 配置和数据加载 ---
# 直接读取JS文件作为文本，并加载翻译JSON
JS_FILE_PATH = 'public/combined.js'
ZH_MAP_PATH = 'zh_map.json'
OUTPUT_DIR = '.' # 输出到当前目录

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

    # 尝试使用完整的上下文路径
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

    # 通用搜索
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

# --- 3. 核心提取与解析函数 ---
def extract_js_object_as_text(js_content, object_key):
    """
    使用正则表达式从JS文本中提取特定对象的内容。
    例如，提取 `relic: { ... }` 中的 `{ ... }` 部分。
    """
    # 正则表达式寻找 `object_key: { ... }` 结构，并处理嵌套的花括号
    # 它会匹配从第一个 `{` 到与之对应的最后一个 `}` 之间的所有内容
    pattern = re.compile(rf"{re.escape(object_key)}:\s*\{{((?:[^{{}}]*|\{{(?1)\}})*)\}}", re.DOTALL)
    match = pattern.search(js_content)
    if match:
        return f"{{{match.group(1)}}}"
    return None

def parse_pseudo_json(text_block):
    """
    将提取出的JS对象文本块转换为Python字典。
    这比完整的JSON解析器更宽松。
    """
    # 1. 为所有键添加双引号
    text_block = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', text_block)
    # 2. 将单引号转换为双引号
    text_block = text_block.replace("'", '"')
    # 3. 尝试修复尾随逗号
    text_block = re.sub(r',\s*([}\]])', r'\1', text_block)

    try:
        return json.loads(text_block)
    except json.JSONDecodeError as e:
        print(f"解析提取的文本块时出错: {e}")
        print("--- 无法解析的文本块 ---")
        print(text_block)
        print("--------------------------")
        return None

def build_num_to_latex(num, suffix):
    """将buildNum的参数转换为LaTeX字符串"""
    power_map = {'K': 3, 'M': 6, 'B': 9, 'T': 12, 'Qa': 15, 'Qi': 18, 'Sx': 21, 'Sp': 24, 'O': 27, 'N': 30, 'D': 33, 'UD': 36, 'DD': 39, 'TD': 42, 'QaD': 45, 'QiD': 48, 'SxD': 51, 'SpD': 54, 'OD': 57, 'ND': 60, 'V': 63, 'UV': 66}
    if suffix in power_map:
        return f"{num} \\times 10^{{{power_map[suffix]}}}"
    return f"{num} \\text{{{suffix}}}"

def format_relic_effects(effects_list):
    """格式化圣遗物的效果列表为Markdown列表"""
    output = []
    for effect in effects_list:
        name_zh = translate(effect['name'], context_keys=['mult', effect['name']])
        type_str = ""

        # 处理 value 字段中的 buildNum 调用
        value = effect['value']
        if isinstance(value, str) and value.startswith('buildNum'):
            match = re.search(r'buildNum\(([^,]+),\s*"([^"]+)"\)', value)
            if match:
                num, suffix = match.groups()
                value = f"$ {build_num_to_latex(num, suffix)} $"

        if effect['type'] == 'mult':
            type_str = "x"
        elif effect['type'] in ['base', 'bonus']:
            try:
                if float(value) > 0:
                    type_str = "+"
            except (ValueError, TypeError):
                # 如果值不是数字（例如，是LaTeX字符串），则不加前缀
                type_str = ""

        # 如果值是字符串（可能是LaTeX），则不加反引号
        if isinstance(value, str) and value.startswith('$'):
            formatted_value = value
        else:
            formatted_value = f"`{type_str}{value}`"

        output.append(f"<li>{name_zh}: {formatted_value}</li>")

    return "<ul>" + "".join(output_lines) + "</ul>" if output else ""

# --- 4. 主执行函数 ---
def main():
    try:
        with open(JS_FILE_PATH, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误：输入文件 {JS_FILE_PATH} 未找到。")
        return

    # 找到 "modules/achievement" 的范围
    achievement_module_text = extract_js_object_as_text(js_content, '"modules/achievement"')
    if not achievement_module_text:
        print("错误：在JS文件中找不到 'modules/achievement' 模块。")
        return

    # 在这个模块的文本中找到 "relic" 对象
    relic_object_text = extract_js_object_as_text(achievement_module_text, 'relic')
    if not relic_object_text:
        print("错误：在 'modules/achievement' 模块中找不到 'relic' 对象。")
        return

    # 解析提取的 relic 对象文本
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

        # 重新格式化效果以处理buildNum
        effects_output_lines = []
        for effect in relic_info['effect']:
             name_zh_effect = translate(effect['name'], context_keys=['mult', effect['name']])
             type_str = ""
             value_raw = effect['value']

             # 特殊处理 buildNum
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
                 except: pass # 已经是LaTeX了

             if '$' in value_str:
                 formatted_value = f"{type_str}{value_str}"
             else:
                 formatted_value = f"`{type_str}{value_str}`"

             effects_output_lines.append(f"<li>{name_zh_effect}: {formatted_value}</li>")

        effects = "".join(effects_output_lines)
        md_output.append(f"| {name_zh} | {icon} | {color} | {features} | {effects} |")

    final_output = "\n".join(md_output)

    # 打印到控制台
    print(final_output)

    # 保存到文件
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    output_path = os.path.join(OUTPUT_DIR, 'achievement_relics.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_output)
    print(f"\n输出已成功保存到: {output_path}")

if __name__ == "__main__":
    main()