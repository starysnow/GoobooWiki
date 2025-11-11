| 名称  | type | cap | price | effect | requirementValue |
| --- | ---- | --- | ----- | ------ | ---------------- |
| 愤怒 | prestige | 10 | ${ 强大的灵魂: {(1.4)}^{lvl}  \cdot  60 }$ | 攻击*｛$lvl  \cdot  0.25 + 1$｝; 暴击率+｛$lvl  \cdot  0.01$｝ |  |
| 和平 | prestige | 10 | ${ 强大的灵魂: {(1.4)}^{lvl}  \cdot  60 }$ | 生命值*｛$lvl  \cdot  0.25 + 1$｝; 重生时间+｛$lvl  \cdot  -5$｝ |  |
| 牛奶 | prestige | 45 | ${ 强大的灵魂: {(1.45)}^{lvl}  \cdot  80 }$ | 骨头增益+｛${(2)}^{lvl}  \cdot  50$｝; 骨头增益*｛$lvl  \cdot  0.2 + 1$｝; 骨头容量*｛${(1.75)}^{lvl}$｝ |  |
| 屠夫 | prestige | 10 | ${ 强大的灵魂: {(1.55)}^{lvl}  \cdot  100 }$ | 怪物零件增益+｛$lvl  \cdot  0.05$｝; 怪物零件容量+｛$lvl  \cdot  30$｝; Boss要求+｛$lvl  \cdot  -1$｝ |  |
| 新手运气 | prestige | 120 | ${ 强大的灵魂: {(1.65)}^{lvl}  \cdot  375 }$ | 装备几率*｛$lvl  \cdot  0.2 + 1$｝; 腐败的灵魂增益*｛$lvl  \cdot  0.05 + 1$｝ | 26 |
| 平衡 | prestige |  | ${ 强大的灵魂: {(1.375)}^{lvl}  \cdot  1100 }$ | 攻击*｛${(1.12)}^{lvl}$｝; 生命值*｛${(1.12)}^{lvl}$｝ | 31 |
| 进阶运气 | prestige | 40 | ${ 强大的灵魂: {(1.65)}^{lvl}  \cdot  3250 }$ | 传家宝几率+｛$lvl  \cdot  0.0025$｝; 怀旧之情+｛$lvl  \cdot  5$｝ | 36 |
| 骨头商人 | prestige | 150 | ${ 强大的灵魂: {(1.45)}^{lvl}  \cdot  1.15e4 }$ | 骨头增益*｛${(1.3)}^{lvl}$｝; 怪物零件容量*｛${(1.1)}^{lvl}$｝ | 41 |
| 灵魂牢笼 | prestige | 80 | ${ 强大的灵魂: {(1.95)}^{lvl}  \cdot  4.5e4 }$ | 腐败的灵魂增益*｛$lvl  \cdot  0.04 + 1$｝; 腐败的灵魂容量*｛${(1.3)}^{lvl}  \cdot  (lvl  \cdot  0.1 + 1)$｝ | 46 |
| 胜利庆典 | prestige | 7 | ${ 强大的灵魂: {(1000)}^{lvl}  \cdot  7.5e4 }$ | 每次突袭生命值+｛$lvl >= 1 ? \text{向下取整}((lvl + 1) / 2)  \cdot  0.05 : null$｝; 每次突袭攻击+｛$lvl >= 2 ? \text{向下取整}(lvl / 2)  \cdot  0.05 : null$｝ | 48 |
| 进攻之书 | prestige | 50 | ${ 强大的灵魂: {(1.225)}^{lvl}  \cdot  2.25e5 }$ | 力量效果*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.15 + 1)$｝ | 51 |
| 防御之书 | prestige | 50 | ${ 强大的灵魂: {(1.225)}^{lvl}  \cdot  7.5e5 }$ | 韧效果*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.15 + 1)$｝ | 56 |
| 灰圈 | prestige |  | ${ 强大的灵魂: {(lvl  \cdot  0.015 + 1.2)}^{lvl}  \cdot  4e6 }$ | 腐败+｛$lvl  \cdot  -0.12$｝ | 61 |
| 遗愿 | prestige | 15 | ${ 强大的灵魂: {(lvl  \cdot  0.375 + 2.5)}^{lvl}  \cdot  3e7 }$ | 最大传家宝增益+｛$lvl$｝ | 66 |
| 蜡烛圈 | prestige |  | ${ 强大的灵魂: {(lvl  \cdot  0.0015 + 1.225)}^{lvl}  \cdot  6e8 }$ | 腐败的灵魂增益*｛${(1.02)}^{lvl}$｝; 重生时间+｛$lvl  \cdot  -5$｝ | 71 |
| 战利品 | prestige | 5 | ${ 强大的灵魂: {(1e4)}^{lvl}  \cdot  3e9 }$ | 每次突袭装备几率+｛$getSequence(1, lvl)  \cdot  0.05$｝ | 76 |
| 收容室 | prestige | 100 | ${ 强大的灵魂: {(1.225 + lvl  \cdot  0.0075)}^{lvl}  \cdot  2e10 }$ | 骨头容量*｛${(1.2)}^{lvl}$｝; 传家宝效果*｛$lvl  \cdot  0.03 + 1$｝ | 81 |
| 陵墓 | prestige | 80 | ${ 强大的灵魂: {(lvl  \cdot  0.00375 + 1.3)}^{lvl}  \cdot  2.4e11 }$ | 骨头增益*｛${(1.3)}^{lvl}$｝; 怪物零件增益*｛${(1.15)}^{lvl}$｝; 腐败的灵魂增益*｛${(1.05)}^{lvl}$｝ | 91 |
| 战斗研究 | prestige |  | ${ 强大的灵魂: {(1.35 + lvl  \cdot  0.02)}^{lvl}  \cdot  3.5e15 }$ | 精通点数增益*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.1 + 1)$｝ | 111 |
| 骨室 | prestige |  | ${ 强大的灵魂: {(2.3 + lvl  \cdot  0.04)}^{lvl}  \cdot  1.25e18 }$ | 骨头容量*｛${(2)}^{lvl}$｝ | 131 |
| 深仇大恨 | prestige | 30 | ${ 强大的灵魂: {(lvl  \cdot  0.015 + 1.45)}^{lvl}  \cdot  9e19 }$ | 攻击*｛${(1.06)}^{lvl}  \cdot  (lvl  \cdot  0.1 + 1)$｝; 生命值*｛${(1.03)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝ | 151 |
| 更多的假人 | prestige | 20 | ${ 强大的灵魂: {(lvl  \cdot  0.3 + 6)}^{lvl}  \cdot  9e21 }$ | upgradeHordeTargetDummyCap+｛$lvl  \cdot  5$｝ | 171 |
| 精神诱惑 | prestige | 50 | ${ 强大的灵魂: {(1.18)}^{lvl}  \cdot  3.33e24 }$ | 腐败的灵魂增益*｛$lvl  \cdot  0.06 + 1$｝ | 191 |
| 神秘的电容器 | prestige | 25 | ${ 强大的灵魂: {(lvl  \cdot  0.075 + 1.75)}^{lvl}  \cdot  1.5e28 }$ | 神秘碎片容量+｛$lvl  \cdot  2$｝ | 211 |
| 秘密训练 | prestige | 20 | ${ 强大的灵魂: {(lvl  \cdot  0.0225 + 1.6)}^{lvl}  \cdot  2.2e30 }$ | 攻击*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.2 + 1)$｝; 生命值*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.2 + 1)$｝ | 241 |
| 秘密存储 | prestige | 30 | ${ 强大的灵魂: {(lvl  \cdot  0.015 + 1.5)}^{lvl}  \cdot  6.3e32 }$ | 骨头容量*｛${(1.75)}^{lvl}$｝; 怪物零件容量*｛${(1.15)}^{lvl}$｝; 神秘碎片容量+｛$lvl$｝ | 271 |
| 探路者 | prestige | 50 | ${ 强大的灵魂: {(lvl  \cdot  0.0075 + 1.375)}^{lvl}  \cdot  1.15e35 }$ | 神秘碎片几率*｛${(1.2)}^{lvl}$｝ | 301 |
| 外骨骼 | prestige | 25 | ${ 强大的灵魂: {(1.85 + lvl  \cdot  0.075)}^{lvl}  \cdot  5.1e38 }$ | 攻击*｛${(1.1)}^{lvl}$｝; 生命值*｛${(1.1)}^{lvl}$｝; 骨头增益*｛${(1.25)}^{lvl}$｝ | 331 |
| 精华收集器 | prestige | 50 | ${ 强大的灵魂: {(lvl  \cdot  0.12 + 1.4)}^{lvl}  \cdot  1.85e41 }$ | 精华增益*｛${(1.2)}^{lvl}$｝ | 361 |
| 皇家宝剑 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  10) }$ | 每次突袭攻击+｛$lvl  \cdot  0.01$｝; 攻击*｛${(1.05)}^{lvl}  \cdot  (0.1  \cdot  lvl + 1)$｝ | 140 |
| 皇家盔甲 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  14) }$ | 每次突袭生命值+｛$lvl  \cdot  0.01$｝; 生命值*｛${(1.05)}^{lvl}  \cdot  (0.1  \cdot  lvl + 1)$｝ |  |
| 皇家存储 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  28) }$ | 每次突袭骨头增益+｛$lvl  \cdot  0.01$｝; 骨头增益*｛${(1.05)}^{lvl}  \cdot  (0.1  \cdot  lvl + 1)$｝; 骨头容量*｛${(1.05)}^{lvl}  \cdot  (0.1  \cdot  lvl + 1)$｝ |  |
| 皇家屠夫 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  55) }$ | 每次突袭怪物零件增益+｛$lvl  \cdot  0.005$｝; 怪物零件增益*｛${(1.05)}^{lvl}  \cdot  (0.05  \cdot  lvl + 1)$｝ |  |
| 皇家墓穴 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  111) }$ | 每次突袭腐化的灵魂增益+｛$getDiminishing(lvl)  \cdot  0.001$｝; 腐败的灵魂增益*｛$getSequence(5, lvl)  \cdot  0.01 + 1$｝; 腐败的灵魂容量*｛$getSequence(5, lvl)  \cdot  0.01 + 1$｝ |  |
| 皇家秘密 | prestige |  | ${ 王冠: \text{四舍五入}({(1.08)}^{lvl}  \cdot  (lvl + 1)  \cdot  222) }$ | 神秘碎片几率*｛${(1.05)}^{lvl}  \cdot  (0.1  \cdot  lvl + 1)$｝; 神秘碎片容量+｛$lvl  \cdot  2$｝ |  |
| 皇家祝福 | prestige | 6 | ${ 王冠: \text{四舍五入}({(2)}^{lvl}  \cdot  1000) }$ | 祝福的剑装备解锁｛$lvl >= 1$｝; 祝福的护甲装备解锁｛$lvl >= 2$｝; 祝福的弓装备解锁｛$lvl >= 3$｝; 祝福的火装备解锁｛$lvl >= 4$｝; 祝福的水装备解锁｛$lvl >= 5$｝; 祝福的盾装备解锁｛$lvl >= 6$｝ |  |
| 精确 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.01 + 1.55)}^{lvl}  \cdot  1000 }$ | 攻击*｛${(1.15)}^{lvl}$｝ |  |
| 解救 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.01 + 1.55)}^{lvl}  \cdot  1250 }$ | 生命值*｛${(1.15)}^{lvl}$｝ |  |
| 决心 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.02 + 2.35)}^{lvl}  \cdot  6000 }$ | 腐败的灵魂增益*｛${(1.05)}^{lvl}$｝; 勇敢增益*｛${(1.1)}^{lvl}$｝ | 7 |
| 教育 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.01 + 1.6)}^{lvl}  \cdot  1.1e4 }$ | 等级时间*｛${(1 / 1.1)}^{lvl}$｝ | 10 |
| 血室 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.05 + 2.5)}^{lvl}  \cdot  1.6e4 }$ | 骨头容量*｛${(1.75)}^{lvl}$｝; 血液容量*｛${(2.25)}^{lvl}$｝ | 12 |
| 石肤 | prestige | 30 | ${ 勇敢: {(lvl  \cdot  0.5 + 5)}^{lvl}  \cdot  7e4 }$ | 生命值*｛${(1.2)}^{lvl}$｝; 血液容量*｛${(1.5)}^{lvl}$｝ | 16 |
| 大学 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.02 + 1.85)}^{lvl}  \cdot  2.5e5 }$ | 等级增量*｛${(1 / 1.05)}^{lvl} / (lvl  \cdot  0.05 + 1)$｝ | 20 |
| 发现 | prestige | 40 | ${ 勇敢: {(lvl  \cdot  0.25 + 4)}^{lvl}  \cdot  5e6 }$ | 腐败的灵魂容量*｛${(lvl  \cdot  0.01 + 1.4)}^{lvl}$｝; 最大传家宝增益+｛$lvl$｝; 饰品最大增益*｛$lvl  \cdot  0.1 + 1$｝ | 27 |
| 心灵专注 | prestige | 30 | ${ 勇敢: {(lvl  \cdot  0.5 + 2)}^{lvl}  \cdot  2.8e7 }$ | 攻击*｛${(1.2)}^{lvl}$｝; 血液容量*｛${(1.5)}^{lvl}$｝ | 33 |
| 清洗 | prestige |  | ${ 勇敢: {(lvl  \cdot  0.015 + 1.25)}^{lvl}  \cdot  1.5e11 }$ | 腐败+｛$lvl  \cdot  -0.09$｝ | 45 |
| 防御姿态 | prestige | 20 | ${ 勇敢: {(lvl  \cdot  0.1 + 2.25)}^{lvl}  \cdot  6e12 }$ | 生命值*｛${(1.16)}^{lvl}$｝; 腐败的灵魂增益*｛${(1.1)}^{lvl}$｝; 勇敢增益*｛$lvl  \cdot  0.1 + 1$｝ | 53 |
| 混沌箱 | prestige | 10 | ${ 勇敢: {(10)}^{lvl}  \cdot  1e14 }$ | 攻击*｛${(1.35)}^{lvl}$｝; 装备几率*｛$lvl >= 1 ? \text{向下取整}((lvl + 4) / 5)  \cdot  0.5 + 1 : null$｝; 最大传家宝增益+｛$lvl >= 2 ? \text{向下取整}((lvl + 3) / 5)  \cdot  5 : null$｝; 精通点数增益*｛$lvl >= 3 ? \text{向下取整}((lvl + 2) / 5)  \cdot  0.5 + 1 : null$｝; 神秘碎片容量+｛$lvl >= 4 ? \text{向下取整}((lvl + 1) / 5)  \cdot  10 : null$｝; 级技能点数+｛$lvl >= 5 ? \text{向下取整}(lvl / 5) : null$｝ | 65 |
| 极限突破 | prestige | 25 | ${ 勇敢: {(lvl  \cdot  0.1 + 1.65)}^{lvl}  \cdot  7.75e15 }$ | 腐败的灵魂增益*｛${(1.05)}^{lvl}$｝; 勇敢增益*｛${(1.05)}^{lvl}$｝; 骨头容量*｛${(1.35)}^{lvl}$｝; 血液容量*｛${(1.5)}^{lvl}$｝ | 85 |
| 猎头者 | prestige | 10 | ${ 勇敢: {(lvl  \cdot  0.85 + 2.75)}^{lvl}  \cdot  2.25e17 }$ | 锋利的怪物牙齿增益+｛$lvl  \cdot  0.015$｝; 神秘碎片容量+｛$lvl  \cdot  5$｝ | 113 |
| 寺庙探索 | prestige | 10 | ${ 勇敢: {(lvl  \cdot  0.85 + 2.75)}^{lvl}  \cdot  1.6e19 }$ | 苔藓怪物牙齿增益+｛$lvl  \cdot  0.015$｝; 传家宝效果*｛$lvl  \cdot  0.02 + 1$｝ | 130 |
