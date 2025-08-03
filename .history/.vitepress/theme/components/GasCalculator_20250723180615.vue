<template>
  <div class="calculator-container-vp">
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
        <tr v-for="gas in gasData" :key="gas.id">
          <td>{{ gas.name }}</td>
          <td>{{ gas.appearanceLevel }}+</td>
          <td>
            <div class="input-group">
              <input type="number" v-model.number="inputs[gas.id].initial" min="0" step="any">
              <select v-model="inputs[gas.id].suffix">
                <option value="none">无</option>
                <option v-for="s in SUFFIX_KEYS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </td>
          <td><input type="number" v-model.number="inputs[gas.id].gain" min="0" step="any"></td>
          <td><input type="number" v-model.number="inputs[gas.id].increment" min="0" step="any"></td>
          <td class="result-cell">{{ finalResults[gas.id] }}</td>
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
import { ref, reactive, computed, watch, onMounted } from 'vue';
const LOCAL_STORAGE_KEY_GAS = 'gasCalculatorVitePress';
const gasData = [
    { id: 'neon', name: '氖', appearanceLevel: 1 }, { id: 'deuterium', name: '氘', appearanceLevel: 41 },
    { id: 'tritium', name: '氚', appearanceLevel: 91 }, { id: 'krypton', name: '氪', appearanceLevel: 151 },
    { id: 'xenon', name: '氙', appearanceLevel: 301 }, { id: 'radon', name: '氡', appearanceLevel: 601 }
];
const SUFFIX_MAP_GAS = {'K':1e3,'M':1e6,'B':1e9,'T':1e12,'Qa':1e15,'Qi':1e18,'Sx':1e21,'Sp':1e24};
const SUFFIX_KEYS = Object.keys(SUFFIX_MAP_GAS);
const SUFFIX_LIST_DESC_GAS = Object.entries(SUFFIX_MAP_GAS).map(([key, value]) => ({ key, value })).reverse();
const targetLevel = ref(1);
const inputs = reactive(
  Object.fromEntries(
    gasData.map(gas => [gas.id, { initial: 0, suffix: 'none', gain: 0, increment: 1 }])
  )
);
function autoFormatNumber(num) {
    for (const { key, value } of SUFFIX_LIST_DESC_GAS) {
        if (num >= value) {
            return (num / value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + key;
        }
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const finalResults = computed(() => {
  const results = {};
  for (const gas of gasData) {
    const input = inputs[gas.id];
    const multiplier = SUFFIX_MAP_GAS[input.suffix] || 1;
    let total = (input.initial || 0) * multiplier;
    const gainCoeff = (input.gain || 0) / 100;
    const incrementCoeff = (input.increment || 0) / 100;
    const startLevel = Math.ceil(gas.appearanceLevel);
    if (targetLevel.value >= startLevel && incrementCoeff > 0) {
      for (let i = startLevel; i <= targetLevel.value; i++) {
        const limit = 100 * (i + 1 - gas.appearanceLevel) * Math.pow(1 + gainCoeff, i - gas.appearanceLevel);
        if (limit > total) {
          total += Math.ceil((limit - total) * incrementCoeff);
        }
      }
    }
    results[gas.id] = autoFormatNumber(total);
  }
  return results;
});
function saveData() {
  const state = { targetLevel: targetLevel.value, inputs: inputs };
  localStorage.setItem(LOCAL_STORAGE_KEY_GAS, JSON.stringify(state));
}
function loadData() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_GAS);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      targetLevel.value = state.targetLevel || 1;
      Object.assign(inputs, state.inputs);
    } catch (e) {
      console.error("Failed to load gas calculator state:", e);
    }
  }
}
watch([targetLevel, inputs], saveData, { deep: true });
onMounted(loadData);
</script>

<style scoped>
:root {
    --primary-color: #3498db; --background-color: #f4f7f9; --container-bg: #fff;
    --border-color: #d1d9e6; --text-color: #333; --text-light: #5a6a7e; --header-bg: #f2f5f8;
}
.calculator-container-vp {
    background-color: var(--container-bg); color: var(--text-color); padding: 25px;
    border-radius: 8px; margin: 20px 0; border: 1px solid var(--vp-c-divider);
}
h2 { text-align: center; margin-top: 0; font-weight: 600; }
table{ border-collapse: collapse; width: 100%; margin-top: 20px; }
th, td { border: 1px solid var(--vp-c-divider); padding: 10px 12px; text-align: center; vertical-align: middle; }
th { background-color: var(--vp-c-bg-soft); font-weight: 600; }
input[type="number"], select {
    padding: 8px; border-radius: 4px; border: 1px solid var(--vp-c-divider); text-align: center;
    vertical-align: middle; background-color: var(--vp-c-bg); color: var(--vp-c-text-1); width: 75px;
}
select { width: 65px; }
.note { font-size: 12px; color: var(--vp-c-text-2); margin-top: 15px; }
.input-group { display: flex; justify-content: center; align-items: center; gap: 5px; }
.controls {
    display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px;
    background-color: var(--vp-c-bg-soft); border-radius: 8px; margin-bottom: 20px;
}
.controls label { font-weight: bold; }
.result-cell { font-weight: bold; color: #e74c3c; min-width: 140px; font-size: 1.1em; }
</style>