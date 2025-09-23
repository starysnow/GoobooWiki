// 根据字典替换
// 重点词：name、effect、value/
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// --- 配置 ---
// 使用 __dirname 和 path.join 确保路径在任何运行位置下都正确
const SCRIPT_DIR = __dirname;
const SOURCE_DIR = path.join(SCRIPT_DIR, '../js');
const TRANSLATION_FILE = path.join(SCRIPT_DIR, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(SCRIPT_DIR, '../data/js_translated');

async function main() {
    console.time('TranslationProcess'); // 开始计时

    // 1. 加载并准备翻译字典
    console.log(`正在从路径加载翻译字典: ${TRANSLATION_FILE}`);
    let translations;
    try {
        if (!fs.existsSync(TRANSLATION_FILE)) {
            throw new Error(`翻译字典文件未找到: ${TRANSLATION_FILE}\n请先运行 flatten_dictionary.js 来生成它。`);
        }
        translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
    } catch (error) {
        console.error('加载或解析翻译字典失败:', error.message);
        return;
    }

    // 按键的长度降序排序，以优先替换更长的、更具体的键
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    console.log(`字典加载成功，共 ${translationKeys.length} 个词条。`);

    // 2. 准备输出目录 (清空并重新创建)
    console.log(`正在清理并创建输出目录: ${OUTPUT_DIR}`);
    await fs.emptyDir(OUTPUT_DIR);

    // 3. 查找所有源文件 (递归查找所有子目录)
    console.log(`正在查找源JS文件于: ${SOURCE_DIR}`);
    const sourceFiles = glob.sync(`${SOURCE_DIR}/**/*.js`);
    if (sourceFiles.length === 0) {
        console.error(`错误：在 "${SOURCE_DIR}" 目录下没有找到任何 .js 文件。`);
        return;
    }
    console.log(`找到了 ${sourceFiles.length} 个文件需要翻译。`);

    let totalLinesProcessed = 0;

    // 4. 遍历并处理每个文件
    for (const filePath of sourceFiles) {
        let content = await fs.readFile(filePath, 'utf-8');
        totalLinesProcessed += content.split('\n').length;

        // 对文件内容进行全局、精确的替换
        for (const key of translationKeys) {
            const value = translations[key];

            // 安全地转义 key 中的正则表达式特殊字符
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // 使用正负向断言来确保只替换独立的"单词"，避免部分匹配
            const regex = new RegExp(`(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'g');

            content = content.replace(regex, value);
        }

        // 计算输出路径，保持原始目录结构
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const outputPath = path.join(OUTPUT_DIR, relativePath);

        // 确保输出路径的目录存在
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    console.log('\n--- 翻译完成 ---');
    console.log(`所有文件已翻译并保存至: ${OUTPUT_DIR}`);
    console.log(`总共处理了约 ${totalLinesProcessed} 行代码。`);
    console.timeEnd('TranslationProcess'); // 结束计时
}

// 运行主函数
main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});