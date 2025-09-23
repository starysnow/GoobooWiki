# process_and_translate_static.py

import json
import os
import pandas as pd
# 导入我们自己的模块
from 。toolscript.formula_parser import parse_js_formula

# --- 1. 配置区 ---
PREPROCESSED_JSON_DIR = "public/preprocessed_json"
MARKDOWN_OUTPUT_DIR = "wiki_tables_output"
TRANSLATION_MAP_FILE = "public/zh_map.json"

# --- 2. 主执行流程 ---

def main():
    # a) 加载翻译字典
    try:
        with open(TRANSLATION_MAP_FILE, 'r', encoding='utf-8') as f:
            translations = json.load(f)
    except Exception as e:
        print(f"[!] 致命错误：无法加载翻译字典 - {e}")
        return

    if not os.path.exists(MARKDOWN_OUTPUT_DIR):
        os.makedirs(MARKDOWN_OUTPUT_DIR)

    # b) 遍历所有预处理过的JSON文件
    for filename in os.listdir(PREPROCESSED_JSON_DIR):
        if not filename.endswith('.json'):
            continue

        module_name = filename.replace('.json', '')
        filepath = os.path.join(PREPROCESSED_JSON_DIR, filename)

        print(f"\n--- 正在处理模块: {module_name} ---")

        with open(filepath, 'r', encoding='utf-8') as f:
            module_data = json.load(f)

        all_rows = []

        # c) 遍历模块下的所有词条
        for entry_id, entry_data in module_data.items():
            # 翻译词条ID
            entry_name = translations.get("entries", {}).get(entry_id, entry_id)

            if 'effect' in entry_data and isinstance(entry_data['effect'], list):
                for i, effect in enumerate(effects := entry_data['effect']):
                    effect_name = effect.get('name', '')
                    # 翻译属性名
                    translated_name = translations.get("attributes", {}).get(effect_name, effect_name)

                    # 解析公式
                    value_obj = effect.get('value', {})
                    parsed_formula = parse_js_formula(value_obj) if isinstance(value_obj, str) else {"description": str(value_obj), "latex": str(value_obj)}

                    all_rows.append({
                        "ID": entry_id if i == 0 else '',
                        "名称": entry_name if i == 0 else '',
                        "效果目标": translated_name,
                        "类型": f"`{effect.get('type', '')}`",
                        "公式描述": parsed_formula.get("description", ""),
                        "公式 (LaTeX)": parsed_formula.get("latex", "")
                    })

        if not all_rows:
            continue

        # d) 生成Markdown表格
        df = pd.DataFrame(all_rows)
        # 补全因为合并单元格留下的空值
        df['ID'].replace('', pd.NA, inplace=True)
        df.ffill(inplace=True) # Forward fill

        markdown_table = df.to_markdown(index=False)

        module_title = translations.get("modules", {}).get(module_name, module_name.capitalize())
        output_content = f"### {module_title}\n\n{markdown_table}\n"

        output_path = os.path.join(MARKDOWN_OUTPUT_DIR, f"{module_name}.md")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output_content)

        print(f"  [+] 成功生成Markdown文件: {output_path}")

    print("\n[🎉] 所有模块处理完毕！")


if __name__ == "__main__":
    main()

