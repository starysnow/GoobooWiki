<template>
  <div class="two-sections-layout">
    <!-- 主内容区 -->
    <div class="main-content">
      <h2 id="data-overview">数据一览</h2>
      <!-- 这是一个“插槽”，用于接收主数据内容 -->
      <slot name="data-section"></slot>
    </div>

    <!-- FAQ 内容区 -->
    <div class="faq-content">
      <h2 id="faq-section">常见疑问回答</h2>
      <!-- 这是另一个“插槽”，用于接收FAQ内容 -->
      <slot name="faq-section"></slot>
    </div>
  </div>
</template>

<style scoped>
<!-- .two-sections-layout {
  /* 这个组件本身不需要太多样式，主要负责提供结构 */
}-->
.main-content {
  margin-bottom: 3rem;
}
.faq-content {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>