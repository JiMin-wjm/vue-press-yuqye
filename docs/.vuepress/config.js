/*
 * @Description: 
 * @Autor: WJM
 * @Date: 2021-05-07 15:41:38
 * @LastEditors: WJM
 * @LastEditTime: 2021-05-11 17:11:09
 */
module.exports = {
  title: '能力开放平台',
  description: ' ',
  themeConfig: {
    nav: [
      { text: '指南', link: '/hbppt4.html' },
      { text: 'API文档', link: '/doe8ua.html' },
    ]
  },
  plugins: [
    [
      require('../../lib'), 
      {
        html: true,
        yuqueLink: true,
        authToken: 'oYo4RCxyAmSqmDqKJDSWwHntQAd2XgqziKrl0oOY',
        repoUrl: 'https://www.yuque.com/wangjimin-87uy9/kb',
        home: {
          actionText: '开始接入',
          actionLink: '/hbppt4.html',
          heroImage: 'https://open.rencaiyoujia.com/doc/hero.png',
          features: [
            { title: '新蓝海', details: '首创人才有价评估系统，按照“四cai”标准 模型，通过大数据和区块链技术，采信400多 项指标将人的信用以“身价”形式呈现' },
            { title: '新价值', details: '“人才有价”评估系统与银行、保险、基金等 机构联动，构筑起“银行授信、保险担保、政 府补偿、基金支持、配套参与的多维金融创新 协同机制。' },
            { title: '新动能', details: '以人才定价为突破口，围绕人力资本价值评估、赋能增值、市场配置、协同创新等产业布局、激发人才的创新创业活力，推进人力资本价值金融化、市场化、社会化。' },
          ],
          footer: `MIT Licensed | Copyright © 2021-present 人才有价`
        }
      }
    ]
  ]
}