<template>
  <div class="analysis-suite-card">

    <!-- Tab 内容区 -->
    <div class="tab-content">

      <div v-show="activeTab === 'profiler'">
        <h3>普通攻击与切割的伤害占比分析</h3>

        <!-- 控制区域 -->
        <div class="controls-grid">
          <div class="control-item">
            <label>基础攻击 (% of Max HP)</label>
            <div class="input-group">
              <input type="range" min="0" max="50" step="0.1" v-model.number="baseAttackPercent">
              <input type="number" min="0" max="50" step="0.1" v-model.number="baseAttackPercent" class="number-input">
              <span>%</span>
            </div>
          </div>
          <div class="control-item">
            <label>切割伤害 (% of Current HP)</label>
            <div class="input-group">
              <input type="range" min="0" max="100" step="1" v-model.number="cuttingPercent">
              <input type="number" min="0" max="100" step="1" v-model.number="cuttingPercent" class="number-input">
              <span>%</span>
            </div>
          </div>
          <div class="control-item checkbox-item">
            <input type="checkbox" id="nerf-cutting" v-model="isCuttingNerfed">
            <label for="nerf-cutting">削弱切割效果 (效果 / 10)</label>
          </div>
        </div>

        <!-- 图表与结果展示区 -->
        <div class="results-container">
          <div class="chart-area">
            <canvas ref="doughnutChartCanvas"></canvas>
          </div>
          <div class="summary-area">
            <h4>最终结果分析</h4>
            <div v-if="killProfile.totalHits > 0">
              <p>击杀所需攻击次数: <strong>{{ killProfile.totalHits }}</strong></p>
              <div class="summary-item base"><span>基础攻击总占比</span><strong>{{ killProfile.baseProportion.toFixed(2) }}%</strong></div>
              <div class="summary-item cutting"><span>切割伤害总占比</span><strong>{{ killProfile.cuttingProportion.toFixed(2) }}%</strong></div>
            </div>
            <div v-else class="no-damage-note"><p>当前配置无法造成伤害。</p></div>
          </div>
        </div>

        <!-- 手动验算区域 -->
        <div class="manual-check-area">
          <h4>单次攻击验算</h4>
          <div class="check-controls">
            <label for="check-hit-number">验算第</label>
            <input type="number" id="check-hit-number" v-model.number="checkHitNumber" min="1" :max="killProfile.totalHits">
            <label>次攻击</label>
          </div>
          <div v-if="manualCheckResult" class="check-result">
            <ul>
              <li>攻击前生命值: <code>{{ manualCheckResult.healthBefore.toFixed(2) }}%</code></li>
              <li>基础攻击伤害: <code>{{ baseAttackPercent.toFixed(2) }}%</code> (固定值)</li>
              <li>切割伤害计算: <code>{{ manualCheckResult.healthBefore.toFixed(2) }}% * {{ (isCuttingNerfed ? cuttingPercent / 10 : cuttingPercent).toFixed(2) }}% = {{ manualCheckResult.cuttingDamage.toFixed(2) }}%</code></li>
              <li>攻击后生命值: <code>{{ manualCheckResult.healthAfter.toFixed(2) }}%</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

// --- 全局状态 ---
const activeTab = ref('profiler');

// --- Profiler 状态 ---
const baseAttackPercent = ref(5);
const cuttingPercent = ref(10);
const isCuttingNerfed = ref(false);
const checkHitNumber = ref(1);

// --- Profiler 计算逻辑 ---
const killProfile = computed(() => {
    let currentHealth = 100, totalBaseDamage = 0, totalCuttingDamage = 0, hits = 0;
    const effectiveCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;
    const baseHitDamage = baseAttackPercent.value;
    if (baseHitDamage <= 0 && effectiveCuttingPercent <= 0) return { totalHits: 0, baseProportion: 0, cuttingProportion: 0, totalBaseDamage: 0, totalCuttingDamage: 0 };

    while (currentHealth > 0 && hits < 10000) {
        hits++;
        const cuttingHitDamage = currentHealth * (effectiveCuttingPercent / 100);
        currentHealth -= (baseHitDamage + cuttingHitDamage);
        totalBaseDamage += baseHitDamage;
        totalCuttingDamage += cuttingHitDamage;
    }

    if (currentHealth <= 0) {
      const overkill = -currentHealth;
      const lastHitDamage = baseHitDamage + ( (currentHealth + overkill) * (effectiveCuttingPercent/100) );
      if (lastHitDamage > 0) {
        totalBaseDamage -= overkill * (baseHitDamage / lastHitDamage);
        totalCuttingDamage -= overkill * ( ( (currentHealth + overkill) * (effectiveCuttingPercent/100) ) / lastHitDamage);
      }
    }

    const totalDamage = totalBaseDamage + totalCuttingDamage;
    const baseProportion = totalDamage > 0 ? (totalBaseDamage / totalDamage) * 100 : 0;
    const cuttingProportion = totalDamage > 0 ? (totalCuttingDamage / totalDamage) * 100 : 0;

    return { totalHits: hits, baseProportion, cuttingProportion, totalBaseDamage, totalCuttingDamage };
});

const manualCheckResult = computed(() => {
    const hitToCkeck = Math.floor(checkHitNumber.value);
    if (!hitToCkeck || hitToCkeck <= 0 || hitToCkeck > killProfile.value.totalHits) return null;
    let currentHealth = 100;
    const effectiveCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;
    const baseHitDamage = baseAttackPercent.value;
    for (let i = 1; i < hitToCkeck; i++) {
        if (currentHealth <= 0) break;
        currentHealth -= (baseHitDamage + currentHealth * (effectiveCuttingPercent / 100));
    }
    if (currentHealth <= 0) return null;
    const healthBefore = currentHealth;
    const cuttingDamage = healthBefore * (effectiveCuttingPercent / 100);
    const healthAfter = healthBefore - (baseHitDamage + cuttingDamage);
    return { healthBefore, cuttingDamage, healthAfter };
});


// --- Profiler 图表渲染 ---
const doughnutChartCanvas = ref(null);
let doughnutChartInstance = null;
function renderDoughnutChart(profileData) {
    if (!doughnutChartCanvas.value || typeof Chart === 'undefined') return;
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    doughnutChartInstance = new Chart(doughnutChartCanvas.value.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['基础攻击', '切割伤害'],
            datasets: [{
                data: [profileData.totalBaseDamage, profileData.totalCuttingDamage],
                backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: '击杀总伤害构成' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${(ctx.parsed / (profileData.totalBaseDamage + profileData.totalCuttingDamage) * 100).toFixed(2)}%`
                    }
                }
            }
        }
    });
}

// --- 生命周期与监视 ---
onMounted(() => {
    nextTick(() => {
        renderDoughnutChart(killProfile.value);
    });
});

watch(killProfile, (newData) => {
    renderDoughnutChart(newData);
});

</script>

<style scoped>
.analysis-suite-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  margin: 2rem 0;
  overflow: hidden;
}

.tabs {
  display: flex;
  background-color: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tabs button {
  padding: 1rem 1.5rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  transition: color 0.3s, border-color 0.3s;
}

.tabs button.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
}

.tab-content {
  padding: 2rem;
}

h3 { text-align: center; margin-top: 0; margin-bottom: 2rem; }
.description { font-size: 0.9em; color: var(--vp-c-text-2); }
.controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem 2rem; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--vp-c-divider); }
.control-item label { display: block; margin-bottom: 0.75rem; }
.input-group { display: flex; align-items: center; gap: 10px; }
input[type="range"] { flex-grow: 1; }
.number-input { width: 70px; text-align: center; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--vp-c-divider); }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; padding-top: 1.5rem; }
.checkbox-item label { margin-bottom: 0; }
.results-container { display: flex; align-items: center; gap: 2rem; }
.chart-area { position: relative; height: 250px; width: 250px; flex-shrink: 0; }
.summary-area { flex-grow: 1; }
.summary-item { display: flex; justify-content: space-between; align-items: baseline; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; }
.summary-item.base { background-color: rgba(54, 162, 235, 0.1); }
.summary-item.cutting { background-color: rgba(255, 99, 132, 0.1); }
.summary-item strong { font-size: 1.5em; }
.manual-check-area { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed var(--vp-c-divider); }
.check-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
.check-controls input { width: 80px; }
.check-result ul { list-style-type: none; padding-left: 0; }
.check-result code { background-color: var(--vp-c-bg); padding: 2px 6px; border-radius: 4px; }
.heatmap-container { width: 100%; max-width: 600px; margin: 1rem auto; }
@media (max-width: 768px) { .results-container { flex-direction: column; } }
</style>