| 名称  | cap | price | effect | requirementValue |
| --- | --- | ----- | ------ | ---------------- |
| 种子箱 | 32 | $[{ 蔬菜: 30 }, { 浆果: 120 }, { 粮食: 230 }, { 花肥: 800, 黄金: 1 }, { 蔬菜: 4600 }, { 浆果: 5e4 }, { 粮食: 3.35e5 }, { 花肥: 2e6 }, { 蔬菜: 1.75e7 }, { 浆果: 1.2e8 }, { 粮食: 9e8 }, { 花肥: 7.2e9 }, { 蔬菜: 5.4e10 }, { 浆果: 3.7e11 }, { 粮食: 2.2e12 }, { 花肥: 3.5e13 }, { 蔬菜: 8.75e14 }, { 浆果: 3.1e16 }, { 粮食: 1.3e18 }, { 花肥: 8.5e19 }, { 蔬菜: 5e21 }, { 浆果: 6.5e23 }, { 粮食: 3e26 }, { 花肥: 3.2e29 }, { 蔬菜: 4.4e32 }, { 浆果: 7.5e35 }, { 粮食: 1.2e39 }, { 花肥: 2.25e43 }, { 蔬菜: 4.8e47 }, { 浆果: 1.1e52 }, { 粮食: 2.8e56 }, { 花肥: 7.5e60 }][lvl]$ | blueberryfarmSeed｛$lvl >= 1$｝; wheatfarmSeed｛$lvl >= 2$｝; tulipfarmSeed｛$lvl >= 3$｝; potatofarmSeed｛$lvl >= 4$｝; raspberryfarmSeed｛$lvl >= 5$｝; barleyfarmSeed｛$lvl >= 6$｝; dandelionfarmSeed｛$lvl >= 7$｝; cornfarmSeed｛$lvl >= 8$｝; watermelonfarmSeed｛$lvl >= 9$｝; ricefarmSeed｛$lvl >= 10$｝; rosefarmSeed｛$lvl >= 11$｝; leekfarmSeed｛$lvl >= 12$｝; honeymelonfarmSeed｛$lvl >= 13$｝; ryefarmSeed｛$lvl >= 14$｝; daisyfarmSeed｛$lvl >= 15$｝; cucumberfarmSeed｛$lvl >= 16$｝; grapesfarmSeed｛$lvl >= 17$｝; hopsfarmSeed｛$lvl >= 18$｝; violetfarmSeed｛$lvl >= 19$｝; sweetPotatofarmSeed｛$lvl >= 20$｝; strawberryfarmSeed｛$lvl >= 21$｝; sesamefarmSeed｛$lvl >= 22$｝; sunflowerfarmSeed｛$lvl >= 23$｝; spinachfarmSeed｛$lvl >= 24$｝; currantfarmSeed｛$lvl >= 25$｝; redwheatfarmSeed｛$lvl >= 26$｝; poppyfarmSeed｛$lvl >= 27$｝; pumpkinfarmSeed｛$lvl >= 28$｝; blackberryfarmSeed｛$lvl >= 29$｝; milletfarmSeed｛$lvl >= 30$｝; petuniafarmSeed｛$lvl >= 31$｝; chilifarmSeed｛$lvl >= 32$｝ |  |
| 繁殖力 |  | ${ 蔬菜: 50  \cdot  Math.min(lvl  \cdot  0.1 + 0.5, 1)  \cdot  {(lvl  \cdot  0.005 + 1.3)}^{lvl}, 浆果: 50  \cdot  Math.min(lvl  \cdot  0.1 + 0.5, 1)  \cdot  {(lvl  \cdot  0.005 + 1.3)}^{lvl} }$ | 产出*｛${(1.1)}^{lvl}$｝ | 1 |
| 过度生长 | 7 | $fallbackArray([{ 浆果: 80 }, { 粮食: 425, 花肥: 650 }], { 花肥: 240  \cdot  {(5 + lvl)}^{lvl} }, lvl)$ | 过度生长+｛$lvl >= 1 ? lvl  \cdot  0.1 + 0.3 : null$｝ | 1 |
| 扩张 | 45 | ${ 粮食: 300  \cdot  Math.min(lvl  \cdot  0.1 + 0.5, 1)  \cdot  {(lvl  \cdot  0.05 + 2)}^{lvl} }$ | 农场地块farmTile｛$lvl$｝; 最大关怀+｛$lvl >= 3 ? \text{向下取整}(lvl / 3) : null$｝ | 2 |
| 花园侏儒 | 5 | ${ 蔬菜: 250  \cdot  {(128)}^{lvl}, 浆果: 250  \cdot  {(128)}^{lvl}, 花肥: 500  \cdot  {(192)}^{lvl} }$ | 花园侏儒farmBuilding｛$lvl$｝; 禁用“第一作物”解锁｛$lvl >= 1$｝ | 3 |
| 学习 | 1 | ${ 黄金: 1 }$ | 作物经验解锁｛$lvl >= 1$｝ | 4 |
| 浇水壶 | 1 | ${ 浆果: 2500, 黄金: 2 }$ | 珍贵植物解锁｛$lvl >= 1$｝ |  |
| 肥料 | 1 | ${ 黄金: 5 }$ | 肥料解锁｛$lvl >= 1$｝ |  |
| 种子袋 | 1 | ${ 黄金: 80 }$ | fernfarmSeed｛$lvl >= 1$｝; reedfarmSeed｛$lvl >= 1$｝; wildflowerfarmSeed｛$lvl >= 1$｝ |  |
| 磨种机 | 50 | ${ 花肥: 6000  \cdot  {(lvl  \cdot  0.04 + 1.5)}^{lvl}, 种子壳: \text{四舍五入}(4  \cdot  lvl  \cdot  {(1.08)}^{Math.max(0, lvl - 10}) + 10) }$ | 粮食增益*｛$lvl  \cdot  0.15 + 1$｝; 过度生长+｛$lvl  \cdot  0.02$｝ | 5 |
| 烤种子 | 5 | ${ 种子壳: \text{四舍五入}({(1.8)}^{lvl}  \cdot  4) }$ | 作物经验+｛$lvl  \cdot  0.1$｝ | 5 |
| 雨桶 | 50 | ${ 浆果: 4500  \cdot  {(lvl  \cdot  0.2 + 2.5)}^{lvl} }$ | 雨水容量+｛$lvl  \cdot  10$｝ | 5 |
| 小箱子 | 7 | ${ 蔬菜: 1.8e4  \cdot  {(1.9)}^{lvl}, 粮食: 6000  \cdot  {(2.25)}^{lvl} }$ | 种子壳容量+｛$lvl  \cdot  10$｝ | 6 |
| 洒水装置 | 2 | ${ 蔬菜: 120K  \cdot  {(4M)}^{lvl}, 种子壳: 50  \cdot  {(10)}^{lvl} }$ | 洒水装置farmBuilding｛$lvl$｝ | 6 |
| 草捆 | 50 | ${ 草: getSequence(12, lvl)  \cdot  15 + 75 }$ | 草容量+｛$lvl  \cdot  200$｝ | 6 |
| 放大镜 | 20 | ${ 粮食: 54K  \cdot  {(lvl  \cdot  0.1 + 2)}^{lvl}, 花肥: 33K  \cdot  {(lvl  \cdot  0.1 + 2)}^{lvl} }$ | 作物经验*｛$lvl  \cdot  0.1 + 1$｝ | 7 |
| 稻草人 | 10 | ${ 粮食: 110K  \cdot  {(1.8)}^{lvl}, 花瓣: \text{四舍五入}({(1.4)}^{lvl}  \cdot  3), 黄金: 6 + lvl }$ | 产出*｛$lvl  \cdot  0.1 + 1$｝; 花瓣容量+｛$lvl  \cdot  3$｝ | 7 |
| 蚁丘 | 20 | ${ 草: getSequence(3, lvl)  \cdot  75 + 200 }$ | 稀有掉率+｛$lvl  \cdot  0.01$｝ | 7 |
| 虫粉 | 40 | ${ 粮食: 675K  \cdot  {(1.75)}^{lvl}, 虫子: \text{四舍五入}(5  \cdot  lvl  \cdot  {(1.1)}^{Math.max(0, lvl - 10}) + 10) }$ | 蔬菜增益*｛$lvl  \cdot  0.15 + 1$｝ | 8 |
| 棚子 | 10 | ${ 种子壳: 5  \cdot  getSequence(3, lvl) + 35, 虫子: 5  \cdot  getSequence(3, lvl) + 35, 花瓣: 4  \cdot  getSequence(1, lvl) + 10 }$ | 种子壳容量+｛$lvl  \cdot  20$｝; 虫子容量+｛$lvl  \cdot  20$｝; 花瓣容量+｛$lvl  \cdot  10$｝ | 8 |
| Gutter | 10 | ${ 黄金: \text{四舍五入}({(1.35)}^{lvl}  \cdot  (lvl + 1)  \cdot  100) }$ | 雨水增益+｛$lvl$｝ | 8 |
| 讲台 | 2 | ${ 花肥: 3.5M  \cdot  {(3M)}^{lvl}, 花瓣: 75  \cdot  {(5)}^{lvl} }$ | 讲台farmBuilding｛$lvl$｝ | 9 |
| 信息素 | 25 | ${ 花瓣: \text{四舍五入}(4  \cdot  lvl  \cdot  {(1.05)}^{lvl} + 4), 虫子: \text{四舍五入}(5  \cdot  lvl  \cdot  {(1.1)}^{Math.max(0, lvl - 10}) + 10), 蝴蝶: \text{四舍五入}(lvl  \cdot  {(1.1)}^{Math.max(0, lvl - 10}) + 2) }$ | 浆果增益*｛$lvl  \cdot  0.15 + 1$｝; 作物经验*｛$lvl  \cdot  0.04 + 1$｝ | 9 |
| 香水 | 20 | ${ 浆果: 9M  \cdot  {(1.45)}^{lvl}, 虫子: \text{四舍五入}(2  \cdot  lvl  \cdot  {(1.1)}^{Math.max(0, lvl - 10}) + 10) }$ | 虫子容量+｛$lvl  \cdot  10$｝; 稀有掉率+｛$lvl  \cdot  0.01$｝ | 9 |
| 中箱子 | 8 | ${ 蔬菜: 90M  \cdot  {(1.75)}^{lvl}, 粮食: 54M  \cdot  {(2.1)}^{lvl} }$ | 种子壳容量+｛$lvl  \cdot  25$｝; 草容量+｛$lvl  \cdot  40$｝ | 10 |
| 踩碎种子 | 25 | ${ 种子壳: \text{四舍五入}({(1.15)}^{lvl}  \cdot  150) }$ | 产出*｛${(1.12)}^{lvl}$｝ | 10 |
| 昆虫天堂 | 6 | ${ 浆果: 750M  \cdot  {(2.4)}^{lvl}, 花瓣: \text{四舍五入}({(1.75)}^{lvl}  \cdot  11) }$ | 虫子容量+｛$lvl  \cdot  40$｝; 蝴蝶容量+｛$lvl  \cdot  5$｝; 瓢虫容量+｛$lvl  \cdot  30$｝ | 11 |
| 黄金工具 | 20 | ${ 黄金: \text{四舍五入}({(1.25)}^{lvl}  \cdot  350) }$ | 产出*｛$lvl  \cdot  0.1 + 1$｝ | 11 |
| 蝴蝶翅膀 | 6 | ${ 蝴蝶: \text{四舍五入}({(1.35)}^{lvl}  \cdot  14) }$ | 花瓣容量+｛$lvl  \cdot  15$｝ | 12 |
| 肥沃之地 | 40 | ${ 浆果: 4B  \cdot  {(2.25)}^{lvl}, 花肥: 3.3B  \cdot  {(2.25)}^{lvl} }$ | 蔬菜增益*｛$lvl  \cdot  0.1 + 1$｝ | 12 |
| 风车 | 1 | ${ 花肥: 250B, 花瓣: 150, 瓢虫: 50 }$ | 风车farmBuilding｛$lvl$｝ | 13 |
| 植物堆 | 15 | ${ 种子壳: \text{四舍五入}({(1.24)}^{lvl}  \cdot  225), 草: \text{四舍五入}({(1.15)}^{lvl}  \cdot  (lvl  \cdot  0.2 + 1)  \cdot  300), 花瓣: \text{四舍五入}({(1.2)}^{lvl}  \cdot  90) }$ | 产出*｛${(1.15)}^{lvl}$｝ | 13 |
| 堆肥箱 | 15 | ${ 蔬菜: 40B  \cdot  {(lvl  \cdot  0.25 + 4)}^{lvl}, 花肥: 12B  \cdot  {(lvl  \cdot  0.3 + 4)}^{lvl} }$ | 作物经验+｛$lvl  \cdot  0.04$｝; 稀有掉率+｛$lvl  \cdot  0.01$｝ | 13 |
| 神秘之地 | 40 | ${ 蔬菜: 37.5B  \cdot  {(2.25)}^{lvl}, 瓢虫: \text{四舍五入}({(1.12)}^{lvl}  \cdot  10) }$ | 粮食增益*｛$lvl  \cdot  0.1 + 1$｝; 瓢虫容量+｛$lvl  \cdot  20$｝ | 13 |
| 化肥袋 | 1 | ${ 黄金: 700 }$ | 除草剂findConsumable｛$lvl >= 1$｝; 涡轮生长findConsumable｛$lvl >= 1$｝; 优质肥料findConsumable｛$lvl >= 1$｝; 补充 (L)findConsumable｛$lvl >= 1$｝ | 14 |
| 大箱子 | 10 | ${ 浆果: 190B  \cdot  {(1.85)}^{lvl}, 粮食: 240B  \cdot  {(1.85)}^{lvl} }$ | 种子壳容量+｛$lvl  \cdot  60$｝; 草容量+｛$lvl  \cdot  80$｝; 花瓣容量+｛$lvl  \cdot  25$｝ | 14 |
| 人造网 | 3 | ${ 花肥: 1T  \cdot  {(9)}^{lvl}, 瓢虫: \text{四舍五入}({(1.5)}^{lvl}  \cdot  100) }$ | 蜘蛛容量+｛$lvl  \cdot  4$｝ | 15 |
| 研究昆虫 | 10 | ${ 浆果: 1.35T  \cdot  {(2.65)}^{lvl}, 蝴蝶: \text{四舍五入}({(1.25)}^{lvl}  \cdot  28) }$ | 作物经验*｛$lvl  \cdot  0.1 + 1$｝ | 15 |
| 蜂巢 | 20 | ${ 花肥: 22.5T  \cdot  {(1.4)}^{lvl}, 种子壳: \text{四舍五入}({(1.14)}^{lvl}  \cdot  280), 虫子: \text{四舍五入}({(1.16)}^{lvl}  \cdot  160) }$ | 蜘蛛容量+｛$lvl$｝; 蜜蜂容量+｛$lvl  \cdot  200$｝ | 16 |
| 沙罐 | 1 | ${ 黄金: 1500, 蝴蝶: 100, 瓢虫: 1100 }$ | 仙人掌farmSeed｛$lvl >= 1$｝ | 16 |
| 黑暗角落 | 10 | ${ 蔬菜: 175T  \cdot  {(1.75)}^{lvl}, 粮食: 300T  \cdot  {(1.6)}^{lvl}, 虫子: \text{四舍五入}({(1.24)}^{lvl}  \cdot  115) }$ | 蜘蛛容量+｛$lvl  \cdot  2$｝; 稀有掉率+｛$lvl  \cdot  0.01$｝ | 17 |
| 胡萝卜蛋糕 | 20 | ${ 蔬菜: 2e15  \cdot  {(2.05)}^{lvl}, 粮食: 3e15  \cdot  {(2.25)}^{lvl} }$ | 浆果增益*｛$lvl  \cdot  0.15 + 1$｝ | 17 |
| 旗帜 | 1 | ${ 黄金: 10K, 蜘蛛: 50, 蜜蜂: 2500 }$ | 旗帜farmBuilding｛$lvl$｝ | 18 |
| 蜂蜜罐 | 20 | ${ 浆果: 1.5e16  \cdot  {(3.3)}^{lvl}, 蜜蜂: \text{四舍五入}({(1.1)}^{lvl}  \cdot  1250) }$ | 花肥增益*｛$lvl  \cdot  0.1 + 1$｝ | 18 |
| 虫饵 | 10 | ${ 草: \text{四舍五入}({(1.22)}^{lvl}  \cdot  1350), 花瓣: \text{四舍五入}({(1.19)}^{lvl}  \cdot  175), 蝴蝶: \text{四舍五入}({(1.16)}^{lvl}  \cdot  50) }$ | 蔬菜增益*｛$lvl  \cdot  0.1 + 1$｝; 虫子容量+｛$lvl  \cdot  20$｝; 瓢虫容量+｛$lvl  \cdot  35$｝ | 19 |
| 干草存储 | 8 | ${ 花肥: 6.7e17  \cdot  {(5.5)}^{lvl}, 种子壳: \text{四舍五入}({(1.2)}^{lvl}  \cdot  600) }$ | 粮食增益*｛$lvl  \cdot  0.15 + 1$｝; 草容量+｛$lvl  \cdot  60$｝ | 19 |
| 闪亮的土壤 | 20 | ${ 蜜蜂: \text{四舍五入}({(1.16)}^{lvl}  \cdot  2000), 花瓣: lvl  \cdot  30 + 500 }$ | 浆果增益*｛$lvl  \cdot  0.1 + 1$｝; 蝴蝶容量+｛$lvl  \cdot  4$｝ | 20 |
| 田地祝福 | 20 | ${ 蔬菜: 5.1e20  \cdot  {(2.65)}^{lvl}, 蜘蛛: lvl  \cdot  4 + 40 }$ | 产出*｛$lvl  \cdot  0.05 + 1$｝; 作物经验*｛$lvl  \cdot  0.05 + 1$｝ | 20 |
| 大肥料袋 | 1 | ${ 黄金: 2000 }$ | 分析肥料findConsumable｛$lvl >= 1$｝; 超级多汁findConsumable｛$lvl >= 1$｝; 颗粒findConsumable｛$lvl >= 1$｝; 补充 (XL)findConsumable｛$lvl >= 1$｝ | 21 |
| 臭泥 | 15 | ${ 种子壳: \text{四舍五入}({(1.12)}^{lvl}  \cdot  1000), 草: lvl  \cdot  600 + 4000, 虫子: \text{四舍五入}({(1.08)}^{lvl}  \cdot  1350) }$ | 蔬菜增益*｛$lvl  \cdot  0.05 + 1$｝; 浆果增益*｛$lvl  \cdot  0.1 + 1$｝ | 21 |
| 芝麻开门 | 20 | ${ 花肥: 1.7e23  \cdot  {(1.6)}^{lvl}, 小种子: \text{四舍五入}({(1.28)}^{lvl}  \cdot  225) }$ | 粮食增益*｛$lvl  \cdot  0.05 + 1$｝; 种子壳容量+｛$lvl  \cdot  50$｝; 小种子容量+｛$lvl  \cdot  150$｝ | 22 |
| 漂亮的花盆 | 1 | ${ 黄金: 3500, 小种子: 975 }$ | cressfarmSeed｛$lvl >= 1$｝ | 22 |
| 花卉绘画 | 20 | ${ 粮食: 9.2e25  \cdot  {(1.6)}^{lvl}, 蜜蜂: \text{四舍五入}({(1.12)}^{lvl}  \cdot  3000) }$ | 花肥增益*｛$lvl  \cdot  0.05 + 1$｝; 蜜蜂容量+｛$lvl  \cdot  150$｝ | 23 |
| 植物百科全书 | 90 | ${ 粮食: 7.5e28  \cdot  {(1.5)}^{lvl} }$ | 作物经验*｛$lvl  \cdot  0.1 + 1$｝ | 24 |
| 小种子袋 | 12 | ${ 蔬菜: 1.4e32  \cdot  {(2.85)}^{lvl}, 浆果: 1.75e32  \cdot  {(2.75)}^{lvl}, 花瓣: \text{四舍五入}({(1.15)}^{lvl}  \cdot  650) }$ | 产出*｛$lvl  \cdot  0.075 + 1$｝; 小种子容量+｛$lvl  \cdot  350$｝ | 25 |
| 谷物箱 | 60 | ${ 种子壳: \text{四舍五入}({(1.05)}^{lvl}  \cdot  1200), 小种子: \text{四舍五入}({(1.08)}^{lvl}  \cdot  1350) }$ | 粮食增益*｛$lvl  \cdot  0.15 + 1$｝ | 26 |
| 花箱 | 60 | ${ 花瓣: \text{四舍五入}({(1.05)}^{lvl}  \cdot  750), 瓢虫: \text{四舍五入}({(1.07)}^{lvl}  \cdot  1500) }$ | 花肥增益*｛$lvl  \cdot  0.15 + 1$｝ | 27 |
| 蔬菜箱 | 60 | ${ 虫子: \text{四舍五入}({(1.05)}^{lvl}  \cdot  1050), 蜘蛛: \text{四舍五入}({(1.075)}^{lvl}  \cdot  40) }$ | 蔬菜增益*｛$lvl  \cdot  0.15 + 1$｝ | 28 |
| 浆果箱 | 60 | ${ 蝴蝶: \text{四舍五入}({(1.06)}^{lvl}  \cdot  100), 蜜蜂: \text{四舍五入}({(1.09)}^{lvl}  \cdot  2500) }$ | 浆果增益*｛$lvl  \cdot  0.15 + 1$｝ | 29 |
| 古代花盆 | 1 | ${ 黄金: 2.5e4, 小种子: 1e4, 蜗牛: 50 }$ | ancientFernfarmSeed｛$lvl >= 1$｝ | 30 |
| 史莱姆的踪迹 | 10 | ${ 花肥: 3.15e51  \cdot  {(lvl  \cdot  0.15 + 1.45)}^{lvl}, 草: \text{四舍五入}({(1.12)}^{lvl}  \cdot  6000) }$ | 作物经验*｛$lvl  \cdot  0.1 + 1$｝; 蜗牛容量+｛$lvl  \cdot  5$｝ | 30 |
| 蜗牛桶 | 25 | ${ 粮食: 1e56  \cdot  {(2.35)}^{lvl}, 蜗牛: \text{四舍五入}({(1.05)}^{lvl}  \cdot  (lvl  \cdot  3 + 24)) }$ | 产出*｛$lvl  \cdot  0.08 + 1$｝ | 31 |
