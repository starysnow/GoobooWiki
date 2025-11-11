// toolscript/generate_translation_map.js

// Babel用于让Node.js能处理 import/export 语法
require('@babel/register')({
    presets: ['@babel/preset-env'],
    ignore: [/node_modules/],
});

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

// --- 配置区 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 源目录：指向包含所有中文语言JS文件的文件夹
const SOURCE_LANG_DIR = path.resolve(__dirname, '../js/lang/zh');

// 输出文件：合并后的总翻译字典
const OUTPUT_MAP_FILE = path.resolve(__dirname, '../public/zh_map.json');
// ----------------

async function generateFlatTranslationMap() {
    console.log('🚀 [Map Generator] 开始生成扁平化翻译字典...');

    // 检查源目录是否存在
    if (!await fs.pathExists(SOURCE_LANG_DIR)) {
        console.error(`❌ 错误：找不到源目录: ${SOURCE_LANG_DIR}`);
        return;
    }

    const allTranslations = {};
    const sourceFiles = globSync(`${SOURCE_LANG_DIR}/**/*.js`);

    console.log(`🔍 发现了 ${sourceFiles.length} 个JS语言文件，准备处理...`);

    for (const filePath of sourceFiles) {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`  -> 正在处理: ${relativePath}`);

        try {
            // 关键：使用 require() 来“执行”JS文件并获取其导出的默认对象
            const module = await import(filePath);
            const data = module.default;

            if (typeof data !== 'object' || data === null) {
                console.warn(`    [!] 跳过: ${relativePath} 没有导出有效的对象。`);
                continue;
            }

            let count = 0;
            // --- 核心逻辑：遍历并筛选顶层键值对 ---
            for (const key in data) {
                // 确保这个键是对象自身的属性
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = data[key];

                    // 关键判断：只合并那些值为字符串的顶层键值对
                    if (typeof value === 'string') {
                        // 检查是否已存在，如果存在且值不同，则发出警告
                        if (allTranslations[key] && allTranslations[key] !== value) {
                            console.warn(`    [!] 警告：键 '${key}' 存在冲突。旧值: "${allTranslations[key]}", 新值: "${value}". 将使用新值覆盖。`);
                        }
                        allTranslations[key] = value;
                        count++;
                    }
                }
            }
            console.log(`    [+] 从该文件中提取了 ${count} 个键值对。`);

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

generateFlatTranslationMap();