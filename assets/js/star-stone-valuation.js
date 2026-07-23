(function (root) {
  const STORAGE_KEY = "heroStarBoxValuationMode";
  const values = Object.freeze({
    heroStarBox: Object.freeze({ starcoin: 560, merchantGold: 43000 }),
    advancedHeroStarBox: Object.freeze({ defaultGold: 2500, merchantGold: 1185 })
  });

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "merchant" ? "merchant" : "starcoin";
    } catch (error) {
      return "starcoin";
    }
  }

  function setMode(mode) {
    const normalized = mode === "merchant" ? "merchant" : "starcoin";
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch (error) {
      // The active page still keeps the selected mode when storage is unavailable.
    }
    return normalized;
  }

  root.LOSTARK_STAR_STONE_VALUES = Object.freeze({ STORAGE_KEY, values, getMode, setMode });
})(typeof window === "undefined" ? globalThis : window);
