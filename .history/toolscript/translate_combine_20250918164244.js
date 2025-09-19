// build_translated_bundle.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import prettier from 'prettier';

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 【重要】设置你的源文件夹和输出文件路径
const SOURCE_DIR = path.resolve(__dirname, '..', 'js');
// 最终输出的合并翻译文件
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined_zh.js');

// 你的翻译词典路径
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

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

    // 2. 读取源目录下的所有文件
    let files;
    try {
        files = fs.readdirSync(SOURCE_DIR).filter(file => path.extname(file) === '.js');
        console.log(`📂 在源目录找到 ${files.length} 个 JS 文件，开始处理...`);
    } catch(error) {
        console.error(`❌ 读取源目录失败: ${SOURCE_DIR}`, error);
        return;
    }

    const translatedModules = {};

    // 3. 遍历、转换和翻译每个文件
    for (const file of files) {
        const sourceFilePath = path.join(SOURCE_DIR, file);
        const moduleName = path.basename(file, '.js'); // 从 'equipment.js' 得到 'equipment'

        console.log(`--- 正在处理: ${file} (模块名: ${moduleName}) ---`);

        try {
            const code = fs.readFileSync(sourceFilePath, 'utf-8');

            // 我们需要提取 `export default` 后面的对象
            const ast = parser.parse(code, { sourceType: 'module' });

            let objectAstNode = null;
            // 找到 `export default` 声明，并获取其后的对象表达式节点
            traverse(ast, {
                ExportDefaultDeclaration(nodePath) {
                    objectAstNode = nodePath.get('declaration');
                }
            });

            if (!objectAstNode) {
                console.warn(`    ⚠️ 在 ${file} 中未找到 'export default'，已跳过。`);
                continue;
            }

            // 在提取出的对象AST节点上进行翻译
            objectAstNode.traverse({
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

            // 从被翻译修改后的对象AST节点生成代码字符串
            const { code: translatedObjectCode } = generate(objectAstNode.node);

            // 将生成的代码字符串存入我们的聚合对象中
            translatedModules[moduleName] = translatedObjectCode;

        } catch (error) {
            console.error(`    ❌ 处理文件 ${file} 时出错:`, error);
        }
    }

    // 4. 构建最终的合并文件内容
    console.log('\n🔧 所有文件处理完毕，正在构建最终的合并文件...');
    let finalCode = 'export default {\n';
    for (const moduleName in translatedModules) {
        // 注意：这里的 translatedModules[moduleName] 已经是字符串了，所以不需要引号
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