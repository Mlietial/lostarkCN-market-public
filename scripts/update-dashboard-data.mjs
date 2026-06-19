import { copyFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
const dashboardDataPath = "data/dashboard-state.json";

async function validateDashboardData() {
  const dashboardText = await readFile(dashboardDataPath, "utf8");
  const dashboard = JSON.parse(dashboardText);
  if (!dashboard || dashboard.version !== 2 || !Array.isArray(dashboard.gemRows) || !Array.isArray(dashboard.goldTxns)) {
    throw new Error("dashboard-state.json format is not supported.");
  }
  console.log(`Dashboard data ready: ${dashboard.publishedAt || "no publishedAt"}`);
}

if (source && resolve(source) !== resolve(dashboardDataPath)) {
  await copyFile(source, dashboardDataPath);
} else if (!source) {
  console.log("No source file provided; validating data/dashboard-state.json.");
}

await validateDashboardData();
