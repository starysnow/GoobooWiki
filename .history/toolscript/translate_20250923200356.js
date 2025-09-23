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
 * 统一翻译引擎，采用多阶段处理策略。
 * @param {string} text - 待翻译的完整文本内容。
 * @param {object} translations - 翻译字典。
 * @returns {string} - 翻译后的文本。
 */
function translateTextUnified(text, translations) {
    // 如果传入的 text 是 undefined 或 null，直接返回空字符串以防报错
    if (!text) return '';

    let translatedText = text;
    // 将字典键按长度降序排序，优先匹配长键
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    // --- 阶段一：处理特定的组合模式 ---

    // 步骤 A: 处理 currency...Cap/Gain 驼峰式组合词
    const currencyRegex = /currency([A-Z][a-zA-Z0-9]+)(Cap|Gain)/g;
    translatedText = translatedText.replace(currencyRegex, (match, coreCamelCase, suffix) => {
        const coreKey = coreCamelCase.charAt(0).toLowerCase() + coreCamelCase.slice(1);
        const suffixLower = suffix.toLowerCase();
        const suffixTranslation = suffixLower === 'gain' ? '增益' : '容量';
        if (translations[coreKey]) {
            return translations[coreKey] + suffixTranslation;
        }
        return match;
    });

    // 步骤 B: 处理 "前缀_核心内容" 格式的单词
    if (PREFIX_LIST.length > 0) {
        // 修正：使用已定义的 PREFIX_LIST
        const prefixGroup = PREFIX_LIST.join('|');
        const underscoreRegex = new RegExp(`(?<![a-zA-Z0-9_])(${prefixGroup})_([a-zA-Z0-9_]+)`, 'g');
        translatedText = translatedText.replace(underscoreRegex, (match, prefix, core) => {
            return translations[core] || match;
        });
    }

    // --- 阶段二：处理剩余的、独立的单词 ---
    for (const key of sortedKeys) {
        if (key.startsWith('mdi-')) continue;
        const value = translations[key];
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![a-zA-Z0-9_])(?<!mdi-[\\w-]*)${escapedKey}(?![a-zA-Z0-9_])`, 'gi');
        translatedText = translatedText.replace(regex, value);
    }

    return translatedText;
}

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
                    // 翻译函数前的部分
                    const textToTranslate = content.substring(lastIndex, boundary.start);
                    finalContent += translateTextUnified(textToTranslate, translations); // 使用新函数

                    // 附加原始函数部分
                    finalContent += content.substring(boundary.start, boundary.end);
                    lastIndex = boundary.end;
                }
                // 翻译最后一个函数之后的部分
                const remainingText = content.substring(lastIndex);
                finalContent += translateTextUnified(remainingText, translations); // 使用新函数
            } else {
                // 如果没有函数，则全篇翻译
                finalContent = translateTextUnified(content, translations); // 使用新函数
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