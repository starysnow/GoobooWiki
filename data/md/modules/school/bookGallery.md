| 名称  | subfeature | scalesWithGL | minGL | maxGL | effect |
| --- | ---------- | ------------ | ----- | ----- | ------ |
| redGain | 0 | true | 20 | 119 | 红色油漆增益*｛$lvl  \cdot  0.02 + 1$｝ |
| converterCap | 0 | true | 40 | 139 | 转换器容量+｛$lvl  \cdot  20$｝ |
| shapeGain | 0 | true | 60 |  | 形状增益*｛${(1.01)}^{lvl}$｝ |
| packageCap | 0 | true | 80 | 178 | 包裹容量+｛$\text{向上取整}(lvl / 2)$｝ |
| drumCap | 0 | true | 100 | 190 | 所有鼓上限+｛$\text{向上取整}(lvl / 10)$｝ |
| canvasSpeed | 0 | true | 120 | 219 | 画布速度*｛$lvl  \cdot  0.01 + 1$｝ |
