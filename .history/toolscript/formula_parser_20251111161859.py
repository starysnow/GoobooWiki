import re

def parse_js_formula(code_str):
    if not isinstance(code_str, str):
        return { "description": str(code_str), "latex": str(code_str) }

    body = code_str
    # 兼容 preprocess.js 生成的带前缀的格式
    if body.startswith('FUNCTION_BODY::'):
        body = body.split('::', 1)[1]

    # 尝试从函数体中提取核心表达式
    match = re.search(r'return\s+([^;]+);?\s*\}', body)
    if not match:
        return { "description": "复杂的函数逻辑", "latex": "\\text{Complex Function}" }

    expression = match.group(1).strip()

    description = f"公式: {expression}"

    latex = expression
    latex = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', latex)
    latex = re.sub(r'Math\.max\(([^,]+),\s*([^)]+)\)', r'\\max(\1, \2)', latex)
    latex = re.sub(r'Math\.min\(([^,]+),\s*([^)]+)\)', r'\\min(\1, \2)', latex)
    latex = latex.replace('*', ' \\times ').replace('lvl', '\\text{lvl}')
    # 可以在这里添加更多JS函数到LaTeX的转换规则...

    return { "description": description, "latex": f"${latex}$" }