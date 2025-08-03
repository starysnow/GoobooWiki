<template>
  <div class="calculator-card">
    <h4><span class="icon"></span> {{ title }}</h4>
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
</style>

