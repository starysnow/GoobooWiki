import json
import os
import re

#                      数据整合、翻译与格式化脚本

# 1. --- 配置区 ---
# 输入文件
AI_OUTPUT_FILE = "publict/output.json"
LANG_ZH_FILE = "publict/zh.json" # 假设你已将zh.js的item部分转为JSON

# 输出文件
MARKDOWN_OUTPUT_FILE = "publict/snowdown_items.md"

# 预定义的翻译字典 (关键！)
ATTRIBUTE_TRANSLATION = {
    "currencyEventSaplingGain": "树苗产出",
    "currencyEventYarnGain": "纱线产出",
    "currencyEventDoughGain": "面团产出",
    # 在这里添加更多 "英文属性名": "中文名" 的映射
}

# --- 2. 核心逻辑 ---

def parse_js_formula_to_latex(code_str):
    """
    一个简化的、基于正则表达式的JS公式到LaTeX的翻译器。
    示例: "lvl => Math.pow(2, lvl) * Math.pow(lvl + 1, 2) * 0.01"
    """
    if not isinstance(code_str, str) or "=>" not in code_str:
        return code_str # 如果不是公式字符串，直接返回

    # 移除函数头 'lvl =>'
    formula_body = code_str.split('=>', 1)[-1].strip()

    # 替换 Math.pow(a, b)为 a^{b}
    formula_body = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', formula_body)

    # 替换 * 为 \times
    formula_body = formula_body.replace('*', ' \\times ')

    # 将变量名 lvl 格式化
    formula_body = formula_body.replace('lvl', '\\text{lvl}')

    return f"${formula_body}$" # 用 $ 包裹，使其成为LaTeX公式


def integrate_and_generate_table():
    """
    主函数：读取数据，整合，并生成Markdown表格。
    """
    print("[*] 开始整合数据并生成表格...")

    # a) 加载数据文件
    try:
        with open(AI_OUTPUT_FILE, 'r', encoding='utf-8') as f:
            ai_data = json.load(f)
        with open(LANG_ZH_FILE, 'r', encoding='utf-8') as f:
            lang_data = json.load(f)
    except FileNotFoundError as e:
        print(f"[!] 错误：找不到输入文件 - {e}")
        return
    except json.JSONDecodeError as e:
        print(f"[!] 错误：JSON文件格式不正确 - {e}")
        return

    # 提取我们需要的数据部分
    # 我们假设核心数据在 output.json 的 "js/modules/event/snowdown/item.js" 键下
    core_items = ai_data.get("js/modules/event/snowdown/item.js", {})
    # 语言数据通常嵌套在 'item' 键下
    lang_items = lang_data.get("item", {})

    if not core_items or not lang_items:
        print("[!] 核心数据或语言数据为空，无法生成表格。")
        return

    # b) 准备Markdown表格的表头
    table_header = "| ID | 中文名称 | 类型 | 效果属性 | 效果类型 | 基础值 (公式) | 描述 |\n"
    table_align = "|:---|:---|:---|:---|:---|:---|:---|\n"
    table_rows = []

    # c) 遍历核心数据，进行整合
    for item_id, item_data in core_items.items():
        # 从语言文件中查找对应的中文名称和描述
        lang_info = lang_items.get(item_id, {})
        chinese_name = lang_info.get("name", "N/A")
        description = lang_info.get("description", "")

        item_type = item_data.get("type", "")

        # 处理可能包含多个效果的情况
        effects = item_data.get("effect", [])
        if not effects:
            # 如果没有effect，也生成一行
            row = f"| `{item_id}` | **{chinese_name}** | {item_type} | - | - | - | {description} |"
            table_rows.append(row)
        else:
            for i, effect in enumerate(effects):
                effect_name = effect.get("name", "")
                effect_type = effect.get("type", "")

                # 翻译属性名
                translated_name = ATTRIBUTE_TRANSLATION.get(effect_name, effect_name)

                # 处理公式
                value_obj = effect.get("value", {})
                value_str = ""
                if isinstance(value_obj, dict) and value_obj.get("_type") == "formula":
                    value_str = parse_js_formula_to_latex(value_obj.get("code", ""))
                elif isinstance(value_obj, (int, float, str)):
                    value_str = str(value_obj)

                # 如果是同一个物品的多个效果，第一列和第二列只显示一次
                if i == 0:
                    row = f"| `{item_id}` | **{chinese_name}** | {item_type} | {translated_name} | `{effect_type}` | {value_str} | {description} |"
                else:
                    row = f"| | | | {translated_name} | `{effect_type}` | {value_str} | |"
                table_rows.append(row)

    # d) 写入最终的Markdown文件
    output_dir = os.path.dirname(MARKDOWN_OUTPUT_FILE)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(MARKDOWN_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("### 雪国仙境 (Snowdown) 物品\n\n")
        f.write(table_header)
        f.write(table_align)
        f.write("\n".join(table_rows))

    print(f"\n[🎉] Markdown表格已成功生成: {MARKDOWN_OUTPUT_FILE}")


if __name__ == "__main__":
    integrate_and_generate_table()