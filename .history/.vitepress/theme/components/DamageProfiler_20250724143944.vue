<template>
  <div class="profiler-card">
    <h3>基础攻击与切割伤害 占比分析</h3>

    <!-- 控制区域 -->
    <div class="controls-grid">
      <!-- 基础攻击控制 -->
      <div class="control-item">
        <label for="base-attack-input">基础攻击 (% of Max HP)</label>
        <div class="input-group">
          <input type="range" min="0" max="50" step="0.1" v-model.number="baseAttackPercent">
          <input type="number" id="base-attack-input" min="0" max="50" step="0.1" v-model.number="baseAttackPercent" class="number-input">
          <span>%</span>
        </div>
      </div>

      <!-- 切割伤害控制 -->
      <div class="control-item">
        <label for="cutting-input">切割伤害 (% of Current HP)</label>
        <div class="input-group">
          <input type="range" min="0" max="100" step="1" v-model.number="cuttingPercent">
          <input type="number" id="cutting-input" min="0" max="100" step="1" v-model.number="cuttingPercent" class="number-input">
          <span>%</span>
        </div>
      </div>

      <!-- 切割效果削弱选项 -->
      <div class="control-item checkbox-item">
        <input type="checkbox" id="nerf-cutting" v-model="isCuttingNerfed">
        <label for="nerf-cutting">削弱切割效果 (效果 / 10)</label>
      </div>
    </div>

    <!-- 图表与结果展示区 (并排布局) -->
    <div class="results-container">
      <div class="chart-area">
        <canvas ref="damageChartCanvas"></canvas>
      </div>
      <div class="summary-area">
        <h4>最终结果分析</h4>
        <div v-if="killProfile.totalHits > 0">
          <p>
            击杀所需攻击次数: <strong>{{ killProfile.totalHits }}</strong>
          </p>
          <div class="summary-item base-damage">
            <span>基础攻击总占比</span>
            <strong>{{ killProfile.baseProportion.toFixed(2) }}%</strong>
          </div>
          <div class="summary-item cutting-damage">
            <span>切割伤害总占比</span>
            <strong>{{ killProfile.cuttingProportion.toFixed(2) }}%</strong>
          </div>
        </div>
        <div v-else class="no-damage-note">
          <p>当前配置无法造成伤害。</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

// --- 响应式状态：用户输入 ---
const baseAttackPercent = ref(5); // 基础攻击造成最大生命值5%的伤害
const cuttingPercent = ref(10);  // 切割造成当前生命值10%的伤害
// const numberOfHits = ref(20); // 之前接受的情况，注释掉
const isCuttingNerfed = ref(false); // 新增：切割是否被削弱的复选框状态

// --- 计算属性：根据输入动态生成击杀数据 ---
const killProfile = computed(() => {
  let currentHealth = 100; // 假设敌人总生命值为100
  let totalBaseDamage = 0;
  let totalCuttingDamage = 0;
  let hits = 0;

  const effectiveCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;
  const baseHitDamage = baseAttackPercent.value;

  if (baseHitDamage <= 0 && effectiveCuttingPercent <= 0) {
    return { totalHits: 0, baseProportion: 0, cuttingProportion: 0, totalBaseDamage: 0, totalCuttingDamage: 0 };
  }

  // 循环直到生命值归零
  while (currentHealth > 0 && hits < 10000) { // 添加一个安全上限防止无限循环
    hits++;

    // 1. 计算本次攻击的两种伤害
    // 重要：切割在普通攻击后结算
    const cuttingHitDamage = currentHealth * (effectiveCuttingPercent / 100);

    // 2. 更新当前生命值
    currentHealth -= (baseHitDamage + cuttingHitDamage);

    // 3. 累计总伤害
    totalBaseDamage += baseHitDamage;
    totalCuttingDamage += cuttingHitDamage;
  }

  // 如果是因为生命值耗尽而结束循环，可能伤害溢出，需要校正
  if (currentHealth <= 0) {
      const overkill = -currentHealth;
      const totalDamageBeforeCorrection = baseHitDamage + ( (currentHealth + overkill) * (effectiveCuttingPercent/100) );
      if (totalDamageBeforeCorrection > 0) {
        const baseCorrection = overkill * (baseHitDamage / totalDamageBeforeCorrection);
        const cuttingCorrection = overkill * ( ( (currentHealth + overkill) * (effectiveCuttingPercent/100) ) / totalDamageBeforeCorrection);
        totalBaseDamage -= baseCorrection;
        totalCuttingDamage -= cuttingCorrection;
      }
  }


  const totalDamage = totalBaseDamage + totalCuttingDamage;
  const baseProportion = totalDamage > 0 ? (totalBaseDamage / totalDamage) * 100 : 0;
  const cuttingProportion = totalDamage > 0 ? (totalCuttingDamage / totalDamage) * 100 : 0;

  return {
    totalHits: hits,
    baseProportion,
    cuttingProportion,
    totalBaseDamage,
    totalCuttingDamage
  };
});

// --- 图表渲染逻辑 ---
const damageChartCanvas = ref(null);
let chartInstance = null;

function renderChart(profileData) {
  if (!damageChartCanvas.value) return;
  if (typeof Chart === 'undefined') {
      console.error("Chart.js is not loaded!");
      return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = damageChartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    // 使用甜甜圈图 (doughnut) 或饼图 (pie)
    type: 'doughnut',
    data: {
      labels: [ '基础攻击', '切割伤害' ],
      datasets: [
        {
          label: '伤害占比',
          data: [ profileData.totalBaseDamage, profileData.totalCuttingDamage ],
          backgroundColor: [ 'rgb(54, 162, 235)', 'rgb(255, 99, 132)' ],
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '击杀总伤害构成'
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (value / total * 100).toFixed(2) : 0;
                    return `${label}: ${percentage}%`;
                }
            }
        }
      }
    }
  });
}

// --- 生命周期与监视 ---
onMounted(() => {
  nextTick(() => {
      renderChart(killProfile.value);
  });
});

// 监视击杀数据的变化，并自动重新渲染图表
watch(killProfile, (newData) => {
  renderChart(newData);
});
</script>

<style scoped>
.profiler-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}
h3 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 2rem;
  font-weight: 600;
}
.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem 2rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.control-item label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
input[type="range"] {
  flex-grow: 1;
  width: 100%;
}
.number-input {
  width: 70px;
  text-align: center;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1.5rem; /* 与其他控制项对齐 */
}
.checkbox-item label {
  margin-bottom: 0;
}
.results-container {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.chart-area {
  position: relative;
  height: 250px;
  width: 250px;
  flex-shrink: 0;
}
.summary-area {
  flex-grow: 1;
}
.summary-area h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}
.summary-item.base-damage {
  background-color: rgba(54, 162, 235, 0.1);
}
.summary-item.cutting-damage {
  background-color: rgba(255, 99, 132, 0.1);
}
.summary-item strong {
  font-size: 1.5em;
  font-family: 'Courier New', Courier, monospace;
}
.no-damage-note {
    color: var(--vp-c-text-3);
}

@media (max-width: 768px) {
    .results-container {
        flex-direction: column;
    }
}
</style>