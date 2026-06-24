import { readFile, writeFile } from "node:fs/promises";

async function writeGlobalJson(sourcePath, targetPath, globalName) {
  const text = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(text);
  const body = `window.${globalName} = ${JSON.stringify(parsed, null, 2)};\n`;
  await writeFile(targetPath, body, "utf8");
  console.log(`${targetPath} ready`);
}

await writeGlobalJson("data/dashboard-state.json", "data/dashboard-state.js", "LOSTARK_PUBLIC_DASHBOARD_STATE");
await writeGlobalJson("data/gift-pack-data.json", "data/gift-pack-data.js", "LOSTARK_PUBLIC_GIFT_PACK_DATA");
