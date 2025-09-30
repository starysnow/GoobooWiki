| 名称  | value | milestones | 圣遗物 | 秘密成就 | display | 上限  |
| --- | ----- | ---------- | --- | ---- | ------- | --- |
| maxBuilding | $store.state.stat.village_maxBuilding.总计$ | $\text{四舍五入}(lvl  \cdot  25  \cdot  {(1.2)}^{lvl} + 35)$ | {"3":"泥砖","4":"钥匙链","5":"金钥匙"} |  |  |  |
| basicResources | $Math.max(store.state.stat.village_woodMax.总计, store.state.stat.village_plantFiberMax.总计, store.state.stat.village_stoneMax.总计)$ | ${(10)}^{lvl}  \cdot  10K$ | {"3":"树苗"} |  |  |  |
| 金属 | $store.state.stat.village_metalMax.总计$ | ${(10)}^{lvl}  \cdot  5000$ | {"3":"螺丝刀"} |  |  |  |
| 金币 | $store.state.stat.金币.总计$ | ${(16)}^{lvl}  \cdot  2000$ | {"4":"宝箱"} |  |  |  |
| 水 | $store.state.stat.village_waterMax.总计$ | ${(20)}^{lvl}  \cdot  5000$ | {"3":"玫瑰"} |  |  |  |
| 知识 | $store.state.stat.village_knowledgeMax.总计$ | $\text{四舍五入}(getSequence(2, lvl + 1)  \cdot  {(1.2)}^{Math.max(lvl - 10, 0})  \cdot  250)$ | {"2":"地球仪"} |  |  |  |
| advancedResources | $Math.max(store.state.stat.village_hardwoodMax.总计, store.state.stat.village_gemMax.总计)$ | ${(6)}^{lvl}  \cdot  10K$ | {"3":"导师"} |  |  |  |
| 祝福 | $store.state.stat.祝福.总计$ | ${(9)}^{lvl}  \cdot  1000$ |  |  |  |  |
| 供品 | $store.state.stat.供品.总计$ | $\text{四舍五入}({(2.5)}^{lvl}  \cdot  500)$ |  |  |  |  |
| 牺牲 | $store.getters['村庄/offeringCount']$ | $getSequence(6, lvl + 1)  \cdot  5$ |  |  |  |  |
| 油 | $store.state.stat.village_oilMax.总计$ | ${(10)}^{lvl}  \cdot  100K$ |  |  |  |  |
| highestPower | $store.state.stat.village_highestPower.总计$ | $getSequence(2, lvl + 1)  \cdot  10$ |  |  |  |  |
| minHappiness | $store.state.stat.village_minHappiness.总计$ | $1$ |  | true | boolean | 1 |
