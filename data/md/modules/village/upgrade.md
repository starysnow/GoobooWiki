| 名称  | 上限  | capMult | requirement | 消耗  | 效果  |
| --- | --- | ------- | ----------- | --- | --- |
| 钱包 | 12 | true | $store.state.解锁.金币升级.use$ | ${ 金币: \text{向上取整}({(1.3)}^{lvl}  \cdot  200) }$ | 金币容量+｛$lvl  \cdot  150$｝ |
| 资源包 | 10 | true | $store.state.解锁.金币升级.use$ | ${ 金币: \text{向上取整}({(1.4)}^{lvl}  \cdot  200) }$ | 植物纤维容量+｛$lvl  \cdot  200$｝; 木头容量+｛$lvl  \cdot  200$｝; 石头容量+｛$lvl  \cdot  200$｝ |
| 金属包 | 5 | true | $store.state.解锁.金币升级.use$ | ${ 金币: \text{向上取整}({(1.7)}^{lvl}  \cdot  300) }$ | 金属容量+｛$lvl  \cdot  400$｝ |
| 镰刀 | 20 |  | $store.state.解锁.镰刀升级.use$ | ${ 金币: \text{向上取整}({(1.55)}^{lvl}  \cdot  2500) }$ | 植物纤维增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝; 仅粮食增益*｛${(1.08)}^{lvl}$｝ |
| 柴刀 | 20 |  | $store.state.解锁.斧头升级.use$ | ${ 金币: \text{向上取整}({(1.55)}^{lvl}  \cdot  5000) }$ | 木头增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝; 水果增益*｛${(1.08)}^{lvl}$｝ |
| 镐子 | 20 |  | $store.state.解锁.镐子升级.use$ | ${ 金币: \text{向上取整}({(1.55)}^{lvl}  \cdot  7500) }$ | 石头增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝; 金属增益*｛${(1.04)}^{lvl}  \cdot  (lvl  \cdot  0.04 + 1)$｝ |
| 喷壶 | 20 |  | $store.state.解锁.浇水器可以升级.use$ | ${ 金币: \text{向上取整}({(1.55)}^{lvl}  \cdot  10K) }$ | 仅粮食增益*｛${(1.05)}^{lvl}$｝; 水果增益*｛${(1.05)}^{lvl}$｝; 水增益*｛${(1.22)}^{lvl}$｝ |
| 投资 | 50 |  | $store.state.解锁.投资升级.use$ | ${ 金币: \text{向上取整}({(1.35)}^{lvl}  \cdot  12.5K) }$ | 税率*｛${(1.05)}^{lvl}$｝; 金币增益*｛${(1.11)}^{lvl}$｝ |
| 基础 | 20 |  | $store.state.解锁.基础升级.use$ | ${ 知识: 12  \cdot  lvl + 80 }$ | 植物纤维增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.15 + 1)$｝; 木头增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝; 石头增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝ |
| 加工 | 20 |  | $store.state.解锁.加工升级.use$ | ${ 知识: 12  \cdot  lvl + 120 }$ | 食物增益*｛${(1.07)}^{lvl}$｝; 金属增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝ |
| 水泵 | 20 |  | $store.state.解锁.水泵升级.use$ | ${ 知识: 12  \cdot  lvl + 160 }$ | 水增益*｛${(1.2)}^{lvl}  \cdot  (lvl  \cdot  0.04 + 1)$｝ |
| 沙子 | 20 |  | $store.state.解锁.沙子升级.use$ | ${ 知识: 12  \cdot  lvl + 200 }$ | 玻璃增益*｛${(1.08)}^{lvl}  \cdot  (lvl  \cdot  0.08 + 1)$｝ |
| 书籍 | 20 |  | $store.state.解锁.书籍升级.use$ | ${ 知识: 12  \cdot  lvl + 240 }$ | 知识增益*｛$lvl  \cdot  0.04 + 1$｝ |
| 斧子 | 40 |  | $store.state.解锁.斧子升级.use$ | ${ 金币: \text{向上取整}({(1.3)}^{lvl}  \cdot  500K) }$ | 木头增益*｛$lvl  \cdot  0.05 + 1$｝; 硬木增益*｛$lvl  \cdot  0.05 + 1$｝ |
| 炸弹 | 40 |  | $store.state.解锁.炸弹升级.use$ | ${ 金币: \text{向上取整}({(1.3)}^{lvl}  \cdot  1.5M) }$ | 石头增益*｛$lvl  \cdot  0.05 + 1$｝; 宝石增益*｛$lvl  \cdot  0.05 + 1$｝ |
| 收费 | 40 |  | $store.state.解锁.收费升级.use$ | ${ 金币: \text{向上取整}({(1.3)}^{lvl}  \cdot  4M) }$ | 税率*｛$lvl  \cdot  0.05 + 1$｝ |
| 鱼竿 | 40 |  | $store.state.解锁.鱼竿升级.use$ | ${ 金币: \text{向上取整}({(1.3)}^{lvl}  \cdot  10M) }$ | 鱼增益*｛$lvl  \cdot  0.1 + 1$｝ |
| 圣书 | 40 |  | $store.state.解锁.圣书升级.use$ | ${ 金币: \text{向上取整}({(1.45)}^{lvl}  \cdot  22.5M) }$ | 信仰容量+｛$lvl  \cdot  8$｝ |
| 突破 | 50 |  | $store.state.解锁.突破升级.use$ | ${ 科学: \text{四舍五入}({(1.05)}^{Math.max(lvl - 25, 0})  \cdot  lvl  \cdot  10 + 20) }$ | 知识容量+｛$lvl  \cdot  5$｝; 科学容量+｛$lvl  \cdot  2$｝ |
| 改良植物 | 10 |  | $store.state.解锁.改造植物升级.use$ | ${ 科学: lvl  \cdot  15 + 30 }$ | 植物纤维增益*｛$lvl  \cdot  0.1 + 1$｝; 仅粮食增益*｛$lvl  \cdot  0.05 + 1$｝; 水果增益*｛$lvl  \cdot  0.05 + 1$｝; 仅蔬菜增益*｛$lvl  \cdot  0.05 + 1$｝ |
| 多巴胺 | 15 |  | $store.state.解锁.多巴胺升级.use$ | ${ 科学: lvl  \cdot  15 + 40 }$ | 幸福+｛$lvl  \cdot  0.002$｝; 快乐容量+｛$lvl  \cdot  50$｝ |
| 肾上腺素 | 15 |  | $store.state.解锁.肾上腺素升级.use$ | ${ 科学: lvl  \cdot  15 + 50 }$ | 硬木增益*｛$lvl  \cdot  0.05 + 1$｝; 宝石增益*｛$lvl  \cdot  0.05 + 1$｝; 鱼增益*｛$lvl  \cdot  0.05 + 1$｝ |
| 洒水装置 | 15 |  | $store.state.解锁.喷头升级.use$ | ${ 金币: \text{向上取整}({(1.65)}^{lvl}  \cdot  2T) }$ | 植物纤维增益*｛$lvl  \cdot  0.05 + 1$｝; 仅粮食增益*｛${(1.2)}^{lvl}$｝; 水果增益*｛${(1.2)}^{lvl}$｝; 仅蔬菜增益*｛${(1.1)}^{lvl}$｝ |
| 贪婪 | 15 |  | $store.state.解锁.贪婪升级.use$ | ${ 知识: lvl  \cdot  160 + 2200, 科学: lvl  \cdot  45 + 500 }$ | 税率*｛${(1.4)}^{lvl}$｝; 金币增益*｛${(1.1)}^{lvl}$｝; 污染+｛$lvl$｝ |
| 野心 |  |  | $store.state.解锁.野心升级.use$ | ${ 常见战利品: \text{向上取整}({(1.15)}^{lvl}  \cdot  (lvl  \cdot  2 + 6)) }$ | 战利品增益*｛$lvl  \cdot  0.01 + 1$｝; 战利品品质+｛$lvl  \cdot  3$｝ |
| 理解 | 20 |  | $store.state.解锁.认知升级.use$ | ${ 常见战利品: \text{向上取整}({(1.2)}^{lvl}  \cdot  55) }$ | 知识容量*｛$lvl  \cdot  0.1 + 1$｝; 科学容量*｛$lvl  \cdot  0.05 + 1$｝ |
| 好奇心 |  |  | $store.state.解锁.好奇心升级.use$ | ${ 罕见的战利品: \text{向上取整}({(1.15)}^{lvl}  \cdot  (lvl + 4)) }$ | 战利品增益*｛$lvl  \cdot  0.1 + 1$｝ |
| 崇拜 | 20 |  | $store.state.解锁.崇拜升级.use$ | ${ 罕见的战利品: \text{向上取整}({(1.18)}^{lvl}  \cdot  55) }$ | 信仰容量*｛$getSequence(2, lvl)  \cdot  0.1 + 1$｝ |
| 物物交换 |  |  | $store.state.解锁.易货升级.use$ | ${ 稀有战利品: \text{向上取整}({(1.15)}^{lvl}  \cdot  (lvl + 2.5)) }$ | 战利品品质+｛$lvl$｝; 金币增益*｛${(1.08)}^{lvl}$｝ |
| 火花 | 20 |  | $store.state.解锁.火花升级.use$ | ${ 稀有战利品: \text{向上取整}({(1.16)}^{lvl}  \cdot  55) }$ | 力量+｛$lvl$｝ |
