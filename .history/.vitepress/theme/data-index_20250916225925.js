// 该文件由 build-data-index.js 自动生成，请勿手动修改！

import data_事件圣遗物 from '../../data/json/事件圣遗物.json';
import data_基因 from '../../data/json/基因.json';
import data_塔 from '../../data/json/塔.json';
import data_将军任务 from '../../data/json/将军任务.json';
import data_工匠制品 from '../../data/json/工匠制品.json';
import data_废料耐用性韧性 from '../../data/json/废料&耐用性&韧性.json';
import data_成就 from '../../data/json/成就.json';
import data_气体与烟雾 from '../../data/json/气体与烟雾.json';
import data_气态常规升级 from '../../data/json/气态常规升级.json';
import data_气态水晶升级 from '../../data/json/气态水晶升级.json';
import data_灵感 from '../../data/json/灵感.json';
import data_矿1常规升级 from '../../data/json/矿1常规升级.json';
import data_矿1绿水晶升级 from '../../data/json/矿1绿水晶升级.json';
import data_矿石 from '../../data/json/矿石.json';
import data_稀土 from '../../data/json/稀土.json';
import data_锭 from '../../data/json/锭.json';

/**
 * 包含所有JSON数据的数据字典。
 * 你可以根据文件名作为key来获取对应的数据。
 * 例如: dataMap['锭']
 */
export const dataMap = {
  '事件圣遗物': data_事件圣遗物,
  '基因': data_基因,
  '塔': data_塔,
  '将军任务': data_将军任务,
  '工匠制品': data_工匠制品,
  '废料&耐用性&韧性': data_废料耐用性韧性,
  '成就': data_成就,
  '气体与烟雾': data_气体与烟雾,
  '气态常规升级': data_气态常规升级,
  '气态水晶升级': data_气态水晶升级,
  '灵感': data_灵感,
  '矿1常规升级': data_矿1常规升级,
  '矿1绿水晶升级': data_矿1绿水晶升级,
  '矿石': data_矿石,
  '稀土': data_稀土,
  '锭': data_锭
};

/**
 * (可选) 包含所有表格配置的数组，用于需要展示全部数据的页面。
 */
export const allTables = Object.entries(dataMap).map(([title, data]) => ({
  id: `${title.toLowerCase()}-table`,
  title,
  data
}));
