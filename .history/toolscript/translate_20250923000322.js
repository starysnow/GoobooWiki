// translate.js
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { fileURLToPath } from 'url';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { jsToLatex } from './jsToLatex.js';

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 (已根据您的代码修正) ---
const SOURCE_DIR = path.join(__dirname, '../js');
const TRANSLATION_FILE = path.join(__dirname, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(__dirname, '../data/js_translated');

/**
 * 对已经初步翻译的内容进行二次处理，专门翻译组合词
 * @param {string} content - 初步翻译后的代码
 * @returns {string} - 二次处理后的代码
 */
function translateCompoundWords(content) {
    let newContent = content;
    // 正则表达式匹配 "currency" + "已翻译的词" + "Gain" 或 "Cap"
    // \u4e00-\u9fa5 匹配所有中文字符
    const regex = /currency([a-zA-Z\u4e00-\u9fa5]+)(Gain|Cap)/g;

    newContent = newContent.replace(regex, (match, middleWord, suffix) => {
        const suffixTranslation = suffix === 'Gain' ? '增益' : '容量';
        return `${middleWord}${suffixTranslation}`;
    });
    return newContent;
}

async function main() {
    console.time('FullProcessTime');

    // 1. 加载字典
    console.log(`正在加载字典: ${TRANSLATION_FILE}`);
    const translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    console.log(`字典加载成功，共 ${translationKeys.length} 个词条。`);

    // 2. 准备输出目录
    await fs.emptyDir(OUTPUT_DIR);

    // 3. 查找所有源文件
    const sourceFiles = glob.sync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。`);

    for (const filePath of sourceFiles) {
        let content = await fs.readFile(filePath, 'utf-8');

        // --- 步骤 1: 预处理 - 移除 import, const 和 export default ---
        // 移除 import 和 const
        content = content.replace(/^(import|const).*?;?\s*$/gm, '');
        // 只移除 export default 关键字
        content = content.replace(/^export\s+default\s*/, '');
        // 移除多余空行
        content = content.replace(/^\s*[\r\n]/gm, '').trim();

        // --- 步骤 2: 常规翻译 ---
        for (const key of translationKeys) {
            const value = translations[key];
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?<![a-zA-Z0-9_])${escapedKey}(?![a-zA-Z0-9_])`, 'g');
            content = content.replace(regex, value);
        }

        // --- 步骤 3: 组合词翻译 ---
        content = translateCompoundWords(content);

        // --- 步骤 4: 公式转换为 LaTeX ---
        try {
            // 在解析前，需要确保代码是一个有效的JS表达式，我们给它包裹一下
            const ast = parser.parse(`(${content})`, { sourceType: 'module' });

            traverse.default(ast, {
                'ArrowFunctionExpression|FunctionExpression'(path) {
                    const parentKey = path.parent.key?.name;
                    if (['price', 'value', 'milestones', 'requirement'].includes(parentKey)) {
                        const latexString = jsToLatex(path.node.body);
                        path.replaceWith({ type: 'StringLiteral', value: latexString });
                    }
                }
            });

            const generatedObj = generate.default(ast.program.body[0].expression, { comments: false }).code;
            content = generatedObj;

        } catch (e) {
            console.error(`\n警告：文件 ${filePath} 的公式解析或生成失败，将保留为JS代码格式。错误: ${e.message}`);
            // 如果解析失败，content 保持为已翻译但未转换公式的状态
        }

        // --- 步骤 5: 计算输出路径 (修改后缀为 .txt) 并写入文件 ---
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const pathObject = path.parse(relativePath);
        pathObject.ext = '.txt'; // 修改后缀
        delete pathObject.base;
        const newRelativePath = path.format(pathObject);
        const outputPath = path.join(OUTPUT_DIR, newRelativePath);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    console.log('\n--- 翻译与公式转换完成 ---');
    console.log(`所有文件已处理并保存至: ${OUTPUT_DIR}`);
    console.timeEnd('FullProcessTime');
}

main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});