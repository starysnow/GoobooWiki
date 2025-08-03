<template>
  <div class="manual-check-area">
    <h4>单次攻击验算</h4>
    <div class="check-controls">
      <label for="check-hit-number">验算第</label>
      <input type="number" id="check-hit-number" v-model.number="checkHitNumber" min="1" :max="killProfile.totalHits">
      <label>次攻击</label>
    </div>
    <div v-if="manualCheckResult" class="check-result">
      <p><strong>计算过程:</strong></p>
      <ul>
        <li>攻击前生命值: <code>{{ manualCheckResult.healthBefore.toFixed(2) }}%</code></li>
        <li>基础攻击伤害: <code>{{ baseAttackPercent.toFixed(2) }}%</code> (固定值)</li>
        <li>切割伤害计算: <code>{{ manualCheckResult.healthBefore.toFixed(2) }}% (当前血量) * {{ (isCuttingNerfed ? cuttingPercent / 10 : cuttingPercent).toFixed(2) }}% (切割率) = {{ manualCheckResult.cuttingDamage.toFixed(2) }}%</code></li>
        <li>本次总伤害: <code>{{ manualCheckResult.totalHitDamage.toFixed(2) }}%</code></li>
        <li>攻击后生命值: <code>{{ manualCheckResult.healthAfter.toFixed(2) }}%</code></li>
      </ul>
    </div>
  </div>
</template>



```javascript
// DamageProfiler.vue 的 <script setup>

// ... 你已有的 ref, computed (killProfile), watch, onMounted ...

// --- 新增：手动验算的状态和逻辑 ---
const checkHitNumber = ref(1); // 用户想要验算的攻击次数

// 计算属性：根据用户指定的次数，执行一次模拟计算
const manualCheckResult = computed(() => {
  const hitToCkeck = Math.floor(checkHitNumber.value);
  if (!hitToCkeck || hitToCkeck <= 0 || hitToCkeck > killProfile.value.totalHits) {
    return null;
  }

  let currentHealth = 100;
  const effectiveCuttingPercent = isCuttingNerfed.value ? cuttingPercent.value / 10 : cuttingPercent.value;
  const baseHitDamage = baseAttackPercent.value;

  for (let i = 1; i < hitToCkeck; i++) {
    if (currentHealth <= 0) break;
    const cuttingHitDamage = currentHealth * (effectiveCuttingPercent / 100);
    currentHealth -= (baseHitDamage + cuttingHitDamage);
  }

  if (currentHealth <= 0) return null; // 如果在验算前就已死亡

  const healthBefore = currentHealth;
  const cuttingDamage = healthBefore * (effectiveCuttingPercent / 100);
  const totalHitDamage = baseHitDamage + cuttingDamage;
  const healthAfter = healthBefore - totalHitDamage;

  return {
    healthBefore,
    baseDamage: baseHitDamage,
    cuttingDamage,
    totalHitDamage,
    healthAfter
  };
});```

#### **升级 `DamageProfiler.vue` 的 `<style scoped>` 部分**

添加新区域的样式。

```css
/* DamageProfiler.vue 的 <style scoped> */
/* ... 你已有的样式 ... */

/* --- 新增：手动验算区域的样式 --- */
.manual-check-area {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--vp-c-divider);
}
.manual-check-area h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}
.check-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}
.check-controls input {
  width: 80px;
}
.check-result ul {
  list-style-type: none;
  padding-left: 0;
}
.check-result li {
  margin-bottom: 0.5rem;
  font-size: 0.9em;
}
.check-result code {
  background-color: var(--vp-c-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}
```

---

### **第二部分：创建`DamageHeatmap.vue`组件 (热力图)**

这是一个全新的、更高级的组件。我们将使用 **Chart.js的一个插件 `chartjs-chart-matrix`** 来轻松地创建热力图。

#### **第一步：更新 `config.mts` 以引入新插件**

我们需要同时引入Chart.js和它的热力图插件。

```typescript
// docs/.vitepress/config.mts
export default defineConfig({
  // ...
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // 1. Chart.js 主库
    ['script', { src: 'https://cdn.jsdelivr.net/npm/chart.js' }],
    // 2. ◀︎◀︎ 新增：Chart.js 热力图插件
    ['script', { src: 'https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@2.0.1/dist/chartjs-chart-matrix.min.js' }]
  ],
  // ...
})
```

#### **第二步：编写 `DamageHeatmap.vue` 组件**

在 `docs/.vitepress/theme/components/` 目录下创建新文件 `DamageHeatmap.vue`。

```vue
<template>
  <div class="heatmap-card">
    <h3>基础攻击伤害占比 热力图分析</h3>
    <p class="description">
      下图展示了在不同的“基础攻击”和“切割伤害”组合下，击杀敌人时“基础攻击”所贡献的最终伤害占比。颜色越偏向蓝色，代表基础攻击占比越高；越偏向红色，代表切割伤害占比越高。
    </p>
    <div class="heatmap-container">
      <canvas ref="heatmapCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const heatmapCanvas = ref(null);
let heatmapInstance = null;

// --- 核心计算逻辑 ---
function generateHeatmapData() {
  const data = [];
  const resolution = 31; // 分辨率，从0到30，共31个点

  for (let i = 0; i < resolution; i++) { // Y轴：切割伤害
    for (let j = 0; j < resolution; j++) { // X轴：基础攻击
      const basePercent = j; // 0% to 30%
      const cuttingPercent = i; // 0% to 30%

      let currentHealth = 100;
      let totalBaseDamage = 0;
      let totalCuttingDamage = 0;
      let hits = 0;

      if (basePercent <= 0 && cuttingPercent <= 0) {
        data.push({ x: basePercent, y: cuttingPercent, v: 0 });
        continue;
      }

      while (currentHealth > 0 && hits < 5000) {
        hits++;
        const baseHitDamage = basePercent;
        const cuttingHitDamage = currentHealth * (cuttingPercent / 100);
        currentHealth -= (baseHitDamage + cuttingHitDamage);
        totalBaseDamage += baseHitDamage;
        totalCuttingDamage += cuttingHitDamage;
      }

      // ... (此处省略了之前版本中的伤害溢出校正，为了性能可以简化)

      const totalDamage = totalBaseDamage + totalCuttingDamage;
      const baseProportion = totalDamage > 0 ? (totalBaseDamage / totalDamage) * 100 : 0;

      data.push({
        x: basePercent,
        y: cuttingPercent,
        v: baseProportion // 热力图的值就是基础攻击的占比
      });
    }
  }
  return data;
}

// --- 图表渲染 ---
function renderHeatmap() {
    if (!heatmapCanvas.value || typeof Chart === 'undefined') return;

    const data = generateHeatmapData();

    if (heatmapInstance) {
        heatmapInstance.destroy();
    }

    heatmapInstance = new Chart(heatmapCanvas.value.getContext('2d'), {
        type: 'matrix',
        data: {
            datasets: [{
                label: '基础攻击占比 (%)',
                data: data,
                backgroundColor(ctx) {
                    const value = ctx.raw.v;
                    if (value === null) {
                        return 'transparent';
                    }
                    const alpha = (value / 100); // 0 to 1
                    // 线性插值：从红色(alpha=0)到蓝色(alpha=1)
                    const r = 255 * (1 - alpha);
                    const b = 255 * alpha;
                    return `rgb(${r.toFixed(0)}, 0, ${b.toFixed(0)})`;
                },
                width: (ctx) => (ctx.chart.chartArea.right - ctx.chart.chartArea.left) / 31,
                height: (ctx) => (ctx.chart.chartArea.bottom - ctx.chart.chartArea.top) / 31,
            }]
        },
        options: {
            maintainAspectRatio: true,
            aspectRatio: 1,
            scales: {
                x: {
                    type: 'linear',
                    min: 0, max: 30,
                    title: { display: true, text: '基础攻击伤害 (%)' }
                },
                y: {
                    type: 'linear',
                    min: 0, max: 30,
                    title: { display: true, text: '切割伤害 (%)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function() { return ''; },
                        label: function(ctx) {
                            const d = ctx.raw;
                            return [
                                `基础攻击: ${d.x.toFixed(1)}%`,
                                `切割伤害: ${d.y.toFixed(1)}%`,
                                `基础伤害占比: ${d.v.toFixed(2)}%`
                            ];
                        }
                    }
                }
            }
        }
    });
}

onMounted(() => {
    nextTick(() => {
        renderHeatmap();
    });
});
</script>

<style scoped>
.heatmap-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}
.description {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
.heatmap-container {
  width: 100%;
  max-width: 600px;
  margin: 1rem auto;
}
</style>