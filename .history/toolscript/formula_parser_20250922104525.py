# source_data/mappings/formula_parser.py
import re

def parse_js_formula(code_str):
    """
    将JS函数字符串翻译成描述和LaTeX。
    返回一个字典: { "description": "...", "latex": "..." }
    """
    if not isinstance(code_str, str) or not code_str.startswith('FUNCTION_BODY::'):
        return { "description": code_str, "latex": code_str }

    body = code_str.split('::', 1)[1]

    # 尝试从函数体中提取核心表达式
    match = re.search(r'return\s+([^;]+);?\s*\}', body)
    if not match:
        return { "description": "复杂的函数逻辑", "latex": "\\text{Complex Function}" }

    expression = match.group(1).strip()

    # --- 在这里添加你的翻译规则 ---
    description = f"基于等级 (lvl) 的公式: {expression}"

    # 将JS表达式转换为LaTeX
    latex = expression
    latex = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', latex)
    latex = re.sub(r'Math\.max\(([^,]+),\s*([^)]+)\)', r'\\max(\1, \2)', latex)
    latex = re.sub(r'Math\.min\(([^,]+),\s*([^)]+)\)', r'\\min(\1, \2)', latex)
    latex = latex.replace('*', ' \\times ').replace('lvl', '\\text{lvl}')

    # 处理三元表达式: condition ? true_val : false_val
    ternary_match = re.search(r'(\S+)\s*>\s*(\S+)\s*\?\s*(\S+)\s*:\s*(\S+)', latex)
    if ternary_match:
        cond_var, cond_val, true_val, false_val = ternary_match.groups()
        latex = f"\\begin{{cases}} {true_val} & \\text{{if {cond_var} > {cond_val}}} \\\\ {false_val} & \\text{{otherwise}} \\end{{cases}}"

    return {
        "description": description,
        "latex": f"${latex}$"
    }