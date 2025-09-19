// translate_combine.js
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

// 【重要】设置你的文件路径
// 假设 combine.js 和 zh_map.json 都在项目根目录下
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combine.js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combine_zh.js'); // 翻译后的输出文件
const TRANSLATION_MAP_PATH = path.resolve(__dirname,  '..', 'public','zh_map.json');

// --- 主逻辑 ---
async function main() {
    console.log('🚀 开始翻译合并后的JS文件...');

    // 1. 加载文件和词典
    let code, translationMap;
    try {
        console.log(`正在读取源文件: ${SOURCE_FILE_PATH}`);
        code = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8');

        console.log(`正在读取翻译词典: ${TRANSLATION_MAP_PATH}`);
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
        console.log('✅ 文件和词典加载成功。');
    } catch (error) {
        console.error('❌ 加载文件或词典时出错！请检查路径。', error);
        return;
    }

    // 2. 解析代码为 AST
    console.log('正在将代码解析为 AST...');
    let ast;
    try {
        ast = parser.parse(code, {
            sourceType: 'module', // 因为代码中有 import/export
            plugins: ['estree'] // 增加对某些语法的兼容性
        });
        console.log('✅ AST 解析成功。');
    } catch(error) {
        console.error('❌ AST 解析失败！代码中可能存在语法错误。', error);
        return;
    }

    // 3. 遍历并修改 AST
    console.log('正在遍历 AST 并替换文本...');
    let replacementCount = 0;
    traverse(ast, {
        // 访问所有对象的属性，例如 `dagger: { ... }`
        ObjectProperty(nodePath) {
            const keyNode = nodePath.get('key');

            // 只处理标识符类型的键 (e.g., dagger)
            if (keyNode.isIdentifier()) {
                const keyName = keyNode.node.name;
                const translatedName = translationMap[keyName];

                if (translatedName) {
                    // 将键替换为字符串字面量，e.g., `dagger:` -> `'匕首':`
                    keyNode.replaceWithSourceString(`'${translatedName}'`);
                    replacementCount++;
                }
            }
        },
        // 访问所有字符串字面量，例如 `name: 'hordeAttack'`
        StringLiteral(nodePath) {
            const stringValue = nodePath.node.value;
            const translatedValue = translationMap[stringValue];

            // 确保翻译结果是字符串，防止对象替换字符串的错误
            if (translatedValue && typeof translatedValue === 'string') {
                nodePath.node.value = translatedValue;
                replacementCount++;
            }
        }
    });
    console.log(`✅ AST 遍历完成，共进行了 ${replacementCount} 处替换。`);

    // 4. 从修改后的 AST 生成新代码
    console.log('正在从修改后的 AST 生成新代码...');
    const { code: outputCode } = generate(ast, {
        retainLines: true, // 尝试保留原始行号
        comments: true, // 保留注释
    });

    // 5. 格式化并保存
    try {
        console.log('正在使用 Prettier 格式化代码...');
        // 注意：如果文件过大，格式化可能会消耗较多时间和内存
        const formattedCode = await prettier.format(outputCode, { parser: 'babel', printWidth: 120 });

        console.log(`正在将结果写入文件: ${OUTPUT_FILE_PATH}`);
        fs.writeFileSync(OUTPUT_FILE_PATH, formattedCode, 'utf-8');

        console.log('🎉 翻译任务圆满完成！');
    } catch(error) {
        console.error('❌ 格式化或写入文件时出错！', error);
        // 如果格式化出错，尝试写入未格式化的代码
        console.log('正在尝试写入未格式化的代码...');
        fs.writeFileSync(OUTPUT_FILE_PATH.replace('.js', '_unformatted.js'), outputCode, 'utf-8');
    }
}

main();