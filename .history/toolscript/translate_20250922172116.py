import os
import re
import json

# --- 1. 配置文件路径 ---
# MODIFIED: Changed from a single file to an input directory
JS_INPUT_DIR = 'js'                                     # <-- 修改这里：你的JS源文件根文件夹
ZH_MAP_PATH = 'public/zh_map.json'                      # <-- 修改这里：你的翻译文件路径
OUTPUT_DIR = 'data/md'                                  # <-- 修改这里：你希望Markdown文件保存的文件夹


def js_formula_to_latex(formula_str: str) -> str:
    """
    将JS箭头函数的函数体部分转换为LaTeX格式。
    该函数具有良好的扩展性，可方便地添加新的转换规则。
    """
    # 移除函数头 'lvl => '
    expression = formula_str.split('=>')[1].strip()

    rules = [
        (r"Math\.pow\(\s*1\s*/\s*([\d.]+)\s*,\s*(\w+)\)", r"\1^{{-\2}}"),
        (r"Math\.pow\(\s*(.*?)\s*,\s*(.*?)\s*\)", r"{\1}^{\2}"),
        (r"getSequence\(\s*(.*?)\s*,\s*(.*?)\s*\)", r"\\text{getSequence}(\1, \2)"),
        (r"\*", r" \\times "),
        (r"lvl", r"\\text{lvl}")
    ]

    latex_expr = expression
    for pattern, replacement in rules:
        latex_expr = re.sub(pattern, replacement, latex_expr)

    return latex_expr.strip()


def parse_js_and_generate_md(js_path, zh_map, output_path):
    """
    主函数：解析单个JS文件，翻译内容，并将结果生成为Markdown表格。
    现在接收 zh_map 作为参数以避免重复读取。
    """
    # --- 1. 读取JS文件内容 ---
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            js_content = f.read()
    except FileNotFoundError:
        print(f"错误：JS文件未找到: '{js_path}'")
        return

    # --- 2. 解析JS内容 ---
    js_object_str = re.search(r'export default\s*({[\s\S]*})', js_content)
    # ENHANCED: If a file doesn't match the structure, skip it gracefully.
    if not js_object_str:
        print(f"  -> 跳过: 在 '{js_path}' 中未找到 'export default' 对象。")
        return
    js_object_str = js_object_str.group(1)

    enhancement_pattern = re.compile(
        r"(\w+):\s*\{\s*effect:\s*\[([\s\S]*?)\]\s*\}",
        re.MULTILINE
    )
    effect_pattern = re.compile(
        r"\{\s*name:\s*'([^']*)',\s*type:\s*'([^']*)',\s*value:\s*([^}]*)\}",
        re.MULTILINE
    )

    parsed_data = []
    for match in enhancement_pattern.finditer(js_object_str):
        enhancement_name_en = match.group(1)
        effects_str = match.group(2)

        enhancement_name_zh = zh_map.get(enhancement_name_en, enhancement_name_en)

        for effect_match in effect_pattern.finditer(effects_str):
            effect_name_en = effect_match.group(1)
            effect_type = effect_match.group(2)
            effect_value_js = effect_match.group(3).strip().rstrip(',')

            effect_name_zh = zh_map.get(effect_name_en, effect_name_en)
            effect_value_latex = js_formula_to_latex(effect_value_js)

            parsed_data.append({
                "enhancement_name": enhancement_name_zh,
                "effect_name": effect_name_zh,
                "type": effect_type,
                "formula": effect_value_latex
            })

    # ENHANCED: If file is parsable but has no relevant data, don't create an empty MD file.
    if not parsed_data:
        print(f"  -> 跳过: 在 '{js_path}' 中未解析到有效数据。")
        return

    # --- 3. 生成Markdown文件 ---
    # 确保输出目录存在
    output_dir_for_file = os.path.dirname(output_path)
    os.makedirs(output_dir_for_file, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("| 强化名称 | 效果名称 | 效果类型 | 公式 (LaTeX) |\n")
        f.write("|:---|:---|:---|:---|\n")

        for item in parsed_data:
            row = f"| {item['enhancement_name']} | {item['effect_name']} | {item['type']} | `${item['formula']}$ |\n"
            f.write(row)

    print(f"  -> 成功: Markdown文件已生成于 '{output_path}'")


# --- NEW: Main execution block for batch processing ---
def main():
    """
    主执行函数，扫描JS目录并处理所有找到的JS文件。
    """
    # --- 1. 预加载翻译文件 ---
    try:
        with open(ZH_MAP_PATH, 'r', encoding='utf-8') as f:
            zh_map = json.load(f)
        print(f"翻译文件 '{ZH_MAP_PATH}' 加载成功。")
    except FileNotFoundError:
        print(f"警告：翻译文件未找到 at '{ZH_MAP_PATH}', 将使用英文原文。")
        zh_map = {}

    # --- 2. 遍历JS源文件目录 ---
    file_count = 0
    print(f"\n开始扫描目录: '{JS_INPUT_DIR}'...")
    for root, _, files in os.walk(JS_INPUT_DIR):
        for filename in files:
            if filename.endswith('.js'):
                file_count += 1
                input_js_path = os.path.join(root, filename)

                # --- 3. 计算并构建输出路径，以保持目录结构 ---
                # 获取相对路径 (e.g., 'modules/mining')
                relative_path = os.path.relpath(root, JS_INPUT_DIR)

                # 构建输出目录
                output_sub_dir = os.path.join(OUTPUT_DIR, relative_path)

                # 构建输出文件名 (e.g., 'enhancement.md')
                output_filename = os.path.splitext(filename)[0] + '.md'

                output_md_path = os.path.join(output_sub_dir, output_filename)

                print(f"\n[处理文件 {file_count}] {input_js_path}")

                # --- 4. 调用解析函数 ---
                parse_js_and_generate_md(input_js_path, zh_map, output_md_path)

    print(f"\n扫描完成。共找到并尝试处理 {file_count} 个JS文件。")


if __name__ == '__main__':
    main()