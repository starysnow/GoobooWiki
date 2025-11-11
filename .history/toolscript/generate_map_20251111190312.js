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

const IGNORE_FILES = ['patchnote.js', 'note.js']

// 2. 需要完整保留其内部所有键值对的顶层键
const RETAIN_KEYS_LIST = ['card'];

// 不需要的键值对
const KEYS_TO_DELETE = ['description', 'type', '1', '2', '3', '4', '5'];

async function generateFlatTranslationMap() {
    console.log('🚀 [Map Generator] 开始生成扁平化翻译字典...');

    if (!await fs.pathExists(SOURCE_LANG_DIR)) {
        console.error(`❌ 错误：找不到源目录: ${SOURCE_LANG_DIR}`);
        return;
    }

    // 在这里预先定义好必须存在的固定键值对
    let allTranslations = {
        "base": "+",
        "mult": "*",
        "keepUpgrade": "保留",
        "uncapUpgrade": "无最大等级",
        "unlock": "解锁",
    };

    const sourceFiles = globSync(`${SOURCE_LANG_DIR}/**/*.js`);

    console.log(`🔍 发现了 ${sourceFiles.length} 个JS语言文件，准备处理...`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(process.cwd(), filePath);
        const fileName = path.basename(filePath);
        if (IGNORE_FILES.includes(fileName)) {
            console.log(`  -> 忽略文件: ${path.relative(process.cwd(), filePath)}`);
            continue;
        }
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

            // 规则 1: 智能前缀移除 (保持不变)
            let finalKey = key;
            const prefixRegex = new RegExp(`^(${PREFIX_LIST.join('|')})_`);
            const match = key.match(prefixRegex);
            if (match) {
                finalKey = key.substring(match[1].length + 1);
            }

            // 规则 2: 保留特定键下的所有内容 (保持不变)
            if (RETAIN_KEYS_LIST.includes(key) && typeof value === 'object' && value !== null) {
                processObject(value, flatMap);
                continue;
            }

            // --- 核心修改 2：新增“name优先”简化规则 ---
            // 这个规则的优先级应该高于之前的“description”规则
            if (
                typeof value === 'object' && value !== null &&
                'name' in value // 只要对象里有 'name' 键
            ) {
                const simplifiedValue = value.name; // 就取 name 的值

                // 检查冲突并添加到 flatMap
                if (flatMap[finalKey] && flatMap[finalKey] !== simplifiedValue) {
                    console.warn(`    [!] 键冲突警告 (name优先规则): 键 '${finalKey}' 被新的值覆盖。`);
                }
                flatMap[finalKey] = simplifiedValue;
                continue; // 处理完后跳过，不再进行其他判断
            }

            // 规则 3 (旧): 简化包含 'description' 的双键对象
            // 这个规则现在可以被上面的“name优先”规则完全覆盖，
            // 但为了健壮性，我们可以保留它，或者注释掉。
            // 如果一个对象只有name和description，上面的规则会先生效。
            if (
                typeof value === 'object' && value !== null &&
                Object.keys(value).length === 2 &&
                'description' in value
            ) {
                const otherKey = Object.keys(value).find(k => k !== 'description');
                const simplifiedValue = value[otherKey];
                if (flatMap[finalKey] && flatMap[finalKey] !== simplifiedValue) {
                    console.warn(`    [!] 键冲突警告 (description规则): 键 '${finalKey}' 被新的值覆盖。`);
                }
                flatMap[finalKey] = simplifiedValue;
                continue;
            }

            // 默认规则：处理字符串或递归深入 (保持不变)
            if (typeof value === 'string') {
                if (flatMap[finalKey] && flatMap[finalKey] !== value) {
                    console.warn(`    [!] 键冲突警告 (默认规则): 键 '${finalKey}' 被新的值覆盖。`);
                }
                flatMap[finalKey] = value;
            }
            else if (typeof value === 'object' && value !== null) {
                processObject(value, flatMap);
            }
        }
    }
}

generateFlatTranslationMap();