# process_enhancements.py
import re
import json

# --- 1. 翻译映射表 (可轻松扩展) ---
# 在实际应用中，这部分可以从 zh_map.json 文件加载
translation_map = {
    "barAluminium": "铝锭",
    "barBronze": "青铜锭",
    "barSteel": "钢锭",
    "barTitanium": "钛锭",
    "barShiny": "闪亮的金属锭",
    "barIridium": "铱锭",
    "barDarkIron": "黑铁锭",
    "miningPickaxeCraftingQuality": "制作纯度",
    "miningOreQuality": "矿石品质",
    "miningOreGain": "矿石增益",
    "miningRareEarthGain": "稀土增益",
    "miningDamage": "伤害",
    "miningToughness": "韧性",
    "currencyMiningScrapGain": "废料增益",
    "miningDepthDwellerSpeed": "深度居民速度",
    "currencyMiningCrystalGreenGain": "绿水晶增益",
    "currencyMiningEmberGain": "余烬增益",
    "currencyMiningScrapCap": "废料容量",
}

def translate(key):
    """根据映射表翻译键名，如果找不到则返回格式化的默认值。"""
    return translation_map.get(key, key.replace('_', ' ').title())

# --- 2. JS 到 LaTeX 公式转换器 ---
def js_formula_to_latex(formula_string):
    """将JS箭头函数体转换为LaTeX字符串。"""
    if not isinstance(formula_string, str):
        return str(formula_string)

    # 移除函数定义部分 "lvl =>"
    formula_body = re.sub(r'^\s*lvl\s*=>\s*', '', formula_string).strip()

    # 规则1: 转换 Math.pow(base, exp) -> {base}^{exp}
    formula_body = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', formula_body)

    # 规则2: 转换 getSequence(a, b) -> \sum_{i=1}^{b} (i+a-1)
    formula_body = re.sub(r'getSequence\(([^,]+),\s*([^)]+)\)', r'\\sum_{i=1}^{\2} (i+\1-1)', formula_body)

    # 规则3: 替换操作符
    formula_body = formula_body.replace('*', r' \cdot ')
    formula_body = formula_body.replace(' / ', r' / ') # 保持简单除法

    # 规则4: 清理括号和空格
    formula_body = formula_body.replace('(', '{').replace(')', '}')

    return f"$ {formula_body} $"

# --- 3. JS 预处理器 ---
def preprocess_js_to_json_string(js_content):
    """将JS对象字面量文本转换为严格的JSON格式字符串。"""
    # 移除 import 和 export default
    content = re.search(r'export default\s*(\{[\s\S]*\})', js_content)
    if not content:
        raise ValueError("无法在JS文件中找到 'export default' 对象")
    js_object_str = content.group(1)

    # 将箭头函数转换为带标记的字符串，以便后续处理
    # 例如： lvl => lvl * 0.5 + 1  ->  "__FUNC__lvl => lvl * 0.5 + 1"
    js_object_str = re.sub(r'(lvl\s*=>\s*[^,}]+)', r'"__FUNC__\1"', js_object_str)

    # 为所有未加引号的键添加双引号
    js_object_str = re.sub(r'([{\s,])([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_object_str)

    # 移除对象和数组中末尾的尾随逗号
    js_object_str = re.sub(r',\s*([}\]])', r'\1', js_object_str)

    return js_object_str

# --- 4. 主处理和输出函数 ---
def process_file(js_filepath):
    """完整处理流程：读取、解析、格式化并打印。"""
    try:
        with open(js_filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误: 文件 '{js_filepath}' 未找到。")
        return

    # 预处理并解析
    json_string = preprocess_js_to_json_string(js_content)
    data = json.loads(json_string)

    # 构建Markdown输出
    md_output = []
    md_output.append("### 增强 (Enhancements)\n")
    md_output.append("| 金属锭 | 效果 |")
    md_output.append("| :--- | :--- |")

    for bar_name, bar_data in data.items():
        name_zh = translate(bar_name)

        effects_list = []
        if 'effect' in bar_data:
            for effect in bar_data['effect']:
                effect_name_zh = translate(effect['name'])

                # 从标记的字符串中提取并转换公式
                formula_str = effect['value']
                if formula_str.startswith("__FUNC__"):
                    formula_str = formula_str.replace("__FUNC__", "")
                    latex_formula = js_formula_to_latex(formula_str)
                else:
                    latex_formula = f"`{formula_str}`" # 对于非函数的值

                effects_list.append(f"<li>{effect_name_zh}: {latex_formula}</li>")

        effects_html = "<ul>" + "".join(effects_list) + "</ul>"
        md_output.append(f"| {name_zh} | {effects_html} |")

    return "\n".join(md_output)

# --- 执行 ---
if __name__ == "__main__":
    JS_FILE = "js/modules/mining/enhancement.js" # 确保你的JS文件名是这个
    markdown_table = process_file(JS_FILE)

    if markdown_table:
        print(markdown_table)

        # 将结果保存到文件
        output_filename = "enhancement_data.md"
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(markdown_table)
        print(f"\n结果已保存到 '{output_filename}'")