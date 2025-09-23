// format_to_table.js

/**
 * @fileoverview
 * 该脚本用于将预处理过的 .txt 数据文件动态转换为 Markdown 表格。
 *
 * 功能总结:
 * 1.  **扫描输入文件**: 自动扫描 `data/js_translated` 目录下所有 .txt 文件。
 * 2.  **安全解析**:
 *      - 使用 @babel/parser 将 JS 对象或数组字面量文本安全地解析为 JS 对象。
 *      - **处理动态内容**: 将文件中的函数/方法语法转换为占位符 `"[公式]"`，确保数据静态化。
 * 3.  **支持多种数据结构 (核心更新)**:
 *      - **自动识别**: 能处理顶级结构是对象 (`{...}`) 或数组 (`[...]`) 的数据文件。
 *      - **智能处理**: 为对象结构使用顶级键作为"名称"，为数组结构使用每个元素的 `名称` 或 `id` 属性。
 * 4.  **动态结构分析**: 自动收集所有属性作为表头，“名称”列始终置顶。
 * 5.  **数据扁平化与美化**:
 *      - 将复杂属性转换为单行字符串。
 *      - 将 `mdi-` 图标值转换为 HTML `<i>` 标签。
 * 6.  **文件输出**: 生成纯净的 Markdown 表格到 `data/md`，并保留原始目录结构。
 */

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import json2md from 'json2md';

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const INPUT_DIR = path.join(__dirname, './data/js_translated');
const OUTPUT_DIR_MD = path.join(__dirname, './data/md');

/**
 * 将 Babel AST 节点递归转换为纯 JavaScript 值。
 * @param {object} node - AST 节点。
 * @returns {*} - 转换后的 JavaScript 值。
 */
function astNodeToValue(node) {
    if (!node) return null;
    switch (node.type) {
        case 'ObjectExpression': {
            const obj = {};
            for (const prop of node.properties) {
                // 支持 ObjectProperty 和 ObjectMethod
                const keyNode = prop.key;
                const key = keyNode.name || keyNode.value;
                obj[key] = astNodeToValue(prop.value || prop); // 传入整个prop给函数处理
            }
            return obj;
        }
        case 'ArrayExpression':
            return node.elements.map(astNodeToValue);
        // 新增：将所有函数相关节点替换为占位符
        case 'ObjectMethod':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            return '[公式]';
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
            return node.value;
        case 'NullLiteral':
            return null;
        case 'Identifier':
            return node.name;
        default:
            return `[Unsupported Node: ${node.type}]`;
    }
}

/**
 * 将复杂数据类型扁平化为字符串，并对特定键进行美化。
 * @param {string} key - 属性的键名。
 * @param {*} value - 属性的值。
 * @returns {string} - 格式化后的字符串。
 */
function flattenValue(key, value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    if (key === 'icon' && typeof value === 'string' && value.startsWith('mdi-')) {
        return `<i class="mdi ${value}"></i>`;
    }
    if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'object' && item !== null && item.hasOwnProperty('名称'))) {
            return value.map(e => `${e['名称'] || ''}: ${e['类型'] || ''} ${e['数值'] || ''}`).join('; ');
        }
        return JSON.stringify(value);
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

/**
 * 处理解析后的数据对象（对象或数组），生成 Markdown。
 * @param {object|Array} data - 从文件解析出的数据。
 * @returns {{md: string, success: boolean}}
 */
function processGenericData(data) {
    if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
        return { md: '', success: false };
    }

    const allHeaders = new Set();
    let records = [];

    if (Array.isArray(data)) {
        // --- 处理数组结构 ---
        for (const item of data) {
            if (typeof item !== 'object' || item === null) continue;
            // 优先使用 '名称'，其次 'id'，作为名称列
            const recordName = item['名称'] || item['id'] || '';
            const processedRecord = { '名称': recordName };
            for (const propKey in item) {
                // 避免 '名称' 列重复
                if (propKey === '名称' && processedRecord['名称'] !== '') continue;
                allHeaders.add(propKey);
                processedRecord[propKey] = flattenValue(propKey, item[propKey]);
            }
            records.push(processedRecord);
        }
    } else {
        // --- 处理对象结构 ---
        for (const recordName in data) {
            const record = data[recordName];
            if (typeof record !== 'object' || record === null) continue;
            const processedRecord = { '名称': recordName };
            for (const propKey in record) {
                allHeaders.add(propKey);
                processedRecord[propKey] = flattenValue(propKey, record[propKey]);
            }
            records.push(processedRecord);
        }
    }

    if (records.length === 0) {
        return { md: '', success: false };
    }

    const headers = ['名称', ...Array.from(allHeaders).filter(h => h !== '名称' && h !== 'id')];

    const tableData = records.map(record => {
        const row = {};
        for (const header of headers) {
            row[header] = record[header] || '';
        }
        return row;
    });

    const mdOutput = json2md({ table: { headers, rows: tableData } });
    return { md: mdOutput, success: true };
}


async function main() {
    await fs.emptyDir(OUTPUT_DIR_MD);

    const txtFiles = globSync(`${INPUT_DIR}/**/*.txt`);
    console.log(`找到了 ${txtFiles.length} 个 .txt 文件需要格式化。`);

    for (const filePath of txtFiles) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(INPUT_DIR, filePath);
        const trimmedContent = fileContent.trim();

        // 更新入口检查，支持对象和数组
        if (!trimmedContent.startsWith('{') && !trimmedContent.startsWith('[')) {
            console.log(`跳过文件 ${relativePath}，因为它不是一个对象或数组。`);
            continue;
        }

        try {
            const ast = babelParse(`(${trimmedContent})`, { errorRecovery: true });
            const dataObject = astNodeToValue(ast.program.body[0].expression);

            const output = processGenericData(dataObject);

            if (!output.success) {
                console.log(`文件 ${relativePath} 内容为空或结构无法识别，已跳过。`);
                continue;
            }

            const pathObject = path.parse(relativePath);
            const newRelativePath = path.join(pathObject.dir, `${pathObject.name}.md`);
            const mdPath = path.join(OUTPUT_DIR_MD, newRelativePath);

            await fs.ensureDir(path.dirname(mdPath));
            await fs.writeFile(mdPath, output.md, 'utf-8');

            console.log(`已成功处理文件: ${relativePath} -> ${newRelativePath}`);

        } catch (e) {
            console.error(`处理文件 ${relativePath} 失败: ${e.stack}`);
        }
    }
}

main().catch(console.error);