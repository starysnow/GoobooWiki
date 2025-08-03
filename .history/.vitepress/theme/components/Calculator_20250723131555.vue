<template>
  <div class="calculator-card">
    <h4><span class="icon">🧮</span> {{ title }}</h4>
    <div class="input-group">
      <label :for="inputId">{{ inputLabel }}</label>
      <input
        :id="inputId"
        type="number"
        v-model.number="inputValue"
        :placeholder="placeholder"
        @keyup.enter="calculate"
      />
    </div>
    <button @click="calculate">计算</button>

    <div v-if="result !== null" class="result-area">
      <p>{{ resultPrefix }} <strong>{{ result }}</strong> {{ resultSuffix }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// --- 定义组件可接收的属性 ---
const props = defineProps({
  // 计算器的标题
  title: { type: String, default: '简易计算器' },
  // 输入框的标签文字
  inputLabel: { type: String, default: '输入值:' },
  // 输入框的占位提示文字
  placeholder: { type: String, default: '例如: 10' },
  // 结果的前缀文字
  resultPrefix: { type: String, default: '结果:' },
  // 结果的后缀文字
  resultSuffix: { type: String, default: '' },
  // 核心：计算逻辑函数
  // 这是一个从父组件传入的函数，它接收输入值，返回计算结果
  calculationFn: {
    type: Function,
    required: true
  }
});

// --- 组件内部状态 ---
const inputValue = ref(null); // 存储用户输入的值
const result = ref(null); // 存储计算结果

// 为<label>和<input>生成一个唯一的ID，提升可访问性
const inputId = `calc-input-${Math.random().toString(36).substring(7)}`;

// --- 方法 ---
function calculate() {
  if (inputValue.value === null || typeof inputValue.value !== 'number') {
    result.value = '请输入有效的数字';
    return;
  }
  // 调用从父组件传入的计算函数
  result.value = props.calculationFn(inputValue.value);
}
</script>

<style scoped>
.calculator-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.calculator-card h4 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}
.icon {
  margin-right: 0.5rem;
  font-size: 1.2em;
}
.input-group {
  margin-bottom: 1rem;
}
.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9em;
}
input[type="number"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
button {
  padding: 0.5rem 1.5rem;
  border: none;
  background-color: var(--vp-c-brand);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}
button:hover {
  background-color: var(--vp-c-brand-dark);
}
.result-area {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 1.1em;
}
.result-area strong {
  color: var(--vp-c-brand-dark);
  font-size: 1.2em;
}
</style>```

---


    ```

2.  **在Markdown页面中调用并传入计算逻辑**：
    打开你的 `gallery/index.md` (或任何其他页面)，在你想放置计算器的地方（比如“锭”表格的下方），添加以下代码。

    ```markdown
    <!-- gallery/index.md -->

    <!-- ... <script setup> 和其他页面内容 ... -->

    <!-- 在“锭”表格的区块内，DynamicTable组件之后 -->
    <div v-for="tableInfo in tables" :key="tableInfo.id">
      <h2 :id="tableInfo.id" class="section-title">{{ tableInfo.title }}</h2>
      <DynamicTable :data="tableInfo.data" />

      <!--
        只在“锭”表格后面显示这个计算器
        关键在于 :calculationFn="calculateIngotCost"
      -->
      <SimpleCalculator
        v-if="tableInfo.id === 'ingot-table'"
        title="升级成本计算器"
        input-label="输入目标等级:"
        placeholder="例如: 50"
        result-prefix="预计需要"
        result-suffix="个锭"
        :calculation-fn="calculateIngotCost"
      />

    </div>

    <!-- ... -->
    ```

3.  **在 `<script setup>` 中定义计算函数**：
    你还需要在同一个 `.md` 文件的 `<script setup>` 块中，定义那个要传给计算器的函数。

    ```javascript
    // 在 gallery/index.md 的 <script setup> 区域

    // ... 其他 import 和 tables 数组定义 ...

    /**
     * 定义“锭”成本的计算逻辑
     * @param {number} level - 用户输入的等级
     * @returns {number} - 计算出的所需锭数
     */
    function calculateIngotCost(level) {
      if (level <= 0) return 0;
      // 假设这是你的计算公式
      const cost = Math.ceil(Math.pow(level, 1.5) * 10 + 50);
      return cost;
    }

    // 如果你有其他计算器，可以定义更多函数
    function calculateFireDamage(power) {
      return power * 12.5;
    }
    ```

### **工作原理解析**

*   **组件的通用性**：`SimpleCalculator.vue` 组件自身**不知道**任何具体的计算公式。它只负责提供UI（输入框、按钮）和基本的交互（点击计算）。

*   **通过Prop传递函数**：这个方案的**核心**是 `:calculation-fn="calculateIngotCost"` 这一行。
    *   `:` 是 `v-bind` 的缩写，它告诉Vue：“请把父组件（Markdown页面）中的 `calculateIngotCost` 这个**函数本身**，传递给子组件（`SimpleCalculator`）的 `calculationFn` 这个属性。”
    *   当用户在计算器里点击“计算”按钮时，`SimpleCalculator` 内部的 `calculate` 方法就会执行 `props.calculationFn(inputValue.value)`，这实际上是**回头调用了我们在Markdown页面里定义的那个 `calculateIngotCost` 函数**，并将用户的输入值作为参数传了进去。

*   **高度可复用**：如果你想在“火”表格后面加一个伤害计算器，只需要在 `v-for` 循环里再加一个 `<SimpleCalculator>`，并把 `:calculation-fn` 绑定到一个新的、你定义的 `calculateFireDamage` 函数上即可，其他UI属性也可以按需定制。

通过这种方式，你成功地将**“可复用的UI”**和**“具体的业务逻辑”**分离开来，实现了在一个页面上灵活配置多个不同功能计算工具的目标。