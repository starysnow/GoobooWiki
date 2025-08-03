<template>
  <div class="calculator-container-vp">
    <h2>工匠收益计算器</h2>
    <div class="controls-box">
      <label for="craftsmenInput">工匠数量 (m):</label>
      <input type="number" id="craftsmenInput" v-model.number="craftsmen" min="1">
      <label for="countersInput">柜台数量 (n >= m):</label>
      <input type="number" id="countersInput" v-model.number="counters" min="1">
    </div>

    <div class="k-value-results">
      <h4>时间分配和最大收益:</h4>
      <div id="maxProfitResult" v-html="kValueResults.maxProfit"></div>
      <div id="kDistributionResult" v-html="kValueResults.kDistribution"></div>
      <hr style="margin: 15px 0; border-style: dashed;">
      <h4>“偷懒”方案:</h4>
      <div id="lazySchemeProfitResult" v-html="kValueResults.lazySchemeProfit"></div>
      <div id="improvementRateResult" v-html="kValueResults.improvementRate"></div>
    </div>

    <div class="chart-container"><canvas ref="chartRef"></canvas></div>

    <div style="overflow-x: auto;">
      <table id="productTable">
        <thead>
          <tr>
            <th><input type="checkbox" :checked="allUnlocked" :indeterminate="someUnlocked" @change="toggleAllLocks" title="切换全部解锁/未解锁"> 解锁</th>
            <th>产品</th>
            <th>当前生产时间</th>
            <th>当前基础价格</th>
            <th @click="toggleSort" style="cursor: pointer;" title="点击排序">
              等级 ({{ totalLevelSum }})
            </th>
            <th @click="toggleSort" style="cursor: pointer;" title="点击排序">
              每分钟收益率 <span>{{ sortAscending ? '▲' : '▼' }}</span>
            </th>
            <th>每秒材料消耗</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" :class="{ 'product-locked': !p.isUnlocked }">
            <td>
              <input type="checkbox" v-model="p.isUnlocked" :title="p.isUnlocked ? '标记为未解锁' : '标记为已解锁'">
            </td>
            <td>{{ p.name }}</td>
            <td>
              {{ p.currentProductionTimeStr }}
              <span v-if="p.nextLevelPreview?.timeStr" class="preview-text">(→ {{ p.nextLevelPreview.timeStr }})</span>
            </td>
            <td>
              {{ p.currentBasePrice.toFixed(2) }}
              <span v-if="p.nextLevelPreview?.price !== null" class="preview-text">(→ {{ p.nextLevelPreview.price.toFixed(2) }})</span>
            </td>
            <td class="level-control">
              <button @click="adjustLevel(p.id, -1)" :disabled="p.level <= 1 || !p.isUnlocked">-</button>
              <span class="level-value">{{ p.level }}</span>
              <button @click="adjustLevel(p.id, 1)" :disabled="p.level >= MAX_DISPLAY_LEVEL || !p.isUnlocked" :title="p.isUnlocked ? p.upgradeInfoText : '产品未解锁'">+</button>
            </td>
            <td>
              {{ p.profitRate.toFixed(4) }}
               <span v-if="p.nextLevelPreview?.profitRate !== null" class="preview-text">(→ {{ p.nextLevelPreview.profitRate.toFixed(4) }})</span>
            </td>
            <td class="material-consumption" v-html="p.materialConsumptionHtml"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="note">
      <p>注释：</p>
      <ol>
        <li>鼠标悬浮在等级“+”按钮上查看升级详情。</li>
        <li>所有收益率均针对满效率（即生产速度大于每秒材料消耗）且将售出时间设置为与制作时间近似相同的情况</li>
        <li>产能收益公式为：(基础价格 / 生产时间) * sqrt(生产时间 / 100)</li>
        <li>若效率未满收益率需乘以一系数(仍需要售出时间≈制作一个产品所需时间，不过此处制作时间需根据材料生产速度自行计算)，系数值为sqrt(生产速度/满效率材料消耗速度)，对需要多材料的，此系数取各材料计算系数的最小值</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// --- Constants and Initial Data ---
const MAX_DISPLAY_LEVEL = 5;
const LOCAL_STORAGE_KEY_ARTISAN = 'artisanCalculatorVitePress';
const initialProductsData = [
    { name: "绳子", productionTimeStr: "1m", materials: "纤维100k", basePrice: 10, upgrade1_desc: "解锁袋子", upgrade1_req: 100, upgrade2_desc: "时间->40s", upgrade2_req: 750, upgrade3_desc: "价格->14", upgrade3_req: 4800, upgrade4_desc: "时间->30s", upgrade4_req: 27000 },
    { name: "木板", productionTimeStr: "2m", materials: "木头250k", basePrice: 22, upgrade1_desc: "时间->1m30s", upgrade1_req: 60, upgrade2_desc: "解锁橱柜", upgrade2_req: 450, upgrade3_desc: "价格->30", upgrade3_req: 3200, upgrade4_desc: "时间->1m15s", upgrade4_req: 16500 },
    { name: "砖块", productionTimeStr: "4m", materials: "石头600k", basePrice: 48, upgrade1_desc: "价格->66", upgrade1_req: 40, upgrade2_desc: "时间->3m", upgrade2_req: 300, upgrade3_desc: "解锁哑铃", upgrade3_req: 2000, upgrade4_desc: "价格->84", upgrade4_req: 12000 },
    { name: "螺丝", productionTimeStr: "2m", materials: "金属800k", basePrice: 25, upgrade1_desc: "价格->34", upgrade1_req: 100, upgrade2_desc: "时间->1m40s", upgrade2_req: 550, upgrade3_desc: "解锁剪刀", upgrade3_req: 4400, upgrade4_desc: "价格->44", upgrade4_req: 21000 },
    { name: "水瓶", productionTimeStr: "1m10s", materials: "水1.5m", basePrice: 15, upgrade1_desc: "时间->50s", upgrade1_req: 300, upgrade2_desc: "时间->35s", upgrade2_req: 1700, upgrade3_desc: "解锁草药茶", upgrade3_req: 9250, upgrade4_desc: "时间->25s", upgrade4_req: 53000 },
    { name: "鸡尾酒杯", productionTimeStr: "3m30s", materials: "玻璃2.5m", basePrice: 50, upgrade1_desc: "价格->67", upgrade1_req: 45, upgrade2_desc: "时间->3m", upgrade2_req: 360, upgrade3_desc: "解锁玻璃杯", upgrade3_req: 2500, upgrade4_desc: "价格->86", upgrade4_req: 14500 },
    { name: "回力标", productionTimeStr: "2m20s", materials: "硬木4m", basePrice: 38, upgrade1_desc: "价格->51", upgrade1_req: 45, upgrade2_desc: "时间->2m", upgrade2_req: 360, upgrade3_desc: "价格->65", upgrade3_req: 14500, upgrade4_desc: "", upgrade4_req: null },
    { name: "抛光宝石", productionTimeStr: "2m40s", materials: "宝石6.5m", basePrice: 36, upgrade1_desc: "价格->47", upgrade1_req: 55, upgrade2_desc: "时间->2m20s", upgrade2_req: 380, upgrade3_desc: "价格->60", upgrade3_req: 13500, upgrade4_desc: "", upgrade4_req: null },
    { name: "油灯", productionTimeStr: "4m30s", materials: "油10m", basePrice: 51, upgrade1_desc: "价格->65", upgrade1_req: 40, upgrade2_desc: "时间->3m45s", upgrade2_req: 330, upgrade3_desc: "价格->82", upgrade3_req: 12400, upgrade4_desc: "", upgrade4_req: null },
    { name: "淋浴", productionTimeStr: "6m", materials: "大理石15m", basePrice: 70, upgrade1_desc: "时间->5m", upgrade1_req: 40, upgrade2_desc: "价格->90", upgrade2_req: 330, upgrade3_desc: "时间->4m10s", upgrade3_req: 12400, upgrade4_desc: "", upgrade4_req: null },
    { name: "袋子", productionTimeStr: "1m30s", materials: "纤维1m", basePrice: 18, upgrade1_desc: "价格->26", upgrade1_req: 80, upgrade2_desc: "时间->70s", upgrade2_req: 600, upgrade3_desc: "价格->35", upgrade3_req: 4000, upgrade4_desc: "时间->60s", upgrade4_req: 22000 },
    { name: "橱柜", productionTimeStr: "2m30s", materials: "木头3m", basePrice: 33, upgrade1_desc: "价格->42", upgrade1_req: 50, upgrade2_desc: "时间->2m5s", upgrade2_req: 400, upgrade3_desc: "价格->52", upgrade3_req: 2800, upgrade4_desc: "时间->1m40s", upgrade4_req: 15000 },
    { name: "哑铃", productionTimeStr: "5m", materials: "石头7m", basePrice: 65, upgrade1_desc: "价格->87", upgrade1_req: 50, upgrade2_desc: "时间->4m15s", upgrade2_req: 400, upgrade3_desc: "解锁手锯★", upgrade3_req: 2800, upgrade4_desc: "时间->3m30s", upgrade4_req: 15000 },
    { name: "剪刀", productionTimeStr: "2m5s", materials: "木头3m+金属8m", basePrice: 30, upgrade1_desc: "时间->1m50s", upgrade1_req: 55, upgrade2_desc: "价格->40", upgrade2_req: 420, upgrade3_desc: "时间->1m40s", upgrade3_req: 3100, upgrade4_desc: "价格->50", upgrade4_req: 17000 },
    { name: "草药茶", productionTimeStr: "3m20s", materials: "纤维5m+水12m", basePrice: 54, upgrade1_desc: "价格->78", upgrade1_req: 48, upgrade2_desc: "价格->106", upgrade2_req: 380, upgrade3_desc: "时间->2m50s", upgrade3_req: 2600, upgrade4_desc: "价格->140", upgrade4_req: 14000 },
    { name: "玻璃杯", productionTimeStr: "1m20s", materials: "金属11m+玻璃14m", basePrice: 21, upgrade1_desc: "时间->1m5s", upgrade1_req: 100, upgrade2_desc: "价格->28", upgrade2_req: 750, upgrade3_desc: "时间->55s", upgrade3_req: 5400, upgrade4_desc: "时间->45s", upgrade4_req: 30000 },
    { name: "箭头", productionTimeStr: "1m40s", materials: "木头1.25m+石头400k", basePrice: 21, upgrade1_desc: "时间->1m25s", upgrade1_req: 85, upgrade2_desc: "时间->1m10s", upgrade2_req: 400, upgrade3_desc: "时间->1m", upgrade3_req: 10000, upgrade4_desc: "", upgrade4_req: null },
    { name: "碗", productionTimeStr: "2m10s", materials: "木头2.5m", basePrice: 25, upgrade1_desc: "时间->1m40s", upgrade1_req: 90, upgrade2_desc: "解锁灌木★", upgrade2_req: 675, upgrade3_desc: "价格->34", upgrade3_req: 4800, upgrade4_desc: "时间->1m20s", upgrade4_req: 25000 },
    { name: "锁链", productionTimeStr: "1m10s", materials: "纤维3m+金属1.35m", basePrice: 19, upgrade1_desc: "时间->1m", upgrade1_req: 140, upgrade2_desc: "解锁车库★", upgrade2_req: 875, upgrade3_desc: "价格->25", upgrade3_req: 4300, upgrade4_desc: "时间->50s", upgrade4_req: 23000 },
    { name: "矛", productionTimeStr: "2m", materials: "木头8m+金属1.75m", basePrice: 26, upgrade1_desc: "时间->1m35s", upgrade1_req: 110, upgrade2_desc: "价格->35", upgrade2_req: 800, upgrade3_desc: "时间->1m15s", upgrade3_req: 5750, upgrade4_desc: "价格->45", upgrade4_req: 28000 },
    { name: "金戒指", productionTimeStr: "10m", materials: "金属5m+水750k", basePrice: 140, upgrade1_desc: "价格->188", upgrade1_req: 30, upgrade2_desc: "价格->239", upgrade2_req: 225, upgrade3_desc: "价格->295", upgrade3_req: 1800, upgrade4_desc: "", upgrade4_req: null }
];

// --- Reactive State ---
const craftsmen = ref(3);
const counters = ref(5);
const sortAscending = ref(false);
const chartRef = ref(null);
let chartInstance = null;

const products = reactive([]);

// --- Utility Functions ---
const parseProductionTime = (timeStr) => {
    if (!timeStr) return 0;
    let totalSeconds = 0;
    const minutesMatch = timeStr.match(/(\d+)m/);
    const secondsMatch = timeStr.match(/(\d+)s/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
    return totalSeconds;
};
const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return "0s";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    let timeStr = "";
    if (minutes > 0) timeStr += `${minutes}m`;
    if (seconds > 0 || minutes === 0) timeStr += `${seconds}s`;
    return timeStr || "0s";
};
const parseMaterials = (materialsStr) => {
    if (!materialsStr) return [];
    const materials = [];
    const parts = materialsStr.split('+');
    parts.forEach(part => {
        const match = part.trim().match(/([^\d]+)(\d+\.?\d*)([km]?)/i);
        if (match) {
            const name = match[1].trim();
            let amount = parseFloat(match[2]);
            const unit = match[3] ? match[3].toLowerCase() : '';
            if (unit === 'k') amount *= 1000;
            else if (unit === 'm') amount *= 1000000;
            materials.push({ name, amount });
        }
    });
    return materials;
};
const calculateProfitRate = (basePrice, productionTimeSeconds) => {
    if (productionTimeSeconds <= 0 || basePrice <= 0) return 0;
    return (basePrice / productionTimeSeconds) * Math.sqrt(productionTimeSeconds / 100) * 60;
};
const calculateMaterialConsumptionPerSecond = (materialsArray, productionTimeSeconds) => {
    if (productionTimeSeconds <= 0 || !materialsArray || materialsArray.length === 0) return { text: "-", html: "-" };
    const consumptionItems = materialsArray.map(mat => {
        const consumption = mat.amount / productionTimeSeconds;
        let displayConsumption = consumption.toFixed(1);
        if (consumption >= 1000000) displayConsumption = (consumption / 1000000).toFixed(1) + "m";
        else if (consumption >= 1000) displayConsumption = (consumption / 1000).toFixed(1) + "k";
        return `${mat.name} ${displayConsumption}/s`;
    });
    return { text: consumptionItems.join('; '), html: consumptionItems.join('<br>') };
};

// --- Computed Properties ---
const unlockedProducts = computed(() => products.filter(p => p.isUnlocked));
const totalLevelSum = computed(() => products.reduce((total, p) => total + (p.level - 1), 0));
const allUnlocked = computed(() => products.every(p => p.isUnlocked));
const someUnlocked = computed(() => {
    const unlockedCount = unlockedProducts.value.length;
    return unlockedCount > 0 && unlockedCount < products.length;
});

const kValueResults = computed(() => {
    const m = craftsmen.value;
    const n = counters.value;
    const sortedUnlocked = [...unlockedProducts.value].sort((a, b) => b.profitRate - a.profitRate);

    // Max Profit Calculation
    const topNProducts = sortedUnlocked.slice(0, n);
    let maxProfitText = "无已解锁产品可供计算。";
    let kDistributionText = "";
    let lazySchemeText = "无法计算“偷懒”方案。";
    let improvementText = "";
    let maxProfitVal = 0;

    if (topNProducts.length > 0) {
        const C_values = topNProducts.map(p => p.profitRate);
        const sum_C_squared = C_values.reduce((acc, c) => acc + c * c, 0);

        if (sum_C_squared > 0) {
            maxProfitVal = Math.sqrt(sum_C_squared) * Math.sqrt(m);
            maxProfitText = `理论最大收益 = ${maxProfitVal.toFixed(4)}/min`;
            kDistributionText = "时间分配:<br>" + topNProducts.map(p =>
                `${p.name}: k = ${((p.profitRate * p.profitRate) / sum_C_squared).toFixed(4)} (${p.profitRate.toFixed(4)}/min)`
            ).join('<br>');
        } else {
            maxProfitText = `最大收益 = 0`;
            kDistributionText = "k值分配: 分母为0，无法计算。";
        }
    }

    // Lazy Scheme Calculation
    if (m > 0 && sortedUnlocked.length > 0) {
        const topMProductsForLazy = sortedUnlocked.slice(0, m);
        const lazyTotalProfit = topMProductsForLazy.reduce((sum, p) => sum + p.profitRate, 0);
        const lazyDetails = topMProductsForLazy.map(p => ` - ${p.name}: ${p.profitRate.toFixed(4)}/min`).join('<br>');
        lazySchemeText = `<b>总计收益: ${lazyTotalProfit.toFixed(4)}/min</b><br/>${lazyDetails}`;

        if (lazyTotalProfit > 0) {
            const improvement = ((maxProfitVal - lazyTotalProfit) / lazyTotalProfit) * 100;
            improvementText = `最优方案相比偷懒方案的效率提升约: ${improvement.toFixed(2)}%`;
        } else if (maxProfitVal > 0) {
            improvementText = "偷懒方案收益为0，无法计算提升率。";
        } else {
            improvementText = "两种方案收益均为0。";
        }
    }

    return {
        maxProfit: maxProfitText,
        kDistribution: kDistributionText,
        lazySchemeProfit: lazySchemeText,
        improvementRate: improvementText
    };
});


// --- Methods ---
function updateAllProductsState() {
    products.forEach(p => {
        Object.assign(p, calculateProductStateForLevel(p, p.level));
    });
    sortProducts();
}

function adjustLevel(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.isUnlocked) return;
    const newLevel = Math.max(1, Math.min(MAX_DISPLAY_LEVEL, product.level + change));
    if (product.level !== newLevel) {
        product.level = newLevel;
    }
}

function toggleSort() {
    sortAscending.value = !sortAscending.value;
    sortProducts();
}

function toggleAllLocks(event) {
    const isChecked = event.target.checked;
    products.forEach(p => {
        p.isUnlocked = isChecked;
    });
}

function sortProducts() {
     products.sort((a, b) => {
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        if (a.isUnlocked && b.isUnlocked) {
            return sortAscending.value ? a.profitRate - b.profitRate : b.profitRate - a.profitRate;
        }
        return 0; // Keep original order for two locked items
    });
}

function calculateProductStateForLevel(product, level) {
    let currentProductionTimeSeconds = product.originalProductionTimeSeconds;
    let currentBasePrice = product.originalBasePrice;

    for (let i = 1; i < level; i++) {
        const upgradeDesc = product[`upgrade${i}_desc`];
        if (upgradeDesc && upgradeDesc.includes("->")) {
            const parts = upgradeDesc.split('->');
            const type = parts[0].trim();
            const valueStr = parts[1].trim();
            if (type === "时间") currentProductionTimeSeconds = parseProductionTime(valueStr);
            else if (type === "价格") currentBasePrice = parseFloat(valueStr);
        }
    }

    const currentProfitRate = calculateProfitRate(currentBasePrice, currentProductionTimeSeconds);
    const {text: materialConsumptionText, html: materialConsumptionHtml} = calculateMaterialConsumptionPerSecond(parseMaterials(product.materials), currentProductionTimeSeconds);

    // Calculate Next Level Preview
    let nextLevelPreview = { timeStr: null, price: null, profitRate: null, materialConsumption: null };
    if (level < MAX_DISPLAY_LEVEL) {
        let nextProdTimeSecCandidate = currentProductionTimeSeconds;
        let nextBasePriceCandidate = currentBasePrice;
        const nextUpgradeDesc = product[`upgrade${level}_desc`];
        if (nextUpgradeDesc && nextUpgradeDesc.includes("->")) {
            const parts = nextUpgradeDesc.split('->');
            const type = parts[0].trim();
            const valueStr = parts[1].trim();
            if (type === "时间") nextProdTimeSecCandidate = parseProductionTime(valueStr);
            else if (type === "价格") nextBasePriceCandidate = parseFloat(valueStr);
        }

        if (nextProdTimeSecCandidate !== currentProductionTimeSeconds) {
            nextLevelPreview.timeStr = formatTime(nextProdTimeSecCandidate);
        }
        if (nextBasePriceCandidate !== currentBasePrice) {
            nextLevelPreview.price = parseFloat(nextBasePriceCandidate.toFixed(2));
        }

        const timeForNextCalc = nextLevelPreview.timeStr ? nextProdTimeSecCandidate : currentProductionTimeSeconds;
        const priceForNextCalc = nextLevelPreview.price !== null ? nextBasePriceCandidate : currentBasePrice;
        const nextProfit = calculateProfitRate(priceForNextCalc, timeForNextCalc);
        if (nextProfit.toFixed(4) !== currentProfitRate.toFixed(4)) {
            nextLevelPreview.profitRate = parseFloat(nextProfit.toFixed(4));
        }
    }

    return {
        currentProductionTimeSeconds,
        currentProductionTimeStr: formatTime(currentProductionTimeSeconds),
        currentBasePrice,
        profitRate: currentProfitRate,
        materialConsumptionHtml,
        nextLevelPreview,
        upgradeInfoText: getUpgradeInfoAsTextForTitle(product, level, currentProductionTimeSeconds, currentBasePrice)
    };
}

function getUpgradeInfoAsTextForTitle(product, level, currentProductionTimeSeconds, currentBasePrice) {
    if (!product) return "无升级信息";
    let infoText = `产品: ${product.name} (当前等级: ${level})\n后续升级路径:\n`;
    let hasAnyDefinedUpgrades = false;
    let tempTime = currentProductionTimeSeconds;
    let tempPrice = currentBasePrice;

    for (let i = level; i < MAX_DISPLAY_LEVEL; i++) {
        const upgradeDesc = product[`upgrade${i}_desc`];
        const upgradeReq = product[`upgrade${i}_req`];
        if (upgradeDesc && upgradeDesc.trim() !== "") {
            hasAnyDefinedUpgrades = true;
            infoText += `  升至 ${i + 1} 级: ${upgradeDesc} (需: ${upgradeReq != null ? upgradeReq : "-"})`;
            let timeAfterThisUpgrade = tempTime, priceAfterThisUpgrade = tempPrice;
            const parts = upgradeDesc.split('->');
            if (parts.length === 2) {
                const type = parts[0].trim(), valueStr = parts[1].trim();
                if (type === "时间") timeAfterThisUpgrade = parseProductionTime(valueStr);
                else if (type === "价格") priceAfterThisUpgrade = parseFloat(valueStr);
            }
            if (timeAfterThisUpgrade !== tempTime) infoText += ` => 时间变为: ${formatTime(timeAfterThisUpgrade)}`;
            if (priceAfterThisUpgrade !== tempPrice) infoText += `${(timeAfterThisUpgrade !== tempTime && priceAfterThisUpgrade !== tempPrice) ? ', ' : ' => '}价格变为: ${priceAfterThisUpgrade.toFixed(2)}`;
            tempTime = timeAfterThisUpgrade;
            tempPrice = priceAfterThisUpgrade;
            infoText += "\n";
        }
    }
    if (!hasAnyDefinedUpgrades && level < MAX_DISPLAY_LEVEL) infoText += "  无更多已定义的数值升级。\n";
    else if (level >= MAX_DISPLAY_LEVEL) infoText += "  已达最高显示等级。\n";
    return infoText.trim();
}

// --- Chart Logic ---
function initializeChart() {
    if (chartRef.value) {
        const ctx = chartRef.value.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: [], datasets: [{
                label: '每分钟收益率 (仅已解锁)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                animation: { duration: 300 }
            }
        });
    }
}

function updateChart() {
    if (!chartInstance) return;
    chartInstance.data.labels = unlockedProducts.value.map(p => p.name);
    chartInstance.data.datasets[0].data = unlockedProducts.value.map(p => p.profitRate);
    chartInstance.update();
}


// --- Persistence & Lifecycle ---
function saveState() {
    const state = {
        craftsmen: craftsmen.value,
        counters: counters.value,
        sortAscending: sortAscending.value,
        products: products.map(p => ({ name: p.name, level: p.level, isUnlocked: p.isUnlocked }))
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_ARTISAN, JSON.stringify(state));
}

function loadState() {
    const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY_ARTISAN);

    // Set default product data first
    const initialProductStates = initialProductsData.map(p => ({
        ...p,
        id: p.name.replace(/\s+/g, '-'),
        level: 1,
        isUnlocked: true, // Default to unlocked
        originalProductionTimeSeconds: parseProductionTime(p.productionTimeStr),
        originalBasePrice: p.basePrice
    }));
    Object.assign(products, initialProductStates);

    // If there's saved state, override the defaults
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            craftsmen.value = savedState.craftsmen ?? 3;
            counters.value = savedState.counters ?? 5;
            sortAscending.value = savedState.sortAscending ?? false;

            if (savedState.products) {
                products.forEach(p => {
                    const savedProduct = savedState.products.find(sp => sp.name === p.name);
                    if (savedProduct) {
                        p.level = savedProduct.level;
                        p.isUnlocked = savedProduct.isUnlocked;
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load artisan calculator state:", e);
        }
    }

    updateAllProductsState();
}

watch([craftsmen, counters, sortAscending, products], saveState, { deep: true });
watch(unlockedProducts, updateChart);

onMounted(() => {
    loadState();
    nextTick(() => { // Ensure canvas is in the DOM
        initializeChart();
        updateChart();
    });
});

onUnmounted(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
});
</script>

<style scoped>
:root {
    --primary-color: #3498db;
}
.calculator-container-vp {
    background-color: var(--container-bg); color: var(--text-color); padding: 25px;
    border-radius: 8px; margin: 20px 0; border: 1px solid var(--vp-c-divider);
}
h2 { text-align: center; margin-top: 0; font-weight: 600; }
h4 { margin-top: 0; }
table { border-collapse: collapse; width: 100%; margin-top: 20px; }
th, td { border: 1px solid var(--vp-c-divider); padding: 10px 12px; text-align: left; vertical-align: middle; white-space: nowrap;}
th { background-color: var(--vp-c-bg-soft); font-weight: 600; }
td.level-control, td:first-child, th:first-child { text-align: center; }
.product-locked { opacity: 0.6; font-style: italic; background-color: var(--vp-c-bg-mute); }
input[type="number"] {
    padding: 8px; border-radius: 4px; border: 1px solid var(--vp-c-divider);
    text-align: center; vertical-align: middle; background-color: var(--vp-c-bg);
    color: var(--vp-c-text-1);
}
.note { font-size: 12px; color: var(--vp-c-text-2); margin-top: 15px; }
.level-control button {
    margin: 0 3px; padding: 2px 5px; cursor: pointer; border: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg-soft); color: var(--vp-c-text-1); border-radius: 4px;
}
.level-control button:disabled { opacity: 0.5; cursor: not-allowed; }
.level-value { display: inline-block; width: 25px; text-align: center; }
.preview-text { color: #27ae60; font-size: 0.9em; margin-left: 5px; }
.material-consumption { font-size: 0.85em; color: var(--vp-c-text-2); }
.controls-box, .k-value-results {
    margin: 20px 0; padding: 15px; border: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg-soft); border-radius: 8px;
}
.controls-box label, .controls-box input { margin-right: 10px; }
.chart-container { width: 100%; max-width: 800px; margin: 30px auto; height: 350px; }
</style>