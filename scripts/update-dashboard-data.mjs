import { copyFile } from "node:fs/promises";

const source = process.argv[2];
if (!source) {
  console.error("用法：npm run update:data -- ./exported-dashboard-state.json");
  process.exit(1);
}

await copyFile(source, "data/dashboard-state.json");
