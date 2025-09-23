import json
import re
import os
from collections import defaultdict

# --- 1. 配置和数据加载 ---
GAME_DATA_PATH = '../public/combined.json'
ZH_MAP_PATH = '../public/zh_map.json'
OUTPUT_DIR = '../data'

def load_json_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误：找不到文件 {path}。请确保文件路径正确。")
        return None
    except json.JSONDecodeError as e:
        print(f"错误：解析JSON文件 {path} 时出错 - {e}。请检查文件是否为有效的JSON格式。")
        return None

game_data = load_json_file(GAME_DATA_PATH)
zh_map = load_json_file(ZH_MAP_PATH)

if game_data is None or zh_map is None:
    exit()

# --- 2. 翻译与格式化辅助函数 ---
def translate(key, context_keys=None, default=None):
    """在 zh_map 中动态查找翻译，支持多级上下文"""
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

    # 简化的通用搜索
    search_areas = ['gooboo', 'mult', 'upgrade', 'currency', 'relic', 'farm', 'horde', 'gallery', 'event', 'treasure', 'consumable', 'feature', 'subfeature']
    for area in search_areas:
        if area in zh_map and key in zh_map[area]:
            node = zh_map[area][key]
            if isinstance(node, dict) and 'name' in node:
                return node['name']
            if isinstance(node, str):
                return node
            break # Found area, stop searching others

    # 如果找不到，返回一个格式化的默认值
    return default if default is not None else key.replace('_', ' ').replace('-', ' ').title()

def js_to_latex(js_code):
    """将JS公式字符串转换为LaTeX"""
    if not isinstance(js_code, str):
        return str(js_code)

    js_code = re.sub(r'\s*\((lvl|value)\)\s*=>\s*', '', js_code)
    js_code = js_code.strip()

    def replace_build_num(match):
        num = match.group(1).strip()
        suffix = match.group(2).strip()
        power_map = {'K': 3, 'M': 6, 'B': 9, 'T': 12, 'Qa': 15, 'Qi': 18, 'Sx': 21, 'Sp': 24, 'O': 27, 'N': 30, 'D': 33, 'UD': 36, 'DD': 39, 'TD': 42, 'QaD': 45, 'QiD': 48, 'SxD': 51, 'SpD': 54, 'OD': 57, 'ND': 60, 'V': 63, 'UV': 66}
        if suffix in power_map:
            return f"{num} \\times 10^{{{power_map[suffix]}}}"
        return f"{num} \\text{{{suffix}}}"
    js_code = re.sub(r'buildNum\(([^,]+),\s*["\']([^"\']+)["\']\)', replace_build_num, js_code)

    js_code = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', js_code)
    js_code = re.sub(r'getSequence\(([^,]+),\s*([^)]+)\)', r'\\sum_{i=1}^{\2} (i+\1-1)', js_code)
    js_code = re.sub(r'logBase\(([^,]+),\s*([^)]+)\)', r'\\log_{\1}(\2)', js_code)

    # 替换变量和JS特定语法
    js_code = js_code.replace('store.getters["mult/get"]', 'M_{')
    js_code = js_code.replace('"', '')
    js_code = js_code.replace('`', '')
    js_code = re.sub(r'\[([^\]]+)\]', r'}', js_code) # 结束M_{...}
    js_code = js_code.replace('*', r' \cdot ')
    js_code = js_code.replace(' ? ', r' \text{ if } ')
    js_code = js_code.replace(' : ', r' \text{ else } ')
    js_code = js_code.replace('>=', r'\ge')
    js_code = js_code.replace('<=', r'\le')

    return f"$ {js_code} $"

def format_value(value):
    if isinstance(value, str) and ("(lvl)" in value or "=>" in value):
        return js_to_latex(value)
    if isinstance(value, bool):
        return "是" if value else "否"
    if isinstance(value, (int, float)):
        return f"`{value}`"
    return str(value)

def format_effect_list(effects_list, context_prefix):
    """格式化效果列表为Markdown列表"""
    if not effects_list:
        return "无"

    output_lines = []
    for effect in effects_list:
        name_zh = translate(effect['name'], context_keys=['mult', effect['name']])
        type_str = ""
        value_str = format_value(effect['value'])

        if effect['type'] == 'mult':
            type_str = 'x'
        elif effect['type'] in ['base', 'bonus']:
            # 检查值是否是数字且大于0
            is_positive = False
            try:
                if isinstance(effect['value'], (int, float)) and effect['value'] > 0:
                    is_positive = True
            except: pass
            type_str = '+' if is_positive else ''

        output_lines.append(f"<li>{name_zh}: `{effect['type']}` {type_str}{value_str}</li>")

    return "<ul>" + "".join(output_lines) + "</ul>"

def format_price(price_data, context_prefix):
    """格式化价格对象或函数"""
    if isinstance(price_data, str): # It's a formula
        return js_to_latex(price_data)

    price_parts = []
    for currency, value in price_data.items():
        currency_zh = translate(currency.split('_')[-1], context_keys=['currency', currency])
        value_str = format_value(value)
        price_parts.append(f"{value_str} {currency_zh}")
    return ", ".join(price_parts)

# --- 3. 动态模块解析器 ---
def generate_table(items, context_prefix):
    """通用表格生成器"""
    if not items:
        return ""

    # 识别所有可能的列
    headers = set()
    for item in items.values():
        if isinstance(item, dict):
            headers.update(item.keys())

    # 预定义的列顺序和翻译
    predefined_headers = {
        'name': '名称', 'icon': '图标', 'color': '颜色', 'type': '类型', 'feature': '功能',
        'price': '价格', 'timeNeeded': '所需时间', 'effect': '效果', 'unlock': '解锁条件',
        'requirement': '需求', 'description': '描述'
    }

    # 组合并排序表头
    sorted_headers = list(predefined_headers.keys())
    sorted_headers.extend(sorted(list(headers - set(predefined_headers.keys()))))

    # 过滤掉不适合表格的复杂列
    valid_headers = [h for h in sorted_headers if all(isinstance(item.get(h), (str, int, float, bool, list, type(None))) for item in items.values())]

    # 生成Markdown表格
    header_row = "| " + " | ".join([translate(h, context_keys=['gooboo', h], default=h.title()) for h in valid_headers]) + " |"
    separator_row = "| " + " | ".join([":---" for _ in valid_headers]) + " |"

    rows = [header_row, separator_row]
    for key, item in items.items():
        row_data = []
        item_context = context_prefix + [key]
        for header in valid_headers:
            value = item.get(header)
            cell_content = ""
            if value is None:
                cell_content = ""
            elif header == 'name':
                cell_content = translate(key, context_keys=item_context + ['name'])
            elif header == 'price':
                cell_content = format_price(value, item_context)
            elif header == 'effect':
                cell_content = format_effect_list(value, item_context)
            elif header == 'icon':
                cell_content = f"`{value}`"
            elif header == 'feature' and isinstance(value, list):
                cell_content = ", ".join([translate(f, context_keys=['feature', f]) for f in value])
            elif isinstance(value, list):
                cell_content = ", ".join(map(str, value))
            else:
                cell_content = format_value(value)
            row_data.append(cell_content.replace('\n', '<br>'))
        rows.append("| " + " | ".join(row_data) + " |")

    return "\n".join(rows)

def analyze_and_render_module(module_name, module_data, context_prefix):
    """动态分析模块数据并渲染为Markdown"""
    output = []

    title_zh = translate(module_name.split('/')[-1], context_keys=['feature', module_name.split('/')[-1]])
    output.append(f"### **模块: `{module_name}` ({title_zh})**\n")

    if isinstance(module_data, dict):
        # 检查是否可以被渲染为表格
        is_table = True
        if not module_data: is_table = False

        first_item = next(iter(module_data.values()), None)
        if not isinstance(first_item, dict):
            is_table = False
        else:
            for item in module_data.values():
                if not isinstance(item, dict):
                    is_table = False
                    break

        if is_table:
            table_name = translate(context_prefix[-1] if context_prefix else module_name.split('/')[-1])
            output.append(f"#### **{table_name.title()}**\n")
            output.append(generate_table(module_data, context_prefix))
        else:
            # 渲染为属性列表
            for key, value in module_data.items():
                if isinstance(value, dict) and value:
                     # 递归处理嵌套对象
                     output.append(analyze_and_render_module(f"{module_name}/{key}", value, context_prefix + [key]))
                elif value is not None:
                     key_zh = translate(key, context_keys=['mult', key])
                     output.append(f"*   **{key_zh} ({key}):** {format_value(value)}")

    elif isinstance(module_data, list):
        output.append("此模块是一个列表，无法自动格式化。")

    return "\n".join(output)

# --- 4. 主执行函数 ---
def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    all_outputs = []
    for module_name, module_data in sorted(game_data.items()):
        context_prefix = module_name.split('/')
        if len(context_prefix) > 2: # use a more relevant context
            context_prefix = context_prefix[-2:]

        md_output = analyze_and_render_module(module_name, module_data, context_prefix)
        all_outputs.append(md_output)

        # 为每个模块创建单独的文件
        file_name = module_name.replace('/', '_') + '.md'
        file_path = os.path.join(OUTPUT_DIR, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(md_output)
        print(f"已生成文件: {file_path}")

    # 创建一个包含所有内容的汇总文件
    full_output_path = os.path.join(OUTPUT_DIR, 'ALL_MODULES.md')
    with open(full_output_path, 'w', encoding='utf-8') as f:
        f.write("\n\n---\n\n".join(all_outputs))
    print(f"\n已生成汇总文件: {full_output_path}")
    print("\n处理完成。")

if __name__ == "__main__":
    main()