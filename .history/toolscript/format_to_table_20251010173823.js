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
const OUTPUT_DIR_CSV = path.join(__dirname, '../data/csv');

// 在此数组中列出你希望在最终表格中忽略的所有列名
const IGNORE_COLUMNS_RAW = [
    'requirementBase',
    'requirementStat',
    'alwaysActive',
    '笔记',
    'onBuy',
    'hasDescription',
    'hideCap',//尚没弄懂是个啥
    'CapMult',//尚没弄懂是个啥
    'RaiseOtherCap',//尚没弄懂是个啥
    'Feature',//尚没弄懂是个啥
    'Name',//尚没弄懂是个啥
    'Subtype',
    '',
    'requirement',
    '秘密成就',
    'Color',//***需还原
];
const IGNORE_COLUMNS = IGNORE_COLUMNS_RAW.map(col => col.toLowerCase());

/**
 * 将函数的 AST 节点转换为可读的公式字符串。
 * @param {object} funcNode - 函数的 AST 节点。
 * @returns {string} - 可读的公式字符串。
 */
function jsToReadableFormula(funcNode) {
    // if (!funcNode || !funcNode.body) return '[公式]';

    let bodyNode = funcNode;

    // 步骤1: 智能提取目标表达式节点
    // 如果是函数，提取其函数体；否则，直接使用该节点。
    if (funcNode.type === 'ObjectMethod' || funcNode.type === 'FunctionExpression' || funcNode.type === 'ArrowFunctionExpression') {
        if (!funcNode.body) return '[空函数体]';
        bodyNode = funcNode.body.type === 'BlockStatement' && funcNode.body.body[0]?.type === 'ReturnStatement'
            ? funcNode.body.body[0].argument
            : funcNode.body;
    }
    // 步骤1: 提取函数的核心表达式节点
    // const bodyNode = funcNode.body.type === 'BlockStatement' && funcNode.body.body[0]?.type === 'ReturnStatement'
    //     ? funcNode.body.body[0].argument
    //     : funcNode.body;

    if (!bodyNode) return '[公式]';

    // 步骤2: 使用 @babel/generator 将 AST 节点转换为代码字符串
    let formulaStr = generate(bodyNode, { concise: true }).code;
    // --- 转换为 LaTeX 格式 ---

    // 1. (新增) 处理取模运算符 %
    //    必须在其他替换之前进行，以避免干扰
    formulaStr = formulaStr.replace(/(\w+)\s*%\s*(\w+)/g, '$1 \\pmod{$2}');

    // 2. (新增) 简化处理数组访问 [index]
    //    这个规则会移除数组选择部分，例如 [2, 3][...]，因为它在数学表达中意义不大
    formulaStr = formulaStr.replace(/\[\d+(,\s*\d+)*\]\[[^\]]+\]/g, '');

    // 示例1: Math.pow(a, b) -> a^b (在LaTeX中，应该写成 {a}^{b})
    formulaStr = formulaStr.replace(/buildNum\(([^,]+), ?'([^']+)'\)/g, "$1$2");
    formulaStr = formulaStr.replace(/Math\.pow\(([^,]+), ?([^)]+)\)/g, '{($1)}^{$2}');
    formulaStr = formulaStr.replace(/Math\.ceil\(([^)]+)\)/g, '\\text{向上取整}($1)');
    formulaStr = formulaStr.replace(/Math\.round\(([^)]+)\)/g, '\\text{四舍五入}($1)');
    formulaStr = formulaStr.replace(/Math\.floor\(([^)]+)\)/g, '\\text{向下取整}($1)');

    // 示例2: a * b -> a \cdot b
    formulaStr = formulaStr.replace(/\*/g, ' \\cdot ');

    // 示例3: lvl -> \text{等级} (将非数学变量包裹在 \text{} 中)
    // formulaStr = formulaStr.replace(/\blvl\b/g, '\\text{等级}');

    // 更多自定义函数的转换...
    formulaStr = formulaStr.replace(/splicedPowLinear\(([^)]+)\)/g, '\\text{分段线性}($1)');

    // 最后，用 $...$ 或 $$...$$ 包裹起来
    // $...$ 用于行内公式
    return `$${formulaStr}$`;
    // $$...$$ 用于块级公式（会居中显示）
    // return `$$${formulaStr}$$`;
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
            return jsToReadableFormula(node);
        case 'CallExpression':
            return jsToReadableFormula(node);
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
    if ((key === 'icon' || key === '图标') && typeof value === 'string' && value.startsWith('mdi-')) {
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

    // const headers = ['名称', ...Array.from(allHeaders).filter(h => h !== '名称' && h !== 'id')];

    // 确保 '名称' 是第一个表头
    let headers = ['名称', ...Array.from(allHeaders)];

    // --- 核心修改：过滤掉需要忽略的列 ---
    headers = headers.filter(header =>
        !IGNORE_COLUMNS.includes(header.toLowerCase()) && // 剔除忽略列表中的列
        header !== 'id'                      // 同时保留对 'id' 的过滤 (如果它被用作名称)
    );

    // 如果 '名称' 列因为某种原因不在第一位，确保它回到第一位
    if (headers.includes('名称') && headers.indexOf('名称') > 0) {
        headers.splice(headers.indexOf('名称'), 1);
        headers.unshift('名称');
    }

    const tableData = records.map(record => {
        const row = {};
        for (const header of headers) {
            row[header] = record[header] || '';
        }
        return row;
    });

    const mdOutput = json2md({ table: { headers, rows: tableData } });

    // --- 新增/启用 CSV 生成逻辑 ---
    // Papa.unparse 需要一个对象数组，tableData 正好是这个格式
    const csvOutput = Papa.unparse(tableData, {
        columns: headers, // 确保 CSV 列的顺序与 Markdown 表头一致
        header: true
    });

    return { md: mdOutput, csv: csvOutput, success: true };
}

async function main() {
    await fs.emptyDir(OUTPUT_DIR_MD);
    // await fs.emptyDir(OUTPUT_DIR_CSV);

    // --- 新的、更安全的清理逻辑 ---
    console.log(`正在清理旧的 CSV 文件 (将保留 ${OUTPUT_DIR_CSV} 目录下的未知文件和文件夹)...`);
    // 1. 查找输出目录中所有已存在的 .csv 文件
    const oldCsvFiles = globSync(`${OUTPUT_DIR_CSV}/modules/*.csv`);
    // 2. 遍历并删除它们
    for (const file of oldCsvFiles) {
        await fs.remove(file);
    }

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
            // --- 新增/启用 CSV 文件写入逻辑 ---
            const newRelativePathCsv = path.join(pathObject.dir, `${pathObject.name}.csv`);
            const csvPath = path.join(OUTPUT_DIR_CSV, newRelativePathCsv);

            await fs.ensureDir(path.dirname(csvPath));
            await fs.writeFile(csvPath, output.csv, 'utf-8');

            // console.log(`已成功处理文件: ${relativePath} -> .md & .csv`);

        } catch (e) {
            console.error(`处理文件 ${relativePath} 失败: ${e.stack}`);
        }
    }
}

main().catch(console.error);