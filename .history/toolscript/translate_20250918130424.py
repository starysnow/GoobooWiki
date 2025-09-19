import json
import re
import os
from typing import Dict, Any

// translate.js
const fs = require('fs');
const path = require('path');

// --- 配置项 ---
// 源JSON文件路径
const SOURCE_JSON_PATH = path.join(__dirname, 'output.json');
// 翻译词典文件路径 (步骤一生成的)
const TRANSLATION_MAP_PATH = path.join(__dirname, 'zh_map.json');
// 翻译后输出的文件路径
const OUTPUT_JSON_PATH = path.join(__dirname, 'output_zh.json');

// --- 主逻辑 ---
function main() {
    console.log('开始翻译过程...');

    // 1. 加载文件
    let sourceData;
    let translationMap;
    try {
        console.log(`正在读取源文件: ${SOURCE_JSON_PATH}`);
        sourceData = JSON.parse(fs.readFileSync(SOURCE_JSON_PATH, 'utf-8'));

        console.log(`正在读取翻译词典: ${TRANSLATION_MAP_PATH}`);
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
    } catch (error) {
        console.error('错误：无法读取或解析文件！', error);
        return;
    }

    console.log('文件加载成功，开始遍历和替换...');

    // 2. 递归翻译
    const translatedData = translateObject(sourceData, translationMap);

    // 3. 保存结果
    try {
        // 使用 JSON.stringify 的第三个参数美化输出 (2个空格缩进)
        const outputString = JSON.stringify(translatedData, null, 2);
        fs.writeFileSync(OUTPUT_JSON_PATH, outputString, 'utf-8');
        console.log(`翻译完成！结果已保存至: ${OUTPUT_JSON_PATH}`);
    } catch (error) {
        console.error('错误：无法写入输出文件！', error);
    }
}

/**
 * 递归遍历和翻译对象的函数
 * @param {any} data - 当前需要处理的数据节点 (可以是对象、数组、字符串等)
 * @param {object} translationMap - 翻译词典
 * @returns {any} - 翻译后的数据节点
 */
function translateObject(data, translationMap) {
    // 如果是数组，则遍历数组中的每一项并递归调用
    if (Array.isArray(data)) {
        return data.map(item => translateObject(item, translationMap));
    }

    // 如果是对象，则遍历对象的键和值
    if (typeof data === 'object' && data !== null) {
        const newObj = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                // --- 核心替换逻辑 ---
                // 1. 翻译键 (Key)
                const translatedKey = translationMap[key] || key;

                // 2. 翻译值 (Value)，对值进行递归处理
                const translatedValue = translateObject(data[key], translationMap);

                newObj[translatedKey] = translatedValue;
            }
        }
        return newObj;
    }

    // 如果是字符串，检查它是否需要被翻译 (作为值)
    if (typeof data === 'string') {
        return translationMap[data] || data;
    }

    // 对于数字、布尔值、null等其他类型，直接返回原值
    return data;
}

// 运行主函数
main();


# --- 配置 ---
# GAME_DATA_FILE = 'public/output.json'
# TRANSLATION_JS_FILE = 'public/zh.js'
# OUTPUT_FILE = 'public/database.json'

# def load_js_object_advanced(filepath: str) -> Dict[str, Any]:
#     """
#     从 ES6 模块文件中提取并加载 export default 的对象。
#     这个版本会处理 import 语句、对象展开语法以及数字键。
#     """
#     print(f"正在从 '{filepath}' 加载翻译文件...")
#     try:
#         with open(filepath, 'r', encoding='utf-8') as f:
#             content = f.read()

#         # 1. 定位 export default 的对象主体
#         match = re.search(r'export\s+default\s*({[\s\S]*});?\s*$', content, re.MULTILINE)
#         if not match:
#             raise ValueError("在JS文件中未找到 'export default {...}' 结构。")

#         js_object_str = match.group(1)

#         # 2. 预处理JS对象字符串
#         # 移除开头的 '{' 和结尾的 '}' 以便单独处理内容
#         js_object_str = js_object_str.strip()[1:-1].strip()

#         # 移除对象展开语法，例如 "...zh,"
#         js_object_str = re.sub(r'\.\.\.\w+\s*,?', '', js_object_str)

#         # 移除注释
#         js_object_str = re.sub(r'//.*', '', js_object_str)
#         js_object_str = re.sub(r'/\*[\s\S]*?\*/', '', js_object_str, flags=re.MULTILINE)

#         # 重新包裹在花括号中
#         json_like_str = '{' + js_object_str + '}'

#         # 3. 转换为有效的JSON格式
#         # 为未加引号的键添加双引号。
#         # 这个新的正则表达式 `(\w+|"\w+"|\d+):` 匹配三种情况：
#         #   \w+        -> 单词键 (e.g., myKey:)
#         #   "\w+"      -> 已经被引起来的键 (避免重复加引号)
#         #   \d+        -> 数字键 (e.g., 0:)
#         # 我们只对那些不被引号包裹的键进行替换。

#         # 替换单词键
#         json_like_str = re.sub(r'(?m)^(\s*)([a-zA-Z_]\w*):', r'\1"\2":', json_like_str)
#         # 替换数字键
#         json_like_str = re.sub(r'(?m)^(\s*)(\d+):', r'\1"\2":', json_like_str)

#         # 将单引号字符串转换为双引号字符串
#         # 这个正则表达式会处理转义的单引号
#         json_like_str = re.sub(r":\s*'((?:\\'|[^'])*)'", r': "\1"', json_like_str)

#         # 修复尾部逗号
#         json_like_str = re.sub(r',\s*([}\]])', r'\1', json_like_str)

#         return json.loads(json_like_str)

#     except FileNotFoundError:
#         print(f"错误：翻译文件 '{filepath}' 未找到。")
#         return {}
#     except (json.JSONDecodeError, ValueError) as e:
#         print(f"解析JS文件时出错: {e}")
#         # print("清理后的字符串内容:\n---\n", json_like_str, "\n---") # 用于调试
#         print("请确保JS文件中的导出对象结构基本正确。")
#         return {}


# def flatten_translations(data: Dict[str, Any]) -> Dict[str, str]:
#     """
#     将嵌套的翻译字典扁平化为 {'english_key': '中文'} 的形式。
#     """
#     flat_map = {}

#     def _flatten(sub_data, path=""):
#         if isinstance(sub_data, dict):
#             # 为有 'name' 键的对象创建父级翻译
#             if 'name' in sub_data and isinstance(sub_data['name'], str) and path:
#                 flat_map[path.lower()] = sub_data['name']

#             for key, value in sub_data.items():
#                 new_path = key
#                 _flatten(value, new_path)

#         elif isinstance(sub_data, str) and path:
#             flat_map[path.lower()] = sub_data

#     _flatten(data)

#     # 再次遍历顶层以确保它们也被添加
#     for key, value in data.items():
#         if isinstance(value, dict) and 'name' in value:
#             flat_map[key.lower()] = value['name']
#         elif isinstance(value, str):
#              flat_map[key.lower()] = value

#     print(f"已创建 {len(flat_map)} 条翻译条目。")
#     return flat_map

# def js_to_latex(js_code: str) -> Dict[str, str]:
#     """
#     将简单的JS箭头函数字符串转换为LaTeX公式。
#     """
#     formula = re.sub(r'^\s*\(?\w+\)?\s*=>\s*', '', js_code).strip()

#     formula = formula.replace('lvl', 'L')

#     # 改进的 Math.pow 替换，处理嵌套
#     while 'Math.pow' in formula:
#          formula = re.sub(r'Math\.pow\(([^,]+),\s*([^)]+)\)', r'{\1}^{\2}', formula)

#     formula = formula.replace('*', r' \times ')
#     formula = formula.replace('Math.floor', r'\\lfloor')
#     formula = formula.replace('Math.ceil', r'\\lceil')
#     formula = formula.replace('Math.round', r'\\text{round}') # LaTeX没有简单的round
#     formula = formula.replace('Math.min', r'\\min')
#     formula = formula.replace('Math.max', r'\\max')

#     # 简单的括号处理
#     formula = re.sub(r'\(', r'\\left(', formula)
#     formula = re.sub(r'\)', r'\\right)', formula)

#     return {
#         "_type": "latex",
#         "formula": f"${formula}$"
#     }

# def translate_and_process(data: Any, translation_map: Dict[str, str]) -> Any:
#     """
#     递归遍历数据结构，翻译字符串并转换公式。
#     """
#     if isinstance(data, dict):
#         if data.get("_type") == "formula" and "code" in data:
#             return js_to_latex(data["code"])

#         new_dict = {}
#         for key, value in data.items():
#             translated_key = translation_map.get(str(key).lower(), key)
#             new_dict[translated_key] = translate_and_process(value, translation_map)
#         return new_dict

#     elif isinstance(data, list):
#         return [translate_and_process(item, translation_map) for item in data]

#     elif isinstance(data, str):
#         return translation_map.get(data.lower(), data)

#     else:
#         return data

# def main():
#     """
#     主执行函数
#     """
#     if not os.path.exists(GAME_DATA_FILE):
#         print(f"错误: 游戏数据文件 '{GAME_DATA_FILE}' 未找到。")
#         return

#     # 1. 加载和解析数据
#     translations_js = load_js_object_advanced(TRANSLATION_JS_FILE)
#     if not translations_js:
#         return

#     with open(GAME_DATA_FILE, 'r', encoding='utf-8') as f:
#         game_data = json.load(f)
#     print(f"成功加载游戏数据 '{GAME_DATA_FILE}'。")

#     # 2. 准备翻译映射
#     translation_map = flatten_translations(translations_js)

#     # 3. 执行翻译和处理
#     print("开始翻译和处理JSON数据...")
#     translated_data = translate_and_process(game_data, translation_map)
#     print("处理完成。")

#     # 4. 保存结果
#     with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
#         json.dump(translated_data, f, ensure_ascii=False, indent=2)
#     print(f"已将翻译后的数据保存到 '{OUTPUT_FILE}'。")

# if __name__ == "__main__":
#     main()