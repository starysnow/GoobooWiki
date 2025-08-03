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
        <h4>收益曲线(切割 <strong>{{ (isCuttingNerfed ? cuttingPercent / 10 : cuttingPercent).toFixed(2) }}%</strong>)</h4>

        <!-- 新增：范围控制输入框 -->
        <div class="range-controls">
            <div class="range-input-item">
            <label for="range-min">基础攻击伤害从:</label>
            <input type="number" id="range-min" v-model.number="lineChartRange.min"> %
            </div>
            <div class="range-input-item">
            <label for="range-max">到:</label>
            <input type="number" id="range-max" v-model.number="lineChartRange.max"> %
            </div>
            <div class="range-input-item">
            <label for="range-step">步长:</label>
            <input type="number" id="range-step" v-model.number="lineChartRange.step" min="0.1" step="0.1"> %
            </div>
        </div>

        <p class="description">
            <!-- 当前切割配置 (<strong>{{ (isCuttingNerfed ? cuttingPercent / 10 : cuttingPercent).toFixed(2) }}%</strong>) ，
            基础攻击从 <strong>{{ lineChartRange.min }}%</strong> 变化到 <strong>{{ lineChartRange.max }}%</strong>，
            "基础攻击伤害占比"和"等效输出效率"的变化曲线。 -->
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

    // 使用用户定义的范围和步长
    for (let base = lineChartRange.min; base <= lineChartRange.max; base += lineChartRange.step) {
        labels.push(base);
        const result = simulateKill(base, fixedCuttingPercent);
        baseProportions.push(result.baseProportion);
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
            // labels 数组保持不变，依然包含所有的数据点标签
            labels: chartData.labels,
            datasets: [
                {
                    label: '基础攻击伤害占比',
                    data: chartData.baseProportions,
                    borderColor: 'rgb(54, 162, 235)',
                    yAxisID: 'yProportion',
                    tension: 0.1,
                    pointRadius: 2, // 减小数据点半径
                },
                {
                    label: '等效输出效率 (%/Hit)',
                    data: chartData.efficiencies,
                    borderColor: 'rgb(255, 159, 64)',
                    yAxisID: 'yEfficiency',
                    tension: 0.1,
                    pointRadius: 2,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },

            // --- 核心修改在这里 ---
            scales: {
                x: {
                    title: { display: true, text: '基础攻击伤害 (%)' },

                    // a) 自动跳过部分刻度
                    ticks: {
                        autoSkip: true, // 启用自动跳过
                        maxTicksLimit: 15, // 限制最大刻度数量，15是一个比较舒适的值

                        // b) (可选) 自定义标签格式化
                        callback: function(value, index, ticks) {
                            // value 是刻度值, index是其在原始labels数组中的索引
                            const label = this.getLabelForValue(value);
                            // 只保留小数点后两位，并加上百分号
                            return parseFloat(label).toFixed(2) + '%';
                        }
                    }
                },
                yProportion: {
                    type: 'linear', position: 'left',
                    min: 0, max: 100,
                    title: { display: true, text: '基础攻击伤害占比 (%)' }
                },
                yEfficiency: {
                    type: 'linear', position: 'right', min: 0,
                    title: { display: true, text: '等效输出 (%/Hit)' },
                    grid: { drawOnChartArea: false }
                }
            },
            // --- 修改结束 ---

            plugins: {
                tooltip: {
                    // (可选) 优化Tooltip显示
                    callbacks: {
                        title: function(tooltipItems) {
                            return '基础攻击: ' + tooltipItems[0].label.toFixed(3) + '%';
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(3);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// --- 新增：数据持久化逻辑 ---
function saveData() {
  const stateToSave = {
    baseAttackPercent: baseAttackPercent.value,
    cuttingPercent: cuttingPercent.value,
    isCuttingNerfed: isCuttingNerfed.value,
    lineChartRange: lineChartRange, // reactive 对象可以直接保存
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  console.log("State saved to localStorage.");
}

function loadData() {
  const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      baseAttackPercent.value = state.baseAttackPercent || 5;
      cuttingPercent.value = state.cuttingPercent || 10;
      isCuttingNerfed.value = state.isCuttingNerfed || false;

      // 合并加载范围对象，防止未来增加新属性时出错
      Object.assign(lineChartRange, state.lineChartRange);

      console.log("State loaded from localStorage.");
    } catch (e) {
      console.error("Failed to load or parse saved state:", e);
    }
  }
}

// --- 生命周期与监视 ---
onMounted(() => {
  loadData(); // ◀︎ 在组件挂载时加载数据
  nextTick(() => {
    renderDoughnutChart(killProfile.value);
    renderLineChart(lineChartData.value);
  });
});

// 修改：监视所有需要保存的状态，并在变化时调用 saveData
watch(
  [baseAttackPercent, cuttingPercent, isCuttingNerfed, lineChartRange],
  () => {
    saveData();
    // 重新渲染环形图
    renderDoughnutChart(killProfile.value);
    // 重新渲染折线图
    renderLineChart(lineChartData.value);
  },
  { deep: true } // deep: true 对于监视 reactive 对象 (lineChartRange) 很重要
);

// --- 生命周期与监视 ---
onMounted(() => {
    nextTick(() => {
        renderDoughnutChart(killProfile.value);
        renderLineChart(lineChartData.value);
    });
});

// 新增：组件销毁时清理所有图表
onUnmounted(() => {
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    if (lineChartInstance) lineChartInstance.destroy();
});// watch(killProfile, (newData) => {
//     renderDoughnutChart(newData);
// });

// // 新增：当折线图的数据变化时，也重绘图表
// watch(lineChartData, (newData) => {
//     renderLineChart(newData);
// });
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

/* 新增：折线图范围控制的样式 */
.range-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background-color: var(--vp-c-bg);
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap; /* 在小屏幕上换行 */
}

.range-input-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-input-item label {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.range-input-item input {
  width: 80px;
  text-align: center;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}
</style>