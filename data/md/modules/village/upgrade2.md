| 名称  | subfeature | price | effect |
| --- | ---------- | ----- | ------ |
| 收银机 | 1 | ${ 铜币: {(lvl  \cdot  0.25 + 2)}^{lvl}  \cdot  2000 }$ | 柜台+｛$lvl$｝; 铜币容量*｛${(2)}^{lvl}$｝ |
| 装饰品 | 1 | ${ 铜币: {(1.75)}^{lvl}  \cdot  900 }$ | 铜币增益*｛${(1.175)}^{lvl}$｝ |
| 植物纤维仓 | 1 | ${ if (lvl === 0) { return {}; } return { 铜币: {(3)}^{lvl}  \cdot  100 }; }$ | 植物纤维增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; ropevillageCraft｛$lvl >= 1$｝ |
| 木仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  200 }$ | 木头增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; woodenPlanksvillageCraft｛$lvl >= 1$｝ |
| 石仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  500 }$ | 石头增益+｛$getSequence(1, lvl)  \cdot  0.1$｝; brickvillageCraft｛$lvl >= 1$｝ |
| 金属仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  50K }$ | 金属增益+｛$getSequence(1, lvl)  \cdot  0.075$｝; screwsvillageCraft｛$lvl >= 1$｝ |
| 水仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  600K }$ | 水增益+｛$getSequence(1, lvl)  \cdot  0.06$｝; waterBottlevillageCraft｛$lvl >= 1$｝ |
| 玻璃仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  14.5M }$ | 玻璃增益+｛$getSequence(1, lvl)  \cdot  0.05$｝; cocktailGlassvillageCraft｛$lvl >= 1$｝ |
| 硬木仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  900M }$ | 硬木增益+｛$getSequence(1, lvl)  \cdot  0.025$｝; boomerangvillageCraft｛$lvl >= 1$｝ |
| 宝石仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  85B }$ | 宝石增益+｛$getSequence(1, lvl)  \cdot  0.025$｝; polishedGemvillageCraft｛$lvl >= 1$｝ |
| 油仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  9.6T }$ | 油增益+｛$getSequence(1, lvl)  \cdot  0.015$｝; oilLampvillageCraft｛$lvl >= 1$｝ |
| 大理石仓 | 1 | ${ 铜币: {(3)}^{lvl}  \cdot  1.44Qa }$ | 大理石增益+｛$getSequence(1, lvl)  \cdot  0.01$｝; showervillageCraft｛$lvl >= 1$｝ |
