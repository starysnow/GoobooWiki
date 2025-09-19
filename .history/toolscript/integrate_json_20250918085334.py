import json
import os
import time

# --- 配置区 ---
GEMINI_OUTPUT_FOLDER = "public/output.js" # 存放Gemini生成的JSON文件的文件夹
OUTPUT_FILE = "public/database.js"

def integrate_results():
    """
    读取所有Gemini分析出的JSON文件，合并并构建最终的database.js。
    """
    print("[*] 开始整合Gemini的分析结果...")

    # 这是一个巨大的字典，键是文件路径，值是解析出的数据
    full_data_map = {}

    if not os.path.exists(GEMINI_OUTPUT_FOLDER):
        print(f"[!] 错误：找不到Gemini输出文件夹 '{GEMINI_OUTPUT_FOLDER}'")
        return

    for filename in os.listdir(GEMINI_OUTPUT_FOLDER):
        if filename.endswith('.json'):
            filepath = os.path.join(GEMINI_OUTPUT_FOLDER, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                full_data_map.update(data) # 将多个部分的JSON合并

    print(f"[*] 成功加载并合并了 {len(full_data_map)} 个文件的分析结果。")
    print("[*] 开始构建最终的 database.js...")

    database = { "_indexById": {} }

    # --- 在这里，由你来完成最终的翻译和整合 ---
    # 这是你作为“总编辑”进行校对和配置的地方

    # 示例：整合中文语言数据和核心数据
    lang_zh = full_data_map.get('src/lang/zh/achievement.js', {})
    core_achievement = full_data_map.get('src/js/modules/achievement.js', {})

    # 在这里，你可以编写逻辑，将 lang_zh 里的中文名，
    # 添加到 core_achievement 的对应条目中。
    # ...

    # 目前，我们先简单地按文件路径进行分类
    for filepath, data in full_data_map.items():
        # 从路径中提取分类和文件名
        parts = filepath.split('/')
        category = parts[-2] if len(parts) > 1 else "misc"
        name = os.path.basename(filepath).replace('.js', '')

        if category not in database:
            database[category] = {}

        database[category][name] = data

    # (这部分build_database的逻辑需要根据你的最终需求来定制)

    # --- 生成JS文件 ---
    db_string = json.dumps(database, indent=2, ensure_ascii=False)
    # ... (写入文件的逻辑和之前一样) ...

    print("\n[🎉] 整合完成！")


if __name__ == "__main__":
    integrate_results()