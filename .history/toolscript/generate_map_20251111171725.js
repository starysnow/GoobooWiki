// toolscript/generate_map.js (纯ESM版本)
import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
// import { register } from '@babel/register';

// --- Babel 注册 ---
// 使用 import 方式进行注册
// register({
//     presets: ['@babel/preset-env'],
//     ignore: [/node_modules/],
// });

// --- 配置区 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_LANG_DIR = path.resolve(__dirname, '../data/zh');
const OUTPUT_MAP_FILE = path.resolve(__dirname, '../public/zh_map.json');

// 1. 需要处理的前缀列表
const PREFIX_LIST = [
    'event', 'farm', 'gallery', 'general', 'horde', 'migration',
    'mining', 'relic', 'school', 'treasure', 'village', 'theme', 'gem'
];

const IGNORE_FILES = ['patchnote.js', 'another_file_to_ignore.js']

// 2. 需要完整保留其内部所有键值对的顶层键
const RETAIN_KEYS_LIST = ['card'];

async function generateFlatTranslationMap() {
    console.log('🚀 [Map Generator] 开始生成扁平化翻译字典...');

    if (!await fs.pathExists(SOURCE_LANG_DIR)) {
        console.error(`❌ 错误：找不到源目录: ${SOURCE_LANG_DIR}`);
        return;
    }

    let allTranslations = {};
    const sourceFiles = globSync(`${SOURCE_LANG_DIR}/**/*.js`);

    console.log(`🔍 发现了 ${sourceFiles.length} 个JS语言文件，准备处理...`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`  -> 正在处理: ${relativePath}`);

        try {
            const module = await import(filePath);
            const data = module.default;

            if (typeof data !== 'object' || data === null) continue;

            // --- 核心处理逻辑 ---
            processObject(data, allTranslations);

        } catch (error) {
            console.error(`    [-] 处理失败: ${relativePath} - ${error.message}`);
        }
    }

    // --- 写入最终的JSON文件 ---
    try {
        await fs.writeJson(OUTPUT_MAP_FILE, allTranslations, { spaces: 2 });
        console.log(`\n✅ [Map Generator] 成功生成总翻译字典！`);
        console.log(`   - 文件位置: ${OUTPUT_MAP_FILE}`);
        console.log(`   - 总条目数: ${Object.keys(allTranslations).length}`);
    } catch (error) {
        console.error(`\n❌ [Map Generator] 写入最终文件时失败: ${error.message}`);
    }
}

/**
 * 核心递归处理函数
 * @param {object} currentObject - 当前正在处理的对象
 * @param {object} flatMap - 用于存储最终结果的扁平字典
 */
function processObject(currentObject, flatMap) {
    for (const key in currentObject) {
        if (Object.prototype.hasOwnProperty.call(currentObject, key)) {
            const value = currentObject[key];

            // 规则 2: 如果当前键在“保留列表”中，则递归处理其所有子项
            if (RETAIN_KEYS_LIST.includes(key) && typeof value === 'object' && value !== null) {
                for (const subKey in value) {
                    if (Object.prototype.hasOwnProperty.call(value, subKey)) {
                        flatMap[subKey] = value[subKey];
                    }
                }
                // 处理完后，跳过后续规则，不处理这个顶层键本身
                continue;
            }

            // 规则 3: 简化只有 name 和 description 的对象
            if (
                typeof value === 'object' && value !== null &&
                Object.keys(value).length === 2 &&
                'name' in value && 'description' in value
            ) {
                flatMap[key] = value.name;
                continue;
            }

            // 规则 1: 智能前缀移除
            let finalKey = key;
            const prefixRegex = new RegExp(`^(${PREFIX_LIST.join('|')})_`);
            const match = key.match(prefixRegex);
            if (match) {
                // 如果键以列表中的前缀开头，则移除前缀
                finalKey = key.substring(match[1].length + 1);
            }

            // 默认规则：只处理字符串值
            if (typeof value === 'string') {
                flatMap[finalKey] = value;
            }
            // 如果值是对象但又不符合特殊规则，则递归深入
            else if (typeof value === 'object' && value !== null) {
                processObject(value, flatMap);
            }
        }
    }
}

generateFlatTranslationMap();