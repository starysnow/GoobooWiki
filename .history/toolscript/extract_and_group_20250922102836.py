# extract_and_group.py (简化版)

import os
import json
import re

# --- 配置区 ---
SOURCE_JSON_DIR = "public/preprocessed_json" # ◀︎ 现在读取预处理过的JSON
OUTPUT_DIR = "public/wiki_modules"
ENTRY_DEFINING_KEYS = ['effect']

def formula_code_to_latex(code_str):
    """
    这个函数现在接收的是函数的字符串 'FUNCTION_BODY::lvl => ...'
    """
    if not isinstance(code_str, str) or not code_str.startswith('FUNCTION_BODY::'):
        return None

    # 提取函数体
    js_code = code_str.split('::', 1)[1]

    # ... (这里的正则表达式翻译逻辑可以保持不变)
    # 示例简化版:
    if '=>' in js_code:
        body = js_code.split('=>', 1)[1].strip()
        body = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', body)
        body = body.replace('*', ' \\times ').replace('lvl', '\\text{lvl}')
        return f"${body}$"
    return None

def extract_entries_from_json():
    print(f"[*] 开始从预处理的JSON中提取词条...")

    grouped_entries = {}

    for root, _, files in os.walk(SOURCE_JSON_DIR):
        for file in files:
            if file.endswith('.json'):
                filepath = os.path.join(root, file)
                relative_filepath = os.path.relpath(filepath, SOURCE_JSON_DIR).replace(os.sep, '/')

                print(f"  -> 正在扫描: {relative_filepath}")

                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                entries_in_file = []

                # 递归函数来在JSON对象中寻找词条
                def find_entries(obj):
                    if isinstance(obj, dict):
                        # 判断当前对象是否是一个词条
                        if any(key in obj for key in ENTRY_DEFINING_KEYS):
                            entry_data = obj.copy() # 浅拷贝
                            # 尝试翻译内部的公式
                            for key, value in entry_data.items():
                                if isinstance(value, dict) and value.get('value', '').startswith('FUNCTION_BODY::'):
                                   code = value['value']
                                   entry_data[key]['latex'] = formula_code_to_latex(code)
                            entries_in_file.append(entry_data)

                        # 继续深入查找
                        for value in obj.values():
                            find_entries(value)
                    elif isinstance(obj, list):
                        for item in obj:
                            find_entries(item)

                find_entries(data)

                if entries_in_file:
                    grouped_entries[relative_filepath.replace('.json', '.js')] = entries_in_file

    print(f"\n[*] 扫描完成！在 {len(grouped_entries)} 个文件中提取了词条。")
    return grouped_entries

def save_grouped_entries(grouped_data, output_dir):
    """
    将按文件分组的词条数据，保存为对应的模块化JSON文件。
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"[*] 创建输出目录: {output_dir}")

    print(f"\n[*] 正在将分组数据保存为模块化JSON文件...")

    for filepath, entries in grouped_data.items():
        # 根据原始文件路径创建新的JSON文件名
        # 'event/snowdown/item.js' -> 'event_snowdown_item.json'
        # 这样做可以保留文件夹结构信息，同时避免创建多层子目录
        output_filename = filepath.replace('/', '_').replace('.js', '.json')
        output_path = os.path.join(output_dir, output_filename)

        # 我们将词条列表直接作为JSON文件的内容
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)

        print(f"  [+] 已保存模块: {output_path}")

    print(f"\n[🎉] 所有数据模块已成功保存到: {output_dir}")


if __name__ == "__main__":
    # 现在只需要一个阶段
    grouped_data = extract_entries_from_json()
    if grouped_data:
        save_grouped_entries(grouped_data, OUTPUT_DIR)