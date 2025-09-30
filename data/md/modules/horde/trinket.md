| 名称  | 图标  | 效果  | needsEnergy | needsMana | cooldown | activeCost | 激活的卡片 | activeType | rarity | isTimeless | 可以在眩晕时使用 | uniqueToBoss |
| --- | --- | --- | ----------- | --------- | -------- | ---------- | ----- | ---------- | ------ | ---------- | -------- | ------------ |
| 活力 | <i class="mdi mdi-heart"></i> | 生命值+｛$lvl  \cdot  70 + 30$｝ |  |  |  |  |  |  |  |  |  |  |
| 能量 | <i class="mdi mdi-lightning-bolt"></i> | 能量+｛$lvl  \cdot  35 + 20$｝ | needsEnergy |  |  |  |  |  |  |  |  |  |
| 魔法 | <i class="mdi mdi-water"></i> | 法力+｛$lvl  \cdot  25 + 15$｝ |  | needsMana |  |  |  |  |  |  |  |  |
| 拳头 | <i class="mdi mdi-arm-flex"></i> |  | needsEnergy |  | $15$ | ${ 能量: 25 }$ | $[{ 类型: 'damagePhysic', value: lvl  \cdot  0.4 + 3.1, str: 0.15 }]$ | combat |  |  |  |  |
| 火花 | <i class="mdi mdi-shimmer"></i> |  |  | needsMana | $9$ | ${ mana: 5 }$ | $[{ 类型: 'damageMagic', value: lvl  \cdot  0.55 + 3.65, int: 0.2 }]$ | combat | 10 |  |  |  |
| 急速 | <i class="mdi mdi-timer-sand"></i> | 急速+｛$lvl  \cdot  4 + 8$｝ |  |  |  |  |  |  | 20 |  |  |  |
| 精确 | <i class="mdi mdi-bullseye"></i> | 暴击率+｛$lvl  \cdot  0.03 + 0.07$｝ |  |  |  |  |  |  | 30 |  |  |  |
| 愤怒 | <i class="mdi mdi-emoticon-angry"></i> | 暴击伤害+｛$lvl  \cdot  0.08 + 0.3$｝ |  |  |  |  |  |  | 40 |  |  |  |
| 力量 | <i class="mdi mdi-arm-flex"></i> | 力量+｛$lvl  \cdot  3 + 5$｝ |  |  |  |  |  |  | 50 |  |  |  |
| 毒素 | <i class="mdi mdi-clouds"></i> |  |  |  | $135$ | ${}$ | $[{ 类型: 'maxdamageBio', value: lvl  \cdot  0.015 + 0.09 }, { 类型: 'removeAttack', value: lvl  \cdot  0.005 + 0.05 }]$ | combat | 60 |  |  |  |
| 智慧 | <i class="mdi mdi-lightbulb-on"></i> | 智力+｛$lvl  \cdot  3 + 5$｝ |  |  |  |  |  |  | 70 |  |  |  |
| 提取 | <i class="mdi mdi-water"></i> | 血液增益*｛$lvl  \cdot  0.04 + 1.16$｝ |  |  |  |  |  |  | 80 |  |  |  |
| 学习 | <i class="mdi mdi-school"></i> | 级技能点数+｛$1$｝ |  |  |  |  |  |  | 90 | true |  |  |
| 维持 | <i class="mdi mdi-iv-bag"></i> | 血液容量*｛$lvl  \cdot  0.06 + 1.24$｝ |  |  |  |  |  |  | 100 |  |  |  |
| 激励 | <i class="mdi mdi-battery"></i> |  | needsEnergy |  | $270$ | ${}$ | $[{ 类型: 'refillEnergy', value: 1 }]$ | combat | 110 | true |  |  |
| 自动化 | <i class="mdi mdi-cogs"></i> | 自动释放槽位+｛$1$｝ |  |  |  |  |  |  | 120 | true |  |  |
| 治愈 | <i class="mdi mdi-heart"></i> |  |  |  | $45$ | ${}$ | $[{ 类型: 'heal', value: 0.05, int: 0.0005 }, { 类型: '移除眩晕', value: null }]$ | combat | 130 | true | true |  |
| 二元性 | <i class="mdi mdi-call-split"></i> | 力量+｛$lvl  \cdot  2 + 4$｝; 智力+｛$lvl  \cdot  2 + 4$｝ |  |  |  |  |  |  | 75 |  |  | Chriz |
| 爱 | <i class="mdi mdi-heart-multiple"></i> |  |  |  | $70$ | ${}$ | $[{ 类型: 'damageBio', value: lvl  \cdot  0.9 + 8.7 }, { 类型: 'buff', value: lvl + 14, 效果: [{ 类型: ' \cdot ', name: '造成的生物伤害', value: 1.35 }] }]$ | combat | 120 |  |  | mina |
