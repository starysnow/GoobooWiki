// convert.js (升级版：自动处理整个文件夹)

const csvtojson = require('csvtojson');
const fs = require('fs');
const path = require('path');

// --- 配置路径 ---
const sourceDir = './data/csv';       // 存放CSV源文件的文件夹
const outputDir = './data/json';         // 存放生成的JSON文件的文件夹
// -----------------

console.log('🚀 开始批量转换CSV文件...');

// 1. 确保输出目录存在，如果不存在则创建
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ 已创建输出目录: ${outputDir}`);
}

// 2. 读取源文件夹下的所有文件
fs.readdir(sourceDir, (err, files) => {
  if (err) {
    console.error(`❌ 无法扫描源目录: ${sourceDir}`, err);
    return;
  }

  // 3. 筛选出所有 .csv 文件
  const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');

  if (csvFiles.length === 0) {
    console.warn('⚠️ 在源目录中没有找到任何 .csv 文件。');
    return;
  }

  console.log(`🔍 找到了 ${csvFiles.length} 个CSV文件，准备转换...`);

  // 4. 为每个CSV文件执行转换操作
  csvFiles.forEach(csvFile => {
    const csvFilePath = path.join(sourceDir, csvFile);
    // 生成与CSV同名但后缀为.json的文件名
    const jsonFileName = `${path.basename(csvFile, '.csv')}.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);

    console.log(`  - 正在转换: ${csvFile} -> ${jsonFileName}`);

    csvtojson()
      .fromFile(csvFilePath)
      .then((jsonArray) => {
        // 将转换后的数据写入JSON文件
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
        console.log(`    👍 成功: ${jsonFileName} 已保存。`);
      })
      .catch((err) => {
        console.error(`    👎 失败: 转换 ${csvFile} 时发生错误。`, err);
      });
  });
});