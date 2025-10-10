<!-- .vitepress/theme/CollapsibleTable.vue -->
<template>
  <div class-name="collapsible-section">
    <!-- 1. 标题部分，作为可点击的触发器 -->
    <!-- 赋予一个和 Markdown 标题匹配的 id，以便目录链接能找到它 -->
    <h2 :id="headerId">
      <button
        type="button"
        class="header-button"
        :aria-expanded="isOpen"
        :aria-controls="contentId"
        @click="toggle"
      >
        <span class="title-text">{{ title }}</span>
        <span :class="['chevron', { 'is-open': isOpen }]">›</span>
      </button>
    </h2>

    <!-- 2. 内容部分，可折叠 -->
    <div
      v-show="isOpen"
      :id="contentId"
      class="content-wrapper"
      role="region"
      :aria-labelledby="headerId"
    >
      <!-- 这里是你现有的动态表格组件 -->
      <!-- 我们把 data 直接传递给它 -->
      <DynamicTable :data="data" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import DynamicTable from './DynamicTable.vue'; // 假设你的表格组件名为 DynamicTable.vue

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
  // 新增 prop，用于控制初始是否展开
  startOpen: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(props.startOpen);
const headerId = ref('');
const contentId = ref('');

// 根据 title 生成唯一的 ID
const generateId = (title) => {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

// --- 核心：处理来自目录的锚点链接 ---
onMounted(() => {
  // 生成组件内部使用的 ID
  const baseId = generateId(props.title);
  headerId.value = baseId;
  contentId.value = `content-${baseId}`;

  // 检查 URL hash 是否匹配当前组件的标题
  const checkHash = () => {
    if (window.location.hash === `#${headerId.value}`) {
      isOpen.value = true;
    }
  };

  // 页面加载时检查一次
  checkHash();

  // 监听 URL hash 的变化 (当用户点击目录链接时)
  window.addEventListener('hashchange', checkHash);
});
</script>

<style scoped>
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
  font-size: 1.5rem; /* h2 的字体大小 */
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.chevron {
  font-size: 2rem;
  font-weight: 300;
  transition: transform 0.2s ease-in-out;
  transform: rotate(90deg); /* 默认朝右，表示折叠 */
}

.chevron.is-open {
  transform: rotate(-90deg); /* 展开时朝下 */
}

.content-wrapper {
  padding-bottom: 1.5rem;
}
</style>