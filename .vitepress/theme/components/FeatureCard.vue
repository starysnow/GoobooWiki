<template>
  <div class="feature-card">
    <a :href="link" class="card-link">
      <img v-if="imageSrc" :src="imageSrc" :alt="title" class="card-image" />
      <div class="card-content">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="description" class="card-description">{{ description }}</p>
      </div>
    </a>
  </div>
</template>

<script setup>
// 使用 defineProps 定义这个组件可以接收哪些外部传入的“属性”
defineProps({
  // 图片的路径，类型为字符串，这个属性是必须的
  imageSrc: {
    type: String,
    required: true
  },
  // 卡片的标题，类型为字符串，也是必须的
  title: {
    type: String,
    required: true
  },
  // 卡片的描述文字，类型为字符串，这个是可选的
  description: {
    type: String,
    required: false // 设为false，意味着可以不传这个属性
  },
  // 卡片点击后的跳转链接，类型为字符串，默认为首页 '/'
  link: {
    type: String,
    default: '/'
  }
});
</script>

<!-- 使用示例 -->
<!-- <div class="card-container">
  <FeatureCard
    imageSrc="/img/稀土.png"
    title="狂战士·雷格"
    description="一位来自北方冰原的勇士，擅长用巨斧撕裂敌人。"
    link="/img/稀土.png"
  />

</div>

<style>
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
</style> -->

<style scoped>
/* 这里的样式与我们之前的InfoCardList类似，但更通用 */
.feature-card {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  height: 100%; /* 确保卡片在网格中高度一致 */
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--vp-shadow-2);
  border-color: var(--vp-c-brand);
}

.card-link {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.card-image {
  width: 100%;
  height: 150px; /* 给图片一个固定的高度 */
  object-fit: cover; /* 保证图片不变形 */
  border-radius: 6px;
  margin-bottom: 1rem;
  background-color: var(--vp-c-bg);
}

.card-content {
  flex: 1;
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2em;
  font-weight: 600;
  border: none;
  padding: 0;
  color: var(--vp-c-text-1);
}

.card-description {
  margin: 0;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
</style>