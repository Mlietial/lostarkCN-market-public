import { copyFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const source = process.argv[2];
if (!source) {
  console.error("用法：npm run update:data -- ./exported-dashboard-state.json");
  process.exit(1);
}

await copyFile(source, "data/dashboard-state.json");
const result = spawnSync(process.execPath, ["scripts/build-api.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);
