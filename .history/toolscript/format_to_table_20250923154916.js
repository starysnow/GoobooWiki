// format_to_table.js

/**
 * @fileoverview
 * 该脚本用于将预处理过的 .txt 数据文件动态转换为 Markdown 表格。
 *
 * 功能总结:
 * 1.  **扫描输入文件**: 自动扫描 `data/js_translated` 目录下所有 .txt 文件及其子目录。
 * 2.  **安全解析**: 使用 @babel/parser 将类似 JavaScript 对象字面量的文本安全地
 *     解析成一个标准的 JavaScript 对象，即使键没有引号也能处理。
 * 3.  **动态结构分析**:
 *      - 自动识别每个文件中的数据记录。
 *      - 动态收集中所有记录里出现过的全部属性，并以此作为表格的表头。
 * 4.  **数据扁平化与美化**:
 *      - 将数组或嵌套对象等复杂属性值转换为易于在表格单元格中展示的单行字符串。
 *      - 特殊处理 'icon' 属性的值，如果以 "mdi-" 开头，则转换为 HTML <i> 标签。
 * 5.  **生成 Markdown 表格**:
 *      - 根据动态生成的表头和数据，构建格式规范的 Markdown 表格。
 *      - 输出的 .md 文件只包含表格主体，不含任何额外的标题或文本。
 * 6.  **(已注释) 生成 CSV 文件**:
 *      - 代码中保留了将数据导出为 CSV 格式的功能，目前已被注释，可按需启用。
 * 7.  **文件输出**: 将生成的 Markdown 文件保存到指定的输出目录 (`output/md`)，
 *     并完整保留原始的目录结构，避免同名文件冲突。
 */

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import json2md from 'json2md';
// import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../data/js_translated');
const OUTPUT_DIR_MD = path.join(__dirname, '../data/md');
// const OUTPUT_DIR_CSV = path.join(__dirname, '../output/csv');

// astNodeToValue 函数保持不变

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
        // default: return `[CODE]`;
    }
}

// flattenValue 函数加入 key 参数以处理 icon
function flattenValue(key, value) {
    if (key === 'icon' && typeof value === 'string' && value.startsWith('mdi-')) {
        return `<i class="mdi ${value}"></i>`;
    }
    if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'object' && item !== null && item.hasOwnProperty('名称'))) {
            return value.map(e => `${e['名称'] || ''}: ${e['类型'] || ''} ${e['数值'] || ''}`).join('; ');
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    return String(value);
}

// processGenericData 函数更新以传递 key 给 flattenValue
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
        for (const propKey in record) {
            if (propKey.startsWith('mdi-')) continue;
            allHeaders.add(propKey);
            processedRecord[propKey] = flattenValue(propKey, record[propKey]);
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

    const csvOutput = '';

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

            // **已修正**: 保留原始目录结构
            const relativePath = path.relative(INPUT_DIR, filePath);
            const pathObject = path.parse(relativePath);

            // 构建新的相对路径，只改变后缀
            const newRelativePath = path.join(path.dirname(relativePath), `${pathObject.name}.md`);

            // 构建最终的绝对输出路径
            const mdPath = path.join(OUTPUT_DIR_MD, newRelativePath);

            await fs.ensureDir(path.dirname(mdPath));
            await fs.writeFile(mdPath, output.md, 'utf-8');

            console.log(`已成功处理文件: ${relativePath} -> ${newRelativePath}`);

        } catch (e) {
            console.error(`处理文件 ${filePath} 失败:`, e.message);
        }
    }
}

main().catch(console.error);