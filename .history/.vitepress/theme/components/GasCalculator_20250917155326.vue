<template>
  <div id="gas-calculator-container">
    <h2>气体总量计算器</h2>
    <div class="controls">
      <label for="targetLevel">到达层数:</label>
      <input type="number" id="targetLevel" v-model.number="targetLevel" min="1" step="any">
    </div>
    <table>
      <thead>
        <tr>
          <th>气态</th>
          <th>分布</th>
          <th>初始量</th>
          <th>增益系数 (%)</th>
          <th>增量系数 (%)</th>
          <th>最终总量 (击碎后)</th>
        </tr>
      </thead>
      <tbody id="gas-table-body">
        <tr v-for="(gas, index) in gasData" :key="index">
          <td>{{ gas.name }}</td>
          <td>{{ gas.distribution }}</td>
          <td>
            <div class="input-group">
              <input type="number" v-model.number="gas.initialAmount" min="0">
              <select v-model="gas.initialUnit">
                <option v-for="unit in units" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
              </select>
            </div>
          </td>
          <td>
            <div class="input-group">
              <input type="number" v-model.number="gas.gainFactor" min="0">
            </div>
          </td>
          <td>
            <div class="input-group">
              <input type="number" v-model.number="gas.incrementFactor" min="0">
            </div>
          </td>
          <td class="result-cell">{{ formatNumber(gas.finalAmount) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="note">
      <p>注释:</p>
      <ol>
        <li>适用于在声望开始时使用气体中途不再使用的情况（即一开始就规划好活塞和收割机的加点数，这样也是最划算的）</li>
        <li>两系数的定义源自群wiki，具体而言，增益系数指黄水晶加点的那个，增量系数指用红宝石加点的那个</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';

// --- 响应式数据 ---
const targetLevel = ref(100); // 默认到达层数

const units = reactive([
  { label: '无', value: 1 },
  { label: 'K', value: 1e3 },
  { label: 'M', value: 1e6 },
  { label: 'B', value: 1e9 },
  { label: 'T', value: 1e12 },
  { label: 'Qa', value: 1e15 },
  { label: 'Qi', value: 1e18 },
]);

const gasData = reactive([
  { name: '氢', distribution: '1+', initialAmount: 105.9, initialUnit: 1e3, gainFactor: 6, incrementFactor: 1, appearanceLevel: 1 },
  { name: '氦', distribution: '41+', initialAmount: 3150, initialUnit: 1, gainFactor: 2.5, incrementFactor: 1, appearanceLevel: 41 },
  { name: '氧', distribution: '91+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 91 },
  { name: '氮', distribution: '151+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 151 },
]);

// --- 计算逻辑 ---
const calculateGasAmount = (gas) => {
  if (targetLevel.value < gas.appearanceLevel) {
    return 0;
  }
  const initialValue = gas.initialAmount * gas.initialUnit;
  const gain = gas.gainFactor / 100;
  const increment = gas.incrementFactor / 100;
  const x = targetLevel.value;
  const appear = gas.appearanceLevel;

  // 根据Markdown公式: 100 * (x + 1 - appear) * (1 + gain)^(x - appear)
  const baseCapacity = 100 * (x + 1 - appear) * Math.pow(1 + gain, x - appear);

  // 最终总量 = (基础容量 + 初始量) * 增量系数
  return (baseCapacity + initialValue) * increment;
};

// --- 计算属性，用于在UI上显示最终结果 ---
const processedGasData = computed(() => {
    return gasData.map(gas => ({
        ...gas,
        finalAmount: calculateGasAmount(gas)
    }));
});

// 将计算结果更新回原始的 gasData 数组，以便模板可以访问
watch(processedGasData, (newData) => {
    newData.forEach((newItem, index) => {
        gasData[index].finalAmount = newItem.finalAmount;
    });
}, { immediate: true, deep: true });


// --- 格式化函数 ---
const formatNumber = (num) => {
  if (num === 0) return '0.00';
  if (num < 1e3) return num.toFixed(2);

  const suffixes = [
      { value: 1e18, symbol: 'Qi' },
      { value: 1e15, symbol: 'Qa' },
      { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'K' }
  ];

  for (let i = 0; i < suffixes.length; i++) {
    if (num >= suffixes[i].value) {
      return (num / suffixes[i].value).toFixed(3) + ' ' + suffixes[i].symbol;
    }
  }
  return num.toFixed(2);
};
</script>

<style scoped>
/* === Gas Calculator Styles (从原始CSS中提取并作用域化) === */
#gas-calculator-container {
    padding: 25px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    margin: 20px 0;
}

h2 {
    text-align: center;
    color: var(--vp-c-text-1);
    margin-top: 0;
    margin-bottom: 25px;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px auto;
}

th,
td {
    border: 1px solid var(--vp-c-divider);
    padding: 10px 12px;
    text-align: center;
    vertical-align: middle;
}

th {
    background-color: var(--vp-c-bg-soft);
    font-weight: 600;
}

input[type="number"],
select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--vp-c-divider);
    text-align: center;
    vertical-align: middle;
    background-color: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    width: 75px;
}

select {
    width: auto;
}

.note p,
.note ol li {
    font-size: 12px;
    color: var(--vp-c-text-2);
}

#gas-calculator-container .input-group {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

#gas-calculator-container .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background-color: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    margin-bottom: 20px;
}

#gas-calculator-container .controls label {
    font-weight: bold;
}

#gas-calculator-container .result-cell {
    font-weight: bold;
    color: var(--vp-c-brand); /* 使用VitePress品牌色以保持一致性 */
    min-width: 140px;
    font-size: 1.1em;
}
</style>