| 名称  | 消耗  | 效果  |
| --- | --- | --- |
| 收银机 | ${ 铜币: {(lvl  \cdot  0.25 + 2)}^{lvl}  \cdot  2000 }$ | 柜台+｛$lvl$｝; 铜币容量*｛${(2)}^{lvl}$｝ |
| 装饰品 | ${ 铜币: {(1.75)}^{lvl}  \cdot  900 }$ | 铜币增益*｛${(1.175)}^{lvl}$｝ |
| 植物纤维仓 | ${ if (lvl === 0) { return {}; } return { 铜币: {(3)}^{lvl}  \cdot  100 }; }$ | 植物纤维增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; 绳子villageCraft｛$lvl >= 1$｝ |
| 木仓 | ${ 铜币: {(3)}^{lvl}  \cdot  200 }$ | 木头增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; 木板villageCraft｛$lvl >= 1$｝ |
| 石仓 | ${ 铜币: {(3)}^{lvl}  \cdot  500 }$ | 石头增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; 砖块villageCraft｛$lvl >= 1$｝ |
| 金属仓 | ${ 铜币: {(3)}^{lvl}  \cdot  50K }$ | 金属增益+｛$getSequence(1, lvl)  \cdot  0.075$｝; 螺丝villageCraft｛$lvl >= 1$｝ |
| 水仓 | ${ 铜币: {(3)}^{lvl}  \cdot  600K }$ | 水增益+｛$getSequence(1, lvl)  \cdot  0.06$｝; 水瓶villageCraft｛$lvl >= 1$｝ |
| 玻璃仓 | ${ 铜币: {(3)}^{lvl}  \cdot  14.5M }$ | 玻璃增益+｛$getSequence(1, lvl)  \cdot  0.05$｝; 鸡尾酒杯villageCraft｛$lvl >= 1$｝ |
| 硬木仓 | ${ 铜币: {(3)}^{lvl}  \cdot  900M }$ | 硬木增益+｛$getSequence(1, lvl)  \cdot  0.025$｝; 回旋镖villageCraft｛$lvl >= 1$｝ |
| 宝石仓 | ${ 铜币: {(3)}^{lvl}  \cdot  85B }$ | 宝石增益+｛$getSequence(1, lvl)  \cdot  0.025$｝; 抛光宝石villageCraft｛$lvl >= 1$｝ |
| 油仓 | ${ 铜币: {(3)}^{lvl}  \cdot  9.6T }$ | 油增益+｛$getSequence(1, lvl)  \cdot  0.015$｝; 油灯villageCraft｛$lvl >= 1$｝ |
| 大理石仓 | ${ 铜币: {(3)}^{lvl}  \cdot  1.44Qa }$ | 大理石增益+｛$getSequence(1, lvl)  \cdot  0.01$｝; 淋浴villageCraft｛$lvl >= 1$｝ |
