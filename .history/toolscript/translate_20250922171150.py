import os
import re
import json

# --- 1. 配置文件路径 ---
# 请确保以下路径相对于您运行脚本的位置是正确的。
JS_FILE_PATH = 'js/modules/mining/enhancement.js'  # <-- 修改这里：你的JS文件路径
ZH_MAP_PATH = 'public/zh_map.json'                      # <-- 修改这里：你的翻译文件路径
OUTPUT_DIR = 'data/md'                                  # <-- 修改这里：你希望Markdown文件保存的文件夹
OUTPUT_FILENAME = 'mining_enhancements.md'              # <-- 修改这里：输出的Markdown文件名


def js_formula_to_latex(formula_str: str) -> str:
    """
    将JS箭头函数的函数体部分转换为LaTeX格式。
    该函数具有良好的扩展性，可方便地添加新的转换规则。
    """
    # 移除函数头 'lvl => '
    expression = formula_str.split('=>')[1].strip()

    # 定义转换规则 (正则表达式, 替换模板)
    # 规则顺序很重要，先处理复杂结构，再处理简单符号
    rules = [
        # 规则1: 处理 Math.pow(1 / x, lvl) -> x^{-lvl}
        (r"Math\.pow\(\s*1\s*/\s*([\d.]+)\s*,\s*(\w+)\)", r"\1^{{-\2}}"),
        # 规则2: 处理 Math.pow(base, exp) -> base^{exp}
        (r"Math\.pow\(\s*(.*?)\s*,\s*(.*?)\s*\)", r"{\1}^{\2}"),
        # 规则3: 处理 getSequence(a, b) -> \text{getSequence}(a, b)
        (r"getSequence\(\s*(.*?)\s*,\s*(.*?)\s*\)", r"\\text{getSequence}(\1, \2)"),
        # 规则4: 将乘法符号 * 替换为 \times
        (r"\*", r" \\times "),
        # 规则5: 将变量 lvl 格式化为正体
        (r"lvl", r"\\text{lvl}")
    ]

    # 应用所有规则
    latex_expr = expression
    for pattern, replacement in rules:
        latex_expr = re.sub(pattern, replacement, latex_expr)

    return latex_expr.strip()


def parse_js_and_generate_md(js_path, zh_map_path, output_path):
    """
    主函数：解析JS文件，翻译内容，并将结果生成为Markdown表格。
    """
    # --- 1. 读取文件内容 ---
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误：JS文件未找到，请检查路径配置: '{js_path}'")
        return

    try:
        with open(zh_map_path, 'r', encoding='utf-8') as f:
            zh_map = json.load(f)
    except FileNotFoundError:
        print(f"警告：翻译文件未找到 at '{zh_map_path}', 将使用英文原文。")
        zh_map = {}

    # --- 2. 解析JS内容 ---
    # 移除JS模块化语法部分，只保留核心对象
    js_object_str = re.search(r'export default\s*({[\s\S]*})', js_content)
    if not js_object_str:
        print("错误：在JS文件中未找到 'export default' 对象。")
        return
    js_object_str = js_object_str.group(1)

    # 定义用于解析顶级条目和内部效果的正则表达式
    enhancement_pattern = re.compile(
        r"(\w+):\s*\{\s*effect:\s*\[([\s\S]*?)\]\s*\}",
        re.MULTILINE
    )
    effect_pattern = re.compile(
        r"\{\s*name:\s*'([^']*)',\s*type:\s*'([^']*)',\s*value:\s*([^}]*)\}",
        re.MULTILINE
    )

    parsed_data = []
    # 遍历所有顶级条目 (e.g., barAluminium, barBronze)
    for match in enhancement_pattern.finditer(js_object_str):
        enhancement_name_en = match.group(1)
        effects_str = match.group(2)

        # 翻译顶级条目名称
        enhancement_name_zh = zh_map.get(enhancement_name_en, enhancement_name_en)

        # 遍历该条目下的所有效果
        for effect_match in effect_pattern.finditer(effects_str):
            effect_name_en = effect_match.group(1)
            effect_type = effect_match.group(2)
            effect_value_js = effect_match.group(3).strip().rstrip(',')

            # 翻译效果名称
            effect_name_zh = zh_map.get(effect_name_en, effect_name_en)
            # 将JS公式转换为LaTeX
            effect_value_latex = js_formula_to_latex(effect_value_js)

            parsed_data.append({
                "enhancement_name": enhancement_name_zh,
                "effect_name": effect_name_zh,
                "type": effect_type,
                "formula": effect_value_latex
            })

    # --- 3. 生成Markdown文件 ---
    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        # 写入表头
        f.write("| 强化名称 | 效果名称 | 效果类型 | 公式 (LaTeX) |\n")
        f.write("|:---|:---|:---|:---|\n")

        # 写入数据行
        for item in parsed_data:
            # 使用 $...$ 包裹LaTeX公式
            row = f"| {item['enhancement_name']} | {item['effect_name']} | {item['type']} | `${item['formula']}$ |\n"
            f.write(row)

    print(f"Markdown文件已成功生成: {output_path}")


if __name__ == '__main__':
    # 拼接完整的输出路径
    full_output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)

    # 执行主程序
    parse_js_and_generate_md(JS_FILE_PATH, ZH_MAP_PATH, full_output_path)