<template>
  <div class="profiler-card">
    <h3>基础攻击 vs 切割伤害 占比分析器</h3>

    <!-- 控制区域 -->
    <div class="controls-grid">
      <div class="control-item">
        <label for="base-attack">基础攻击 (% of Max HP): <strong>{{ baseAttackPercent }}%</strong></label>
        <input type="range" id="base-attack" min="0" max="50" step="0.5" v-model.number="baseAttackPercent">
      </div>
      <div class="control-item">
        <label for="cutting-damage">切割伤害 (% of Current HP): <strong>{{ cuttingPercent }}%</strong></label>
        <input type="range" id="cutting-damage" min="0" max="100" step="1" v-model.number="cuttingPercent">
      </div>
      <div class="control-item">
        <label for="hits">模拟攻击次数: <strong>{{ numberOfHits }}</strong></label>
        <input type="range" id="hits" min="1" max="50" step="1" v-model.number="numberOfHits">
      </div>
    </div>

    <!-- 图表展示区 -->
    <div class="chart-container">
      <canvas ref="damageChartCanvas"></canvas>
    </div>

    <!-- 结论分析区 -->
    <div class="analysis-conclusion">
      <h4>结论分析</h4>
      <p>{{ conclusionText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

// --- 响应式状态：用户输入 ---
const baseAttackPercent = ref(5); // 基础攻击造成最大生命值5%的伤害
const cuttingPercent = ref(10);  // 切割造成当前生命值10%的伤害
const numberOfHits = ref(20);    // 模拟20次攻击

// --- 计算属性：根据输入动态生成伤害数据 ---
const damageProfile = computed(() => {
  let currentHealth = 100; // 假设敌人总生命值为100
  let totalBaseDamage = 0;
  let totalCuttingDamage = 0;

  const points = [];

  for (let hit = 1; hit <= numberOfHits.value; hit++) {
    if (currentHealth <= 0) break;

    // 1. 计算本次攻击的两种伤害
    const baseHitDamage = baseAttackPercent.value; // 基础攻击伤害是固定的
    const cuttingHitDamage = currentHealth * (cuttingPercent.value / 100);

    // 2. 累计总伤害
    totalBaseDamage += baseHitDamage;
    totalCuttingDamage += cuttingHitDamage;

    // 3. 更新当前生命值
    currentHealth -= (baseHitDamage + cuttingHitDamage);

    // 4. 计算当前总伤害和各自的占比
    const totalDamageSoFar = totalBaseDamage + totalCuttingDamage;
    const baseProportion = totalDamageSoFar > 0 ? (totalBaseDamage / totalDamageSoFar) * 100 : 0;
    const cuttingProportion = totalDamageSoFar > 0 ? (totalCuttingDamage / totalDamageSoFar) * 100 : 0;

    points.push({
      hit,
      baseProportion,
      cuttingProportion
    });
  }

  return points;
});

// --- 动态生成结论文字 ---
const conclusionText = computed(() => {
    const finalProfile = damageProfile.value[damageProfile.value.length - 1] || { baseProportion: 0, cuttingProportion: 0 };
    if (finalProfile.baseProportion > finalProfile.cuttingProportion) {
        return "在此配置下，基础攻击是主要的伤害来源。切割伤害在战斗前期效率较高，但随着敌人生命值降低，其效果会减弱。";
    } else if (finalProfile.cuttingProportion > finalProfile.baseProportion) {
        return "在此配置下，切割伤害是主要的伤害来源。尤其是在战斗初期，对高生命值敌人效果显著，但其效率会随战斗进程递减。";
    } else {
        return "两种伤害来源的贡献大致相当。这是一个较为均衡的配置。";
    }
});

// --- 图表渲染逻辑 ---
const damageChartCanvas = ref(null);
let chartInstance = null;

function renderChart(profileData) {
  if (!damageChartCanvas.value) return; // 确保canvas已挂载
  if (typeof Chart === 'undefined') { // 确保Chart.js已加载
      console.error("Chart.js is not loaded!");
      return;
  }

  // 销毁旧图表实例，防止内存泄漏
  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = damageChartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: profileData.map(p => `第 ${p.hit} 次`),
      datasets: [
        {
          label: '基础攻击占比 (%)',
          data: profileData.map(p => p.baseProportion.toFixed(2)),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1
        },
        {
          label: '切割伤害占比 (%)',
          data: profileData.map(p => p.cuttingProportion.toFixed(2)),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: '累计伤害占比 (%)' }
        },
        x: {
          title: { display: true, text: '攻击次数' }
        }
      },
      plugins: {
        tooltip: {
            callbacks: {
                label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y}%`;
                }
            }
        }
      }
    }
  });
}

// --- 生命周期与监视 ---
onMounted(() => {
  // 确保在DOM渲染后才初始化图表
  nextTick(() => {
      renderChart(damageProfile.value);
  });
});

// 监视数据的变化，并自动重新渲染图表
watch(damageProfile, (newData) => {
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.control-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
.control-item input[type="range"] {
  width: 100%;
}
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
.analysis-conclusion {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--vp-c-divider);
}
.analysis-conclusion h4 {
  margin-bottom: 0.5rem;
}
.analysis-conclusion p {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
```

---
