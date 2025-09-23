// toolscript/generate_latex_docs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;
import prettier from 'prettier';

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 源JS文件所在的根目录
const SOURCE_DIR = path.resolve(__dirname, '..', 'js', 'modules'); // 示例：处理 js/modules 目录
// 翻译后的Markdown文件将输出到这个新目录
const OUTPUT_DIR = path.resolve(__dirname, '..', 'wiki_docs');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

// 包含升级和物品数据的源JS文件

const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'public',  'combined.js'); // 示例路径，请修改

// 最终生成的Markdown文件

const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'database.md');

// 你的翻译词典


function getAllFiles(dirPath) {
    let allFiles = [];
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                allFiles = allFiles.concat(getAllFiles(fullPath));
            } else {
                allFiles.push(fullPath);
            }
        }
    } catch (e) { /* 忽略 */ }
    return allFiles;
}

// --- 主逻辑 ---
async function main() {
    console.log('🚀 开始生成LaTeX格式的Wiki文档...');

    let translationMap;
    try {
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
    } catch (error) {
        console.error('❌ 无法加载翻译词典！', error); return;
    }

    // 确保输出目录存在
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const allSourceFiles = getAllFiles(SOURCE_DIR).filter(file => path.extname(file) === '.js');
    console.log(`📂 在源目录及其子目录中找到 ${allSourceFiles.length} 个 JS 文件，开始处理...`);

    for (const filePath of allSourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const outputFilePath = path.join(OUTPUT_DIR, relativePath.replace('.js', '.md'));
        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

        console.log(`--- 正在处理: ${relativePath} ---`);

        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const ast = parser.parse(code, { sourceType: 'module' });

            let markdownContent = '';

            traverse(ast, {
                ExportDefaultDeclaration(path) {
                    if (path.get('declaration').isObjectExpression()) {
                        const topLevelNodes = path.get('declaration').get('properties');

                        for (const node of topLevelNodes) {
                            if (node.isObjectProperty()) {
                                markdownContent += parseGenericNode(node, translationMap);
                            }
                        }
                    }
                }
            });

            if (markdownContent) {
                // 使用 Prettier 格式化 Markdown，使其更美观
                const formattedMarkdown = prettier.format(markdownContent, { parser: 'markdown' });
                fs.writeFileSync(outputFilePath, formattedMarkdown, 'utf-8');
                console.log(`    ✅ 已生成文档: ${outputFilePath}`);
            } else {
                console.log(`    ⚠️ 在 ${relativePath} 中未找到可导出的数据，已跳过。`);
            }
        } catch (error) {
            console.error(`    ❌ 处理文件 ${relativePath} 时出错:`, error);
        }
    }
    console.log(`\n🎉 任务完成！所有文档已生成至目录: ${OUTPUT_DIR}`);
}

/**
 * 通用节点解析器
 * @param {NodePath} node - 代表任意条目的 ObjectProperty 节点
 * @param {object} translationMap - 翻译词典
 * @returns {string} - Markdown 格式的字符串
 */
function parseGenericNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `## ${name} \n\n\`ID: ${id}\`\n\n`; // 显示中文名和英文ID

    const properties = node.get('value').get('properties');

    // 递归地将对象的每一层都渲染为列表
    function renderProperties(props, indent = '') {
        let md = '';
        for (const prop of props) {
            if (!prop.isObjectProperty()) continue;

            const key = prop.get('key').node.name;
            const translatedKey = translateEffectName(key, translationMap); // 翻译属性名
            const valueNode = prop.get('value');

            md += `${indent}*   **${translatedKey}**: `;

            if (valueNode.isFunctionExpression() || valueNode.isArrowFunctionExpression()) {
                md += `$$ ${astNodeToLatex(valueNode)} $$`; // 函数渲染为LaTeX公式块
            } else if (valueNode.isObjectExpression()) {
                md += `\n` + renderProperties(valueNode.get('properties'), indent + '    ');
            } else if (valueNode.isArrayExpression()) {
                md += `\n` + renderArray(valueNode.get('elements'), indent + '    ');
            } else {
                md += `\`${generate(valueNode.node).code}\`\n`; // 其他简单值直接显示代码
            }
        }
        return md;
    }

    function renderArray(elements, indent = '') {
        let md = '';
        elements.forEach((elem, index) => {
            md += `${indent}*   **项 ${index + 1}**:\n`;
            if (elem.isObjectExpression()) {
                md += renderProperties(elem.get('properties'), indent + '    ');
            } else {
                 md += `${indent}    * \`${generate(elem.node).code}\`\n`;
            }
        });
        return md;
    }

    markdown += renderProperties(properties);
    return markdown + '\n---\n\n';
}

/**
 * 将AST节点转换为LaTeX公式字符串
 * @param {NodePath} node - AST节点
 * @returns {string} - LaTeX 字符串
 */
function astNodeToLatex(node) {
    if (!node) return '?';

    if (node.isArrowFunctionExpression() || node.isFunctionExpression()) {
        const params = node.get('params').map(p => p.node.name);
        let bodyNode = node.get('body');
        if (bodyNode.isBlockStatement()) {
            const returnStatement = bodyNode.get('body').find(p => p.isReturnStatement());
            if (returnStatement) bodyNode = returnStatement.get('argument');
        }
        // 如果有参数，显示为函数形式，例如 f(lvl) = ...
        if (params.length > 0) {
            return `f(${params.join(', ')}) = ${astNodeToLatex(bodyNode)}`;
        }
        return astNodeToLatex(bodyNode);
    }

    if (node.isObjectExpression()) {
        const props = node.get('properties').map(p => {
             const key = p.get('key').node.name;
             const val = astNodeToLatex(p.get('value'));
             return `${key}: ${val}`;
        });
        return `\\{ ${props.join(', ')} \\}`; // LaTeX中的对象表示
    }

    if (node.isArrayExpression()) {
        const elems = node.get('elements').map(e => astNodeToLatex(e));
        return `[ ${elems.join(', ')} ]`;
    }

    if (node.isBinaryExpression()) {
        const left = astNodeToLatex(node.get('left'));
        const right = astNodeToLatex(node.get('right'));
        const op = node.node.operator;

        if (op === '*') return `${left} \\cdot ${right}`; // 乘法
        if (op === '/') return `\\frac{${left}}{${right}}`; // 分数
        return `${left} ${op} ${right}`;
    }

    if (node.isCallExpression()) {
        const callee = node.get('callee');
        const args = node.get('arguments').map(arg => astNodeToLatex(arg));

        if (callee.matches({ object: { name: 'Math' }, property: { name: 'pow' }})) {
            return `{${args[0]}}^{${args[1]}}`;
        }
        if (callee.matches({ object: { name: 'Math' }, property: { name: 'log' }})) {
            return `\\log{(${args[0]})}`;
        }
        if (callee.matches({ name: 'buildNum' })) {
            const num = node.get('arguments')[0].node.value;
            const unit = node.get('arguments')[1].node.value;
            let multiplier = 1;
            if (unit === 'K') multiplier = 1e3;
            if (unit === 'M') multiplier = 1e6;
            if (unit === 'B') multiplier = 1e9;
            if (unit === 'T') multiplier = 1e12;
            return (num * multiplier).toExponential(0).replace('e+', ' \\times 10^{') + '}'; // 科学记数法
        }
        const calleeName = generate(callee.node).code;
        return `${calleeName}(${args.join(', ')})`; // 其他函数
    }

    if (node.isIdentifier()) return node.node.name;
    if (node.isNumericLiteral()) return node.node.value.toString();

    return generate(node.node).code;
}

/**
 * 翻译属性和效果名称
 */
function translateEffectName(name, translationMap) {
    // 这是一个统一的查找函数
    const sections = ['mult', 'stat', 'gooboo', 'unlock', 'idea', 'etc']; // 添加所有可能的顶级翻译分类
    for (const section of sections) {
        if (translationMap[section] && translationMap[section][name]) {
            return translationMap[section][name];
        }
    }
    // 备用词典
    const fallbackDict = { 'hordeAttack': '部落攻击', 'hordeHealth': '部落生命值', /* ... */ };
    return fallbackDict[name] || name;
}

main();