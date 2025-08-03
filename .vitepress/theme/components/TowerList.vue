<script setup>
// 1. 导入我们准备好的JSON数据
import towers from '../../../data/json/towers.json';
</script>

<template>
  <div class="tower-wiki">
    <!-- 2. 遍历towers数组中的每一个塔对象 -->
    <div v-for="tower in towers" :key="tower.id" class="tower-card">
      <!-- 主要信息 -->
      <div class="tower-main">
        <h2>{{ tower.name }}</h2>
        <div class="stats">
          <span><strong>造价:</strong> {{ tower.cost }}</span>
          <span><strong>攻速:</strong> {{ tower.attack_speed }}</span>
        </div>
        <div class="keywords">
          <span v-for="keyword in tower.keywords" :key="keyword" class="keyword-tag">
            {{ keyword }}
          </span>
        </div>
      </div>

      <!-- 升级信息表格 -->
      <div class="upgrade-section">
        <h3>升级路线 ({{ tower.type_id }})</h3>
        <table>
          <thead>
            <tr>
              <th>需求</th>
              <th>效果描述</th>
              <th>参考值</th>
            </tr>
          </thead>
          <tbody>
            <!-- 3. 遍历每个塔的升级项 -->
            <tr v-for="(upgrade, index) in tower.upgrades" :key="index">
              <td>{{ upgrade.cost }}</td>
              <td>{{ upgrade.description }}</td>
              <td>{{ upgrade.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 4. 添加一些美化样式，让它看起来更美观 */
.tower-card {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 2rem;
  padding: 1.5rem;
  transition: box-shadow 0.3s ease;
}

.tower-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tower-main h2 {
  margin-top: 0;
  border-bottom: 2px solid #3eaf7c;
  padding-bottom: 0.5rem;
  display: inline-block;
}

.stats {
  display: flex;
  gap: 1.5rem;
  margin: 1rem 0;
  font-size: 1.1em;
}

.keywords {
  margin-bottom: 1.5rem;
}

.keyword-tag {
  display: inline-block;
  background-color: #e0f2f1;
  color: #00796b;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9em;
}

.upgrade-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.8rem;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>