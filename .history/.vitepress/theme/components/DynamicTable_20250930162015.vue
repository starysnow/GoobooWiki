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
              {{ formatHeader(header) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in processedData" :key="rowIndex">
            <template v-for="(cell, colIndex) in row" :key="colIndex">
              <td
                v-if="cell._render"
                :rowspan="cell._rowspan"
                :colspan="cell._colspan"
              >
                <span :data-content="cell.value" v-html="renderCell(cell.value)"></span>
              </td>
            </template>
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
            <table>
              <thead>
                <tr>
                  <th v-for="header in headers" :key="header">
                    <!-- <span class="header-icon">#</span> -->
                    {{ formatHeader(header) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in processedData" :key="rowIndex">
                  <template v-for="(cell, colIndex) in row" :key="colIndex">
                    <td
                      v-if="cell._render"
                      :rowspan="cell._rowspan"
                      :colspan="cell._colspan"
                    >
                      <span :data-content="cell.value" v-html="renderCell(cell.value)"></span>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
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
import { computed, ref, onMounted, onUpdated, watch, nextTick  } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (value) => value && value.length > 0,
  }
});

const headers = computed(() => Object.keys(props.data[0]));

// 自动识别、计算并处理合并单元格
const processedData = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  // 1. 初始化元数据网格 (保持不变)
  const metaGrid = props.data.map(row =>
    headers.value.map(header => ({
      value: row[header],
      _render: true,
      _rowspan: 1,
      _colspan: 1,
    }))
  );

  const rowCount = metaGrid.length;
  const colCount = headers.value.length;

  // 2. 修正行合并 (rowspan) 逻辑
  for (let j = 0; j < colCount; j++) {
    for (let i = rowCount - 1; i >= 0; i--) {
      // 检查下方单元格是否存在
      if (i < rowCount - 1) {
        const currentCell = metaGrid[i][j];
        const belowCell = metaGrid[i + 1][j];

        // 只有在当前单元格内容非空，且与下方单元格内容相同时才合并
        if (
          // currentCell.value &&
          // 确保当前单元格的值不是空字符串、null或undefined
          currentCell.value === belowCell.value &&
          belowCell._render // 确保下方单元格还未被合并
          // && belowCell.value
        ) {
          currentCell._rowspan += belowCell._rowspan;
          belowCell._render = false;
        }
      }
    }
  }

  // 3. 修正列合并 (colspan) 逻辑
  for (let i = 0; i < rowCount; i++) {
    for (let j = colCount - 1; j >= 0; j--) {
      // 检查右方单元格是否存在
      if (j < colCount - 1) {
        const currentCell = metaGrid[i][j];
        const rightCell = metaGrid[i][j + 1];

        // 同样，只有在当前单元格内容非空时才尝试合并
        if (
          // currentCell.value &&
          currentCell.value === rightCell.value &&
          currentCell._rowspan === rightCell._rowspan && // 行合并数必须相同
          rightCell._render
          // && rightCell.value
        ) {
          currentCell._colspan += rightCell._colspan;
          rightCell._render = false;
        }
      }
    }
  }
  return metaGrid;
});

// --- 美化逻辑 ---
function formatHeader(header) {
  return header
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

  /**
 * 渲染单元格内容。
 * 如果内容是HTML（如MDI图标），直接返回；否则返回普通文本。
 */
// const renderCell = (value) => {
//   if (typeof value === 'string' && value.trim().startsWith('<i')) {
//     return value; // 是图标HTML，直接返回
//   }
//   // 对于其他所有内容，包括公式（$ ... $），也直接返回。
//   // v-html 会处理它们，MathJax 会找到并渲染公式。
//   return value;
// };


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

// --- 5. 生命周期钩子 (新增，用于渲染公式) ---
/**
 * 调用 MathJax API 来渲染页面上的所有公式。
 */
const renderMath = async () => {
  // 确保在下一个 DOM 更新周期后执行，这很重要！
  await nextTick();

  // 检查 MathJax 全局对象和 typeset 方法是否存在
  if (window.MathJax && typeof window.MathJax.typeset === 'function') {
    console.log('MathJax found, attempting to typeset...');
    window.MathJax.typeset();
  } else {
    console.warn('MathJax script not available yet.');
  }
};

// 在组件首次挂载到 DOM 后调用
onMounted(renderMath);

// 在组件因 props 数据变化而更新后调用
onUpdated(renderMath);
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

/* --- 表头特定样式 (已修改) --- */
.grid-header {
  background-color: var(--vp-c-bg-soft);
  font-weight: 600;
  white-space: nowrap;

  /* --- 粘性定位的关键代码 --- */
  position: sticky;
  top: 0; /* 粘在容器的顶部 */
  z-index: 10; /* 确保它能覆盖在滚动内容之上 */
  /* --- 结束 --- */
}

/* --- 全屏按钮样式 --- */
.fullscreen-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.8em;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.fullscreen-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background-color: var(--vp-c-brand-soft);
}
.fullscreen-btn .icon {
  font-size: 1.2em;
}


/* --- 全屏模态框样式 --- */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明遮罩层 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  height: 90%;
  background-color: var(--vp-c-bg);
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  /* 让内部的表格可以滚动 */
  display: flex;
  flex-direction: column;
}
.modal-content .table-container {
  flex: 1;
  overflow: auto; /* 这是让模态框内的表格可以独立滚动的关键 */
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  cursor: pointer;
}

/* --- 过渡动画 --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/*
  添加一个全局样式，用于在模态框打开时锁定背景页面的滚动。
  注意：这个<style>标签没有`scoped`属性。
*/
body.modal-open {
  overflow: hidden;
}
</style>