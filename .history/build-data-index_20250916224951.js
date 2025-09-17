// build-data-index.js (升级版)

const fs = require('fs');
const path = require('path');

const jsonDir = './docs/data/json';
const outputDir = './docs/.vitepress/theme';
const outputFile = path.join(outputDir, 'data-index.js');

console.log('🚀 [Data Indexer] 开始扫描JSON文件...');

try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(jsonDir);
  const imports = [];
  const dataMapEntries = []; // 用于构建数据字典

  files.forEach(file => {
    if (path.extname(file).toLowerCase() === '.json') {
      const baseName = path.basename(file, '.json');
      // 创建一个更健壮的变量名，例如 "稀土" -> "data_稀土"
      const variableName = `data_${baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')}`;

      const importPath = `../../../data/json/${file}`;
      imports.push(`import ${variableName} from '${importPath}';`);

      // 为数据字典创建条目，键就是文件名(不含后缀)，值就是导入的变量
      dataMapEntries.push(`  '${baseName}': ${variableName}`);
    }
  });

  // 生成最终的文件内容
  const fileContent = `// 该文件由 build-data-index.js 自动生成，请勿手动修改！

${imports.join('\n')}

/**
 * 包含所有JSON数据的数据字典。
 * 你可以根据文件名作为key来获取对应的数据。
 * 例如: dataMap['锭']
 */
export const dataMap = {
${dataMapEntries.join(',\n')}
};

/**
 * (可选) 包含所有表格配置的数组，用于需要展示全部数据的页面。
 */
export const allTables = Object.entries(dataMap).map(([title, data]) => ({
  id: \`\${title.toLowerCase()}-table\`,
  title,
  data
}));
`;

  fs.writeFileSync(outputFile, fileContent, 'utf-8');
  console.log(`✅ [Data Indexer] 成功生成数据索引: ${outputFile}`);

} catch (error) {
  // ... (错误处理部分保持不变)
}