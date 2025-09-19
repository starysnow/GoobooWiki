// build_translated_bundle.js (最终修复版：递归查找 + 修正 traverse 用法)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default; // <--- 这样才能正确获取到 traverse 函数
import _generate from '@babel/generator';
const generate = _generate.default; // <--- 同样修正 generator 的导入
import prettier from 'prettier';

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 【重要】设置你的源文件夹和输出文件路径
const SOURCE_DIR = path.resolve(__dirname, '..', 'js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined_zh.js');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

/**
 * 递归地获取一个目录下所有文件的路径
 * @param {string} dirPath - 目录路径
 * @returns {string[]} - 文件路径数组
 */
function getAllFiles(dirPath) {
    let allFiles = [];
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
            allFiles = allFiles.concat(getAllFiles(fullPath));
        } else {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

// --- 主逻辑 ---
async function main() {
    console.log('🚀 开始构建已翻译的合并JS文件...');

    // 1. 加载翻译词典
    let translationMap;
    try {
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
        console.log('✅ 翻译词典加载成功。');
    } catch (error) {
        console.error('❌ 无法加载翻译词典！请检查路径。', error);
        return;
    }

    // 2. 递归读取源目录下的所有JS文件
    let files;
    try {
        files = getAllFiles(SOURCE_DIR).filter(file => path.extname(file) === '.js');
        console.log(`📂 在源目录及其子目录中找到 ${files.length} 个 JS 文件，开始处理...`);
    } catch(error) {
        console.error(`❌ 读取源目录失败: ${SOURCE_DIR}`, error);
        return;
    }

    const translatedModules = {};

    // 3. 遍历、转换和翻译每个文件
    for (const filePath of files) {
        // 使用相对于 SOURCE_DIR 的路径来创建模块名，去除 .js 后缀
        // 例如: /.../js/data/equipment.js -> data/equipment
        const relativePath = path.relative(SOURCE_DIR, filePath);
        const moduleName = relativePath.replace(/\\/g, '/').replace(/\.js$/, '');

        console.log(`--- 正在处理: ${relativePath} (模块名: ${moduleName}) ---`);

        try {
            const code = fs.readFileSync(filePath, 'utf-8');
            const ast = parser.parse(code, { sourceType: 'module' });

            let hasExportDefaultObject = false;

            // 修正 traverse 的用法：遍历整个AST
            traverse(ast, {
                // 我们只关心 `export default` 后面跟着的对象
                ExportDefaultDeclaration(path) {
                    // 检查导出的内容是否是一个对象表达式
                    if (path.get('declaration').isObjectExpression()) {
                        hasExportDefaultObject = true;
                        // 在这个对象子树上进行翻译
                        path.get('declaration').traverse({
                            ObjectProperty(nodePath) {
                                const keyNode = nodePath.get('key');
                                if (keyNode.isIdentifier()) {
                                    const keyName = keyNode.node.name;
                                    const translatedName = translationMap[keyName];
                                    if (translatedName) {
                                        keyNode.replaceWithSourceString(`'${translatedName}'`);
                                    }
                                }
                            },
                            StringLiteral(nodePath) {
                                const stringValue = nodePath.node.value;
                                const translatedValue = translationMap[stringValue];
                                if (translatedValue && typeof translatedValue === 'string') {
                                    nodePath.node.value = translatedValue;
                                }
                            }
                        });
                    }
                }
            });

            // 如果文件包含我们想要翻译的 `export default {...}` 结构
            if (hasExportDefaultObject) {
                // 我们只需要最终的代码，不需要提取单个对象
                const { code: translatedFileCode } = generate(ast, { comments: false }); // 生成整个文件的代码
                // 将代码包装成一个函数，避免作用域污染，并立即执行以返回值
                translatedModules[moduleName] = `(() => { ${translatedFileCode.replace('export default', 'return')} })()`;
            } else {
                console.log(`    ⚠️ 在 ${relativePath} 中未找到 'export default {...}' 结构，已跳过。`);
            }

        } catch (error) {
            console.error(`    ❌ 处理文件 ${relativePath} 时出错:`, error);
        }
    }

    // 4. 构建最终的合并文件内容
    console.log('\n🔧 所有文件处理完毕，正在构建最终的合并文件...');
    let finalCode = 'export default {\n';
    for (const moduleName in translatedModules) {
        // 使用模块名作为键，拼接翻译后的代码
        finalCode += `  '${moduleName}': ${translatedModules[moduleName]},\n`;
    }
    finalCode += '};';

    // 5. 格式化并保存
    try {
        console.log('📝 正在使用 Prettier 格式化代码...');
        const formattedCode = await prettier.format(finalCode, { parser: 'babel', printWidth: 120 });

        fs.writeFileSync(OUTPUT_FILE_PATH, formattedCode, 'utf-8');
        console.log(`🎉 任务完成！已翻译并合并的文件已保存至: ${OUTPUT_FILE_PATH}`);
    } catch(error) {
        console.error('❌ 格式化或写入文件时出错！', error);
    }
}

main();