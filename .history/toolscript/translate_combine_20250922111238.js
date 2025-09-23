// toolscript/translate_combine.js
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

// 【重要】输入是上一步生成的 combined.js
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined.js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'public', 'combined_zh.js');
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public', 'zh_map.json');

async function main() {
    console.log('🚀 [阶段二] 开始翻译合并后的JS文件...');

    let code, translationMap;
    try {
        code = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8');
        translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));
        console.log('✅ 文件和词典加载成功。');
    } catch (error) {
        console.error('❌ 加载文件或词典时出错！请检查路径。', error);
        return;
    }

    let ast;
    try {
        ast = parser.parse(code, { sourceType: 'module' });
    } catch(error) {
        console.error('❌ AST 解析失败！', error);
        return;
    }

    console.log('📝 正在遍历 AST 并替换文本...');
    traverse(ast, {
        // 我们只需要翻译 `export default` 后面的那个大对象里的内容
        ObjectProperty(nodePath) {
            // 翻译键
            const keyNode = nodePath.get('key');
            if (keyNode.isIdentifier()) {
                const keyName = keyNode.node.name;
                const translatedName = translationMap[keyName];
                if (translatedName) {
                    keyNode.replaceWithSourceString(`'${translatedName}'`);
                }
            }
            // 翻译字符串类型的键
            else if (keyNode.isStringLiteral()) {
                const keyName = keyNode.node.value;
                const translatedName = translationMap[keyName];
                if (translatedName) {
                    keyNode.node.value = translatedName;
                }
            }
        },
        StringLiteral(nodePath) {
            // 翻译值
            // 通过检查父节点，确保我们不在对象键的位置重复翻译
            if (!nodePath.parentPath.isObjectProperty() || nodePath.key !== 'key') {
                 const stringValue = nodePath.node.value;
                 const translatedValue = translationMap[stringValue];
                 if (translatedValue && typeof translatedValue === 'string') {
                     nodePath.node.value = translatedValue;
                 }
            }
        }
    });

    console.log('🎨 正在从修改后的 AST 生成新代码...');
    const { code: outputCode } = generate(ast, { comments: true });

    try {
        console.log('💅 正在格式化代码...');
        const formattedCode = await prettier.format(outputCode, { parser: 'babel', printWidth: 120 });
        fs.writeFileSync(OUTPUT_FILE_PATH, formattedCode, 'utf-8');
        console.log(`🎉 [阶段二] 翻译完成！已保存至: ${OUTPUT_FILE_PATH}`);
    } catch(error) {
        console.error('❌ 格式化或写入文件时出错！', error);
    }
}

main();