import json
import re

# --- 1. 数据加载 ---
try:
    with open('combined.json', 'r', encoding='utf-8') as f:
        game_data = json.load(f)
    with open('../zh_map.json', 'r', encoding='utf-8') as f:
        zh_map = json.load(f)
except FileNotFoundError as e:
    print(f"错误：找不到文件 {e.filename}。请确保 combined.json 和 zh_map.json 存在于同一目录下。")
    exit()
except json.JSONDecodeError as e:
    print(f"错误：解析JSON文件时出错 - {e}。请检查 'combined.json' 是否已正确转换为有效的JSON格式。")
    exit()

# --- 2. 翻译辅助函数 ---
def translate(key, context=None, default=None):
    """
    在 zh_map 中查找翻译。
    context 是一个列表，指定了在 zh_map 中的查找路径，例如 ['currency', 'mining_scrap', 'name']
    """
    if context:
        data = zh_map
        try:
            for k in context:
                data = data[k]
            return data
        except (KeyError, TypeError):
            pass # Fallback to general search

    # General search across relevant sections
    search_areas = ['gooboo', 'mult', 'upgrade', 'consumable', 'feature', 'subfeature', 'relic', 'currency', 'farm', 'horde', 'gallery', 'event', 'treasure']
    for area in search_areas:
        if area in zh_map and key in zh_map[area]:
            # Handle nested objects like currency names
            if isinstance(zh_map[area][key], dict) and 'name' in zh_map[area][key]:
                return zh_map[area][key]['name']
            if isinstance(zh_map[area][key], str):
                return zh_map[area][key]

    return default if default is not None else key.replace('_', ' ').title()

# --- 3. LaTeX 公式转换器 ---
def js_to_latex(js_code):
    """将JS公式字符串转换为LaTeX"""
    if not isinstance(js_code, str):
        return str(js_code)

    # 移除函数定义部分
    js_code = re.sub(r'\s*\(lvl\)\s*=>\s*', '', js_code)
    js_code = js_code.strip()

    # 替换 buildNum
    def replace_build_num(match):
        num = match.group(1)
        suffix = match.group(2)
        power_map = {'K': 3, 'M': 6, 'B': 9, 'T': 12, 'Qa': 15, 'Qi': 18, 'Sx': 21, 'Sp': 24, 'O': 27, 'N': 30, 'D': 33, 'UD': 36, 'DD': 39, 'TD': 42, 'QaD': 45, 'QiD': 48, 'SxD': 51, 'SpD': 54, 'OD': 57, 'ND': 60, 'V': 63, 'UV': 66}
        if suffix in power_map:
            return f"{num} \\times 10^{{{power_map[suffix]}}}"
        return f"{num} \\text{{{suffix}}}"
    js_code = re.sub(r'buildNum\(([^,]+),\s*"([^"]+)"\)', replace_build_num, js_code)

    # 替换 Math.pow
    js_code = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', js_code)

    # 替换 getSequence
    js_code = re.sub(r'getSequence\(([^,]+),\s*([^)]+)\)', r'\\sum_{i=1}^{\2} (i+\1-1)', js_code)

    # 替换乘法
    js_code = js_code.replace('*', r' \cdot ')

    # 清理
    js_code = js_code.replace('store.getters["mult/get"]', '')
    js_code = js_code.replace('"', '')

    return f"$ {js_code} $"


def format_effect_list(effects_list, is_relic=False):
    """格式化效果列表为Markdown列表"""
    if not effects_list:
        return ""

    output = []
    for effect in effects_list:
        name = translate(effect['name'], context=['mult', effect['name']], default=effect['name'])
        type_str = ""
        if effect['type'] == 'mult':
            type_str = "x"
        elif effect['type'] in ['base', 'bonus']:
            type_str = "+" if float(effect['value']) > 0 else ""

        value = effect['value']
        if isinstance(value, (int, float)):
            if 'cap' in effect['name'].lower() and not is_relic:
                 formatted_value = f"`{type_str}{value}`"
            else:
                formatted_value = f"`{type_str}{value}`"
        elif "lvl" in value:
             formatted_value = js_to_latex(value)
        else:
             formatted_value = f"`{value}`"

        output.append(f"<li>{name}: {formatted_value}</li>")
    return "".join(output)

# --- 4. 模块处理函数 ---

def process_achievement(module_data):
    print("### **模块: `modules/achievement` (成就)**")

    # 处理圣遗物
    if 'relic' in module_data:
        print("\n#### **圣遗物 (Relics)**\n")
        print("| 圣遗物名称 | 图标 | 颜色 | 适用功能 | 效果 |")
        print("| :--- | :--- | :--- | :--- | :--- |")
        for relic_name, relic_info in module_data['relic'].items():
            name_zh = translate(relic_name, context=['relic', relic_name])
            icon = f"`{relic_info['icon']}`"
            color = relic_info['color']
            features = ", ".join([translate(f, context=['feature', f]) for f in relic_info['feature']])
            effects = format_effect_list(relic_info['effect'], is_relic=True)
            print(f"| {name_zh} | {icon} | {color} | {features} | {effects} |")
    print("\n---\n")

def process_card(module_data):
    print("### **模块: `modules/card` (卡片)**")

    if 'mult' in module_data:
        print("\n#### **功能效果**")
        for key, val in module_data['mult'].items():
            name_zh = translate(key, context=['mult', key])
            value = val.get('baseValue', 0)
            display = val.get('display', '')
            formatted_val = f"`+{value * 100}%`" if display == 'percent' else f"`{value}`"
            print(f"*   **{name_zh} ({key}):** 基础值 {formatted_val}")

    if 'currency' in module_data:
        print("\n#### **货币 (Currency)**")
        print("| 货币 | 颜色 | 图标 |")
        print("| :--- | :--- | :--- |")
        for currency_name, currency_info in module_data['currency'].items():
            name_zh = translate(currency_name, context=['currency', f"card_{currency_name}", 'name'])
            color = currency_info['color']
            icon = f"`{currency_info['icon']}`"
            print(f"| {name_zh} | {color} | {icon} |")
    print("\n---\n")

def process_event_bank_project(module_data):
    print("### **模块: `modules/event/bank/project` (事件/银行/项目)**\n")
    print("| 项目名称 | 价格公式 (LaTeX) | 效果 |")
    print("| :--- | :--- | :--- |")
    for name, data in module_data.items():
        name_zh = translate(name, context=['upgrade', f"event_{name}", 'name'])
        price_formula = js_to_latex(data['price'])
        effects_output = "<ul>"
        for effect in data['effect']:
            effect_name = translate(effect['name'], context=['mult', effect['name']])
            effect_value = js_to_latex(effect['value'])
            effects_output += f"<li>{effect_name}: `{effect['type']}` {effect_value}</li>"
        effects_output += "</ul>"
        print(f"| {name_zh} | {price_formula} | {effects_output} |")
    print("\n---\n")

def process_farm_crop(module_data):
    print("### **模块: `modules/farm/crop` (农场/作物)**\n")
    print("| 作物 | 类型 | 生长时间(秒) | 产量 | 稀有掉落 |")
    print("| :--- | :--- | :--- | :--- | :--- |")
    for name, data in module_data.items():
        name_zh = translate(name, context=['farm', 'crop', name, 'name'])
        crop_type = translate(data['type'], context=['farm', 'cropType', data['type']])
        grow_time = data['grow'] * 60  #
        yld = data['yield']

        rare_drop_str = "无"
        if 'rareDrop' in data:
            drops = []
            for drop in data['rareDrop']:
                drop_name_zh = translate(drop['name'], context=['consumable' if drop['type'] == 'consumable' else 'currency', drop['name'], 'name'])
                chance = abs(drop['chance']) * 100
                drops.append(f"`{chance}%` 几率掉落 `{drop['value']}` 个{drop_name_zh}")
            rare_drop_str = "<br>".join(drops)

        print(f"| {name_zh} | {crop_type} | {grow_time} | {yld} | {rare_drop_str} |")
    print("\n---\n")

# --- 5. 主处理循环 ---
if __name__ == "__main__":
    # 示例模块处理
    if "modules/achievement" in game_data:
        process_achievement(game_data["modules/achievement"])

    if "modules/card" in game_data:
        process_card(game_data["modules/card"])

    if "modules/event/bank/project" in game_data:
        process_event_bank_project(game_data["modules/event/bank/project"])

    if "modules/farm/crop" in game_data:
        process_farm_crop(game_data["modules/farm/crop"])

    # 您可以在这里添加更多模块的处理函数调用
    # 例如:
    # if "modules/gallery/idea" in game_data:
    #     process_gallery_idea(game_data["modules/gallery/idea"])
    # ...等等

    print("\n处理完成。您可以将此输出复制到您的Wiki页面中。")
    print("注意: 这只是部分模块的示例。要处理所有模块，需要为每个模块的独特数据结构编写专门的处理函数。")