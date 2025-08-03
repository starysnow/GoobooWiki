import { defineConfig } from 'vitepress'
import path from 'path'

/**
 * 网站的配置
 * 欲了解更多，请参考: https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  // --- 网站元数据 ---
  lang: 'zh-CN', // 网站语言，对SEO和可访问性至关重要
  title: 'Gooboo Wiki', // 网站标题，会显示在浏览器标签页上
  description: '一个全面、准确的Gooboo游戏资料站。', // 网站描述，用于搜索引擎优化
  head: [
    // 在HTML的<head>中添加的额外标签
    ['link', { rel: 'icon', href: '/favicon.ico' }], // 网站的favicon图标
    [
      'script',
      {
        src: 'https://cdn.jsdelivr.net/npm/chart.js',//tools页面所需
      }
    ]
  ],

  // --- 主题配置 ---
  // 欲了解更多，请参考: https://vitepress.dev/reference/default-theme-config
  themeConfig: {
    // -- 顶部导航 --
    nav: createNav(),

    // -- 侧边栏 --
    sidebar: createSidebar(),

    // -- 搜索 (本地) --
    search: {
      provider: 'local',
      options: {
        locales: {
          root: { // 使用 root 来匹配中文配置
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '未找到相关结果',
                resetButtonTitle: '清除查询',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },

    // -- UI 文本定制 --
    logo: '/logo.svg', // 导航栏Logo
    outline: {
      label: '本页目录', // 页面内导航标题
      level: 'deep' // 显示所有级别的标题
    },
    docFooter: {
      prev: '上一模块',
      next: '下一模块'
    },
    lastUpdated: {
        text: '最后更新于', // "最后更新"的文本
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'medium'
        }
    },

    // -- 编辑与社交链接 --
    // editLink: {
    //   pattern: 'https://github.com/your-username/your-repo/edit/main/docs/:path', // 让用户可以贡献内容
    //   text: '在 GitHub 上编辑此页'
    // },
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/your-username/your-repo' } // 你的项目仓库链接
    // ],

    // -- 页脚 --
    footer: {
      // message: '基于 MIT 许可发布',
      // copyright: `版权所有 © 2024-${new Date().getFullYear()} Gooboo 社区`
    }
  },

  // --- VitePress 构建配置 ---
  cleanUrls: true, // 生成不带 .html 后缀的简洁URL
  lastUpdated: true, // 开启“最后更新时间”功能

  vite: {
    resolve: {
      alias: {
        // 关键：设置一个别名 '@'，让它指向 'docs' 目录
        // __dirname 指向当前文件所在的目录 (.vitepress)，
        // 所以 path.resolve(__dirname, '..') 就返回到了上一级的 'docs' 目录
        '@': path.resolve(__dirname, '..')
      }
    }
  }
})

/**
 * 辅助函数：创建顶部导航
 */
function createNav() {
  return [
    { text: '首页', link: '/' },
    {
      text: '外部链接',
      items: [
        { text: 'Wiki(Excel)', link: 'https://docs.qq.com/sheet/DQlNPSHdVVkdxZ0l4?tab=0rz4hx' },
        { text: 'FAQ', link: 'https://docs.qq.com/doc/DQlNoUk9kZWFnYVVZ' }
      ]
    }
  ]
}

/**
 * 辅助函数：创建侧边栏
 */
function createSidebar() {
  return [
    {
      text: '主要玩法',
      collapsed: false,
      items: [
        { text: '采矿', link: '/pages/mining/' },
        { text: '村庄', link: '/pages/village/' },
        { text: '部落', link: '/pages/horde/' },
        { text: '农场', link: '/pages/farm/' },
        { text: '画廊', link: '/pages/gallery/' }
      ]
    },
    {
      text: '其他系统',
      collapsed: false,
      items: [
        { text: '笔记', link: '/pages/notes/' },
        { text: '宝石', link: '/pages/gems/' },
        { text: '成就', link: '/pages/achievements/' },
        { text: '学校', link: '/pages/school/' },
        { text: '圣遗物', link: '/pages/relics/' },
        { text: '卡片', link: '/pages/cards/' },
        { text: '将军', link: '/pages/generals/' },
        { text: '事件', link: '/pages/event/' },
        { text: '宝藏', link: '/pages/treasure/' },
        { text: '冷冻实验室', link: '/pages/cryo-lab/' }
      ]
    },
    {
      text: '辅助工具',
      collapsed: false,
      items: [
        { text: '工匠制品收益', link: '/pages/tools/Crafters' },
        { text: '转换器最佳转换节点', link: '/pages/tools/' },
        { text: '气体获取量计算', link: '/pages/tools/' },
        { text: '压腐败所需时间', link: '/pages/tools//pages' }
      ]
    }
  ]
}