| 名称  | 类型  | raiseOtherCap | requirement | 消耗  | 效果  |
| --- | --- | ------------- | ----------- | --- | --- |
| 书籍铝淬火 | 书籍 | 铝淬火 | $store.state.升级成本.item.铝淬火.highestLevel >= 6$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  7) }$ | upgradeMiningAluminiumHardeningCap+｛$lvl$｝ |
| 书籍铝罐 | 书籍 | 铝罐 | $store.state.升级成本.item.铝罐.highestLevel >= 8$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  5) }$ | upgradeMiningAluminiumTanksCap+｛$lvl$｝ |
| 书籍炼油厂 | 书籍 | 精炼厂 | $store.state.升级成本.item.精炼厂.highestLevel >= 5$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  40) }$ | upgradeMiningRefineryCap+｛$lvl$｝ |
| 书籍熔炉 | 书籍 | 熔炉 | $store.state.升级成本.item.熔炉.highestLevel >= 25$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  60) }$ | upgradeMiningFurnaceCap+｛$lvl$｝ |
| 书籍铁扩张 | 书籍 | 铁扩张 | $store.state.升级成本.item.铁扩张.highestLevel >= 3$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  120) }$ | upgradeMiningIronExpansionCap+｛$lvl$｝ |
| 书籍磁铁 | 书籍 | 磁铁 | $store.state.升级成本.item.磁铁.highestLevel >= 10$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  160) }$ | upgradeMiningMagnetCap+｛$lvl$｝ |
| 书籍金属探测器 | 书籍 | 金属探测器 | $store.state.升级成本.item.金属探测器.highestLevel >= 12$ | ${ 书籍: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl + 5)  \cdot  250) }$ | upgradeMiningMetalDetectorCap+｛$lvl$｝ |
