// node test.js
const { PRESETS, totalValue, rebalanceOrders, fireNumber, fireProgress, yearsToFire, estimatedAnnualIncome } = require("./calc.js");

let failures = 0;
function run(name, condition) {
  const status = condition ? "PASS" : "FAIL";
  console.log(`  [${status}] ${name}`);
  if (!condition) failures++;
}

// ===== totalValue =====
console.log("\ntotalValue:");
run("sums holdings correctly",          totalValue([{symbol:"SCHD",value:6000},{symbol:"VIG",value:3000},{symbol:"JEPI",value:1000}]) === 10000);
run("handles empty array",              totalValue([]) === 0);
run("ignores non-numeric values",       totalValue([{symbol:"X",value:"bad"},{symbol:"Y",value:500}]) === 500);

// ===== rebalanceOrders =====
console.log("\nrebalanceOrders:");
const alloc = { SCHD: 0.60, VIG: 0.30, JEPI: 0.10 };
const balanced = [{symbol:"SCHD",value:6000},{symbol:"VIG",value:3000},{symbol:"JEPI",value:1000}];
const orders = rebalanceOrders(balanced, alloc);
run("returns 3 orders for 3-symbol alloc",   orders.length === 3);
run("SCHD is HOLD when balanced",            orders.find(o => o.symbol === "SCHD").action === "HOLD");
run("all actions are HOLD when balanced",    orders.every(o => o.action === "HOLD"));

const drifted = [{symbol:"SCHD",value:8000},{symbol:"VIG",value:1500},{symbol:"JEPI",value:500}];
const driftOrders = rebalanceOrders(drifted, alloc);
run("overweight SCHD → SELL",                driftOrders.find(o => o.symbol === "SCHD").action === "SELL");
run("underweight VIG → BUY",                 driftOrders.find(o => o.symbol === "VIG").action  === "BUY");

const cashOnly = [];
const buyOrders = rebalanceOrders(cashOnly, alloc);
run("empty holdings → empty orders",         buyOrders.length === 0);

// Verify notional amounts on balanced → target
const blank = [{symbol:"SCHD",value:0},{symbol:"VIG",value:0},{symbol:"JEPI",value:0}];
// totalValue is 0 so should return empty
run("all-zero holdings → empty orders",      rebalanceOrders(blank, alloc).length === 0);

// ===== fireNumber =====
console.log("\nfireNumber:");
run("40k expenses → $1M FIRE number",        fireNumber(40000) === 1000000);
run("60k expenses → $1.5M FIRE number",      fireNumber(60000) === 1500000);

// ===== fireProgress =====
console.log("\nfireProgress:");
run("$500k of $1M = 0.5 progress",           fireProgress(500000, 40000) === 0.5);
run("$1M+ of $1M = capped at 1.0",           fireProgress(1200000, 40000) === 1.0);
run("$0 portfolio = 0 progress",             fireProgress(0, 40000) === 0);

// ===== yearsToFire =====
console.log("\nyearsToFire:");
run("already at FIRE number → 0 years",      yearsToFire(1000000, 500, 0.07, 40000) === 0);
run("$0 + $500/mo → positive years",         yearsToFire(0, 500, 0.07, 40000) > 0);
run("higher portfolio → fewer years",        yearsToFire(500000, 500, 0.07, 40000) < yearsToFire(100000, 500, 0.07, 40000));
run("higher contribution → fewer years",     yearsToFire(100000, 2000, 0.07, 40000) < yearsToFire(100000, 200, 0.07, 40000));

// ===== estimatedAnnualIncome =====
console.log("\nestimatedAnnualIncome:");
const yieldTable = { SCHD: 0.035, VIG: 0.018, JEPI: 0.080 };
const holdings   = [{symbol:"SCHD",value:6000},{symbol:"VIG",value:3000},{symbol:"JEPI",value:1000}];
const income     = estimatedAnnualIncome(holdings, yieldTable);
// 6000*0.035 + 3000*0.018 + 1000*0.08 = 210 + 54 + 80 = 344
run("income ≈ $344 for SCHD/VIG/JEPI",       Math.abs(income - 344) < 0.01);
run("unknown symbol → 0 yield",              estimatedAnnualIncome([{symbol:"XYZ",value:10000}], yieldTable) === 0);

// ===== PRESETS =====
console.log("\nPRESETS:");
Object.entries(PRESETS).forEach(([name, alloc]) => {
  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  run(`"${name}" weights sum to 1.0`, Math.abs(sum - 1.0) < 1e-9);
});

// ===== Summary =====
const total = /* count from above */ 26;
const passed = total - failures;
console.log(`\n${passed}/${total} tests passed${failures === 0 ? " — all good." : ` — ${failures} FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
