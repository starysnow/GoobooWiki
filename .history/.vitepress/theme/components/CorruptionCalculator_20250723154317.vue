<template>
  <div class="calculator-container-vp">
    <div class="content-wrapper">
      <div class="param-grid">
        <fieldset>
          <legend>基础设置</legend>
          <div class="input-row"><label for="corr-target-floor">目标层数</label><input type="number" v-model.number="params.targetFloor" id="corr-target-floor" min="1"></div>
          <div class="input-row"><label for="corr-flesh-per-sec">腐烂的肉体/秒</label><input type="number" v-model.number="params.fleshPerSec" id="corr-flesh-per-sec" min="0"></div>
          <div class="input-row"><label for="corr-grey-circle-lvl">灰圈等级</label><input type="number" v-model.number="params.greyCircleLvl" id="corr-grey-circle-lvl" min="0"></div>
          <div class="input-row"><label for="corr-current-ritual-lvl">当前净化仪式等级</label><input type="number" v-model.number="params.currentRitualLvl" id="corr-current-ritual-lvl" min="0"></div>
        </fieldset>
        <fieldset>
          <legend>卡片效果</legend>
          <div class="input-row"><label>腐败卡片数量 (x1.15)</label><input type="number" v-model.number="params.cardAddCount" id="corr-card-add" min="0" max="4"></div>
          <div class="input-row"><label>液体过滤器 (1/1.05)</label><input type="checkbox" v-model="params.hasCardReduce105" id="corr-card-reduce-105"></div>
          <div class="input-row"><label>不允许腐败 (1/1.1)</label><input type="checkbox" v-model="params.hasCardReduce110" id="corr-card-reduce-110"></div>
        </fieldset>
        <fieldset>
          <legend>装备 & 圣遗物</legend>
          <div class="input-row"><label>圣遗物:有益的病毒 (-50)</label><input type="checkbox" v-model="params.hasRelicVirus" id="corr-relic-virus"></div>
          <div class="input-row"><label>瘟疫使者 (x2)</label><input type="checkbox" v-model="params.hasEquipAdd2" id="corr-equip-add-2"></div>
          <div class="input-row"><label>x1.15 腐败装备数量</label><input type="number" v-model.number="params.equipAdd115Count" id="corr-equip-add-115" min="0"></div>
          <div class="input-row"><label>实验疫苗</label>
            <div class="input-control">
              <input type="checkbox" v-model="params.hasEquipVaccine" id="corr-equip-vaccine">
              <select v-model.number="params.masteryVaccine" id="corr-mastery-vaccine" :disabled="!params.hasEquipVaccine">
                <option value="0">精通0-1</option><option value="2">精通2-3</option><option value="4">精通4+</option>
              </select>
            </div>
          </div>
          <div class="input-row"><label>洁面液</label>
            <div class="input-control">
              <input type="checkbox" v-model="params.hasEquipCleanser" id="corr-equip-cleanser">
              <select v-model.number="params.masteryCleanser" id="corr-mastery-cleanser" :disabled="!params.hasEquipCleanser">
                <option value="0">精通0-1</option><option value="2">精通2-3</option><option value="4">精通4+</option>
              </select>
            </div>
          </div>
           <div class="input-row"><label>安神丸</label>
            <div class="input-control">
              <input type="checkbox" v-model="params.hasEquipPill" id="corr-equip-pill">
              <select v-model.number="params.masteryPill" id="corr-mastery-pill" :disabled="!params.hasEquipPill">
                <option value="0">精通0-1</option><option value="2">精通2-3</option><option value="4">精通4+</option>
              </select>
            </div>
          </div>
        </fieldset>
      </div>
      <div class="results-area">
        <table id="corr-results-table">
          <thead><tr><th>层数</th><th>当前腐败值</th><th>清零所需时间(声望后用时)</th></tr></thead>
          <tbody>
            <tr v-for="result in results" :key="result.floor">
              <td>{{ result.floor }}</td>
              <td>{{ result.displayCorruption }}</td>
              <td>{{ result.timeNeeded }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="note">
        <p class="note">注释：</p>
        <ol>
            <li>清零所需时间详细解释：声望开始后通过净化仪式加点使当层腐败降至0以下的所需时间，不是当前所需时间，所以也不受“当前净化仪式等级”影响</li>
            <li>受加点完雕刻所需时间影响，会有些许误差</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue';
const LOCAL_STORAGE_KEY = 'corruptionCalculatorVitePress';
const params = reactive({
    targetFloor: 100, fleshPerSec: 1000, greyCircleLvl: 0, currentRitualLvl: 0,
    cardAddCount: 0, hasCardReduce105: false, hasCardReduce110: false,
    hasRelicVirus: false, hasEquipAdd2: false, equipAdd115Count: 0,
    hasEquipVaccine: false, masteryVaccine: 0, hasEquipCleanser: false, masteryCleanser: 0,
    hasEquipPill: false, masteryPill: 0,
});
function calculateFleshCost(levelsNeeded) {
    if (levelsNeeded <= 0) return 0;
    let totalCost = 0, currentCost = 2000;
    for (let i = 0; i < levelsNeeded; i++) {
        totalCost += currentCost;
        currentCost *= 1.12;
    }
    return totalCost;
}
function formatTime(totalSeconds) {
    if (totalSeconds === Infinity) return "∞";
    if (totalSeconds <= 0) return "0秒";
    const d = Math.floor(totalSeconds / 86400); totalSeconds %= 86400;
    const h = Math.floor(totalSeconds / 3600); totalSeconds %= 3600;
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    let parts = [];
    if (d > 0) parts.push(`${d}天`);
    if (h > 0) parts.push(`${h}小时`);
    if (m > 0) parts.push(`${m}分钟`);
    if (s > 0 || parts.length === 0) parts.push(`${s.toFixed(0)}秒`);
    return parts.join(' ');
}
function getCorruption(floor, currentParams, considerCurrentRitual) {
    let corruption = floor * 10 - 400;
    corruption -= (currentParams.greyCircleLvl * 12);
    corruption *= Math.pow(1.15, currentParams.cardAddCount);
    corruption *= Math.pow(1.15, currentParams.equipAdd115Count);
    if (currentParams.hasEquipAdd2) corruption *= 2;
    if (currentParams.hasCardReduce105) corruption /= 1.05;
    if (currentParams.hasCardReduce110) corruption /= 1.1;
    if (currentParams.hasEquipVaccine) {
        let divisor = 1.2;
        if (currentParams.masteryVaccine === 2) divisor = 1.255;
        if (currentParams.masteryVaccine === 4) divisor = 1.314;
        corruption /= divisor;
    }
    if (currentParams.hasRelicVirus) corruption -= 50;
    if (currentParams.hasEquipCleanser) {
        let reduction = 55;
        if (currentParams.masteryCleanser === 2) reduction *= 1.5;
        if (currentParams.masteryCleanser === 4) reduction *= 2;
        corruption -= reduction;
    }
    if (currentParams.hasEquipPill) {
        let reduction = 20;
        if (currentParams.masteryPill === 2) reduction *= 1.5;
        if (currentParams.masteryPill === 4) reduction *= 2;
        corruption -= reduction;
    }
    if (considerCurrentRitual) { corruption -= (currentParams.currentRitualLvl * 8); }
    return corruption;
}
const results = computed(() => {
  const tableRows = [];
  for (let i = -5; i <= 5; i++) {
    const currentFloor = params.targetFloor + i;
    if (currentFloor < 1) continue;
    const corruptionToClear = getCorruption(currentFloor, params, false);
    const displayCorruption = getCorruption(currentFloor, params, true);
    let timeNeeded = 0;
    if (corruptionToClear > 0) {
      const levelsNeeded = Math.ceil(corruptionToClear / 8);
      const totalFleshNeeded = calculateFleshCost(levelsNeeded);
      timeNeeded = (params.fleshPerSec > 0) ? totalFleshNeeded / params.fleshPerSec : Infinity;
    }
    tableRows.push({
      floor: currentFloor,
      displayCorruption: displayCorruption.toFixed(2),
      timeNeeded: formatTime(timeNeeded),
    });
  }
  return tableRows;
});
function saveData() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(params));
}
function loadData() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      Object.assign(params, JSON.parse(saved));
    } catch(e) {
      console.error("Failed to load corruption calculator state:", e);
    }
  }
}
watch(params, saveData, { deep: true });
onMounted(loadData);
</script>

<style scoped>
/* Scoped styles are nearly identical to the gas calculator, so we reuse the classes */
:root {
    --primary-color: #3498db;
}
.calculator-container-vp {
    background-color: var(--container-bg); color: var(--text-color); padding: 25px;
    border-radius: 8px; margin: 20px 0; border: 1px solid var(--vp-c-divider);
}
.content-wrapper { display: flex; flex-wrap: wrap; gap: 20px; }
.param-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; flex: 2;
}
fieldset {
    border: 1px solid var(--vp-c-divider); border-radius: 6px; padding: 10px 15px 15px 15px; margin: 0;
}
legend { padding: 0 10px; font-weight: bold; color: var(--primary-color); }
.input-row {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 10px;
}
.input-row label { flex-shrink: 0; font-size: 14px; }
.input-row .input-control { display: flex; align-items: center; gap: 8px; }
.input-row input, .input-row select {
    width: 80px; padding: 6px; border-radius: 4px; border: 1px solid var(--vp-c-divider);
    text-align: center; background-color: var(--vp-c-bg); color: var(--vp-c-text-1);
}
input[type="checkbox"] { width: auto; }
.results-area { flex: 1; min-width: 350px; }
table { border-collapse: collapse; width: 100%; margin-top: 0; }
th, td { border: 1px solid var(--vp-c-divider); padding: 10px 12px; text-align: center; vertical-align: middle; }
th { background-color: var(--vp-c-bg-soft); font-weight: 600; }
.note { font-size: 12px; color: var(--vp-c-text-2); margin-top: 15px; flex-basis: 100%;}
</style>