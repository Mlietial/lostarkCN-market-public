(function (global) {
  const LEVELS = ["5级", "6级", "7级", "8级", "9级", "10级"];
  const LEVEL_KEYS = { "5级": "lv5", "6级": "lv6", "7级": "lv7", "8级": "lv8", "9级": "lv9", "10级": "lv10" };
  const LOW_LEVELS = ["5级", "6级", "7级"];
  const HIGH_LEVELS = ["8级", "9级", "10级"];
  const COLORS = {
    navy: "111827",
    text: "1F2937",
    muted: "64748B",
    line: "D9E2EF",
    page: "F5F7FB",
    card: "FFFFFF",
    soft: "F8FAFC",
    blue: "2563EB",
    orange: "F97316",
    gray: "6B7280",
    yellow: "EAB308",
    sky: "3B82F6",
    green: "2E7D32",
    red: "DC2626",
    emerald: "059669"
  };
  const LEVEL_COLORS = {
    "5级": COLORS.blue,
    "6级": COLORS.orange,
    "7级": COLORS.gray,
    "8级": COLORS.yellow,
    "9级": COLORS.sky,
    "10级": COLORS.green
  };

  function readGlobal(name) {
    try {
      return eval(name);
    } catch (err) {
      return undefined;
    }
  }

  function getPptxCtor() {
    return global.pptxgen || global.PptxGenJS || global.pptxgenjs || readGlobal("pptxgen") || readGlobal("PptxGenJS");
  }

  function toNumber(value) {
    if (value == null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const n = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function normalizeDate(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const m = text.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if (!m) return text;
    return m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0");
  }

  function fileDate(value) {
    return normalizeDate(value).replace(/\D/g, "").slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/\D/g, "");
  }

  function fmtNum(value) {
    const n = toNumber(value);
    return n == null ? "—" : Math.round(n).toLocaleString("zh-CN");
  }

  function fmtPct(value) {
    if (!Number.isFinite(value)) return "—";
    return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
  }

  function fmtRate(value) {
    const n = toNumber(value);
    return n == null ? "—" : n.toFixed(1) + " 金/¥";
  }

  function getRowPrice(row, level) {
    const key = LEVEL_KEYS[level];
    if (row && row.raw && row.raw[level] != null) return toNumber(row.raw[level]);
    if (row && row[level] != null) return toNumber(row[level]);
    if (row && row[key] != null) return toNumber(row[key]);
    return null;
  }

  function normalizeGemRows(sourceRows) {
    return (Array.isArray(sourceRows) ? sourceRows : [])
      .map((row) => {
        const out = { date: normalizeDate(row.date || row.日期 || row.Date || row.DATE) };
        LEVELS.forEach((level) => {
          out[LEVEL_KEYS[level]] = getRowPrice(row, level);
        });
        return out;
      })
      .filter((row) => row.date && LEVELS.some((level) => row[LEVEL_KEYS[level]] != null))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function rowsFromEmbeddedData() {
    const node = global.document && global.document.getElementById ? global.document.getElementById("EMBEDDED_DATA") : null;
    if (!node || !node.textContent) return [];
    try {
      const payload = JSON.parse(node.textContent);
      return normalizeGemRows(payload.gemRows || []);
    } catch (err) {
      return [];
    }
  }

  function getPptSourceData() {
    const currentData = readGlobal("data");
    let rows = normalizeGemRows(currentData);
    if (!rows.length) rows = normalizeGemRows(readGlobal("rawRows"));
    if (!rows.length) rows = rowsFromEmbeddedData();
    return rows;
  }

  function latestValue(rows, level) {
    const key = LEVEL_KEYS[level];
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][key] != null) return { row: rows[i], index: i, value: rows[i][key] };
    }
    return null;
  }

  function previousValue(rows, level, fromIndex) {
    const key = LEVEL_KEYS[level];
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (rows[i][key] != null) return { row: rows[i], index: i, value: rows[i][key] };
    }
    return null;
  }

  function averageLast(rows, level, count) {
    const key = LEVEL_KEYS[level];
    const values = [];
    for (let i = rows.length - 1; i >= 0 && values.length < count; i--) {
      if (rows[i][key] != null) values.push(rows[i][key]);
    }
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  function levelMetric(rows, level) {
    const latest = latestValue(rows, level);
    const prev = latest ? previousValue(rows, level, latest.index) : null;
    const pct = latest && prev && prev.value ? ((latest.value - prev.value) / prev.value) * 100 : null;
    return {
      level,
      current: latest ? latest.value : null,
      previous: prev ? prev.value : null,
      changePct: pct,
      avg7: averageLast(rows, level, 7)
    };
  }

  function getLatestDate(rows) {
    return rows.length ? rows[rows.length - 1].date : "";
  }

  function getConclusion(rows) {
    const metrics = LEVELS.map((level) => levelMetric(rows, level)).filter((item) => Number.isFinite(item.changePct));
    if (!metrics.length) return "当前数据不足，建议继续补齐连续日期后再判断趋势。";
    const avg = metrics.reduce((sum, item) => sum + item.changePct, 0) / metrics.length;
    const strongest = metrics.slice().sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
    const direction = Math.abs(avg) < 0.05 ? "整体横盘" : avg > 0 ? "整体偏强" : "整体偏弱";
    return direction + "，平均涨跌幅 " + fmtPct(avg) + "；波动最明显的是 " + strongest.level + "（" + fmtPct(strongest.changePct) + "）。";
  }

  function getGoldAnalysis() {
    const goldHistory = readGlobal("goldHistory");
    const gcTxns = readGlobal("gcTxns");
    const getGcStats = readGlobal("getGcStats");
    const buildDailyGoldReportData = readGlobal("buildDailyGoldReportData");
    if (typeof buildDailyGoldReportData === "function") {
      try {
        const report = buildDailyGoldReportData();
        return {
          hasData: !!(report && report.reportRate),
          date: report && (report.quoteDate || (report.reportSource && report.reportSource.date)),
          source: report && report.reportSourceLabel,
          mail: report && report.stats ? report.stats.mail : null,
          auc: report && report.stats ? report.stats.auc : null,
          cost10k: report && report.buy ? report.buy.actualCost10k : null,
          actualRate: report && report.buy ? report.buy.actualRate : null
        };
      } catch (err) {}
    }
    if (Array.isArray(goldHistory) && goldHistory.length && typeof getGcStats === "function") {
      const date = goldHistory[goldHistory.length - 1].date;
      const stats = getGcStats(date);
      return {
        hasData: !!(stats && (stats.mail || stats.auc)),
        date,
        source: "最新金价数据",
        mail: stats ? stats.mail : null,
        auc: stats ? stats.auc : null,
        cost10k: null,
        actualRate: null
      };
    }
    return { hasData: Array.isArray(gcTxns) && gcTxns.length > 0, date: "", source: "", mail: null, auc: null, cost10k: null, actualRate: null };
  }

  function addTitle(slide, title, subtitle) {
    slide.background = { color: COLORS.page };
    slide.addText(title, { x: 0.55, y: 0.35, w: 8.2, h: 0.42, fontFace: "Microsoft YaHei", fontSize: 22, bold: true, color: COLORS.navy, margin: 0 });
    if (subtitle) slide.addText(subtitle, { x: 0.57, y: 0.82, w: 8.8, h: 0.22, fontFace: "Microsoft YaHei", fontSize: 8.5, color: COLORS.muted, margin: 0 });
    slide.addShape(getShapeType("line"), { x: 0.55, y: 1.12, w: 12.1, h: 0, line: { color: COLORS.line, pt: 1 } });
  }

  function addFooter(slide, pageNo) {
    slide.addText("宝石价格指数仪表盘 · " + pageNo + "/6", { x: 10.5, y: 7.04, w: 2.1, h: 0.18, fontFace: "Microsoft YaHei", fontSize: 7.5, color: COLORS.muted, align: "right", margin: 0 });
  }

  function getShapeType(name) {
    const ctor = getPptxCtor();
    const proto = ctor ? new ctor() : null;
    const shapes = (proto && proto.ShapeType) || (ctor && ctor.ShapeType) || {};
    return shapes[name] || shapes[name.toUpperCase && name.toUpperCase()] || name;
  }

  function getChartType(name) {
    const ctor = getPptxCtor();
    const proto = ctor ? new ctor() : null;
    const charts = (proto && proto.ChartType) || (ctor && ctor.ChartType) || {};
    return charts[name] || charts[name.toUpperCase && name.toUpperCase()] || name;
  }

  function addCard(slide, x, y, w, h, title, value, detail, accent) {
    slide.addShape(getShapeType("rect"), {
      x,
      y,
      w,
      h,
      rectRadius: 0.08,
      fill: { color: COLORS.card },
      line: { color: COLORS.line, pt: 1 }
    });
    slide.addText(title, { x: x + 0.16, y: y + 0.14, w: w - 0.32, h: 0.18, fontFace: "Microsoft YaHei", fontSize: 8.5, bold: true, color: COLORS.muted, margin: 0 });
    slide.addText(value, { x: x + 0.16, y: y + 0.42, w: w - 0.32, h: 0.35, fontFace: "Microsoft YaHei", fontSize: 17, bold: true, color: accent || COLORS.navy, margin: 0 });
    if (detail) slide.addText(detail, { x: x + 0.16, y: y + 0.88, w: w - 0.32, h: 0.32, fontFace: "Microsoft YaHei", fontSize: 7.5, color: COLORS.muted, fit: "shrink", margin: 0 });
  }

  function addSimpleTable(slide, rows, x, y, w, h, opts) {
    slide.addTable(rows, {
      x,
      y,
      w,
      h,
      margin: 0.06,
      fontFace: "Microsoft YaHei",
      fontSize: (opts && opts.fontSize) || 8.5,
      color: COLORS.text,
      border: { type: "solid", color: COLORS.line, pt: 0.7 },
      fill: { color: COLORS.card },
      valign: "middle",
      autoFit: false,
      colW: opts && opts.colW
    });
  }

  function analysisRows(rows, levels) {
    return [
      ["等级", "当前价", "昨日价", "涨跌幅", "近7日均价"],
      ...levels.map((level) => {
        const metric = levelMetric(rows, level);
        return [level, fmtNum(metric.current), fmtNum(metric.previous), fmtPct(metric.changePct), fmtNum(metric.avg7)];
      })
    ];
  }

  function addOverviewSlide(pptx, rows) {
    const slide = pptx.addSlide();
    const latestDate = getLatestDate(rows);
    addTitle(slide, "今日总览", "最新日期：" + latestDate + "；数据源来自当前页面已录入宝石价格");
    const metrics = LEVELS.map((level) => levelMetric(rows, level));
    metrics.forEach((metric, idx) => {
      const x = 0.65 + (idx % 3) * 4.05;
      const y = 1.45 + Math.floor(idx / 3) * 1.42;
      const color = metric.changePct > 0 ? COLORS.red : metric.changePct < 0 ? COLORS.emerald : COLORS.navy;
      addCard(slide, x, y, 3.62, 1.12, metric.level, fmtNum(metric.current), "较昨日 " + fmtPct(metric.changePct) + "；7日均价 " + fmtNum(metric.avg7), color);
    });
    addCard(slide, 0.65, 4.45, 11.85, 1.35, "简单结论", getConclusion(rows), "自动根据最新价、昨日价和近7日均值生成。", COLORS.navy);
    addFooter(slide, 1);
  }

  function addAnalysisSlide(pptx, rows, title, levels, pageNo) {
    const slide = pptx.addSlide();
    addTitle(slide, title, "当前价、昨日价、涨跌幅、近7日均价");
    addSimpleTable(slide, analysisRows(rows, levels), 0.75, 1.45, 11.75, 2.2, { fontSize: 10, colW: [1.3, 2.4, 2.4, 2.1, 2.6] });
    const notes = levels.map((level) => {
      const metric = levelMetric(rows, level);
      return level + " 当前 " + fmtNum(metric.current) + "，较昨日 " + fmtPct(metric.changePct) + "，近7日均价 " + fmtNum(metric.avg7) + "。";
    }).join("\n");
    addCard(slide, 0.75, 4.05, 11.75, 1.55, "分析摘要", notes, "", COLORS.navy);
    addFooter(slide, pageNo);
  }

  function addTrendSlide(pptx, rows) {
    const slide = pptx.addSlide();
    addTitle(slide, "近7日趋势", "PPT 原生折线图，非截图");
    const recent = rows.slice(-7);
    const labels = recent.map((row) => row.date.slice(5));
    const chartData = LEVELS.map((level) => ({
      name: level,
      labels,
      values: recent.map((row) => row[LEVEL_KEYS[level]] == null ? null : row[LEVEL_KEYS[level]])
    }));
    slide.addChart(getChartType("line"), chartData, {
      x: 0.72,
      y: 1.45,
      w: 11.7,
      h: 4.85,
      catAxisLabelFontFace: "Microsoft YaHei",
      catAxisLabelFontSize: 8,
      valAxisLabelFontFace: "Microsoft YaHei",
      valAxisLabelFontSize: 8,
      showLegend: true,
      showTitle: false,
      showValue: false,
      chartColors: LEVELS.map((level) => LEVEL_COLORS[level]),
      valGridLine: { color: COLORS.line, style: "solid", pt: 0.6 },
      lineSize: 2.2,
      lineSmooth: false
    });
    addFooter(slide, 4);
  }

  function addGoldSlide(pptx) {
    const slide = pptx.addSlide();
    const gold = getGoldAnalysis();
    addTitle(slide, "金价 / 回收比例分析", gold.date ? "报价日期：" + gold.date : "读取页面当前金价模块");
    if (!gold.hasData) {
      addCard(slide, 0.85, 1.65, 11.35, 1.5, "暂无金价数据", "暂无金价数据", "请先在页面金价模块录入邮寄或拍卖交易记录。", COLORS.muted);
      addFooter(slide, 5);
      return;
    }
    addCard(slide, 0.75, 1.45, 5.55, 1.35, "金价来源", gold.source || "最新金价数据", "优先读取页面日报金价来源。", COLORS.navy);
    addCard(slide, 6.65, 1.45, 5.55, 1.35, "每万金成本", gold.cost10k == null ? "—" : "¥" + Number(gold.cost10k).toFixed(2), "实到金价 " + fmtRate(gold.actualRate), COLORS.navy);
    const tableRows = [
      ["类型", "中间价", "每万金", "卖出净收"],
      ["邮寄交易", gold.mail ? fmtRate(gold.mail.mid) : "暂无", gold.mail ? "¥" + gold.mail.per10k.toFixed(2) : "—", gold.mail ? "¥" + gold.mail.per10kNet.toFixed(2) : "—"],
      ["拍卖交易", gold.auc ? fmtRate(gold.auc.mid) : "暂无", gold.auc ? "¥" + gold.auc.per10k.toFixed(2) : "—", gold.auc ? "¥" + gold.auc.per10kNet.toFixed(2) : "—"]
    ];
    addSimpleTable(slide, tableRows, 0.75, 3.35, 11.45, 1.65, { fontSize: 10, colW: [2.4, 3, 3, 3] });
    addFooter(slide, 5);
  }

  function addConclusionSlide(pptx, rows) {
    const slide = pptx.addSlide();
    addTitle(slide, "今日结论", "自动根据页面当前数据生成");
    const metrics = LEVELS.map((level) => levelMetric(rows, level)).filter((metric) => Number.isFinite(metric.changePct));
    const up = metrics.filter((metric) => metric.changePct > 0.05).map((metric) => metric.level);
    const down = metrics.filter((metric) => metric.changePct < -0.05).map((metric) => metric.level);
    const lines = [
      getConclusion(rows),
      "上涨等级：" + (up.join("、") || "无明显上涨") + "。",
      "下跌等级：" + (down.join("、") || "无明显下跌") + "。",
      "建议：高波动等级优先观察成交连续性，低波动等级按近7日均价判断是否偏离。"
    ];
    slide.addText(lines.join("\n"), {
      x: 0.88,
      y: 1.55,
      w: 11.1,
      h: 3.2,
      fontFace: "Microsoft YaHei",
      fontSize: 18,
      color: COLORS.text,
      breakLine: false,
      fit: "shrink",
      margin: 0.16
    });
    addCard(slide, 0.88, 5.15, 11.1, 0.95, "数据口径", "价格、金价和回收比例均来自当前页面状态；PPT 为原生元素生成。", "", COLORS.muted);
    addFooter(slide, 6);
  }

  function buildGemPricePpt(rows) {
    const PptxGen = getPptxCtor();
    if (!PptxGen) throw new Error("未加载本地 PptxGenJS：请确认 libs/pptxgen.bundle.js 存在并已引入。");
    const sourceRows = rows && rows.length ? normalizeGemRows(rows) : getPptSourceData();
    if (!sourceRows.length) throw new Error("暂无可导出的宝石价格数据。");
    const pptx = new PptxGen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "宝石价格指数仪表盘";
    pptx.company = "宝石价格指数仪表盘";
    pptx.subject = "宝石价格日报";
    pptx.title = "宝石价格日报 " + getLatestDate(sourceRows);
    pptx.theme = {
      headFontFace: "Microsoft YaHei",
      bodyFontFace: "Microsoft YaHei",
      lang: "zh-CN"
    };
    addOverviewSlide(pptx, sourceRows);
    addAnalysisSlide(pptx, sourceRows, "5-7级宝石分析", LOW_LEVELS, 2);
    addAnalysisSlide(pptx, sourceRows, "8-10级宝石分析", HIGH_LEVELS, 3);
    addTrendSlide(pptx, sourceRows);
    addGoldSlide(pptx);
    addConclusionSlide(pptx, sourceRows);
    return pptx;
  }

  async function exportGemDashboardPpt() {
    const btn = global.document && global.document.getElementById ? global.document.getElementById("exportPptBtn") : null;
    const oldText = btn ? btn.textContent : "";
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "生成PPT...";
      }
      const rows = getPptSourceData();
      const pptx = buildGemPricePpt(rows);
      const filename = "宝石价格日报_" + fileDate(getLatestDate(rows)) + ".pptx";
      await pptx.writeFile({ fileName: filename });
      if (typeof global.showStatus === "function") global.showStatus("已导出PPT：" + filename, true);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      if (typeof global.showStatus === "function") global.showStatus("PPT导出失败：" + msg);
      else throw err;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText;
      }
    }
  }

  global.GemDashboardPptExport = {
    getPptSourceData,
    buildGemPricePpt,
    exportGemDashboardPpt,
    normalizeGemRows,
    levelMetric,
    getGoldAnalysis,
    getConclusion
  };
})(window);
