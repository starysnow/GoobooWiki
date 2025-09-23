import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import { jsToLatex } from './jsToLatex.js'; // 确保 jsToLatex.js 存在

const traverse = _traverse.default;
const generate = _generate.default;

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const SOURCE_DIR = path.join(__dirname, '../js');
const TRANSLATION_FILE = path.join(__dirname, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(__dirname, '../data/js_translated');
const ENABLE_LATEX_CONVERSION = false; // **新增**: 公式转换功能的开关
// 新增：忽略列表。可以是文件名、目录名或相对路径。
const IGNORE_LIST = [
    'tick.js', // 忽略指定文件
    'autoplay.js',
    'init.js',
    'meta.js',
    'utils/',       // 忽略指定目录下的所有文件
    'modules/patchnote/',
];

// 新增：需要忽略的翻译前缀列表
const PREFIX_LIST = [
    'event', 'farm', 'gallery', 'gem', 'general', 'horde', 'migration',
    'mining', 'relic', 'school', 'treasure', 'village'
];

/**
 * [已更新] 对内容进行二次处理，专门翻译组合词 (不区分大小写)
 * @param {string} content - 原始文件内容
 * @returns {string} - 二次处理后的内容
 */
function translateCompoundWords(content) {
    const regex = /currency([a-zA-Z\u4e00-\u9fa5]+)(Gain|Cap)/gi; // 'i' 标志
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

    // --- 初始化计数器 ---
    let successCount = 0;
    let formulaParseErrorCount = 0;
    let nonDataObjectCount = 0;
    const errorFiles = [];
    let filesIgnored = 0;

    // 1. 加载字典
    const translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    // 2. 准备输出目录
    await fs.emptyDir(OUTPUT_DIR);

    // 3. 查找所有源文件
    const sourceFiles = globSync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。\n`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);

         // --- 检查是否在忽略列表 ---
        const fileName = path.basename(relativePath);
        if (IGNORE_LIST.some(ignorePath => {
            // 如果忽略路径以斜杠结尾，则视为目录匹配
            if (ignorePath.endsWith('/') || ignorePath.endsWith('\\')) {
                return relativePath.startsWith(ignorePath);
            }
            // 否则，视为精确的文件名匹配
            return fileName === ignorePath;
        })) {
            filesIgnored++;
            continue;
        }

        let content = await fs.readFile(filePath, 'utf-8');
        let isSuccess = true;

        // --- 步骤 1: 预处理 - 清理源代码 ---
        content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        content = content.replace(/^(import|const).*?;?\s*$/gm, '');
        // 3. 移除上一步可能产生的空行
        content = content.replace(/^\s*[\r\n]/gm, '');
        content = content.replace(/^export\s+default\s*/, '');
        content = content.replace(/，/g, ',').trim();

        // --- 步骤 2: 常规翻译 (不区分大小写 & 排除mdi-) ---
        for (const key of translationKeys) {
            // **新增**: 排除 mdi- 图标的翻译
            // if (key.startsWith('mdi-')) {
            //     continue;
            // }

            // const value = translations[key];
            // const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // const regex = new RegExp(`(?<!mdi-[\\w-]*)(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'gi');
            // content = content.replace(regex, value);
        }

        // --- 步骤 3: 上下文感知翻译 ---
        const functionBoundaries = [];
        // A. 首先对原始的、语法正确的 JS 内容进行解析
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
            console.warn(`! 文件 ${relativePath} 原始JS无法解析AST，将进行全量文本翻译。错误: ${e.message}`);
        }

        let finalContent = '';
        // C. 然后，使用获取到的边界信息对原始文本进行分段翻译
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


        // --- 步骤 3: 组合词翻译 ---
        content = translateCompoundWords(content);

        // --- 步骤 4: 公式转换为 LaTeX (受开关控制) ---
        if (ENABLE_LATEX_CONVERSION) {
            if (content.startsWith('{') && content.endsWith('}')) {
                try {
                    const ast = babelParse(`(${content})`, { errorRecovery: true });
                    traverse(ast, {
                        'ArrowFunctionExpression|FunctionExpression'(path) {
                            const parentKeyNode = path.parent.key;
                            if (parentKeyNode && parentKeyNode.type === 'Identifier') {
                                const parentKey = parentKeyNode.name;
                                if (['price', 'value', 'milestones', 'requirement', 'effect'].includes(parentKey)) {
                                    const latexString = jsToLatex(path.node.body);
                                    path.replaceWith({ type: 'StringLiteral', value: latexString });
                                }
                            }
                        }
                    });
                    content = generate(ast.program.body[0].expression, { comments: false }).code;
                } catch (e) {
                    formulaParseErrorCount++;
                    isSuccess = false;
                    errorFiles.push({ file: filePath, reason: `公式解析失败: ${e.message}` });
                }
            } else {
                nonDataObjectCount++;
                isSuccess = false;
                errorFiles.push({ file: filePath, reason: `被识别为非数据文件，跳过公式转换` });
            }
        }

        if (isSuccess) {
            successCount++;
        }

        // --- 步骤 5: 输出 (修改后缀为 .txt) ---
        // const relativePath = path.relative(SOURCE_DIR, filePath);
        const pathObject = path.parse(relativePath);
        pathObject.ext = '.txt';
        delete pathObject.base;
        const newRelativePath = path.format(pathObject);
        const outputPath = path.join(OUTPUT_DIR, newRelativePath);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    // --- 步骤 6: 打印总结报告 ---
    console.log('\n' + '='.repeat(50));
    console.log(' ** translate.js 执行完成 - 总结报告 **');
    console.log('='.repeat(50));
    console.log(`总文件数: ${sourceFiles.length}`);
    console.log(`✅ 成功翻译的文件数: ${successCount + formulaParseErrorCount + nonDataObjectCount}`); // 总翻译数
    if (ENABLE_LATEX_CONVERSION) {
        console.log(`  - 其中完全成功 (翻译并转换公式): ${successCount}`);
        console.log(`  - 公式解析失败 (已翻译): ${formulaParseErrorCount}`);
        console.log(`  - 跳过公式转换 (非数据文件, 已翻译): ${nonDataObjectCount}`);
    }
    console.log('-'.repeat(50));

    if (errorFiles.length > 0) {
        console.log('以下文件在公式转换阶段需要关注:');
        errorFiles.forEach(({ file, reason }) => {
            console.log(`  - ${path.basename(file)}: ${reason}`);
        });
        fs.writeFileSync(path.join(OUTPUT_DIR, '_error_report.txt'), JSON.stringify(errorFiles, null, 2), 'utf-8');
        console.log(`\n详细报告已保存至: ${path.join(OUTPUT_DIR, '_error_report.txt')}`);
    }

    console.log('='.repeat(50));
    console.timeEnd('FullProcessTime');
}

main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});