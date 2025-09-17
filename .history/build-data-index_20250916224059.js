// build-data-index.js
// 
const fs = require('fs');
const path = require('path');

// --- 配置路径 ---
const jsonDir = './docs/data/json'; // 你的JSON文件存放目录
const outputDir = './docs/.vitepress/theme'; // 输出配置文件的目录
const outputFile = path.join(outputDir, 'data-index.js');
// -----------------

console.log('🚀 [Data Indexer] 开始扫描JSON文件...');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. 读取JSON目录下的所有文件
try {
  const files = fs.readdirSync(jsonDir);

  // 2. 筛选出.json文件并生成导入语句和配置对象
  const imports = [];
  const tableConfigs = [];

  files.forEach(file => {
    if (path.extname(file).toLowerCase() === '.json') {
      const baseName = path.basename(file, '.json'); // 获取不带后缀的文件名，例如 "锭"
      const variableName = `data${baseName.replace(/[^a-zA-Z0-9]/g, '')}`; // 创建一个合法的变量名，例如 "data锭" -> "data"

      // 生成导入语句
      // 注意：我们使用相对于输出文件的路径
      const importPath = `../../../data/json/${file}`; // 从 theme/ 目录出发
      imports.push(`import ${variableName} from '${importPath}';`);

      // 生成配置对象
      tableConfigs.push(`
  {
    id: '${baseName.toLowerCase()}-table',
    title: '${baseName}',
    data: ${variableName}
  }`);
    }
  });

  // 3. 组合成最终的JS文件内容
  const fileContent = `// 该文件由 build-data-index.js 自动生成，请勿手动修改！

${imports.join('\n')}

export const allTables = [${tableConfigs.join(',\n')}
];
`;

  // 4. 将内容写入到配置文件
  fs.writeFileSync(outputFile, fileContent, 'utf-8');
  console.log(`✅ [Data Indexer] 成功生成数据索引: ${outputFile}`);

} catch (error) {
  console.error('❌ [Data Indexer] 生成数据索引时发生错误:', error);
  // 如果json目录不存在，创建一个空索引，避免构建失败
  if (error.code === 'ENOENT') {
    const emptyContent = `// 自动生成的空索引\n\nexport const allTables = [];`;
    fs.writeFileSync(outputFile, emptyContent, 'utf-8');
    console.warn('⚠️ [Data Indexer] JSON目录不存在，已生成空索引。');
  }
}