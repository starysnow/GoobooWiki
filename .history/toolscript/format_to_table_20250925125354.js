// format_to_table.js

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import json2md from 'json2md';
import _generate from '@babel/generator';
import Papa from 'papaparse';

const generate = _generate.default; // 新增，处理 ES 模块导入

// --- 获取 __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const INPUT_DIR = path.join(__dirname, '../data/js_translated');
const OUTPUT_DIR_MD = path.join(__dirname, '../data/md');
const OUTPUT_DIR_CSV = path.join(__dirname, './data/csv_raw');

/**
 * 将函数的 AST 节点转换为可读的公式字符串。
 * @param {object} funcNode - 函数的 AST 节点。
 * @returns {string} - 可读的公式字符串。
 */
function jsToReadableFormula(funcNode) {
    if (!funcNode || !funcNode.body) return '[公式]';

    // 步骤1: 提取函数的核心表达式节点
    const bodyNode = funcNode.body.type === 'BlockStatement' && funcNode.body.body[0]?.type === 'ReturnStatement'
        ? funcNode.body.body[0].argument
        : funcNode.body;

    if (!bodyNode) return '[公式]';

    // 步骤2: 使用 @babel/generator 将 AST 节点转换为代码字符串
    let formulaStr = generate(bodyNode, { concise: true }).code;

    // 步骤3: 通过一系列替换，将代码字符串美化为可读格式
    formulaStr = formulaStr.replace(/^\({|{/g, '').replace(/}\)$|}/g, ''); // 移除对象括号
    formulaStr = formulaStr.replace(/"([^"]+)":/g, '$1: '); // 移除键的引号

    formulaStr = formulaStr.replace(/Math\.pow\(([^,]+), ?([^)]+)\)/g, '(( $1 ) ^ $2)');
    formulaStr = formulaStr.replace(/Math\.ceil\(([^)]+)\)/g, '向上取整($1)');

    formulaStr = formulaStr.replace(/buildNum\(([^,]+), ?'([^']+)'\)/g, "$1$2");
    formulaStr = formulaStr.replace(/splicedPowLinear\(([^)]+)\)/g, '分段线性($1)');
    formulaStr = formulaStr.replace(/splicedPow\(([^)]+)\)/g, '分段幂($1)');

    formulaStr = formulaStr.replace(/\blvl\b/g, '等级');
    formulaStr = formulaStr.replace(/([*+])/g, ' $1 ');

    return formulaStr.trim();
}

/**
 * 将 Babel AST 节点递归转换为纯 JavaScript 值。
 */
function astNodeToValue(node) {
    if (!node) return null;
    switch (node.type) {
        case 'ObjectExpression': {
            const obj = {};
            for (const prop of node.properties) {
                const keyNode = prop.key;
                const key = keyNode.name || keyNode.value;
                obj[key] = astNodeToValue(prop.value || prop);
            }
            return obj;
        }
        case 'ArrayExpression':
            return node.elements.map(astNodeToValue);
        case 'ObjectMethod':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            return jsToReadableFormula(node); // 调用新的公式翻译函数
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

function flattenValue(key, value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    if (key === 'icon' && typeof value === 'string' && value.startsWith('mdi-')) {
        return `<i class="mdi ${value}"></i>`;
    }
    if (Array.isArray(value)) {
        // --- 新增规则：专门处理“效果”列的数组 ---
        // 检查数组中的每个元素是否是包含 'name', '类型', 'value' 的对象
        if (value.every(item =>
            typeof item === 'object' && item !== null &&
            item.hasOwnProperty('name') &&
            item.hasOwnProperty('类型') &&
            item.hasOwnProperty('value')
        )) {
            // 使用 map 转换每个对象为期望的字符串格式
            return value.map(item => {
                const namePart = item.name || '';
                const typePart = item.类型 || '';
                const valuePart = item.value || '';
                // 按照 "名称类型｛值｝" 的格式拼接
                return `${namePart}${typePart}｛${valuePart}｝`;
            }).join('; '); // 如果数组中有多个效果，用分号和空格隔开
        }

        // 保留之前的自定义规则作为回退
        if (value.every(item => typeof item === 'object' && item !== null && item.hasOwnProperty('名称'))) {
            return value.map(e => `${e['名称'] || ''}: ${e['类型'] || ''} ${e['数值'] || ''}`).join('; ');
        }

        // 通用回退规则
        return JSON.stringify(value);
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function processGenericData(data) {
    if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
        return { md: '', success: false };
    }

    const allHeaders = new Set();
    let records = [];

    if (Array.isArray(data)) {
        for (const item of data) {
            if (typeof item !== 'object' || item === null) continue;
            const recordName = item['名称'] || item['id'] || '';
            const processedRecord = { '名称': recordName };
            for (const propKey in item) {
                if (propKey === '名称' && processedRecord['名称'] !== '') continue;
                allHeaders.add(propKey);
                processedRecord[propKey] = flattenValue(propKey, item[propKey]);
            }
            records.push(processedRecord);
        }
    } else {
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

            // console.log(`已成功处理文件: ${relativePath} -> ${newRelativePath}`);

        } catch (e) {
            console.error(`处理文件 ${relativePath} 失败: ${e.stack}`);
        }
    }
}

main().catch(console.error);