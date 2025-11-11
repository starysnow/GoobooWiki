# Gooboo v1.6.0 更新信息

<style>
.change-tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; margin-right: 10px; color: #fff; vertical-align: middle; }
.change-tag .mdi { margin-right: 6px; font-size: 1.2em; }
.tag-new { background-color: rgba(39, 174, 96, 0.8); }
.tag-change { background-color: rgba(41, 128, 185, 0.8); }
.tag-balancing { background-color: rgba(243, 156, 18, 0.8); }
.tag-removed { background-color: rgba(192, 57, 43, 0.8); }
.tag-bugfix { background-color: rgba(142, 68, 173, 0.8); }
.tag-quality_of_life { background-color: rgba(22, 160, 133, 0.8); }
.tag-clarity { background-color: rgba(241, 196, 15, 0.8); color: #333; }
.tag-appearance { background-color: rgba(52, 73, 94, 0.8); }
.tag-context     { background-color: #6c757d; color: white; }
.change-detail { font-family: 'Roboto Mono', monospace; font-size: 0.9em; margin-left: 5px; }
.arrow { color: #95a5a6; margin: 0 5px; font-weight: bold; }
.old-value { color: #e74c3c; } /* 移除了删除线 */
.new-value { color: #2ecc71; font-weight: bold; }
.header-icon {
    display: inline-block;
    vertical-align: middle;
    width: 1.2em;
    /* height: 2em; */
    /* margin-right: 6px; */
    /* position: relative; */
    /* top: -0.1em; */
}
</style>

<div class="changelog-section">
<h3><i class="mdi mdi-gamepad-variant"></i> 游戏 (Game)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> 增加了一个选项以禁用CSS动画，因为它们在某些浏览器上会导致性能问题。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 增加了一个选项以显示公式。</li>
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> <a href="https://github.com/Tendsty/gooboo/issues/59" target="_blank" rel="noopener noreferrer">#59</a> 增加了选择数字格式的选项。</li>
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> 属性分类中的一些数值现在被分组以保持列表简短。</li>
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> 为快捷键绑定添加了图标。</li>
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> 负面效果现在以红色显示。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 对于难以获得的货币，现在可以通过悬停在其价格标签上来查看如何获取。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 一些升级列表现在会显示下一个升级。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 声望石无法再被购买。</li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 修复了玩家在加载存档时卡在无法访问的子功能中的问题。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-pickaxe"></i> 采矿 (Mining)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 14 个新升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 2 个新声望升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 1 个新成就。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了 1 个成就。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的声望收入：<span class="change-detail"><span class="old-value">x1.05</span><span class="arrow">→</span><span class="new-value">x1.02</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “水晶矿石存储”升级的最高等级：<span class="change-detail"><span class="old-value">16</span><span class="arrow">→</span><span class="new-value">20</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “水晶矿石存储”升级的每个容量：<span class="change-detail"><span class="old-value">+0.25x</span><span class="arrow">→</span><span class="new-value">+0.2x</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “水晶矿石存储”升级现在也会增加其对应矿石的基础容量。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 添加矿石现在会应用最大压缩。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 锭的成本现在增长得更快。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 制作锭现在需要更多时间。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 制作锭时不再消耗气体。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 强化现在只需要锭一次。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 强化现在有最高等级 10 级。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 强化的成本现在增长得更慢。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 极大地削弱了所有强化的效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 镐上现在有最大强化数量的限制。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 现在可以在应用前看到强化效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 现在可以暂时禁用强化以再次收集黑曜石。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> <a href="https://github.com/Tendsty/gooboo/issues/58" target="_blank" rel="noopener noreferrer">#58</a> 提升了自动进阶的最大值。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 现在可以获得琥珀，直到容量的两倍满为止。</li>
  <li><span class="change-tag tag-context"><i class="mdi mdi-information-outline"></i>背景</span> 极高的居民深度值允许玩家突破预期的可达深度。矿井的其他部分已经调整，以确保早期玩家也能受到影响。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 居民最大深度不能超过 50%。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-diamond-stone"></i> 宝石 (Gems)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每个成就提供的宝石生成速度（红宝石和绿宝石除外）：<span class="change-detail"><span class="old-value">+1%</span><span class="arrow">→</span><span class="new-value">+0.5%</span></span></li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-home-group"></i> 村庄 (Village)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 献祭在购买时会变得更昂贵。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 献祭现在也会增加资源容量倍率。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的声望收入：<span class="change-detail"><span class="old-value">x1.05</span><span class="arrow">→</span><span class="new-value">x1.02</span></span></li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-trophy"></i> 成就 (Achievements)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 为“超级成就者”成就增加了3个新的圣遗物作为奖励。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-school"></i> 学校 (School)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 提高了艺术科目在高年级的难度。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 数学问题变得简单了一些，但你需要答对更多题目。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 答错问题现在会减少时间，而不是降低分数。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 当金粉尘满了之后，你现在可以获得额外的奖励粉尘，但需要时间来变得可用。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 在没有足够通行证的情况下尝试考试，现在会自动购买通行证。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每次考试的价格：<span class="change-detail"><span class="old-value">35</span><span class="arrow">→</span><span class="new-value">20</span></span></li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 改变了历史小游戏，以找到匹配年份而不是记住它们。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 为科目增加了总计点数。</li>
  <li><span class="change-tag tag-context"><i class="mdi mdi-information-outline"></i>背景</span> 书籍系统被替换，以便更容易理解你将从书中获得哪些属性。它现在还会为同时完成多个科目奖励玩家。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 书籍现在需要先完成一个任务线才能解锁。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 书籍不再需要货币来升级，而是需要好成绩或宝石投资。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 书籍现在会提升一个基于全局等级的属性，而不是提升升级的最高等级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增化学科目。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-ring"></i> 圣遗物 (Relics)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了圣遗物主动技能。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了圣遗物博物馆。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-account-group"></i> 部落 (Horde)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 16 件新装备。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 1 座新塔。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 13 个新升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 7 个新声望升级。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 替换了稀有战利品后的小Boss，现在击败任何敌人都能获得相同的战利品。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> “天使”符印现在减少受到的伤害，而不是提供复活。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 声望升级现在消耗更少的灵魂。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 从声望升级中获得的腐化灵魂增益降低。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每区域灵魂增加：<span class="change-detail"><span class="old-value">x1.16</span><span class="arrow">→</span><span class="new-value">x1.1</span></span></li>
  <li><span class="change-tag tag-context"><i class="mdi mdi-information-outline"></i>背景</span> 通过特定装备永久提升属性会产生巨大的力量，但很容易被一些玩家错过。这个系统正在被团队Boss替换，这是一个对挂机更友好的新机制。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了团队Boss。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了传家宝加成。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的声望收入：<span class="change-detail"><span class="old-value">x1.05</span><span class="arrow">→</span><span class="new-value">x1.02</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 增加了大部分装备的怪物零件价格缩放。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 多重暴击现在会加到伤害倍率上，而不是再次乘以伤害。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 暴击伤害：<span class="change-detail"><span class="old-value">+50%</span><span class="arrow">→</span><span class="new-value">+75%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 眩晕抗性现在减少负面效果的持续时间。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 装备不再影响主动技能提供的货币。</li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 敌人无法再在被眩晕时使用主动技能。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 分裂护盾在击败敌人后恢复：<span class="change-detail"><span class="old-value">100%</span><span class="arrow">→</span><span class="new-value">25%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 更改了装备精通4的效果。主动技能现在是1.5倍效果，而不是冷却时间减半。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 从稀有战利品中获得的精通点数增益：<span class="change-detail"><span class="old-value">5%</span><span class="arrow">→</span><span class="new-value">100%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 精通点数需求：<span class="change-detail"><span class="old-value">1x</span><span class="arrow">→</span><span class="new-value">10x</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 远古传家宝效果：<span class="change-detail"><span class="old-value">3x</span><span class="arrow">→</span><span class="new-value">2x</span></span></li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 传家宝的负面二级属性现在会显示。</li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 移除了传家宝的二级属性。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 5级精通装备的神秘碎片容量：<span class="change-detail"><span class="old-value">5 (+2)</span><span class="arrow">→</span><span class="new-value">3 (+3)</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 狂暴攻击：<span class="change-detail"><span class="old-value">x1.5</span><span class="arrow">→</span><span class="new-value">x2</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 狂暴不再增加暴击几率和伤害。</li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 腐化现在会应用到敌方塔上。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 功能现在会立即开始冷却。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 不激活时，功能的主动冷却时间降低：<span class="change-detail"><span class="old-value">5%</span><span class="arrow">→</span><span class="new-value">10%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点神秘碎片的攻击、生命和声望增益：<span class="change-detail"><span class="old-value">x1.02</span><span class="arrow">→</span><span class="new-value">x1.008</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 主动技能无法再突破分裂护盾的最大值和给定值。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-cards"></i> 卡片 (Cards)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 103 张新卡。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 12 个新卡包。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 现在可以一次购买10或100个卡包。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 增加了排序和搜索特定属性卡片的选项。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 新卡包解锁时会增加一个通知。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每20张卡的黄玉容量：<span class="change-detail"><span class="old-value">20</span><span class="arrow">→</span><span class="new-value">50</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每个事件卡的黄玉容量：<span class="change-detail"><span class="old-value">5</span><span class="arrow">→</span><span class="new-value">10</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每个完成的事件收藏的黄玉容量：<span class="change-detail"><span class="old-value">50</span><span class="arrow">→</span><span class="new-value">150</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 重复事件卡的宝石奖励被金粉尘取代。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “昆虫世界”卡包价格：<span class="change-detail"><span class="old-value">90</span><span class="arrow">→</span><span class="new-value">70</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “蜜蜂与花”卡包价格：<span class="change-detail"><span class="old-value">200</span><span class="arrow">→</span><span class="new-value">130</span></span></li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-account-star"></i> 将军 (Generals)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 任务线现在可以在更高难度下重复。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 9 个新任务线。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了第二位将军。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 现在可以查看已完成的任务。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 新任务线解锁时会增加一个通知。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 为可能失败或有时间限制的任务增加了图标。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-barn"></i> 农场 (Farm)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 14 种新作物。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 5 种新肥料。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 1 个新成就。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 1 个新圣遗物。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了 2 个圣遗物。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 23 个新升级。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 增加了田地工具提示。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 在田地上删除作物现在会退还资源。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 生长时间（首次作物）：<span class="change-detail"><span class="old-value">/12</span><span class="arrow">→</span><span class="new-value">/10</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 产量（首次作物）：<span class="change-detail"><span class="old-value">/8</span><span class="arrow">→</span><span class="new-value">/10</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 高级装饰效果：<span class="change-detail"><span class="old-value">x2</span><span class="arrow">→</span><span class="new-value">x1.5</span></span></li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 现在可以在田地上种植作物。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了事件肥料。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了只能在事件期间获得的特殊种子。</li>
  <li><span class="change-tag tag-context"><i class="mdi mdi-information-outline"></i>背景</span> 在选择最优作物和基因的玩家与未选择的玩家之间，农场存在巨大的效率差距。这些改动旨在将这些群体拉近，同时仍在进行中。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 所有常规作物现在都免费了。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了特殊作物。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了金色花瓣。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的产量：<span class="change-detail"><span class="old-value">x1.08</span><span class="arrow">→</span><span class="new-value">x1.06</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的作物经验：<span class="change-detail"><span class="old-value">+0.08</span><span class="arrow">→</span><span class="new-value">+0.05</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 降低了种子升级的价格。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 基因升级现在以加法方式叠加。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 现在可以获得稀有掉落，直到容量的两倍满为止。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-calendar"></i> 事件 (Event)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 修复了日历中其他月份显示错误事件的Bug。</li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 修复了夏季节日资源在被收藏家拿走时会获得两次全局奖励的Bug。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 夜间狩猎不再因拥有3种或更多独特成分而获得更少雪球。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 在滚雪球比赛中获胜不再获得更少的雪代币。</li>
  <li><span class="change-tag tag-context"><i class="mdi mdi-information-outline"></i>背景</span> 事件奖励历来要么太弱要么太强，以至于使其他游戏机制变得过时。为了解决这个问题，有问题的奖励正在被移除，并替换为更容易平衡的新奖励。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了作为事件奖励的宝藏。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 商人现在可以出售一张未拥有的卡片。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了作为事件奖励的宝石。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了作为事件奖励的基础货币。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了作为事件奖励的声望货币。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了作为事件奖励的金粉尘。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了作为事件奖励的事件星星。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 黄玉容量从“扩展金库”银行项目：<span class="change-detail"><span class="old-value">300</span><span class="arrow">→</span><span class="new-value">200</span></span></li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-treasure-chest"></i> 宝藏 (Treasure)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 新宝藏效果解锁时会增加一个通知。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 宝藏现在可以出现在一个空槽位中。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 宝藏效果不再加倍每一层，它们现在应用自己的缩放比例。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 一些宝藏效果现在需要最低层数。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了修改器。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “更多槽位”升级在更高等级时变得更昂贵。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 宝藏价格现在基于等级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了事件力量。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 现在可以对宝藏进行排序。</li>
  <li><span class="change-tag tag-appearance"><i class="mdi mdi-palette"></i>外观</span> 更改了宝藏的UI。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 宝藏现在看起来不同了。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了烟雾效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了稀土效果。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 现在每组村庄资源都有自己的增益效果。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了精神资源增益效果。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了怪物零件增益效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了腐化血肉增益效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了神秘碎片增益效果。</li>
  <li><span class="change-tag tag-removed"><i class="mdi mdi-minus"></i>移除</span> 移除了包裹增益效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了全颜色增益效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了形状增益效果。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增了画布速度效果。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-snowflake-thermometer"></i> 冷冻实验室 (Cryo lab)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 现在可以查看非激活的子功能。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每个冷冻等级的声望增益：<span class="change-detail"><span class="old-value">+0.1x</span><span class="arrow">→</span><span class="new-value">x1.15</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 经验现在基于全局等级，而不是最佳声望。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 现在可以查看需要多少经验才能达到下一级。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-image-frame"></i> 画廊 (Gallery)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点卡牌力量的现金：<span class="change-detail"><span class="old-value">x1.05</span><span class="arrow">→</span><span class="new-value">x1.02</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 动力：<span class="change-detail"><span class="old-value">0.2/s</span><span class="arrow">→</span><span class="new-value">0.01/s</span></span></li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 在解锁形状小游戏和购买影响形状的声望升级时，现在可以获得动力补充。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 特殊形状现在会提供更多形状，但最多只能使用100动力。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 加速器现在会提供更多形状，但最多只能使用100动力。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “收藏家”成就的最高等级：<span class="change-detail"><span class="old-value">20</span><span class="arrow">→</span><span class="new-value">10</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 画布速度：<span class="change-detail"><span class="old-value">1 (+0.1)</span><span class="arrow">→</span><span class="new-value">1</span></span></li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 修复了部分画布进度会计入“远见卓识”成就的Bug。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 所有“幸运”升级的鼓声几率：<span class="change-detail"><span class="old-value">2%</span><span class="arrow">→</span><span class="new-value">1%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 所有“幸运”升级的最高等级：<span class="change-detail"><span class="old-value">40</span><span class="arrow">→</span><span class="new-value">80</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 降低了所有“幸运”升级的成本缩放。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 降低了后期“漂亮颜色”升级的红宝石价格。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-gas-cylinder"></i> 气体巨人 (Gas giant)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 12 个新升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 8 个新声望升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 2 个新成就。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 3 种新稀土。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 提高了除氦气外所有气体的最低区域。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 气体在被收集后现在会稍微不那么有效。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “更多气体”宝石升级的气体增益：<span class="change-detail"><span class="old-value">+0.4%</span><span class="arrow">→</span><span class="new-value">+0.2%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> “更多气体”宝石升级的气体上限：<span class="change-detail"><span class="old-value">-</span><span class="arrow">→</span><span class="new-value">+30</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 烟雾现在会从矿石增益和容量中受益。</li>
</ul>
</div>

<div class="changelog-section">
<h3><i class="mdi mdi-sword-cross"></i> 职业 (Classes)</h3>
<ul class="changelog-list">
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> 修复了一些属性在状态任务中未显示为百分比的问题。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 移除了职业等级时间。</li>
  <li><span class="change-tag tag-change"><i class="mdi mdi-sync"></i>变更</span> 勇气现在通过稀有战利品获得。</li>
  <li><span class="change-tag tag-quality_of_life"><i class="mdi mdi-heart-pulse"></i>生活质量</span> 之前看过的技能现在会保持可见。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 2 个新职业。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 4 个新成就。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 1 个新饰品。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 6 个新升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 4 个新声望升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 新增 3 个新宝石升级。</li>
  <li><span class="change-tag tag-new"><i class="mdi mdi-plus"></i>新增</span> 为现有技能树增加了更多技能。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每点力量的常规攻击伤害增加：<span class="change-detail"><span class="old-value">5%</span><span class="arrow">→</span><span class="new-value">3%</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> Boss通行证每1个任务的进度：<span class="change-detail"><span class="old-value">1</span><span class="arrow">→</span><span class="new-value">2</span></span></li>
  <li><span class="change-tag tag-bugfix"><i class="mdi mdi-bug"></i>修复</span> <a href="https://github.com/Tendsty/gooboo/issues/93" target="_blank" rel="noopener noreferrer">#93</a> 技能主动冷却时间现在正确地存储在存档中。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 大大降低了大部分技能的法力值和能量消耗。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> 增加了职业等级的工具提示。</li>
  <li><span class="change-tag tag-clarity"><i class="mdi mdi-lightbulb-on-outline"></i>清晰度</span> <a href="https://github.com/Tendsty/gooboo/issues/94" target="_blank" rel="noopener noreferrer">#94</a> 主动技能现在会显示它们的名称。</li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每战斗通行证等级的攻击和生命增益：<span class="change-detail"><span class="old-value">x1.5</span><span class="arrow">→</span><span class="new-value">x1.4</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每战斗通行证等级的骨骼和血液增益：<span class="change-detail"><span class="old-value">x1.3</span><span class="arrow">→</span><span class="new-value">x1.5</span></span></li>
  <li><span class="change-tag tag-balancing"><i class="mdi mdi-scale-balance"></i>平衡</span> 每战斗通行证等级的腐化灵魂和勇气增益：<span class="change-detail"><span class="old-value">x1.4</span><span class="arrow">→</span><span class="new-value">x1.3</span></span></li>
</ul>
</div>