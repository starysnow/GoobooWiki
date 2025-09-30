// build-data-index.js (支持多文件夹结构的升级版)

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob'; // 引入 glob

const jsonDir = './data/json';
const outputDir = './.vitepress/theme';
const outputFile = path.join(outputDir, 'data-index.js');

console.log('[Data Indexer] 开始扫描JSON文件...');

try {
  await fs.ensureDir(outputDir); // 使用 fs-extra 的 ensureDir，更简洁

  // 使用 glob 递归查找所有 .json 文件
  const files = globSync(`${jsonDir}/**/*.json`);
  const imports = [];
  const dataMapEntries = [];

  files.forEach((filePath, index) => {
    // 计算相对于 jsonDir 的路径，例如 'mining/achievement.json'
    const relativePath = path.relative(jsonDir, filePath);
    // 从相对路径创建唯一的键名，例如 'mining/achievement'
    const keyName = relativePath.replace(/\\/g, '/').replace(/\.json$/, '');
    // 创建一个健壮的变量名，例如 data_mining_achievement
    const variableName = `data_${index}`; // 使用索引确保变量名唯一

    // 构建正确的导入路径
    // 使用 `@/` 别名，路径从 data/json 开始
    const importPath = `@/data/json/${relativePath.replace(/\\/g, '/')}`;
    imports.push(`import ${variableName} from '${importPath}';`);

    dataMapEntries.push(`  '${keyName}': ${variableName}`);
  });

  const fileContent = `// 该文件由 build-data-index.js 自动生成，请勿手动修改！

${imports.join('\n')}

/**
 * 包含所有JSON数据的数据字典。
 * 你可以根据文件的相对路径作为key来获取对应的数据。
 * 例如: dataMap['mining/achievement']
 */
export const dataMap = {
${dataMapEntries.join(',\n')}
};

/**
 * (可选) 包含所有表格配置的数组，用于需要展示全部数据的页面。
 */
export const allTables = Object.entries(dataMap).map(([title, data]) => ({
  id: \`\${title.replace(/\\//g, '-')}-table\`,
  title,
  data
}));
`;

  await fs.writeFile(outputFile, fileContent, 'utf-8');
  console.log(`✅ [Data Indexer] 成功生成数据索引: ${outputFile}`);

} catch (error) {
  console.error('❌ [Data Indexer] 生成数据索引时发生错误:', error);
  if (error.code === 'ENOENT') {
    const emptyContent = `// 自动生成的空索引\n\nexport const dataMap = {};\nexport const allTables = [];`;
    await fs.writeFile(outputFile, emptyContent, 'utf-8');
    console.warn('⚠️ [Data Indexer] JSON目录不存在，已生成空索引。');
  }
}