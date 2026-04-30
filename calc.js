// Pure math — no DOM, fully testable with Node.js

const PRESETS = {
  "SCHD / VIG / JEPI": { SCHD: 0.60, VIG: 0.30, JEPI: 0.10 },
  "Three-Fund (VTI/VXUS/BND)": { VTI: 0.60, VXUS: 0.25, BND: 0.15 },
  "Income (SCHD/JEPI/VYM)": { SCHD: 0.50, JEPI: 0.30, VYM: 0.20 },
  "Growth (VTI/QQQ)": { VTI: 0.70, QQQ: 0.30 },
};

function totalValue(holdings) {
  return holdings.reduce((sum, h) => sum + (parseFloat(h.value) || 0), 0);
}

// holdings: [{symbol, value}]
// allocation: {SYMBOL: weight, ...}  weights must sum to 1
// returns: [{symbol, current, target, currentPct, targetPct, action, amount}]
function rebalanceOrders(holdings, allocation) {
  const total = totalValue(holdings);
  if (total <= 0) return [];

  const map = {};
  holdings.forEach(h => {
    const sym = h.symbol.toUpperCase().trim();
    if (sym) map[sym] = (map[sym] || 0) + (parseFloat(h.value) || 0);
  });

  return Object.entries(allocation).map(([symbol, weight]) => {
    const current = map[symbol] || 0;
    const target  = weight * total;
    const diff    = target - current;
    return {
      symbol,
      current,
      target,
      currentPct: current / total,
      targetPct:  weight,
      diff,
      action:  Math.abs(diff) < 0.5 ? "HOLD" : diff > 0 ? "BUY" : "SELL",
      amount:  Math.abs(diff),
    };
  });
}

// annualExpenses × 25 = FIRE number (4% rule)
function fireNumber(annualExpenses) {
  return annualExpenses * 25;
}

function fireProgress(portfolioValue, annualExpenses) {
  const target = fireNumber(annualExpenses);
  return target > 0 ? Math.min(portfolioValue / target, 1) : 0;
}

// Returns years as a float, or null if not reached within 50 years
function yearsToFire(currentValue, monthlyContribution, annualReturn, annualExpenses) {
  const target = fireNumber(annualExpenses);
  if (currentValue >= target) return 0;
  const r = annualReturn / 12;
  for (let months = 1; months <= 600; months++) {
    const fv = currentValue * Math.pow(1 + r, months)
             + monthlyContribution * (Math.pow(1 + r, months) - 1) / r;
    if (fv >= target) return parseFloat((months / 12).toFixed(1));
  }
  return null;
}

// Annual dividend income estimate given holdings and yield table
// yieldTable: {SYMBOL: 0.035, ...}
function estimatedAnnualIncome(holdings, yieldTable) {
  const map = {};
  holdings.forEach(h => {
    const sym = h.symbol.toUpperCase().trim();
    if (sym) map[sym] = (map[sym] || 0) + (parseFloat(h.value) || 0);
  });
  return Object.entries(map).reduce((sum, [sym, val]) => {
    return sum + val * (yieldTable[sym] || 0);
  }, 0);
}

if (typeof module !== "undefined") {
  module.exports = { PRESETS, totalValue, rebalanceOrders, fireNumber, fireProgress, yearsToFire, estimatedAnnualIncome };
}
