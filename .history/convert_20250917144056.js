// convert.js (升级版：自动处理整个文件夹)

const csvtojson = require('csvtojson');
const fs = require('fs');
const path = require('path');

// --- 配置路径 ---
const sourceDir = './data/csv';       // 存放CSV源文件的文件夹
const outputDir = './data/json';         // 存放生成的JSON文件的文件夹
// -----------------

console.log('开始批量转换CSV文件...');

// 1. 确保输出目录存在，如果不存在则创建
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`已创建输出目录: ${outputDir}`);
}

// 2. 读取源文件夹下的所有文件
fs.readdir(sourceDir, (err, files) => {
  if (err) { /* ... */ }
  const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
  if (csvFiles.length === 0) { /* ... */ }

  csvFiles.forEach(csvFile => {
    const csvFilePath = path.join(sourceDir, csvFile);
    const jsonFileName = `${path.basename(csvFile, '.csv')}.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);

    csvtojson()
      .fromFile(csvFilePath)
      .then((jsonArray) => {

        // --- 核心新增：智能填充逻辑 ---
        if (jsonArray.length > 0) {
          const headers = Object.keys(jsonArray[0]);
          for (let i = 1; i < jsonArray.length; i++) {
            headers.forEach(header => {
              // 如果当前单元格是空的，就用上一行的值来填充
              if (jsonArray[i][header] === '' || jsonArray[i][header] === null) {
                jsonArray[i][header] = jsonArray[i - 1][header];
              }
            });
          }
        }
        // 将转换后的数据写入JSON文件
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
        console.log(`成功: ${jsonFileName} 已保存。`);
      })
      .catch((err) => {
        console.error(`    👎 失败: 转换 ${csvFile} 时发生错误。`, err);
      });
  });
});