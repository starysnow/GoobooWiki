---
pageClass: full-width-page
---
<!-- 这是一个“多表格并列展示”的页面模板 -->
<script setup>
import dataProduct from '@/data/json/工匠制品.json';

// 定义所有表格的信息，用于循环创建内容和导航
const tables = [
  {
    id: 'Product-table',         // 用作锚点的唯一ID
    title: '工匠制品',    // 表格的标题
    data: dataProduct,           // 绑定的数据
  }
];

// 计算函数
/**
 * 定义“锭”成本的计算逻辑
 * @param {number} level - 用户输入的等级
 * @returns {number} - 计算出的所需锭数
 */
function calculateIngotCost(level) {
  if (level <= 0) return 0;
  const cost = Math.ceil(Math.pow(level, 1.5) * 10 + 50);
  return cost;
}

</script>

<div class="page-container">
  <div class="content-main">
      <div v-for="tableInfo in tables" :key="tableInfo.id">
      <h2 :id="tableInfo.id" class="section-title">{{ tableInfo.title }}</h2>
      <DynamicTable :data="tableInfo.data">
        <template #notes>
          <div v-if="tableInfo.id === 'Product-table'" class="notes-section">
            <ul>
              <li></li>
              <li></li>
            </ul>
          </div>
        </template>
      </DynamicTable>
    </div>
  </div>
</div>
