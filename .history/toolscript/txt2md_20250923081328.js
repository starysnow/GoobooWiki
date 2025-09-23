// format_to_table.js
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import json2md from 'json2md';
import Papa from 'papaparse';

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const INPUT_DIR = path.join(__dirname, '../data/js_translated');
const OUTPUT_DIR_MD = path.join(__dirname, '../data/md');
const OUTPUT_DIR_CSV = path.join(__dirname, '../output/csv');


/**
 * 通用函数，将 Babel AST 节点转换为 JS 值
 * @param {object} node - AST 节点
 * @returns {any}
 */
function astNodeToValue(node) {
    if (!node) return null;
    switch (node.type) {
        case 'ObjectExpression': {
            const obj = {};
            for (const prop of node.properties) {
                if (prop.type === 'ObjectProperty') {
                    const key = prop.key.name || prop.key.value;
                    obj[key] = astNodeToValue(prop.value);
                }
            }
            return obj;
        }
        case 'ArrayExpression':
            return node.elements.map(astNodeToValue);
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
            return node.value;
        case 'NullLiteral':
            return null;
        case 'Identifier': // 有时对象键没有引号
            return node.name;
        default:
            return `[RAW_CODE]`; // 对于无法解析的（如函数），返回占位符
    }
}


/**
 * 特定于圣遗物 (relics/glyph.txt) 数据的处理函数
 * @param {object} data - 从文件解析出的 JS 对象
 * @returns {{md: string, csv: string}} - 生成的 Markdown 和 CSV 字符串
 */
function processRelicGlyphData(data) {
    const mdTable = {
        headers: ['圣遗物名称', '图标', '颜色', '适用功能', '效果'],
        rows: []
    };
    const csvData = [];

    // 假设 relic 数据文件的顶层键是 "dust", "clay" 等
    for (const relicName in data) {
        const relic = data[relicName];
        if (typeof relic !== 'object' || !relic.effect) continue;

        // --- 准备 CSV 行数据 ---
        const csvRow = {
            '圣遗物名称': relicName,
            '图标': relic.icon || '',
            '颜色': relic.color || '',
            '适用功能': 'N/A', // 适用功能需要从注释或其他地方推断，这里先占位
            '效果': relic.effect.map(e => `${e.name}: ${e.type} ${e.value}`).join('; ')
        };
        csvData.push(csvRow);

        // --- 准备 MD 行数据 ---
        const effectsList = relic.effect.map(e => `<li>${e.name}: ${e.type === 'mult' ? 'x' : ''}${e.value}</li>`).join('');

        mdTable.rows.push([
            relicName,
            `\`${relic.icon || ''}\``,
            relic.color || '',
            '成就, 采矿', // 同样，先用示例占位
            effectsList
        ]);
    }

    const mdOutput = json2md([
        { h2: "圣遗物 (Relics)" },
        { table: mdTable }
    ]);

    const csvOutput = Papa.unparse(csvData);

    return { md: mdOutput, csv: csvOutput };
}


async function main() {
    await fs.emptyDir(OUTPUT_DIR_MD);
    await fs.emptyDir(OUTPUT_DIR_CSV);

    const txtFiles = glob.sync(`${INPUT_DIR}/**/*.txt`);
    console.log(`找到了 ${txtFiles.length} 个 .txt 文件需要格式化。`);

    for (const filePath of txtFiles) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const baseName = path.basename(filePath, '.txt');

        // 只有当文件内容看起来像对象时才处理
        if (!fileContent.startsWith('{') || !fileContent.endsWith('}')) {
            console.log(`跳过文件 ${baseName}，因为它不是一个对象。`);
            continue;
        }

        try {
            const ast = babelParse(`(${fileContent})`, { errorRecovery: true });
            const dataObject = astNodeToValue(ast.program.body[0].expression);

            let output = { md: '', csv: '' };

            // --- 路由到特定的处理函数 ---
            // 这里可以根据文件名或内容结构来决定使用哪个处理函数
            if (baseName.includes('glyph')) { // 假设文件名包含 'glyph'
                output = processRelicGlyphData(dataObject);
            }
            // else if (baseName.includes('enhancement')) {
            //     output = processEnhancementData(dataObject);
            // }
            else {
                console.log(`没有为文件 ${baseName} 找到特定的处理函数，跳过。`);
                continue;
            }

            // 写入文件
            if (output.md) {
                const mdPath = path.join(OUTPUT_DIR_MD, `${baseName}.md`);
                await fs.writeFile(mdPath, output.md, 'utf-8');
            }
            if (output.csv) {
                const csvPath = path.join(OUTPUT_DIR_CSV, `${baseName}.csv`);
                await fs.writeFile(csvPath, output.csv, 'utf-8');
            }

            console.log(`已成功处理文件: ${baseName}`);

        } catch (e) {
            console.error(`处理文件 ${filePath} 失败:`, e.message);
        }
    }
}

main().catch(console.error);