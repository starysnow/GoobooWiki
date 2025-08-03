// .vitepress/theme/index.js

// 1. 导入VitePress的默认主题
import DefaultTheme from 'vitepress/theme'
import HomeLayout from './components/HomeLayout.vue'
import TribeImprintsTable from './components/TribeImprintsTable.vue'
import FeatureCard from './components/FeatureCard.vue'
import DynamicTable from './components/DynamicTable.vue'
import Calculator from './components/Calculator.vue'
// tools
import GasCalculator from './components/GasCalculator.vue'
import CorruptionCalculator from './components/CorruptionCalculator.vue'
import Crafters from './components/Crafters.vue'
import DamageProfiler from './components/DamageProfiler.vue'

// 3. 如果你有自定义的CSS，也可以在这里导入
import './custom.css'

export default {
  // 4. 继承默认主题的所有功能
  ...DefaultTheme,

  // 5. 注册你的全局组件
  // 这样就不需要在每个 .md 文件里都导入一次了
  enhanceApp({ app }) {
    app.component('HomeLayout', HomeLayout)
    app.component('TribeImprintsTable', TribeImprintsTable)
    app.component('FeatureCard', FeatureCard)
    app.component('DynamicTable', DynamicTable)
    app.component('Calculator', Calculator)
    app.component('GasCalculator', GasCalculator)
    app.component('CorruptionCalculator', CorruptionCalculator)
    app.component('Crafters', Crafters)
    app.component('Crafters', Crafters)

  }
}