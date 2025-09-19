import os
import re

#                      本地JS源文件合并脚本
# 1. --- 配置区 ---

# a) 存放你所有JS源代码的文件夹
SOURCE_DIRECTORY = "../js"

# b) 输出的合并文件名
OUTPUT_FILE = "combined_source.txt"


def remove_icons_from_object(js_object_str):
    """
    使用正则表达式从一个JS对象字符串中移除所有 icon: '...' 键值对。
    """
    # 正则表达式解释:
    # 'icon'\s*:\s* : 匹配 "icon" 键，后面可以有任意空格
    # '((?:\\'|[^'])*)' : 匹配一个完整的单引号字符串，能处理内部的转义单引号
    # ,?\s* : 匹配一个可选的逗号和任意空格
    pattern = re.compile(r"'icon'\s*:\s*'((?:\\'|[^'])*)',?\s*")

    # 替换为空字符串，从而删除整行
    return pattern.sub('', js_object_str)


def combine_local_sources():
    """
    递归地读取本地JS源文件夹，合并文件内容。
    """
    # 检查源文件夹是否存在
    if not os.path.isdir(SOURCE_DIRECTORY):
        print(f"[!] 错误：源文件夹 '{SOURCE_DIRECTORY}' 不存在。请确保你的JS文件都在这个文件夹里。")
        return

    print(f"[*] 开始从 '{SOURCE_DIRECTORY}' 文件夹合并JS源文件...")

    # 准备一个列表来存放所有找到的JS文件路径
    js_files_to_process = []

    # 使用 os.walk 递归地遍历所有子文件夹和文件
    for root, dirs, files in os.walk(SOURCE_DIRECTORY):
        for file in files:
            if file.endswith('.js'):
                js_files_to_process.append(os.path.join(root, file))

    if not js_files_to_process:
        print("[!] 在源文件夹中没有找到任何 .js 文件。")
        return

    print(f"[*] 发现了 {len(js_files_to_process)} 个JS文件，准备合并...")

    # 打开输出文件，准备写入
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        # 遍历找到的所有JS文件
        for filepath in js_files_to_process:
            print(f"  -> 正在处理: {filepath}")

            try:
                # 读取文件内容
                with open(filepath, 'r', encoding='utf-8') as infile:
                    content = infile.read()

                # --- 核心修改：移除icon定义 ---
                # content_no_icons = remove_icons_from_object(content)

                # --- 写入文件头注释，使用相对路径 ---
                # path.relpath 会计算相对路径，更清晰
                relative_path = os.path.relpath(filepath, start=os.getcwd())
                outfile.write("=" * 80 + "\n")
                outfile.write(f"// FILE_PATH: {relative_path.replace(os.sep, '/')}\n") # 统一路径分隔符为'/'
                outfile.write("=" * 80 + "\n\n")

                # 写入处理后的文件内容
                outfile.write(content)
                outfile.write("\n\n")

            except Exception as e:
                print(f"    [!] 处理文件失败: {filepath} - {e}")

    print(f"\n[🎉] 所有源文件已成功合并到: {OUTPUT_FILE}")


if __name__ == "__main__":
    combine_local_sources()