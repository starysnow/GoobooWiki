// toolscript/generate_wiki_docs.js (VitePress-Ready Full Version)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 包含升级和物品数据的源JS文件
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'public',  'combined.js'); // 示例路径，请修改
// 最终生成的Markdown文件
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'database.md');
// 你的翻译词典
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');


// --- 主逻辑 ---
function main() {
    let code, translationMap;
    try {
        console.log(`读取源文件: ${SOURCE_FILE_PATH}`);
        code = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8');

        console.log(`读取翻译词典: ${TRANSLATION_MAP_PATH}`);
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
    } catch (error) {
        console.error('❌ 加载文件或词典时出错！请检查路径配置。', error);
        return;
    }

    const ast = parser.parse(code, { sourceType: 'module' });

    let wikiOutput = '# 游戏数据文档\n\n'; // VitePress 页面标题
    console.log('🚀 开始解析JS文件并生成Wiki文档...');

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            if (path.get('declaration').isObjectExpression()) {
                const topLevelNodes = path.get('declaration').get('properties');

                for (const node of topLevelNodes) {
                    if (!node.isObjectProperty()) continue;

                    const keyName = node.get('key').node.name;
                    const valueNode = node.get('value');

                    // --- 特征分析与路由 ---
                    if (valueNode.isObjectExpression()) {
                        const properties = new Set(valueNode.get('properties').map(p => p.get('key').node.name));

                        if (properties.has('price') && properties.has('effect')) {
                            console.log(`  -> 识别为 [升级项目]: ${keyName}`);
                            wikiOutput += parseUpgradeNode(node, translationMap);
                        } else if (properties.has('minZone') && properties.has('effect')) {
                            console.log(`  -> 识别为 [物品]: ${keyName}`);
                            wikiOutput += parseItemNode(node, translationMap);
                        }
                    } else if (valueNode.isFunctionExpression() || valueNode.isArrowFunctionExpression()) {
                        if (['saveGame', 'loadGame'].includes(keyName)) {
                            console.log(`  - 忽略函数: ${keyName}`);
                        }
                    }
                }
            }
        }
    });

    fs.writeFileSync(OUTPUT_FILE_PATH, wikiOutput, 'utf-8');
    console.log(`\n🎉 Wiki文档生成完毕! 已保存至: ${OUTPUT_FILE_PATH}`);
}


// --- 解析器模块 ---

/**
 * 解析【升级项目】节点
 * @param {NodePath} node - 代表升级项的 ObjectProperty 节点
 * @param {object} translationMap - 翻译词典
 * @returns {string} - Markdown 格式的字符串
 */
function parseUpgradeNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `## ${name} (升级项目)\n\n`;

    const properties = node.get('value').get('properties');

    for (const prop of properties) {
        const key = prop.get('key').node.name;
        const valueNode = prop.get('value');

        switch (key) {
            case 'cap':
                markdown += `*   **最大等级**: ${valueNode.node.value}\n`;
                break;
            case 'price':
                markdown += `*   **升级价格 (lvl代表当前等级)**:\n`;
                const priceObject = valueNode.get('body').get('properties');
                for (const priceItem of priceObject) {
                    const resourceId = priceItem.get('key').node.name;
                    const resourceName = translationMap[resourceId]?.name || resourceId;
                    const formula = astNodeToFormula(priceItem.get('value'), 'lvl');
                    markdown += `    *   ${resourceName}: \`${formula}\`\n`;
                }
                break;
            case 'effect':
                markdown += parseEffect(valueNode, translationMap);
                break;
            // 在这里添加对其他你关心的属性（如 requirement）的解析
        }
    }
    return markdown + '\n---\n\n';
}

/**
 * 解析【物品】节点
 * @param {NodePath} node - 代表物品的 ObjectProperty 节点
 * @param {object} translationMap - 翻译词典
 * @returns {string} - Markdown 格式的字符串
 */
function parseItemNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `## ${name} (物品)\n\n`;

    const properties = node.get('value').get('properties');

    for (const prop of properties) {
        const key = prop.get('key').node.name;
        const valueNode = prop.get('value');

        switch (key) {
            case 'minZone':
                if (valueNode.node.value === Infinity) {
                    markdown += `*   **最低区域**: N/A\n`;
                } else {
                    markdown += `*   **最低区域**: ${valueNode.node.value}\n`;
                }
                break;
            case 'color':
                markdown += `*   **颜色**: ${valueNode.node.value}\n`;
                break;
            case 'icon':
                markdown += `*   **图标**: \`${valueNode.node.value}\`\n`;
                break;
            case 'effect':
                markdown += parseEffect(valueNode, translationMap);
                break;
        }
    }
    return markdown + '\n---\n\n';
}

/**
 * 解析通用的 effect 属性
 * @param {NodePath} valueNode - effect 属性值的节点
 * @param {object} translationMap - 翻译词典
 * @returns {string} - Markdown 格式的字符串
 */
function parseEffect(valueNode, translationMap) {
    let markdown = `*   **效果**:\n`;
    const effectArray = valueNode.get('elements');
    for (const effectItem of effectArray) {
        const effectProps = effectItem.get('properties');
        let effectName = '', effectType = '', effectValueNode = null;

        effectProps.forEach(p => {
            const k = p.get('key').node.name;
            if (k === 'name') effectName = p.get('value').node.value;
            if (k === 'type') effectType = p.get('value').node.value;
            if (k === 'value') effectValueNode = p.get('value');
        });

        const translatedEffectName = translateEffectName(effectName, translationMap);
        const formula = astNodeToFormula(effectValueNode, '等级');

        if (effectType === 'mult') {
            markdown += `    *   ${translatedEffectName}: \`(${formula}) 倍\`\n`;
        } else {
            markdown += `    *   ${translatedEffectName}: \`${formula}\`\n`;
        }
    }
    return markdown;
}


// --- 辅助工具模块 ---

/**
 * 将AST节点转换为人类可读的数学公式字符串
 * @param {NodePath} node - AST节点
 * @param {string} varName - 变量名 (如 'lvl' 或 '等级')
 * @returns {string} - 公式字符串
 */
function astNodeToFormula(node, varName = 'lvl') {
    if (!node) return '未知';

    // 案例: 箭头函数 (lvl) => ... 或 函数 function(lvl) { return ... }
    if (node.isArrowFunctionExpression() || node.isFunctionExpression()) {
        const body = node.get('body');
        // 如果函数体直接是一个表达式，则解析它
        if (!body.isBlockStatement()) {
            return astNodeToFormula(body, varName);
        }
        // 如果是带 { return ... } 的函数体
        const returnStatement = body.get('body').find(p => p.isReturnStatement());
        if (returnStatement) {
            return astNodeToFormula(returnStatement.get('argument'), varName);
        }
    }

    // 案例: 二元表达式 ( a * b, a + b, a - b )
    if (node.isBinaryExpression()) {
        const left = astNodeToFormula(node.get('left'), varName);
        const operator = node.node.operator;
        const right = astNodeToFormula(node.get('right'), varName);
        return `${left} ${operator} ${right}`;
    }

    // 案例: 函数调用 Math.pow(a, b), Math.log(a), buildNum(a, b)
    if (node.isCallExpression()) {
        const callee = node.get('callee');
        const args = node.get('arguments');

        if (callee.matches({ object: { name: 'Math' }, property: { name: 'pow' }})) {
            const base = astNodeToFormula(args[0], varName);
            const exponent = astNodeToFormula(args[1], varName);
            return `${base}^${exponent}`;
        }
        if (callee.matches({ object: { name: 'Math' }, property: { name: 'log' }})) {
            const base = astNodeToFormula(args[0], varName);
            return `log(${base})`;
        }
        if (callee.matches({ name: 'buildNum' })) {
            const num = args[0].node.value;
            const unit = args[1].node.value;
            let multiplier = 1;
            if (unit === 'K') multiplier = 1000;
            if (unit === 'M') multiplier = 1000000;
            if (unit === 'B') multiplier = 1000000000;
            if (unit === 'T') multiplier = 1000000000000;
            // 添加更多单位...
            return (num * multiplier).toLocaleString('en-US'); // 使用 en-US 避免逗号问题
        }
    }

    // 案例: 标识符 (变量名)
    if (node.isIdentifier()) {
        return varName; // 将 'lvl' 等参数统一替换
    }

    // 案例: 数字字面量
    if (node.isNumericLiteral()) {
        return node.node.value.toString();
    }

    // 如果无法解析，返回原始代码作为备用
    const sourceCode = generate(node.node, { concise: true }).code;
    return sourceCode || '无法解析的公式';
}

/**
 * 翻译效果名称。这需要你手动维护一个词典。
 * @param {string} name - 效果的英文ID
 * @param {object} translationMap - 完整的翻译词典
 * @returns {string} - 中文名称
 */
function translateEffectName(name, translationMap) {
    // 优先从 zh_map.json 的 "mult" 或 "stat" 部分查找
    if (translationMap.mult && translationMap.mult[name]) {
        return translationMap.mult[name];
    }
    if (translationMap.stat && translationMap.stat[name]) {
        return translationMap.stat[name];
    }

    // 如果找不到，提供一个备用词典
    const fallbackDict = {
        'currencyHordeBoneCap': '骸骨上限',
        'hordeHealing': '治疗效果',
        'currencyMiningScrapCap': '废料容量',
        'currencyMiningOrePlatinumCap': '铂矿石容量',
        // 在这里添加更多在 zh_map 中找不到的翻译
    };
    return fallbackDict[name] || name;
}

// 运行主程序
main();