// convert.js (升级版：自动处理整个文件夹)

// const csvtojson = require('csvtojson');
// const fs = require('fs');
// const path = require('path');

import csv from 'csvtojson';
import fs from 'fs/promises'; // 使用 Node.js 内置的、基于 Promise 的 fs 模块
import path from 'path';
import { globSync } from 'glob'; // 引入 glob 来递归查找文件

// --- 配置路径 ---
const sourceDir = './data/csv';    // 存放CSV源文件的文件夹
const outputDir = './data/json';   // 存放生成的JSON文件的文件夹

console.log('开始批量转换CSV文件...');

// 1. 确保输出目录存在，如果不存在则创建
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir, { recursive: true });
//   console.log(`已创建输出目录: ${outputDir}`);
// }

// // 2. 读取源文件夹下的所有文件
// fs.readdir(sourceDir, (err, files) => {
//   if (err) { /* ... */ }
//   const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
//   if (csvFiles.length === 0) { /* ... */ }

//   csvFiles.forEach(csvFile => {
//     const csvFilePath = path.join(sourceDir, csvFile);
//     const jsonFileName = `${path.basename(csvFile, '.csv')}.json`;
//     const jsonFilePath = path.join(outputDir, jsonFileName);

//     csvtojson()
//       .fromFile(csvFilePath)
//       .then((jsonArray) => {

//         // --- 核心新增：智能填充逻辑 ---
//         if (jsonArray.length > 0) {
//           const headers = Object.keys(jsonArray[0]);
//           for (let i = 1; i < jsonArray.length; i++) {
//             headers.forEach(header => {
//               // 如果当前单元格是空的，就用上一行的值来填充
//               if (jsonArray[i][header] === '' || jsonArray[i][header] === null) {
//                 jsonArray[i][header] = jsonArray[i - 1][header];
//               }
//             });
//           }
//         }
//         // 将转换后的数据写入JSON文件
//         fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
//         console.log(`成功: ${jsonFileName} 已保存。`);
//       })
//       .catch((err) => {
//         console.error(`失败: 转换 ${csvFile} 时发生错误。`, err);
//       });
//   });
// });

async function main() {
    console.log('开始批量转换CSV文件...');

    // 1. 确保输出目录存在，如果不存在则创建
    await fs.mkdir(outputDir, { recursive: true });

    // 2. 使用 glob 递归查找所有 .csv 文件
    const csvFiles = globSync(`${sourceDir}/**/*.csv`);

    if (csvFiles.length === 0) {
        console.log('在源目录中没有找到任何 .csv 文件。');
        return;
    }

    console.log(`找到了 ${csvFiles.length} 个 .csv 文件需要转换。`);

    // 3. 遍历并处理每个文件
    for (const csvFilePath of csvFiles) {
        try {
            // 4. 构建输出路径，并保留原始目录结构
            const relativePath = path.relative(sourceDir, csvFilePath);
            const pathObject = path.parse(relativePath);
            const newRelativePath = path.join(pathObject.dir, `${pathObject.name}.json`);
            const jsonFilePath = path.join(outputDir, newRelativePath);

            // 5. 进行 CSV 到 JSON 的转换
            const jsonArray = await csv().fromFile(csvFilePath);

            // 6. 应用智能填充逻辑
            smartFill(jsonArray);

            // 7. 确保输出文件的子目录存在
            await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });

            // 8. 将转换后的数据写入JSON文件
            await fs.writeFile(jsonFilePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
            console.log(`成功: ${relativePath} -> ${newRelativePath}`);

        } catch (err) {
            console.error(`失败: 转换 ${path.basename(csvFilePath)} 时发生错误。`, err);
        }
    }
}

main().catch(console.error);