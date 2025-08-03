<template>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>印记</th>
          <th>图标</th>
          <th>区域+</th>
          <th>被动 (c为该印记数量)</th>
          <th>主动 (c为该印记数量)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="imprint in imprintsData" :key="imprint.name">
          <td><strong>{{ imprint.name }}</strong></td>
          <td>{{ imprint.icon }}</td>
          <td>{{ imprint.area }}</td>
          <td class="formula">{{ imprint.passive }}</td>
          <td class="formula">{{ imprint.active }}</td>
        </tr>
      </tbody>
    </table>
    <div class="notes">
      <p>注：c代表你拥有的该印记的数量。所有公式和数值均来自游戏内数据。</p>
    </div>
  </div>
</template>

<script setup>
import imprintsData from '../../data/tribe-imprints.json';
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  margin: 2rem 0;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid var(--vp-c-divider);
  padding: 0.75rem 1rem;
  text-align: center;
}
th {
  background-color: var(--vp-c-bg-soft);
  font-weight: 600;
}
td.formula {
  font-family: 'Courier New', Courier, monospace;
  background-color: var(--vp-c-mute-soft);
  font-size: 0.9em;
  color: var(--vp-c-brand);
}
.notes {
  margin-top: 1rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
</style>