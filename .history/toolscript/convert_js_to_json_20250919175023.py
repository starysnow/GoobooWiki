import re
import os

# --- 配置 ---
INPUT_JS_FILE = 'public/combined.js'
OUTPUT_JSON_FILE = 'public/combined.json'

def convert_js_to_json(js_content):
    """
    将包含JavaScript对象字面量的字符串转换为严格的JSON字符串。
    """
    # 1. 移除文件开头的 `export default ` 和末尾的 `;`
    if js_content.strip().startswith('export default'):
        js_content = js_content.strip()[len('export default'):].strip()
    if js_content.strip().endswith(';'):
        js_content = js_content.strip()[:-1].strip()

    # 2. 使用正则表达式为所有对象键添加双引号
    # 这个正则表达式会查找 (键) : {值} 模式
    # - 它处理前面可能有逗号、花括号或换行符的情况
    # - 它处理键名中可能包含字母、数字和下划线的情况
    # - 它会跳过已经有双引号的键
    # 正则表达式解释:
    # (?<=[{\s,])   - 正向后行断言：确保键前面是 {、空白符或逗号
    # ([a-zA-Z0-9_]+) - 捕获组1：捕获键名（字母、数字、下划线）
    # (\s*:\s*)    - 捕获组2：捕获冒号及其周围的空白符
    # (?!\s*":)     - 负向前行断言：确保这个键后面不是 ": (避免给已带引号的键再次添加引号)

    # 增加对模块路径键（如 "modules/achievement"）的处理
    # 这些键已经有双引号，但可能包含特殊字符，我们的简单正则可能会漏掉
    # 一个更稳健的方法是分步处理

    # 步骤 A: 处理不带引号的键
    js_content = re.sub(r'(?<=([{\s,]))([a-zA-Z0-9_]+)(?=\s*:)', r'"\2"', js_content)

    # 步骤 B: 将单引号的键转换为双引号
    js_content = re.sub(r"(?<=([{\s,]))'([^']*)'(?=\s*:)", r'"\2"', js_content)

    # 步骤 C (可选但推荐): 尝试修复尾随逗号，这在JS中合法但在JSON中非法
    # 移除对象中最后一个键值对后的逗号
    js_content = re.sub(r',\s*([}\]])', r'\1', js_content)

    return js_content

def main():
    print(f"正在读取 JavaScript 文件: {INPUT_JS_FILE}")
    try:
        with open(INPUT_JS_FILE, 'r', encoding='utf-8') as f:
            js_code = f.read()
    except FileNotFoundError:
        print(f"错误：输入文件 {INPUT_JS_FILE} 未找到。")
        return

    print("正在将 JS 对象转换为 JSON 格式...")
    json_str = convert_js_to_json(js_code)

    print(f"正在写入 JSON 文件: {OUTPUT_JSON_FILE}")
    try:
        # 在写入前验证一下转换结果是否是合法的JSON
        import json
        json.loads(json_str)

        with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
            f.write(json_str)
        print("转换成功！")

    except json.JSONDecodeError as e:
        print("\n转换失败！生成的字符串不是有效的JSON。")
        print("这通常发生在JS代码比预期更复杂的情况下（例如，包含注释、函数调用作为值等）。")
        print(f"JSON 解析错误: {e}")
        # 保存错误文件以供调试
        error_file = 'error_output.json'
        with open(error_file, 'w', encoding='utf-8') as f:
            f.write(json_str)
        print(f"已将有问题的输出保存到 {error_file} 以供检查。")
    except Exception as e:
        print(f"发生未知错误: {e}")


if __name__ == "__main__":
    main()