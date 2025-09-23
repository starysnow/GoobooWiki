// translate.js

// --- 模块导入 (已修正以兼容 ES 模块) ---
import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import { jsToLatex } from './jsToLatex.js';

// 解决 @babel/traverse 和 @babel/generator 在 ESM 中的 default 导出问题
const traverse = _traverse.default;
const generate = _generate.default;

// --- 获取 __dirname 的标准 ESM 解决方案 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const SOURCE_DIR = path.join(__dirname, '../js');
const TRANSLATION_FILE = path.join(__dirname, '../public/zh_map_flat.json');
const OUTPUT_DIR = path.join(__dirname, '../data/js_translated');

/**
 * 对已经初步翻译的内容进行二次处理，专门翻译组合词。
 * 例如，将 "currency采矿废料Gain" 转换为 "采矿废料增益"。
 * @param {string} content - 初步翻译后的代码
 * @returns {string} - 二次处理后的代码
 */
function translateCompoundWords(content) {
    // 正则表达式匹配 "currency" + "已翻译的词(包含中文)" + "Gain" 或 "Cap"
    const regex = /currency([a-zA-Z\u4e00-\u9fa5]+)(Gain|Cap)/g;
    return content.replace(regex, (match, middleWord, suffix) => {
        const suffixTranslation = suffix === 'Gain' ? '增益' : '容量';
        return `${middleWord}${suffixTranslation}`;
    });
}

async function main() {
    console.time('FullProcessTime');
    // --- 步骤 0: 初始化计数器 ---
    let successCount = 0;
    let formulaParseErrorCount = 0;
    let nonDataObjectCount = 0

    // 1. 加载字典
    console.log(`正在加载字典: ${TRANSLATION_FILE}`);
    let translations;
    try {
        if (!fs.existsSync(TRANSLATION_FILE)) {
            throw new Error(`翻译字典文件未找到: ${TRANSLATION_FILE}\n请确保已运行脚本生成扁平化字典。`);
        }
        translations = JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
    } catch (error) {
        console.error('加载或解析翻译字典失败:', error.message);
        return;
    }
    const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    console.log(`字典加载成功，共 ${translationKeys.length} 个词条。`);

    // 2. 准备输出目录
    await fs.emptyDir(OUTPUT_DIR);

    // 3. 查找所有源文件 (使用修正后的 globSync)
    const sourceFiles = globSync(`${SOURCE_DIR}/**/*.js`);
    console.log(`找到了 ${sourceFiles.length} 个文件需要处理。`);

    for (const filePath of sourceFiles) {
        let content = await fs.readFile(filePath, 'utf-8');
        let isSuccess = true; // 假设当前文件处理成功
        
        // --- 步骤 1: 预处理 - 移除 import, const 和 export default ---
        content = content.replace(/^(import|const).*?;?\s*$/gm, '');
        content = content.replace(/^export\s+default\s*/, '');
        content = content.replace(/^\s*[\r\n]/gm, '').trim();
        // 1.1 移除所有单行和多行注释
        content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        // 1.5 纠正标点错误（非常重要！）
        content = content.replace(/，/g, ',');
        content = content.replace(/）/g, ')');

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
            // 使用修正后的 babelParse，并包裹内容以确保是有效表达式
            const ast = babelParse(`(${content})`, { sourceType: 'module' });

            traverse(ast, {
                'ArrowFunctionExpression|FunctionExpression'(path) {
                    const parentKeyNode = path.parent.key;
                    // 增加健壮性检查，确保 parentKeyNode 存在且是标识符
                    if (parentKeyNode && parentKeyNode.type === 'Identifier') {
                        const parentKey = parentKeyNode.name;
                        if (['price', 'value', 'milestones', 'requirement', 'effect'].includes(parentKey)) {
                            const latexString = jsToLatex(path.node.body);
                            path.replaceWith({ type: 'StringLiteral', value: latexString });
                        }
                    }
                }
            });

            // 使用修正后的 generate
            const generatedObj = generate(ast.program.body[0].expression, { comments: false }).code;
            content = generatedObj;

        } catch (e) {
            // 增加公式解析错误计数
            formulaParseErrorCount++;
            isSuccess = false;
            errorFiles.push({ file: filePath, reason: `公式解析失败: ${e.message}` });
            console.error(`\n警告：文件 ${filePath} 的公式解析或生成失败，将保留为JS代码格式。错误: ${e.message}`);
        }

        // --- 步骤 5: 计算输出路径 (修改后缀为 .txt) 并写入文件 ---
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const pathObject = path.parse(relativePath);
        pathObject.ext = '.txt';
        delete pathObject.base;
        const newRelativePath = path.format(pathObject);
        const outputPath = path.join(OUTPUT_DIR, newRelativePath);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf-8');
    }

    console.log('\n--- 翻译与公式转换完成 ---');
    console.log(`所有文件已处理并保存至: ${OUTPUT_DIR}`);
    console.log(`❌ 公式解析失败 (已翻译但保留JS公式): ${formulaParseErrorCount}`);
    console.log(`🟡 跳过公式转换 (被识别为非数据文件): ${nonDataObjectCount}`);
    console.timeEnd('FullProcessTime');
}

main().catch(error => {
    console.error('脚本执行过程中发生致命错误:', error);
});