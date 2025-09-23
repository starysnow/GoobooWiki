// 参考字典的替换式翻译
// translate_files.js
const fs = require('fs-extra'); // 使用 fs-extra 方便地处理文件和目录
const path = require('path');
const glob = require('glob');

// --- 配置 ---
const SOURCE_DIR = './game-data';             // 原始JS文件目录
const TRANSLATION_FILE = './translation.json'; // 翻译字典文件
const OUTPUT_DIR = './game-data-translated'; // 翻译后文件的输出目录

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
        totalLinesProcessed += content.split('\n').length;

        // 对文件内容进行全局替换
        for (const key of translationKeys) {
            // 使用正则表达式进行全局、独立的单词替换
            // new RegExp(`\\b${key}\\b`, 'g') 会匹配完整的单词 `key`
            // 但考虑到 key 可能是 "barAluminium" 这样的驼峰命名，直接字符串替换可能更安全
            // 我们需要确保不会错误地替换一个单词的一部分
            // 例如，避免将 "currencyMiningScrapGain" 中的 "currency" 替换掉
            // 最安全的方式是只替换作为属性键或特定上下文中的词
            // 但根据您的需求，似乎是全局替换，这里我们先用简单的字符串替换
            const value = translations[key];
            content = content.split(key).join(value); // 比正则的全局替换更快
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