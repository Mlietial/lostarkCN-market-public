# 命运方舟市场工具公开站

这个仓库用于 GitHub Pages 公开发布：

- 礼包分析页：`/pages/gift-pack-value.html`
- 宝石价格指数仪表盘：`/pages/gem-dashboard.html`
- 完整仪表盘状态：`/data/dashboard-state.json`

## 数据分管

- `data/dashboard-state.json`：仪表盘完整状态，包含宝石、金价、刻印书和设置。
- `data/gem-rows.json`：宝石价格历史。
- `data/gold-transactions.json`：金价交易记录。
- `data/engraving-book-prices.json`：刻印书价格记录。
公开站点为只读展示版，不提供页面上的导入、导出、截图或外部 API 入口。

## 更新数据

把新的完整状态 JSON 放到 `data/dashboard-state.json` 后运行：

```bash
npm run build:data
```

如果你从仪表盘页面里导出了“完整数据备份”，也可以直接：

```bash
npm run update:data -- ./path/to/exported-dashboard-state.json
```

运行后提交并推送即可触发 GitHub Pages 部署。

## 发布到 GitHub

在 GitHub 新建一个空的公开仓库后，把下面的地址替换成你的仓库地址：

```bash
git remote add origin https://github.com/<your-name>/<repo-name>.git
git push -u origin main
```

推送后到仓库的 Settings → Pages，把 Source 设为 GitHub Actions。之后每次推送 `main` 分支都会自动部署。
