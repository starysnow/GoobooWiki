| 名称  | value | milestones | 圣遗物 |
| --- | ----- | ---------- | --- |
| harvests | $store.state.stat.farm_harvests.总计$ | $\text{四舍五入}({(lvl + 1)}^{2}  \cdot  {(1.5)}^{lvl}  \cdot  10)$ |  |
| maxOvergrow | $store.state.stat.farm_maxOvergrow.总计$ | $getSequence(1, lvl + 1)$ | {"2":"格子","4":"砖墙"} |
| bestPrestige | $store.state.stat.farm_bestPrestige.总计$ | $lvl  \cdot  2 + 4$ |  |
| 仅蔬菜 | $store.state.stat.仅蔬菜.总计$ | ${(81)}^{lvl}  \cdot  250$ | {"2":"金胡萝卜"} |
| 仅浆果 | $store.state.stat.仅浆果.总计$ | ${(81)}^{lvl}  \cdot  750$ | {"3":"金苹果"} |
| 仅粮食 | $store.state.stat.仅粮食.总计$ | ${(81)}^{lvl}  \cdot  2250$ | {"4":"爆米花"} |
| 仅鲜花 | $store.state.stat.仅鲜花.总计$ | ${(81)}^{lvl}  \cdot  6750$ | {"5":"蔷薇石英"} |
| 黄金 | $store.state.stat.黄金.总计$ | $\text{四舍五入}({(lvl + 2)}^{2}  \cdot  {(2.25)}^{lvl}  \cdot  2.5)$ | {"6":"金种子"} |
