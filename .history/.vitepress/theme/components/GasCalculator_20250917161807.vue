<template>
  <div class="calculator-card">
    <div class="card-header">
      <h2>气体总量计算器</h2>
      <div class="controls">
        <label for="targetLevel">到达层数:</label>
        <div class="input-group with-buttons">
          <button @click="adjustValue('targetLevel', -1)">-</button>
          <input type="number" id="targetLevel" v-model.number="targetLevel" min="1" step="any">
          <button @click="adjustValue('targetLevel', 1)">+</button>
        </div>
      </div>
    </div>

    <div class="table-container">
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
        <tbody>
          <tr v-for="(gas, index) in gasData" :key="index">
            <td>{{ gas.name }}</td>
            <td>{{ gas.distribution }}</td>
            <td>
              <div class="input-group amount-input">
                <input type="number" v-model.number="gas.initialAmount" min="0">
                <select v-model="gas.initialUnit">
                  <option v-for="unit in units" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
                </select>
              </div>
            </td>
            <td>
              <div class="input-group with-buttons">
                 <button @click="adjustValue(index, 'gainFactor', -0.1)">-</button>
                 <input type="number" v-model.number="gas.gainFactor" min="0" step="0.1">
                 <button @click="adjustValue(index, 'gainFactor', 0.1)">+</button>
              </div>
            </td>
            <td>
              <div class="input-group with-buttons">
                <button @click="adjustValue(index, 'incrementFactor', -0.1)">-</button>
                <input type="number" v-model.number="gas.incrementFactor" min="0" step="0.1">
                <button @click="adjustValue(index, 'incrementFactor', 0.1)">+</button>
              </div>
            </td>
            <td class="result-cell">{{ formatNumber(gas.finalAmount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="note">
      <p><strong>注释:</strong></p>
      <ol>
        <li>适用于在声望开始时使用气体中途不再使用的情况（即一开始就规划好活塞和收割机的加点数，这样也是最划算的）</li>
        <li>两系数的定义源自群wiki，具体而言，增益系数指黄水晶加点的那个，增量系数指用红宝石加点的那个</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
// <script setup> 部分的代码保持不变，无需修改
import { ref, reactive, watch, computed } from 'vue';

const targetLevel = ref(62);

const units = reactive([
  { label: '无', value: 1 }, { label: 'K', value: 1e3 }, { label: 'M', value: 1e6 },
  { label: 'B', value: 1e9 }, { label: 'T', value: 1e12 }, { label: 'Qa', value: 1e15 },
  { label: 'Qi', value: 1e18 },
]);

const gasData = reactive([
  { name: '氢', distribution: '1+', initialAmount: 30.19, initialUnit: 1e3, gainFactor: 5, incrementFactor: 1, appearanceLevel: 1 },
  { name: '氦', distribution: '41+', initialAmount: 702, initialUnit: 1, gainFactor: 1.5, incrementFactor: 1, appearanceLevel: 41 },
  { name: '氧', distribution: '91+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 91 },
  { name: '氮', distribution: '151+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 151 },
  { name: '氙', distribution: '301+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 301 },
  { name: '氪', distribution: '601+', initialAmount: 0, initialUnit: 1, gainFactor: 0, incrementFactor: 1, appearanceLevel: 601 },
]);

const calculateGasAmount = (gas) => {
  if (targetLevel.value < gas.appearanceLevel) return 0;
  const initialValue = gas.initialAmount * gas.initialUnit;
  const gain = gas.gainFactor / 100;
  const increment = gas.incrementFactor / 100;
  const x = targetLevel.value;
  const appear = gas.appearanceLevel;
  const baseCapacity = 100 * (x + 1 - appear) * Math.pow(1 + gain, x - appear);
  return (baseCapacity + initialValue) * increment;
};

const processedGasData = computed(() => {
    return gasData.map(gas => ({ ...gas, finalAmount: calculateGasAmount(gas) }));
});

watch(processedGasData, (newData) => {
    newData.forEach((newItem, index) => { gasData[index].finalAmount = newItem.finalAmount; });
}, { immediate: true, deep: true });

const formatNumber = (num) => {
  if (num === 0) return '0.00';
  if (num < 1e3) return num.toFixed(2);
  const suffixes = [
      { value: 1e18, symbol: 'Qi' }, { value: 1e15, symbol: 'Qa' }, { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'B' }, { value: 1e6, symbol: 'M' }, { value: 1e3, symbol: 'K' }
  ];
  for (let i = 0; i < suffixes.length; i++) {
    if (num >= suffixes[i].value) {
      return (num / suffixes[i].value).toFixed(2) + ' ' + suffixes[i].symbol;
    }
  }
  return num.toFixed(2);
};

const adjustValue = (indexOrTarget, key, amount) => {
    if (indexOrTarget === 'targetLevel') {
        targetLevel.value = Math.max(1, targetLevel.value + amount);
    } else {
        const gas = gasData[indexOrTarget];
        if (gas && typeof gas[key] === 'number') {
            gas[key] = parseFloat(Math.max(0, gas[key] + amount).toFixed(2));
        }
    }
};
</script>

<style scoped>
/* --- 主容器卡片样式 --- */
.calculator-card {
    background-color: var(--vp-c-bg-soft);
    border-radius: 12px;
    border: 1px solid var(--vp-c-divider);
    padding: 24px;
    margin: 32px auto;
    max-width: 1000px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .calculator-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--vp-c-divider);
}

h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.controls label {
    font-weight: 500;
    color: var(--vp-c-text-2);
}

/* --- 表格样式 --- */
.table-container {
    overflow-x: auto; /* 在小屏幕上可以横向滚动 */
}

table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
}

th, td {
    padding: 12px 16px;
    text-align: center;
    vertical-align: m
}
<sytle/>