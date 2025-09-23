// translate.js

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default;

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const SOURCE_DIR = path.join(__dirname, '../js');
const TRANSLATION_FILE = path.join(__dirname, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(__dirname, '../data/js_translated');
const IGNORE_LIST = [
    'tick.js',
    'autoplay.js',
    'init.js',
    'meta.js',
    'savefile.js',
    'utils/',
    'modules/patchnote/',
];
// 新增：需要忽略的翻译前缀列表
const PREFIX_LIST = [
    'event', 'farm', 'gallery', 'general', 'horde', 'migration',
    'mining', 'relic', 'school', 'treasure', 'village', 'theme'
];

/**
 * 对内容进行二次处理，专门翻译组合词 (不区分大小写)
 */
// function translateCompoundWords(content) {
//     const regex = /currency([a-zA-Z\u4e00-\u9fa5]+)(Gain|Cap)/gi;
//     return content.replace(regex, (match, middleWord, suffix) => {
//         const suffixLower = suffix.toLowerCase();
//         const suffixTranslation = suffixLower === 'gain' ? '增益' : '容量';
//         return `${middleWord}${suffixTranslation}`;
//     });
// }

/**
 * 统一翻译引擎，采用多阶段处理策略。
 * @param {string} text - 待翻译的完整文本内容。
 * @param {object} translations - 翻译字典。
 * @returns {string} - 翻译后的文本。
 */
function translateCompoundWords(text, translations) {
    let translatedText = text;
    // 将字典键按长度降序排序，优先匹配长键
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    // --- 阶段一：处理特定的组合模式 ---

    // 步骤 A: 处理 currency...Cap/Gain 驼峰式组合词
    // 例如: currencyMiningOreTinCap -> 查找 miningOreTin -> 锡矿石容量
    const currencyRegex = /currency([A-Z][a-zA-Z0-9]+)(Cap|Gain)/g;
    translatedText = translatedText.replace(currencyRegex, (match, coreCamelCase, suffix) => {
        // 将核心部分从 "MiningOreTin" 转换为 "miningOreTin" 以匹配字典键
        const coreKey = coreCamelCase.charAt(0).toLowerCase() + coreCamelCase.slice(1);

        const suffixLower = suffix.toLowerCase();
        const suffixTranslation = suffixLower === 'gain' ? '增益' : '容量';

        // 如果核心部分的键存在于字典中，则进行翻译
        if (translations[coreKey]) {
            return translations[coreKey] + suffixTranslation;
        }

        // 如果在字典中找不到，返回原文以避免破坏代码
        return match;
    });

    // 步骤 B: 处理 "前缀_核心内容" 格式的单词
    // 例如: mining_deeprock -> 查找 deeprock -> 深岩
    if (UNDERSCORE_PREFIXES.length > 0) {
        const prefixGroup = UNDERSCORE_PREFIXES.join('|');
        const underscoreRegex = new RegExp(`(?<![a-zA-Z0-9_])(${prefixGroup})_([a-zA-Z0-9_]+)`, 'g');
        translatedText = translatedText.replace(underscoreRegex, (match, prefix, core) => {
            // 如果核心部分存在于字典中，直接返回其翻译
            return translations[core] || match;
        });
    }

    // --- 阶段二：处理剩余的、独立的单词 ---
    for (const key of sortedKeys) {
        // 跳过 mdi 图标的键
        if (key.startsWith('mdi-')) continue;

        const value = translations[key];
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 正则表达式确保只匹配完整的单词，并避免部分匹配 mdi- 图标
        const regex = new RegExp(`(?<![a-zA-Z0-9_])(?<!mdi-[\\w-]*)${escapedKey}(?![a-zA-Z0-9_])`, 'gi');
        translatedText = translatedText.replace(regex, value);
    }

    return translatedText;
}

/**
 * 新增: 翻译带有特定前缀的文本
 * 例如, 通过查找 "rock" 来翻译 "mining_rock"
 */
function translatePrefixedText(text, translations) {
    // if (PREFIX_LIST.length === 0) return text;

    // const prefixGroup = PREFIX_LIST.join('|');
    // const regex = new RegExp(`(?<![a-zA-Z0-9_])(${prefixGroup})_([a-zA-Z0-9_]+)`, 'g');

    // return text.replace(regex, (match, prefix, word) => {
    //     if (translations[word]) {
    //         return translations[word];
    //     }
    //     return match;
    });
}

/**
 * 对单个代码块执行常规翻译 (无前缀)
 */
// function translateText(text, translationKeys, translations) {
//     let translatedText = text;
//     for (const key of translationKeys) {
//         if (key.startsWith('mdi-')) continue;
//         const value = translations[key];
//         const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//         const regex = new RegExp(`(?<!mdi-[\\w-]*)(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'gi');
//         translatedText = translatedText.replace(regex, value);
//     }
//     // 组合词翻译作为最后一步
//     return translateCompoundWords(translatedText,translations);
// }

async function main() {
    console.time('FullProcessTime');

    const errorFiles = [];
    let filesProcessed = 0;
    let filesIgnored = 0;

    const translations = await fs.readJson(TRANSLATION_FILE);
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    await fs.emptyDir(OUTPUT_DIR);
    const sourceFiles = globSync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。\n`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);

        const fileName = path.basename(relativePath);
        if (IGNORE_LIST.some(ignorePath => {
            if (ignorePath.endsWith('/') || ignorePath.endsWith('\\')) {
                return relativePath.startsWith(ignorePath);
            }
            return fileName === ignorePath;
        })) {
            filesIgnored++;
            continue;
        }

        let content = await fs.readFile(filePath, 'utf-8');

        try {
            content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            content = content.replace(/^(import|const).*?;?\s*$/gm, '');
            content = content.replace(/^\s*[\r\n]/gm, '');
            content = content.replace(/^export\s+default\s*/, '');
            content = content.replace(/，/g, ',').trim();

            if (!content) continue;

            const functionBoundaries = [];
            try {
                // 关键修正: 将内容包裹在括号中以作为表达式解析
                const ast = babelParse(`(${content})`, { sourceType: 'module', errorRecovery: true });
                traverse(ast, {
                    'FunctionExpression|ArrowFunctionExpression|ObjectMethod'(path) {
                        // 修正: `( ... )` 会给 AST 增加一个额外的 ExpressionStatement 层
                        const node = path.node.extra?.parenthesized ? path.parent : path.node;
                        functionBoundaries.push({ start: node.start, end: node.end });
                    }
                });
            } catch (e) {
                errorFiles.push({ file: relativePath, reason: `原始JS无法解析AST: ${e.message}` });
                continue;
            }

            let finalContent = '';
            if (functionBoundaries.length > 0) {
                functionBoundaries.sort((a, b) => a.start - b.start);
                let lastIndex = 0;
                for (const boundary of functionBoundaries) {
                    let textToTranslate = content.substring(lastIndex, boundary.start);
                    textToTranslate = translatePrefixedText(textToTranslate, translations);
                    finalContent += translateCompoundWords(textToTranslate, translationKeys, translations);
                    finalContent += content.substring(boundary.start, boundary.end);
                    lastIndex = boundary.end;
                }
                let remainingText = content.substring(lastIndex);
                remainingText = translatePrefixedText(remainingText, translations);
                finalContent += translateCompoundWords(remainingText, translationKeys, translations);
            } else {
                let textToTranslate = content;
                textToTranslate = translatePrefixedText(textToTranslate, translations);
                finalContent = translateCompoundWords(textToTranslate, translationKeys, translations);
            }
            content = finalContent;

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

main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});