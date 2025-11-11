import os
import json
from slimit import ast
from slimit.parser import Parser
from slimit.visitors import nodevisitor
# 使用相对导入，从同一个包内导入
from .formula_parser import parse_js_formula

# ==============================================================================
#                      游戏文件批量翻译与解析脚本
# ==============================================================================

# 1. --- 配置区 ---
SOURCE_MODULES_DIR = "js/modules"
SOURCE_LANG_DIR = "js/lang/zh"
OUTPUT_DIR = "data/js_translated"

# --- 2. 辅助函数：AST转换 ---

def js_ast_to_python(node):
    if isinstance(node, ast.Object):
        return {js_ast_to_python(prop.left): js_ast_to_python(prop.right) for prop in node.properties}
    elif isinstance(node, ast.Array):
        return [js_ast_to_python(item) for item in node.items]
    elif isinstance(node, ast.String):
        return node.value.strip("'\"")
    # ... (其他简单类型的转换与之前版本相同)
    elif isinstance(node, (ast.ArrowFunction, ast.Function)):
        code_str = node.to_ecma()
        parsed = parse_js_formula(code_str)
        return { "_type": "formula", "code": code_str, "latex": parsed['latex'], "description": parsed['description'] }
    return None # 返回None以便上层处理

# --- 3. 主逻辑 ---

def load_translations(lang_dir):
    """递归加载所有语言文件到一个嵌套字典中。"""
    print("[*] 正在加载所有汉化文件...")
    translation_db = {}
    parser = Parser()
    for root, _, files in os.walk(lang_dir):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        js_code = f.read()
                    tree = parser.parse(js_code)
                    for node in nodevisitor.visit(tree):
                        if isinstance(node, ast.Export) and isinstance(node.node, ast.Object):
                            # 使用文件路径作为键，构建嵌套结构
                            relative_path = os.path.relpath(filepath, lang_dir).replace('.js', '').replace(os.sep, '_')
                            translation_db[relative_path] = js_ast_to_python(node.node)
                            print(f"  - 已加载汉化模块: {relative_path}")
                            break
                except Exception as e:
                    print(f"  [!] 加载汉化文件失败: {filepath} - {e}")
    return translation_db

def process_and_translate_modules(modules_dir, translations):
    """解析核心模块，并用加载的翻译数据进行丰富。"""
    print("\n[*] 开始解析并翻译核心模块文件...")
    parser = Parser()
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for root, _, files in os.walk(modules_dir):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                print(f"  -> 正在处理: {filepath}")

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        js_code = f.read()

                    tree = parser.parse(js_code)
                    core_data = None
                    for node in nodevisitor.visit(tree):
                        if isinstance(node, ast.Export) and isinstance(node.node, ast.Object):
                            core_data = js_ast_to_python(node.node)
                            break

                    if not core_data:
                        print(f"    [!] 未在该文件中找到 'export default' 对象。")
                        continue

                    # --- 核心翻译逻辑 ---
                    # 查找对应的语言模块
                    lang_key = os.path.basename(file).replace('.js', '')
                    lang_module = translations.get(lang_key)

                    # 递归函数，用于在核心数据中注入翻译
                    def inject_translations(data_obj, lang_obj):
                        if not isinstance(data_obj, dict) or not isinstance(lang_obj, dict):
                            return

                        for key, value in data_obj.items():
                            # 查找翻译
                            lang_entry = lang_obj.get(key)
                            if lang_entry:
                                if isinstance(lang_entry, str):
                                    data_obj[key]['_name'] = lang_entry
                                elif isinstance(lang_entry, dict):
                                    data_obj[key]['_name'] = lang_entry.get('name')
                                    data_obj[key]['_description'] = lang_entry.get('description')

                            # 递归深入
                            if isinstance(value, dict):
                                inject_translations(value, lang_obj.get(key, {}))
                            elif isinstance(value, list):
                                for item in value:
                                    inject_translations(item, {})

                    if lang_module:
                        print("    [*] 找到了对应的汉化模块，开始注入翻译...")
                        # 这是一个简化的注入逻辑，实际可能需要根据语言文件结构调整
                        # 例如，如果翻译都在 'description' 和 'keyset' 键下
                        inject_translations(core_data, lang_module)
                        if 'description' in lang_module:
                            for key, desc in lang_module['description'].items():
                                if key in core_data:
                                    core_data[key]['_description'] = desc


                    # --- 输出 ---
                    output_path = os.path.join(OUTPUT_DIR, os.path.relpath(filepath, modules_dir).replace('.js', '.json'))
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(core_data, f, indent=2, ensure_ascii=False)
                    print(f"    [+] 成功生成翻译后的JSON: {output_path}")

                except Exception as e:
                    print(f"    [-] 处理失败: {filepath} - {e}")


if __name__ == "__main__":
    # 阶段一：加载所有汉化文件作为“知识库”
    translation_database = load_translations(SOURCE_LANG_DIR)

    # 阶段二：解析核心模块并使用“知识库”进行翻译
    process_and_translate_modules(SOURCE_MODULES_DIR, translation_database)