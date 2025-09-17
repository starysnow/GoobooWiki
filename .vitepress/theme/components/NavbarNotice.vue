<template>
  <div class="navbar-notice-container">
    <!-- 1. 触发按钮 -->
    <button class="notice-button" @click="showNoticeModal = true">
      <!-- <span class="icon"></span> -->
      使用须知
    </button>

    <!-- 2. 模态框组件 -->
    <!-- 我们之前创建的 Modal 组件在这里被调用 -->
    <Modal :show="showNoticeModal" @close="showNoticeModal = false">
      <!-- 自定义模态框的标题 -->
      <template #header>
        <h3>使用须知</h3>
      </template>

      <!-- 模态框的主体内容 -->
      <div class="notice-content">
        <h4>关于本站</h4>
        <p>本Wiki旨在为《Gooboo》玩家提供全面、准确的数据和攻略参考。所有内容均由社区玩家共同编辑和维护。</p>

        <h4>数据来源</h4>
        <ul>
          <li>大部分数据来源于游戏客户端解包。</li>
          <li>部分策略和技巧总结自社区高玩经验。</li>
          <li>所有数据仅供参考，请以游戏内实际效果为准。</li>
        </ul>

        <h4>参与贡献</h4>
        <p>我们欢迎所有热爱这款游戏的玩家参与到Wiki的建设中来！如果你发现了错误、有新的发现或想补充内容，请通过以下方式联系我们：</p>
        <ol>
          <li>在GitHub仓库提交 Issue 或 Pull Request。</li>
          <li>加入我们的玩家社区QQ群：</li>
        </ol>
        <p><strong>感谢每一位贡献者！</strong></p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue'; // 确保Modal组件在同一个文件夹下

const showNoticeModal = ref(false);
</script>

<style scoped>
.notice-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  margin-left: 12px;
  height: 32px;
  /* border: 1px solid var(--vp-c-divider); */
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  /* color: var(--vp-c-text-2); */
  color: black;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.notice-button:hover {
  border-color: var(--vp-c-brand-light);
  color: var(--vp-c-text-1);
}
.icon {
  font-size: 1.1em;
}

.notice-content h4 {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.notice-content ul, .notice-content ol {
  padding-left: 1.25rem;
}
</style>