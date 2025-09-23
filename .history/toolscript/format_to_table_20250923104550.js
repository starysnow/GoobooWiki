// format_to_table.js

/**
 * @fileoverview
 * 该脚本用于将预处理过的 .txt 数据文件转换为 Markdown 表格。
 *
 * 功能总结:
 * 1.  **扫描输入文件**: 自动扫描指定目录 (`data/js_translated`) 下的所有 .txt 文件。
 * 2.  **二次翻译 (组合词)**: 对文件内容进行一次额外的翻译处理，专门将
 *     类似 "currency[中文]Gain" 或 "currency[中文]Cap" 的组合词汇转换为
 *     更自然的中文，如“xx增益”或“xx容量”。
 * 3.  **安全解析**: 使用 @babel/parser 将类似 JavaScript 对象字面量的文本安全地
 *     解析成一个标准的 JavaScript 对象，即使键没有引号也能处理。
 * 4.  **动态结构分析**:
 *      - 自动识别每个文件中的数据记录。
 *      - 动态收集中所有记录里出现过的全部属性，并以此作为表格的表头。
 *      - 这确保了表格的列数和标题能根据不同文件的具体内容自适应变化。
 * 5.  **数据扁平化**: 将数组或嵌套对象等复杂属性值转换为易于在表格单元格中
 *     展示的单行字符串。
 * 6.  **生成 Markdown 表格**:
 *      - 根据动态生成的表头和数据，构建格式规范的 Markdown 表格。
 *      - 输出的 .md 文件只包含表格主体，不含任何额外的标题或文本。
 * 7.  **(已注释) 生成 CSV 文件**:
 *      - 代码中保留了将数据导出为 CSV 格式的功能，目前已被注释，可按需启用。
 * 8.  **文件输出**: 将生成的 Markdown 文件保存到指定的输出目录 (`data/md`)，
 *     并保留原始的文件名。
 */

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import json2md from 'json2md';
// import Papa from 'papaparse'; // CSV 功能已注释

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const INPUT_DIR = path.join(__dirname, '../data/js_translated');
const OUTPUT_DIR_MD = path.join(__dirname, '../data/md');
// const OUTPUT_DIR_CSV = path.join(__dirname, '../data/csv');


/**
 * [通用] 将 Babel AST 节点转换为 JS 值
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
        default: return `[CODE]`;
    }
}

/**
 * [核心] 将复杂的属性值（如数组、对象）转换为可读的字符串
 */
function flattenValue(value) {
    if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'object' && item !== null && item.hasOwnProperty('名称') && item.hasOwnProperty('数值'))) {
            return value.map(e => `${e['名称'] || ''}: ${e['类型'] || ''} ${e['数值'] || ''}`).join('; ');
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
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

    const allHeaders = new Set(['名称']);
    const records = [];

    for (const recordName in data) {
        const record = data[recordName];
        if (typeof record !== 'object' || record === null) continue;

        const processedRecord = { '名称': recordName };
        for (const prop in record) {
            allHeaders.add(prop);
            processedRecord[prop] = flattenValue(record[prop]);
        }
        records.push(processedRecord);
    }

    const headers = Array.from(allHeaders);
    const nameIndex = headers.indexOf('名称');
    if (nameIndex > 0) {
        headers.splice(nameIndex, 1);
        headers.unshift('名称');
    }

    const tableData = records.map(record => {
        const row = {};
        for (const header of headers) {
            row[header] = record[header] || '';
        }
        return row;
    });

    if (tableData.length === 0) {
        return { md: '', csv: '', success: false };
    }

    /* --- (已注释) 生成 CSV ---
    const csvOutput = Papa.unparse(tableData, { header: true });
    */
   const csvOutput = ''; // 明确设为空字符串

    // --- 生成 Markdown (只包含表格) ---
    const mdTable = {
        headers: headers,
        rows: tableData.map(row => headers.map(header => String(row[header]))) // 确保所有单元格都是字符串
    };
    // **修改**: 不再传入标题，只传入表格对象
    const mdOutput = json2md({ table: mdTable });

    return { md: mdOutput, csv: csvOutput, success: true };
}


async function main() {
    await fs.emptyDir(OUTPUT_DIR_MD);
    // await fs.emptyDir(OUTPUT_DIR_CSV); // CSV 功能已注释

    const txtFiles = globSync(`${INPUT_DIR}/**/*.txt`);
    console.log(`找到了 ${txtFiles.length} 个 .txt 文件需要格式化。`);

    for (const filePath of txtFiles) {
        let fileContent = await fs.readFile(filePath, 'utf-8');
        const baseName = path.basename(filePath, '.txt');

        if (!fileContent.startsWith('{') || !fileContent.endsWith('}')) {
            console.log(`跳过文件 ${baseName}，因为它不是一个对象。`);
            continue;
        }

        try {
            // 在解析前执行二次翻译
            const translatedContent = fileContent;

            const ast = babelParse(`(${translatedContent})`, { errorRecovery: true });
            const dataObject = astNodeToValue(ast.program.body[0].expression);

            const output = processGenericData(dataObject);

            if (!output.success) {
                console.log(`文件 ${baseName} 内容为空或结构无法识别，已跳过。`);
                continue;
            }

            // 写入 Markdown 文件
            const mdPath = path.join(OUTPUT_DIR_MD, `${baseName}.md`);
            await fs.writeFile(mdPath, output.md, 'utf-8');

            /* --- (已注释) 写入 CSV 文件 ---
            if (output.csv) {
                const csvPath = path.join(OUTPUT_DIR_CSV, `${baseName}.csv`);
                await fs.writeFile(csvPath, output.csv, 'utf-8');
            }
            */

            console.log(`已成功处理文件: ${baseName}`);

        } catch (e) {
            console.error(`处理文件 ${filePath} 失败:`, e.message);
        }
    }
}

main().catch(console.error);