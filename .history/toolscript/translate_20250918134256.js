// translate.js
const fs = require('fs');
const path = require('path');

// --- 配置项 ---
// 源JSON文件路径
const SOURCE_JSON_PATH = path.join(__dirname,'..',  'output.json');
// 翻译词典文件路径 (步骤一生成的)
const TRANSLATION_MAP_PATH = path.join(__dirname,'..',  'zh_map.json');
// 翻译后输出的文件路径
const OUTPUT_JSON_PATH = path.join(__dirname,'..',  'output_zh.json');

// --- 主逻辑 ---
function main() {
    console.log('开始翻译过程...');

    // 1. 加载文件
    let sourceData;
    let translationMap;
    try {
        console.log(`正在读取源文件: ${SOURCE_JSON_PATH}`);
        sourceData = JSON.parse(fs.readFileSync(SOURCE_JSON_PATH, 'utf-8'));

        console.log(`正在读取翻译词典: ${TRANSLATION_MAP_PATH}`);
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
    } catch (error) {
        console.error('错误：无法读取或解析文件！', error);
        return;
    }

    console.log('文件加载成功，开始遍历和替换...');

    // 2. 递归翻译
    const translatedData = translateObject(sourceData, translationMap);

    // 3. 保存结果
    try {
        // 使用 JSON.stringify 的第三个参数美化输出 (2个空格缩进)
        const outputString = JSON.stringify(translatedData, null, 2);
        fs.writeFileSync(OUTPUT_JSON_PATH, outputString, 'utf-8');
        console.log(`翻译完成！结果已保存至: ${OUTPUT_JSON_PATH}`);
    } catch (error) {
        console.error('错误：无法写入输出文件！', error);
    }
}

/**
 * 递归遍历和翻译对象的函数
 * @param {any} data - 当前需要处理的数据节点 (可以是对象、数组、字符串等)
 * @param {object} translationMap - 翻译词典
 * @returns {any} - 翻译后的数据节点
 */
function translateObject(data, translationMap) {
    // 如果是数组，则遍历数组中的每一项并递归调用
    if (Array.isArray(data)) {
        return data.map(item => translateObject(item, translationMap));
    }

    // 如果是对象，则遍历对象的键和值
    if (typeof data === 'object' && data !== null) {
        const newObj = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                // --- 核心替换逻辑 ---
                // 1. 翻译键 (Key)
                const translatedKey = translationMap[key] || key;

                // 2. 翻译值 (Value)，对值进行递归处理
                const translatedValue = translateObject(data[key], translationMap);

                newObj[translatedKey] = translatedValue;
            }
        }
        return newObj;
    }

    // 如果是字符串，检查它是否需要被翻译 (作为值)
    if (typeof data === 'string') {
        return translationMap[data] || data;
    }

    // 对于数字、布尔值、null等其他类型，直接返回原值
    return data;
}

// 运行主函数
main();