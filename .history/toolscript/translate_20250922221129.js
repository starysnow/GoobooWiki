// 参考字典的替换式翻译
// translate_files.js
const fs = require('fs-extra'); // 使用 fs-extra 方便地处理文件和目录
const path = require('path');
const glob = require('glob');

// --- 配置 ---
const SOURCE_DIR = 'js';             // 原始JS文件目录
const TRANSLATION_FILE = 'public/zh_map.json'; // 翻译字典文件
const OUTPUT_DIR = 'data/js_translated'; // 翻译后文件的输出目录

async function main() {
    console.time('TranslationProcess'); // 开始计时

    // 1. 加载翻译字典
    console.log('正在加载翻译字典...');
    let translations;
    try {
        translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
    } catch (error) {
        console.error('加载或解析 translation.json 失败:', error);
        return;
    }

    // 为了提高替换效率和避免部分匹配问题，我们按键的长度降序排序
    // 例如，优先替换 "miningDamage" 而不是 "mining"
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    console.log(`字典加载成功，共 ${translationKeys.length} 个词条。`);

    // 2. 准备输出目录
    console.log(`正在清理并创建输出目录: ${OUTPUT_DIR}`);
    await fs.emptyDir(OUTPUT_DIR);

    // 3. 查找所有源文件
    console.log('正在查找所有源JS文件...');
    const sourceFiles = glob.sync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要翻译。`);

    let totalLinesProcessed = 0;

    // 4. 遍历并处理每个文件
    for (const filePath of sourceFiles) {
        let content = await fs.readFile(filePath, 'utf-8');
        for (const key of translationKeys) {
        const value = translations[key];

        // 创建一个正则表达式，要求 key 前后不能是字母、数字或下划线
        // 这可以防止替换单词的一部分
        // 注意：我们需要对 key 中的特殊正则字符进行转义，以防万一
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'g');

        content = content.replace(regex, value);
    }

        // 计算输出路径
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const outputPath = path.join(OUTPUT_DIR, relativePath);

        // 确保输出路径的目录存在
        await fs.ensureDir(path.dirname(outputPath));

        // 写入翻译后的内容
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    console.log('\n--- 翻译完成 ---');
    console.log(`所有文件已翻译并保存至: ${OUTPUT_DIR}`);
    console.log(`总共处理了约 ${Math.round(totalLinesProcessed / 1000)}k 行代码。`);
    console.timeEnd('TranslationProcess'); // 结束计时
}

// 运行主函数
main().catch(console.error);