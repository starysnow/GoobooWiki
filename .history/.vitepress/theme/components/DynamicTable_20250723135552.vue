<template>
 <div class="dynamic-table-wrapper">
    <!-- 全屏按钮 -->
    <button @click="isFullscreen = true" class="fullscreen-btn">
      <span class="icon">⛶</span> 全屏查看
    </button>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th v-for="header in headers" :key="header">
              <!-- 添加一个小图标增加视觉效果 -->
              <!-- <span class="header-icon">#</span> -->
              {{ formatHeader(header) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in data" :key="index" class="table-row">
            <td v-for="header in headers" :key="header" :data-label="formatHeader(header)">
              <!-- 使用 v-html 来渲染可能包含HTML的内容 -->
              <span v-html="renderCell(row[header])"></span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Transition name="fade">
      <div v-if="isFullscreen" class="fullscreen-modal" @click.self="isFullscreen = false">
        <div class="modal-content">
          <button @click="isFullscreen = false" class="close-btn">×</button>
          <!-- 在模态框中再次渲染表格 -->
          <div class="table-container">
            <!-- ... (在这里复制一份你上面的表格HTML代码) ... -->
          </div>
        </div>
      </div>
    </Transition>
     <!-- 注释区域 -->
    <div v-if="$slots.notes" class="notes-container">
      <slot name="notes" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ref, watch } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (value) => value && value.length > 0,
  }
});

const headers = computed(() => Object.keys(props.data[0]));

// --- 美化逻辑 ---
function formatHeader(header) {
  return header
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// 渲染单元格内容，增加对特殊标记的处理
function renderCell(content) {
  if (typeof content !== 'string') {
    return content;
  }
  // 示例：将 [icon:...] 标记替换为一个图标 (需要一个图标库或SVG)
  // 这里我们用一个简单的emoji代替
  return content.replace(/\[icon:(.+?)\]/g, '<span class="cell-icon">🎨</span> $1');
}

// --- 全屏功能的状态 ---
const isFullscreen = ref(false);

// 监视 isFullscreen 状态的变化
watch(isFullscreen, (newValue) => {
  // 当进入全屏时，给<body>添加一个class来隐藏页面滚动条
  if (newValue) {
    document.body.classList.add('modal-open');
  } else {
    // 退出全屏时移除该class
    document.body.classList.remove('modal-open');
  }
});
</script>

<style scoped>
/* --- 整体包裹容器 --- */
.dynamic-table-wrapper {
  margin: 0.5rem 0;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--vp-shadow-1);
}

/* --- 表格滚动容器 --- */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate; /* 使用 separate 来支持圆角 */
  border-spacing: 0;
}

/* --- 表头样式 --- */
th {
  background-color: var(--vp-c-bg);
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9em;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  border-bottom: 2px solid var(--vp-c-brand);
}
th:first-child {
  border-top-left-radius: 8px;
}
th:last-child {
  border-top-right-radius: 8px;
}
.header-icon {
  color: var(--vp-c-brand);
  margin-right: 0.5rem;
  font-weight: bold;
}

/* --- 表格行与单元格样式 --- */
.table-row {
  transition: background-color 0.2s ease;
}
.table-row:hover {
  background-color: var(--vp-c-brand-soft);
}

td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  vertical-align: middle;
  font-size: 0.9em;
}

/* --- 移除最后一行单元格的下边框 --- */
.table-row:last-child td {
  border-bottom: none;
}

/* --- 注释区域样式 --- */
.notes-container {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 0.85em;
  color: var(--vp-c-text-3);
}

/* --- 响应式设计：在手机上优化显示 --- */
@media (max-width: 768px) {
  .dynamic-table-wrapper {
    padding: 0;
    border: none;
    box-shadow: none;
    background: none;
  }
  thead {
    display: none; /* 在手机上隐藏表头 */
  }
  tr.table-row {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background-color: var(--vp-c-bg-soft);
  }
  td {
    display: block;
    text-align: right; /* 将内容推到右边 */
    border-bottom: 1px solid var(--vp-c-divider);
    padding-left: 50%; /* 给左边的标签留出空间 */
    position: relative;
  }
  td:last-child {
    border-bottom: none;
  }
  /* 使用伪元素创建标签 */
  td::before {
    content: attr(data-label); /* 获取data-label属性作为标签内容 */
    position: absolute;
    left: 1.25rem;
    font-weight: 600;
    color: var(--vp-c-text-1);
  }
}
</style>