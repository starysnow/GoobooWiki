// 根据字典替换
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// --- 配置 ---
// 使用 __dirname 和 path.join 确保路径在任何运行位置下都正确
const SCRIPT_DIR = __dirname;
const SOURCE_DIR = path.join(SCRIPT_DIR, '../js');
const TRANSLATION_FILE = path.join(SCRIPT_DIR, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(SCRIPT_DIR, '../data/js_translated');

/**
 * 清理 JS 文件内容，移除 import, const 声明和 export default 包装
 * @param {string} content - 原始文件内容
 * @returns {string} - 清理后的内容
 */
function cleanupContent(content) {
    let cleanedContent = content;

    // 1. 移除所有的 import 语句
    cleanedContent = cleanedContent.replace(/^import.*?;?\s*$/gm, '');

    // 2. 移除所有的顶层 const 声明 (假设它们都是工具函数引入)
    cleanedContent = cleanedContent.replace(/^const.*?;?\s*$/gm, '');

    // 3. 提取 export default {...} 中的核心对象内容
    // 这个正则表达式会匹配 "export default {" 开始，到对应的 "}" 结束的所有内容，并捕获花括号内部的部分
    const exportMatch = cleanedContent.match(/^export\s+default\s*{([\s\S]*?)}\s*;?\s*$/m);

    if (exportMatch && exportMatch) {
        // 如果匹配成功，只保留捕获组1的内容（即花括号里的内容）
        // 我们还给它加上花括号，让它成为一个完整的对象字符串
        cleanedContent = `{${exportMatch[1]}}`;
    } else {
        // 如果没有匹配到 "export default {...}" 结构，可能文件格式有变
        // 我们可以尝试移除单独的 "export default" 关键字
        cleanedContent = cleanedContent.replace(/^export\s+default\s*/, '');
    }

    // 4. 移除清理后产生的多余空行
    cleanedContent = cleanedContent.replace(/^\s*[\r\n]/gm, '').trim();

    return cleanedContent;
}


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

        // --- 清理内容 ---
        content = cleanupContent(content);

        // 计算输出路径
        const relativePath = path.relative(SOURCE_DIR, filePath);

        // 1. 解析相对路径
        const pathObject = path.parse(relativePath);

        // 2. 修改后缀名
        pathObject.ext = '.txt';

        // 3. 清除 base 属性，这样 path.format 会使用我们修改后的 name 和 ext
        delete pathObject.base;

        // 4. 重新格式化路径
        const newRelativePath = path.format(pathObject);

        // 5. 拼接最终的输出路径
        const outputPath = path.join(OUTPUT_DIR, newRelativePath);
        // 计算输出路径，保持原始目录结构
        // const relativePath = path.relative(SOURCE_DIR, filePath);
        // const outputPath = path.join(OUTPUT_DIR, relativePath);

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