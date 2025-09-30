| 名称  | 类型  | 消耗  | 效果  | requirement | 上限  |
| --- | --- | --- | --- | ----------- | --- |
| 漂亮的颜色 | 高级 | ${ 红宝石:   \cdot  {(2)}^{\text{向下取整}(lvl / 2})  \cdot  100 }$ | 美丽增益*｛${(2)}^{lvl}$｝ |  |  |
| 漂亮的转换器 | 高级 | ${ 红宝石:   \cdot  {(2)}^{\text{向下取整}(lvl / 2})  \cdot  150 }$ | 转换器增益*｛$getSequence(2, lvl)  \cdot  0.25 + 1$｝; 转换器容量*｛$getSequence(2, lvl)  \cdot  0.25 + 1$｝ | $store.state.解锁.转换.see$ |  |
| 漂亮的零钱 | 高级 | ${ 红宝石:   \cdot  {(2)}^{\text{向下取整}(lvl / 2})  \cdot  180 }$ | 现金增益*｛$lvl  \cdot  0.25 + 1$｝ | $store.state.解锁.拍卖.see$ |  |
| 漂亮的形状 | 高级 | ${ 红宝石:   \cdot  {(2)}^{\text{向下取整}(lvl / 2})  \cdot  225 }$ | 形状增益*｛$getSequence(2, lvl)  \cdot  0.5 + 1$｝ | $store.state.解锁.形状.see$ |  |
| 漂亮的画布 | 高级 | ${ 红宝石:   \cdot  {(2)}^{\text{向下取整}(lvl / 2})  \cdot  320 }$ | 画布速度*｛$getSequence(2, lvl)  \cdot  0.1 + 1$｝ | $store.state.解锁.画布.see$ |  |
| 漂亮的红色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  750 }$ | 红色增益*｛${(4)}^{lvl}$｝; 红色鼓几率*｛${(1.25)}^{lvl}$｝; 红色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.红色鼓.总计 > 0$ | 1 |
| 漂亮的橙色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  1050 }$ | 橙色增益*｛${(4)}^{lvl}$｝; 橙色鼓几率*｛${(1.25)}^{lvl}$｝; 橙色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.橙色鼓.总计 > 0$ | 1 |
| 漂亮的黄色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  1400 }$ | 黄色增益*｛${(4)}^{lvl}$｝; 黄色鼓几率*｛${(1.25)}^{lvl}$｝; 黄色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.黄色鼓.总计 > 0$ | 1 |
| 漂亮的绿色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  2000 }$ | 绿色增益*｛${(4)}^{lvl}$｝; 绿色鼓几率*｛${(1.25)}^{lvl}$｝; 绿色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.绿色鼓.总计 > 0$ | 1 |
| 漂亮的蓝色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  2875 }$ | currencyGalleryBlueGain*｛${(4)}^{lvl}$｝; 蓝色鼓几率*｛${(1.25)}^{lvl}$｝; 蓝色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.蓝色鼓.总计 > 0$ | 1 |
| 漂亮的紫色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  3900 }$ | 紫色增益*｛${(4)}^{lvl}$｝; 紫色鼓几率*｛${(1.25)}^{lvl}$｝; 紫色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.紫色鼓.总计 > 0$ | 1 |
| 漂亮的红橙色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  5200 }$ | currencyGalleryDeep-orangeGain*｛${(4)}^{lvl}$｝; 橙红鼓几率*｛${(1.25)}^{lvl}$｝; currencyGalleryDeep-orangeDrumCap*｛${(2)}^{lvl}$｝ | $store.state.stat['gallery_deep-橙色鼓'].总计 > 0$ | 1 |
| 漂亮的金色 | 高级 | ${ 红宝石: {(2)}^{lvl}  \cdot  6750 }$ | 金色增益*｛${(4)}^{lvl}$｝; 金色鼓几率*｛${(1.25)}^{lvl}$｝; 金色鼓容量*｛${(2)}^{lvl}$｝ | $store.state.stat.金色鼓.总计 > 0$ | 1 |
