(() => {
  "use strict";

  const dashboard = window.LOSTARK_PUBLIC_DASHBOARD_STATE;
  const itemData = window.LOSTARK_PUBLIC_ITEM_PRICE_DATA;
  const materialHistory = window.LOSTARK_PUBLIC_MATERIAL_PRICE_HISTORY;
  const giftData = window.LOSTARK_PUBLIC_GIFT_PACK_DATA;
  const app = document.getElementById("app");

  const markets = [
    { id: "overview", label: "今日市场", short: "总" },
    { id: "materials", label: "材料", short: "材" },
    { id: "gems", label: "宝石", short: "宝" },
    { id: "engravings", label: "刻印书", short: "刻" },
    { id: "gifts", label: "礼包", short: "礼" },
    { id: "gold", label: "金价", short: "金" }
  ];

  const html = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const finite = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const number = value => finite(value) ? Number(value) : null;
  const fmt = (value, digits = 0) => finite(value)
    ? new Intl.NumberFormat("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value))
    : "—";
  const compact = value => {
    if (!finite(value)) return "—";
    const current = Number(value);
    if (Math.abs(current) >= 100000000) return `${fmt(current / 100000000, 2)} 亿`;
    if (Math.abs(current) >= 10000) return `${fmt(current / 10000, 1)} 万`;
    return fmt(current);
  };
  const pct = value => finite(value) ? `${Number(value) > 0 ? "+" : ""}${fmt(Number(value) * 100, 1)}%` : "—";
  const median = values => {
    const clean = values.filter(finite).map(Number).sort((a, b) => a - b);
    if (!clean.length) return null;
    const middle = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
  };
  const marketMeta = id => markets.find(market => market.id === id) || markets[0];
  const shortDate = value => {
    const parts = String(value || "").split("-");
    return parts.length === 3 ? `${Number(parts[1])}月${Number(parts[2])}日` : String(value || "—");
  };
  const changeClass = value => !finite(value) || Math.abs(Number(value)) < .0005 ? "neutral" : Number(value) > 0 ? "positive" : "negative";
  const delta = value => `<span class="delta ${changeClass(value)}">${finite(value) ? `${Number(value) > 0 ? "↑" : Number(value) < 0 ? "↓" : "•"} ${pct(value)}` : "—"}</span>`;
  const semanticDelta = (market, value) => market === "gifts" && finite(value)
    ? `<span class="delta ${Number(value) >= 0 ? "negative" : "positive"}">${pct(value)}</span>`
    : delta(value);

  const giftImageOverrides = {
    "[限购]终幕之战自选礼包": "../../assets/images/giftpacks/[限购]终幕之战自选礼包-封面.jpg",
    "[3赠1]精炼融合特惠礼包": "../../assets/images/giftpacks/[3赠1]精炼融合特惠礼包-封面.jpg",
    "高级精炼支援礼包": "../../assets/images/giftpacks/高级精炼支援礼包-封面.jpg",
    "[3赠1]精炼提升礼包": "../../assets/images/giftpacks/[3赠1]精炼提升礼包-封面.jpg",
    "命运远征自选礼包": "../../assets/images/giftpacks/命运远征自选礼包-封面.jpg",
    "[3赠1]精炼冲刺礼包": "../../assets/images/giftpacks/[3赠1]精炼冲刺礼包.jpg"
  };
  const normaliseAssetImage = sourceValue => {
    const source = String(sourceValue || "");
    if (source.startsWith("../assets/")) return `../../assets/${source.slice("../assets/".length)}`;
    if (source.startsWith("./public/images/")) return `../../assets/images/${source.slice("./public/images/".length)}`;
    return source || null;
  };
  const materialGroup = name => {
    if (/野花/.test(name)) return "采集";
    if (/木材/.test(name)) return "伐木";
    if (/矿石/.test(name)) return "采矿";
    if (/肉|皮革|狩猎/.test(name)) return "狩猎";
    if (/鱼|鲤|海鲜|钓鱼/.test(name)) return "钓鱼";
    if (/遗物|考古/.test(name)) return "考古";
    return "强化";
  };

  function buildData() {
    const materialRows = materialHistory?.rows || [];
    const latestMaterialValues = materialRows.at(-1)?.values || {};
    const materials = Object.entries(latestMaterialValues).map(([name, entry]) => {
      const series = materialRows.map(row => number(row.values?.[name]?.value));
      const labels = materialRows.map(row => row.date);
      const current = number(entry.value);
      const weekValue = series.at(-8) ?? series.find(finite);
      return {
        market: "materials",
        id: name,
        name,
        group: materialGroup(name),
        image: `../../assets/${name}.jpg`,
        current,
        unit: entry.stackSize ? `每 ${entry.stackSize} 个 / 金币` : "金币",
        dayChange: finite(entry.prevAvg) && Number(entry.prevAvg) !== 0 ? (current - Number(entry.prevAvg)) / Number(entry.prevAvg) : null,
        weekChange: finite(weekValue) && Number(weekValue) !== 0 ? (current - Number(weekValue)) / Number(weekValue) : null,
        prevAvg: number(entry.prevAvg),
        recentDeal: number(entry.recentDeal),
        low: Math.min(...series.slice(-30).filter(finite).map(Number)),
        series,
        labels
      };
    });

    const gemLevels = ["5级", "6级", "7级", "8级", "9级", "10级"];
    const gems = gemLevels.map(level => {
      const valid = (dashboard?.gemRows || []).map(row => ({ label: row.日期, value: number(row[level]) })).filter(point => finite(point.value));
      const current = valid.at(-1)?.value;
      const previous = valid.at(-2)?.value;
      const weekValue = valid.at(-8)?.value ?? valid[0]?.value;
      return {
        market: "gems",
        id: `${level}宝石`,
        name: `${level}宝石`,
        group: Number(level.replace("级", "")) <= 7 ? "基础" : "高阶",
        current,
        unit: "金币",
        dayChange: finite(previous) && previous !== 0 ? (current - previous) / previous : null,
        weekChange: finite(weekValue) && weekValue !== 0 ? (current - weekValue) / weekValue : null,
        prevAvg: median(valid.slice(-8, -1).map(point => point.value)),
        recentDeal: current,
        low: Math.min(...valid.slice(-30).map(point => point.value)),
        series: valid.map(point => point.value),
        labels: valid.map(point => point.label)
      };
    });

    const engravingRows = dashboard?.engravingBookPrices || [];
    const engravingDates = [...new Set(engravingRows.map(row => row.date))].sort();
    const latestEngravingDate = engravingDates.at(-1);
    const engravings = engravingRows.filter(row => row.date === latestEngravingDate).map(row => {
      const history = engravingRows.filter(entry => entry.name === row.name && entry.grade === row.grade).sort((a, b) => a.date.localeCompare(b.date));
      const current = number(row.lowest);
      const weekValue = number(history.at(-8)?.lowest ?? history[0]?.lowest);
      return {
        market: "engravings",
        id: `${row.name}-${row.grade || "遗物"}`,
        name: row.name,
        group: row.grade || "遗物",
        image: "../../assets/刻印书.jpg",
        current,
        unit: "最低价 / 金币",
        dayChange: finite(row.prevAvg) && Number(row.prevAvg) !== 0 ? (current - Number(row.prevAvg)) / Number(row.prevAvg) : null,
        weekChange: finite(weekValue) && weekValue !== 0 ? (current - weekValue) / weekValue : null,
        prevAvg: number(row.prevAvg),
        recentDeal: number(row.recentDeal),
        low: Math.min(...history.map(entry => Number(entry.lowest)).filter(finite)),
        series: history.map(entry => number(entry.lowest)),
        labels: history.map(entry => entry.date)
      };
    });

    const goldTransactions = (dashboard?.goldTxns || []).filter(transaction => finite(transaction.gold) && finite(transaction.price) && Number(transaction.price) > 0);
    const goldTypes = [...new Set(goldTransactions.map(transaction => transaction.type).filter(Boolean))];
    const buildGoldItem = (id, name, transactions, group) => {
      const daily = new Map();
      transactions.forEach(transaction => {
        const record = daily.get(transaction.date) || { date: transaction.date, gold: 0, price: 0, count: 0 };
        record.gold += Number(transaction.gold);
        record.price += Number(transaction.price);
        record.count += 1;
        daily.set(transaction.date, record);
      });
      const rows = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)).map(row => ({ ...row, value: row.gold / row.price }));
      const current = rows.at(-1)?.value;
      const previous = rows.at(-2)?.value;
      const weekValue = rows.at(-8)?.value ?? rows[0]?.value;
      return {
        market: "gold",
        id,
        name,
        group,
        current,
        unit: "金币 / 人民币",
        dayChange: finite(previous) && previous !== 0 ? (current - previous) / previous : null,
        weekChange: finite(weekValue) && weekValue !== 0 ? (current - weekValue) / weekValue : null,
        prevAvg: median(rows.slice(-8, -1).map(row => row.value)),
        recentDeal: current,
        low: Math.min(...rows.slice(-30).map(row => row.value)),
        series: rows.map(row => row.value),
        labels: rows.map(row => row.date),
        rows
      };
    };
    const gold = [buildGoldItem("gold-all", "综合金价", goldTransactions, `${goldTransactions.length} 笔交易`), ...goldTypes.map(type => buildGoldItem(`gold-${type}`, `${type}金价`, goldTransactions.filter(transaction => transaction.type === type), type))].filter(item => finite(item.current));
    const goldPerRmb = gold[0]?.current || 4189.67;

    const manualValues = itemData?.manualValues || {};
    const fixedValues = {
      "高级-英雄星石箱子": 2500,
      "稀有-英雄星石箱子": 7000,
      "星石加工初始化券": goldPerRmb * 16,
      "星石加工初始化/重置券": goldPerRmb * 16,
      "星石加工重置券": goldPerRmb * 16,
      "加工星石属性刷新券": goldPerRmb * 3
    };
    const components = {
      "4阶融合材料自选箱子": [["阿比多斯融合材料", 5]],
      "4阶破坏石自选箱子": [["命运破坏石", 50]],
      "4阶守护石自选箱子": [["命运守护石", 50]],
      "4阶碎片自选箱子": [["命运碎片袋子（中）", 1]],
      "4阶突破石自选箱子": [["命运突破石", 5]],
      "冰川之息箱子": [["冰川之息", 5]],
      "熔岩之息箱子": [["熔岩之息", 5]]
    };
    const unitValue = (name, depth = 0) => {
      if (depth > 4) return null;
      const manual = manualValues[name];
      if (manual && finite(manual.value)) return Number(manual.value) / (Number(manual.stackSize) || 1);
      if (finite(fixedValues[name])) return Number(fixedValues[name]);
      if (!components[name]) return null;
      const values = components[name].map(([child, quantity]) => {
        const value = unitValue(child, depth + 1);
        return finite(value) ? Number(value) * Number(quantity) : null;
      });
      return values.every(finite) ? values.reduce((sum, value) => sum + value, 0) : null;
    };

    const gifts = (giftData?.snapshot?.packs || []).map(pack => {
      let recognized = 0;
      let totalEntries = 0;
      let marketValue = 0;
      const breakdown = (pack.contents || []).map(content => {
        totalEntries += 1;
        const unit = unitValue(content.name);
        const quantity = Number(content.qty || 0);
        const total = finite(unit) ? Number(unit) * quantity : null;
        if (finite(total)) { recognized += 1; marketValue += total; }
        return { name: content.name, quantity, unit, total };
      });
      const choices = (pack.choiceGroups || []).map(group => {
        totalEntries += 1;
        const options = (group.options || []).map(option => {
          const quantity = Number(option.qty || 0) * Number(group.qty || 1);
          const unit = unitValue(option.name);
          return { name: option.name, quantity, total: finite(unit) ? Number(unit) * quantity : null };
        });
        const known = options.map(option => option.total).filter(finite);
        const best = known.length ? Math.max(...known) : null;
        if (finite(best)) { recognized += 1; marketValue += best; }
        return { name: group.name || "自选内容", quantity: Number(group.qty || 1), options, best };
      });
      const costGold = (Number(pack.price || 0) / 100) * goldPerRmb;
      const adjustedValue = marketValue * (pack.threeForOne ? 4 / 3 : 1);
      const ratio = costGold > 0 ? adjustedValue / costGold : null;
      const image = giftImageOverrides[pack.name] || normaliseAssetImage(pack.image);
      return {
        market: "gifts",
        id: pack.id,
        name: pack.name,
        group: pack.expired ? "已结束" : "在售",
        image,
        current: ratio,
        unit: "可识别价值 / 成本",
        dayChange: finite(ratio) ? ratio - 1 : null,
        weekChange: null,
        prevAvg: costGold,
        recentDeal: adjustedValue,
        low: null,
        series: [costGold, adjustedValue],
        labels: ["折算成本", "可识别价值"],
        price: Number(pack.price || 0),
        currency: pack.currency === "blue" ? "蓝钻" : "彩钻",
        costGold,
        marketValue: adjustedValue,
        coverage: totalEntries ? recognized / totalEntries : 0,
        recognized,
        totalEntries,
        expired: Boolean(pack.expired),
        threeForOne: Boolean(pack.threeForOne),
        breakdown,
        choices,
        images: [...new Set([image, ...(pack.detailImages || []).map(normaliseAssetImage)].filter(Boolean))],
        note: pack.note || ""
      };
    }).sort((a, b) => Number(a.expired) - Number(b.expired) || (b.current || -1) - (a.current || -1));

    const data = { materials, gems, engravings, gifts, gold, goldPerRmb };
    data.all = Object.values(data).flatMap(value => Array.isArray(value) ? value : []);
    return data;
  }

  let data;
  try {
    if (!dashboard || !itemData || !materialHistory || !giftData) throw new Error("真实数据文件未完整加载");
    data = buildData();
  } catch (error) {
    app.innerHTML = `<div class="error-state"><div><strong>新原型无法读取数据</strong>${html(error.message)}</div></div>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  const validMarket = id => markets.some(market => market.id === id) ? id : "overview";
  const initialMarket = validMarket(params.get("market"));
  const validSignalFilter = value => ["all", "up", "down", "gifts"].includes(value) ? value : "all";
  const validSignalSort = value => ["magnitude", "up", "down", "market"].includes(value) ? value : "magnitude";
  const defaultFilter = market => market === "gifts" ? "在售" : "全部";
  const defaultTab = market => market === "gifts" ? "value" : "trend";
  const defaultSort = market => market === "gifts" ? "price-desc" : "signal";
  const state = {
    market: initialMarket,
    selected: {},
    filter: params.get("filter") || "",
    sort: ["signal", "price-desc", "price-asc", "name"].includes(params.get("sort")) ? params.get("sort") : defaultSort(initialMarket),
    range: ["7", "30", "all"].includes(params.get("range")) ? params.get("range") : "30",
    tab: params.get("tab") || "",
    query: params.get("q") || "",
    signalFilter: validSignalFilter(params.get("focus")),
    signalSort: validSignalSort(params.get("signalSort")),
    galleryIndex: 0
  };
  if (state.market !== "overview" && params.get("item")) state.selected[state.market] = params.get("item");

  if (!state.filter) state.filter = defaultFilter(state.market);
  if (!state.tab) state.tab = defaultTab(state.market);

  function formatValue(item, value = item?.current) {
    if (!item || !finite(value)) return "—";
    if (item.market === "gifts") return `${fmt(Number(value) * 100)}%`;
    if (item.market === "gold") return `${fmt(value)} 金/元`;
    return compact(value);
  }

  function qualityFlag(item) {
    if (!finite(item?.dayChange)) return "数据不足";
    if (Math.abs(item.dayChange) > 5) return "参照异常";
    return null;
  }

  function signalReason(item) {
    const flag = qualityFlag(item);
    if (flag) return flag === "参照异常" ? "昨日参照值过小，涨跌幅不参与排序" : "缺少可比较的昨日参照";
    if (item.market === "gifts") return item.current >= 1
      ? `可识别价值高于折算成本 ${fmt((item.current - 1) * 100, 1)}%`
      : `可识别价值低于折算成本 ${fmt((1 - item.current) * 100, 1)}%`;
    if (Math.abs(item.dayChange) < .01) return "与昨日参照基本持平";
    return `${item.dayChange < 0 ? "低于" : "高于"}昨日参照 ${fmt(Math.abs(item.dayChange) * 100, 1)}%`;
  }

  function signalBadge(item) {
    const flag = qualityFlag(item);
    if (flag) return `<span class="badge warning">${flag}</span>`;
    if (!finite(item.dayChange) || Math.abs(item.dayChange) < .01) return `<span class="badge neutral">变化较小</span>`;
    if (item.market === "gifts") return `<span class="badge ${item.current >= 1 ? "negative" : "positive"}">${item.current >= 1 ? "超过成本" : "未到成本"}</span>`;
    const degree = Math.abs(item.dayChange) >= .05 ? "明显" : "小幅";
    return `<span class="badge ${changeClass(item.dayChange)}">${degree}${item.dayChange < 0 ? "回落" : "走高"}</span>`;
  }

  function buildSignals() {
    const candidates = [
      ...data.materials,
      ...data.gems,
      ...data.engravings,
      ...data.gifts.filter(item => !item.expired),
      ...data.gold.slice(0, 1)
    ].filter(item => !qualityFlag(item) && finite(item.dayChange));
    candidates.sort((a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange));
    const counts = {};
    const result = [];
    for (const item of candidates) {
      if ((counts[item.market] || 0) >= 3) continue;
      counts[item.market] = (counts[item.market] || 0) + 1;
      result.push(item);
      if (result.length >= 12) break;
    }
    return result;
  }

  function overviewSignals() {
    let source = buildSignals();
    if (state.query.trim()) {
      const query = state.query.trim().toLowerCase();
      source = data.all.filter(item => item.name.toLowerCase().includes(query)).slice(0, 20);
    }
    const counts = {
      all: source.length,
      up: source.filter(item => finite(item.dayChange) && item.dayChange > 0).length,
      down: source.filter(item => finite(item.dayChange) && item.dayChange < 0).length,
      gifts: source.filter(item => item.market === "gifts").length
    };
    let items = source.filter(item => {
      if (state.signalFilter === "up") return finite(item.dayChange) && item.dayChange > 0;
      if (state.signalFilter === "down") return finite(item.dayChange) && item.dayChange < 0;
      if (state.signalFilter === "gifts") return item.market === "gifts";
      return true;
    });
    const marketOrder = Object.fromEntries(markets.map((market, index) => [market.id, index]));
    if (state.signalSort === "up") items.sort((a, b) => (b.dayChange ?? -Infinity) - (a.dayChange ?? -Infinity));
    if (state.signalSort === "down") items.sort((a, b) => (a.dayChange ?? Infinity) - (b.dayChange ?? Infinity));
    if (state.signalSort === "market") items.sort((a, b) => (marketOrder[a.market] ?? 99) - (marketOrder[b.market] ?? 99) || Math.abs(b.dayChange || 0) - Math.abs(a.dayChange || 0));
    if (state.signalSort === "magnitude") items.sort((a, b) => Math.abs(b.dayChange || 0) - Math.abs(a.dayChange || 0));
    return { source, items, counts };
  }

  function spotlight(label, item, tone) {
    if (!item) return "";
    return `<button class="spotlight-card ${tone}" type="button" data-open-market="${item.market}" data-open-item="${html(item.id)}">
      <span class="spotlight-kicker">${label}</span>
      <span class="spotlight-title"><strong>${html(item.name)}</strong>${semanticDelta(item.market, item.dayChange)}</span>
      <span class="spotlight-copy">${html(signalReason(item))}</span>
    </button>`;
  }

  function summaryItems() {
    const eightGem = data.gems.find(item => item.id === "8级宝石") || data.gems[0];
    const materialDrops = data.materials.filter(item => finite(item.dayChange) && item.dayChange <= -.05).length;
    const engravingDrops = data.engravings.filter(item => finite(item.dayChange) && item.dayChange <= -.08 && !qualityFlag(item)).length;
    const activeGifts = data.gifts.filter(item => !item.expired);
    const bestGift = activeGifts.filter(item => finite(item.current)).sort((a, b) => b.current - a.current)[0];
    const gold = data.gold[0];
    return [
      { market: "materials", label: "材料", value: `${materialDrops} 项回落`, note: `${data.materials.length} 项中低于昨参照 5%+`, change: materialDrops ? -.05 : 0 },
      { market: "gems", label: "8级宝石", value: formatValue(eightGem), note: `较昨日 ${pct(eightGem.dayChange)} · 近7日 ${pct(eightGem.weekChange)}`, change: eightGem.dayChange },
      { market: "engravings", label: "刻印书", value: `${engravingDrops} 项折价`, note: `低于昨参照 8%+，已排除异常基准`, change: engravingDrops ? -.08 : 0 },
      { market: "gifts", label: "在售礼包", value: bestGift ? formatValue(bestGift) : "待估值", note: bestGift ? `${bestGift.name} · 覆盖 ${fmt(bestGift.coverage * 100)}%` : `${activeGifts.length} 个在售`, change: bestGift?.dayChange },
      { market: "gold", label: "综合金价", value: formatValue(gold), note: `${gold.group} · 较昨日 ${pct(gold.dayChange)}`, change: gold.dayChange }
    ];
  }

  function filtersForMarket(market) {
    if (market === "materials") return ["全部", "强化", "采集", "伐木", "采矿", "狩猎", "钓鱼", "考古"];
    if (market === "gems") return ["全部", "基础", "高阶"];
    if (market === "engravings") return ["全部", "明显回落", "明显走高", "高价核心"];
    if (market === "gifts") return ["在售", "已结束", "全部"];
    return ["全部"];
  }

  function visibleItems(market = state.market) {
    let items = [...(data[market] || [])];
    const query = state.query.trim().toLowerCase();
    if (query) items = items.filter(item => item.name.toLowerCase().includes(query));
    if (state.filter !== "全部") {
      if (market === "engravings") {
        if (state.filter === "明显回落") items = items.filter(item => finite(item.dayChange) && item.dayChange <= -.08 && !qualityFlag(item));
        if (state.filter === "明显走高") items = items.filter(item => finite(item.dayChange) && item.dayChange >= .08 && !qualityFlag(item));
        if (state.filter === "高价核心") items = items.filter(item => item.current >= 100000);
      } else items = items.filter(item => item.group === state.filter);
    }
    if (state.sort === "price-desc") items.sort((a, b) => (b.current ?? -Infinity) - (a.current ?? -Infinity));
    if (state.sort === "price-asc") items.sort((a, b) => (a.current ?? Infinity) - (b.current ?? Infinity));
    if (state.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    if (state.sort === "signal") items.sort((a, b) => {
      const aScore = qualityFlag(a) ? -1 : Math.abs(a.dayChange || 0);
      const bScore = qualityFlag(b) ? -1 : Math.abs(b.dayChange || 0);
      return bScore - aScore || a.name.localeCompare(b.name, "zh-CN");
    });
    return items;
  }

  function selectedItem() {
    const items = visibleItems();
    const selectedId = state.selected[state.market];
    const selected = items.find(item => item.id === selectedId) || items[0] || null;
    if (selected) state.selected[state.market] = selected.id;
    return selected;
  }

  function identity(item, className = "") {
    if (item.image) return `<img class="resource-thumb ${html(className)}" src="${html(item.image)}" alt="${html(item.name)}" loading="eager" decoding="async">`;
    return `<span class="market-dot ${html(item.market)} ${html(className)}">${html(marketMeta(item.market).short)}</span>`;
  }

  function updateUrl() {
    const url = new URL(location.href);
    const setOrDelete = (key, value, fallback = "") => value && value !== fallback ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    setOrDelete("market", state.market, "overview");
    setOrDelete("filter", state.filter, defaultFilter(state.market));
    setOrDelete("sort", state.sort, defaultSort(state.market));
    setOrDelete("range", state.range, "30");
    setOrDelete("tab", state.tab, defaultTab(state.market));
    setOrDelete("q", state.query, "");
    setOrDelete("focus", state.signalFilter, "all");
    setOrDelete("signalSort", state.signalSort, "magnitude");
    const selected = state.market === "overview" ? null : state.selected[state.market];
    setOrDelete("item", selected, "");
    history.replaceState({}, "", url);
  }

  function header() {
    return `<header class="topbar">
      <div class="brand"><span class="brand-mark">LA</span><div><strong>方舟市场观察台</strong><span>读变化 · 做比较 · 查明细</span></div></div>
      <nav class="market-nav" aria-label="市场导航">${markets.map(market => `<button type="button" class="${state.market === market.id ? "active" : ""}" data-market="${market.id}">${market.label}</button>`).join("")}</nav>
      <div class="top-actions"><label class="search-box"><span class="sr-only">搜索当前市场</span><input id="marketSearch" type="search" value="${html(state.query)}" placeholder="搜索当前市场，回车打开"><kbd>Ctrl K</kbd></label><div class="updated"><strong>${html(dashboard.publishedAt || "—")}</strong>公开数据快照</div></div>
    </header>`;
  }

  function overview() {
    const { source, items: signals, counts } = overviewSignals();
    const biggestRise = [...source].filter(item => finite(item.dayChange) && item.dayChange > 0).sort((a, b) => b.dayChange - a.dayChange)[0];
    const biggestDrop = [...source].filter(item => finite(item.dayChange) && item.dayChange < 0).sort((a, b) => a.dayChange - b.dayChange)[0];
    const bestGift = [...data.gifts].filter(item => !item.expired && finite(item.current)).sort((a, b) => b.current - a.current)[0];
    const signalFilters = [
      { id: "all", label: "全部", count: counts.all },
      { id: "up", label: "走高", count: counts.up },
      { id: "down", label: "回落", count: counts.down },
      { id: "gifts", label: "礼包", count: counts.gifts }
    ];
    return `<main class="page">
      <div class="page-heading"><div><h1>今天发生了什么</h1><p>先看跨市场变化，再进入单项检查；异常参照值不会混入变化排序。</p></div><span class="page-state">${state.query ? `搜索：${html(state.query)}` : `按变化幅度 · 每个市场最多 3 项`}</span></div>
      <section class="panel summary-grid" aria-label="市场摘要">${summaryItems().map(item => `<button class="summary-item" type="button" data-market="${item.market}"><span class="label">${item.label}${semanticDelta(item.market, item.change)}</span><strong class="value">${html(item.value)}</strong><span class="note">${html(item.note)}</span></button>`).join("")}</section>
      <div class="overview-grid">
        <section class="panel signal-panel"><header class="panel-head"><div><h2>${state.query ? "搜索结果" : "变化清单"}</h2><p>筛选方向或市场，点击整行进入对应项目</p></div><span>${signals.length}/${source.length} 项</span></header>
          <div class="signal-toolbar"><div class="signal-filters" aria-label="变化筛选">${signalFilters.map(filter => `<button class="signal-filter ${state.signalFilter === filter.id ? "active" : ""}" type="button" data-signal-filter="${filter.id}">${filter.label}<span>${filter.count}</span></button>`).join("")}</div><label class="signal-sort"><span>排序</span><select id="signalSort"><option value="magnitude" ${state.signalSort === "magnitude" ? "selected" : ""}>变化幅度</option><option value="up" ${state.signalSort === "up" ? "selected" : ""}>走高优先</option><option value="down" ${state.signalSort === "down" ? "selected" : ""}>回落优先</option><option value="market" ${state.signalSort === "market" ? "selected" : ""}>按市场归类</option></select></label></div>
          ${signals.length ? `<div class="signal-table-wrap"><table class="signal-table"><thead><tr><th>市场 / 项目</th><th>判断</th><th>原因</th><th data-num>当前</th><th data-num>相对基准</th></tr></thead><tbody>${signals.map(item => `<tr role="button" tabindex="0" data-open-market="${item.market}" data-open-item="${html(item.id)}" aria-label="查看${html(item.name)}详情"><td><span class="signal-name"><span class="market-dot ${item.market}">${marketMeta(item.market).short}</span><span><strong>${html(item.name)}</strong><span>${html(marketMeta(item.market).label)} · ${html(item.group)}</span></span></span></td><td>${signalBadge(item)}</td><td class="signal-reason">${html(signalReason(item))}</td><td data-num><strong>${html(formatValue(item))}</strong></td><td data-num><span class="signal-baseline">${semanticDelta(item.market, item.dayChange)}<small>${item.market === "gifts" ? "较成本" : "较昨参照"}</small></span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-list">当前筛选没有匹配项目</div>`}
        </section>
        <aside class="panel market-briefing"><header class="panel-head"><div><h3>今日重点</h3><p>直接打开最值得检查的项目</p></div></header><div class="spotlight-list">${spotlight("最大走高", biggestRise, "rise")}${spotlight("最大回落", biggestDrop, "drop")}${spotlight("最高回本礼包", bestGift, "gift")}</div><div class="briefing-note"><strong>比较口径</strong><p>普通市场相对昨日参照；礼包相对折算成本，100% 为回本线。</p><div class="guide-legend"><span class="badge positive">红色 = 走高</span><span class="badge negative">绿色 = 回落</span></div></div></aside>
      </div>
    </main>`;
  }

  function marketRow(item, selected) {
    const changeLabel = item.market === "gifts" ? "回本率" : "较昨参照";
    return `<button class="market-row ${selected ? "selected" : ""}" type="button" data-select-item="${html(item.id)}" aria-pressed="${selected}">
      <span class="row-main">${identity(item)}<span class="row-copy"><strong>${html(item.name)}</strong><span>${html(item.group)} · ${html(item.unit)}</span></span></span>
      <span class="row-value"><strong>${html(formatValue(item))}</strong><span>${changeLabel}</span></span>
      <span class="row-change">${qualityFlag(item) ? `<span class="badge warning">复核</span>` : semanticDelta(item.market, item.dayChange)}</span>
    </button>`;
  }

  function chartSeries(item) {
    if (!item) return { values: [], labels: [] };
    const range = state.range === "all" ? item.series.length : Number(state.range);
    return { values: item.series.slice(-range), labels: item.labels.slice(-range) };
  }

  function trendInspector(item) {
    const series = chartSeries(item);
    return `<div class="inspector-body">
      <div class="range-row"><strong>${html(series.labels[0] || "")} — ${html(series.labels.at(-1) || "")}</strong><div class="range-buttons">${["7", "30", "all"].map(range => `<button type="button" class="${state.range === range ? "active" : ""}" data-range="${range}">${range === "all" ? "全部" : `${range} 日`}</button>`).join("")}</div></div>
      <div class="chart-wrap"><canvas class="price-chart" data-chart aria-label="${html(item.name)}价格趋势"></canvas><div class="chart-tooltip" data-chart-tooltip></div></div>
      <div class="metrics"><div class="metric"><span>当前值</span><strong>${html(formatValue(item))}</strong></div><div class="metric"><span>昨日参照</span><strong>${html(formatValue(item, item.prevAvg))}</strong></div><div class="metric"><span>最近成交</span><strong>${html(formatValue(item, item.recentDeal))}</strong></div><div class="metric"><span>近 30 日低位</span><strong>${html(formatValue(item, item.low))}</strong></div></div>
      <div class="explain-box"><article class="explain-card"><h3>当前判断</h3><p>${html(signalReason(item))}${qualityFlag(item) ? "。建议直接查看历史明细确认参照值。" : "。"}</p></article><article class="explain-card"><h3>7 日尺度</h3><p>${finite(item.weekChange) ? `相对 7 日前 ${item.weekChange < 0 ? "回落" : "走高"} ${fmt(Math.abs(item.weekChange) * 100, 1)}%。` : "暂无足够的 7 日可比数据。"}</p></article></div>
    </div>`;
  }

  function historyInspector(item) {
    const rows = item.series.map((value, index) => ({ value, label: item.labels[index] })).filter(row => finite(row.value)).slice(-30).reverse();
    return `<div class="inspector-body"><div style="overflow-x:auto"><table class="history-table"><thead><tr><th>日期 / 口径</th><th data-num>记录值</th><th data-num>较上一条</th></tr></thead><tbody>${rows.map((row, index) => { const previous = rows[index + 1]?.value; const change = finite(previous) && previous !== 0 ? (row.value - previous) / previous : null; return `<tr><td>${html(shortDate(row.label))}</td><td data-num><strong>${html(formatValue(item, row.value))}</strong></td><td data-num>${delta(change)}</td></tr>`; }).join("")}</tbody></table></div></div>`;
  }

  function giftValueInspector(item) {
    return `<div class="inspector-body"><div class="metrics" style="margin-top:0"><div class="metric"><span>礼包价格</span><strong>${fmt(item.price)} ${html(item.currency)}</strong></div><div class="metric"><span>折算成本</span><strong>${compact(item.costGold)} 金</strong></div><div class="metric"><span>可识别价值</span><strong>${compact(item.marketValue)} 金</strong></div><div class="metric"><span>估值覆盖</span><strong>${fmt(item.coverage * 100)}%</strong></div></div><div class="gift-detail-grid" style="margin-top:12px"><section class="gift-block"><h3>内容物估值 · ${item.recognized}/${item.totalEntries} 项已识别</h3><div style="overflow-x:auto"><table class="gift-table"><thead><tr><th>内容物</th><th data-num>数量</th><th data-num>参考单价</th><th data-num>小计</th></tr></thead><tbody>${item.breakdown.length ? item.breakdown.map(entry => `<tr><td><strong>${html(entry.name)}</strong></td><td data-num>${fmt(entry.quantity)}</td><td data-num>${finite(entry.unit) ? `${compact(entry.unit)} 金` : "待补"}</td><td data-num class="${finite(entry.total) ? "negative" : "neutral"}">${finite(entry.total) ? `${compact(entry.total)} 金` : "未计入"}</td></tr>`).join("") : `<tr><td colspan="4" class="neutral">没有固定内容物</td></tr>`}</tbody></table></div>${item.choices.map(choice => { const choiceName = /[×xX]\s*\d+/.test(choice.name) ? choice.name : `${choice.name} × ${fmt(choice.quantity)}`; return `<div class="choice-box"><strong>${html(choiceName)}（按可识别最高价值计入）</strong>${choice.options.map(option => `<div class="choice-option"><span>${html(option.name)} × ${fmt(option.quantity)}</span><b>${finite(option.total) ? `${compact(option.total)} 金` : "待补"}</b></div>`).join("")}</div>`; }).join("")}</section><aside class="gift-block"><h3>估值口径</h3><div class="reading-guide"><div class="guide-row"><strong>${item.threeForOne ? "已计入 3 赠 1" : "按单包计算"}</strong><p>${item.note || "使用当前物品估值和综合金币比例折算。"}</p></div><div class="guide-row"><strong>未识别项不会虚构价格</strong><p>覆盖率越低，礼包比值越只能作为下限参考。</p></div><div class="guide-row"><strong>${item.expired ? "历史礼包" : "当前在售"}</strong><p>${item.expired ? "默认列表不显示，只在切换“已结束”后出现。" : "该礼包参与当前在售性价比排序。"}</p></div></div></aside></div></div>`;
  }

  function giftGalleryInspector(item) {
    const images = item.images.length ? item.images : [item.image].filter(Boolean);
    state.galleryIndex = Math.min(state.galleryIndex, Math.max(0, images.length - 1));
    const current = images[state.galleryIndex];
    return `<div class="inspector-body"><div class="gift-block"><h3>礼包原始图片 · ${images.length} 张</h3>${current ? `<div class="gallery-main"><img src="${html(current)}" alt="${html(item.name)}图片 ${state.galleryIndex + 1}" loading="eager" decoding="async"></div><div class="gallery-thumbs">${images.map((source, index) => `<button class="gallery-thumb ${state.galleryIndex === index ? "active" : ""}" type="button" data-gallery-index="${index}" aria-label="查看第 ${index + 1} 张图片"><img src="${html(source)}" alt=""></button>`).join("")}</div>` : `<div class="empty-list">该礼包没有可用图片</div>`}</div></div>`;
  }

  function inspector(item) {
    if (!item) return `<section class="panel inspector"><div class="empty-list">当前筛选没有可查看项目</div></section>`;
    const gift = item.market === "gifts";
    const tabs = gift ? [{ id: "value", label: "估值明细" }, { id: "images", label: "礼包图片" }] : [{ id: "trend", label: "趋势与参照" }, { id: "history", label: "历史明细" }];
    if (!tabs.some(tab => tab.id === state.tab)) state.tab = tabs[0].id;
    let content = "";
    if (state.tab === "trend") content = trendInspector(item);
    if (state.tab === "history") content = historyInspector(item);
    if (state.tab === "value") content = giftValueInspector(item);
    if (state.tab === "images") content = giftGalleryInspector(item);
    return `<section class="panel inspector" id="itemInspector"><header class="inspector-header"><div class="inspector-title">${identity(item, "inspector-image")}<div><h2>${html(item.name)}</h2><p>${html(marketMeta(item.market).label)} · ${html(item.group)} · ${html(item.unit)}</p></div></div><div class="inspector-price"><strong>${html(formatValue(item))}</strong>${qualityFlag(item) ? `<span class="badge warning">参照异常</span>` : semanticDelta(item.market, item.dayChange)}</div></header><div class="inspector-tabs">${tabs.map(tab => `<button type="button" class="${state.tab === tab.id ? "active" : ""}" data-inspector-tab="${tab.id}">${tab.label}</button>`).join("")}</div>${content}</section>`;
  }

  function marketPage() {
    const items = visibleItems();
    const selected = selectedItem();
    const meta = marketMeta(state.market);
    const changeColumn = state.market === "gifts" ? "较成本" : "较昨参照";
    const sortOptions = state.market === "gifts"
      ? [{ id: "price-desc", label: "性价比从高到低" }, { id: "price-asc", label: "性价比从低到高" }, { id: "name", label: "名称排序" }]
      : [{ id: "signal", label: "变化幅度优先" }, { id: "price-desc", label: "当前值从高到低" }, { id: "price-asc", label: "当前值从低到高" }, { id: "name", label: "名称排序" }];
    const headingAction = state.market === "gems"
      ? `<div class="page-heading-actions"><span class="page-state">${html(state.filter)} · ${items.length} 项 · ${state.range === "all" ? "全部历史" : `近 ${state.range} 日`}</span><a class="terminal-entry" href="./gems.html">打开宝石行情终端 →</a></div>`
      : `<span class="page-state">${html(state.filter)} · ${items.length} 项 · ${state.range === "all" ? "全部历史" : `近 ${state.range} 日`}</span>`;
    return `<main class="page"><div class="page-heading"><div><h1>${meta.label}</h1><p>从列表选择项目，右侧检查器原地更新；上下方向键可连续切换。</p></div>${headingAction}</div><div class="workspace"><section class="panel list-panel"><header class="panel-head"><div><h2>${meta.label}列表</h2><p>精确数字优先，不使用微型趋势图</p></div><span>${items.length}/${(data[state.market] || []).length}</span></header><div class="list-tools"><div class="filter-row">${filtersForMarket(state.market).map(filter => `<button class="filter-chip ${state.filter === filter ? "active" : ""}" type="button" data-filter="${html(filter)}">${html(filter)}</button>`).join("")}</div><label class="sort-row"><span>排序方式</span><select id="marketSort">${sortOptions.map(option => `<option value="${option.id}" ${state.sort === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select></label></div><div class="list-columns"><span>项目</span><span>当前</span><span>${changeColumn}</span></div><div class="market-list">${items.length ? items.map(item => marketRow(item, selected?.id === item.id)).join("") : `<div class="empty-list">当前筛选没有项目</div>`}</div></section>${inspector(selected)}</div></main>`;
  }

  function render(options = {}) {
    app.innerHTML = `<div class="app-shell">${header()}${state.market === "overview" ? overview() : marketPage()}</div>`;
    updateUrl();
    requestAnimationFrame(() => {
      drawActiveChart();
      if (options.focusSearch) {
        const input = document.getElementById("marketSearch");
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      }
      if (options.keepSelectedVisible) document.querySelector(".market-row.selected")?.scrollIntoView({ block: "nearest" });
      if (options.revealInspector && innerWidth <= 960) document.getElementById("itemInspector")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function drawActiveChart() {
    const canvas = document.querySelector("[data-chart]");
    const item = state.market === "overview" ? null : selectedItem();
    if (!canvas || !item) return;
    const { values, labels } = chartSeries(item);
    const clean = values.map((value, index) => finite(value) ? { value: Number(value), label: labels[index] || "" } : null).filter(Boolean);
    if (clean.length < 2) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    const pad = { left: 64, right: 20, top: 20, bottom: 34 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const rawMin = Math.min(...clean.map(point => point.value));
    const rawMax = Math.max(...clean.map(point => point.value));
    const margin = Math.max((rawMax - rawMin) * .12, rawMax * .015, 1);
    const min = Math.max(0, rawMin - margin);
    const max = rawMax + margin;
    const span = max - min || 1;
    const x = index => pad.left + (index / Math.max(clean.length - 1, 1)) * plotWidth;
    const y = value => pad.top + plotHeight - ((value - min) / span) * plotHeight;

    context.font = '11px "Segoe UI", "Microsoft YaHei UI", sans-serif';
    context.textBaseline = "middle";
    for (let index = 0; index < 5; index += 1) {
      const yy = pad.top + (index / 4) * plotHeight;
      context.strokeStyle = "#dce6f0";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(pad.left, yy);
      context.lineTo(width - pad.right, yy);
      context.stroke();
      context.fillStyle = "#667085";
      context.textAlign = "right";
      context.fillText(compact(max - (index / 4) * span), pad.left - 10, yy);
    }

    const points = clean.map((point, index) => ({ ...point, x: x(index), y: y(point.value) }));
    const gradient = context.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    gradient.addColorStop(0, "rgba(21, 94, 239, .22)");
    gradient.addColorStop(1, "rgba(21, 94, 239, 0)");
    context.beginPath();
    context.moveTo(points[0].x, height - pad.bottom);
    points.forEach(point => context.lineTo(point.x, point.y));
    context.lineTo(points.at(-1).x, height - pad.bottom);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.strokeStyle = "#155eef";
    context.lineWidth = 2.5;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    const last = points.at(-1);
    context.beginPath();
    context.arc(last.x, last.y, 4, 0, Math.PI * 2);
    context.fillStyle = "#155eef";
    context.fill();
    context.strokeStyle = "#fff";
    context.lineWidth = 2;
    context.stroke();

    const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
    context.fillStyle = "#667085";
    context.textBaseline = "alphabetic";
    labelIndexes.forEach(index => {
      context.textAlign = index === 0 ? "left" : index === points.length - 1 ? "right" : "center";
      context.fillText(shortDate(points[index].label), points[index].x, height - 10);
    });

    const tooltip = document.querySelector("[data-chart-tooltip]");
    canvas.onmousemove = event => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const nearest = points.reduce((best, point) => Math.abs(point.x - mouseX) < Math.abs(best.x - mouseX) ? point : best, points[0]);
      tooltip.innerHTML = `<span>${html(nearest.label || "记录")}</span><strong>${html(formatValue(item, nearest.value))}</strong>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.min(width - 132, Math.max(8, nearest.x + 10))}px`;
      tooltip.style.top = `${Math.max(8, nearest.y - 58)}px`;
    };
    canvas.onmouseleave = () => { tooltip.style.display = "none"; };
  }

  let searchTimer;
  document.addEventListener("click", event => {
    const marketButton = event.target.closest("[data-market]");
    if (marketButton) {
      state.market = validMarket(marketButton.dataset.market);
      state.filter = defaultFilter(state.market);
      state.sort = defaultSort(state.market);
      state.tab = defaultTab(state.market);
      state.query = "";
      state.galleryIndex = 0;
      render();
      return;
    }
    const signalButton = event.target.closest("[data-open-market]");
    if (signalButton) {
      state.market = validMarket(signalButton.dataset.openMarket);
      state.filter = defaultFilter(state.market);
      state.sort = defaultSort(state.market);
      state.selected[state.market] = signalButton.dataset.openItem;
      state.tab = defaultTab(state.market);
      state.query = "";
      render({ revealInspector: true });
      return;
    }
    const itemButton = event.target.closest("[data-select-item]");
    if (itemButton) {
      state.selected[state.market] = itemButton.dataset.selectItem;
      state.galleryIndex = 0;
      render({ keepSelectedVisible: true, revealInspector: true });
      return;
    }
    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      state.filter = filterButton.dataset.filter;
      state.galleryIndex = 0;
      render();
      return;
    }
    const signalFilterButton = event.target.closest("[data-signal-filter]");
    if (signalFilterButton) {
      state.signalFilter = validSignalFilter(signalFilterButton.dataset.signalFilter);
      render();
      return;
    }
    const tabButton = event.target.closest("[data-inspector-tab]");
    if (tabButton) {
      state.tab = tabButton.dataset.inspectorTab;
      render();
      return;
    }
    const rangeButton = event.target.closest("[data-range]");
    if (rangeButton) {
      state.range = rangeButton.dataset.range;
      render();
      return;
    }
    const galleryButton = event.target.closest("[data-gallery-index]");
    if (galleryButton) {
      state.galleryIndex = Number(galleryButton.dataset.galleryIndex) || 0;
      render();
    }
  });

  document.addEventListener("change", event => {
    if (event.target?.id === "marketSort") {
      state.sort = event.target.value;
      render();
    }
    if (event.target?.id === "signalSort") {
      state.signalSort = validSignalSort(event.target.value);
      render();
    }
  });

  document.addEventListener("input", event => {
    if (event.target?.id !== "marketSearch") return;
    clearTimeout(searchTimer);
    const query = event.target.value;
    searchTimer = setTimeout(() => {
      state.query = query;
      render({ focusSearch: true });
    }, 120);
  });

  document.addEventListener("keydown", event => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("marketSearch")?.focus();
      return;
    }
    if (target?.id === "marketSearch" && event.key === "Enter") {
      state.query = target.value.trim();
      const items = state.market === "overview" ? data.all.filter(item => item.name.toLowerCase().includes(state.query.trim().toLowerCase())) : visibleItems();
      const match = items[0];
      if (match) {
        state.market = match.market;
        state.filter = match.market === "gifts" ? match.group : "全部";
        state.sort = defaultSort(match.market);
        state.selected[match.market] = match.id;
        state.tab = defaultTab(match.market);
        state.query = "";
        render({ revealInspector: true });
      }
      return;
    }
    const signalRow = target?.closest?.(".signal-table tr[data-open-market]");
    if (signalRow && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      signalRow.click();
      return;
    }
    if (!typing && state.market !== "overview" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      const items = visibleItems();
      if (!items.length) return;
      event.preventDefault();
      const currentId = state.selected[state.market];
      const currentIndex = Math.max(0, items.findIndex(item => item.id === currentId));
      const nextIndex = Math.min(items.length - 1, Math.max(0, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
      state.selected[state.market] = items[nextIndex].id;
      state.galleryIndex = 0;
      render({ keepSelectedVisible: true });
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawActiveChart, 100);
  });

  render();
})();
