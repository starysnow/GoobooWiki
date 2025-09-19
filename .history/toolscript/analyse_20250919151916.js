// toolscript/generate_wiki_docs.js (VitePress & 通用实体解析版)
import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;

// --- 配置 ---
const SOURCE_FILE_PATH = path.resolve(__dirname, '..', 'path/to/your/data-file.js');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '..', 'docs/upgrades-and-items.md'); // 输出到 docs 目录
const TRANSLATION_MAP_PATH = path.resolve(__dirname, '..', 'public/zh_map.json');

// 【重要】效果名称到中文的映射词典
const EFFECT_NAME_MAP = {
    'currencyHordeBoneCap': '骸骨上限',
    'hordeHealing': '治疗效果',
    'currencyMiningScrapCap': '废料容量',
    'currencyMiningOrePlatinumCap': '铂矿石容量',
    // ... 在这里添加所有效果的翻译
};

// 主逻辑
function main() {
    const code = fs.readFileSync(SOURCE_FILE_PATH, 'utf-8');
    const translationMap = JSON.parse(fs.readFileSync(TRANSLATION_MAP_PATH, 'utf-8'));

    const ast = parser.parse(code, { sourceType: 'module' });

    let markdownContent = '';

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            if (path.get('declaration').isObjectExpression()) {
                const entityNodes = path.get('declaration').get('properties');
                for (const entityNode of entityNodes) {
                    // 只处理对象属性，跳过函数等其他类型的属性
                    if (entityNode.