// toolscript/generate_latex_docs.js (最终健壮版)
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

const SOURCE_DIR = path.resolve(__dirname, '..', 'js');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

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

async function main() {
    console.log('🚀 开始生成LaTeX格式的Wiki文档...');

    let translationMap;
    try {
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
    } catch (error) {
        console.error('❌ 无法加载翻译词典！', error); return;
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const allSourceFiles = getAllFiles(SOURCE_DIR).filter(file => path.extname(file) === '.js');
    console.log(`📂 在源目录及其子目录中找到 ${allSourceFiles.length} 个 JS 文件，开始处理...`);

    for (const filePath of allSourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const outputFilePath = path.join(OUTPUT_DIR, relativePath.replace('.js', '.md'));

        console.log(`--- 正在处理: ${relativePath} ---`);

        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const ast = parser.parse(code, { sourceType: 'module', plugins: ["objectRestSpread"] });

            let markdownContent = '';

            traverse(ast, {
                ExportDefaultDeclaration(path) {
                    const declaration = path.get('declaration');

                    // 【核心修正】我们现在处理两种情况
                    // 情况1: export default { entry1: {...}, entry2: {...} }
                    if (declaration.isObjectExpression()) {
                        const topLevelNodes = declaration.get('properties');

                        // 判断是否是多条目文件 (像 equipment.js)
                        // 启发式判断：如果第一个属性的值是一个对象，我们就认为是多条目
                        const isMultiEntry = topLevelNodes.length > 0 &&
                                           topLevelNodes[0].isObjectProperty() &&
                                           topLevelNodes[0].get('value').isObjectExpression();

                        if (isMultiEntry) {
                            console.log(`    ->识别为 [多条目文件]`);
                            for (const node of topLevelNodes) {
                                if (node.isObjectProperty()) {
                                    markdownContent += parseEntryNode(node, translationMap);
                                }
                            }
                        } else {
                            // 情况2: export default { price: 6000, ... } (像 cherry.js)
                            console.log(`    ->识别为 [单实体文件]`);
                            const moduleName = path.basename(filePath, '.js');
                            const title = translationMap[moduleName]?.name || moduleName;
                            markdownContent += `## ${title}\n\n\`ID: ${moduleName}\`\n\n`;
                            markdownContent += renderProperties(topLevelNodes, translationMap);
                        }
                    } else {
                        console.log(`    ⚠️ 在 ${relativePath} 中导出的不是对象字面量，已跳过。`);
                    }
                }
            });

            if (markdownContent) {
                fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
                const formattedMarkdown = prettier.format(markdownContent, { parser: 'markdown' });
                fs.writeFileSync(outputFilePath, formattedMarkdown, 'utf-8');
                console.log(`    ✅ 已生成文档: ${outputFilePath}`);
            } else {
                console.log(`    ⚠️ 在 ${relativePath} 中未找到可导出的数据，已跳过。`);
            }
        } catch (error) {
            console.error(`    ❌ 处理文件 ${relativePath} 时出错:`, error.message.split('\n')[0]);
        }
    }
    console.log(`\n🎉 任务完成！所有文档已生成至目录: ${OUTPUT_DIR}`);
}

/**
 * 解析多条目文件中的单个条目
 */
function parseEntryNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `### ${name} \n\n\`ID: ${id}\`\n\n`; // 多条目文件使用三级标题

    const valueNode = node.get('value');
    if (valueNode.isObjectExpression()) {
        markdown += renderProperties(valueNode.get('properties'), translationMap);
    }

    return markdown + '\n---\n\n';
}

/**
 * 递归地将属性渲染为Markdown列表
 */
function renderProperties(props, translationMap, indent = '') {
    let md = '';
    if (!Array.isArray(props)) return '';

    for (const prop of props) {
        if (!prop.isObjectProperty()) continue;

        let key = prop.get('key').node.name || prop.get('key').node.value; // 处理标识符键和字符串键
        const translatedKey = translateEffectName(key, translationMap);
        const valueNode = prop.get('value');

        md += `${indent}*   **${translatedKey}**: `;

        if (valueNode.isFunctionExpression() || valueNode.isArrowFunctionExpression()) {
            md += `$$ ${astNodeToLatex(valueNode)} $$\n`;
        } else if (valueNode.isObjectExpression()) {
            md += `\n` + renderProperties(valueNode.get('properties'), translationMap, indent + '    ');
        } else if (valueNode.isArrayExpression()) {
            md += `\n` + renderArray(valueNode.get('elements'), translationMap, indent + '    ');
        } else {
            md += `\`${generate(valueNode.node).code}\`\n`;
        }
    }
    return md;
}

function renderArray(elements, translationMap, indent = '') {
    let md = '';
    elements.forEach((elem, index) => {
        md += `${indent}*   **项 ${index + 1}**:\n`;
        if (elem.isObjectExpression()) {
            md += renderProperties(elem.get('properties'), translationMap, indent + '    ');
        } else {
             md += `${indent}    * \`${generate(elem.node).code}\`\n`;
        }
    });
    return md;
}

/**
 * 将AST节点转换为LaTeX公式字符串
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
        if (params.length > 0) {
            return `f(${params.join(', ')}) = ${astNodeToLatex(bodyNode)}`;
        }
        return astNodeToLatex(bodyNode);
    }

    if (node.isCallExpression()) {
        const callee = node.get('callee');
        const args = node.get('arguments');

        if (callee.matches({ name: 'buildNum' })) {
            const num = args[0].node.value;
            const unit = args[1].node.value;
            return `${num}${unit}`;
        }
        // ... (其他函数处理)
    }

    // ... (其他 astNodeToLatex 的逻辑不变)
    if (node.isObjectExpression()) {
        const props = node.get('properties').map(p => {
             const key = p.get('key').node.name;
             const val = astNodeToLatex(p.get('value'));
             return `${key}: ${val}`;
        });
        return `\\{ ${props.join(', ')} \\}`;
    }
    if (node.isArrayExpression()) {
        const elems = node.get('elements').map(e => astNodeToLatex(e));
        return `[ ${elems.join(', ')} ]`;
    }
    if (node.isBinaryExpression()) {
        const left = astNodeToLatex(node.get('left'));
        const right = astNodeToLatex(node.get('right'));
        const op = node.node.operator;
        if (op === '*') return `${left} \\cdot ${right}`;
        if (op === '/') return `\\frac{${left}}{${right}}`;
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
        const calleeName = generate(callee.node).code;
        return `${calleeName}(${args.join(', ')})`;
    }
    if (node.isIdentifier()) return node.node.name;
    if (node.isNumericLiteral()) return node.node.value.toString();
    return generate(node.node).code;
}

/**
 * 翻译属性和效果名称
 */
function translateEffectName(name, translationMap) {
    const sections = ['mult', 'stat', 'gooboo', 'unlock', 'idea', 'etc'];
    for (const section of sections) {
        if (translationMap[section] && translationMap[section][name]) {
            return translationMap[section][name];
        }
    }
    const fallbackDict = { 'price': '价格', 'light': '亮色主题', 'dark': '暗色主题', 'primary': '主要颜色' /* ... */ };
    return fallbackDict[name] || name;
}

main();