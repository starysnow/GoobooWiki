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
    'utils/',
    'modules/patchnote/',
];

/**
 * 对内容进行二次处理，专门翻译组合词 (不区分大小写)
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
 */
function translateText(text, translationKeys, translations) {
    let translatedText = text;
    for (const key of translationKeys) {
        if (key.startsWith('mdi-')) continue;
        const value = translations[key];
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。\n`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);

        // --- 步骤 1: 检查是否在忽略列表 ---
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
            // --- 步骤 2: 预处理 - 清理源代码 ---
            content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            content = content.replace(/^(import|const).*?;?\s*$/gm, '');
            content = content.replace(/^\s*[\r\n]/gm, '');
            content = content.replace(/^export\s+default\s*/, '');
            content = content.replace(/，/g, ',').trim();

            if (!content) continue;

            // --- 步骤 3: 上下文感知翻译 (正确的逻辑顺序) ---
            const functionBoundaries = [];
            // A. 首先对【干净但未翻译的】JS 内容进行解析
            try {
                const ast = babelParse(content, { sourceType: 'module', errorRecovery: true });
                // B. 从合法的 AST 中安全地获取函数边界
                traverse(ast, {
                    'FunctionExpression|ArrowFunctionExpression|ObjectMethod'(path) {
                        functionBoundaries.push({ start: path.node.start, end: path.node.end });
                    }
                });
            } catch (e) {
                // 这种情况很少发生，除非原始JS文件本身就有严重语法错误
                errorFiles.push({ file: relativePath, reason: `原始JS无法解析AST，已跳过: ${e.message}` });
                continue; // 跳过此文件
            }

            // C. 然后，使用获取到的边界信息对原始文本进行分段翻译
            let finalContent = '';
            if (functionBoundaries.length > 0) {
                functionBoundaries.sort((a, b) => a.start - b.start);
                let lastIndex = 0;
                for (const boundary of functionBoundaries) {
                    const textToTranslate = content.substring(lastIndex, boundary.start);
                    finalContent += translateText(textToTranslate, translationKeys, translations);
                    finalContent += content.substring(boundary.start, boundary.end);
                    lastIndex = boundary.end;
                }
                const remainingText = content.substring(lastIndex);
                finalContent += translateText(remainingText, translationKeys, translations);
            } else {
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

main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});