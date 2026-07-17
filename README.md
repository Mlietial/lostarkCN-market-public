# 命运方舟国服市场工具

这是一个面向《命运方舟》国服玩家的公开市场参考站，整理宝石、金币、刻印书与礼包相关数据，帮助玩家更直观地比较价格走势和礼包性价比。

访问网站：

[https://mlietial.github.io/lostarkCN-market-public/](https://mlietial.github.io/lostarkCN-market-public/)

## 页面入口

- [礼包分析页](https://mlietial.github.io/lostarkCN-market-public/pages/gift-pack-value.html)
  用金币折算、人民币成本和礼包内容估值，辅助判断礼包是否值得购买。

- [宝石价格指数仪表盘](https://mlietial.github.io/lostarkCN-market-public/pages/gem-dashboard.html)
  查看宝石价格指数、金币行情换算、刻印书价格和近期市场变化。

- [宝石行情终端](https://mlietial.github.io/lostarkCN-market-public/pages/gem-market.html)
  按宝石等级查看价格走势、日涨跌、历史异动和人民币估值。

## 数据说明

网站数据来自人工整理与公开页面发布，主要用于观察趋势和做个人决策参考。市场价格会随服务器、时间、交易方式和供需变化波动，页面展示结果不构成交易承诺或投资建议。

仪表盘公开数据集中在 `data/dashboard-state.json` 中。页面会优先读取该文件；如果数据加载失败，页面会显示错误提示，避免展示过期内容。

## 项目声明

本项目为玩家自用并公开分享的非官方工具，与游戏官方及发行方无从属关系。所有名称、图标和相关素材的权利归其原权利方所有。
