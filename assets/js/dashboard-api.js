const API_BASE = new URL("../api/", window.location.href);

export async function fetchLatestMarketData() {
  const response = await fetch(new URL("latest.json", API_BASE), { cache: "no-store" });
  if (!response.ok) throw new Error(`latest.json 加载失败：${response.status}`);
  return response.json();
}

export async function fetchDashboardState() {
  const response = await fetch(new URL("../data/dashboard-state.json", API_BASE), { cache: "no-store" });
  if (!response.ok) throw new Error(`dashboard-state.json 加载失败：${response.status}`);
  return response.json();
}
