import { readFile, writeFile } from "node:fs/promises";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const writeJson = async (file, data) => writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");

const state = await readJson("data/dashboard-state.json");

await writeJson("data/gem-rows.json", state.gemRows || []);
await writeJson("data/gold-transactions.json", state.goldTxns || []);
await writeJson("data/engraving-book-prices.json", state.engravingBookPrices || []);
