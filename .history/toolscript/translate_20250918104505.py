import json
import re
import os
from typing import Dict, Any

# --- 配置 ---
GAME_DATA_FILE = 'public/output.json'
TRANSLATION_JS_FILE = 'translations.js'
OUTPUT_FILE = 'game_data_translated_zh.json'

def load_js_object(filepath: str) -> Dict[str, Any]:
    """
    从 .js 文件中提取并加载 export default 的对象。
    假设该对象是类JSON格式。
    """
    print(f"正在从 '{filepath}' 加载翻译文件...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 使用正则表达式查找 export default 后面的对象
        match = re.search(r'export\s+default\s*({[\s\S]*});?\s*$', content, re.MULTILINE)
        if not match:
            raise ValueError("在JS文件中未找到 'export default {...}' 结构。")

        json_str = match.group(1)
        # JS对象键可能没有引号，尝试修复
        json_str = re.sub(r'(\w+):', r'"\1":', json_str)
        # 修复尾部逗号
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)

        return json.loads(json_str)
    except FileNotFoundError:
        print(f"错误：翻译文件 '{filepath}' 未找到。")
        return {}
    except (json.JSONDecodeError, ValueError) as e:
        print(f"解析JS文件时出错: {e}")
        print("请确保JS文件中的导出对象是有效的类JSON格式。")
        return {}

def flatten_translations(data: Dict[str, Any]) -> Dict[str, str]:
    """
    将嵌套的翻译字典扁平化为 {'english_key': '中文'} 的形式。
    """
    flat_map = {}

    def _flatten(sub_data, path=""):
        if isinstance(sub_data, dict):
            for key, value in sub_data.items():
                # 为顶级类别（如'nightHunt'）创建翻译（如果它有'name'子键）
                if key == 'name' and isinstance(value, str) and path:
                     # 将上一级路径（如 'nightHunt'）也加入翻译表
                     flat_map[path.lower()] = value

                # 递归处理
                _flatten(value, key)

        # 仅当键值对的值是字符串时，才将其添加到扁平映射中
        if path and isinstance(sub_data, str):
            flat_map[path.lower()] = sub_data

    # 初始调用
    _flatten(data)

    # 确保顶层键也被翻译
    for key, value in data.items():
        if isinstance(value, dict) and 'name' in value:
            flat_map[key.lower()] = value['name']
        elif isinstance(value, str):
            flat_map[key.lower()] = value

    print(f"已创建 {len(flat_map)} 条翻译条目。")
    return flat_map

def js_to_latex(js_code: str) -> Dict[str, str]:
    """
    将简单的JS箭头函数字符串转换为LaTeX公式。
    """
    # 移除函数定义部分，例如 "lvl => "
    formula = re.sub(r'^\s*\w+\s*=>\s*', '', js_code).strip()

    # 替换变量
    formula = formula.replace('lvl', 'L')

    # 替换 Math.pow(a, b) 为 a^{b}
    # 这个正则表达式会处理简单的和嵌套的参数
    formula = re.sub(r'Math\.pow\((.+?),\s*(.+?)\)', r'{\1}^{\2}', formula)

    # 替换乘法和除法
    formula = formula.replace('*', r' \times ')

    # 这是一个简化的转换，更复杂的JS语法需要更高级的解析器
    # 例如，此脚本不处理复杂的条件或函数调用

    return {
        "_type": "latex",
        "formula": f"${formula}$"  # 将整个公式包裹在$..$中
    }

def translate_and_process(data: Any, translation_map: Dict[str, str]) -> Any:
    """
    递归遍历数据结构，翻译字符串并转换公式。
    """
    if isinstance(data, dict):
        # 检查是否是需要转换为LaTeX的公式对象
        if data.get("_type") == "formula" and "code" in data:
            return js_to_latex(data["code"])

        new_dict = {}
        for key, value in data.items():
            # 翻译键
            translated_key = translation_map.get(str(key).lower(), key)
            # 递归处理值
            new_dict[translated_key] = translate_and_process(value, translation_map)
        return new_dict

    elif isinstance(data, list):
        return [translate_and_process(item, translation_map) for item in data]

    elif isinstance(data, str):
        # 翻译值
        return translation_map.get(data.lower(), data)

    else:
        # 对于数字、布尔值等，保持原样
        return data

def main():
    """
    主执行函数
    """
    if not os.path.exists(GAME_DATA_FILE):
        print(f"错误: 游戏数据文件 '{GAME_DATA_FILE}' 未找到。请确保文件存在于当前目录。")
        return

    # 1. 加载和解析数据
    translations_js = load_js_object(TRANSLATION_JS_FILE)
    if not translations_js:
        return

    with open(GAME_DATA_FILE, 'r', encoding='utf-8') as f:
        game_data = json.load(f)
    print(f"成功加载游戏数据 '{GAME_DATA_FILE}'。")

    # 2. 准备翻译映射
    translation_map = flatten_translations(translations_js)

    # 3. 执行翻译和处理
    print("开始翻译和处理JSON数据...")
    translated_data = translate_and_process(game_data, translation_map)
    print("处理完成。")

    # 4. 保存结果
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    print(f"已将翻译后的数据保存到 '{OUTPUT_FILE}'。")

if __name__ == "__main__":
    main()