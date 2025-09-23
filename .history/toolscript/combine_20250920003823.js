// toolscript/build_bundle.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;
import prettier from 'prettier';

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '..', 'js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined.js');

function getAllFiles(dirPath) {
    let allFiles = [];
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                allFiles = allFiles.concat(getAllFiles(fullPath));
            } else {
                allFiles.push(fullPath);
            }
        }
    } catch (e) { /* 忽略 */ }
    return allFiles;
}

async function main() {
    console.log('🚀 [阶段一] 开始合并JS数据模块...');

    const allSourceFiles = getAllFiles(SOURCE_DIR).filter(file => path.extname(file) === '.js');
    console.log(`📂 在源目录及其子目录中找到 ${allSourceFiles.length} 个 JS 文件。`);

    const modules = {};

    for (const filePath of allSourceFiles) {
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const moduleName = relativePath.replace(/\\/g, '/').replace(/\.js$/, '');

        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const ast = parser.parse(code, { sourceType: 'module' });

            // 变量重命名，因为它现在不只指向对象
            let exportDefaultPath = null;

            traverse(ast, {
                ExportDefaultDeclaration(path) {
                    // 不再检查导出的类型，只要是 export default 就提取
                    exportDefaultPath = path.get('declaration');
                    // 找到后立即停止遍历，因为一个模块只有一个默认导出
                    path.stop();
                }
            });

            if (exportDefaultPath) {
                // 使用新的变量名，并重命名生成的代码变量
                const { code: moduleCode } = generate(exportDefaultPath.node, { concise: true });
                modules[moduleName] = moduleCode;
                console.log(`  -> 已提取模块: ${moduleName}`);
            } else {
                // 现在这里只会跳过没有 `export default` 语句的文件
                // console.log(`  -> 已跳过模块 (无默认导出): ${moduleName}`); // 如果需要可以取消注释来查看跳过的文件
            }

        } catch (error) {
            console.warn(`    ⚠️ 处理文件 ${relativePath} 时出错，已跳过:`, error.message.split('\n')[0]);
        }
    }

    console.log('\n🔧 所有模块提取完毕，正在构建合并文件...');
    let finalCode = 'export default {\n';
    for (const moduleName in modules) {
        finalCode += `  '${moduleName}': ${modules[moduleName]},\n`;
    }
    finalCode += '};';

    try {
        console.log('📝 正在格式化代码...');
        const formattedCode = await prettier.format(finalCode, { parser: 'babel', printWidth: 120 });
        fs.writeFileSync(OUTPUT_FILE_PATH, formattedCode, 'utf-8');
        console.log(`🎉 [阶段一] 合并完成！已保存至: ${OUTPUT_FILE_PATH}`);
    } catch(error) {
        console.error('❌ 格式化或写入文件时出错！', error);
    }
}

main();