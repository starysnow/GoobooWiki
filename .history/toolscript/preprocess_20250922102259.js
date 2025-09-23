// preprocess.js

require('@babel/register')({
    presets: ['@babel/preset-env']
});

const fs = require('fs');
const path = require('path');

// --- 配置区 ---
const sourceDir = path.resolve(__dirname, 'js/modules');
const outputDir = path.resolve(__dirname, 'public/preprocessed_json');
// ----------------

console.log('🚀 [Preprocessor] 开始将JS模块预处理为JSON...');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 递归函数来处理所有JS文件
function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath); // 递归进入子目录
    } else if (entry.name.endsWith('.js')) {
      processJsFile(fullPath);
    }
  }
}

function processJsFile(filePath) {
  console.log(`  -> 正在处理: ${filePath}`);
  try {
    // 关键：使用 require() 来执行JS模块并获取其导出的内容
    const module = require(filePath);
    const data = module.default; // 因为是 export default

    if (typeof data !== 'object' || data === null) {
      console.warn(`    [!] 跳过: ${filePath} 未导出对象。`);
      return;
    }

    // 创建与源文件结构相同的输出路径
    const relativePath = path.relative(sourceDir, filePath);
    const outputPath = path.join(outputDir, relativePath.replace('.js', '.json'));

    // 确保输出文件的目录存在
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // 将对象序列化为JSON字符串
    // 我们使用一个特殊的replacer来处理函数
    const jsonString = JSON.stringify(data, (key, value) => {
      if (typeof value === 'function') {
        return `FUNCTION_BODY::${value.toString()}`;
      }
      return value;
    }, 2);

    fs.writeFileSync(outputPath, jsonString, 'utf-8');
    console.log(`    [+] 成功预处理: ${outputPath}`);

  } catch (error) {
    console.error(`    [-] 处理失败: ${filePath} - ${error.message}`);
  }
}

// 开始执行
processDirectory(sourceDir);
console.log('\n✅ [Preprocessor] 所有JS模块已预处理完毕。');