(() => {
  "use strict";

  const dashboard = window.LOSTARK_PUBLIC_DASHBOARD_STATE;
  const terminal = document.getElementById("gemTerminal");
  const levels = ["5级", "6级", "7级", "8级", "9级", "10级"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const html = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const finite = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const fmt = (value, digits = 0) => finite(value)
    ? new Intl.NumberFormat("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value))
    : "—";
  const compact = value => {
    if (!finite(value)) return "—";
    const number = Number(value);
    if (Math.abs(number) >= 100000000) return `${fmt(number / 100000000, 2)} 亿`;
    if (Math.abs(number) >= 10000) return `${fmt(number / 10000, 1)} 万`;
    return fmt(number);
  };
  const pct = value => finite(value) ? `${Number(value) > 0 ? "+" : ""}${fmt(Number(value) * 100, 1)}%` : "—";
  const tone = value => !finite(value) || Math.abs(Number(value)) < .0005 ? "flat" : Number(value) > 0 ? "up" : "down";
  const shortDate = value => {
    const parts = String(value || "").split("-");
    return parts.length === 3 ? `${Number(parts[1])}月${Number(parts[2])}日` : String(value || "—");
  };
  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  function buildGems() {
    return levels.map((level, index) => {
      const points = (dashboard?.gemRows || [])
        .filter(row => finite(row[level]))
        .map(row => ({ date: row.日期, value: Number(row[level]) }));
      const current = points.at(-1)?.value;
      const previous = points.at(-2)?.value;
      const weekBase = points.at(-8)?.value ?? points[0]?.value;
      const recent = points.slice(-30).map(point => point.value);
      const returns = points.slice(1).map((point, pointIndex) => (point.value - points[pointIndex].value) / points[pointIndex].value).filter(finite);
      const recentReturns = returns.slice(-30);
      const returnMean = mean(recentReturns);
      const variance = mean(recentReturns.map(value => (value - returnMean) ** 2));
      const high30 = Math.max(...recent);
      const low30 = Math.min(...recent);
      return {
        id: String(index + 5),
        level,
        name: `${level}宝石`,
        symbol: `GEM-${String(index + 5).padStart(2, "0")}`,
        current,
        previous,
        dayChange: previous ? (current - previous) / previous : null,
        weekChange: weekBase ? (current - weekBase) / weekBase : null,
        high30,
        low30,
        average30: mean(recent),
        volatility: Math.sqrt(variance),
        position: high30 === low30 ? .5 : (current - low30) / (high30 - low30),
        points
      };
    }).filter(gem => finite(gem.current));
  }

  if (!dashboard?.gemRows?.length) {
    terminal.innerHTML = "宝石行情数据暂不可用";
    return;
  }

  const gems = buildGems();
  const params = new URLSearchParams(location.search);
  const validRange = value => ["7", "30", "all"].includes(value) ? value : "30";
  const requestedGem = params.get("gem");
  const state = {
    gemId: gems.some(gem => gem.id === requestedGem) ? requestedGem : "8",
    range: validRange(params.get("range")),
    animationToken: 0
  };

  function currentGem() {
    return gems.find(gem => gem.id === state.gemId) || gems[0];
  }

  function pointsInRange(gem) {
    const count = state.range === "all" ? gem.points.length : Number(state.range);
    return gem.points.slice(-count);
  }

  function updateUrl() {
    const url = new URL(location.href);
    state.gemId === "8" ? url.searchParams.delete("gem") : url.searchParams.set("gem", state.gemId);
    state.range === "30" ? url.searchParams.delete("range") : url.searchParams.set("range", state.range);
    history.replaceState({}, "", url);
  }

  function trendSignal(gem) {
    const day = Number(gem.dayChange || 0);
    const week = Number(gem.weekChange || 0);
    if (day * week < 0 && Math.abs(day) >= .005) return { label: "日周分歧", style: tone(day), title: "短线方向与 7 日方向相反", note: "先看后续价格是否延续，避免只凭单日变化判断。" };
    if (day >= .03) return { label: "快速走高", style: "up", title: "短线价格明显抬升", note: "当前日变化超过 3%，处于今日宝石行情的强势区间。" };
    if (day > .005) return { label: "温和走高", style: "up", title: "价格正在小幅抬升", note: "短线方向向上，但仍需结合 7 日位置判断持续性。" };
    if (day <= -.03) return { label: "快速回落", style: "down", title: "短线价格明显回落", note: "当前日变化低于 -3%，优先检查是否接近 30 日低位。" };
    if (day < -.005) return { label: "温和回落", style: "down", title: "价格正在小幅回落", note: "短线方向向下，可继续观察低位支撑是否有效。" };
    return { label: "窄幅整理", style: "flat", title: "短线价格变化有限", note: "当前与前一日接近，更多参考 7 日趋势和区间位置。" };
  }

  function positionText(gem) {
    if (gem.position <= .18) return "接近 30 日低位";
    if (gem.position >= .82) return "接近 30 日高位";
    if (gem.position <= .45) return "位于区间偏低位置";
    if (gem.position >= .55) return "位于区间偏高位置";
    return "位于 30 日区间中部";
  }

  function biggestMoves(gem) {
    return gem.points.slice(1).map((point, index) => {
      const previous = gem.points[index];
      return { date: point.date, value: point.value, change: (point.value - previous.value) / previous.value };
    }).filter(row => finite(row.change)).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
  }

  function tickerMarkup() {
    const groupItems = Array.from({ length: 4 }, () => gems).flat();
    const group = clone => `<div class="ticker-group" ${clone ? 'aria-hidden="true"' : ""}>${groupItems.map((gem, index) => {
      const duplicate = clone || index >= gems.length;
      return `<button class="ticker-item" type="button" data-gem="${gem.id}" ${duplicate ? 'tabindex="-1" aria-hidden="true"' : ""}><strong>${gem.name}</strong><b>${compact(gem.current)}</b><span class="${tone(gem.dayChange)}">${pct(gem.dayChange)}</span></button>`;
    }).join("")}</div>`;
    return `${group(false)}${group(true)}`;
  }

  function watchMarkup() {
    return gems.map(gem => `<button class="watch-row ${gem.id === state.gemId ? "active" : ""}" type="button" data-gem="${gem.id}" aria-pressed="${gem.id === state.gemId}"><span class="watch-name"><span class="gem-symbol"><span>${gem.id}</span></span><span><strong>${gem.name}</strong><small>${gem.symbol}</small></span></span><span class="watch-price"><strong>${compact(gem.current)}</strong><small>7日 ${pct(gem.weekChange)}</small></span><span class="watch-change ${tone(gem.dayChange)}">${pct(gem.dayChange)}</span></button>`).join("");
  }

  function movesMarkup(gem) {
    return biggestMoves(gem).map(move => `<div class="move-row"><time>${shortDate(move.date)}</time><strong>${compact(move.value)} 金</strong><b class="${tone(move.change)}">${pct(move.change)}</b></div>`).join("");
  }

  function render() {
    const gem = currentGem();
    const signal = trendSignal(gem);
    const rangePoints = pointsInRange(gem);
    const rangeValues = rangePoints.map(point => point.value);
    const rangeHigh = Math.max(...rangeValues);
    const rangeLow = Math.min(...rangeValues);
    const rangeAverage = mean(rangeValues);
    const priceTone = tone(gem.dayChange);
    terminal.className = "terminal-shell";
    if (!terminal.querySelector(".ticker-window")) {
      terminal.innerHTML = `
        <header class="terminal-topbar">
          <div class="terminal-brand"><span class="terminal-logo"><span>◆</span></span><div><strong>方舟宝石行情终端</strong><small>Gem Market Terminal</small></div></div>
          <div class="terminal-session"><span class="live-dot"></span><span>公开行情已接入 · 日价格快照</span></div>
          <div class="terminal-actions"><div class="snapshot"><strong>${html(dashboard.publishedAt || "—")}</strong>数据更新时间</div><a class="back-link" href="./?market=gems">← 返回市场台</a></div>
        </header>
        <div class="ticker-window" aria-label="宝石行情滚动栏"><div class="ticker-track">${tickerMarkup()}</div></div>
        <main class="terminal-main" data-terminal-main></main>`;
    }
    const mainMarkup = `
      <main class="terminal-main" data-terminal-main>
        <aside class="panel watch-panel">
          <header class="panel-head"><div><h2>宝石自选</h2><p>按等级连续比较</p></div><span>${gems.length} 个等级</span></header>
          <div class="watch-columns"><span>宝石</span><span>当前 / 7日</span><span>今日</span></div>
          <div class="watch-list">${watchMarkup()}</div>
          <div class="keyboard-tip"><kbd>↑</kbd> <kbd>↓</kbd> 可连续切换宝石，行情图会同步刷新。</div>
        </aside>

        <section class="center-column">
          <section class="panel quote-panel" aria-live="polite">
            <div class="quote-main">
              <div class="quote-identity"><span class="quote-gem"><span>${gem.id}</span></span><div class="quote-title"><h1>${gem.name}</h1><p>${gem.symbol} · 游戏内金币市场 · 公开快照</p></div></div>
              <div class="quote-stats"><div class="quote-stat"><span>前一日</span><strong>${fmt(gem.previous)}</strong></div><div class="quote-stat"><span>近 7 日</span><strong class="${tone(gem.weekChange)}">${pct(gem.weekChange)}</strong></div><div class="quote-stat"><span>30 日最高</span><strong>${fmt(gem.high30)}</strong></div><div class="quote-stat"><span>30 日最低</span><strong>${fmt(gem.low30)}</strong></div></div>
              <div class="quote-price ${priceTone === "up" ? "flash-up" : priceTone === "down" ? "flash-down" : ""}"><div class="quote-price-line"><strong>${fmt(gem.current)}</strong><em class="${priceTone}">${gem.dayChange >= 0 ? "↑" : "↓"} ${pct(gem.dayChange)}</em></div><p>较前一日 ${gem.dayChange >= 0 ? "+" : ""}${fmt(gem.current - gem.previous)} 金 · 当前价格单位：金币</p></div>
            </div>
          </section>

          <section class="panel chart-panel">
            <header class="chart-head"><div><h2>${gem.name}价格走势</h2><p>价格与日波动合并显示 · 0% 中线上涨向上、下跌向下</p></div><div class="chart-tools">${[{ id: "7", label: "7日" }, { id: "30", label: "30日" }, { id: "all", label: "全部" }].map(range => `<button class="range-button ${state.range === range.id ? "active" : ""}" type="button" data-range="${range.id}">${range.label}</button>`).join("")}</div></header>
            <div class="chart-stage"><canvas class="market-chart" data-gem-chart aria-label="${gem.name}价格走势图"></canvas><div class="chart-tooltip" data-chart-tooltip></div></div>
            <div class="chart-summary"><div class="chart-metric"><span>区间最高</span><strong>${fmt(rangeHigh)}</strong></div><div class="chart-metric"><span>区间最低</span><strong>${fmt(rangeLow)}</strong></div><div class="chart-metric"><span>区间均价</span><strong>${fmt(rangeAverage)}</strong></div><div class="chart-metric"><span>距区间低位</span><strong>${pct((gem.current - rangeLow) / rangeLow)}</strong></div><div class="chart-metric"><span>数据点</span><strong>${rangePoints.length} 日</strong></div></div>
          </section>

        </section>

        <aside class="right-column">
          <section class="panel"><header class="panel-head"><div><h3>行情判断</h3><p>方向、位置与波动</p></div></header><div class="signal-overview"><span class="signal-label ${signal.style}">${signal.label}</span><h2>${signal.title}</h2><p>${signal.note}</p><div class="position-bar"><span class="position-marker" style="left:${Math.max(2, Math.min(98, gem.position * 100))}%"></span></div><div class="position-legend"><span>30日低位</span><span>当前 ${fmt(gem.position * 100)}%</span><span>30日高位</span></div><div class="signal-metrics"><div><span>7 日方向</span><strong class="${tone(gem.weekChange)}">${gem.weekChange >= 0 ? "走高" : "回落"} ${fmt(Math.abs(gem.weekChange) * 100, 1)}%</strong></div><div title="${positionText(gem)}"><span>30 日位置</span><strong>${fmt(gem.position * 100)}%</strong></div><div><span>日波动率</span><strong>${fmt(gem.volatility * 100, 2)}%</strong></div></div></div></section>

          <section class="panel"><header class="panel-head"><div><h3>历史异动</h3><p>${gem.name}绝对变化最大的 5 天</p></div></header><div class="move-list">${movesMarkup(gem)}</div></section>
        </aside>
      </main>`;
    terminal.querySelector("[data-terminal-main]").outerHTML = mainMarkup;
    updateUrl();
    requestAnimationFrame(() => {
      animateChart();
      bindChartHover();
    });
  }

  function chartGeometry(canvas, gem) {
    const points = pointsInRange(gem);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pad = { left: 66, right: 84, top: 22, bottom: 46 };
    const plotWidth = Math.max(1, width - pad.left - pad.right);
    const plotHeight = Math.max(1, height - pad.top - pad.bottom);
    const values = points.map(point => point.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const margin = Math.max((rawMax - rawMin) * .13, rawMax * .012, 1);
    const min = Math.max(0, rawMin - margin);
    const max = rawMax + margin;
    const span = max - min || 1;
    const changes = points.map((point, index) => index ? (point.value - points[index - 1].value) / points[index - 1].value : null);
    const maxAbsChange = Math.max(.01, ...changes.filter(finite).map(value => Math.abs(Number(value)))) * 1.08;
    const barBandHeight = Math.max(82, plotHeight * .24);
    const barZero = pad.top + plotHeight - barBandHeight / 2;
    const maxBarHeight = Math.max(34, barBandHeight / 2 - 7);
    const x = index => pad.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
    const y = value => pad.top + plotHeight - ((value - min) / span) * plotHeight;
    return { points, changes, width, height, pad, plotWidth, plotHeight, barZero, maxBarHeight, maxAbsChange, min, max, span, x, y };
  }

  function drawChart(progress = 1, hoverIndex = null) {
    const canvas = document.querySelector("[data-gem-chart]");
    const tooltip = document.querySelector("[data-chart-tooltip]");
    const gem = currentGem();
    if (!canvas || !tooltip) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const geometry = chartGeometry(canvas, gem);
    const { points, changes, width, height, pad, plotWidth, plotHeight, barZero, maxBarHeight, maxAbsChange, max, span, x, y } = geometry;
    if (points.length < 2 || !width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    context.font = '11px "Segoe UI", "Microsoft YaHei UI", sans-serif';
    context.textBaseline = "middle";

    for (let index = 0; index < 5; index += 1) {
      const yy = pad.top + (index / 4) * plotHeight;
      context.strokeStyle = "#dde7f2";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(pad.left, yy);
      context.lineTo(width - pad.right, yy);
      context.stroke();
      context.fillStyle = "#738298";
      context.textAlign = "right";
      context.fillText(compact(max - (index / 4) * span), pad.left - 9, yy);
    }

    const lineColor = gem.dayChange >= 0 ? "#d92d20" : "#07845a";
    context.setLineDash([3, 3]);
    context.strokeStyle = "rgba(112, 132, 157, .72)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(pad.left, barZero);
    context.lineTo(width - pad.right, barZero);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#718198";
    context.textAlign = "left";
    context.fillText("0%", pad.left + 4, barZero - 9);
    context.save();
    context.beginPath();
    context.rect(pad.left, pad.top, plotWidth * Math.max(0, Math.min(1, progress)) + 2, plotHeight + 2);
    context.clip();
    const gradient = context.createLinearGradient(0, pad.top, 0, pad.top + plotHeight);
    gradient.addColorStop(0, gem.dayChange >= 0 ? "rgba(217,45,32,.18)" : "rgba(7,132,90,.18)");
    gradient.addColorStop(1, "rgba(18,97,232,0)");
    context.beginPath();
    context.moveTo(x(0), pad.top + plotHeight);
    points.forEach((point, index) => context.lineTo(x(index), y(point.value)));
    context.lineTo(x(points.length - 1), pad.top + plotHeight);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    changes.forEach((change, index) => {
      if (!finite(change)) return;
      const barHeight = Math.max(4, Math.min(maxBarHeight, (Math.abs(Number(change)) / maxAbsChange) * maxBarHeight));
      const barWidth = Math.max(4, Math.min(18, (plotWidth / Math.max(points.length, 1)) * .62));
      const barX = x(index) - barWidth / 2;
      const barY = Number(change) >= 0 ? barZero - barHeight : barZero;
      context.fillStyle = Number(change) >= 0 ? "rgba(217,45,32,.58)" : "rgba(7,132,90,.58)";
      context.fillRect(barX, barY, barWidth, barHeight);
    });
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(x(index), y(point.value)) : context.moveTo(x(index), y(point.value)));
    context.strokeStyle = lineColor;
    context.lineWidth = 2.4;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    context.restore();

    const currentY = y(points.at(-1).value);
    context.setLineDash([4, 4]);
    context.strokeStyle = `${lineColor}88`;
    context.beginPath();
    context.moveTo(pad.left, currentY);
    context.lineTo(width - pad.right, currentY);
    context.stroke();
    context.setLineDash([]);
    const currentLabel = compact(points.at(-1).value);
    const previousFont = context.font;
    context.font = '700 11px "Segoe UI", "Microsoft YaHei UI", sans-serif';
    const labelWidth = Math.max(62, context.measureText(currentLabel).width + 16);
    const labelHeight = 22;
    const labelX = width - pad.right + 8;
    const labelY = Math.max(pad.top + 2, Math.min(pad.top + plotHeight - labelHeight - 2, currentY - labelHeight / 2));
    context.beginPath();
    if (typeof context.roundRect === "function") context.roundRect(labelX, labelY, labelWidth, labelHeight, 5);
    else context.rect(labelX, labelY, labelWidth, labelHeight);
    context.fillStyle = lineColor;
    context.fill();
    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(currentLabel, labelX + labelWidth / 2, labelY + labelHeight / 2 + .5);
    context.font = previousFont;

    const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
    context.fillStyle = "#738298";
    context.textBaseline = "alphabetic";
    labelIndexes.forEach(index => {
      context.textAlign = index === 0 ? "left" : index === points.length - 1 ? "right" : "center";
      context.fillText(shortDate(points[index].date), x(index), height - 7);
    });

    if (hoverIndex !== null && points[hoverIndex]) {
      const point = points[hoverIndex];
      const xx = x(hoverIndex);
      const yy = y(point.value);
      context.setLineDash([3, 3]);
      context.strokeStyle = "#7d8ca1";
      context.beginPath();
      context.moveTo(xx, pad.top);
      context.lineTo(xx, pad.top + plotHeight);
      context.moveTo(pad.left, yy);
      context.lineTo(width - pad.right, yy);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.arc(xx, yy, 4, 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
      context.strokeStyle = "#fff";
      context.lineWidth = 2;
      context.stroke();
      const change = changes[hoverIndex];
      if (finite(change)) {
        const barHeight = Math.max(4, Math.min(maxBarHeight, (Math.abs(Number(change)) / maxAbsChange) * maxBarHeight));
        const barWidth = Math.max(4, Math.min(18, (plotWidth / Math.max(points.length, 1)) * .62));
        const barY = Number(change) >= 0 ? barZero - barHeight : barZero;
        context.strokeStyle = Number(change) >= 0 ? "#d92d20" : "#07845a";
        context.lineWidth = 1.5;
        context.strokeRect(xx - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
      }
      tooltip.innerHTML = `<span>${html(point.date)}</span><strong>${fmt(point.value)} 金</strong><span class="${tone(change)}">较前一点 ${pct(change)}</span>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.max(8, Math.min(width - 154, xx + 11))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(height - 78, yy - 68))}px`;
    } else {
      tooltip.style.display = "none";
    }
  }

  function animateChart() {
    const token = ++state.animationToken;
    if (reducedMotion) {
      drawChart(1);
      return;
    }
    const start = performance.now();
    const duration = 680;
    const step = now => {
      if (token !== state.animationToken) return;
      const raw = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - raw) ** 3;
      drawChart(eased);
      if (raw < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function bindChartHover() {
    const canvas = document.querySelector("[data-gem-chart]");
    if (!canvas) return;
    canvas.addEventListener("mousemove", event => {
      const gem = currentGem();
      const geometry = chartGeometry(canvas, gem);
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const index = Math.max(0, Math.min(geometry.points.length - 1, Math.round(((mouseX - geometry.pad.left) / geometry.plotWidth) * (geometry.points.length - 1))));
      drawChart(1, index);
    });
    canvas.addEventListener("mouseleave", () => drawChart(1));
  }

  document.addEventListener("click", event => {
    const gemTarget = event.target.closest("[data-gem]");
    if (gemTarget) {
      const next = gemTarget.dataset.gem;
      if (gems.some(gem => gem.id === next) && next !== state.gemId) {
        state.gemId = next;
        render();
      }
      return;
    }
    const rangeTarget = event.target.closest("[data-range]");
    if (rangeTarget) {
      state.range = validRange(rangeTarget.dataset.range);
      render();
    }
  });

  document.addEventListener("keydown", event => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || event.target?.isContentEditable;
    if (typing || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const index = Math.max(0, gems.findIndex(gem => gem.id === state.gemId));
    const nextIndex = Math.max(0, Math.min(gems.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
    if (nextIndex !== index) {
      state.gemId = gems[nextIndex].id;
      render();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => drawChart(1), 100);
  });

  render();
})();
