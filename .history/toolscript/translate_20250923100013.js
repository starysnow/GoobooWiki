// format_to_table.js (Dynamic Generic Version)
import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
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
// const OUTPUT_DIR_CSV = path.join(__dirname, '../data/csv');



/**
 * [保持不变] 通用函数，将 Babel AST 节点转换为 JS 值
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
        case 'ArrayExpression': return node.elements.map(astNodeToValue);
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral': return node.value;
        case 'NullLiteral': return null;
        case 'Identifier': return node.name;
        default: return `[CODE]`; // 保留为代码占位符
    }
}

/**
 * [核心] 将复杂的属性值（如数组、对象）转换为可读的字符串
 * @param {any} value - 属性值
 * @returns {string} - 扁平化后的字符串
 */
function flattenValue(value) {
    if (Array.isArray(value)) {
        // 如果是 effect 数组，特殊格式化
        if (value.every(item => typeof item === 'object' && item.name && item.value)) {
            return value.map(e => `${e.name || ''}: ${e.type || ''} ${e.value || ''}`).join('; ');
        }
        return JSON.stringify(value); // 其他数组直接转为 JSON 字符串
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value); // 对象也转为 JSON 字符串
    }
    return value;
}

/**
 * [核心] 动态分析并处理任何数据对象，生成表格数据
 * @param {object} data - 从文件解析出的 JS 对象
 * @returns {{md: string, csv: string, success: boolean}}
 */
function processGenericData(data) {
    if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) {
        return { md: '', csv: '', success: false };
    }

    const allHeaders = new Set(['名称']); // "名称"列是固定的第一列
    const records = [];

    // 第一次遍历：收集所有记录和所有可能的表头
    for (const recordName in data) {
        const record = data[recordName];
        if (typeof record !== 'object' || record === null) continue;

        const processedRecord = { '名称': recordName };
        for (const prop in record) {
            allHeaders.add(prop); // 动态添加表头
            processedRecord[prop] = flattenValue(record[prop]); // 扁平化处理值
        }
        records.push(processedRecord);
    }

    const headers = Array.from(allHeaders);
    // 确保 "名称" 列在第一位
    const nameIndex = headers.indexOf('名称');
    if (nameIndex > 0) {
        headers.splice(nameIndex, 1);
        headers.unshift('名称');
    }

    // 第二次遍历：构建最终的表格数据，确保每行都有所有列
    const tableData = records.map(record => {
        const row = {};
        for (const header of headers) {
            row[header] = record[header] || ''; // 如果记录缺少某个属性，则填空字符串
        }
        return row;
    });

    if (tableData.length === 0) {
        return { md: '', csv: '', success: false };
    }

    // --- 生成 CSV ---
    const csvOutput = Papa.unparse(tableData, { header: true });

    // --- 生成 Markdown ---
    const mdTable = {
        headers: headers,
        rows: tableData.map(row => headers.map(header => row[header]))
    };
    const mdOutput = json2md([
        { h2: "数据表格" },
        { table: mdTable }
    ]);

    return { md: mdOutput, csv: csvOutput, success: true };
}


async function main() {
    await fs.emptyDir(OUTPUT_DIR_MD);
    // await fs.emptyDir(OUTPUT_DIR_CSV);

    const txtFiles = globSync(`${INPUT_DIR}/**/*.txt`);
    console.log(`找到了 ${txtFiles.length} 个 .txt 文件需要格式化。`);

    for (const filePath of txtFiles) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const baseName = path.basename(filePath, '.txt');

        if (!fileContent.startsWith('{') || !fileContent.endsWith('}')) {
            console.log(`跳过文件 ${baseName}，因为它不是一个对象。`);
            continue;
        }

        try {
            const ast = babelParse(`(${fileContent})`, { errorRecovery: true });
            const dataObject = astNodeToValue(ast.program.body[0].expression);

            // 调用通用的动态处理函数
            const output = processGenericData(dataObject);

            if (!output.success) {
                console.log(`文件 ${baseName} 内容为空或结构无法识别，已跳过。`);
                continue;
            }

            // 写入文件
            const mdPath = path.join(OUTPUT_DIR_MD, `${baseName}.md`);
            await fs.writeFile(mdPath, output.md, 'utf-8');

            // const csvPath = path.join(OUTPUT_DIR_CSV, `${baseName}.csv`);
            // await fs.writeFile(csvPath, output.csv, 'utf-8');

            console.log(`已成功处理文件: ${baseName}`);

        } catch (e) {
            console.error(`处理文件 ${filePath} 失败:`, e.message);
        }
    }
}

main().catch(console.error);