import { defineConfig } from 'vitepress'

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
    ['link', { rel: 'icon', href: '/favicon.ico' }] // 网站的favicon图标
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
  lastUpdated: true // 开启“最后更新时间”功能
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
        { text: '采矿', link: '/mining/' },
        { text: '村庄', link: '/village/' },
        { text: '部落', link: '/horde/' },
        { text: '农场', link: '/farm/' },
        { text: '画廊', link: '/gallery/' }
      ]
    },
    {
      text: '其他系统',
      collapsed: false,
      items: [
        { text: '笔记', link: '/notes/' },
        { text: '宝石', link: '/gems/' },
        { text: '成就', link: '/achievements/' },
        { text: '学校', link: '/school/' },
        { text: '圣遗物', link: '/relics/' },
        { text: '卡片', link: '/cards/' },
        { text: '将军', link: '/generals/' },
        { text: '事件', link: '/event/' },
        { text: '宝藏', link: '/treasure/' },
        { text: '冷冻实验室', link: '/cryo-lab/' }
      ]
    },
    {
      text: '辅助工具',
      collapsed: false,
      items: [
        { text: '工匠制品收益', link: '/' },
        { text: '转换器最佳转换节点', link: '' },
        { text: '气体获取量计算', link: '' },
        { text: '压腐败所需时间', link: '' }
      ]
    }
  ]
}