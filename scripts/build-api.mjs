import { readFile, writeFile, mkdir } from "node:fs/promises";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const writeJson = async (file, data) => writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
const latestBy = (rows, key) => [...(rows || [])].filter((row) => row && row[key]).sort((a, b) => String(a[key]).localeCompare(String(b[key]))).at(-1) || null;

const state = await readJson("data/dashboard-state.json");
const gemRows = state.gemRows || [];
const goldTxns = state.goldTxns || [];
const engravingBookPrices = state.engravingBookPrices || [];

await mkdir("api", { recursive: true });
await writeJson("data/gem-rows.json", gemRows);
await writeJson("data/gold-transactions.json", goldTxns);
await writeJson("data/engraving-book-prices.json", engravingBookPrices);

const latestGem = latestBy(gemRows, "日期");
const latestGoldDate = goldTxns.map((row) => row && row.date).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))).at(-1) || null;
const latestEngravingDate = engravingBookPrices.map((row) => row && row.date).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))).at(-1) || null;

await writeJson("api/latest.json", {
  generatedAt: new Date().toISOString(),
  sourceVersion: state.version || null,
  latest: {
    gem: latestGem,
    gold: {
      date: latestGoldDate,
      transactions: latestGoldDate ? goldTxns.filter((row) => row.date === latestGoldDate) : []
    },
    engraving: {
      date: latestEngravingDate,
      rows: latestEngravingDate ? engravingBookPrices.filter((row) => row.date === latestEngravingDate) : []
    }
  },
  counts: {
    gemDays: gemRows.length,
    goldTransactions: goldTxns.length,
    engravingRows: engravingBookPrices.length
  },
  endpoints: {
    dashboardState: "../data/dashboard-state.json",
    gemRows: "../data/gem-rows.json",
    goldTransactions: "../data/gold-transactions.json",
    engravingBookPrices: "../data/engraving-book-prices.json"
  }
});
