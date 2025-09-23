// toolscript/translate_combine.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;
import prettier from 'prettier';

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 【重要】输入是上一步生成的 combined.js
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined.js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined_zh.js');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

# process_and_translate_static.py

import json
import os
import pandas as pd
# 导入我们自己的模块
from source_data.mappings.formula_parser import parse_js_formula

# --- 1. 配置区 ---
PREPROCESSED_JSON_DIR = "source_data/preprocessed_json"
MARKDOWN_OUTPUT_DIR = "wiki_tables_output"
TRANSLATION_MAP_FILE = "source_data/mappings/translation_map.json"

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
    main()```

### **如何使用及工作原理解析**

1.  **核心是“字典”**：
    *   这个方案的成败完全取决于你在 `translation_map.json` 中提供了多少翻译。你需要花一些时间，尽可能地把你从游戏或代码中知道的对应关系都填进去。
    *   同样，`formula_parser.py` 中的规则也需要你根据看到的公式不断扩充。

2.  **清晰的职责**：
    *   `preprocess.js`：只负责将有潜在语法问题的JS模块，转换为干净、纯粹的JSON。
    *   `process_and_translate_static.py`：负责读取这些干净的JSON，然后利用你提供的“字典”和“规则”，进行翻译、解析和格式化。

3.  **Pandas的妙用**：
    *   在生成Markdown之前，我们使用了 `df.ffill(inplace=True)`。`ffill` (Forward Fill) 是一个强大的功能，它会自动用上一行的非空值，来填充下面所有的空值。这能非常优雅地处理我们为了模拟“合并单元格”而留下的空白，确保最终的表格数据是完整的。

**这个方案的优缺点**：

*   **优点**：
    *   **完全本地，无需联网，速度极快**。
    *   **结果稳定，完全可控**。你定义了什么规则，就得到什么结果，没有任何不确定性。
    *   **可迭代开发**：你可以先只翻译一小部分内容，生成第一版Wiki。之后随着你对游戏理解的加深，不断地去扩充你的`translation_map.json`和`formula_parser.py`，然后重新运行脚本，就能更新整个Wiki。
*   **缺点**：
    *   **前期投入大**：你需要投入时间去手动建立你的“知识库”（翻译字典和解析规则）。
    *   **维护成本**：当游戏更新，出现新的属性名或公式时，你需要手动去更新你的字典和规则。

对于构建一个高质量、精确的Wiki来说，这种**“规则驱动”**的静态方案通常是比“AI驱动”更可靠、更受青VitePress青睐的选择。它虽然前期需要投入，但能保证你对最终产出的内容有100%的控制权。