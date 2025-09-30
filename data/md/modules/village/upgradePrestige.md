| 名称  | 类型  | 消耗  | 效果  | name | feature | 上限  | requirement | raiseOtherCap |
| --- | --- | --- | --- | ---- | ------- | --- | ----------- | ------------- |
| 方舟 | 声望 | ${ 祝福: {(1.35)}^{lvl}  \cdot  50 }$ | 工人+｛$lvl  \cdot  2$｝ |  |  |  |  |  |
| 圣草 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  50 }$ | 植物纤维增益*｛$lvl  \cdot  0.2 + 1$｝; 植物纤维容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 圣树 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  50 }$ | 木头增益*｛$lvl  \cdot  0.2 + 1$｝; 木头容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 圣石 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  50 }$ | 石头增益*｛$lvl  \cdot  0.2 + 1$｝; 石头容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 神圣金属 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  70 }$ | 金属增益*｛$lvl  \cdot  0.2 + 1$｝; 金属容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 教会税 | 声望 | ${ 祝福: {(1.85)}^{lvl}  \cdot  80 }$ | 税率*｛${(1.1)}^{lvl}$｝ |  |  |  |  |  |
| 圣水 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  90 }$ | 水增益*｛$lvl  \cdot  0.2 + 1$｝; 水容量*｛${(1.25)}^{lvl}$｝ | 圣水 | 村庄 |  |  |  |
| 神圣玻璃 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  100 }$ | 玻璃增益*｛$lvl  \cdot  0.2 + 1$｝; 玻璃容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 圣鹤 | 声望 | ${ 祝福: {(2.15)}^{lvl}  \cdot  125 }$ | 建造速度+｛$lvl$｝; 建造速度*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 僧侣 | 声望 | ${ 祝福: {(1.85)}^{lvl}  \cdot  150 }$ | 知识增益*｛$lvl  \cdot  0.2 + 1$｝; 知识容量+｛$lvl  \cdot  10$｝ |  |  |  |  |  |
| 神圣的存钱罐 | 声望 | ${ 祝福: {(2.3)}^{lvl}  \cdot  200 }$ | 金币容量*｛${(1.25)}^{lvl}$｝ |  |  |  |  |  |
| 深深的崇拜 | 声望 | ${ 祝福: {(2.75)}^{lvl}  \cdot  250 }$ | 信仰容量*｛${(1.5)}^{lvl}$｝ |  |  |  |  |  |
| 城市规划 | 声望 | ${ 祝福: {(3.2)}^{lvl}  \cdot  1750 }$ | 住房最高等级+｛$lvl  \cdot  5$｝ |  |  | 5 | $store.state.解锁.层$ |  |
| 经理人 | 声望 | ${ 祝福: {(3.2)}^{lvl}  \cdot  2100 }$ | 工作站最高等级+｛$lvl  \cdot  2$｝ |  |  | 5 | $store.state.解锁.层$ |  |
| 仓库 | 声望 | ${ 祝福: {(3.3)}^{lvl}  \cdot  1300 }$ | 存储保留｛$lvl >= 1$｝; 锻造保留｛$lvl >= 2$｝; 保险箱保留｛$lvl >= 3$｝; 水族馆保留｛$lvl >= 4$｝; 知识塔保留｛$lvl >= 5$｝; 大存储空间保留｛$lvl >= 6$｝ |  |  | 6 | $store.state.解锁.层$ |  |
| 砂岩 | 声望 | ${ 祝福: {(2.25)}^{lvl}  \cdot  1500 }$ | upgradeVillageObeliskCap+｛$lvl$｝ |  |  | 10 | $store.state.解锁.层$ | 方尖碑 |
| 神圣森林 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  1800 }$ | 硬木增益*｛$lvl  \cdot  0.2 + 1$｝; 硬木容量*｛${(1.25)}^{lvl}$｝ |  |  |  | $store.state.解锁.层$ |  |
| 神圣宝石 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  1800 }$ | 宝石增益*｛$lvl  \cdot  0.2 + 1$｝; 宝石容量*｛${(1.25)}^{lvl}$｝ |  |  |  | $store.state.解锁.层$ |  |
| 更深层次的敬拜 | 声望 | ${ 祝福: {(lvl  \cdot  0.15 + 1.75)}^{lvl}  \cdot  40K }$ | 信仰容量+｛$lvl  \cdot  20$｝; 信仰容量*｛${(1.3)}^{lvl}$｝ |  |  |  | $store.state.解锁.层$ |  |
| 神圣实验室 | 声望 | ${ 祝福: {(1.85)}^{lvl}  \cdot  70K }$ | 科学增益*｛$lvl  \cdot  0.2 + 1$｝; 科学容量+｛$lvl  \cdot  10$｝ |  |  |  | $store.state.解锁.层$ |  |
| 慈善机构 | 声望 | ${ 祝福: {(2.35)}^{lvl}  \cdot  120K }$ | 快乐增益*｛$lvl  \cdot  0.2 + 1$｝; 幸福+｛$lvl  \cdot  0.01$｝ |  |  |  | $store.state.解锁.层$ |  |
| 圣油 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  75M }$ | 油增益*｛$lvl  \cdot  0.2 + 1$｝; 油容量*｛${(1.25)}^{lvl}$｝ |  |  |  | $store.state.解锁.层$ |  |
| 神圣大理石 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  110M }$ | 大理石增益*｛$lvl  \cdot  0.2 + 1$｝; 大理石容量*｛${(1.25)}^{lvl}$｝ |  |  |  | $store.state.解锁.层$ |  |
| 平静的演讲 | 声望 | ${ 祝福: {(0.08  \cdot  lvl + 1.8)}^{lvl}  \cdot  150M }$ | 污染耐受性+｛$lvl$｝ |  |  |  | $store.state.解锁.层$ |  |
| 神圣战利品 | 声望 | ${ 祝福: {(1.65)}^{lvl}  \cdot  800M }$ | 战利品增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.1 + 1)$｝ |  |  |  | $store.state.解锁.层$ |  |
| 神圣凿子 | 声望 | ${ 祝福: {(0.05  \cdot  lvl + 1.5)}^{lvl}  \cdot  2.5B }$ | 战利品品质+｛$lvl  \cdot  2$｝ |  |  |  | $store.state.解锁.层$ |  |
| 雇佣工匠 | 声望 | ${ 股票: {(10)}^{getSequence(1, lvl})  \cdot  10 }$ | 工匠+｛$lvl$｝ |  |  |  | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 雇佣工人 | 声望 | ${ 股票: {(lvl  \cdot  0.02 + 1.65)}^{lvl}  \cdot  5 }$ | 材料增益*｛${(1.05)}^{lvl}  \cdot  (lvl  \cdot  0.05 + 1)$｝ |  |  |  | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 雇佣会计师 | 声望 | ${ 股票: {(1.9)}^{lvl}  \cdot  8 }$ | 铜币容量*｛${(1.75)}^{lvl}$｝ |  |  |  | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 配方书 | 声望 | ${ 股票: {(2.5)}^{lvl}  \cdot  60 }$ | 箭头villageCraft｛$lvl >= 1$｝; 碗villageCraft｛$lvl >= 2$｝; 小宝箱villageCraft｛$lvl >= 3$｝; 链villageCraft｛$lvl >= 4$｝; 矛villageCraft｛$lvl >= 5$｝; 金戒指villageCraft｛$lvl >= 6$｝ |  |  | 6 | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 广告活动 | 声望 | ${ 股票: {(lvl  \cdot  0.05 + 1.9)}^{lvl}  \cdot  80 }$ | 铜币增益*｛${(1.1)}^{lvl}  \cdot  (lvl  \cdot  0.2 + 1)$｝ |  |  |  | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 雇佣探险家 | 声望 | ${ 股票: {(15)}^{getSequence(1, lvl})  \cdot  575 }$ | 特殊成分解锁｛$lvl >= 1$｝; 可找到的成分+｛$lvl > 1 ? lvl - 1 : null$｝; 成分每个箱子+｛$lvl > 1 ? 4  \cdot  (lvl - 1) : null$｝; 毒箭villageCraft｛$lvl >= 1$｝; 冰霜长矛villageCraft｛$lvl >= 2$｝; 麻辣汤villageCraft｛$lvl >= 3$｝; 秒表villageCraft｛$lvl >= 4$｝; 收到3成分盒子text｛$lvl$｝ |  |  | 4 | $store.state.解锁.villageCraftingSubfeature.see$ |  |
| 雇佣园丁 | 声望 | ${ 股票: {(1.75)}^{lvl}  \cdot  140 }$ | 植物纤维增益*｛$lvl  \cdot  0.1 + 1$｝; 木头增益*｛$lvl  \cdot  0.1 + 1$｝; 植物纤维容量*｛${(1.2)}^{lvl}$｝; 木头容量*｛${(1.2)}^{lvl}$｝ |  |  |  | $store.state.升级成本.item.木仓.highestLevel >= 1$ |  |
| 雇佣矿工 | 声望 | ${ 股票: {(1.75)}^{lvl}  \cdot  220 }$ | 石头增益*｛$lvl  \cdot  0.1 + 1$｝; 金属增益*｛$lvl  \cdot  0.1 + 1$｝; 石头容量*｛${(1.2)}^{lvl}$｝; 金属容量*｛${(1.2)}^{lvl}$｝ |  |  |  | $store.state.升级成本.item.金属仓.highestLevel >= 1$ |  |
| 雇佣调酒师 | 声望 | ${ 股票: {(1.75)}^{lvl}  \cdot  335 }$ | 水增益*｛$lvl  \cdot  0.1 + 1$｝; 玻璃增益*｛$lvl  \cdot  0.1 + 1$｝; 水容量*｛${(1.2)}^{lvl}$｝; 玻璃容量*｛${(1.2)}^{lvl}$｝ |  |  |  | $store.state.升级成本.item.玻璃仓.highestLevel >= 1$ |  |
| 雇佣专家 | 声望 | ${ 股票: {(1.75)}^{lvl}  \cdot  520 }$ | 硬木增益*｛$lvl  \cdot  0.1 + 1$｝; 宝石增益*｛$lvl  \cdot  0.1 + 1$｝; 硬木容量*｛${(1.2)}^{lvl}$｝; 宝石容量*｛${(1.2)}^{lvl}$｝ |  |  |  | $store.state.升级成本.item.宝石仓.highestLevel >= 1$ |  |
