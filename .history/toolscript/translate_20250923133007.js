// translate.js

/**
 * @fileoverview
 * 该脚本用于预处理和翻译源 JS 文件。
 *
 * 功能总结:
 * 1.  **扫描源文件**: 自动扫描 `js` 目录下所有 .js 文件及其子目录。
 * 2.  **忽略列表**: 新增 IGNORE_LIST 配置，可以指定文件或目录，使其在处理过程中被完全跳过。
 * 3.  **代码预处理**: 健壮地移除注释、模块语句和 `export default`。
 * 4.  **上下文感知翻译 (核心更新)**:
 *      - **不翻译函数内部**: 使用 @babel/parser 分析代码结构，精确识别函数体边界。
 *      - **分段翻译**: 只对函数体之外的代码执行翻译操作，保证函数内部逻辑的原文性。
 * 5.  **文本翻译**:
 *      - 翻译过程不区分大小写，且只匹配完整单词。
 *      - **排除 MDI 图标**: 健壮的正则表达式可防止对 `mdi-` 开头的整个字符串进行任何部分翻译。
 * 6.  **二次翻译 (组合词)**: 对 `currency...Gain/Cap` 格式的组合词进行二次处理。
 * 7.  **文件输出**: 输出为 .txt 文件到 `data/js_translated`，并保留原始目录结构。
 * 8.  **健壮性与报告**: 提供详细的执行总结和错误报告。
 */

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default;

// --- 获取 __dirname (ES 模块标准方法) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const SOURCE_DIR = path.join(__dirname, './js');
const TRANSLATION_FILE = path.join(__dirname, './public/zh_map_flat.json');
const OUTPUT_DIR = path.join(__dirname, './data/js_translated');

// 新增：忽略列表。可以是文件名、目录名或相对路径。
const IGNORE_LIST = [
    //'cardList.js', // 忽略指定文件
    'utils/',       // 忽略指定目录下的所有文件
];

/**
 * 对内容进行二次处理，专门翻译组合词 (不区分大小写)
 * @param {string} content - 原始文件内容
 * @returns {string} - 二次处理后的内容
 */
function translateCompoundWords(content) {
    const regex = /currency([a-zA-Z\u4e00-\u9fa5]+)(Gain|Cap)/gi;
    return content.replace(regex, (match, middleWord, suffix) => {
        const suffixLower = suffix.toLowerCase();
        const suffixTranslation = suffixLower === 'gain' ? '增益' : '容量';
        return `${middleWord}${suffixTranslation}`;
    });
}

/**
 * 对单个代码块执行翻译
 * @param {string} text - 要翻译的文本
 * @param {string[]} translationKeys - 排序后的字典键
 * @param {object} translations - 翻译字典
 * @returns {string} - 翻译后的文本
 */
function translateText(text, translationKeys, translations) {
    let translatedText = text;
    for (const key of translationKeys) {
        if (key.startsWith('mdi-')) continue;
        const value = translations[key];
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 更新正则表达式，防止翻译 mdi-xxx-yyy 中的一部分
        const regex = new RegExp(`(?<!mdi-[\\w-]*)(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'gi');
        translatedText = translatedText.replace(regex, value);
    }
    return translateCompoundWords(translatedText);
}


async function main() {
    console.time('FullProcessTime');

    // --- 初始化 ---
    const errorFiles = [];
    let filesProcessed = 0;
    let filesIgnored = 0;

    const translations = await fs.readJson(TRANSLATION_FILE);
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    await fs.emptyDir(OUTPUT_DIR);
    const sourceFiles = globSync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个 .js 文件需要处理。\n`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);

        // --- 步骤 1: 检查是否在忽略列表 ---
        if (IGNORE_LIST.some(ignorePath => relativePath.startsWith(ignorePath))) {
            console.log(`- 跳过忽略文件: ${relativePath}`);
            filesIgnored++;
            continue;
        }

        let content = await fs.readFile(filePath, 'utf-8');

        try {
            // --- 步骤 2: 预处理 ---
            content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            content = content.replace(/^(import|const).*?;?\s*$/gm, '');
            content = content.replace(/^\s*[\r\n]/gm, '');
            content = content.replace(/^export\s+default\s*/, '');
            content = content.replace(/，/g, ',').trim();

            if (!content) continue;

            // --- 步骤 3: 上下文感知翻译 ---
            const functionBoundaries = [];
            try {
                const ast = babelParse(content, { sourceType: 'module', errorRecovery: true });
                traverse(ast, {
                    'FunctionExpression|ArrowFunctionExpression|ObjectMethod'(path) {
                        functionBoundaries.push({ start: path.node.start, end: path.node.end });
                    }
                });
            } catch (e) {
                // 如果文件本身语法不完整，无法解析，则进行降级处理：全文件翻译
                console.warn(`! 文件 ${relativePath} 无法解析AST，将进行全量文本翻译。错误: ${e.message}`);
            }

            let finalContent = '';
            if (functionBoundaries.length > 0) {
                // 按起始位置排序
                functionBoundaries.sort((a, b) => a.start - b.start);
                let lastIndex = 0;

                for (const boundary of functionBoundaries) {
                    // 翻译函数前的部分
                    const textToTranslate = content.substring(lastIndex, boundary.start);
                    finalContent += translateText(textToTranslate, translationKeys, translations);
                    // 附加原始函数部分
                    finalContent += content.substring(boundary.start, boundary.end);
                    lastIndex = boundary.end;
                }
                // 翻译最后一个函数之后的部分
                const remainingText = content.substring(lastIndex);
                finalContent += translateText(remainingText, translationKeys, translations);
            } else {
                // 如果没有函数，则全篇翻译
                finalContent = translateText(content, translationKeys, translations);
            }
            content = finalContent;


            // --- 步骤 4: 输出 ---
            const pathObject = path.parse(relativePath);
            const newRelativePath = path.join(pathObject.dir, `${pathObject.name}.txt`);
            const outputPath = path.join(OUTPUT_DIR, newRelativePath);

            await fs.ensureDir(path.dirname(outputPath));
            await fs.writeFile(outputPath, content, 'utf-8');
            filesProcessed++;

        } catch (e) {
            errorFiles.push({ file: relativePath, reason: `处理过程中发生严重错误: ${e.message}` });
        }
    }

    // --- 步骤 5: 总结报告 ---
    console.log('\n' + '='.repeat(50));
    console.log(' ** translate.js 执行完成 - 总结报告 **');
    console.log('='.repeat(50));
    console.log(`总文件数: ${sourceFiles.length}`);
    console.log(`✅ 成功处理的文件数: ${filesProcessed}`);
    console.log(`- 已忽略的文件数: ${filesIgnored}`);
    console.log(`❌ 失败/需要关注的文件数: ${errorFiles.length}`);
    console.log('-'.repeat(50));

    if (errorFiles.length > 0) {
        console.log('以下文件在处理过程中发生错误或需要关注:');
        errorFiles.forEach(({ file, reason }) => {
            console.log(`  - ${file}: ${reason}`);
        });
        const errorReportPath = path.join(OUTPUT_DIR, '_error_report.json');
        await fs.writeJson(errorReportPath, errorFiles, { spaces: 2 });
        console.log(`\n详细报告已保存至: ${errorReportPath}`);
    }

    console.log('='.repeat(50));
    console.timeEnd('FullProcessTime');
}

main().catch(console.error);