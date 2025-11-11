<!-- .vitepress/theme/LatestCommits.vue -->
<template>
  <div class="latest-commits-container">
    <h3>最近更新<></h3>
    <div v-if="loading" class="loading-state">正在加载提交记录...</div>
    <div v-if="error" class="error-state">无法加载更新记录：{{ error }}</div>
    <ul v-if="commits.length > 0" class="commit-list">
      <li v-for="commit in commits" :key="commit.sha" class="commit-item">
        <a class="commit-message">
        <!-- <a :href="commit.html_url" target="_blank" rel="noopener noreferrer" class="commit-message"> -->
          {{ commit.commit.message.split('\n')[0] }} <!-- 只显示提交信息的第一行 -->
        </a>
        <div class="commit-meta">
          <span class="commit-author">{{ commit.commit.author.name }}</span>
          <span>提交于</span>
          <span class="commit-date">{{ formatRelativeTime(commit.commit.author.date) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// --- 配置 ---
const GITHUB_REPO = 'starysnow/GoobooWiki'; // 替换为你的 GitHub 用户名/仓库名
const COMMITS_TO_SHOW = 5; // 显示最近 5 条提交
// -----------

const commits = ref([]);
const loading = ref(true);
const error = ref(null);

// 格式化日期为相对时间 (例如 "3天前")
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = {
    年: 31536000,
    月: 2592000,
    天: 86400,
    小时: 3600,
    分钟: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}前`;
    }
  }
  return '刚刚';
};

onMounted(async () => {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=${COMMITS_TO_SHOW}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }
    const data = await response.json();
    commits.value = data;
  } catch (e) {
    error.value = e.message;
    console.error('Failed to fetch GitHub commits:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 为这个组件添加一些美化样式 */
.latest-commits-container {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}
.commit-list {
  list-style: none;
  padding: 0;
}
.commit-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.commit-item:last-child {
  border-bottom: none;
}
.commit-message {
  font-weight: 600;
  color: var(--vp-c-brand);
  text-decoration: none;
  display: block;
}
.commit-message:hover {
  /* text-decoration: underline; */
}
.commit-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}
.commit-author {
  font-weight: 500;
}
.commit-date {
  font-style: italic;
}
.loading-state, .error-state {
  color: var(--vp-c-text-2);
}
.error-state {
  color: var(--vp-c-red-1);
}
</style>