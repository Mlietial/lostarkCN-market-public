(function () {
  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getPinyinArray(text) {
    try {
      const lib = window.pinyinPro && typeof window.pinyinPro.pinyin === "function"
        ? window.pinyinPro
        : window.pinyin && typeof window.pinyin.pinyin === "function"
          ? window.pinyin
          : null;
      if (!lib) return [];
      const arr = lib.pinyin(String(text || ""), { toneType: "none", type: "array" });
      return Array.isArray(arr) ? arr.filter(Boolean).map(normalize) : [];
    } catch (error) {
      return [];
    }
  }

  function match(text, query) {
    const q = normalize(query);
    if (!q) return true;
    const raw = normalize(text);
    if (raw.includes(q)) return true;

    const arr = getPinyinArray(text);
    if (!arr.length) return false;

    const full = arr.join("");
    const first = arr.map(item => item[0] || "").join("");
    const spaced = arr.join(" ");
    return full.includes(q) || first.includes(q) || spaced.includes(q);
  }

  function any(values, query) {
    return (Array.isArray(values) ? values : [values]).some(value => match(value, query));
  }

  window.LostarkPinyinSearch = { match, any };
})();
