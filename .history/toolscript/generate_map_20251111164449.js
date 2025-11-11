// toolscript/generate_map.js (纯ESM版本)

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { register } from '@babel/register'; // ◀︎ 使用 import 导入

// --- Babel 注册 ---
// 使用 import 方式进行注册
register({
    presets: ['@babel/preset-env'],
    ignore: [/node_modules/],
});

// --- 配置区 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_LANG_DIR = path.resolve(__dirname, '../js/lang/zh');
const OUTPUT_MAP_FILE = path.resolve(__dirname, '../public/zh_map.json');
// ----------------

async function generateFlatTranslationMap() {
    console.log('🚀 [Map Generator] 开始生成扁平化翻译字典...');

    if (!await fs.pathExists(SOURCE_LANG_DIR)) {
        console.error(`❌ 错误：找不到源目录: ${SOURCE_LANG_DIR}`);
        return;
    }

    const allTranslations = {};
    const sourceFiles = globSync(`${SOURCE_LANG_DIR}/**/*.js`);

    console.log(`🔍 发现了 ${sourceFiles.length} 个JS语言文件，准备处理...`);

    // 使用 Promise.all 来并行处理文件，速度更快
    await Promise.all(sourceFiles.map(async (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`  -> 正在处理: ${relativePath}`);

        try {
            // 关键：使用动态 import() 来加载ES模块
            const module = await import(filePath);
            const data = module.default;

            if (typeof data !== 'object' || data === null) {
                console.warn(`    [!] 跳过: ${relativePath} 没有导出有效的对象。`);
                return;
            }

            let count = 0;
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = data[key];
                    if (typeof value === 'string') {
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
    }));

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