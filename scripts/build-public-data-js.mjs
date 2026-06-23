import { readFile, writeFile } from "node:fs/promises";

async function writeGlobalJson(sourcePath, targetPath, globalName) {
  const text = await readFile(sourcePath, "utf8");
  JSON.parse(text);
  const body = `window.${globalName} = ${text.trim()};\n`;
  await writeFile(targetPath, body, "utf8");
  console.log(`${targetPath} ready`);
}

await writeGlobalJson("data/dashboard-state.json", "data/dashboard-state.js", "LOSTARK_PUBLIC_DASHBOARD_STATE");
await writeGlobalJson("data/gift-pack-data.json", "data/gift-pack-data.js", "LOSTARK_PUBLIC_GIFT_PACK_DATA");
await writeGlobalJson("data/item-price-data.json", "data/item-price-data.js", "LOSTARK_PUBLIC_ITEM_PRICE_DATA");
await writeGlobalJson("data/material-price-history.json", "data/material-price-history.js", "LOSTARK_PUBLIC_MATERIAL_PRICE_HISTORY");
