<template>
  <div class="home-layout">
    <div class="card-grid">
      <!-- 遍历模块数据，创建卡片 -->
      <a v-for="card in modules" :key="card.title" :href="card.link" class="card">
        <img :src="card.iconSrc" :alt="card.title" class="card-icon" />
        <span class="card-title">{{ card.title }}</span>
      </a>
    </div>
  </div>
</template>

<script setup>
// 定义所有模块的数据，包括标题、图标路径和链接
const modules = [
  // 第一行
  { title: '采矿', iconSrc: '/icons/pickaxe.svg', link: '/pages/mining/' },
  { title: '村庄', iconSrc: '/icons/home-group.svg', link: '/pages/village/' },
  { title: '部落', iconSrc: '/icons/account-group.svg', link: '/pages/horde/' },
  { title: '农场', iconSrc: '/icons/barn.svg', link: '/pages/farm/' },
  { title: '画廊', iconSrc: '/icons/image-frame.svg', link: '/pages/gallery/' },
  // 第二行
  { title: '笔记', iconSrc: '/icons/note-multiple.svg', link: '/pages/notes/' },
  { title: '宝石', iconSrc: '/icons/diamond-stone.svg', link: '/pages/gems/' },
  { title: '成就', iconSrc: '/icons/trophy.svg', link: '/pages/achievements/' },
  { title: '学校', iconSrc: '/icons/school.svg', link: '/pages/school/' },
  { title: '圣遗物', iconSrc: '/icons/ring.svg', link: '/pages/relics/' },
  // 第三行
  { title: '卡片', iconSrc: '/icons/cards.svg', link: '/pages/cards/' },
  { title: '将军', iconSrc: '/icons/medal.svg', link: '/pages/generals/' },
  { title: '事件', iconSrc: '/icons/calendar.svg', link: '/pages/event/' },
  { title: '宝藏', iconSrc: '/icons/treasure-chest.svg', link: '/pages/treasure/' },
  { title: '冷冻实验室', iconSrc: '/icons/test-tube.svg', link: '/pages/cryo-lab/' },
];
</script>

<style scoped>
.home-layout {
  padding: 2rem 0;
}

.card-grid {
  display: grid;
  /* 核心：强制设置为5列，每列平分空间 */
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
  border: 1px solid var(--vp-c-bg-soft);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--vp-shadow-2);
  background-color: var(--vp-c-bg);
  border-color: var(--vp-c-brand);
}

.card-icon {
  /* 设置图标的大小 */
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

.card-title {
  font-weight: 600;
  font-size: 1em;
}

/* 响应式布局：当屏幕宽度小于960px时，变为3列 */
@media (max-width: 960px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 响应式布局：当屏幕宽度小于576px时，变为2列，以适应手机屏幕 */
@media (max-width: 576px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

