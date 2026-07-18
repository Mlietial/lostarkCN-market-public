(() => {
  "use strict";

  const terminal = document.getElementById("engravingTerminal");
  const BOOK_ICON = "../assets/刻印书.jpg";
  let dashboard = null;
  let rows = [];
  let selectedDate = "";
  let activeBookKey = "";
  let activeFilter = "all";
  let searchText = "";
  let chartRange = "30";
  let chartSeries = "all";
  let priceUnit = new URLSearchParams(location.search).get("unit") === "rmb" ? "rmb" : "gold";
  let auctionRates = [];

  const CHART_SERIES = [
    { key: "prevAvg", color: "#94a3b8", label: "昨日均价", shortLabel: "昨均" },
    { key: "recentDeal", color: "#f59e0b", label: "最近成交", shortLabel: "成交" },
    { key: "lowest", color: "#2563eb", label: "当前最低", shortLabel: "最低" }
  ];

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const toNumber = (value) => {
    const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeDate = (value) => {
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d{4})[/.年-](\d{1,2})[/.月-](\d{1,2})/);
    if (!match) return text.slice(0, 10);
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  };

  const keyOf = (row) => `${row.name}\u0000${row.grade}`;
  const encodeKey = (row) => encodeURIComponent(keyOf(row));
  const fmt = (value) => Number.isFinite(value) ? Math.round(value).toLocaleString("zh-CN") : "—";
  const fmtRmb = (value) => Number.isFinite(value) ? `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const fmtUnitValue = (value) => priceUnit === "rmb" ? fmtRmb(value) : fmt(value);
  const ratio = (value, base) => Number.isFinite(value) && Number.isFinite(base) && base !== 0 ? (value - base) / base : null;
  const deltaClass = (value) => !Number.isFinite(value) || Math.abs(value) < .0005 ? "flat" : value > 0 ? "up" : "down";

  const rateInfoForDate = (date) => {
    if (!auctionRates.length) return null;
    let matched = null;
    for (const item of auctionRates) {
      if (item.date > date) break;
      matched = item;
    }
    return matched || auctionRates[0];
  };

  const priceForUnit = (value, date) => {
    if (!Number.isFinite(value)) return null;
    if (priceUnit === "gold") return value;
    const rate = rateInfoForDate(date)?.rate;
    return Number.isFinite(rate) && rate > 0 ? value / rate : null;
  };

  const fmtPrice = (value, date) => fmtUnitValue(priceForUnit(value, date));

  const fmtPercent = (value) => {
    if (!Number.isFinite(value)) return "—";
    const arrow = value > .0005 ? "↑" : value < -.0005 ? "↓" : "→";
    return `${arrow} ${Math.abs(value * 100).toFixed(2)}%`;
  };

  const fmtSignedPrice = (value) => {
    if (!Number.isFinite(value)) return "—";
    if (priceUnit === "rmb") return `${value > 0 ? "+" : value < 0 ? "−" : ""}${fmtRmb(Math.abs(value))}`;
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString("zh-CN")} 金`;
  };

  const normalizeRows = (items) => (Array.isArray(items) ? items : [])
    .map((row, index) => ({
      date: normalizeDate(row.date),
      name: String(row.name || "").trim(),
      grade: String(row.grade || "遗物").trim(),
      prevAvg: toNumber(row.prevAvg),
      recentDeal: toNumber(row.recentDeal),
      lowest: toNumber(row.lowest),
      pageOrder: toNumber(row.pageOrder) ?? index + 1
    }))
    .filter((row) => row.date && row.name && Number.isFinite(row.lowest))
    .sort((a, b) => a.date.localeCompare(b.date) || a.pageOrder - b.pageOrder || a.name.localeCompare(b.name, "zh-CN"));

  const buildAuctionRates = (items) => {
    const rates = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (item?.type !== "拍卖交易") return;
      const date = normalizeDate(item.date);
      const gold = toNumber(item.gold);
      const amount = toNumber(item.price);
      if (!date || !Number.isFinite(gold) || !Number.isFinite(amount) || amount <= 0) return;
      const rate = gold / amount;
      if (Number.isFinite(rate) && rate > 0) rates.set(date, Math.max(rate, rates.get(date) || 0));
    });
    return Array.from(rates, ([date, rate]) => ({ date, rate })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const dates = () => Array.from(new Set(rows.map((row) => row.date))).sort();

  const latestByBook = (items) => {
    const map = new Map();
    items.forEach((row) => {
      const key = keyOf(row);
      const current = map.get(key);
      if (!current || row.date > current.date || (row.date === current.date && row.pageOrder < current.pageOrder)) map.set(key, row);
    });
    return Array.from(map.values());
  };

  const historyFor = (key) => rows.filter((row) => keyOf(row) === key).sort((a, b) => a.date.localeCompare(b.date));

  const enrich = (row) => {
    const history = historyFor(keyOf(row));
    const historicLow = history.reduce((best, item) => !best || item.lowest < best.lowest ? item : best, null);
    const lowVsPrevAvg = ratio(row.lowest, row.prevAvg);
    const lowVsRecentDeal = ratio(row.lowest, row.recentDeal);
    let status = { text: "价格平稳", className: "" };
    if (Number.isFinite(lowVsPrevAvg) && lowVsPrevAvg <= -.08) status = { text: "明显低于昨均", className: "deep" };
    else if (Number.isFinite(lowVsPrevAvg) && lowVsPrevAvg <= -.03) status = { text: "低于昨均", className: "low" };
    else if (Number.isFinite(lowVsPrevAvg) && lowVsPrevAvg >= .06) status = { text: "短线抬价", className: "high" };
    return { ...row, history, historicLow, lowVsPrevAvg, lowVsRecentDeal, status };
  };

  const dayRows = () => latestByBook(rows.filter((row) => row.date === selectedDate))
    .map(enrich)
    .sort((a, b) => a.pageOrder - b.pageOrder || a.name.localeCompare(b.name, "zh-CN"));

  const filteredDayRows = () => dayRows().filter((row) => {
    if (searchText && !`${row.name} ${row.grade}`.toLocaleLowerCase("zh-CN").includes(searchText)) return false;
    if (activeFilter === "core") return row.pageOrder <= 10;
    if (activeFilter === "discount") return Number.isFinite(row.lowVsPrevAvg) && row.lowVsPrevAvg <= -.05;
    if (activeFilter === "rise") return Number.isFinite(row.lowVsPrevAvg) && row.lowVsPrevAvg >= .05;
    return true;
  });

  const activeRow = () => dayRows().find((row) => keyOf(row) === activeBookKey) || dayRows()[0] || null;

  const ensureActiveBook = () => {
    const available = dayRows();
    if (!available.some((row) => keyOf(row) === activeBookKey)) activeBookKey = available[0] ? keyOf(available[0]) : "";
  };

  const renderShell = () => {
    const dateOptions = dates().map((date) => `<option value="${escapeHtml(date)}">${escapeHtml(date)}</option>`).join("");
    terminal.className = "terminal-shell";
    terminal.innerHTML = `
      <header class="terminal-topbar">
        <div class="terminal-brand">
          <span class="terminal-logo book-logo"><span><img src="${BOOK_ICON}" alt=""></span></span>
          <div><strong>遗物刻印市场行情</strong><small>Engraving Book Terminal</small></div>
        </div>
        <div class="terminal-session"><span class="live-dot"></span><span>公开行情已接入 · 日价格快照</span></div>
        <div class="terminal-actions">
          <div class="snapshot"><strong>${escapeHtml(dashboard?.publishedAt || "—")}</strong>数据更新时间</div>
          <a class="back-link" href="../index.html">返回首页</a>
        </div>
      </header>
      <div class="ticker-window" aria-label="刻印书行情滚动栏"><div class="ticker-track" id="tickerTrack"></div></div>
      <main class="terminal-main">
        <aside class="panel watch-panel">
          <div class="panel-head"><div><h2>刻印书自选</h2><p id="watchMeta">当前日期全部报价</p></div><span id="watchCount">0 本</span></div>
          <div class="book-tools">
            <div class="book-tools-row">
              <select id="dateFilter" aria-label="选择行情日期">${dateOptions}</select>
              <input id="bookSearch" type="search" placeholder="搜索刻印书" aria-label="搜索刻印书">
            </div>
            <div class="book-filters" aria-label="刻印书筛选">
              <button class="book-filter active" type="button" data-filter="all">全部</button>
              <button class="book-filter" type="button" data-filter="core">核心书</button>
              <button class="book-filter" type="button" data-filter="discount">低于昨均</button>
              <button class="book-filter" type="button" data-filter="rise">短线抬价</button>
            </div>
          </div>
          <div class="watch-columns"><span>名称</span><span>最低价</span><span>较昨均</span></div>
          <div class="watch-list" id="watchList"></div>
          <div class="watch-scroll-hint" id="watchScrollHint" aria-hidden="true"><span>向下滚动查看更多</span><b>↓</b></div>
          <div class="keyboard-tip">点击刻印书切换行情，或使用 <kbd>↑</kbd> <kbd>↓</kbd> 浏览。</div>
        </aside>

        <section class="center-column">
          <section class="panel quote-panel" id="quotePanel"></section>
          <section class="panel chart-panel">
            <div class="chart-head">
              <div><h2 id="chartTitle">历史价格走势</h2><p id="chartSubtitle">昨日均价、最近成交与当前最低</p></div>
              <div class="chart-tools">
                <div class="unit-switch" role="group" aria-label="价格单位">
                  <button class="unit-button ${priceUnit === "gold" ? "active" : ""}" type="button" data-price-unit="gold">金币</button>
                  <button class="unit-button ${priceUnit === "rmb" ? "active" : ""}" type="button" data-price-unit="rmb">¥ RMB</button>
                </div>
                <span class="tool-divider"></span>
                <div class="chart-series-controls" aria-label="折线显示">
                  <button class="chart-series-button" type="button" data-chart-series="prevAvg"><i style="--series:#94a3b8"></i>昨均</button>
                  <button class="chart-series-button" type="button" data-chart-series="recentDeal"><i style="--series:#f59e0b"></i>成交</button>
                  <button class="chart-series-button" type="button" data-chart-series="lowest"><i style="--series:#2563eb"></i>最低</button>
                  <button class="chart-series-button active" type="button" data-chart-series="all">全部</button>
                </div>
                <span class="tool-divider"></span>
                <button class="range-button" type="button" data-range="7">7日</button>
                <button class="range-button active" type="button" data-range="30">30日</button>
                <button class="range-button" type="button" data-range="all">全部日期</button>
              </div>
            </div>
            <div class="chart-stage" id="chartStage"></div>
            <div class="chart-summary" id="chartSummary"></div>
          </section>
        </section>

        <aside class="right-column">
          <section class="panel" id="signalPanel"></section>
          <section class="panel">
            <div class="panel-head"><div><h3>近期价格异动</h3><p>当前刻印书最低价变化</p></div></div>
            <div class="move-list" id="moveList"></div>
          </section>
          <section class="panel">
            <div class="panel-head"><div><h3>当日高价排行</h3><p>按当前最低价排序</p></div><span id="rankingDate">—</span></div>
            <div class="ranking-list" id="rankingList"></div>
          </section>
        </aside>
      </main>`;
    terminal.querySelector("#dateFilter").value = selectedDate;
    bindControls();
  };

  const renderTicker = () => {
    const items = dayRows();
    const markup = items.map((row) => `<button class="ticker-item ${keyOf(row) === activeBookKey ? "active" : ""}" type="button" data-book-key="${encodeKey(row)}"><img class="ticker-book-icon" src="${BOOK_ICON}" alt=""><strong>${escapeHtml(row.name)}</strong><b>${fmtPrice(row.lowest, row.date)}</b><span class="${deltaClass(row.lowVsPrevAvg)}">${fmtPercent(row.lowVsPrevAvg)}</span></button>`).join("");
    const track = terminal.querySelector("#tickerTrack");
    track.innerHTML = `<div class="ticker-group">${markup}</div><div class="ticker-group" aria-hidden="true">${markup}</div>`;
    track.style.setProperty("--ticker-step-count", String(Math.max(1, items.length * 242)));
  };

  const syncWatchScrollHint = () => {
    const list = terminal.querySelector("#watchList");
    const hint = terminal.querySelector("#watchScrollHint");
    if (!list || !hint) return;
    const canScroll = list.scrollHeight > list.clientHeight + 2;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
    hint.classList.toggle("visible", canScroll && !atBottom);
  };

  const renderWatchList = () => {
    const visible = filteredDayRows();
    terminal.querySelector("#watchMeta").textContent = `${selectedDate || "—"} · 点击切换详情`;
    terminal.querySelector("#watchCount").textContent = `${visible.length} 本`;
    terminal.querySelector("#watchList").innerHTML = visible.length ? visible.map((row) => `
      <button class="watch-row ${keyOf(row) === activeBookKey ? "active" : ""}" type="button" data-book-key="${encodeKey(row)}">
        <span class="watch-name"><span class="book-symbol"><img src="${BOOK_ICON}" alt=""></span><span><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.grade)} · 顺序 ${row.pageOrder}</small></span></span>
        <span class="watch-price"><strong>${fmtPrice(row.lowest, row.date)}</strong><small>${priceUnit === "rmb" ? "人民币" : "金币"}</small></span>
        <span class="watch-change ${deltaClass(row.lowVsPrevAvg)}">${fmtPercent(row.lowVsPrevAvg)}</span>
      </button>`).join("") : `<div class="terminal-empty">没有符合当前筛选条件的刻印书</div>`;
    requestAnimationFrame(syncWatchScrollHint);
  };

  const renderQuote = () => {
    const row = activeRow();
    const panel = terminal.querySelector("#quotePanel");
    if (!row) {
      panel.innerHTML = `<div class="terminal-empty">当前日期没有刻印书行情</div>`;
      return;
    }
    const historyBeforeDate = row.history.filter((item) => item.date < row.date);
    const previous = historyBeforeDate[historyBeforeDate.length - 1] || null;
    const recentSeven = row.history.filter((item) => item.date <= row.date).slice(-7);
    const recentThirty = row.history.filter((item) => item.date <= row.date).slice(-30);
    const currentValue = priceForUnit(row.lowest, row.date);
    const previousValue = previous ? priceForUnit(previous.lowest, previous.date) : null;
    const sevenDayPrices = recentSeven.map((item) => priceForUnit(item.lowest, item.date)).filter(Number.isFinite);
    const thirtyDayPrices = recentThirty.map((item) => priceForUnit(item.lowest, item.date)).filter(Number.isFinite);
    const historicMinimum = row.history
      .map((item) => ({ date: item.date, value: priceForUnit(item.lowest, item.date) }))
      .filter((item) => Number.isFinite(item.value))
      .reduce((best, item) => !best || item.value < best.value ? item : best, null);
    const sevenDayChange = sevenDayPrices.length > 1 ? ratio(sevenDayPrices[sevenDayPrices.length - 1], sevenDayPrices[0]) : null;
    const dailyChange = ratio(currentValue, previousValue);
    const dailyPriceChange = Number.isFinite(currentValue) && Number.isFinite(previousValue) ? currentValue - previousValue : null;
    const rateInfo = rateInfoForDate(row.date);
    const quoteNote = priceUnit === "rmb"
      ? `拍卖最高比例 ${fmt(rateInfo?.rate)} 金/元 · 较前日 ${fmtSignedPrice(dailyPriceChange)}`
      : `较前一日 ${fmtSignedPrice(dailyPriceChange)} · 当前价格单位：金币`;
    panel.innerHTML = `<div class="quote-main">
      <div class="quote-identity"><span class="quote-book"><img src="${BOOK_ICON}" alt="刻印书"></span><div class="quote-title"><h1>${escapeHtml(row.name)}</h1><p>${escapeHtml(row.grade)}刻印书 · ${escapeHtml(row.date)}${priceUnit === "rmb" ? " · RMB估值" : ""}</p></div></div>
      <div class="quote-stats">
        <div class="quote-stat stat-previous"><span>前一日</span><strong>${fmtUnitValue(previousValue)}</strong></div>
        <div class="quote-stat stat-seven ${deltaClass(sevenDayChange)}"><span>近 7 日</span><strong>${fmtPercent(sevenDayChange)}</strong></div>
        <div class="quote-stat stat-high"><span>30 日最高</span><strong>${thirtyDayPrices.length ? fmtUnitValue(Math.max(...thirtyDayPrices)) : "—"}</strong></div>
        <div class="quote-stat stat-low"><span>30 日最低</span><strong>${thirtyDayPrices.length ? fmtUnitValue(Math.min(...thirtyDayPrices)) : "—"}</strong></div>
        <div class="quote-stat stat-historic"><span>历史最低${historicMinimum ? ` ${escapeHtml(historicMinimum.date.slice(5))}` : ""}</span><strong>${historicMinimum ? fmtUnitValue(historicMinimum.value) : "—"}</strong></div>
      </div>
      <div class="quote-price"><div class="quote-price-line"><strong>${fmtUnitValue(currentValue)}</strong><span class="quote-day-change ${deltaClass(dailyChange)}">${fmtPercent(dailyChange)}</span></div><p>${quoteNote}</p></div>
    </div>`;
  };

  const chartRows = (history) => chartRange === "all" ? history : history.slice(-Number(chartRange));
  const visibleChartSeries = () => chartSeries === "all" ? CHART_SERIES : CHART_SERIES.filter((item) => item.key === chartSeries);
  const chartValue = (row, key) => {
    const value = priceForUnit(row[key], row.date);
    if (!Number.isFinite(value) || value <= 0) return null;
    if (key === "lowest") return value;
    const reference = priceForUnit(row.lowest, row.date);
    if (!Number.isFinite(reference) || reference <= 0) return value;
    const scale = value / reference;
    return scale >= .1 && scale <= 10 ? value : null;
  };

  const buildChart = (history) => {
    const shown = chartRows(history);
    if (!shown.length) return `<div class="book-chart-empty">暂无历史价格数据</div>`;
    const series = visibleChartSeries();
    const values = shown.flatMap((row) => series.map((item) => chartValue(row, item.key))).filter(Number.isFinite);
    if (!values.length) return `<div class="book-chart-empty">暂无可绘制价格</div>`;
    const width = 1040;
    const height = 500;
    const margin = { left: 82, right: 30, top: 26, bottom: 50 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(1, (max - min) * .12);
    const low = Math.max(0, min - padding);
    const high = max + padding;
    const x = (index) => shown.length === 1 ? width / 2 : margin.left + index / (shown.length - 1) * (width - margin.left - margin.right);
    const y = (value) => margin.top + (high - value) / Math.max(1, high - low) * (height - margin.top - margin.bottom);
    const grids = Array.from({ length: 5 }, (_, index) => {
      const value = low + (high - low) * index / 4;
      const yy = y(value);
      return `<line class="book-chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="book-chart-axis" x="${margin.left - 11}" y="${yy + 4}" text-anchor="end">${fmtUnitValue(value)}</text>`;
    }).join("");
    const tickStep = Math.max(1, Math.ceil(shown.length / 7));
    const ticks = shown.map((row, index) => index % tickStep === 0 || index === shown.length - 1 ? `<text class="book-chart-axis" x="${x(index)}" y="${height - 15}" text-anchor="middle">${escapeHtml(row.date.slice(5))}</text>` : "").join("");
    const paths = series.map((item) => {
      const points = shown.map((row, index) => {
        const value = chartValue(row, item.key);
        return Number.isFinite(value) ? { row, value, index, x: x(index), y: y(value) } : null;
      }).filter(Boolean);
      const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
      const secondaryClass = chartSeries === "all" && item.key !== "lowest" ? " is-secondary" : "";
      return `<path class="book-chart-line${secondaryClass}" style="--series:${item.color}" d="${path}"></path>${points.map((point) => `<circle class="book-chart-point${secondaryClass}" data-chart-point-index="${point.index}" style="--series:${item.color}" cx="${point.x}" cy="${point.y}" r="4"><title>${escapeHtml(point.row.date)} · ${escapeHtml(item.label)} ${fmtUnitValue(point.value)}</title></circle>`).join("")}`;
    }).join("");
    const extremeGuides = series.some((item) => item.key === "lowest") ? (() => {
      const lowestValues = shown.map((row) => chartValue(row, "lowest")).filter(Number.isFinite);
      if (!lowestValues.length) return "";
      const rangeHigh = Math.max(...lowestValues);
      const rangeLow = Math.min(...lowestValues);
      const minimumOf = (items) => {
        const candidates = items.map((row) => chartValue(row, "lowest")).filter(Number.isFinite);
        return candidates.length ? Math.min(...candidates) : null;
      };
      const globalLow = minimumOf(history);
      const thirtyDayLow = minimumOf(history.slice(-30));
      const lowColor = rangeLow === globalLow ? "#0ea5e9" : rangeLow === thirtyDayLow ? "#10b981" : "#8b5cf6";
      const guides = rangeHigh === rangeLow
        ? [{ label: "区间高低", value: rangeHigh, color: "#64748b" }]
        : [
            { label: "区间最高", value: rangeHigh, color: "#f59e0b" },
            { label: "区间最低", value: rangeLow, color: lowColor }
          ];
      return guides.map((guide) => {
        const yy = y(guide.value);
        return `<g class="book-chart-extreme-guide" style="--marker:${guide.color}"><line x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="book-chart-extreme-guide-label" x="${width - margin.right - 6}" y="${yy - 6}" text-anchor="end">${escapeHtml(guide.label)} ${escapeHtml(fmtUnitValue(guide.value))}</text></g>`;
      }).join("");
    })() : "";
    const lowMarkers = series.some((item) => item.key === "lowest") ? (() => {
      const findLows = (count, label, color, priority) => {
        const candidates = history.slice(-count).map((row) => {
          const value = priceForUnit(row.lowest, row.date);
          return Number.isFinite(value) ? { row, value } : null;
        }).filter(Boolean);
        if (!candidates.length) return [];
        const minimum = Math.min(...candidates.map((item) => item.value));
        return candidates.filter((item) => item.value === minimum).map((item) => {
          const index = shown.findIndex((row) => row.date === item.row.date);
          return index < 0 ? null : { ...item, index, label, color, priority, x: x(index), y: y(item.value) };
        }).filter(Boolean);
      };
      const markers = [
        ...findLows(7, "7日史低", "#8b5cf6", 1),
        ...findLows(30, "30日史低", "#10b981", 2),
        ...findLows(history.length, "全部日期史低", "#0ea5e9", 3)
      ];
      const rangeHighCandidates = shown.map((row, index) => {
        const value = chartValue(row, "lowest");
        return Number.isFinite(value) ? { row, value, index, label: "区间最高", color: "#f59e0b", priority: 0, x: x(index), y: y(value) } : null;
      }).filter(Boolean);
      if (rangeHighCandidates.length) {
        const rangeHigh = Math.max(...rangeHighCandidates.map((item) => item.value));
        markers.push(...rangeHighCandidates.filter((item) => item.value === rangeHigh));
      }
      const grouped = new Map();
      markers.forEach((marker) => {
        const group = grouped.get(marker.row.date) || [];
        group.push(marker);
        grouped.set(marker.row.date, group);
      });
      return Array.from(grouped.values()).map((group) => {
        const marker = group.reduce((highest, item) => !highest || item.priority > highest.priority ? item : highest, null);
        return `<g class="book-chart-extreme-marker" data-extreme-date="${escapeHtml(marker.row.date)}" data-extreme-labels="${escapeHtml(marker.label)}"><circle class="book-chart-extreme-pulse" style="--marker:${marker.color}" cx="${marker.x}" cy="${marker.y}" r="7"></circle><circle class="book-chart-extreme-ring" style="--marker:${marker.color}" cx="${marker.x}" cy="${marker.y}" r="5"></circle><circle class="book-chart-extreme-dot" style="--marker:${marker.color}" cx="${marker.x}" cy="${marker.y}" r="4"></circle><title>${escapeHtml(marker.row.date)} · ${escapeHtml(marker.label)}</title></g>`;
      }).join("");
    })() : "";
    const hitAreas = shown.map((row, index) => {
      const currentX = x(index);
      const left = index === 0 ? margin.left : (x(index - 1) + currentX) / 2;
      const right = index === shown.length - 1 ? width - margin.right : (currentX + x(index + 1)) / 2;
      return `<rect class="book-chart-hit" data-chart-index="${index}" data-chart-x="${currentX.toFixed(1)}" x="${left.toFixed(1)}" y="${margin.top}" width="${Math.max(1, right - left).toFixed(1)}" height="${height - margin.top - margin.bottom}" tabindex="0" role="button" aria-label="${escapeHtml(row.date)} 价格详情"></rect>`;
    }).join("");
    return `<svg class="market-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="刻印书历史价格走势图">${grids}${ticks}${extremeGuides}${paths}${lowMarkers}<line class="book-chart-guide" id="chartGuide" x1="0" x2="0" y1="${margin.top}" y2="${height - margin.bottom}"></line>${hitAreas}</svg><div class="chart-tooltip" id="chartTooltip" role="status" aria-live="polite"></div>`;
  };

  const renderChart = () => {
    const row = activeRow();
    if (!row) return;
    const history = row.history;
    const shown = chartRows(history);
    terminal.querySelector("#chartTitle").textContent = `${row.name} · 历史价格走势`;
    terminal.querySelector("#chartSubtitle").textContent = shown.length
      ? `${shown[0].date} - ${shown[shown.length - 1].date} · ${shown.length} 日记录${priceUnit === "rmb" ? " · 按每日拍卖金价折算" : ""}`
      : "暂无历史数据";
    terminal.querySelector("#chartStage").innerHTML = buildChart(history);
    const lows = shown.map((item) => priceForUnit(item.lowest, item.date)).filter(Number.isFinite);
    const first = shown[0];
    const last = shown[shown.length - 1];
    const periodChange = first && last ? ratio(priceForUnit(last.lowest, last.date), priceForUnit(first.lowest, first.date)) : null;
    const metrics = [
      ["区间最高", lows.length ? fmtUnitValue(Math.max(...lows)) : "—", "metric-high"],
      ["区间最低", lows.length ? fmtUnitValue(Math.min(...lows)) : "—", "metric-low"],
      ["区间均价", lows.length ? fmtUnitValue(lows.reduce((sum, value) => sum + value, 0) / lows.length) : "—", "metric-average"],
      ["区间涨跌", fmtPercent(periodChange), `metric-change ${deltaClass(periodChange)}`],
      ["最新较成交", fmtPercent(row.lowVsRecentDeal), `metric-deal ${deltaClass(row.lowVsRecentDeal)}`]
    ];
    terminal.querySelector("#chartSummary").innerHTML = metrics.map(([label, value, className]) => `<div class="chart-metric ${className}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  };

  const hideChartTooltip = () => {
    const tooltip = terminal.querySelector("#chartTooltip");
    const guide = terminal.querySelector("#chartGuide");
    if (tooltip) tooltip.classList.remove("visible");
    if (guide) guide.classList.remove("visible");
    terminal.querySelectorAll(".book-chart-point.is-hovered").forEach((point) => point.classList.remove("is-hovered"));
  };

  const showChartTooltip = (hitArea, clientX, clientY) => {
    const row = activeRow();
    const tooltip = terminal.querySelector("#chartTooltip");
    const guide = terminal.querySelector("#chartGuide");
    const stage = terminal.querySelector("#chartStage");
    if (!row || !tooltip || !guide || !stage || !hitArea) return;
    const shown = chartRows(row.history);
    const index = Number(hitArea.dataset.chartIndex);
    const point = shown[index];
    if (!point) return;
    const series = [...visibleChartSeries()].sort((a, b) => ["lowest", "recentDeal", "prevAvg"].indexOf(a.key) - ["lowest", "recentDeal", "prevAvg"].indexOf(b.key));
    tooltip.innerHTML = `<time>${escapeHtml(point.date)}</time>${series.map((item) => `<div class="chart-tooltip-row"><span><i style="--series:${item.color}"></i>${escapeHtml(item.label)}</span><strong>${fmtUnitValue(chartValue(point, item.key))}</strong></div>`).join("")}`;
    tooltip.classList.add("visible");
    guide.setAttribute("x1", hitArea.dataset.chartX);
    guide.setAttribute("x2", hitArea.dataset.chartX);
    guide.classList.add("visible");
    terminal.querySelectorAll(".book-chart-point").forEach((chartPoint) => chartPoint.classList.toggle("is-hovered", Number(chartPoint.dataset.chartPointIndex) === index));

    const stageRect = stage.getBoundingClientRect();
    const hitRect = hitArea.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const anchorX = Number.isFinite(clientX) ? clientX : hitRect.left + hitRect.width / 2;
    const anchorY = Number.isFinite(clientY) ? clientY : hitRect.top + Math.min(80, hitRect.height / 2);
    let left = anchorX - stageRect.left + 12;
    if (left + tooltipRect.width > stageRect.width - 8) left = anchorX - stageRect.left - tooltipRect.width - 12;
    left = Math.max(8, Math.min(left, stageRect.width - tooltipRect.width - 8));
    const top = Math.max(8, Math.min(anchorY - stageRect.top - tooltipRect.height / 2, stageRect.height - tooltipRect.height - 8));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const renderSignal = () => {
    const row = activeRow();
    const panel = terminal.querySelector("#signalPanel");
    if (!row) return;
    const historyValues = row.history.map((item) => ({ ...item, unitLowest: priceForUnit(item.lowest, item.date) })).filter((item) => Number.isFinite(item.unitLowest));
    const lows = historyValues.map((item) => item.unitLowest);
    const low = Math.min(...lows);
    const high = Math.max(...lows);
    const currentValue = priceForUnit(row.lowest, row.date);
    const position = high > low && Number.isFinite(currentValue) ? Math.max(0, Math.min(100, (currentValue - low) / (high - low) * 100)) : 50;
    const recent = historyValues.slice(-7);
    const weeklyChange = recent.length > 1 ? ratio(recent[recent.length - 1].unitLowest, recent[0].unitLowest) : null;
    const dailyChanges = recent.slice(1).map((item, index) => Math.abs(ratio(item.unitLowest, recent[index].unitLowest))).filter(Number.isFinite);
    const volatility = dailyChanges.length ? dailyChanges.reduce((sum, value) => sum + value, 0) / dailyChanges.length : null;
    const direction = row.status.className === "high" ? "book-up" : row.status.className ? "book-down" : "book-flat";
    const title = row.status.className === "deep" ? "当前报价进入明显低位" : row.status.className === "low" ? "当前报价低于近期均值" : row.status.className === "high" ? "当前报价出现短线抬价" : "当前报价处于平稳区间";
    const description = row.status.className === "high" ? "当前最低价显著高于昨日均价，追价前建议观察最近成交是否同步上移。" : row.status.className ? "当前最低价低于昨日均价，可结合历史低点和成交价判断是否出现折价。" : "最低价与昨日均价差距有限，暂未出现明显价格失衡。";
    panel.innerHTML = `<div class="panel-head"><div><h3>行情判断</h3><p>${escapeHtml(row.date)} · ${escapeHtml(row.name)}</p></div></div><div class="signal-overview">
      <span class="signal-label ${direction}">${escapeHtml(row.status.text)}</span>
      <h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p>
      <div class="position-bar"><span class="position-marker" style="left:${position.toFixed(1)}%"></span></div><div class="position-legend"><span>历史低位</span><span>历史高位</span></div>
      <div class="signal-metrics"><div><span>7日方向</span><strong class="${deltaClass(weeklyChange)}">${fmtPercent(weeklyChange)}</strong></div><div><span>日均波动</span><strong>${Number.isFinite(volatility) ? (volatility * 100).toFixed(2) + "%" : "—"}</strong></div><div><span>历史位置</span><strong>${position.toFixed(0)}%</strong></div></div>
    </div>`;
  };

  const renderMoves = () => {
    const row = activeRow();
    if (!row) return;
    const history = row.history.map((item) => ({ ...item, unitLowest: priceForUnit(item.lowest, item.date) })).filter((item) => Number.isFinite(item.unitLowest));
    const moves = history.map((item, index) => ({ ...item, change: index ? ratio(item.unitLowest, history[index - 1].unitLowest) : null })).slice(-4).reverse();
    terminal.querySelector("#moveList").innerHTML = moves.length ? moves.map((item) => `<div class="move-row"><time>${escapeHtml(item.date.slice(5))}</time><strong>最低价 ${fmtUnitValue(item.unitLowest)}</strong><b class="${deltaClass(item.change)}">${fmtPercent(item.change)}</b></div>`).join("") : `<div class="terminal-empty">暂无异动数据</div>`;
  };

  const renderRanking = () => {
    const ranked = [...dayRows()].sort((a, b) => b.lowest - a.lowest).slice(0, 5);
    terminal.querySelector("#rankingDate").textContent = selectedDate || "—";
    terminal.querySelector("#rankingList").innerHTML = ranked.map((row, index) => `<div class="ranking-row"><b>${String(index + 1).padStart(2, "0")}</b><button type="button" data-book-key="${encodeKey(row)}"><img src="${BOOK_ICON}" alt="">${escapeHtml(row.name)}</button><strong>${fmtPrice(row.lowest, row.date)}</strong></div>`).join("");
  };

  const renderAll = () => {
    ensureActiveBook();
    terminal.querySelectorAll("[data-price-unit]").forEach((button) => {
      const active = button.dataset.priceUnit === priceUnit;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderTicker();
    renderWatchList();
    renderQuote();
    renderChart();
    renderSignal();
    renderMoves();
    renderRanking();
  };

  const selectBook = (key) => {
    if (!dayRows().some((row) => keyOf(row) === key)) return;
    activeBookKey = key;
    renderAll();
  };

  const bindControls = () => {
    terminal.querySelector("#dateFilter").addEventListener("change", (event) => {
      selectedDate = event.target.value;
      ensureActiveBook();
      renderAll();
    });
    terminal.querySelector("#bookSearch").addEventListener("input", (event) => {
      searchText = event.target.value.trim().toLocaleLowerCase("zh-CN");
      renderWatchList();
    });
    const chartStage = terminal.querySelector("#chartStage");
    terminal.querySelector("#watchList").addEventListener("scroll", syncWatchScrollHint, { passive: true });
    chartStage.addEventListener("pointermove", (event) => {
      const hitArea = event.target.closest?.("[data-chart-index]");
      if (hitArea) showChartTooltip(hitArea, event.clientX, event.clientY);
      else hideChartTooltip();
    });
    chartStage.addEventListener("pointerleave", hideChartTooltip);
    chartStage.addEventListener("focusin", (event) => {
      const hitArea = event.target.closest?.("[data-chart-index]");
      if (hitArea) showChartTooltip(hitArea);
    });
    chartStage.addEventListener("focusout", hideChartTooltip);
    terminal.addEventListener("click", (event) => {
      const unitButton = event.target.closest("[data-price-unit]");
      if (unitButton) {
        priceUnit = unitButton.dataset.priceUnit === "rmb" ? "rmb" : "gold";
        const url = new URL(location.href);
        if (priceUnit === "rmb") url.searchParams.set("unit", "rmb");
        else url.searchParams.delete("unit");
        history.replaceState({}, "", url);
        renderAll();
        return;
      }
      const bookButton = event.target.closest("[data-book-key]");
      if (bookButton) {
        selectBook(decodeURIComponent(bookButton.dataset.bookKey));
        return;
      }
      const filterButton = event.target.closest("[data-filter]");
      if (filterButton) {
        activeFilter = filterButton.dataset.filter;
        terminal.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button === filterButton));
        renderWatchList();
        return;
      }
      const seriesButton = event.target.closest("[data-chart-series]");
      if (seriesButton) {
        chartSeries = seriesButton.dataset.chartSeries;
        terminal.querySelectorAll("[data-chart-series]").forEach((button) => button.classList.toggle("active", button === seriesButton));
        renderChart();
        return;
      }
      const rangeButton = event.target.closest("[data-range]");
      if (rangeButton) {
        chartRange = rangeButton.dataset.range;
        terminal.querySelectorAll("[data-range]").forEach((button) => button.classList.toggle("active", button === rangeButton));
        renderChart();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (event.target.closest?.("#chartStage")) return;
      const items = filteredDayRows();
      if (!items.length) return;
      const index = Math.max(0, items.findIndex((row) => keyOf(row) === activeBookKey));
      const nextIndex = event.key === "ArrowDown" ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
      if (nextIndex !== index) {
        event.preventDefault();
        selectBook(keyOf(items[nextIndex]));
      }
    });
  };

  const applyData = (data) => {
    dashboard = data || {};
    rows = normalizeRows(dashboard.engravingBookPrices);
    auctionRates = buildAuctionRates(dashboard.goldTxns);
    const availableDates = dates();
    selectedDate = availableDates[availableDates.length - 1] || "";
    activeBookKey = dayRows()[0] ? keyOf(dayRows()[0]) : "";
    renderShell();
    renderAll();
  };

  const loadData = async () => {
    let data = window.LOSTARK_PUBLIC_DASHBOARD_STATE || null;
    if (location.protocol !== "file:") {
      try {
        const response = await fetch(`../data/dashboard-state.json?v=${Date.now()}`, { cache: "no-store" });
        if (response.ok) data = await response.json();
      } catch (error) {
        // 静态服务不可用时继续使用 dashboard-state.js。
      }
    }
    applyData(data);
  };

  loadData();
})();
