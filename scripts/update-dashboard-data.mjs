import { copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
const dashboardDataPath = "data/dashboard-state.json";

function replaceEmbeddedJson(html, scriptId, json) {
  const pattern = new RegExp(`(<script id="${scriptId}" type="application/json">)([\\s\\S]*?)(</script>)`);
  if (!pattern.test(html)) throw new Error(`未找到 ${scriptId} 内嵌数据标签`);
  return html.replace(pattern, (_match, open, _oldJson, close) => open + json + close);
}

async function syncEmbeddedData() {
  const dashboardText = await readFile(dashboardDataPath, "utf8");
  const dashboard = JSON.parse(dashboardText);
  const compactDashboardJson = JSON.stringify(dashboard);
  const compactGoldJson = JSON.stringify({
    publishedAt: dashboard.publishedAt || "",
    goldTxns: Array.isArray(dashboard.goldTxns) ? dashboard.goldTxns : []
  });

  const gemPagePath = "pages/gem-dashboard.html";
  const goldPagePath = "pages/gold-trend.html";
  const gemHtml = await readFile(gemPagePath, "utf8");
  const goldHtml = await readFile(goldPagePath, "utf8");

  await writeFile(gemPagePath, replaceEmbeddedJson(gemHtml, "EMBEDDED_DATA", compactDashboardJson), "utf8");
  await writeFile(goldPagePath, replaceEmbeddedJson(goldHtml, "EMBEDDED_GOLD_DATA", compactGoldJson), "utf8");

  console.log(`已同步内嵌数据：${dashboard.publishedAt || "未记录时间"}`);
}

if (source) {
  if (resolve(source) !== resolve(dashboardDataPath)) {
    await copyFile(source, dashboardDataPath);
  }
} else {
  console.log("未传入新数据文件，使用现有 data/dashboard-state.json 同步页面内嵌数据。");
}

await syncEmbeddedData();
