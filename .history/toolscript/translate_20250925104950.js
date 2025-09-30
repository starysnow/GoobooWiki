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
    'tick.js', 'autoplay.js', 'init.js', 'meta.js', 'savefile.js',
    'utils/', 'modules/patchnote/',
];
const PREFIX_LIST = [
    'event', 'farm', 'gallery', 'general', 'horde', 'migration',
    'mining', 'relic', 'school', 'treasure', 'village', 'theme'
];

function translateTextUnified(text, translations) {
    if (!text) return '';

    let translatedText = text;
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    const currencyRegex = /currency([A-Z][a-zA-Z0-9]+)(Cap|Gain)/g;
    translatedText = translatedText.replace(currencyRegex, (match, coreCamelCase, suffix) => {
        let foundKey = null;
        for (const prefix of PREFIX_LIST) {
            const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            if (coreCamelCase.startsWith(capitalizedPrefix)) {
                const potentialKeyPart = coreCamelCase.substring(prefix.length);
                if (potentialKeyPart) {
                    const finalKey = potentialKeyPart.charAt(0).toLowerCase() + potentialKeyPart.slice(1);
                    if (translations[finalKey]) {
                        foundKey = finalKey;
                        break;
                    }
                }
            }
        }
        if (!foundKey) {
            const coreKey = coreCamelCase.charAt(0).toLowerCase() + coreCamelCase.slice(1);
            if (translations[coreKey]) {
                foundKey = coreKey;
            }
        }
        if (foundKey) {
            const suffixLower = suffix.toLowerCase();
            const suffixTranslation = suffixLower === 'gain' ? '增益' : '容量';
            return translations[foundKey] + suffixTranslation;
        }
        return match;
    });

    if (PREFIX_LIST.length > 0) {
        const prefixGroup = PREFIX_LIST.join('|');
        const underscoreRegex = new RegExp(`(?<![a-zA-Z0-9_])(${prefixGroup})_([a-zA-Z0-9_]+)`, 'g');
        translatedText = translatedText.replace(underscoreRegex, (match, prefix, core) => {
            return translations[core] || match;
        });
    }

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

    await fs.emptyDir(OUTPUT_DIR);
    const sourceFiles = globSync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。\n`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);

        const fileName = path.basename(relativePath);
        if (IGNORE_LIST.some(ignorePath => {
            if (ignorePath.endsWith('/') || ignorePath.endsWith('\\')) return relativePath.startsWith(ignorePath);
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

            // --- 步骤 3: 上下文感知翻译 (恢复) ---
            const functionBoundaries = [];
            try {
                const ast = babelParse(`(${content})`, { sourceType: 'module', errorRecovery: true });
                traverse(ast, {
                    'FunctionExpression|ArrowFunctionExpression|ObjectMethod'(path) {
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
                    const textToTranslate = content.substring(lastIndex, boundary.start);
                    finalContent += translateTextUnified(textToTranslate, translations);
                    finalContent += content.substring(boundary.start, boundary.end);
                    lastIndex = boundary.end;
                }
                const remainingText = content.substring(lastIndex);
                finalContent += translateTextUnified(remainingText, translations);
            } else {
                finalContent = translateTextUnified(content, translations);
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

    // ... (总结报告部分不变)
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