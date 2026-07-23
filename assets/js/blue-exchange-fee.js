(function (root) {
  const tiers = [
    { min: 0, max: 999, fee: 0 },
    { min: 1000, max: 1999, fee: 50 },
    { min: 2000, max: 2999, fee: 100 },
    { min: 3000, max: 3999, fee: 150 },
    { min: 4000, max: 4999, fee: 200 },
    { min: 5000, max: 5999, fee: 250 },
    { min: 6000, max: 6999, fee: 300 },
    { min: 7000, max: 7999, fee: 350 },
    { min: 8000, max: 8999, fee: 400 },
    { min: 9000, max: 9999, fee: 450 },
    { min: 10000, max: 10999, fee: 500 },
    { min: 11000, max: 11999, fee: 550 },
    { min: 12000, max: 12999, fee: 600 },
    { min: 13000, max: 13999, fee: 650 },
    { min: 14000, max: 14999, fee: 700 },
    { min: 15000, max: 15999, fee: 750 },
    { min: 16000, max: 16999, fee: 800 },
    { min: 17000, max: 17999, fee: 850 },
    { min: 18000, max: 18999, fee: 900 },
    { min: 19000, max: 19999, fee: 950 },
    { min: 20000, max: 21999, fee: 1000 },
    { min: 22000, max: 23999, fee: 1100 },
    { min: 24000, max: 25999, fee: 1200 },
    { min: 26000, max: 27999, fee: 1300 },
    { min: 28000, max: 29999, fee: 1400 },
    { min: 30000, max: 31999, fee: 1500 },
    { min: 32000, max: 33999, fee: 1600 },
    { min: 34000, max: 35999, fee: 1700 },
    { min: 36000, max: 37999, fee: 1800 },
    { min: 38000, max: 40999, fee: 1900 },
    { min: 41000, max: 43999, fee: 2050 },
    { min: 44000, max: 46999, fee: 2200 },
    { min: 47000, max: 49999, fee: 2350 },
    { min: 50000, max: 54999, fee: 2500 },
    { min: 55000, max: 59999, fee: 2750 },
    { min: 60000, max: 64999, fee: 3000 },
    { min: 65000, max: 69999, fee: 3250 },
    { min: 70000, max: 74999, fee: 3500 },
    { min: 75000, max: 79999, fee: 3750 },
    { min: 80000, max: 84999, fee: 4000 },
    { min: 85000, max: 89999, fee: 4250 },
    { min: 90000, max: 94999, fee: 4500 },
    { min: 95000, max: 99999, fee: 4750 },
    { min: 100000, max: 109999, fee: 5000 },
    { min: 110000, max: 119999, fee: 5500 },
    { min: 120000, max: 129999, fee: 6000 },
    { min: 130000, max: 139999, fee: 6500 },
    { min: 140000, max: 149999, fee: 7000 },
    { min: 150000, max: 159999, fee: 7500 },
    { min: 160000, max: 169999, fee: 8000 },
    { min: 170000, max: 179999, fee: 8500 },
    { min: 180000, max: 189999, fee: 9000 },
    { min: 190000, max: 199999, fee: 9500 },
    { min: 200000, max: Infinity, fee: 10000 }
  ];

  function serviceFee(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return 0;
    const tier = tiers.find(item => value >= item.min && value <= item.max);
    return tier ? tier.fee : 0;
  }

  function purchaseForNet(neededBlue) {
    const needed = Number(neededBlue);
    if (!Number.isFinite(needed) || needed <= 0) {
      return { grossBlue: 0, feeBlue: 0, netBlue: 0 };
    }

    for (const tier of tiers) {
      const grossBlue = Math.max(tier.min, 1000, Math.ceil(needed + tier.fee));
      if (grossBlue > tier.max) continue;
      return { grossBlue, feeBlue: tier.fee, netBlue: grossBlue - tier.fee };
    }

    return { grossBlue: 0, feeBlue: 0, netBlue: 0 };
  }

  root.LOSTARK_BLUE_EXCHANGE_FEES = Object.freeze({
    tiers: Object.freeze(tiers.map(tier => Object.freeze(tier))),
    serviceFee,
    purchaseForNet
  });
})(typeof window === "undefined" ? globalThis : window);
