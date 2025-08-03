<template>
  <div class="analysis-suite-card">
    <!-- 移除了Tabs，因为现在只有一个功能模块 -->
    <div class="tab-content">
      <div> <!-- v-show 也不再需要了 -->
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

        <!-- 环形图与结果展示区 -->
        <div class="results-container">
          <div class="chart-area">
            <canvas ref="doughnutChartCanvas"></canvas>
          </div>
          <div class="summary-area">
            <h4>当前配置结果分析</h4>
            <div v-if="killProfile.totalHits > 0">
              <p>击杀所需攻击次数: <strong>{{ killProfile.totalHits }}</strong></p>
              <div class="summary-item base"><span>基础攻击总占比</span><strong>{{ killProfile.baseProportion.toFixed(2) }}%</strong></div>
              <div class="summary-item cutting"><span>切割伤害总占比</span><strong>{{ killProfile.cuttingProportion.toFixed(2) }}%</strong></div>
            </div>
            <div v-else class="no-damage-note"><p>当前配置无法造成伤害。</p></div>
          </div>
        </div>

        <!-- ============================================= -->
        <!-- ==        新增：函数曲线图 (Line Chart)       == -->
        <!-- ============================================= -->
        <div class="line-chart-area">
          <h4>收益曲线分析 (固定切割伤害)</h4>
          <p class="description">
            当前切割配置 (<strong>{{ (isCuttingNerfed ? cuttingPercent / 10 : cuttingPercent).toFixed(2) }}%</strong>) ，
            基础攻击从0%变化到30%，"基础攻击伤害占比"和"等效输出效率"的变化曲线
          </p>
          <div class="chart-container">
            <canvas ref="lineChartCanvas"></canvas>
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
import { ref, reactive, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';

// --- 定义本地存储的Key ---
const LOCAL_STORAGE_KEY = 'damageProfilerState';

// --- Profiler 状态 ---
const baseAttackPercent = ref(5);
const cuttingPercent = ref(10);
const isCuttingNerfed = ref(false);
const checkHitNumber = ref(1);
//  新增：折线图范围控制状态
const lineChartRange = reactive({
  min: 0,
  max: 30,
  step: 1
});




// --- 核心计算函数 (被多个computed复用) ---
function simulateKill(baseDmg, cuttingDmg) {
    let currentHealth = 100, totalBaseDamage = 0, totalCuttingDamage = 0, hits = 0;
    if (baseDmg <= 0 && cuttingDmg <= 0) return { totalHits: 0, baseProportion: 0, cuttingProportion: 0, totalBaseDamage: 0, totalCuttingDamage: 0 };
    while (currentHealth > 0 && hits < 10000) {
        hits++;
        const cuttingHitDamage = currentHealth * (cuttingDmg / 100);
        currentHealth -= (baseDmg + cuttingHitDamage);
        totalBaseDamage += baseDmg;
        totalCuttingDamage += cuttingHitDamage;
    }
    if (currentHealth <= 0) {
      const overkill = -currentHealth;
      const lastHitDamage = baseDmg + ( (currentHealth + overkill) * (cuttingDmg/100) );
      if (lastHitDamage > 0) {
        totalBaseDamage -= overkill * (baseDmg / lastHitDamage);
        totalCuttingDamage -= overkill * ( ( (currentHealth + overkill) * (cuttingDmg/100) ) / lastHitDamage);
      }
    }
    const totalDamage = totalBaseDamage + totalCuttingDamage;
    return {
        totalHits: hits,
        baseProportion: totalDamage > 0 ? (totalBaseDamage / totalDamage) * 100 : 0,
        cuttingProportion: totalDamage > 0 ? (totalCuttingDamage / totalDamage) * 100 : 0,
        totalBaseDamage,
        totalCuttingDamage
    };
}

// --- 计算属性 ---
const killProfile = computed(() => {
    const effectiveCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;
    return simulateKill(baseAttackPercent.value, effectiveCuttingPercent);
});

const manualCheckResult = computed(() => { /* ... (保持不变) ... */ });

// 新增：为折线图生成数据的计算属性
const lineChartData = computed(() => {
    const labels = [];
    const baseProportions = [];
    const efficiencies = [];
    const fixedCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;

    for (let base = 0; base <= 30; base += 1) { // 步长为1，共31个点
        labels.push(base);
        const result = simulateKill(base, fixedCuttingPercent);
        baseProportions.push(result.baseProportion);
        // 等效输出 = 100%血量 / 攻击次数
        const efficiency = result.totalHits > 0 ? 100 / result.totalHits : 0;
        efficiencies.push(efficiency);
    }
    return { labels, baseProportions, efficiencies };
});


// --- 图表渲染 ---
const doughnutChartCanvas = ref(null);
let doughnutChartInstance = null;
function renderDoughnutChart(profileData) { /* ... (保持不变) ... */ }

// 新增：折线图的Canvas ref和实例
const lineChartCanvas = ref(null);
let lineChartInstance = null;
function renderLineChart(chartData) {
    if (!lineChartCanvas.value || typeof Chart === 'undefined') return;
    if (lineChartInstance) lineChartInstance.destroy();

    const ctx = lineChartCanvas.value.getContext('2d');
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels.map(l => `${l}%`),
            datasets: [
                {
                    label: '基础攻击伤害占比',
                    data: chartData.baseProportions,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    yAxisID: 'yProportion',
                    tension: 0.1
                },
                {
                    label: '等效输出效率 (%/Hit)',
                    data: chartData.efficiencies,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    yAxisID: 'yEfficiency',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { title: { display: true, text: '基础攻击伤害 (%)' } },
                yProportion: {
                    type: 'linear',
                    position: 'left',
                    min: 0, max: 100,
                    title: { display: true, text: '基础攻击伤害占比 (%)', fontColor: 'rgb(54, 162, 235)' }
                },
                yEfficiency: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    title: { display: true, text: '等效输出 (%/Hit)', fontColor: 'rgb(255, 159, 64)' },
                    grid: { drawOnChartArea: false } // 只为主Y轴绘制网格线
                }
            }
        }
    });
}

// --- 生命周期与监视 ---
onMounted(() => {
    nextTick(() => {
        renderDoughnutChart(killProfile.value);
        renderLineChart(lineChartData.value);
    });
});

watch(killProfile, (newData) => {
    renderDoughnutChart(newData);
});

// 新增：当折线图的数据变化时，也重绘图表
watch(lineChartData, (newData) => {
    renderLineChart(newData);
});

// 新增：组件销毁时清理所有图表
onUnmounted(() => {
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    if (lineChartInstance) lineChartInstance.destroy();
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

/* 新增：折线图区域的样式 */
.line-chart-area {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}
.line-chart-area h4 {
  text-align: center;
  margin-bottom: 0.5rem;
}
.line-chart-area .description {
  text-align: center;
  font-size: 0.85em;
  margin-bottom: 1.5rem;
}
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>