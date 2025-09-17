// .vitepress/theme/index.js
// 1. 导入VitePress的默认主题
import DefaultTheme from 'vitepress/theme'

import HomeLayout from './components/HomeLayout.vue'
import FeatureCard from './components/FeatureCard.vue'
import DynamicTable from './components/DynamicTable.vue'
import Calculator from './components/Calculator.vue'
// tools
import GasCalculator from './components/GasCalculator.vue'
import CorruptionCalculator from './components/CorruptionCalculator.vue'
import Crafters from './components/Crafters.vue'
import DamageProfiler from './components/DamageProfiler.vue'

import TwoSectionsLayout from './components/TwoSectionsLayout.vue'
import Modal from './components/Modal.vue'
import NavbarNotice from './components/NavbarNotice.vue';


// 3. 如果你有自定义的CSS，也可以在这里导入
import './custom.css'

export default {
  // 4. 继承默认主题的所有功能
  ...DefaultTheme,

  // 使用 Layout 插槽来扩展默认主题
  // Layout: () => {
  //   return h(DefaultTheme.Layout, null, {
  //     // 'nav-bar-content-before' 是一个插槽，
  //     // 它的内容会出现在顶部导航栏的搜索框之前。
  //     'nav-bar-content-before': () => h(NavbarNotice),
  //   });
  // },

  // 5. 注册你的全局组件
  // 这样就不需要在每个 .md 文件里都导入一次了
  enhanceApp({ app }) {
    app.component('HomeLayout', HomeLayout)
    app.component('FeatureCard', FeatureCard)
    app.component('DynamicTable', DynamicTable)
    app.component('Calculator', Calculator)
    app.component('GasCalculator', GasCalculator)
    app.component('CorruptionCalculator', CorruptionCalculator)
    app.component('Crafters', Crafters)
    app.component('DamageProfiler', DamageProfiler)
    app.component('TwoSectionsLayout', TwoSectionsLayout)
    app.component('Modal', Modal)

  }
}