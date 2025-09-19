// toolscript/generate_wiki_docs.js (VitePress-Ready Version)
import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default; // 修正导入
import _generate from '@babel/generator';
const generate = _generate.default; // 修正导入

// --- 配置 ---
// ... (您的文件路径配置)
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'path/to/your/data-file.js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'wiki_output.md');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public/zh_map.json');

// --- 主逻辑 ---
function main() {
    const code = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8');
    const translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));

    const ast = parser.parse(code, { sourceType: 'module' });

    let wikiOutput = '# 游戏数据文档\n\n'; // VitePress 页面标题

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            if (path.get('declaration').isObjectExpression()) {
                const topLevelNodes = path.get('declaration').get('properties');

                for (const node of topLevelNodes) {
                    // 我们只处理对象的属性，跳过...展开语法等
                    if (!node.isObjectProperty()) continue;

                    const keyName = node.get('key').node.name;
                    const valueNode = node.get('value');

                    // --- 特征分析与路由 ---
                    if (valueNode.isObjectExpression()) {
                        const properties = new Set(valueNode.get('properties').map(p => p.get('key').node.name));
                        if (properties.has('price') && properties.has('effect')) {
                            wikiOutput += parseUpgradeNode(node, translationMap);
                        } else if (properties.has('minZone') && properties.has('effect')) {
                            wikiOutput += parseItemNode(node, translationMap);
                        }
                    } else if (valueNode.isFunctionExpression() || valueNode.isArrowFunctionExpression()) {
                        // 如果是 saveGame 等函数，则直接跳过
                        if (['saveGame', 'loadGame' /* 其他要忽略的函数 */].includes(keyName)) {
                            console.log(`- 忽略函数: ${keyName}`);
                        }
                    }
                }
            }
        }
    });

    fs.writeFileSync(OUTPUT_FILE_PATH, wikiOutput, 'utf-8');
    console.log(`🎉 Wiki文档生成完毕: ${OUTPUT_FILE_PATH}`);
}

// --- 解析器模块 ---

/**
 * 解析【升级项目】节点
 */
function parseUpgradeNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `## ${name} (Upgrade)\n\n`; // 使用二级标题

    // ... (这里可以复用上一版回答中的 parseUpgradeNode 逻辑)
    // ... (处理 cap, requirement, price, effect 等)
    // ... 为了简洁，这里省略，请参考上一个回答的具体实现

    const properties = node.get('value').get('properties');
    for (const prop of properties) {
        const key = prop.get('key').node.name;
        const valueNode = prop.get('value');
        if (key === 'price') {
             markdown += `**升级价格 (lvl代表当前等级)**:\n`;
             const priceObject = valueNode.get('body').get('properties');
             for (const priceItem of priceObject) {
                 const resourceId = priceItem.get('key').node.name;
                 const resourceName = translationMap[resourceId]?.name || resourceId;
                 const formula = astNodeToFormula(priceItem.get('value'));
                 markdown += `* ${resourceName}: \`${formula}\`\n`;
             }
        }
        // ... 其他属性
    }

    return markdown + '\n---\n\n'; // 使用分隔线
}

/**
 * 解析【物品】节点
 */
function parseItemNode(node, translationMap) {
    const id = node.get('key').node.name;
    const name = translationMap[id]?.name || id;
    let markdown = `## ${name} (Item)\n\n`; // 使用二级标题

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
                markdown += `*   **效果**:\n`;
                const effectArray = valueNode.get('elements');
                for (const effectItem of effectArray) {
                    const effectProps = effectItem.get('properties');
                    let effectName = '', effectType = '', effectValueNode = null;

                    effectProps.forEach(p => {
                        if (p.get('key').node.name === 'name') effectName = p.get('value').node.value;
                        if (p.get('key').node.name === 'type') effectType = p.get('value').node.value;
                        if (p.get('key').node.name === 'value') effectValueNode = p.get('value');
                    });

                    const translatedEffectName = translateEffectName(effectName);
                    const formula = astNodeToFormula(effectValueNode, 'lvl');

                    if (effectType === 'mult') {
                        markdown += `    *   ${translatedEffectName}: \`(${formula}) 倍\`\n`;
                    } else {
                        markdown += `    *   ${translatedEffectName}: \`${formula}\`\n`;
                    }
                }
                break;
        }
    }
    return markdown + '\n---\n\n'; // 使用分隔线
}


// --- 辅助工具模块 ---

/**
 * 将AST节点转换为数学公式 (这里可以复用上一版的)
 * 新增对 Math.log 的处理
 */
function astNodeToFormula(node, varName = 'lvl') {
    if (!node) return '未知';
    if (node.isArrowFunctionExpression()) {
        return astNodeToFormula(node.get('body'), varName);
    }
    if (node.isBinaryExpression()) {
        const left = astNodeToFormula(node.get('left'), varName);
        const right = astNodeToFormula(node.get('right'), varName);
        return `${left} ${node.node.operator} ${right}`;
    }
    if (node.isCallExpression()) {
        const callee = node.get('callee');
        const args = node.get('arguments');
        if (callee.matches({ object: { name: 'Math' }, property: { name: 'pow' }})) {
            return `${astNodeToFormula(args[0], varName)}^${astNodeToFormula(args[1], varName)}`;
        }
        // 新增：处理 Math.log
        if (callee.matches({ object: { name: 'Math' }, property: { name: 'log' }})) {
            return `log(${astNodeToFormula(args[0], varName)})`;
        }
        // ... (其他函数如 buildNum)
    }
    if (node.isIdentifier()) return varName;
    if (node.isNumericLiteral()) return node.node.value.toString();
    return node.getSource() || '无法解析';
}

// 效果名称翻译词典
function translateEffectName(name) {
    const dict = {
        'currencyHordeBoneCap': '骸骨上限',
        'hordeHealing': '治疗效果'
        // ... 添加更多
    };
    return dict[name] || name;
}

// 运行
main();