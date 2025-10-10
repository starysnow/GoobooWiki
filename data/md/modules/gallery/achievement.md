| 名称  | value | milestones | 圣遗物 | 上限  |
| --- | ----- | ---------- | --- | --- |
| 美丽 | $store.state.stat.美丽.总计$ | ${(1M)}^{lvl}  \cdot  1T$ | {"2":"一袋金子","6":"图片相册"} |  |
| 转换器 | $store.state.stat.转换器.总计$ | ${(20)}^{lvl}  \cdot  200K$ | {"0":"打印机","2":"碎纸机"} |  |
| colorVariety | $[store.state.stat.红色.总计, store.state.stat.橙色.总计, store.state.stat.黄色.总计, store.state.stat.绿色.总计, store.state.stat.gallery_blue.总计, store.state.stat.紫色.总计, store.state.stat["gallery_deep-橙色"].总计, store.state.stat.金色.总计, store.state.stat["光-绿色"].总计, store.state.stat.gallery_teal.总计, store.state.stat["光-blue"].总计, store.state.stat.粉色.总计].reduce((a, b) => a + (b > 0 ? 1 : 0), 0)$ | $lvl + 2$ | {"2":"红色气球","3":"橙色气球","4":"黄色气球","5":"绿色气球","6":"蓝色气球","7":"紫色气球"} |  |
| highestTierIdea | $store.state.stat.gallery_highestTierIdea.总计$ | $lvl + 2$ | {"0":"灯泡","1":"简单计算器","3":"奇怪的卷轴"} |  |
| 现金 | $store.state.stat.现金.总计$ | ${(100)}^{lvl}  \cdot  100$ | {"1":"旧电视","5":"印刷机"} |  |
| packageMax | $store.state.stat.gallery_packageMax.总计$ | ${(3)}^{lvl}  \cdot  100$ | {"0":"令人担忧的邮件","1":"信用卡"} |  |
| redDrumMax | $store.state.stat.gallery_redDrumMax.总计$ | $lvl > 0 ? {(2)}^{lvl}  \cdot  25 : 20$ | {"2":"红色印花","4":"橙色印花","6":"黄色印花","9":"绿色印记","12":"蓝色印记"} |  |
| shapeComboTotal | $store.state.stat.gallery_shapeComboTotal.总计$ | $\text{四舍五入}({(lvl + 2)}^{2}  \cdot  {(1.2)}^{lvl}  \cdot  25)$ | {"2":"鱼缸","4":"小刷子","7":"奇怪的药丸"} |  |
| shapeComboHighest | $store.state.stat.gallery_shapeComboHighest.总计$ | $lvl  \cdot  5 + 10$ | {"2":"铅笔"} | 7 |
| canvasLevelTotal | $store.state.stat.gallery_canvasLevelTotal.总计$ | $getSequence(2, lvl + 1)  \cdot  10$ | {"0":"木制衣架","2":"床单"} |  |
| hourglassHighest | $store.state.stat.gallery_hourglassHighest.总计$ | $86400$ |  | 1 |
