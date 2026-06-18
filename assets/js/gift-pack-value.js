const IMG_BASE = "../assets/images/giftpacks/";
const ITEM_ICON_BASE = "../assets/";
const DEFAULTS = {
  goldPerRmb: 4189.67,
  royalPerRmb: 100,
  blueSource: "normal",
  royalDiscount: 1,
  valuationGoldPerRmb: null
};

const EDITABLE_STORAGE_KEYS = {
  pageContent: "giftPackEditablePageContent",
  packOverrides: "giftPackEditablePackOverrides",
  customPacks: "giftPackEditableCustomPacks",
  itemIcons: "giftPackEditableItemIcons",
  deletedPacks: "giftPackEditableDeletedPacks",
  customManualItems: "giftPackCustomManualItems",
  hiddenManualItems: "giftPackHiddenManualItems",
  itemLabels: "giftPackEditableItemLabels",
  choiceOptionQuantities: "giftPackChoiceOptionQuantities",
  rateHistory: "giftPackRateHistory",
  packHistory: "giftPackPackHistory",
  packLinks: "giftPackHistoryLinks"
};

const GIFT_PACK_BACKUP_VERSION = 1;
const PUBLIC_GIFT_PACK_DATA_URL = "../data/gift-pack-data.json";
const PUBLIC_DASHBOARD_DATA_URL = "../data/dashboard-state.json";
const MIN_GIFT_LOADER_MS = 900;
const PUBLIC_DATA_EXPORTED_AT_KEY = "giftPackPublicDataExportedAt";
const GOLD_RATE_MANUAL_OVERRIDE_KEY = "giftPackGoldRateManualOverride";
const GIFT_PACK_EXTRA_STORAGE_KEYS = [
  "giftPackManualValues",
  "giftPackSettings",
  PUBLIC_DATA_EXPORTED_AT_KEY
];

let editablePageContent = loadJson(EDITABLE_STORAGE_KEYS.pageContent, {});
let editablePackOverrides = loadJson(EDITABLE_STORAGE_KEYS.packOverrides, {});
let editableCustomPacks = loadJson(EDITABLE_STORAGE_KEYS.customPacks, []);
let editableItemIcons = loadJson(EDITABLE_STORAGE_KEYS.itemIcons, {});
let editableDeletedPacks = loadJson(EDITABLE_STORAGE_KEYS.deletedPacks, []);
let customManualItems = loadJson(EDITABLE_STORAGE_KEYS.customManualItems, []);
let hiddenManualItems = loadJson(EDITABLE_STORAGE_KEYS.hiddenManualItems, []);
let editableItemLabels = loadJson(EDITABLE_STORAGE_KEYS.itemLabels, {});
let editableChoiceOptionQuantities = loadJson(EDITABLE_STORAGE_KEYS.choiceOptionQuantities, {});
let rateHistory = loadJson(EDITABLE_STORAGE_KEYS.rateHistory, []);
let packHistory = loadJson(EDITABLE_STORAGE_KEYS.packHistory, []);
let packHistoryLinks = loadJson(EDITABLE_STORAGE_KEYS.packLinks, {});
let pageContentDefaults = null;

const BLUE_SOURCES = {
  normal: { label: "普通", blue: 1, royal: 1 },
  weekly: { label: "周优惠", blue: 30000, royal: 28000 },
  monthly: { label: "月优惠", blue: 60000, royal: 52000 }
};

const MANUAL_VALUE_UNITS = {
  gold: "金币",
  royal: "彩钻",
  blue: "蓝钻"
};

const UNKNOWN_ITEMS = [
  "传说炼狱钥匙兑换券",
  "英雄炼狱钥匙兑换券",
  "稀有炼狱钥匙兑换券",
  "幻境挑战次数+1兑换券",
  "遗物核心自选箱子",
  "造物战斗刻印书自选袋子",
  "传说卡牌礼物4",
  "飞翔之石刻印自定套件"
];

const itemPrices = {
  "命运碎片袋子（小）": { gold: 59, note: "拍卖单价" },
  "命运碎片袋子（中）": { gold: 135, note: "拍卖单价" },
  "命运碎片袋子（大）": { gold: 181, note: "拍卖单价" },
  "冰川之息": { gold: 144, note: "拍卖单价" },
  "熔岩之息": { gold: 240, note: "拍卖单价" },
  "命运破坏石": { gold: 332 / 100, note: "332金/100个" },
  "命运守护石": { gold: 6 / 100, note: "6金/100个" },
  "命运突破石": { gold: 7, note: "拍卖单价" },
  "阿比多斯融合材料": { gold: 82, note: "拍卖单价" },
  "高级-英雄星石箱子": { gold: 2500, note: "拍卖/市场估值" },
  "稀有-英雄星石箱子": { gold: 7000, note: "拍卖/市场估值" },
  "星石加工初始化券": { blue: 1600, note: "1600蓝钻折算" },
  "星石加工初始化/重置券": { blue: 1600, note: "1600蓝钻折算" },
  "星石加工重置券": { blue: 1600, note: "1600蓝钻折算" },
  "加工星石属性刷新券": { blue: 300, note: "300蓝钻折算" },
  "4阶融合材料自选箱子": { components: [{ name: "阿比多斯融合材料", qty: 5 }], note: "阿比多斯融合材料×5" },
  "4阶破坏石自选箱子": { components: [{ name: "命运破坏石", qty: 50 }], note: "命运破坏石×50" },
  "4阶守护石自选箱子": { components: [{ name: "命运守护石", qty: 50 }], note: "命运守护石×50" },
  "4阶碎片自选箱子": { components: [{ name: "命运碎片袋子（中）", qty: 1 }], note: "命运碎片袋子（中）×1" },
  "4阶突破石自选箱子": { components: [{ name: "命运突破石", qty: 5 }], note: "命运突破石×5" },
  "冰川之息箱子": { components: [{ name: "冰川之息", qty: 5 }], note: "冰川之息×5" },
  "熔岩之息箱子": { components: [{ name: "熔岩之息", qty: 5 }], note: "熔岩之息×5" }
};

const img = name => IMG_BASE + name;
const icon = name => ITEM_ICON_BASE + name;
const item = (name, qty, options = {}) => ({ name, qty, ...options });

const itemIcons = {
  "遗物核心自选箱子": icon("_0000_遗物核心箱子.jpg"),
  "英雄炼狱钥匙兑换券": icon("_0000_英雄炼狱钥匙.jpg"),
  "幻境挑战次数+1兑换券": icon("幻境券.jpg"),
  "飞翔之石刻印自定套件": icon("飞翔之刻印自定套件.jpg"),
  "稀有炼狱钥匙兑换券": icon("_0001_稀有炼狱钥匙兑换券.jpg"),
  "传说卡牌礼物4": icon("_0002_传说卡牌礼物4.jpg"),
  "造物战斗刻印书自选袋子": icon("_0003_遗物战斗刻印书箱子.jpg"),
  "传说炼狱钥匙兑换券": icon("_0004_传说炼狱钥匙兑换券.jpg"),
  "加工星石属性刷新券": icon("_0005_加工星石属性刷新券.jpg"),
  "4阶突破石自选箱子": icon("_0006_突破石箱子.jpg"),
  "冰川之息箱子": icon("_0007_冰川之息箱子.jpg"),
  "熔岩之息箱子": icon("_0008_熔岩之息箱子.jpg"),
  "稀有-英雄星石箱子": icon("_0009_稀有~英雄星石箱子.jpg"),
  "高级-英雄星石箱子": icon("_0009_稀有~英雄星石箱子.jpg"),
  "星石加工初始化券": icon("_0010_星石加工初始化券.jpg"),
  "星石加工初始化/重置券": icon("_0010_星石加工初始化券.jpg"),
  "星石加工重置券": icon("_0010_星石加工初始化券.jpg"),
  "4阶融合材料自选箱子": icon("_0011_融合材料箱子.jpg"),
  "4阶碎片自选箱子": icon("_0012_碎片箱子.jpg"),
  "4阶精炼辅助材料自选箱子": icon("_0013_精炼辅助材料自选箱子.jpg"),
  "4阶守护石自选箱子": icon("_0014_守护石箱子.jpg"),
  "4阶破坏石自选箱子": icon("_0010_破坏石箱子.jpg"),
  "英雄星石箱子": icon("_0016_英雄星石箱子.jpg"),
  "英雄星石自选箱子": icon("_0016_英雄星石箱子.jpg")
};

const inferredItemIconFiles = [
  ["破坏石", "_0010_破坏石箱子.jpg"],
  ["守护石", "_0014_守护石箱子.jpg"],
  ["融合材料", "_0011_融合材料箱子.jpg"],
  ["精炼辅助", "_0013_精炼辅助材料自选箱子.jpg"],
  ["碎片", "_0012_碎片箱子.jpg"],
  ["突破石", "_0006_突破石箱子.jpg"],
  ["冰川之息", "_0007_冰川之息箱子.jpg"],
  ["熔岩之息", "_0008_熔岩之息箱子.jpg"],
  ["稀有-英雄星石", "_0009_稀有~英雄星石箱子.jpg"],
  ["稀有~英雄星石", "_0009_稀有~英雄星石箱子.jpg"],
  ["英雄星石", "_0016_英雄星石箱子.jpg"],
  ["星石加工", "_0010_星石加工初始化券.jpg"],
  ["属性刷新", "_0005_加工星石属性刷新券.jpg"],
  ["传说炼狱钥匙", "_0004_传说炼狱钥匙兑换券.jpg"],
  ["稀有炼狱钥匙", "_0001_稀有炼狱钥匙兑换券.jpg"],
  ["英雄炼狱钥匙", "_0000_英雄炼狱钥匙.jpg"],
  ["遗物核心", "_0000_遗物核心箱子.jpg"],
  ["战斗刻印", "_0003_遗物战斗刻印书箱子.jpg"],
  ["传说卡牌礼物", "_0002_传说卡牌礼物4.jpg"],
  ["幻境", "幻境券.jpg"],
  ["飞翔", "飞翔之刻印自定套件.jpg"]
];

const giftPacks = [
  {
    id: "rare-hero-star-50",
    name: "[50]稀有-英雄星石箱子",
    currency: "royal",
    price: 14800,
    image: img("[50]稀有~英雄星石箱子-外观（星石限时礼包1）.jpg"),
    detailImages: [img("[50]稀有~英雄星石箱子-内容（星石限时礼包1）.jpg")],
    contents: [item("稀有-英雄星石箱子", 50)]
  },
  {
    id: "hero-star-7",
    name: "[7]英雄星石箱子",
    currency: "royal",
    price: 20700,
    image: img("[7]英雄星石箱子-外观（星石限时礼包1）.jpg"),
    detailImages: [img("[7]英雄星石箱子-内容（星石限时礼包1）.jpg")],
    contents: [item("英雄星石箱子", 7)]
  },
  {
    id: "hero-star-choice-3",
    name: "[3]英雄星石自选箱子",
    currency: "royal",
    price: 20000,
    image: img("[3]英雄星石自选箱子-外观（星石限时礼包1）.jpg"),
    detailImages: [img("[3]英雄星石自选箱子-内容（星石限时礼包1）.jpg")],
    contents: [item("英雄星石自选箱子", 3)]
  },
  {
    id: "star-reset-10",
    name: "[10]星石加工初始化/重置券",
    currency: "royal",
    price: 14000,
    image: img("[10]星石加工重置券-外观（星石限时礼包1）.jpg"),
    detailImages: [img("[10]星石加工重置券-内容（星石限时礼包1）.jpg")],
    contents: [item("星石加工初始化券", 10)]
  },
  {
    id: "combo-star-house-1",
    name: "奖励屋星石限时礼包Ⅰ整套 + 回馈赠礼Ⅰ",
    currency: "royal",
    price: 14800 + 20700 + 20000 + 14000,
    isCombo: true,
    image: img("星石限时礼包1-回馈赠礼-外观.jpg"),
    detailImages: [
      img("星石限时礼包1-回馈赠礼-内容.jpg"),
      img("[50]稀有~英雄星石箱子-内容（星石限时礼包1）.jpg"),
      img("[7]英雄星石箱子-内容（星石限时礼包1）.jpg"),
      img("[3]英雄星石自选箱子-内容（星石限时礼包1）.jpg"),
      img("[10]星石加工重置券-内容（星石限时礼包1）.jpg")
    ],
    contents: [
      item("稀有-英雄星石箱子", 50),
      item("英雄星石箱子", 7),
      item("英雄星石自选箱子", 3),
      item("星石加工初始化券", 10),
      item("加工星石属性刷新券", 10),
      item("遗物核心自选箱子", 1, { unknown: true })
    ],
    note: "组合用于判断整套回馈，不与单品重复累计。"
  },
  {
    id: "fusion-t4-600",
    name: "[600]T4融合材料自选箱子",
    currency: "royal",
    price: 6500,
    image: img("[600]T4融合材料选择箱子-外观（材料限时礼包1）.jpg"),
    detailImages: [img("[600]T4融合材料选择箱子-内容（材料限时礼包1）.jpg")],
    contents: [item("4阶融合材料自选箱子", 600)]
  },
  {
    id: "glacier-350",
    name: "[350]冰川之息箱子",
    currency: "royal",
    price: 6700,
    image: img("[350]冰川之息箱子-外观（材料限时礼包1）.jpg"),
    detailImages: [img("[350]冰川之息箱子-内容（材料限时礼包1）.jpg")],
    contents: [item("冰川之息箱子", 350)]
  },
  {
    id: "lava-250",
    name: "[250]熔岩之息箱子",
    currency: "royal",
    price: 6300,
    image: img("[250]熔岩之息箱子-外观（材料限时礼包1）.jpg"),
    detailImages: [img("[250]熔岩之息箱子-内容（材料限时礼包1）.jpg")],
    contents: [item("熔岩之息箱子", 250)]
  },
  {
    id: "destruction-t4-2500",
    name: "[2500]T4破坏石自选箱子",
    currency: "royal",
    price: 9000,
    image: img("[2500]T4破坏石选择箱子-外观（材料限时礼包1）.jpg"),
    detailImages: [img("[2500]T4破坏石选择箱子-内容（材料限时礼包1）.jpg")],
    contents: [item("4阶破坏石自选箱子", 2500)]
  },
  {
    id: "combo-material-house-1",
    name: "奖励屋材料限时礼包Ⅱ整套 + 回馈赠礼Ⅱ",
    currency: "royal",
    price: 6500 + 6700 + 6300 + 9000,
    isCombo: true,
    image: img("材料限时礼包1-回馈赠礼-外观.jpg"),
    detailImages: [
      img("材料限时礼包1-回馈赠礼-内容1.jpg"),
      img("材料限时礼包1-回馈赠礼-内容2.jpg"),
      img("[600]T4融合材料选择箱子-内容（材料限时礼包1）.jpg"),
      img("[350]冰川之息箱子-内容（材料限时礼包1）.jpg"),
      img("[250]熔岩之息箱子-内容（材料限时礼包1）.jpg"),
      img("[2500]T4破坏石选择箱子-内容（材料限时礼包1）.jpg")
    ],
    contents: [
      item("4阶融合材料自选箱子", 600),
      item("冰川之息箱子", 350),
      item("熔岩之息箱子", 250),
      item("4阶破坏石自选箱子", 2500),
      item("稀有炼狱钥匙兑换券", 3, { unknown: true }),
      item("传说炼狱钥匙兑换券", 2, { unknown: true })
    ],
    note: "组合用于判断整套回馈，不与单品重复累计。"
  },
  {
    id: "refine-support-3for1",
    name: "[3赠1]精炼支援礼包",
    currency: "royal",
    price: 8800,
    threeForOne: true,
    image: img("[3赠1]精炼支援礼包-外观.jpg"),
    detailImages: [
      img("[3赠1]精炼支援礼包-内容1.jpg"),
      img("[3赠1]精炼支援礼包-内容2.jpg"),
      img("[3赠1]精炼支援礼包-内容3.jpg"),
      img("[3赠1]精炼支援礼包-内容4.jpg"),
      img("[3赠1]精炼支援礼包-内容5.jpg")
    ],
    contents: [
      item("4阶破坏石自选箱子", 350),
      item("4阶守护石自选箱子", 5000),
      item("4阶精炼辅助材料自选箱子", 120),
      item("4阶碎片自选箱子", 350),
      item("4阶融合材料自选箱子", 350)
    ]
  },
  {
    id: "blue-star-support",
    name: "蓝钻星石支援包",
    currency: "blue",
    price: 2800,
    image: img("蓝钻星石支援包-外观.jpg"),
    detailImages: [
      img("蓝钻星石支援包-内容1.jpg"),
      img("蓝钻星石支援包-内容2.jpg"),
      img("蓝钻星石支援包-内容3.jpg"),
      img("蓝钻星石支援包-内容4.jpg")
    ],
    contents: [
      item("高级-英雄星石箱子", 5),
      item("稀有-英雄星石箱子", 1),
      item("星石加工初始化券", 1),
      item("加工星石属性刷新券", 3)
    ]
  },
  {
    id: "weekly-star-gas",
    name: "[周]星石加油包",
    currency: "royal",
    price: 900,
    image: img("[周]星石加油包-外观.jpg"),
    detailImages: [img("[周]星石加油包-内容1.jpg"), img("[周]星石加油包-内容2.jpg")],
    contents: [item("高级-英雄星石箱子", 7), item("稀有-英雄星石箱子", 2)]
  },
  {
    id: "weekly-star-supply",
    name: "[周]星石补给包",
    currency: "royal",
    price: 15000,
    image: img("[周]星石补给包-外观.jpg"),
    detailImages: [
      img("[周]星石补给包-内容1.jpg"),
      img("[周]星石补给包-内容2.jpg"),
      img("[周]星石补给包-内容3.jpg")
    ],
    contents: [
      item("英雄星石箱子", 4),
      item("稀有-英雄星石箱子", 5),
      item("加工星石属性刷新券", 7)
    ]
  },
  {
    id: "lucky-material-random",
    name: "[限购]幸运材料随机箱子",
    currency: "royal",
    price: 1500,
    isRandom: true,
    image: img("[限购]幸运材料随机箱子-外观.jpg"),
    detailImages: Array.from({ length: 14 }, (_, i) => img(`[限购]幸运材料随机箱子-内容${i + 1}.jpg`)),
    randomResults: [
      [item("造物战斗刻印书自选袋子", 1, { unknown: true })],
      [item("传说卡牌礼物4", 1, { unknown: true })],
      [item("英雄星石自选箱子", 1)],
      [item("传说炼狱钥匙兑换券", 1, { unknown: true })],
      [item("英雄星石箱子", 1)],
      [item("英雄炼狱钥匙兑换券", 1, { unknown: true })],
      [item("稀有炼狱钥匙兑换券", 2, { unknown: true })],
      [item("飞翔之石刻印自定套件", 15, { unknown: true })],
      [item("4阶破坏石自选箱子", 450)],
      [item("4阶融合材料自选箱子", 100)]
    ],
    contents: []
  },
  {
    id: "hell-key-3for1",
    name: "[3赠1]炼狱钥匙礼包",
    currency: "royal",
    price: 7100,
    threeForOne: true,
    image: img("[3赠1]炼狱钥匙礼包-外观.jpg"),
    detailImages: [img("英雄炼狱钥匙.jpg"), img("幻境券.jpg")],
    contents: [
      item("幻境挑战次数+1兑换券", 3, { unknown: true }),
      item("稀有炼狱钥匙兑换券", 2, { unknown: true }),
      item("英雄炼狱钥匙兑换券", 1, { unknown: true }),
      item("传说炼狱钥匙兑换券", 1, { unknown: true })
    ],
    note: "钥匙没有默认市价，详情显示回本线。"
  },
  {
    id: "kazeroth-choice",
    name: "[限购]卡杰洛斯自选礼包",
    currency: "royal",
    price: 28800,
    isSelfSelect: true,
    chooseCount: 5,
    image: img("[限购]卡杰洛斯自选礼包-外观.jpg"),
    detailImages: Array.from({ length: 10 }, (_, i) => img(`[限购]卡杰洛斯自选礼包-内容${i + 1}.jpg`)),
    contents: [],
    options: [
      item("4阶破坏石自选箱子", 1000),
      item("4阶守护石自选箱子", 4500),
      item("4阶碎片自选箱子", 600),
      item("4阶突破石自选箱子", 800),
      item("4阶融合材料自选箱子", 300),
      item("星石加工初始化券", 3),
      item("加工星石属性刷新券", 15),
      item("英雄星石箱子", 2),
      item("英雄星石自选箱子", 2),
      item("传说炼狱钥匙兑换券", 2, { unknown: true })
    ],
    defaultSelected: [
      "英雄星石自选箱子",
      "英雄星石箱子",
      "星石加工初始化券",
      "加工星石属性刷新券",
      "4阶破坏石自选箱子"
    ]
  }
];

const state = {
  ...loadSettings(),
  filter: "all",
  sortDesc: true,
  manualValues: loadManualValues(),
  selectedManualItem: null,
  manualSearchQuery: "",
  manualSort: "name-asc",
  manualScrollToSelected: false,
  selectedPackId: null,
  selectedOptions: {},
  selectedChoiceGroups: {},
  selectedIncludedItems: {},
  knownIncludedItemKeys: {},
  editingPackId: null,
  showEditColumn: false,
  publicDataExportedAt: localStorage.getItem(PUBLIC_DATA_EXPORTED_AT_KEY) || null
};

migrateChoiceOptionQuantities();

for (const pack of getGiftPacks()) {
  initializePackSelections(pack);
}

function setGiftPageLoadState(stateName, message) {
  document.body.classList.toggle("gift-loading", stateName === "loading");
  document.body.classList.toggle("gift-ready", stateName === "ready");
  document.body.classList.toggle("gift-error", stateName === "error");
  const text = document.getElementById("giftPageLoaderText");
  if (text && message) text.textContent = message;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseStoredGiftPackSettings() {
  try {
    return JSON.parse(localStorage.getItem("giftPackSettings") || "{}");
  } catch (error) {
    return {};
  }
}

function getUserGoldRateOverride() {
  if (localStorage.getItem(GOLD_RATE_MANUAL_OVERRIDE_KEY) !== "true") return null;
  const value = Number(parseStoredGiftPackSettings().goldPerRmb);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function applyGoldRate(value, options = {}) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0) return false;
  state.goldPerRmb = Math.round(rate * 100) / 100;
  if (!state.valuationGoldBaseLocked) state.valuationGoldPerRmb = state.goldPerRmb;
  if (options.updatedAt) state.settingsUpdatedAt = options.updatedAt;
  return true;
}

function renderRateControls() {
  const goldRateInput = document.getElementById("goldRateInput");
  const valuationGoldRateInput = document.getElementById("valuationGoldRateInput");
  if (goldRateInput) goldRateInput.value = state.goldPerRmb;
  if (valuationGoldRateInput) valuationGoldRateInput.value = state.valuationGoldPerRmb;
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function hasLocalGiftPackEdits() {
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  };
  const packOverrides = read(EDITABLE_STORAGE_KEYS.packOverrides, {});
  const customPacks = read(EDITABLE_STORAGE_KEYS.customPacks, []);
  const deletedPacks = read(EDITABLE_STORAGE_KEYS.deletedPacks, []);
  return Object.keys(packOverrides || {}).length > 0
    || customPacks.length > 0
    || deletedPacks.length > 0;
}

function giftPackStorageKeys() {
  return [...new Set([
    ...Object.values(EDITABLE_STORAGE_KEYS),
    ...GIFT_PACK_EXTRA_STORAGE_KEYS
  ])];
}

function buildGiftPackBackup() {
  const storage = {};
  giftPackStorageKeys().forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) storage[key] = value;
  });
  return {
    app: "lostark-gift-pack-value",
    version: GIFT_PACK_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storage,
    snapshot: {
      settings: {
        goldPerRmb: state.goldPerRmb,
        royalPerRmb: state.royalPerRmb,
        blueSource: state.blueSource,
        royalDiscount: state.royalDiscount,
        valuationGoldPerRmb: state.valuationGoldPerRmb,
        valuationGoldBaseLocked: !!state.valuationGoldBaseLocked,
        settingsUpdatedAt: state.settingsUpdatedAt
      },
      manualValues: state.manualValues,
      packs: getGiftPacks()
    }
  };
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportGiftPackData() {
  const date = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`gift-pack-data-${date}.json`, buildGiftPackBackup());
}

function stringifyBackupValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value ?? null);
}

function stringifyStorageValue(key, value) {
  if (key === PUBLIC_DATA_EXPORTED_AT_KEY && typeof value === "string") return JSON.stringify(value);
  return stringifyBackupValue(value);
}

function normalizeGiftPackBackupStorage(backup) {
  if (!backup || typeof backup !== "object") throw new Error("invalid backup");
  const storage = {};
  const allowedKeys = giftPackStorageKeys();
  if (backup.storage && typeof backup.storage === "object") {
    allowedKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(backup.storage, key) && backup.storage[key] !== undefined) {
        storage[key] = stringifyStorageValue(key, backup.storage[key]);
      }
    });
  }
  if (backup.editable && typeof backup.editable === "object") {
    Object.entries(EDITABLE_STORAGE_KEYS).forEach(([name, key]) => {
      if (Object.prototype.hasOwnProperty.call(backup.editable, name)) {
        storage[key] = stringifyBackupValue(backup.editable[name]);
      }
    });
  }
  if (Object.prototype.hasOwnProperty.call(backup, "manualValues")) {
    storage.giftPackManualValues = stringifyBackupValue(backup.manualValues);
  }
  if (Object.prototype.hasOwnProperty.call(backup, "settings")) {
    storage.giftPackSettings = stringifyBackupValue(backup.settings);
  }
  return storage;
}

function validateGiftPackBackupStorage(storage) {
  const entries = Object.entries(storage);
  if (!entries.length) throw new Error("empty backup");
  entries.forEach(([key, value]) => {
    if (!giftPackStorageKeys().includes(key)) return;
    JSON.parse(value);
  });
}

async function fetchPublicGiftPackBackup() {
  const readEmbeddedBackup = () => {
    try {
      const text = document.getElementById("EMBEDDED_GIFT_PACK_DATA")?.textContent || "";
      return text ? JSON.parse(text) : null;
    } catch (error) {
      return null;
    }
  };
  let backup = null;
  if (location.protocol === "file:") {
    backup = readEmbeddedBackup();
  } else {
    try {
      const response = await fetch(`${PUBLIC_GIFT_PACK_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      backup = await response.json();
    } catch (error) {
      backup = readEmbeddedBackup();
      if (!backup) throw error;
    }
  }
  if (!backup) throw new Error("没有可用的内嵌礼包数据");
  const storage = normalizeGiftPackBackupStorage(backup);
  validateGiftPackBackupStorage(storage);
  return { backup, storage };
}

function applyPublicGiftPackSnapshot(backup, storage, options = {}) {
  const forceAuthorPacks = !!options.forceAuthorPacks;
  const hadLocalGiftPackEdits = hasLocalGiftPackEdits();
  const userGoldRate = getUserGoldRateOverride();
  const userSettings = parseStoredGiftPackSettings();
  const userManualValues = loadManualValues();
  const userChoiceOptionQuantities = editableChoiceOptionQuantities;
  const localPackOverrides = editablePackOverrides;
  const localCustomPacks = editableCustomPacks;
  const localDeletedPacks = editableDeletedPacks;
  applyGiftPackBackupStorage(storage, false);
  state.manualValues = { ...state.manualValues, ...userManualValues };
  editableChoiceOptionQuantities = { ...editableChoiceOptionQuantities, ...userChoiceOptionQuantities };
  if (userGoldRate) {
    applyGoldRate(userGoldRate, { updatedAt: userSettings.settingsUpdatedAt || state.settingsUpdatedAt });
    if (userSettings.valuationGoldBaseLocked && Number(userSettings.valuationGoldPerRmb) > 0) {
      state.valuationGoldBaseLocked = true;
      state.valuationGoldPerRmb = Number(userSettings.valuationGoldPerRmb);
    }
  }
  const shouldApplyAuthorPacks = forceAuthorPacks || !hadLocalGiftPackEdits;
  if (shouldApplyAuthorPacks && Array.isArray(backup.snapshot?.packs) && !Object.prototype.hasOwnProperty.call(storage, EDITABLE_STORAGE_KEYS.customPacks)) {
    const defaultIds = new Set(giftPacks.map(pack => pack.id));
    const nextOverrides = {};
    const nextCustomPacks = [];
    backup.snapshot.packs.forEach(pack => {
      if (!pack?.id) return;
      if (defaultIds.has(pack.id)) nextOverrides[pack.id] = sanitizePack(pack, giftPacks.find(item => item.id === pack.id));
      else nextCustomPacks.push(sanitizePack(pack));
    });
    editablePackOverrides = nextOverrides;
    editableCustomPacks = nextCustomPacks;
    editableDeletedPacks = [];
    if (forceAuthorPacks) {
      localStorage.removeItem(EDITABLE_STORAGE_KEYS.packOverrides);
      localStorage.removeItem(EDITABLE_STORAGE_KEYS.customPacks);
      localStorage.removeItem(EDITABLE_STORAGE_KEYS.deletedPacks);
    }
  } else if (!forceAuthorPacks && hadLocalGiftPackEdits) {
    editablePackOverrides = localPackOverrides;
    editableCustomPacks = localCustomPacks;
    editableDeletedPacks = localDeletedPacks;
  }
  if (backup.exportedAt) {
    state.publicDataExportedAt = backup.exportedAt;
    localStorage.setItem(PUBLIC_DATA_EXPORTED_AT_KEY, backup.exportedAt);
  }
  for (const pack of getGiftPacks()) {
    initializePackSelections(pack);
  }
  renderAuthorDataStatus();
}

function applyGiftPackBackupStorage(storage, persist = false) {
  const parse = key => {
    if (!Object.prototype.hasOwnProperty.call(storage, key)) return undefined;
    try {
      return JSON.parse(storage[key]);
    } catch (error) {
      return undefined;
    }
  };
  const pageContent = parse(EDITABLE_STORAGE_KEYS.pageContent);
  const packOverrides = parse(EDITABLE_STORAGE_KEYS.packOverrides);
  const customPacks = parse(EDITABLE_STORAGE_KEYS.customPacks);
  const itemIcons = parse(EDITABLE_STORAGE_KEYS.itemIcons);
  const deletedPacks = parse(EDITABLE_STORAGE_KEYS.deletedPacks);
  const customItems = parse(EDITABLE_STORAGE_KEYS.customManualItems);
  const hiddenItems = parse(EDITABLE_STORAGE_KEYS.hiddenManualItems);
  const itemLabels = parse(EDITABLE_STORAGE_KEYS.itemLabels);
  const choiceOptionQuantities = parse(EDITABLE_STORAGE_KEYS.choiceOptionQuantities);
  const rates = parse(EDITABLE_STORAGE_KEYS.rateHistory);
  const packs = parse(EDITABLE_STORAGE_KEYS.packHistory);
  const links = parse(EDITABLE_STORAGE_KEYS.packLinks);
  const manualValues = parse("giftPackManualValues");
  const settings = parse("giftPackSettings");
  const publicDataExportedAt = parse(PUBLIC_DATA_EXPORTED_AT_KEY);

  if (pageContent && typeof pageContent === "object") editablePageContent = pageContent;
  if (packOverrides && typeof packOverrides === "object") editablePackOverrides = packOverrides;
  if (Array.isArray(customPacks)) editableCustomPacks = customPacks;
  if (itemIcons && typeof itemIcons === "object") editableItemIcons = itemIcons;
  if (Array.isArray(deletedPacks)) editableDeletedPacks = deletedPacks;
  if (Array.isArray(customItems)) customManualItems = customItems;
  if (Array.isArray(hiddenItems)) hiddenManualItems = hiddenItems;
  if (itemLabels && typeof itemLabels === "object") editableItemLabels = itemLabels;
  if (choiceOptionQuantities && typeof choiceOptionQuantities === "object") editableChoiceOptionQuantities = choiceOptionQuantities;
  if (Array.isArray(rates)) rateHistory = rates;
  if (Array.isArray(packs)) packHistory = packs;
  if (links && typeof links === "object") packHistoryLinks = links;
  if (manualValues && typeof manualValues === "object") state.manualValues = manualValues;
  if (typeof publicDataExportedAt === "string") state.publicDataExportedAt = publicDataExportedAt;
  if (settings && typeof settings === "object") {
    const goldPerRmb = Number(settings.goldPerRmb);
    const royalPerRmb = Number(settings.royalPerRmb);
    const royalDiscount = Number(settings.royalDiscount);
    const valuationGoldPerRmb = Number(settings.valuationGoldPerRmb);
    if (Number.isFinite(goldPerRmb) && goldPerRmb > 0) state.goldPerRmb = goldPerRmb;
    if (Number.isFinite(royalPerRmb) && royalPerRmb > 0) state.royalPerRmb = royalPerRmb;
    if (BLUE_SOURCES[settings.blueSource]) state.blueSource = settings.blueSource;
    if (Number.isFinite(royalDiscount) && royalDiscount > 0) state.royalDiscount = royalDiscount;
    state.valuationGoldBaseLocked = !!settings.valuationGoldBaseLocked;
    state.valuationGoldPerRmb = Number.isFinite(valuationGoldPerRmb) && valuationGoldPerRmb > 0
      ? valuationGoldPerRmb
      : state.goldPerRmb;
    state.settingsUpdatedAt = settings.settingsUpdatedAt || null;
  }
  if (persist) {
    giftPackStorageKeys().forEach(key => localStorage.removeItem(key));
    Object.entries(storage).forEach(([key, value]) => localStorage.setItem(key, value));
  }
  for (const pack of getGiftPacks()) {
    initializePackSelections(pack);
  }
}

async function importGiftPackData(file) {
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    const storage = normalizeGiftPackBackupStorage(backup);
    validateGiftPackBackupStorage(storage);
    const count = Object.keys(storage).length;
    if (!window.confirm(`导入会覆盖本浏览器里的礼包编辑数据，共 ${count} 项。继续？`)) return;
    applyGiftPackBackupStorage(storage, true);
    window.alert("礼包数据已导入，页面将刷新。");
    window.location.reload();
  } catch (error) {
    console.error(error);
    window.alert("导入失败：请选择由礼包页导出的 JSON 数据文件。");
  }
}

async function loadPublicGiftPackData() {
  try {
    const { backup, storage } = await fetchPublicGiftPackBackup();
    applyPublicGiftPackSnapshot(backup, storage, { forceAuthorPacks: false });
  } catch (error) {
    console.warn("礼包公开数据加载失败：", error);
    throw new Error(`gift-pack-data.json 加载失败：${error.message || error}`);
  }
}

function latestAuctionGoldRateFromDashboard(payload) {
  const txns = Array.isArray(payload?.goldTxns) ? payload.goldTxns : [];
  const auctions = txns
    .map(txn => ({
      date: String(txn?.date || ""),
      rate: Number(txn?.gold) / Number(txn?.price),
      type: txn?.type
    }))
    .filter(txn => txn.type === "拍卖交易" && txn.date && Number.isFinite(txn.rate) && txn.rate > 0);
  if (!auctions.length) return null;
  const latestDate = auctions.reduce((latest, txn) => txn.date > latest ? txn.date : latest, auctions[0].date);
  const latestRates = auctions.filter(txn => txn.date === latestDate).map(txn => txn.rate);
  return {
    date: latestDate,
    rate: Math.max(...latestRates)
  };
}

async function syncGoldRateFromDashboard(options = {}) {
  const force = !!options.force;
  if (!force && getUserGoldRateOverride()) return { synced: false, skipped: "manual" };
  try {
    const response = await fetch(`${PUBLIC_DASHBOARD_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const latest = latestAuctionGoldRateFromDashboard(payload);
    if (!latest) return { synced: false, skipped: "empty" };
    applyGoldRate(latest.rate, { updatedAt: payload.publishedAt || latest.date });
    if (options.persist) {
      localStorage.removeItem(GOLD_RATE_MANUAL_OVERRIDE_KEY);
      saveSettings({ preserveTimestamp: true });
    }
    renderRateControls();
    renderRateTimestamp();
    renderAuthorDataStatus();
    return { synced: true, rate: state.goldPerRmb, date: latest.date };
  } catch (error) {
    console.warn("金价公开数据同步失败：", error);
    return { synced: false, error };
  }
}

async function preloadImage(src) {
  if (!src) return;
  await new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

async function preloadGiftPackImages() {
  const iconSources = [];
  getGiftPacks().forEach(pack => {
    modalDisplayItems(pack).forEach(item => {
      const path = resolveItemIconPath(item.name);
      if (path) iconSources.push(path);
    });
  });
  const sources = [...new Set([
    ...getGiftPacks().map(pack => pack.image).filter(Boolean),
    ...iconSources
  ])];
  const limit = 4;
  for (let i = 0; i < sources.length; i += limit) {
    await Promise.all(sources.slice(i, i + limit).map(preloadImage));
  }
}

function sanitizePack(raw, fallback = {}) {
  const contents = Array.isArray(raw.contents) ? raw.contents : fallback.contents || [];
  const options = Array.isArray(raw.options) ? raw.options : fallback.options || [];
  const randomResults = Array.isArray(raw.randomResults) ? raw.randomResults : fallback.randomResults || [];
  const choiceGroups = Array.isArray(raw.choiceGroups) ? raw.choiceGroups : fallback.choiceGroups || [];
  return migratePackRules({
    ...fallback,
    ...raw,
    id: raw.id || fallback.id || `custom-${Date.now()}`,
    name: String(raw.name || fallback.name || "自定义礼包"),
    currency: raw.currency === "blue" ? "blue" : "royal",
    price: Number(raw.price ?? fallback.price) || 0,
    image: raw.image ?? fallback.image ?? "",
    detailImages: Array.isArray(raw.detailImages) ? raw.detailImages.filter(Boolean) : fallback.detailImages || [],
    contents: contents
      .filter(content => content && content.name)
      .map(content => ({ name: String(content.name), qty: Number(content.qty) || 1 })),
    options: options
      .filter(content => content && content.name)
      .map(content => ({ name: String(content.name), qty: Number(content.qty) || 1, unknown: !!content.unknown })),
    randomResults: randomResults.map(result => Array.isArray(result)
      ? result.filter(content => content && content.name).map(content => ({ name: String(content.name), qty: Number(content.qty) || 1, unknown: !!content.unknown }))
      : []),
    choiceGroups: choiceGroups
      .filter(group => group && group.id && Array.isArray(group.options) && group.options.length)
      .map(group => ({
        id: String(group.id),
        name: String(group.name || "可选内容"),
        qty: Number(group.qty) || 1,
        defaultSelected: String(group.defaultSelected || group.options[0]?.name || ""),
        options: group.options
          .filter(option => option && option.name)
          .map(option => ({ name: String(option.name), qty: Number(option.qty) || 1, unknown: !!option.unknown }))
      })),
    defaultSelected: Array.isArray(raw.defaultSelected) ? raw.defaultSelected : fallback.defaultSelected || [],
    chooseCount: Number(raw.chooseCount ?? fallback.chooseCount) || 5,
    note: raw.note ?? fallback.note ?? "",
    expired: !!(raw.expired ?? fallback.expired),
    threeForOne: !!(raw.threeForOne ?? fallback.threeForOne),
    isCombo: !!(raw.isCombo ?? fallback.isCombo),
    isRandom: !!(raw.isRandom ?? fallback.isRandom),
    isSelfSelect: !!(raw.isSelfSelect ?? fallback.isSelfSelect),
    isCustom: !!(raw.isCustom ?? fallback.isCustom)
  });
}

function migratePackRules(pack) {
  return migrateRefineSupportChoiceGroups(pack);
}

function migrateRefineSupportChoiceGroups(pack) {
  const sourceName = "4阶精炼辅助材料自选箱子";
  const malformedMarker = "?".repeat(4);
  const legacyContent = (pack.contents || []).find(content => content.name === sourceName);
  const isLegacyGroup = group => {
    const id = String(group?.id || "");
    const name = String(group?.name || "");
    return id.includes("advanced-refine-support-material-choice")
      || id.includes("refine-support-material-choice")
      || name.includes(sourceName)
      || name.includes(malformedMarker);
  };
  const existingGroups = (pack.choiceGroups || []).filter(group => !isLegacyGroup(group));
  const legacyGroups = (pack.choiceGroups || []).filter(isLegacyGroup);
  const existingGroup = legacyGroups[0];
  const groupQty = Number(legacyContent?.qty || existingGroup?.qty) || 0;
  if (!groupQty && !legacyGroups.length) return pack;
  return {
    ...pack,
    contents: (pack.contents || []).filter(content => content.name !== sourceName),
    choiceGroups: [
      ...existingGroups,
      refineSupportChoiceGroup(pack.id, groupQty || 1, existingGroup?.defaultSelected)
    ]
  };
}

function refineSupportChoiceGroupId(packId) {
  return `${packId || "pack"}-refine-support-material-choice`;
}

function refineSupportChoiceGroup(packId, qty, defaultSelected = "熔岩之息") {
  return {
    id: refineSupportChoiceGroupId(packId),
    name: `4阶精炼辅助材料自选箱子 ×${qty}`,
    qty,
    defaultSelected: ["冰川之息", "熔岩之息"].includes(defaultSelected) ? defaultSelected : "熔岩之息",
    options: [
      { name: "冰川之息", qty: 9 },
      { name: "熔岩之息", qty: 3 }
    ]
  };
}

function getGiftPacks() {
  const deleted = new Set(editableDeletedPacks);
  const overridden = giftPacks
    .filter(pack => !deleted.has(pack.id))
    .map(pack => sanitizePack(editablePackOverrides[pack.id] || {}, pack));
  const custom = editableCustomPacks
    .filter(pack => !deleted.has(pack.id))
    .map(pack => sanitizePack(pack));
  return [...overridden, ...custom];
}

function initializePackSelections(pack) {
  if (pack.isSelfSelect && !state.selectedOptions[pack.id]) {
    state.selectedOptions[pack.id] = new Set(pack.defaultSelected || []);
  }
  reconcileIncludedContents(pack);
  (pack.choiceGroups || []).forEach(group => {
    const key = choiceGroupStateKey(pack.id, group.id);
    if (!state.selectedChoiceGroups[key]) {
      state.selectedChoiceGroups[key] = group.defaultSelected || group.options?.[0]?.name || "";
    }
  });
}

function choiceGroupStateKey(packId, groupId) {
  return `${packId}::${groupId}`;
}

function choiceGroupBoxName(group) {
  return splitTrailingQtyLabel(group.name, group.qty).name;
}

function choiceOptionQtyKey(boxName, optionName) {
  return `${boxName}::${optionName}`;
}

function choiceOptionQty(pack, group, option) {
  const key = choiceOptionQtyKey(choiceGroupBoxName(group), option.name);
  const edited = Number(editableChoiceOptionQuantities[key]);
  if (Number.isFinite(edited) && edited > 0) return edited;
  return Number(option.qty) || 0;
}

function saveChoiceOptionQtyEdit(boxName, optionName, value, defaultValue) {
  const key = choiceOptionQtyKey(boxName, optionName);
  const qty = Number(value);
  const defaultQty = Number(defaultValue);
  if (Number.isFinite(qty) && qty > 0 && (!Number.isFinite(defaultQty) || qty !== defaultQty)) editableChoiceOptionQuantities[key] = qty;
  else delete editableChoiceOptionQuantities[key];
  saveJson(EDITABLE_STORAGE_KEYS.choiceOptionQuantities, editableChoiceOptionQuantities);
}

function migrateChoiceOptionQuantities() {
  let changed = false;
  getGiftPacks().forEach(pack => {
    (pack.choiceGroups || []).forEach(group => {
      const boxName = choiceGroupBoxName(group);
      (group.options || []).forEach(option => {
        const oldKey = `${pack.id}::${group.id}::${option.name}`;
        if (!Object.prototype.hasOwnProperty.call(editableChoiceOptionQuantities, oldKey)) return;
        const nextKey = choiceOptionQtyKey(boxName, option.name);
        if (!Object.prototype.hasOwnProperty.call(editableChoiceOptionQuantities, nextKey)) {
          editableChoiceOptionQuantities[nextKey] = editableChoiceOptionQuantities[oldKey];
        }
        delete editableChoiceOptionQuantities[oldKey];
        changed = true;
      });
    });
  });
  if (changed) saveJson(EDITABLE_STORAGE_KEYS.choiceOptionQuantities, editableChoiceOptionQuantities);
}

function splitTrailingQtyLabel(name, fallbackQty = 1) {
  const text = String(name || "").trim();
  const match = text.match(/^(.*?)(?:\s*[×xX]\s*(\d[\d,]*))\s*$/);
  if (!match) return { name: text, qty: Number(fallbackQty) || 1 };
  return {
    name: match[1].trim() || text,
    qty: Number(match[2].replace(/,/g, "")) || Number(fallbackQty) || 1
  };
}

function displayItemWithQty(name, qty) {
  const label = escapeHtml(displayItemName(name));
  return `${label}×${fmtNum(qty, 0)}`;
}

function selectablePackContents(pack) {
  if (pack.isRandom || pack.isSelfSelect) return [];
  const normalContents = normalPackContents(pack);
  const choiceContents = (pack.choiceGroups || []).map(group => {
    const parsed = splitTrailingQtyLabel(group.name, group.qty);
    return {
      name: parsed.name,
      qty: parsed.qty,
      isChoiceGroupContent: true,
      choiceGroupId: group.id
    };
  });
  return [...normalContents, ...choiceContents];
}

function choiceGroupOptionNames(pack) {
  return new Set((pack.choiceGroups || [])
    .flatMap(group => group.options || [])
    .map(option => option.name)
    .filter(Boolean));
}

function normalPackContents(pack) {
  const optionNames = choiceGroupOptionNames(pack);
  return (pack.contents || []).filter(content => !optionNames.has(content.name));
}

function contentSelectionKey(content, index) {
  return `${index}::${content.name}`;
}

function reconcileIncludedContents(pack) {
  const contents = selectablePackContents(pack);
  if (!contents.length) return;
  const validKeys = contents.map(contentSelectionKey);
  const known = state.knownIncludedItemKeys[pack.id] || new Set();
  const selected = state.selectedIncludedItems[pack.id];
  if (!(selected instanceof Set)) {
    state.selectedIncludedItems[pack.id] = new Set(validKeys);
    state.knownIncludedItemKeys[pack.id] = new Set(validKeys);
    return;
  }
  for (const key of [...selected]) {
    if (!validKeys.includes(key)) selected.delete(key);
  }
  for (const key of validKeys) {
    if (!known.has(key)) selected.add(key);
  }
  state.knownIncludedItemKeys[pack.id] = new Set(validKeys);
}

function includedContentKeys(pack) {
  reconcileIncludedContents(pack);
  return state.selectedIncludedItems[pack.id] || new Set();
}

function packNeedSelectionSummary(pack) {
  const contents = selectablePackContents(pack);
  if (contents.length <= 1) return "";
  const selected = includedContentKeys(pack);
  if (selected.size === contents.length) return "";
  return `已按需求计入 ${selected.size}/${contents.length} 项`;
}

function selectedChoiceGroupOption(pack, group) {
  const selectedName = state.selectedChoiceGroups[choiceGroupStateKey(pack.id, group.id)] || group.defaultSelected;
  return group.options.find(option => option.name === selectedName) || group.options[0] || null;
}

function selectedChoiceGroupContents(pack) {
  const included = includedContentKeys(pack);
  const normalContents = normalPackContents(pack);
  return (pack.choiceGroups || []).map((group, index) => {
    const parsedGroup = splitTrailingQtyLabel(group.name, group.qty);
    const choiceKey = contentSelectionKey({ name: parsedGroup.name }, normalContents.length + index);
    if (!included.has(choiceKey)) return null;
    const selected = selectedChoiceGroupOption(pack, group);
    if (!selected) return null;
    const perBoxQty = choiceOptionQty(pack, group, selected);
    const groupQty = parsedGroup.qty;
    return {
      ...selected,
      qty: perBoxQty * groupQty,
      perBoxQty,
      groupQty,
      choiceGroupName: group.name,
      choiceGroupSource: `${group.name}：每箱${selected.name}×${perBoxQty}`
    };
  }).filter(Boolean);
}

function packValuationContents(pack) {
  return [...selectedContents(pack), ...selectedChoiceGroupContents(pack)];
}

function createCustomPackTemplate() {
  const id = `custom-pack-${Date.now()}`;
  return sanitizePack({
    id,
    name: "新礼包",
    currency: "royal",
    price: 0,
    image: "",
    detailImages: [],
    contents: [{ name: "内容物", qty: 1 }],
    note: "",
    threeForOne: false,
    isCombo: false,
    isRandom: false,
    isSelfSelect: false,
    isCustom: true
  });
}

function findPack(packId) {
  return getGiftPacks().find(pack => pack.id === packId);
}

function savePackEdit(pack) {
  rememberPackSnapshot(pack);
  if (giftPacks.some(item => item.id === pack.id)) {
    editablePackOverrides[pack.id] = sanitizePack(pack, giftPacks.find(item => item.id === pack.id));
    saveJson(EDITABLE_STORAGE_KEYS.packOverrides, editablePackOverrides);
  } else {
    const next = sanitizePack(pack);
    const index = editableCustomPacks.findIndex(item => item.id === next.id);
    if (index >= 0) editableCustomPacks[index] = next;
    else editableCustomPacks.push(next);
    saveJson(EDITABLE_STORAGE_KEYS.customPacks, editableCustomPacks);
  }
}

function rememberPackSnapshot(pack) {
  const snapshot = sanitizePack(pack);
  const record = {
    ...snapshot,
    historyId: `${snapshot.id}-${Date.now()}`,
    sourcePackId: snapshot.id,
    savedAt: new Date().toISOString()
  };
  packHistory = [record, ...packHistory.filter(item => item.sourcePackId !== snapshot.id || item.name !== snapshot.name || item.price !== snapshot.price)].slice(0, 120);
  saveJson(EDITABLE_STORAGE_KEYS.packHistory, packHistory);
}

function deletePackEdit(packId) {
  if (!packId) return;
  editableCustomPacks = editableCustomPacks.filter(pack => pack.id !== packId);
  delete editablePackOverrides[packId];
  if (!editableDeletedPacks.includes(packId)) editableDeletedPacks.push(packId);
  saveJson(EDITABLE_STORAGE_KEYS.customPacks, editableCustomPacks);
  saveJson(EDITABLE_STORAGE_KEYS.packOverrides, editablePackOverrides);
  saveJson(EDITABLE_STORAGE_KEYS.deletedPacks, editableDeletedPacks);
}

function saveItemIconEdit(name, path) {
  if (!name) return;
  if (path) editableItemIcons[name] = path;
  else delete editableItemIcons[name];
  saveJson(EDITABLE_STORAGE_KEYS.itemIcons, editableItemIcons);
}

function resetEditableContent() {
  editablePageContent = {};
  editablePackOverrides = {};
  editableCustomPacks = [];
  editableItemIcons = {};
  editableDeletedPacks = [];
  editableChoiceOptionQuantities = {};
  Object.values(EDITABLE_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

function initPageContentDefaults() {
  pageContentDefaults = {
    eyebrow: document.querySelector(".eyebrow")?.textContent || "",
    title: document.querySelector("h1")?.textContent || "",
    subtitle: document.querySelector(".subtitle")?.textContent || "",
    rateTitle: document.querySelector(".rate-title")?.textContent || ""
  };
}

function applyPageContent() {
  const content = { ...pageContentDefaults, ...editablePageContent };
  const eyebrow = document.querySelector(".eyebrow");
  const title = document.querySelector("h1");
  const subtitle = document.querySelector(".subtitle");
  const rateTitle = document.querySelector(".rate-title");
  if (eyebrow) eyebrow.textContent = content.eyebrow;
  if (title) title.textContent = content.title;
  if (subtitle) subtitle.textContent = content.subtitle;
  if (rateTitle) rateTitle.textContent = content.rateTitle;
  document.title = content.title || document.title;
  syncPageEditInputs();
}

function syncPageEditInputs() {
  const content = { ...pageContentDefaults, ...editablePageContent };
  const fields = {
    pageEyebrowInput: content.eyebrow,
    pageTitleInput: content.title,
    pageSubtitleInput: content.subtitle,
    rateTitleInput: content.rateTitle
  };
  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.value = value || "";
  });
}

function refreshSelectedModal() {
  if (state.selectedPackId) {
    const pack = findPack(state.selectedPackId);
    if (pack) renderModal(pack);
  }
}

function syncModalOpenState() {
  const mainHidden = document.getElementById("modalBackdrop")?.hidden ?? true;
  const editHidden = document.getElementById("editDialogBackdrop")?.hidden ?? true;
  document.body.classList.toggle("modal-open", !mainHidden || !editHidden);
}

function openEditDialog(kind) {
  const backdrop = document.getElementById("editDialogBackdrop");
  const content = document.getElementById("editDialogContent");
  if (!backdrop || !content) return;
  content.innerHTML = kind === "manual" ? manualValuesDialogHtml() : pageEditDialogHtml();
  document.querySelector(".dialog-modal")?.classList.toggle("fit-modal", kind === "manual");
  backdrop.hidden = false;
  syncModalOpenState();
  document.querySelector(".dialog-modal")?.focus();
  if (kind === "manual") {
    renderManualValues();
    bindManualDialogControls();
  } else {
    syncPageEditInputs();
    bindPageEditDialogControls();
  }
}

function closeEditDialog() {
  document.getElementById("editDialogBackdrop").hidden = true;
  document.querySelector(".dialog-modal")?.classList.remove("fit-modal");
  state.editingPackId = null;
  syncModalOpenState();
}

function toggleEditColumn() {
  state.showEditColumn = !state.showEditColumn;
  renderTable();
}

function openFirstPackEditor() {
  const first = filterPacks(getGiftPacks())[0];
  if (first) openPackEditor(first.id);
}

function openPackEditor(packId) {
  const pack = findPack(packId);
  const backdrop = document.getElementById("editDialogBackdrop");
  const content = document.getElementById("editDialogContent");
  if (!pack || !backdrop || !content) return;
  state.editingPackId = pack.id;
  content.innerHTML = packEditDialogHtml(pack);
  document.querySelector(".dialog-modal")?.classList.remove("fit-modal");
  backdrop.hidden = false;
  syncModalOpenState();
  document.querySelector(".dialog-modal")?.focus();
  wirePackEditEvents(pack);
}

function pageEditDialogHtml() {
  return `
    <section id="contentEditPanel" class="edit-panel">
      <div class="section-head">
        <div>
          <h2 id="editDialogTitle">页面内容编辑</h2>
          <p>这里的修改会保存在当前浏览器。封面图按 1:1 正方形规范展示。</p>
        </div>
        <button id="resetEditableContentBtn" type="button" class="ghost-btn">恢复默认编辑内容</button>
      </div>
      <div class="edit-grid">
        <label>
          顶部英文说明
          <input id="pageEyebrowInput" type="text">
        </label>
        <label>
          主标题
          <input id="pageTitleInput" type="text">
        </label>
        <label class="wide-field">
          副标题
          <textarea id="pageSubtitleInput" rows="3"></textarea>
        </label>
        <label>
          计算口径标题
          <input id="rateTitleInput" type="text">
        </label>
      </div>
      <div class="edit-actions">
        <button id="savePageContentBtn" type="button" class="ghost-btn">保存页面文案</button>
      </div>
    </section>
  `;
}

function packEditDialogHtml(pack) {
  return `
    <section class="edit-panel">
      <div class="section-head">
        <div>
          <h2 id="editDialogTitle">编辑礼包</h2>
          <p>修改名称、价格、封面、内容物和图标。封面图按 1:1 正方形展示。</p>
        </div>
      </div>
      ${packEditHtml(pack)}
    </section>
  `;
}

function packHistoryOptionsHtml(packId) {
  const scoped = packHistory.filter(entry => entry.sourcePackId === packId);
  if (!scoped.length) return '<option value="">暂无关联历史</option>';
  return ['<option value="">选择历史版本</option>', ...scoped.map(entry => `
    <option value="${escapeAttr(entry.historyId)}">${escapeHtml(entry.name)} · ${fmtNum(entry.price, 0)} · ${formatDateTime(entry.savedAt)}</option>
  `)].join("");
}

function manualValuesDialogHtml() {
  return `
    <section id="manualValuesPanel" class="manual-panel compact-manual-panel">
      <div class="section-head">
        <div>
          <h2 id="editDialogTitle">手动改写估值</h2>
          <p>左侧选择物品，右侧编辑估值和图标；留空则使用默认估值。</p>
        </div>
      </div>
      <div id="manualValuesGrid" class="manual-groups"></div>
    </section>
  `;
}

function bindPageEditDialogControls() {
  document.getElementById("savePageContentBtn")?.addEventListener("click", () => {
    editablePageContent = {
      eyebrow: document.getElementById("pageEyebrowInput").value.trim(),
      title: document.getElementById("pageTitleInput").value.trim(),
      subtitle: document.getElementById("pageSubtitleInput").value.trim(),
      rateTitle: document.getElementById("rateTitleInput").value.trim()
    };
    saveJson(EDITABLE_STORAGE_KEYS.pageContent, editablePageContent);
    applyPageContent();
  });
  document.getElementById("resetEditableContentBtn")?.addEventListener("click", () => {
    if (!window.confirm("恢复默认编辑内容？这会清除本浏览器保存的页面文案、礼包编辑、新增礼包和自定义图标。")) return;
    resetEditableContent();
    applyPageContent();
    renderManualValues();
    renderTable();
    refreshSelectedModal();
    closeEditDialog();
  });
}

function bindManualDialogControls() {}

function loadManualValues() {
  try {
    return JSON.parse(localStorage.getItem("giftPackManualValues") || "{}");
  } catch (error) {
    return {};
  }
}

function saveManualValues() {
  localStorage.setItem("giftPackManualValues", JSON.stringify(state.manualValues));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("giftPackSettings") || "{}");
    const goldPerRmb = Number(saved.goldPerRmb) > 0 ? Number(saved.goldPerRmb) : DEFAULTS.goldPerRmb;
    const hasValuationBase = Number(saved.valuationGoldPerRmb) > 0 && saved.valuationGoldBaseLocked;
    return {
      goldPerRmb,
      royalPerRmb: Number(saved.royalPerRmb) > 0 ? Number(saved.royalPerRmb) : DEFAULTS.royalPerRmb,
      blueSource: BLUE_SOURCES[saved.blueSource] ? saved.blueSource : DEFAULTS.blueSource,
      royalDiscount: Number(saved.royalDiscount) > 0 ? Number(saved.royalDiscount) : DEFAULTS.royalDiscount,
      valuationGoldPerRmb: hasValuationBase ? Number(saved.valuationGoldPerRmb) : goldPerRmb,
      valuationGoldBaseLocked: !!saved.valuationGoldBaseLocked,
      settingsUpdatedAt: saved.settingsUpdatedAt || null
    };
  } catch (error) {
    return { ...DEFAULTS, valuationGoldPerRmb: DEFAULTS.goldPerRmb, valuationGoldBaseLocked: false, settingsUpdatedAt: null };
  }
}

function saveSettings(options = {}) {
  if (!options.preserveTimestamp) state.settingsUpdatedAt = new Date().toISOString();
  localStorage.setItem("giftPackSettings", JSON.stringify({
    goldPerRmb: state.goldPerRmb,
    royalPerRmb: state.royalPerRmb,
    blueSource: state.blueSource,
    royalDiscount: state.royalDiscount,
    valuationGoldPerRmb: state.valuationGoldPerRmb,
    valuationGoldBaseLocked: !!state.valuationGoldBaseLocked,
    settingsUpdatedAt: state.settingsUpdatedAt
  }));
  rememberRateSnapshot();
  renderRateTimestamp();
}

function rememberRateSnapshot() {
  const record = {
    goldPerRmb: state.goldPerRmb,
    royalPerRmb: state.royalPerRmb,
    blueSource: state.blueSource,
    royalDiscount: state.royalDiscount,
    valuationGoldPerRmb: state.valuationGoldPerRmb,
    valuationGoldBaseLocked: !!state.valuationGoldBaseLocked,
    savedAt: state.settingsUpdatedAt || new Date().toISOString()
  };
  const previous = rateHistory[0];
  if (previous
    && previous.goldPerRmb === record.goldPerRmb
    && previous.royalPerRmb === record.royalPerRmb
    && previous.blueSource === record.blueSource
    && previous.royalDiscount === record.royalDiscount
    && previous.valuationGoldPerRmb === record.valuationGoldPerRmb
    && previous.valuationGoldBaseLocked === record.valuationGoldBaseLocked) return;
  rateHistory = [record, ...rateHistory].slice(0, 200);
  saveJson(EDITABLE_STORAGE_KEYS.rateHistory, rateHistory);
}

function renderRateTimestamp() {
  const element = document.getElementById("rateUpdatedAt");
  if (!element) return;
  element.textContent = state.settingsUpdatedAt
    ? `金价更新时间：${formatDateTime(state.settingsUpdatedAt)}`
    : "金价更新时间：未记录";
}

function authorDataStatusText() {
  const suffix = hasLocalGiftPackEdits() ? "（已保留你的本地修改）" : "";
  const authorText = state.publicDataExportedAt
    ? `作者数据更新时间：${formatDateTime(state.publicDataExportedAt)}${suffix}`
    : "作者数据更新时间：未记录";
  const goldText = state.settingsUpdatedAt
    ? `金价更新时间：${formatDateTime(state.settingsUpdatedAt)}`
    : "金价更新时间：未记录";
  return `${authorText} ｜ ${goldText}`;
}

function renderAuthorDataStatus(message) {
  const element = document.getElementById("authorDataUpdatedAt");
  if (!element) return;
  element.textContent = message ? `${authorDataStatusText()} ｜ ${message}` : authorDataStatusText();
}

async function refreshAuthorGiftPackData() {
  const button = document.getElementById("refreshAuthorDataBtn");
  const oldText = button?.textContent || "";
  try {
    if (button) {
      button.disabled = true;
      button.textContent = "检查中";
    }
    const goldSync = await syncGoldRateFromDashboard({ force: true, persist: true });
    const { backup, storage } = await fetchPublicGiftPackBackup();
    const currentText = state.publicDataExportedAt ? formatDateTime(state.publicDataExportedAt) : "未记录";
    const nextText = backup.exportedAt ? formatDateTime(backup.exportedAt) : "未记录";
    const goldNote = goldSync?.synced
      ? `\n金价已同步：${fmtGold(goldSync.rate)} 金/元`
      : goldSync?.skipped === "manual"
        ? "\n金价保留：使用你手动填写的数值"
        : "\n金价同步：暂无可用更新";
    const localNote = hasLocalGiftPackEdits() ? "\n\n检测到你当前浏览器里有本地礼包修改；确认后会改用作者数据。" : "";
    const ok = window.confirm(`当前作者数据：${currentText}\n最新作者数据：${nextText}${goldNote}${localNote}\n\n是否使用作者数据？`);
    if (!ok) {
      renderAuthorDataStatus("已取消使用作者数据");
      return;
    }
    applyPublicGiftPackSnapshot(backup, storage, { forceAuthorPacks: true });
    await syncGoldRateFromDashboard({ force: true, persist: true });
    await preloadGiftPackImages();
    applyPageContent();
    renderRateControls();
    renderRateTimestamp();
    renderManualValues();
    renderTable();
    if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
    renderAuthorDataStatus("已使用作者数据：" + nextText);
  } catch (error) {
    console.error(error);
    window.alert(`作者数据刷新失败：${error.message || error}`);
    renderAuthorDataStatus("作者数据刷新失败");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = oldText || "刷新";
    }
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function royalToGold(royal) {
  return (Number(royal) / state.royalPerRmb) * state.goldPerRmb * state.royalDiscount;
}

function royalToValuationGold(royal) {
  return (Number(royal) / state.royalPerRmb) * state.valuationGoldPerRmb * state.royalDiscount;
}

function blueToRoyal(blue) {
  const source = BLUE_SOURCES[state.blueSource] || BLUE_SOURCES.normal;
  return Number(blue) * source.royal / source.blue;
}

function blueToGold(blue) {
  return royalToGold(blueToRoyal(blue));
}

function blueToValuationGold(blue) {
  return royalToValuationGold(blueToRoyal(blue));
}

function moneyCostGold(pack, options = {}) {
  const price = options.threeForOne && pack.threeForOne ? pack.price * 3 / 4 : pack.price;
  return pack.currency === "blue" ? blueToGold(price) : royalToGold(price);
}

function goldToRmb(gold) {
  return gold / state.goldPerRmb;
}

function normalizeManualEntry(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number" || typeof raw === "string") {
    const range = parseManualValueRange(raw);
    return range ? { ...range, unit: "gold" } : null;
  }
  const range = parseManualValueRange(raw.value);
  const unit = MANUAL_VALUE_UNITS[raw.unit] ? raw.unit : "gold";
  if (range) return { ...range, unit };
  return null;
}

function parseManualValueRange(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const stackMatch = text.match(/(?:\/|／)\s*(\d[\d,]*)\s*(?:个|個)?\s*$/);
  const stackSize = stackMatch ? Number(stackMatch[1].replace(/,/g, "")) : null;
  const valueText = stackMatch ? text.slice(0, stackMatch.index).trim() : text;
  const parts = valueText
    .replaceAll("，", ",")
    .replace(/[~～—–至到]/g, "-")
    .split("-")
    .map(part => Number(part.replace(/,/g, "").replace(/金|金币|金幣/g, "").trim()))
    .filter(value => Number.isFinite(value) && value > 0);
  if (!parts.length) return null;
  const min = Math.min(...parts);
  const max = Math.max(...parts);
  return {
    value: (min + max) / 2,
    min,
    max,
    raw: text,
    isRange: min !== max,
    stackSize: Number.isFinite(stackSize) && stackSize > 1 ? stackSize : null
  };
}

function defaultManualStackSize(name) {
  const note = itemPrices[name]?.note || "";
  const match = String(note).match(/\/\s*(\d[\d,]*)\s*(?:个|個)?/);
  const stackSize = match ? Number(match[1].replace(/,/g, "")) : 1;
  return Number.isFinite(stackSize) && stackSize > 1 ? stackSize : 1;
}

function manualEntryStackSize(entry, name) {
  const stackSize = Number(entry?.stackSize) || defaultManualStackSize(name);
  return Number.isFinite(stackSize) && stackSize > 1 ? stackSize : 1;
}

function manualValueToGold(entry, name) {
  if (!entry) return null;
  if (entry.unit === "royal") return royalToValuationGold(entry.value);
  if (entry.unit === "blue") return blueToValuationGold(entry.value);
  return entry.value / manualEntryStackSize(entry, name);
}

function manualRangeToGold(entry, edge = "mid", name) {
  if (!entry) return null;
  const value = edge === "min" ? entry.min : edge === "max" ? entry.max : entry.value;
  if (entry.unit === "royal") return royalToValuationGold(value);
  if (entry.unit === "blue") return blueToValuationGold(value);
  return value / manualEntryStackSize(entry, name);
}

function getManualGold(name) {
  const entry = normalizeManualEntry(state.manualValues[name]);
  return entry && entry.value > 0 ? manualValueToGold(entry, name) : null;
}

function manualSourceText(entry, name) {
  if (!entry) return "手动估值";
  const valueText = manualEntryText(entry);
  if (entry.unit === "royal") return `手动估值（${valueText}彩钻，按估值基准金价）`;
  if (entry.unit === "blue") return `手动估值（${valueText}蓝钻，按估值基准金价）`;
  return entry.isRange ? `手动估值区间（${valueText}金币）` : "手动估值（金）";
}

function manualEntryText(entry) {
  if (!entry) return "";
  if (entry.isRange) return `${fmtUnitGold(entry.min)}~${fmtUnitGold(entry.max)}`;
  return fmtUnitGold(entry.value);
}

function itemUnitGold(content) {
  const manualEntry = normalizeManualEntry(state.manualValues[content.name]);
  const manual = manualEntry && manualEntry.value > 0 ? manualValueToGold(manualEntry, content.name) : null;
  if (manual !== null) {
    return {
      value: manual,
      minValue: manualRangeToGold(manualEntry, "min", content.name),
      maxValue: manualRangeToGold(manualEntry, "max", content.name),
      source: manualSourceText(manualEntry, content.name),
      isRange: !!manualEntry.isRange
    };
  }
  const def = itemPrices[content.name];
  if (!def) return { value: null, source: "未计入估值" };
  if (typeof def.gold === "number") return { value: def.gold, source: def.note || "金币单价" };
  if (typeof def.royal === "number") return { value: royalToValuationGold(def.royal), source: `${def.note || "彩钻折金币"}（估值基准 ${fmtGold(state.valuationGoldPerRmb)} 金/元）` };
  if (typeof def.blue === "number") return { value: blueToValuationGold(def.blue), source: `${def.note || "蓝钻折金币"}（估值基准 ${fmtGold(state.valuationGoldPerRmb)} 金/元）` };
  if (Array.isArray(def.components) && def.components.length) {
    let missing = false;
    let minValue = 0;
    let maxValue = 0;
    const value = def.components.reduce((sum, component) => {
      const unit = itemUnitGold({ name: component.name, qty: component.qty });
      if (unit.value === null) missing = true;
      minValue += (unit.minValue ?? unit.value ?? 0) * component.qty;
      maxValue += (unit.maxValue ?? unit.value ?? 0) * component.qty;
      return sum + (unit.value === null ? 0 : unit.value * component.qty);
    }, 0);
    return missing ? { value: null, source: "组件未定价" } : { value, minValue, maxValue, source: def.note || "组件折算", isRange: Math.round(minValue) !== Math.round(maxValue) };
  }
  return { value: null, source: "未计入估值" };
}

function requiresRangeEstimate(name) {
  if (!name) return false;
  if (UNKNOWN_ITEMS.includes(name)) return true;
  return !itemPrices[name] && customManualItems.includes(name);
}

function valueContents(contents) {
  const lines = contents.map(content => {
    const unit = itemUnitGold(content);
    const total = unit.value === null ? null : unit.value * content.qty;
    const minTotal = unit.minValue === undefined || unit.minValue === null ? total : unit.minValue * content.qty;
    const maxTotal = unit.maxValue === undefined || unit.maxValue === null ? total : unit.maxValue * content.qty;
    return { ...content, unitGold: unit.value, minUnitGold: unit.minValue, maxUnitGold: unit.maxValue, totalGold: total, minTotalGold: minTotal, maxTotalGold: maxTotal, source: content.choiceGroupSource || unit.source, isRange: unit.isRange };
  });
  const knownGold = lines.reduce((sum, line) => sum + (line.totalGold || 0), 0);
  const minKnownGold = lines.reduce((sum, line) => sum + (line.minTotalGold ?? line.totalGold ?? 0), 0);
  const maxKnownGold = lines.reduce((sum, line) => sum + (line.maxTotalGold ?? line.totalGold ?? 0), 0);
  const unknownCount = lines.filter(line => line.totalGold === null).length;
  return { lines, knownGold, minKnownGold, maxKnownGold, unknownCount, fullyPriced: unknownCount === 0, hasRange: lines.some(line => line.isRange) };
}

function selectedContents(pack) {
  if (!pack.isSelfSelect) {
    const selected = includedContentKeys(pack);
    return normalPackContents(pack)
      .map((content, index) => ({ ...content, valuationKey: contentSelectionKey(content, index) }))
      .filter(content => selected.has(content.valuationKey));
  }
  const selected = state.selectedOptions[pack.id] || new Set();
  return pack.options.filter(option => selected.has(option.name));
}

function calcPack(pack, options = {}) {
  const threeForOne = options.forceSingle ? false : !!pack.threeForOne;
  if (pack.isRandom) {
    const results = randomResultCalcs(pack);
    const known = results.filter(result => result.valueGold !== null);
    const min = known.length ? Math.min(...known.map(result => result.valueGold)) : null;
    const max = known.length ? Math.max(...known.map(result => result.valueGold)) : null;
    return {
      costGold: moneyCostGold(pack, { threeForOne }),
      valueGold: min,
      maxValueGold: max,
      percent: min === null ? null : min / moneyCostGold(pack, { threeForOne }) * 100,
      fullyPriced: false,
      unknownCount: results.filter(result => result.valueGold === null).length,
      randomResults: results
    };
  }
  const contents = packValuationContents(pack);
  const valued = valueContents(contents);
  const costGold = moneyCostGold(pack, { threeForOne });
  const percent = valued.knownGold > 0 ? valued.knownGold / costGold * 100 : null;
  return {
    costGold,
    valueGold: valued.knownGold,
    minValueGold: valued.minKnownGold,
    maxValueGold: valued.maxKnownGold,
    percent,
    minPercent: valued.minKnownGold > 0 ? valued.minKnownGold / costGold * 100 : null,
    maxPercent: valued.maxKnownGold > 0 ? valued.maxKnownGold / costGold * 100 : null,
    hasRange: valued.hasRange,
    fullyPriced: valued.fullyPriced,
    unknownCount: valued.unknownCount,
    lines: valued.lines
  };
}

function randomResultCalcs(pack) {
  const costGold = moneyCostGold(pack, { threeForOne: !!pack.threeForOne });
  return pack.randomResults.map((contents, index) => {
    const valued = valueContents(contents);
    const name = contents.map(content => `${content.name}×${content.qty}`).join(" + ");
    const valueGold = valued.fullyPriced ? valued.knownGold : (valued.knownGold > 0 ? valued.knownGold : null);
    const minValueGold = valued.fullyPriced ? valued.minKnownGold : (valued.minKnownGold > 0 ? valued.minKnownGold : null);
    const maxValueGold = valued.fullyPriced ? valued.maxKnownGold : (valued.maxKnownGold > 0 ? valued.maxKnownGold : null);
    return {
      index: index + 1,
      name,
      lines: valued.lines,
      valueGold,
      minValueGold,
      maxValueGold,
      knownGold: valued.knownGold,
      unknownCount: valued.unknownCount,
      percent: valueGold === null ? null : valueGold / costGold * 100,
      minPercent: minValueGold === null ? null : minValueGold / costGold * 100,
      maxPercent: maxValueGold === null ? null : maxValueGold / costGold * 100,
      hasRange: valued.hasRange
    };
  });
}

function recommendation(percent, fullyPriced) {
  if (percent === null || !Number.isFinite(percent)) return { label: "未定", className: "value-unknown", level: "无法定价" };
  if (!fullyPriced) return { label: "未定", className: "value-unknown", level: "无法定价" };
  if (percent >= 120) return { label: "很值", className: "value-great", level: "很值" };
  if (percent >= 105) return { label: "可以买", className: "value-good", level: "可以买" };
  if (percent >= 98) return { label: "接近持平", className: "value-even", level: "接近持平" };
  return { label: "不推荐", className: "value-bad", level: "不推荐" };
}

function fmtGold(value) {
  if (value === null || !Number.isFinite(value)) return "未计入";
  return Math.round(value).toLocaleString("zh-CN");
}

function fmtUnitGold(value) {
  if (value === null || !Number.isFinite(value)) return "未计入";
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function formatDiscountLabel() {
  if (state.royalDiscount === 1) return "彩钻原价";
  const tenths = state.royalDiscount * 10;
  if (Math.abs(tenths - Math.round(tenths)) < 0.0001) return `彩钻${Math.round(tenths)}折`;
  return `彩钻${fmtNum(tenths, 1)}折`;
}

function fmtNum(value, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "未定";
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function fmtPercent(value) {
  if (value === null || !Number.isFinite(value)) return "未定";
  return `${fmtNum(value, 2)}%`;
}

function fmtRmb(value) {
  if (value === null || !Number.isFinite(value)) return "未定";
  return `¥${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function currencyLabel(currency) {
  return currency === "blue" ? "蓝钻" : "彩钻";
}

function filterPacks(packs) {
  return packs.filter(pack => {
    if (state.filter === "all") return !pack.expired;
    if (state.filter === "royal") return pack.currency === "royal";
    if (state.filter === "blue") return pack.currency === "blue";
    if (state.filter === "threeForOne") return pack.threeForOne;
    if (state.filter === "selfSelect") return pack.isSelfSelect;
    if (state.filter === "random") return pack.isRandom;
    if (state.filter === "combo") return pack.isCombo;
    if (state.filter === "expired") return pack.expired;
    return true;
  });
}

function allPackItems() {
  const byName = new Map();
  const add = content => {
    if (!content || !content.name || byName.has(content.name)) return;
    byName.set(content.name, content.name);
  };
  getGiftPacks().forEach(pack => {
    (pack.contents || []).forEach(add);
    (pack.options || []).forEach(add);
    (pack.randomResults || []).flat().forEach(add);
    (pack.choiceGroups || []).forEach(group => {
      add({ name: choiceGroupBoxName(group) });
      (group.options || []).forEach(add);
    });
  });
  Object.keys(itemPrices).forEach(name => byName.set(name, name));
  Object.values(itemPrices).forEach(def => {
    (def.components || []).forEach(component => byName.set(component.name, component.name));
  });
  UNKNOWN_ITEMS.forEach(name => byName.set(name, name));
  customManualItems.forEach(name => byName.set(name, name));
  return [...byName.keys()].filter(name => !hiddenManualItems.includes(name));
}

function defaultItemGold(name) {
  const def = itemPrices[name];
  if (!def) return null;
  if (Array.isArray(def.components) && def.components.length) {
    const total = def.components.reduce((sum, component) => {
      const unit = itemUnitGold({ name: component.name, qty: component.qty });
      return sum + (unit.value === null ? 0 : unit.value * component.qty);
    }, 0);
    return total > 0 ? total : null;
  }
  if (typeof def.gold === "number") return def.gold;
  if (typeof def.royal === "number") return royalToValuationGold(def.royal);
  if (typeof def.blue === "number") return blueToValuationGold(def.blue);
  return null;
}

function defaultManualUnit(name) {
  const def = itemPrices[name];
  if (!def) return "gold";
  if (typeof def.royal === "number") return "royal";
  if (typeof def.blue === "number") return "blue";
  return "gold";
}

function defaultManualValue(name, defaultGold) {
  const def = itemPrices[name];
  if (!def) return defaultGold;
  if (typeof def.royal === "number") return def.royal;
  if (typeof def.blue === "number") return def.blue;
  return defaultGold;
}

function defaultItemSource(name) {
  return itemPrices[name]?.note || "默认估值";
}

function displayItemName(name) {
  return editableItemLabels[name] || name;
}

function choiceBoxDefinition(name) {
  if (!name) return null;
  const options = new Map();
  let boxName = "";
  getGiftPacks().forEach(pack => {
    (pack.choiceGroups || []).forEach(group => {
      const currentBoxName = choiceGroupBoxName(group);
      if (currentBoxName !== name) return;
      boxName = currentBoxName;
      (group.options || []).forEach(option => {
        if (!options.has(option.name)) options.set(option.name, { ...option });
      });
    });
  });
  return boxName && options.size ? { name: boxName, options: [...options.values()] } : null;
}

function renderManualValues() {
  const grid = document.getElementById("manualValuesGrid");
  if (!grid) return;
  const previousScrollTop = document.querySelector(".manual-list")?.scrollTop || 0;
  const names = sortedManualItems(allPackItems());
  if (!state.selectedManualItem || !names.includes(state.selectedManualItem)) {
    state.selectedManualItem = names[0] || null;
  }
  grid.innerHTML = `
    <div class="manual-editor-layout">
      <div class="manual-left">
        <div class="manual-list-tools">
          <input id="manualSearchInput" type="search" placeholder="搜索物品" aria-label="搜索估值物品" value="${escapeAttr(state.manualSearchQuery)}">
          <select id="manualSortInput" aria-label="估值列表排序">
            <option value="name-asc" ${state.manualSort === "name-asc" ? "selected" : ""}>名称正序</option>
            <option value="name-desc" ${state.manualSort === "name-desc" ? "selected" : ""}>名称倒序</option>
            <option value="value-desc" ${state.manualSort === "value-desc" ? "selected" : ""}>估值高到低</option>
            <option value="value-asc" ${state.manualSort === "value-asc" ? "selected" : ""}>估值低到高</option>
          </select>
          <button id="addManualItemBtn" type="button" class="ghost-btn">新增物品</button>
        </div>
        <div class="manual-list" aria-label="估值物品列表">
          ${names.map(name => manualListItemHtml(name)).join("")}
        </div>
      </div>
      <div class="manual-detail" id="manualDetailPanel">
        ${manualDetailHtml(state.selectedManualItem)}
      </div>
    </div>
  `;
  wireManualList();
  wireManualDetail();
  wireManualToolbar();
  const list = document.querySelector(".manual-list");
  applyManualSearchFilter();
  if (list && state.manualScrollToSelected) {
    document.querySelector(".manual-list-item.is-active")?.scrollIntoView({ block: "nearest" });
    state.manualScrollToSelected = false;
  } else if (list) {
    list.scrollTop = previousScrollTop;
  }
}

function choiceOptionQtyEditorHtml(boxName) {
  const definition = choiceBoxDefinition(boxName);
  if (!definition) return "";
  return `
    <section class="choice-qty-editor">
      <div class="choice-qty-head">
        <div>
          <h3>内容物数量</h3>
          <p>这里修改的是每个自选箱打开后给多少个内容物，所有包含这个自选箱的礼包都会一起重算。</p>
        </div>
      </div>
      <div class="choice-qty-list">
        ${definition.options.map(option => {
          const key = choiceOptionQtyKey(definition.name, option.name);
          const defaultQty = Number(option.qty) || 0;
          const edited = Number(editableChoiceOptionQuantities[key]);
          const currentQty = Number.isFinite(edited) && edited > 0 ? edited : defaultQty;
          const hasEdit = Number.isFinite(edited) && edited > 0;
          return `
          <div class="choice-qty-row">
            <div class="choice-qty-name">
              ${itemIconHtml(option.name)}
              <span>
                <strong>${escapeHtml(displayItemName(option.name))}</strong>
                <em>默认每箱 ${fmtNum(defaultQty, 0)}</em>
              </span>
            </div>
            <label>
              每箱数量
              <input type="number" min="0" step="1"
                data-choice-qty-box="${escapeAttr(definition.name)}"
                data-choice-qty-option="${escapeAttr(option.name)}"
                data-choice-qty-default="${escapeAttr(defaultQty)}"
                value="${escapeAttr(currentQty)}"
                placeholder="${escapeAttr(defaultQty)}">
            </label>
            <div class="choice-qty-summary">
              <span>${hasEdit ? "已改写" : "使用默认"}</span>
              <strong>每箱 ${fmtNum(currentQty, 0)}</strong>
            </div>
            <button type="button" class="ghost-btn" data-choice-qty-reset="${escapeAttr(key)}" ${hasEdit ? "" : "disabled"}>重置</button>
          </div>
        `;
        }).join("")}
      </div>
    </section>
  `;
}

function sortedManualItems(names) {
  const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
  const valueOf = name => {
    const manual = normalizeManualEntry(state.manualValues[name]);
    if (manual) return manualValueToGold(manual, name);
    return defaultItemGold(name) ?? -Infinity;
  };
  return [...names].sort((a, b) => {
    if (state.manualSort === "name-desc") return collator.compare(displayItemName(b), displayItemName(a));
    if (state.manualSort === "value-desc") return valueOf(b) - valueOf(a);
    if (state.manualSort === "value-asc") return valueOf(a) - valueOf(b);
    return collator.compare(displayItemName(a), displayItemName(b));
  });
}

function manualItemMeta(name) {
  const defaultUnit = defaultManualUnit(name);
  const defaultGold = defaultItemGold(name);
  const defaultValue = defaultManualValue(name, defaultGold);
  const manual = normalizeManualEntry(state.manualValues[name]) || { value: "", unit: defaultUnit };
  const placeholder = defaultGold === null ? "请输入单价，如 60000" : fmtUnitGold(defaultValue);
  const note = itemPrices[name] ? defaultItemSource(name) : "自定义估值项";
  const meta = manualDefaultSummary(defaultValue, defaultUnit, defaultGold);
  return { defaultGold, defaultUnit, defaultValue, manual, placeholder, meta, note };
}

function manualDefaultSummary(defaultValue, defaultUnit, defaultGold) {
  if (defaultGold === null || !Number.isFinite(defaultGold)) return "未计入估值";
  if (defaultUnit === "gold") return `${fmtUnitGold(defaultGold)} 金币`;
  return `${fmtUnitGold(defaultValue)} ${MANUAL_VALUE_UNITS[defaultUnit]}，折 ${fmtUnitGold(defaultGold)} 金币`;
}

function manualListItemHtml(name) {
  const manual = normalizeManualEntry(state.manualValues[name]);
  const { defaultValue, defaultUnit, defaultGold } = manualItemMeta(name);
  const selected = name === state.selectedManualItem;
  const defaultText = manualDefaultBrief(defaultValue, defaultUnit, defaultGold);
  const manualText = manual && manual.value > 0
    ? `已改写：${manualEntryText(manual)} ${MANUAL_VALUE_UNITS[manual.unit] || "金币"}`
    : defaultText;
  return `
    <button type="button" class="manual-list-item ${selected ? "is-active" : ""}" data-manual-select="${escapeAttr(name)}">
      ${itemIconHtml(name)}
      <span>
        <strong>${escapeHtml(displayItemName(name))}</strong>
        <em>${manualText}</em>
      </span>
    </button>
  `;
}

function manualDefaultBrief(defaultValue, defaultUnit, defaultGold) {
  if (defaultGold === null || !Number.isFinite(defaultGold)) return "未计入";
  if (defaultUnit === "gold") return `${fmtUnitGold(defaultGold)} 金币`;
  return `${fmtUnitGold(defaultValue)} ${MANUAL_VALUE_UNITS[defaultUnit]}`;
}

function manualDetailHtml(name) {
  if (!name) {
    return `<div class="manual-empty">暂无可编辑估值项。</div>`;
  }
  const { manual, placeholder, meta, note } = manualItemMeta(name);
  const choiceQtyEditor = choiceOptionQtyEditorHtml(name);
  const valuePlaceholder = `${placeholder}，也可填 100~200`;
  return `
    <div class="manual-detail-inner" data-manual-current="${escapeAttr(name)}">
      <button type="button" class="manual-preview" id="manualIconPreviewBtn" title="点击更换图标">
        ${itemIconHtml(name)}
      </button>
      <div class="manual-detail-fields">
        <div>
          <h3>${escapeHtml(displayItemName(name))}</h3>
          <p>${escapeHtml(note)}</p>
        </div>
        <div class="manual-detail-grid">
          <label class="wide-field">
            物品名称
            <input id="manualNameInput" type="text" data-manual-rename="${escapeAttr(name)}" value="${escapeAttr(displayItemName(name))}">
          </label>
          <label>
            估值
            <input id="manualValueInput" type="text" inputmode="decimal" data-manual-name="${escapeAttr(name)}" value="${escapeAttr(manual.raw || manual.value || "")}" placeholder="${escapeAttr(valuePlaceholder)}">
          </label>
          <label>
            单位
            <select id="manualUnitInput" data-manual-unit="${escapeAttr(name)}" aria-label="${escapeAttr(name)}估值单位">
              ${Object.entries(MANUAL_VALUE_UNITS).map(([unit, label]) => `
                <option value="${unit}" ${manual.unit === unit ? "selected" : ""}>${label}</option>
              `).join("")}
            </select>
          </label>
          <label class="wide-field">
            折算
            <input type="text" value="${escapeAttr(meta)}" readonly>
          </label>
          <label>
            估值基准金价
            <input id="valuationGoldRateInput" type="number" min="0" step="0.01" value="${escapeAttr(state.valuationGoldPerRmb)}">
          </label>
          <label>
            基准操作
            <button id="syncValuationGoldRateBtn" type="button" class="ghost-btn">同步当前金价</button>
          </label>
          <input id="manualIconInput" class="hidden-file-input" type="file" accept="image/*" data-manual-icon="${escapeAttr(name)}">
        </div>
        <div class="manual-detail-actions">
          <button type="button" class="ghost-btn" id="clearManualValueBtn" data-clear-manual="${escapeAttr(name)}">清除改写</button>
          <button type="button" class="danger-btn" id="removeManualItemBtn" data-remove-manual="${escapeAttr(name)}">删除估值项</button>
        </div>
        ${choiceQtyEditor}
      </div>
    </div>
  `;
}

function wireManualList() {
  document.querySelectorAll("[data-manual-select]").forEach(button => {
    button.addEventListener("click", () => {
      state.manualListScrollTop = document.querySelector(".manual-list")?.scrollTop || 0;
      state.selectedManualItem = button.dataset.manualSelect;
      renderManualValues();
      const list = document.querySelector(".manual-list");
      if (list) list.scrollTop = state.manualListScrollTop || 0;
    });
  });
}

function wireManualToolbar() {
  const search = document.getElementById("manualSearchInput");
  search?.addEventListener("input", event => {
    state.manualSearchQuery = event.target.value.trim();
    applyManualSearchFilter();
  });
  document.getElementById("manualSortInput")?.addEventListener("change", event => {
    state.manualSort = event.target.value;
    state.manualListScrollTop = 0;
    renderManualValues();
  });
  document.getElementById("addManualItemBtn")?.addEventListener("click", addManualItem);
}

function applyManualSearchFilter() {
  const query = (state.manualSearchQuery || "").toLowerCase();
  document.querySelectorAll(".manual-list-item").forEach(button => {
    const name = button.dataset.manualSelect || "";
    const label = displayItemName(name);
    button.hidden = !!query && !name.toLowerCase().includes(query) && !label.toLowerCase().includes(query);
  });
}

function wireManualDetail() {
  const nameInput = document.getElementById("manualNameInput");
  const input = document.querySelector("[data-manual-name]");
  const select = document.querySelector("[data-manual-unit]");
  const valuationGoldRateInput = document.getElementById("valuationGoldRateInput");
  nameInput?.addEventListener("change", event => {
    renameManualItem(event.target.dataset.manualRename, event.target.value);
  });
  input?.addEventListener("input", () => updateManualValue(input.dataset.manualName));
  select?.addEventListener("change", () => updateManualValue(select.dataset.manualUnit));
  valuationGoldRateInput?.addEventListener("input", event => {
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value > 0) {
      state.valuationGoldPerRmb = value;
      state.valuationGoldBaseLocked = true;
      saveSettings();
      renderManualValues();
      renderTable();
      if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
    }
  });
  document.getElementById("syncValuationGoldRateBtn")?.addEventListener("click", () => {
    state.valuationGoldPerRmb = state.goldPerRmb;
    state.valuationGoldBaseLocked = true;
    saveSettings();
    renderManualValues();
    renderTable();
    if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
  });
  document.getElementById("clearManualValueBtn")?.addEventListener("click", event => {
    delete state.manualValues[event.currentTarget.dataset.clearManual];
    saveManualValues();
    renderManualValues();
    renderTable();
    refreshSelectedModal();
  });
  document.getElementById("removeManualItemBtn")?.addEventListener("click", event => {
    removeManualItem(event.currentTarget.dataset.removeManual);
  });
  document.getElementById("manualIconPreviewBtn")?.addEventListener("click", () => {
    document.getElementById("manualIconInput")?.click();
  });
  document.getElementById("manualIconInput")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    const name = event.target.dataset.manualIcon;
    if (!file || !name) return;
    saveItemIconEdit(name, await readFileAsDataUrl(file));
    renderManualValues();
    renderTable();
    refreshSelectedModal();
  });
  wireChoiceOptionQtyEditor();
}

function wireChoiceOptionQtyEditor() {
  document.querySelectorAll("[data-choice-qty-box]").forEach(input => {
    const apply = (event, refreshEditor = false) => {
      const target = event.currentTarget;
      saveChoiceOptionQtyEdit(
        target.dataset.choiceQtyBox,
        target.dataset.choiceQtyOption,
        target.value,
        target.dataset.choiceQtyDefault
      );
      const summary = target.closest(".choice-qty-row")?.querySelector(".choice-qty-summary strong");
      const qty = Number(target.value);
      if (summary && Number.isFinite(qty) && qty > 0) summary.textContent = `每箱 ${fmtNum(qty, 0)}`;
      renderTable();
      refreshSelectedModal();
      if (refreshEditor) renderManualValues();
    };
    input.addEventListener("input", event => apply(event));
    input.addEventListener("change", event => apply(event, true));
  });
  document.querySelectorAll("[data-choice-qty-reset]").forEach(button => {
    button.addEventListener("click", event => {
      delete editableChoiceOptionQuantities[event.currentTarget.dataset.choiceQtyReset];
      saveJson(EDITABLE_STORAGE_KEYS.choiceOptionQuantities, editableChoiceOptionQuantities);
      renderManualValues();
      renderTable();
      refreshSelectedModal();
    });
  });
}

function removeManualItem(name) {
  delete state.manualValues[name];
  if (customManualItems.includes(name)) {
    customManualItems = customManualItems.filter(item => item !== name);
    saveJson(EDITABLE_STORAGE_KEYS.customManualItems, customManualItems);
  } else if (!hiddenManualItems.includes(name)) {
    hiddenManualItems.push(name);
    saveJson(EDITABLE_STORAGE_KEYS.hiddenManualItems, hiddenManualItems);
  }
  if (state.selectedManualItem === name) {
    state.selectedManualItem = allPackItems().find(item => item !== name) || null;
  }
  saveManualValues();
  renderManualValues();
  renderTable();
  refreshSelectedModal();
}

function addManualItem() {
  const normalized = nextManualItemName();
  if (!customManualItems.includes(normalized)) customManualItems.push(normalized);
  state.selectedManualItem = normalized;
  state.manualSearchQuery = "";
  state.manualScrollToSelected = true;
  hiddenManualItems = hiddenManualItems.filter(item => item !== normalized);
  saveJson(EDITABLE_STORAGE_KEYS.customManualItems, customManualItems);
  saveJson(EDITABLE_STORAGE_KEYS.hiddenManualItems, hiddenManualItems);
  renderManualValues();
  renderTable();
  refreshSelectedModal();
}

function nextManualItemName() {
  const names = new Set(allPackItems());
  let index = 1;
  let name = "新增估值项";
  while (names.has(name)) {
    index += 1;
    name = `新增估值项 ${index}`;
  }
  return name;
}

function renameManualItem(oldName, nextName) {
  const normalized = String(nextName || "").trim();
  if (!oldName || !normalized || normalized === oldName) return;
  if (!customManualItems.includes(oldName)) {
    if (normalized === oldName) delete editableItemLabels[oldName];
    else editableItemLabels[oldName] = normalized;
    state.manualScrollToSelected = true;
    saveJson(EDITABLE_STORAGE_KEYS.itemLabels, editableItemLabels);
    renderManualValues();
    renderTable();
    refreshSelectedModal();
    return;
  }
  const existing = new Set(allPackItems());
  existing.delete(oldName);
  if (existing.has(normalized)) {
    window.alert("这个物品名称已存在");
    renderManualValues();
    return;
  }
  customManualItems = customManualItems.map(item => item === oldName ? normalized : item);
  if (state.manualValues[oldName]) {
    state.manualValues[normalized] = state.manualValues[oldName];
    delete state.manualValues[oldName];
  }
  if (editableItemIcons[oldName]) {
    editableItemIcons[normalized] = editableItemIcons[oldName];
    delete editableItemIcons[oldName];
    saveJson(EDITABLE_STORAGE_KEYS.itemIcons, editableItemIcons);
  }
  hiddenManualItems = hiddenManualItems.filter(item => item !== normalized);
  state.selectedManualItem = normalized;
  state.manualScrollToSelected = true;
  saveJson(EDITABLE_STORAGE_KEYS.customManualItems, customManualItems);
  saveJson(EDITABLE_STORAGE_KEYS.hiddenManualItems, hiddenManualItems);
  saveManualValues();
  renderManualValues();
  renderTable();
  refreshSelectedModal();
}

function updateManualValue(name) {
  const input = [...document.querySelectorAll("[data-manual-name]")].find(element => element.dataset.manualName === name);
  const select = [...document.querySelectorAll("[data-manual-unit]")].find(element => element.dataset.manualUnit === name);
  const parsed = parseManualValueRange(input?.value);
  const unit = select?.value || "gold";
  if (parsed) state.manualValues[name] = { raw: parsed.raw, value: parsed.value, min: parsed.min, max: parsed.max, isRange: parsed.isRange, stackSize: parsed.stackSize, unit };
  else delete state.manualValues[name];
  saveManualValues();
  renderTable();
  if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
}

function renderTable() {
  const body = document.getElementById("packTableBody");
  document.querySelector(".pack-table")?.classList.toggle("show-edit-column", state.showEditColumn);
  const rows = filterPacks(getGiftPacks())
    .map(pack => ({ pack, calc: calcPack(pack), rec: recommendation(calcPack(pack).percent, calcPack(pack).fullyPriced) }))
    .sort((a, b) => {
      const av = a.calc.percent ?? -Infinity;
      const bv = b.calc.percent ?? -Infinity;
      return state.sortDesc ? bv - av : av - bv;
    });

  body.innerHTML = rows.map(({ pack, calc, rec }) => {
    const priceNote = pack.threeForOne ? `<div class="subnote">吃满等效：${fmtNum(pack.price * 3 / 4, 0)}</div>` : "";
    const valueText = pack.isRandom && calc.maxValueGold !== null
      ? `${fmtGold(calc.valueGold)} ~ ${fmtGold(calc.maxValueGold)}`
      : formatGoldRange(calc.minValueGold, calc.maxValueGold, calc.valueGold);
    const valueRmbText = pack.isRandom && calc.maxValueGold !== null
      ? `${fmtRmb(goldToRmb(calc.valueGold))} ~ ${fmtRmb(goldToRmb(calc.maxValueGold))}`
      : formatRmbRange(calc.minValueGold, calc.maxValueGold, calc.valueGold);
    const percentText = pack.isRandom && calc.randomResults
      ? "见结果区间"
      : formatPercentRange(calc.minPercent, calc.maxPercent, calc.percent);
    const note = [pack.isCombo ? "奖励屋组合" : "", packNeedSelectionSummary(pack), pack.isRandom ? "随机箱无概率，不算期望值" : "", !calc.fullyPriced ? "含未估值内容" : ""].filter(Boolean).join(" · ");
    return `
      <tr>
        <td>${imageHtml(pack.image, pack.name, "pack-thumb")}</td>
        <td>
          <button class="pack-name-btn" type="button" data-pack-id="${escapeAttr(pack.id)}">${escapeHtml(pack.name)}</button>
          ${note ? `<div class="subnote">${escapeHtml(note)}</div>` : ""}
        </td>
        <td><span class="tag ${pack.currency === "blue" ? "blue" : "royal"}">${currencyLabel(pack.currency)}</span></td>
        <td>${fmtNum(pack.price, 0)}${priceNote}</td>
        <td>${pack.threeForOne ? '<span class="flag">是</span>' : "否"}</td>
        <td>${pack.isSelfSelect ? '<span class="flag">是</span>' : "否"}</td>
        <td>${fmtGold(calc.costGold)}</td>
        <td>${fmtRmb(goldToRmb(calc.costGold))}</td>
        <td>${valueText}</td>
        <td>${valueRmbText}</td>
        <td class="${rec.className}"><strong>${percentText}</strong></td>
        <td><span class="rec-pill ${rec.className}">${rec.level}</span></td>
        <td><button class="ghost-btn edit-pack-btn" type="button" data-edit-pack-id="${escapeAttr(pack.id)}">编辑</button></td>
      </tr>
    `;
  }).join("");

  body.querySelectorAll(".pack-name-btn").forEach(button => {
    button.addEventListener("click", () => openModal(button.dataset.packId));
  });
  body.querySelectorAll(".edit-pack-btn").forEach(button => {
    button.addEventListener("click", () => openPackEditor(button.dataset.editPackId));
  });
}

function openModal(packId) {
  const pack = findPack(packId);
  if (!pack) return;
  state.selectedPackId = packId;
  renderModal(pack);
  document.getElementById("modalBackdrop").hidden = false;
  syncModalOpenState();
  document.querySelector(".modal").focus();
}

function closeModal() {
  state.selectedPackId = null;
  document.getElementById("modalBackdrop").hidden = true;
  document.querySelector(".modal")?.classList.remove("fit-modal");
  syncModalOpenState();
}

function renderModal(pack) {
  const calc = calcPack(pack);
  const singleCalc = pack.threeForOne ? calcPack(pack, { forceSingle: true }) : null;
  const rec = recommendation(calc.percent, calc.fullyPriced);
  const modal = document.getElementById("modalContent");
  document.querySelector(".modal")?.classList.toggle("fit-modal", !!pack.isSelfSelect);
  modal.innerHTML = `
    <div class="modal-grid">
      <div>
        ${imageHtml(pack.image, pack.name, "hero-img")}
        ${itemIconGalleryHtml(pack)}
      </div>
      <div>
        <h2 id="modalTitle">${escapeHtml(pack.name)}</h2>
        <div>
          <span class="tag ${pack.currency === "blue" ? "blue" : "royal"}">${currencyLabel(pack.currency)}</span>
          ${pack.threeForOne ? '<span class="tag royal">3赠1</span>' : ""}
          ${pack.isSelfSelect ? '<span class="tag blue">自选5项</span>' : ""}
          ${pack.isRandom ? '<span class="tag blue">随机箱</span>' : ""}
          ${pack.isCombo ? '<span class="tag royal">奖励屋组合</span>' : ""}
        </div>
        ${pack.note ? `<div class="break-even">${escapeHtml(pack.note)}</div>` : ""}
        <div class="summary-strip">
          <div class="summary-item"><span>单买价格</span><strong>${fmtNum(pack.price, 0)} ${currencyLabel(pack.currency)}</strong></div>
          <div class="summary-item"><span>${pack.threeForOne ? "吃满3赠1成本" : "礼包成本折金币"}</span><strong>${fmtGold(calc.costGold)}</strong></div>
          <div class="summary-item"><span>折人民币成本</span><strong>${fmtRmb(goldToRmb(calc.costGold))}</strong></div>
          <div class="summary-item"><span>内容物估值金币</span><strong>${pack.isRandom && calc.maxValueGold !== null ? `${fmtGold(calc.valueGold)} ~ ${fmtGold(calc.maxValueGold)}` : formatGoldRange(calc.minValueGold, calc.maxValueGold, calc.valueGold)}</strong></div>
        </div>
        ${singleCalc ? `
          <div class="summary-strip">
            <div class="summary-item"><span>单买成本折金币</span><strong>${fmtGold(singleCalc.costGold)}</strong></div>
            <div class="summary-item"><span>单买折人民币</span><strong>${fmtRmb(goldToRmb(singleCalc.costGold))}</strong></div>
            <div class="summary-item"><span>单买性价比</span><strong class="${recommendation(singleCalc.percent, singleCalc.fullyPriced).className}">${formatPercentRange(singleCalc.minPercent, singleCalc.maxPercent, singleCalc.percent)}</strong></div>
            <div class="summary-item"><span>吃满等效单箱</span><strong>${fmtNum(pack.price * 3 / 4, 0)} ${currencyLabel(pack.currency)}</strong></div>
            <div class="summary-item"><span>吃满性价比</span><strong class="${rec.className}">${formatPercentRange(calc.minPercent, calc.maxPercent, calc.percent)}</strong></div>
          </div>
        ` : ""}
        ${pack.threeForOne && !calc.fullyPriced ? breakEvenHtml(pack, calc) : ""}
        ${includedContentsHtml(pack)}
        ${choiceGroupsHtml(pack)}
        ${pack.isSelfSelect ? `${selfSelectHtml(pack, calc)}${itemsTableHtml(calc.lines || [])}` : pack.isRandom ? randomBoxHtml(pack, calc) : itemsTableHtml(calc.lines || valueContents(packValuationContents(pack)).lines)}
      </div>
    </div>
  `;

  wireModalEvents(pack);
}

function choiceGroupsHtml(pack) {
  if (!pack.choiceGroups?.length) return "";
  return `
    <div class="choice-groups-box">
      ${pack.choiceGroups.map(group => {
        const selected = selectedChoiceGroupOption(pack, group);
        const groupQty = splitTrailingQtyLabel(group.name, group.qty).qty;
        const selectedQty = selected ? choiceOptionQty(pack, group, selected) * groupQty : 0;
        return `
          <div class="choice-group" data-choice-group="${escapeAttr(group.id)}">
            <div class="select-toolbar">
              <div>
                <strong>${escapeHtml(group.name)}</strong>
                <div class="subnote">当前计入：${escapeHtml(displayItemName(selected?.name || ""))}×${fmtNum(selectedQty, 0)}</div>
              </div>
            </div>
            <div class="option-grid choice-option-grid">
              ${group.options.map(option => {
                const unit = itemUnitGold(option);
                const optionQty = choiceOptionQty(pack, group, option);
                const totalQty = optionQty * groupQty;
                const total = unit.value === null ? null : unit.value * totalQty;
                const minTotal = unit.minValue === undefined || unit.minValue === null ? total : unit.minValue * totalQty;
                const maxTotal = unit.maxValue === undefined || unit.maxValue === null ? total : unit.maxValue * totalQty;
                const checked = selected?.name === option.name;
                const source = `${group.name}：每箱${option.name}×${optionQty}`;
                return `
                  <label class="option-card">
                    <input type="radio" name="choice-${escapeAttr(pack.id)}-${escapeAttr(group.id)}" data-choice-group-id="${escapeAttr(group.id)}" data-choice-option-name="${escapeAttr(option.name)}" ${checked ? "checked" : ""}>
                    <span>
                      <strong>${escapeHtml(displayItemName(option.name))}×${fmtNum(optionQty, 0)}</strong>
                      <span class="subnote">${escapeHtml(source)}</span>
                    </span>
                    <strong>${total === null ? "未计入" : formatGoldRange(minTotal, maxTotal, total)}</strong>
                  </label>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function valuedIncludedContent(pack, content) {
  if (!content.isChoiceGroupContent) {
    const unit = itemUnitGold(content);
    const total = unit.value === null ? null : unit.value * content.qty;
    const minTotal = unit.minValue === undefined || unit.minValue === null ? total : unit.minValue * content.qty;
    const maxTotal = unit.maxValue === undefined || unit.maxValue === null ? total : unit.maxValue * content.qty;
    return { source: unit.source, total, minTotal, maxTotal };
  }
  const group = (pack.choiceGroups || []).find(item => item.id === content.choiceGroupId);
  const selected = group ? selectedChoiceGroupOption(pack, group) : null;
  if (!group || !selected) return { source: "", total: null, minTotal: null, maxTotal: null };
  const unit = itemUnitGold(selected);
  const groupQty = splitTrailingQtyLabel(group.name, group.qty).qty;
  const totalQty = choiceOptionQty(pack, group, selected) * groupQty;
  const total = unit.value === null ? null : unit.value * totalQty;
  const minTotal = unit.minValue === undefined || unit.minValue === null ? total : unit.minValue * totalQty;
  const maxTotal = unit.maxValue === undefined || unit.maxValue === null ? total : unit.maxValue * totalQty;
  return {
    source: `当前计入：${displayItemName(selected.name)}×${fmtNum(totalQty, 0)}`,
    total,
    minTotal,
    maxTotal
  };
}

function includedContentsHtml(pack) {
  const contents = selectablePackContents(pack);
  if (contents.length <= 1) return "";
  const selected = includedContentKeys(pack);
  return `
    <div class="need-select-box">
      <div class="select-toolbar">
        <div>
          <strong>需求计入：已选 ${selected.size}/${contents.length} 项</strong>
          <div class="subnote">只勾选你真正需要的内容物，未勾选项不参与内容估值和性价比计算。</div>
        </div>
        <button type="button" class="ghost-btn" id="includeAllItemsBtn">全选计入</button>
      </div>
      <div class="option-grid need-option-grid">
        ${contents.map((content, index) => {
          const valued = valuedIncludedContent(pack, content);
          const key = contentSelectionKey(content, index);
          const checked = selected.has(key);
          return `
            <label class="option-card ${checked ? "" : "option-disabled"}">
              <input type="checkbox" data-included-content-key="${escapeAttr(key)}" ${checked ? "checked" : ""}>
              <span>
                <strong>${displayItemWithQty(content.name, content.qty)}</strong>
                <span class="subnote">${escapeHtml(valued.source)}</span>
              </span>
              <strong>${valued.total === null ? "未计入" : formatGoldRange(valued.minTotal, valued.maxTotal, valued.total)}</strong>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function breakEvenHtml(pack, calc) {
  const single = moneyCostGold(pack, { threeForOne: false });
  const full = moneyCostGold(pack, { threeForOne: true });
  return `
    <div class="break-even">
      回本线：单买每箱内容需要值 ${fmtGold(single)} 金达到 100%；吃满 3赠1 后每箱内容需要值 ${fmtGold(full)} 金达到 100%。
      已知可估值部分：${fmtGold(calc.valueGold)} 金；未估值内容填入后会自动重算。
    </div>
  `;
}

function packEditHtml(pack) {
  const editableContents = pack.isRandom || pack.isSelfSelect || pack.choiceGroups?.length ? modalDisplayItems(pack) : pack.contents || [];
  return `
    <div class="pack-edit-box" data-pack-edit-id="${escapeAttr(pack.id)}">
      <h3>编辑礼包内容</h3>
      <div class="pack-edit-grid">
        <label>
          礼包名称
          <input id="editPackNameInput" type="text" value="${escapeAttr(pack.name)}">
        </label>
        <label>
          历史关联
          <select id="editPackHistoryInput">
            ${packHistoryOptionsHtml(packHistoryLinks[pack.id] || pack.id)}
          </select>
        </label>
        <label>
          价格
          <input id="editPackPriceInput" type="number" min="0" step="1" value="${escapeAttr(pack.price)}">
        </label>
        <label>
          币种
          <select id="editPackCurrencyInput">
            <option value="royal" ${pack.currency === "royal" ? "selected" : ""}>彩钻</option>
            <option value="blue" ${pack.currency === "blue" ? "selected" : ""}>蓝钻</option>
          </select>
        </label>
        <label>
          标签
          <select id="editPackKindInput">
            <option value="normal" ${!pack.threeForOne && !pack.isCombo && !pack.isSelfSelect ? "selected" : ""}>普通礼包</option>
            <option value="threeForOne" ${pack.threeForOne ? "selected" : ""}>3赠1</option>
            <option value="selfSelect" ${pack.isSelfSelect ? "selected" : ""}>自选礼包</option>
            <option value="combo" ${pack.isCombo ? "selected" : ""}>奖励屋组合</option>
          </select>
        </label>
        <label>
          状态
          <select id="editPackStatusInput">
            <option value="active" ${pack.expired ? "" : "selected"}>上架中</option>
            <option value="expired" ${pack.expired ? "selected" : ""}>已过期</option>
          </select>
        </label>
        <label>
          上传封面图（1:1，建议 1024×1024）
          <span class="image-input-row">
            <input id="editPackImageFileInput" type="file" accept="image/*">
            <input id="editPackImageInput" type="hidden" value="${escapeAttr(pack.image || "")}">
          </span>
        </label>
        <input id="editPackNoteInput" type="hidden" value="${escapeAttr(pack.note || "")}">
      </div>
      <div class="content-edit-list" id="contentEditList">
        ${editableContents.map((content, index) => contentEditRowHtml(content, index)).join("")}
      </div>
      <div class="pack-edit-actions">
        <button id="addContentRowBtn" type="button" class="ghost-btn">添加内容物</button>
        <button id="applyHistoryPackBtn" type="button" class="ghost-btn">套用历史</button>
        <button id="linkHistoryPackBtn" type="button" class="ghost-btn">关联历史</button>
        <button id="unlinkHistoryPackBtn" type="button" class="ghost-btn">取消关联</button>
        <button id="savePackEditBtn" type="button" class="ghost-btn">保存礼包</button>
        <button id="deletePackBtn" type="button" class="danger-btn">删除礼包</button>
      </div>
      ${pack.isRandom || pack.isSelfSelect ? '<div class="subnote">随机箱和自选箱的高级结果仍使用原始规则；这里主要编辑封面、名称、价格和普通内容展示。</div>' : ""}
    </div>
  `;
}

function contentEditRowHtml(content = {}, index = 0) {
  const iconPath = resolveItemIconPath(content.name) || "";
  return `
    <div class="content-edit-row" data-content-row="${index}">
      <label>
        内容物名称
        <input type="text" data-content-name value="${escapeAttr(content.name || "")}">
      </label>
      <label>
        数量
        <input type="number" min="0" step="1" data-content-qty value="${escapeAttr(content.qty || 1)}">
      </label>
      <label>
        图标
        <select data-content-icon-choice>
          ${itemIconOptionsHtml(iconPath)}
        </select>
        <input type="hidden" data-content-icon value="${escapeAttr(iconPath)}">
      </label>
      <button type="button" class="remove-row-btn" data-remove-content title="删除内容物">×</button>
    </div>
  `;
}

function itemIconOptionsHtml(selectedPath = "") {
  const entries = iconChoiceEntries();
  return [
    '<option value="">自动匹配</option>',
    ...entries.map(([name, path]) => `<option value="${escapeAttr(path)}" ${path === selectedPath ? "selected" : ""}>${escapeHtml(displayItemName(name))}</option>`)
  ].join("");
}

function iconChoiceEntries() {
  const byPath = new Map();
  Object.entries(itemIcons).forEach(([name, path]) => byPath.set(path, [name, path]));
  Object.entries(editableItemIcons).forEach(([name, path]) => {
    if (path && !looksLikeBrokenPath(path)) byPath.set(path, [name, path]);
  });
  return [...byPath.values()].sort((a, b) => displayItemName(a[0]).localeCompare(displayItemName(b[0]), "zh-CN"));
}

function itemsTableHtml(lines) {
  if (!lines || !lines.length) return "";
  return `
    <table class="items-table">
      <thead><tr><th>内容物</th><th>数量</th><th>单价</th><th>折金币价值</th><th>每箱/个估值</th></tr></thead>
      <tbody>
        ${lines.map(line => `
          <tr>
            <td>${escapeHtml(displayItemName(line.name))}</td>
            <td>${fmtNum(line.qty, 0)}</td>
            <td>${line.unitGold === null ? '<span class="value-unknown">未计入</span>' : `${formatGoldRange(line.minUnitGold, line.maxUnitGold, line.unitGold)} 金`}</td>
            <td>${line.totalGold === null ? '<span class="value-unknown">未计入估值</span>' : `${formatGoldRange(line.minTotalGold, line.maxTotalGold, line.totalGold)} 金`}</td>
            <td class="muted">${escapeHtml(line.source || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatGoldRange(min, max, fallback) {
  if (min !== undefined && max !== undefined && min !== null && max !== null && Math.round(min) !== Math.round(max)) {
    return `${fmtGold(min)}~${fmtGold(max)}`;
  }
  return fmtGold(fallback);
}

function formatRmbRange(minGold, maxGold, fallbackGold) {
  if (minGold !== undefined && maxGold !== undefined && minGold !== null && maxGold !== null && Math.round(minGold) !== Math.round(maxGold)) {
    return `${fmtRmb(goldToRmb(minGold))}~${fmtRmb(goldToRmb(maxGold))}`;
  }
  return fmtRmb(goldToRmb(fallbackGold));
}

function formatPercentRange(min, max, fallback) {
  if (min !== undefined && max !== undefined && min !== null && max !== null && Math.abs(min - max) >= 0.01) {
    return `${fmtPercent(min)}~${fmtPercent(max)}`;
  }
  return fmtPercent(fallback);
}

function selfSelectHtml(pack, calc) {
  const selected = state.selectedOptions[pack.id] || new Set();
  const count = selected.size;
  const rec = recommendation(calc.percent, calc.fullyPriced && count === pack.chooseCount);
  return `
    <div class="self-select-box">
      <div class="select-toolbar">
        <div>
          <strong>可选项：已选 ${count}/${pack.chooseCount}</strong>
          <div class="subnote">只计算当前勾选的5项；未勾满或超选时推荐等级按未定处理。</div>
        </div>
        <button type="button" class="ghost-btn" id="autoSelectBestBtn">自动选择最高价值5项</button>
      </div>
      <div class="summary-strip">
        <div class="summary-item"><span>当前选择估值</span><strong>${formatGoldRange(calc.minValueGold, calc.maxValueGold, calc.valueGold)}</strong></div>
        <div class="summary-item"><span>当前性价比</span><strong class="${rec.className}">${count === pack.chooseCount ? formatPercentRange(calc.minPercent, calc.maxPercent, calc.percent) : "需选满5项"}</strong></div>
        <div class="summary-item"><span>购买成本</span><strong>${fmtGold(calc.costGold)}</strong></div>
      </div>
      <div class="option-grid">
        ${pack.options.map(option => {
          const unit = itemUnitGold(option);
          const total = unit.value === null ? null : unit.value * option.qty;
          const minTotal = unit.minValue === undefined || unit.minValue === null ? total : unit.minValue * option.qty;
          const maxTotal = unit.maxValue === undefined || unit.maxValue === null ? total : unit.maxValue * option.qty;
          const checked = selected.has(option.name);
          const disabled = !checked && count >= pack.chooseCount;
          return `
            <label class="option-card ${disabled ? "option-disabled" : ""}">
              <input type="checkbox" data-option-name="${escapeAttr(option.name)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
              <span>
                <strong>${escapeHtml(displayItemName(option.name))}×${fmtNum(option.qty, 0)}</strong>
                <span class="subnote">${escapeHtml(unit.source)}</span>
              </span>
              <strong>${total === null ? "未计入" : formatGoldRange(minTotal, maxTotal, total)}</strong>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function randomBoxHtml(pack, calc) {
  const results = calc.randomResults || [];
  const known = results.filter(result => result.valueGold !== null);
  const unknown = results.filter(result => result.valueGold === null);
  const min = known.length ? known.reduce((a, b) => a.valueGold <= b.valueGold ? a : b) : null;
  const max = known.length ? known.reduce((a, b) => a.valueGold >= b.valueGold ? a : b) : null;
  return `
    <div class="break-even">随机箱没有概率，不计算期望值。下面按每种可能结果单独计算性价比。</div>
    <div class="random-stats">
      <div class="summary-item"><span>最低已知结果</span><strong>${min ? `${escapeHtml(displayItemName(min.name))} · ${fmtPercent(min.percent)}` : "无"}</strong></div>
      <div class="summary-item"><span>最高已知结果</span><strong>${max ? `${escapeHtml(displayItemName(max.name))} · ${fmtPercent(max.percent)}` : "无"}</strong></div>
      <div class="summary-item"><span>未估值结果</span><strong>${unknown.length} 项</strong></div>
    </div>
    <table class="random-table">
      <thead><tr><th>结果</th><th>内容</th><th>折金币价值</th><th>性价比</th><th>备注</th></tr></thead>
      <tbody>
        ${results.map(result => {
          const rec = recommendation(result.percent, result.unknownCount === 0);
          return `
            <tr>
              <td>#${result.index}</td>
              <td>${escapeHtml(displayItemName(result.name))}</td>
              <td>${result.valueGold === null ? '<span class="value-unknown">未计入</span>' : `${formatGoldRange(result.minValueGold, result.maxValueGold, result.valueGold)} 金`}</td>
              <td class="${result.unknownCount === 0 ? rec.className : "value-unknown"}">${result.unknownCount === 0 ? formatPercentRange(result.minPercent, result.maxPercent, result.percent) : "未定"}</td>
              <td class="muted">${result.unknownCount ? "含未估值内容，可在上方手动填价" : "已计入"}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function wireModalEvents(pack) {
  const modal = document.getElementById("modalContent");
  modal.querySelectorAll("[data-included-content-key]").forEach(input => {
    input.addEventListener("change", event => {
      const selected = includedContentKeys(pack);
      if (event.target.checked) selected.add(event.target.dataset.includedContentKey);
      else selected.delete(event.target.dataset.includedContentKey);
      state.selectedIncludedItems[pack.id] = selected;
      renderTable();
      renderModal(pack);
    });
  });
  document.getElementById("includeAllItemsBtn")?.addEventListener("click", () => {
    const contents = selectablePackContents(pack);
    const keys = contents.map((content, index) => contentSelectionKey(content, index));
    state.selectedIncludedItems[pack.id] = new Set(keys);
    state.knownIncludedItemKeys[pack.id] = new Set(keys);
    renderTable();
    renderModal(pack);
  });
  modal.querySelectorAll("[data-choice-group-id]").forEach(input => {
    input.addEventListener("change", event => {
      if (!event.target.checked) return;
      const key = choiceGroupStateKey(pack.id, event.target.dataset.choiceGroupId);
      state.selectedChoiceGroups[key] = event.target.dataset.choiceOptionName;
      renderTable();
      renderModal(pack);
    });
  });
  if (!pack.isSelfSelect) return;
  modal.querySelectorAll("[data-option-name]").forEach(input => {
    input.addEventListener("change", event => {
      const selected = state.selectedOptions[pack.id] || new Set();
      if (event.target.checked) {
        if (selected.size >= pack.chooseCount && !selected.has(event.target.dataset.optionName)) {
          event.target.checked = false;
          return;
        }
        selected.add(event.target.dataset.optionName);
      } else {
        selected.delete(event.target.dataset.optionName);
      }
      state.selectedOptions[pack.id] = selected;
      renderTable();
      renderModal(pack);
    });
  });
  const autoButton = document.getElementById("autoSelectBestBtn");
  if (autoButton) {
    autoButton.addEventListener("click", () => {
      const best = [...pack.options]
        .map(option => {
          const unit = itemUnitGold(option);
          return { option, total: unit.value === null ? -Infinity : unit.value * option.qty };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, pack.chooseCount)
        .map(entry => entry.option.name);
      state.selectedOptions[pack.id] = new Set(best);
      renderTable();
      renderModal(pack);
    });
  }
}

function wirePackEditEvents(pack) {
  const box = document.querySelector("[data-pack-edit-id]");
  if (!box) return;
  const imageInput = document.getElementById("editPackImageInput");
  const imageFile = document.getElementById("editPackImageFileInput");
  imageFile?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    imageInput.value = await readFileAsDataUrl(file);
  });
  document.getElementById("addContentRowBtn")?.addEventListener("click", () => {
    const list = document.getElementById("contentEditList");
    list.insertAdjacentHTML("beforeend", contentEditRowHtml({ name: "", qty: 1 }, list.children.length));
    wireContentEditRows();
  });
  document.getElementById("applyHistoryPackBtn")?.addEventListener("click", () => {
    const history = selectedPackHistory();
    if (!history) return;
    document.getElementById("editPackNameInput").value = history.name;
    document.getElementById("editPackPriceInput").value = history.price;
    document.getElementById("editPackCurrencyInput").value = history.currency;
    imageInput.value = history.image || "";
    const list = document.getElementById("contentEditList");
    list.innerHTML = (history.contents || []).map((content, index) => contentEditRowHtml(content, index)).join("");
    wireContentEditRows();
  });
  document.getElementById("linkHistoryPackBtn")?.addEventListener("click", () => {
    const history = selectedPackHistory();
    if (!history) return;
    packHistoryLinks[pack.id] = history.sourcePackId || history.id;
    saveJson(EDITABLE_STORAGE_KEYS.packLinks, packHistoryLinks);
    openPackEditor(pack.id);
  });
  document.getElementById("unlinkHistoryPackBtn")?.addEventListener("click", () => {
    delete packHistoryLinks[pack.id];
    saveJson(EDITABLE_STORAGE_KEYS.packLinks, packHistoryLinks);
    openPackEditor(pack.id);
  });
  document.getElementById("savePackEditBtn")?.addEventListener("click", () => {
    const kind = document.getElementById("editPackKindInput").value;
    const editedContents = readContentEditRows();
    const selfSelectCount = Math.min(Number(pack.chooseCount) || 5, editedContents.length || Number(pack.chooseCount) || 5);
    const next = sanitizePack({
      ...pack,
      name: document.getElementById("editPackNameInput").value.trim() || pack.name,
      price: Number(document.getElementById("editPackPriceInput").value) || 0,
      currency: document.getElementById("editPackCurrencyInput").value,
      image: imageInput.value.trim(),
      note: document.getElementById("editPackNoteInput")?.value.trim() || "",
      contents: kind === "selfSelect" ? [] : editedContents,
      options: kind === "selfSelect" ? editedContents : [],
      defaultSelected: kind === "selfSelect" ? editedContents.slice(0, selfSelectCount).map(content => content.name) : [],
      chooseCount: kind === "selfSelect" ? selfSelectCount : pack.chooseCount,
      expired: document.getElementById("editPackStatusInput").value === "expired",
      threeForOne: kind === "threeForOne",
      isCombo: kind === "combo",
      isSelfSelect: kind === "selfSelect"
    }, giftPacks.find(item => item.id === pack.id) || {});
    savePackEdit(next);
    state.editingPackId = next.id;
    renderManualValues();
    renderTable();
    refreshSelectedModal();
    openPackEditor(next.id);
  });
  document.getElementById("deletePackBtn")?.addEventListener("click", () => {
    if (!window.confirm(`删除「${pack.name}」？`)) return;
    deletePackEdit(pack.id);
    closeEditDialog();
    closeModal();
    renderManualValues();
    renderTable();
  });
  wireContentEditRows();
}

function selectedPackHistory() {
  const historyId = document.getElementById("editPackHistoryInput")?.value;
  return historyId ? packHistory.find(item => item.historyId === historyId) : null;
}

function wireContentEditRows() {
  document.querySelectorAll("[data-remove-content]").forEach(button => {
    button.onclick = () => button.closest(".content-edit-row")?.remove();
  });
  document.querySelectorAll("[data-content-icon-choice]").forEach(select => {
    select.onchange = () => {
      const row = select.closest(".content-edit-row");
      const iconInput = row?.querySelector("[data-content-icon]");
      if (iconInput) iconInput.value = select.value;
    };
  });
}

function readContentEditRows() {
  return [...document.querySelectorAll(".content-edit-row")].map(row => {
    const name = row.querySelector("[data-content-name]")?.value.trim();
    const qty = Number(row.querySelector("[data-content-qty]")?.value) || 1;
    const iconPath = row.querySelector("[data-content-icon]")?.value.trim();
    if (name) saveItemIconEdit(name, iconPath);
    return name ? { name, qty } : null;
  }).filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function imageHtml(path, alt, className) {
  if (!path) return `<div class="${className} placeholder-img">${escapeHtml(alt)}</div>`;
  return `<img class="${className}" src="${escapeAttr(path)}" alt="${escapeAttr(alt)}" onerror="this.replaceWith(createPlaceholder('${escapeAttr(alt)}','${escapeAttr(className)}'))">`;
}

function itemIconGalleryHtml(pack) {
  const items = modalDisplayItems(pack);
  if (!items.length) {
    return `<div class="detail-gallery">${(pack.detailImages || []).map(path => imageHtml(path, pack.name, "detail-img")).join("")}</div>`;
  }
  return `
    <div class="content-icon-grid" aria-label="内容物图标">
      ${items.map(entry => `
        <div class="content-icon-card">
          ${itemIconHtml(entry.name)}
          <strong>${escapeHtml(displayItemName(entry.name))}</strong>
          <span>×${fmtNum(entry.qty, 0)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function modalDisplayItems(pack) {
  const source = pack.isRandom
    ? pack.randomResults.flat()
    : pack.isSelfSelect
      ? pack.options
      : normalPackContents(pack);
  const choiceContents = pack.isRandom || pack.isSelfSelect
    ? []
    : (pack.choiceGroups || []).map(group => splitTrailingQtyLabel(group.name, group.qty));
  const merged = new Map();
  [...source, ...choiceContents].forEach(entry => {
    if (!entry || !entry.name) return;
    const current = merged.get(entry.name) || { name: entry.name, qty: 0 };
    current.qty += Number(entry.qty) || 0;
    merged.set(entry.name, current);
  });
  return [...merged.values()];
}

function itemIconHtml(name) {
  const path = resolveItemIconPath(name);
  const label = displayItemName(name);
  if (!path) return `<span class="item-icon item-icon-fallback">${escapeHtml(label.slice(0, 1))}</span>`;
  return `<img class="item-icon" src="${escapeAttr(path)}" alt="${escapeAttr(label)}" loading="eager" decoding="async" onerror="this.replaceWith(createItemIconFallback('${escapeAttr(label)}'))">`;
}

function resolveItemIconPath(name) {
  if (!name) return "";
  if (editableItemIcons[name] && !looksLikeBrokenPath(editableItemIcons[name])) return editableItemIcons[name];
  if (itemIcons[name]) return itemIcons[name];
  const match = inferredItemIconFiles.find(([keyword]) => String(name).includes(keyword));
  return match ? icon(match[1]) : "";
}

function looksLikeBrokenPath(path) {
  return /�|鍛|鐭|煶|埜|彺|寘|绠|瓙|€/.test(String(path || ""));
}

function createItemIconFallback(name) {
  const span = document.createElement("span");
  span.className = "item-icon item-icon-fallback";
  span.textContent = String(name || "?").slice(0, 1);
  return span;
}

function createPlaceholder(text, className) {
  const div = document.createElement("div");
  div.className = `${className} placeholder-img`;
  div.textContent = text || "图片缺失";
  div.style.display = "grid";
  div.style.placeItems = "center";
  div.style.color = "#a8b0bd";
  div.style.textAlign = "center";
  div.style.padding = "8px";
  div.style.background = "linear-gradient(135deg, rgba(244,200,106,.08), rgba(66,212,255,.08))";
  return div;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function bindControls() {
  const videoCommand = "cd C:\\Users\\30814\\Desktop\\code\\remotion-video; npm run render:giftpack";
  const videoButton = document.getElementById("videoExportBtn");
  if (videoButton) {
    videoButton.title = videoCommand;
    videoButton.addEventListener("click", async () => {
      const originalText = videoButton.textContent;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(videoCommand);
        else throw new Error("clipboard unavailable");
        videoButton.textContent = "已复制命令";
      } catch (error) {
        window.prompt("复制这条命令到 PowerShell 运行：", videoCommand);
        videoButton.textContent = "查看导出命令";
      }
      window.setTimeout(() => {
        videoButton.textContent = originalText;
      }, 2200);
    });
  }
  const addPackButton = document.getElementById("addCustomPackBtn");
  const manualToggle = document.getElementById("manualValuesToggleBtn");
  const importInput = document.getElementById("giftPackImportInput");
  document.getElementById("refreshAuthorDataBtn")?.addEventListener("click", refreshAuthorGiftPackData);
  document.getElementById("exportGiftPackDataBtn")?.addEventListener("click", exportGiftPackData);
  document.getElementById("importGiftPackDataBtn")?.addEventListener("click", () => {
    importInput?.click();
  });
  importInput?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    importGiftPackData(file);
    event.target.value = "";
  });
  manualToggle?.addEventListener("click", () => {
    openEditDialog("manual");
  });
  addPackButton?.addEventListener("click", () => {
    const pack = createCustomPackTemplate();
    editableCustomPacks.push(pack);
    saveJson(EDITABLE_STORAGE_KEYS.customPacks, editableCustomPacks);
    state.editingPackId = pack.id;
    renderManualValues();
    renderTable();
    openPackEditor(pack.id);
  });
  const floatingEditButton = document.getElementById("floatingEditBtn");
  const floatingEditMenu = document.getElementById("floatingEditMenu");
  const closeFloatingMenu = () => {
    if (floatingEditMenu) floatingEditMenu.hidden = true;
  };
  floatingEditButton?.addEventListener("click", event => {
    event.stopPropagation();
    if (floatingEditMenu) floatingEditMenu.hidden = !floatingEditMenu.hidden;
  });
  document.getElementById("toggleEditListBtn")?.addEventListener("click", () => {
    toggleEditColumn();
    closeFloatingMenu();
  });
  document.getElementById("openFirstPackEditorBtn")?.addEventListener("click", () => {
    openFirstPackEditor();
    closeFloatingMenu();
  });
  document.getElementById("floatingAddPackBtn")?.addEventListener("click", () => {
    addPackButton?.click();
    closeFloatingMenu();
  });
  document.addEventListener("click", event => {
    if (!event.target.closest?.(".floating-edit")) closeFloatingMenu();
  });
  renderRateControls();
  document.getElementById("crystalRateInput").value = state.royalPerRmb;
  document.getElementById("blueSourceInput").value = state.blueSource;
  document.getElementById("goldRateInput").addEventListener("input", event => {
    if (applyGoldRate(event.target.value)) {
      localStorage.setItem(GOLD_RATE_MANUAL_OVERRIDE_KEY, "true");
      saveSettings();
      renderRateControls();
      renderManualValues();
      renderTable();
      if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
    }
  });
  document.getElementById("crystalRateInput").addEventListener("input", event => {
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value > 0) state.royalPerRmb = value;
    saveSettings();
    renderManualValues();
    renderTable();
    if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
  });
  document.getElementById("blueSourceInput").addEventListener("change", event => {
    state.blueSource = event.target.value;
    saveSettings();
    renderManualValues();
    renderTable();
    if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
  });
  const preset = document.getElementById("royalDiscountPreset");
  const custom = document.getElementById("royalDiscountCustomInput");
  const syncDiscountControls = () => {
    const rounded = Number(state.royalDiscount.toFixed(2));
    const matched = [...preset.options].find(option => option.value !== "custom" && Number(option.value) === rounded);
    preset.value = matched ? matched.value : "custom";
    custom.value = String(state.royalDiscount);
    custom.hidden = preset.value !== "custom";
  };
  syncDiscountControls();
  preset.addEventListener("change", event => {
    if (event.target.value === "custom") {
      custom.hidden = false;
    } else {
      state.royalDiscount = Number(event.target.value);
      custom.hidden = true;
      custom.value = String(state.royalDiscount);
      saveSettings();
      renderManualValues();
      renderTable();
      if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
    }
  });
  custom.addEventListener("input", event => {
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value > 0 && value <= 1) {
      state.royalDiscount = value;
      preset.value = "custom";
      saveSettings();
      renderManualValues();
      renderTable();
      if (state.selectedPackId) renderModal(findPack(state.selectedPackId));
    }
  });
  document.getElementById("filterInput").addEventListener("change", event => {
    state.filter = event.target.value;
    renderTable();
  });
  document.getElementById("sortBtn").addEventListener("click", event => {
    state.sortDesc = !state.sortDesc;
    event.target.textContent = state.sortDesc ? "性价比降序" : "性价比升序";
    renderTable();
  });
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", event => {
    if (event.target.id === "modalBackdrop") closeModal();
  });
  document.getElementById("closeEditDialogBtn").addEventListener("click", closeEditDialog);
  document.getElementById("editDialogBackdrop").addEventListener("click", event => {
    if (event.target.id === "editDialogBackdrop") closeEditDialog();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !document.getElementById("modalBackdrop").hidden) closeModal();
    if (event.key === "Escape" && !document.getElementById("editDialogBackdrop").hidden) closeEditDialog();
  });
}

async function initGiftPackPage() {
  try {
    const loaderStartedAt = Date.now();
    initPageContentDefaults();
    setGiftPageLoadState("loading", "正在加载 gift-pack-data.json...");
    await loadPublicGiftPackData();
    setGiftPageLoadState("loading", "正在加载公开数据...");
    await syncGoldRateFromDashboard();
    setGiftPageLoadState("loading", "正在加载礼包缩略图...");
    await preloadGiftPackImages();
    const elapsed = Date.now() - loaderStartedAt;
    if (elapsed < MIN_GIFT_LOADER_MS) await wait(MIN_GIFT_LOADER_MS - elapsed);
    applyPageContent();
    bindControls();
    renderAuthorDataStatus();
    renderRateTimestamp();
    renderManualValues();
    renderTable();
    setGiftPageLoadState("ready");
  } catch (error) {
    console.warn("礼包页初始化失败：", error);
    setGiftPageLoadState("error", error.message || "礼包数据加载失败");
  }
}

initGiftPackPage();
