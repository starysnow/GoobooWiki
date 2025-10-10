<!-- .vitepress/theme/components/CollapsibleTable.vue -->
<template>
  <div class="collapsible-section">
    <!-- 标题部分 -->
    <h2 :id="id">
      <button
        type="button"
        class="header-button"
        :aria-expanded="isOpen"
        :aria-controls="contentId"
        @click="handleClick"
      >
        <span class="title-text">{{ title }}</span>
        <span :class="['chevron', { 'is-open': isOpen }]">›</span>
      </button>
    </h2>

    <!-- 内容部分 -->
    <!-- 使用 v-show 保持 DOM 存在，对性能和锚点定位更友好 -->
    <div
      v-show="isOpen"
      :id="contentId"
      class="content-wrapper"
      role="region"
      :aria-labelledby="id"
    >
      <DynamicTable :data="data" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DynamicTable from './DynamicTable.vue'; // 确保路径正确

// --- 1. 定义 Props ---
const props = defineProps({
  id: { // 使用父组件传入的唯一 ID
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
  // 新增：接收父组件传入的“当前打开的表格ID”
  activeId: {
    type: String,
    default: '',
  },
});

// --- 2. 定义 Emits ---
// 声明组件可以发出的事件
const emit = defineEmits(['toggle']);

// --- 3. 计算属性 ---
// isOpen 不再是一个 ref，而是一个计算属性，由父组件的状态决定
const isOpen = computed(() => props.id === props.activeId);
const contentId = computed(() => `content-${props.id}`);

// --- 4. 方法 ---
const handleClick = () => {
  // 当点击时，向父组件发送 'toggle' 事件，并附上自己的 ID
  emit('toggle', props.id);
};


/**
 * 辅助函数：手动滚动到目标元素
 * @param {string} targetId - 要滚动到的元素的 ID
 */
const scrollToTarget = (targetId) => {
  const headerElement = document.getElementById(targetId);
  if (headerElement) {
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64;
    const elementPosition = headerElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - navHeight - 16;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
      behavior: 
    });
  }
};


// --- 5. 生命周期钩子：处理锚点链接 ---
onMounted(() => {
  const handleHashChange = () => {
    // 从 hash 中提取 ID，去掉 '#'
    const targetId = window.location.hash.substring(1);

    // 如果 hash 变化指向的是当前这个组件
    if (targetId === props.id) {
      // 1. 通知父组件更新状态（展开当前表格，折叠其他表格）
      emit('toggle', props.id);

      // 2. 使用 nextTick 来确保 DOM 更新后再滚动
      // nextTick 是 Vue 提供的，比 setTimeout 更精确
      import('vue').then(({ nextTick }) => {
        nextTick(() => {
          scrollToTarget(props.id);
        });
      });
    }
  };

  // --- 阻止默认滚动行为 ---
  // 我们监听 a 标签的点击事件，如果它是一个 hash 链接，就阻止它
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.hash && link.closest('.VPDocAsideOutline')) {
      // 如果点击的是侧边栏目录中的链接
      e.preventDefault();
      // 手动更新 URL hash，这样我们的 hashchange 监听器仍然会触发
      window.location.hash = link.hash;
    }
  }, { capture: true }); // 使用捕获模式确保最早执行

  // 页面加载时，如果 URL 带有 hash，也执行一次
  if (window.location.hash) {
    handleHashChange();
  }

  // 监听 URL hash 的变化
  window.addEventListener('hashchange', handleHashChange);
});
</script>

<style scoped>
/* 样式保持不变 */
.collapsible-section {
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 1rem;
}
.header-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.chevron {
  font-size: 2rem;
  font-weight: 300;
  transition: transform 0.2s ease-in-out;
  transform: rotate(90deg);
}
.chevron.is-open {
  transform: rotate(-90deg);
}
.content-wrapper {
  padding-bottom: 1.5rem;
}
</style>