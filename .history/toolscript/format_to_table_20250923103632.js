// format_to_table.js

/**
 * @fileoverview
 * 该脚本用于将预处理过的 .txt 数据文件动态转换为 Markdown 表格。
 *
 * 功能总结:
 * 1.  **扫描输入文件**: 自动扫描 `data/js_translated` 目录下所有 .txt 文件。
 * 2.  **安全解析**: 使用 @babel/parser 将类似 JavaScript 对象字面量的文本安全地
 *     解析成一个标准的 JavaScript 对象，即使键没有引号也能处理。
 * 3.  **动态结构分析**:
 *      - 自动识别每个文件中的数据记录。
 *      - 动态收集中所有记录里出现过的全部属性，并以此作为表格的表头。
 *      - 这确保了表格的列数和标题能根据不同文件的具体内容自适应变化。
 * 4.  **数据扁平化与美化**:
 *      - 将数组或嵌套对象等复杂属性值转换为易于在表格单元格中展示的单行字符串。
 *      - 特殊处理以 "mdi-" 开头的图标值，将其转换为可渲染的 HTML <i> 标签。
 * 5.  **生成 Markdown 表格**:
 *      - 根据动态生成的表头和数据，构建格式规范的 Markdown 表格。
 *      - 输出的 .md 文件只包含表格主体，不含任何额外的标题或文本。
 * 6.  **(已注释) 生成 CSV 文件**:
 *      - 代码中保留了将数据导出为 CSV 格式的功能，目前已被注释，可按需启用。
 * 7.  **文件输出**: 将生成的 Markdown 文件保存到指定的输出目录 (`output/md`)，
 *     并保留原始的文件名和目录结构。
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
const OUTPUT_DIR_MD = path.join(__dirname, '../dataa/md');
// const OUTPUT_DIR_CSV = path.join(__dirname, '../output/csv');


/**
 * [核心] 将复杂的属性值（如数组、对象）转换为可读的字符串，并处理图标
 * @param {any} value - 属性值
 * @returns {string} - 扁平化后的字符串
 */
function flattenValue(value) {
    // 规则1：处理 MDI 图标
    if (typeof value === 'string' && value.startsWith('mdi-')) {
        return `<i class="mdi ${value}"></i>`;
    }
    // 规则2：处理效果数组
    if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'object' && item !== null && item.hasOwnProperty('名称'))) {
            return value.map(e => `${e['名称'] || ''}: ${e['类型'] || ''} ${e['数值'] || ''}`).join('; ');
        }
        return JSON.stringify(value); // 其他数组
    }
    // 规则3：处理其他对象
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    // 规则4：处理基本类型
    return String(value); // 确保所有输出都是字符串
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

    // 第一次遍历：收集所有记录和所有可能的表头
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
            row[header] = record[header] || ''; // 填入数据或空字符串
        }
        return row;
    });

    if (tableData.length === 0) {
        return { md: '', csv: '', success: false };
    }

    /* --- (已注释) 生成 CSV ---
    const csvOutput = Papa.unparse(tableData, { header: true });
    */
    const csvOutput = '';

    // --- 生成 Markdown (只包含表格) ---
    const mdTable = {
        headers: headers,
        rows: tableData.map(row => headers.map(header => row[header]))
    };
    const mdOutput = json2md({ table: mdTable });

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

            const output = processGenericData(dataObject);

            if (!output.success) {
                console.log(`文件 ${baseName} 内容为空或结构无法识别，已跳过。`);
                continue;
            }

            // 计算输出路径，保留原始目录结构
            const relativePath = path.relative(INPUT_DIR, filePath);
            const pathObject = path.parse(relativePath);

            // 输出 .md 文件
            const mdPath = path.join(OUTPUT_DIR_MD, `${path.dirname(relativePath)}/${pathObject.name}.md`);
            await fs.ensureDir(path.dirname(mdPath));
            await fs.writeFile(mdPath, output.md, 'utf-8');

            /* --- (已注释) 写入 CSV 文件 ---
            if (output.csv) {
                const csvPath = path.join(OUTPUT_DIR_CSV, `${path.dirname(relativePath)}/${pathObject.name}.csv`);
                await fs.ensureDir(path.dirname(csvPath));
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