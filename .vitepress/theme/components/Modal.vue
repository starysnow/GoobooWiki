<template>
  <!--
    使用 <Teleport> 将模态框的DOM移动到<body>标签的末尾。
    这可以避免很多由父元素CSS（如z-index, overflow）导致的奇怪问题。
  -->
  <Teleport to="body">
    <!-- 使用 <Transition> 来添加淡入淡出的动画效果 -->
    <Transition name="modal-fade">
      <!-- 模态框遮罩层 -->
      <div v-if="show" class="modal-mask" @click.self="close">
        <!-- 模态框内容容器 -->
        <div class="modal-container">

          <!-- 头部：标题和关闭按钮 -->
          <div class="modal-header">
            <!--
              使用 <slot> 让我们可以在调用组件时自定义标题。
              如果没提供，就显示默认标题。
            -->
            <slot name="header"><h3>使用须知</h3></slot>
            <button class="modal-close-button" @click="close">&times;</button>
          </div>

          <!-- 主体：弹窗的主要内容 -->
          <div class="modal-body">
            <slot>
              <!-- 这是默认的插槽，用于放置主要内容 -->
              这里是默认的模态框内容。
            </slot>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// 定义组件可以接收的属性 (Props) 和可以发出的事件 (Emits)
const props = defineProps({
  show: Boolean // 一个布尔值，用于控制模态框的显示与隐藏
});

const emit = defineEmits(['close']);

function close() {
  emit('close'); // 当需要关闭时，向父组件发出一个 'close' 事件
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 90%;
  max-width: 600px;
  margin: auto;
  padding: 2rem;
  background-color: var(--vp-c-bg);
  border-radius: var(--vp-border-radius-large);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  max-height: 80vh; /* 限制最大高度 */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.modal-header :deep(h3) {
  margin: 0;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.modal-close-button {
  border: none;
  background: none;
  font-size: 2.5rem;
  font-weight: 300;
  color: var(--vp-c-text-3);
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  flex: 1; /* 让主体内容区域可以滚动 */
  overflow-y: auto; /* 当内容超长时，出现滚动条 */
}

/* 动画效果 */
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.95);
}
</style>