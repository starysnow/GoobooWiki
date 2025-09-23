# extract_and_group.py

import os
import json
from slimit import ast
from slimit.parser import Parser
from slimit.visitors import nodevisitor
import re

# ==============================================================================
#           游戏效果(Effect)词条模块化提取与分组脚本
# ==============================================================================

# 1. --- 配置区 ---
SOURCE_ROOT_DIR = "js/modules"
OUTPUT_DIR = "public/wiki_modules" # 输出目录现在存放的是模块化的JSON
ENTRY_DEFINING_KEYS = ['effect']

# ... (ast_arrow_func_to_latex 和 js_ast_to_python 函数保持不变) ...
def ast_arrow_func_to_latex(node):
    # ...
    pass
def js_ast_to_python(node):
    # ...
    pass

# --- 2. 核心逻辑：按文件提取并分组 ---

def extract_entries_by_file(start_dir):
    """
    遍历JS文件，提取所有“词条”，并按其来源文件进行分组。
    返回一个字典，键是文件名，值是该文件下所有词条的列表。
    """
    print(f"[*] 开始从 '{start_dir}' 文件夹中提取并按文件分组...")

    # 使用字典来存储结果: { 'achievement.js': [entry1, entry2], 'ingot.js': [entry3] }
    grouped_entries = {}
    parser = Parser()

    for root, _, files in os.walk(start_dir):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                # 使用相对路径作为字典的键，更清晰
                relative_filepath = os.path.relpath(filepath, start_dir).replace(os.sep, '/')

                print(f"  -> 正在扫描: {relative_filepath}")

                with open(filepath, 'r', encoding='utf-8') as f:
                    js_code = f.read()

                # 为当前文件创建一个列表来存放找到的词条
                entries_in_file = []

                try:
                    tree = parser.parse(js_code)

                    # 遍历AST的所有对象字面量节点
                    for node in nodevisitor.visit(tree):
                        if isinstance(node, ast.Object):
                            props = {prop.left.value: prop.right for prop in node.properties if isinstance(prop.left, ast.Identifier)}

                            # 判断是否为词条
                            if any(key in props for key in ENTRY_DEFINING_KEYS):
                                entry_data = js_ast_to_python(node)

                                # 尝试找到这个词条的ID或名称
                                # 优先从对象自身的属性中找
                                entry_id = entry_data.get('name') or entry_data.get('id')

                                # 如果对象内没有id/name，我们尝试从它在父对象中的键名获取
                                # 这需要更复杂的AST遍历，暂时简化处理
                                if not entry_id:
                                    entry_id = f"anonymous_entry_{len(entries_in_file)}"

                                entry_data['_meta'] = { 'id': entry_id }
                                entries_in_file.append(entry_data)

                    # 如果在这个文件中找到了词条，就将其存入结果字典
                    if entries_in_file:
                        grouped_entries[relative_filepath] = entries_in_file

                except Exception as e:
                    print(f"    [!] 解析文件时出错: {filepath} - {e}")

    print(f"\n[*] 扫描完成！在 {len(grouped_entries)} 个文件中提取了词条。")
    return grouped_entries


# --- 3. 阶段二：保存分组后的JSON文件 ---

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
    # 阶段一
    grouped_wiki_entries = extract_entries_by_file(SOURCE_ROOT_DIR)

    # 阶段二
    if grouped_wiki_entries:
        save_grouped_entries(grouped_wiki_entries, OUTPUT_DIR)