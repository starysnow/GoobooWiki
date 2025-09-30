| 名称  | color | 图标  | 效果  | minZone |
| --- | ----- | --- | --- | ------- |
| 力量 | 红色 | <i class="mdi mdi-sword"></i> | 攻击*｛$lvl  \cdot  0.2 + 1$｝ |  |
| fortitude | 绿色 | <i class="mdi mdi-heart"></i> | 生命值*｛$lvl  \cdot  0.2 + 1$｝ |  |
| wealth | 金色 | <i class="mdi mdi-circle-multiple"></i> | 骨头增益*｛$lvl  \cdot  0.15 + 1$｝; 怪物零件增益*｛$lvl  \cdot  0.05 + 1$｝ |  |
| spirit | 紫色 | <i class="mdi mdi-ghost"></i> | 腐败的灵魂增益*｛$lvl  \cdot  0.06 + 1$｝ | 40 |
| sharpsight | 青色 | <i class="mdi mdi-magnify"></i> | 装备几率*｛$lvl  \cdot  0.05 + 1$｝ | 50 |
| reaping | 粉色 | <i class="mdi mdi-skull"></i> | 腐烂的肉体增益+｛$lvl  \cdot  0.03$｝ | 60 |
| remembrance | deep-紫色 | <i class="mdi mdi-grave-stone"></i> | 腐败的灵魂容量*｛$lvl  \cdot  0.05 + 1$｝ | 70 |
| holding | 棕色 | <i class="mdi mdi-dresser"></i> | 骨头容量*｛$lvl  \cdot  0.1 + 1$｝; 怪物零件容量*｛$lvl  \cdot  0.02 + 1$｝ | 80 |
| expertise | 光-blue | <i class="mdi mdi-book-open-variant"></i> | 精通点数增益*｛$lvl  \cdot  0.01 + 1$｝ | 100 |
| 神秘 | teal | <i class="mdi mdi-help-box"></i> | 神秘碎片几率*｛$lvl  \cdot  0.001 + 1$｝ | 120 |
| 砖块 | 樱桃色 | <i class="mdi mdi-wall"></i> | 骨头增益*｛$lvl  \cdot  0.05 + 1$｝; 暴击伤害+｛$({(lvl / 10 + 1)}^{0.4} - 1)  \cdot  0.01$｝ | Infinity |
| heat | 橙色-红色 | <i class="mdi mdi-fire"></i> | 攻击*｛$lvl  \cdot  0.05 + 1$｝; 暴击率+｛$Math.log(lvl / 10 + 1)  \cdot  0.008$｝ | Infinity |
| ice | skyblue | <i class="mdi mdi-snowflake-variant"></i> | 生命值*｛$lvl  \cdot  0.05 + 1$｝; 恢复+｛$Math.log(lvl / 10 + 1)  \cdot  0.003$｝ | Infinity |
| crystal | indigo | <i class="mdi mdi-billiards-rack"></i> | 神秘碎片几率*｛$lvl  \cdot  0.001 + 1$｝; 神秘碎片容量+｛$\text{向下取整}(Math.log(lvl + 2))$｝ | Infinity |
| 活力 | 光-绿色 | <i class="mdi mdi-heart-multiple"></i> | 骨头容量*｛$lvl  \cdot  0.001 + 1$｝; 治疗*｛$Math.log(lvl + 1)  \cdot  0.1 + 1$｝ | Infinity |
