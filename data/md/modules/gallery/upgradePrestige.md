| 名称  | 消耗  | 效果  | 上限  |
| --- | --- | --- | --- |
| 艺术学院 | ${ 现金: {(lvl  \cdot  0.01 + 1.65)}^{lvl}  \cdot  2 }$ | 美丽增益*｛${(1.3)}^{lvl}$｝ |  |
| 红色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  8 }$ | 红色增益*｛${(1.5)}^{lvl}$｝ | 15 |
| 彩虹罐 | ${ 现金: fallbackArray([10, 100], {(1000)}^{lvl - 1}  \cdot  10, lvl) }$ | 雕刻南瓜galleryIdea｛$lvl >= 1$｝; 制作柠檬水galleryIdea｛$lvl >= 2$｝; 种一棵树galleryIdea｛$lvl >= 3$｝; 画海洋galleryIdea｛$lvl >= 4$｝; 酿酒galleryIdea｛$lvl >= 5$｝; 收获橙子galleryIdea｛$lvl >= 6$｝; 粉碎黄金galleryIdea｛$lvl >= 7$｝; 割草galleryIdea｛$lvl >= 8$｝; 形状粘土galleryIdea｛$lvl >= 9$｝; 看看天空galleryIdea｛$lvl >= 10$｝; 嚼泡泡糖galleryIdea｛$lvl >= 11$｝ | 11 |
| 垃圾箱 | ${ 现金: {(2)}^{lvl}  \cdot  25 }$ | 转换器容量+｛$lvl  \cdot  500$｝ | 8 |
| 橙色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  30 }$ | 橙色增益*｛${(1.5)}^{lvl}$｝ | 20 |
| 形状 | ${ 现金: {(3 + lvl)}^{lvl}  \cdot  150 }$ | 形状解锁｛$lvl >= 1$｝; 矩形形状｛$lvl >= 2$｝; 三角形形状｛$lvl >= 3$｝; 星形形状｛$lvl >= 4$｝; 椭圆形形状｛$lvl >= 5$｝; 心形形状｛$lvl >= 6$｝; 正方形形状｛$lvl >= 7$｝; 八边形形状｛$lvl >= 8$｝; 五边形形状｛$lvl >= 9$｝; 六边形形状｛$lvl >= 10$｝ | 10 |
| 叉车 | ${ 现金: {(3)}^{lvl}  \cdot  150 }$ | 包裹容量+｛$lvl  \cdot  10$｝ | 9 |
| 红色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  360 }$ | 红色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 黄色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  725 }$ | 黄色增益*｛${(1.5)}^{lvl}$｝ | 25 |
| 励志书籍 | ${ 现金: {(2 + 0.25  \cdot  lvl)}^{lvl}  \cdot  1400 }$ | 灵感时间基数*｛${(0.8)}^{lvl}$｝; 灵感时间增量*｛${(0.95)}^{lvl}$｝ |  |
| 快递 | ${ 现金: {(2.5 + 0.25  \cdot  lvl)}^{lvl}  \cdot  3000 }$ | 包裹增益*｛$lvl  \cdot  0.2 + 1$｝ | 20 |
| 橙色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  13.5K }$ | 橙色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 更大的形状 | ${ 现金: {(lvl  \cdot  0.05 + 1.75)}^{lvl}  \cdot  35.5K }$ | 形状增益*｛${(1.45)}^{lvl}$｝ |  |
| 绿色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  110K }$ | 绿色增益*｛${(1.5)}^{lvl}$｝ | 30 |
| 分拣系统 | ${ 现金: {(2.2)}^{lvl}  \cdot  275K }$ | 转换器容量*｛$lvl  \cdot  0.2 + 1$｝; 包裹容量*｛$lvl  \cdot  0.2 + 1$｝ | 15 |
| 红色卡车 | ${ 现金: {(4 + 2  \cdot  lvl)}^{lvl}  \cdot  880K }$ | 红色鼓容量*｛$lvl  \cdot  0.2 + 1$｝ | 5 |
| 黄色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  2.4M }$ | 黄色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 蓝色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  130M }$ | currencyGalleryBlueGain*｛${(1.5)}^{lvl}$｝ | 35 |
| 橙色卡车 | ${ 现金: {(4 + 2  \cdot  lvl)}^{lvl}  \cdot  550M }$ | 橙色鼓容量*｛$lvl  \cdot  0.2 + 1$｝ | 5 |
| 绿色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  2.3B }$ | 绿色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 投资 | ${ 现金: {(1.75 + 0.08  \cdot  lvl)}^{lvl}  \cdot  12B }$ | 现金增益*｛${(1.15)}^{lvl}$｝ |  |
| 紫色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  140B }$ | 紫色增益*｛${(1.5)}^{lvl}$｝ | 40 |
| 黄色卡车 | ${ 现金: {(4 + 2  \cdot  lvl)}^{lvl}  \cdot  790B }$ | 黄色鼓容量*｛$lvl  \cdot  0.2 + 1$｝ | 5 |
| 蓝色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  3.75T }$ | 蓝色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 美术课 | ${ 现金: {(1.5 + 0.1  \cdot  lvl)}^{lvl}  \cdot  40T }$ | 画布速度*｛${(1.15)}^{lvl}$｝ |  |
| 准备工作 | ${ 现金: {(2.5)}^{getSequence(1, lvl})  \cdot  500T }$ | 灵感的开始+｛$lvl$｝; 画布大小+｛$lvl$｝ |  |
| 红橙色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  6.25Qa }$ | currencyGalleryDeep-orangeGain*｛${(1.5)}^{lvl}$｝ | 45 |
| 绿色卡车 | ${ 现金: {(4 + 2  \cdot  lvl)}^{lvl}  \cdot  70Qa }$ | 绿色鼓容量*｛$lvl  \cdot  0.1 + 1$｝ | 5 |
| 紫色箱子 | ${ 现金: {(2.5 + 0.2  \cdot  lvl)}^{lvl}  \cdot  420Qa }$ | 紫色鼓容量+｛$lvl  \cdot  10$｝ | 9 |
| 金色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  2Qi }$ | 金色增益*｛${(1.5)}^{lvl}$｝ | 50 |
| 卡车车队 | ${ 现金: {(1.2 + 0.1  \cdot  lvl)}^{lvl}  \cdot  750Qa }$ | 红色鼓容量*｛$Math.min(lvl  \cdot  0.1 + 1, 3)$｝; 橙色鼓容量*｛$lvl > 5 ? Math.min((lvl - 5)  \cdot  0.1 + 1, 3) : null$｝; 黄色鼓容量*｛$lvl > 10 ? Math.min((lvl - 10)  \cdot  0.1 + 1, 3) : null$｝; 绿色鼓容量*｛$lvl > 15 ? Math.min((lvl - 15)  \cdot  0.1 + 1, 3) : null$｝; 蓝色鼓容量*｛$lvl > 20 ? Math.min((lvl - 20)  \cdot  0.1 + 1, 3) : null$｝; 紫色鼓容量*｛$lvl > 25 ? Math.min((lvl - 25)  \cdot  0.1 + 1, 3) : null$｝; currencyGalleryDeep-orangeDrumCap*｛$lvl > 30 ? Math.min((lvl - 30)  \cdot  0.1 + 1, 3) : null$｝; 金色鼓容量*｛$lvl > 35 ? Math.min((lvl - 35)  \cdot  0.1 + 1, 3) : null$｝; currencyGalleryLight-greenDrumCap*｛$lvl > 40 ? Math.min((lvl - 40)  \cdot  0.1 + 1, 3) : null$｝; 青色鼓容量*｛$lvl > 45 ? Math.min((lvl - 45)  \cdot  0.1 + 1, 3) : null$｝; currencyGalleryLight-blueDrumCap*｛$lvl > 50 ? Math.min((lvl - 50)  \cdot  0.1 + 1, 3) : null$｝; 粉红鼓容量*｛$lvl > 55 ? Math.min((lvl - 55)  \cdot  0.1 + 1, 3) : null$｝ |  |
| 淡绿色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  2Sx }$ | currencyGalleryLight-greenGain*｛${(1.5)}^{lvl}$｝ | 55 |
| 青色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  2Sp }$ | currencyGalleryTealGain*｛${(1.5)}^{lvl}$｝ | 60 |
| 淡蓝色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  2O }$ | currencyGalleryLight-blueGain*｛${(1.5)}^{lvl}$｝ | 65 |
| 粉色蜡笔 | ${ 现金: {(lvl  \cdot  0.02 + 1.5)}^{lvl}  \cdot  2N }$ | 粉色增益*｛${(1.5)}^{lvl}$｝ | 70 |
