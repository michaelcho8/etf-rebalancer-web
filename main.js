// ===== State =====
let currentPreset = "SCHD / VIG / JEPI";
let chartCurrent  = null;
let chartTarget   = null;

const CHART_COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#8B5CF6",
  "#EF4444", "#06B6D4", "#F97316", "#6366F1",
];

const YIELD_TABLE = {
  SCHD: 0.035, VIG: 0.018, JEPI: 0.080,
  VTI: 0.013, VXUS: 0.031, BND: 0.034,
  QQQ: 0.006, VYM: 0.031,
};

// Escape any user-provided string before inserting into HTML
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  renderPresetButtons();
  loadPreset(currentPreset);
  addHoldingsRow("SCHD", 60000);
  addHoldingsRow("VIG",  30000);
  addHoldingsRow("JEPI", 10000);
  updateWeights();

  document.getElementById("add-row-btn").addEventListener("click", () => addHoldingsRow("", 0));
  document.getElementById("calculate-btn").addEventListener("click", calculate);
  document.getElementById("email-form").addEventListener("submit", handleEmailSubmit);

  ["annual-expenses", "monthly-contribution", "annual-return"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      if (!document.getElementById("section-results").classList.contains("hidden")) renderFire();
    });
  });
});

// ===== Holdings table =====
function addHoldingsRow(symbol, value) {
  const tbody = document.getElementById("holdings-body");
  const row   = document.createElement("tr");

  // Build cells with DOM methods to avoid XSS — no innerHTML for user values
  const symInput = document.createElement("input");
  symInput.type        = "text";
  symInput.className   = "sym-input";
  symInput.placeholder = "e.g. SCHD";
  symInput.maxLength   = 6;
  symInput.value       = symbol || "";

  const valInput = document.createElement("input");
  valInput.type        = "number";
  valInput.className   = "val-input";
  valInput.placeholder = "0.00";
  valInput.min         = "0";
  valInput.step        = "100";
  if (value > 0) valInput.value = value;

  const weightCell = document.createElement("td");
  weightCell.className   = "weight-cell";
  weightCell.textContent = "—";

  const removeBtn = document.createElement("button");
  removeBtn.className   = "btn-remove";
  removeBtn.title       = "Remove row";
  removeBtn.textContent = "✕";

  const tdSym    = document.createElement("td");
  const tdVal    = document.createElement("td");
  const tdRemove = document.createElement("td");
  tdSym.appendChild(symInput);
  tdVal.appendChild(valInput);
  tdRemove.appendChild(removeBtn);

  row.append(tdSym, tdVal, weightCell, tdRemove);
  tbody.appendChild(row);

  symInput.addEventListener("input", updateWeights);
  valInput.addEventListener("input", updateWeights);
  removeBtn.addEventListener("click", () => { row.remove(); updateWeights(); });
}

function getHoldings() {
  return Array.from(document.querySelectorAll("#holdings-body tr")).map(row => ({
    symbol: row.querySelector(".sym-input").value.toUpperCase().trim(),
    value:  parseFloat(row.querySelector(".val-input").value) || 0,
  })).filter(h => h.symbol && h.value > 0);
}

function updateWeights() {
  const rows  = document.querySelectorAll("#holdings-body tr");
  const total = Array.from(rows).reduce((s, r) => s + (parseFloat(r.querySelector(".val-input").value) || 0), 0);
  rows.forEach(row => {
    const val  = parseFloat(row.querySelector(".val-input").value) || 0;
    const cell = row.querySelector(".weight-cell");
    cell.textContent = total > 0 ? (val / total * 100).toFixed(1) + "%" : "—";
  });
  document.getElementById("total-display").textContent = "Total: " + fmt(total);
}

// ===== Preset buttons =====
function renderPresetButtons() {
  const wrap = document.getElementById("preset-buttons");
  Object.keys(PRESETS).forEach(name => {
    const btn = document.createElement("button");
    btn.className   = "preset-btn" + (name === currentPreset ? " active" : "");
    btn.textContent = name;
    btn.addEventListener("click", () => {
      currentPreset = name;
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadPreset(name);
    });
    wrap.appendChild(btn);
  });
}

function loadPreset(name) {
  const alloc = PRESETS[name];
  const tbody = document.getElementById("allocation-body");
  tbody.innerHTML = "";
  Object.entries(alloc).forEach(([sym, w]) => {
    const row    = document.createElement("tr");
    const tdSym  = document.createElement("td");
    const tdVal  = document.createElement("td");
    const strong = document.createElement("strong");
    const input  = document.createElement("input");

    strong.textContent = sym;   // safe — comes from PRESETS constant
    input.type         = "number";
    input.className    = "alloc-input";
    input.value        = (w * 100).toFixed(0);
    input.min          = "0";
    input.max          = "100";
    input.step         = "1";
    input.dataset.symbol = sym;
    input.addEventListener("input", validateAllocation);

    tdSym.appendChild(strong);
    tdVal.appendChild(input);
    row.append(tdSym, tdVal);
    tbody.appendChild(row);
  });
}

function getAllocation() {
  let sum = 0;
  const result = {};
  document.querySelectorAll(".alloc-input").forEach(input => {
    const val = parseFloat(input.value) || 0;
    result[input.dataset.symbol] = val / 100;
    sum += val;
  });
  return { allocation: result, sum };
}

function validateAllocation() {
  const { sum } = getAllocation();
  const err = document.getElementById("allocation-error");
  if (Math.abs(sum - 100) > 0.5) {
    err.classList.remove("hidden");
    err.textContent = `Percentages sum to ${sum.toFixed(1)}% — must be 100%.`;
  } else {
    err.classList.add("hidden");
  }
}

// ===== Calculate =====
function calculate() {
  const holdings = getHoldings();
  const { allocation, sum } = getAllocation();

  if (holdings.length === 0) { alert("Add at least one holding with a value greater than $0."); return; }
  if (Math.abs(sum - 100) > 0.5) { alert("Target allocation must sum to 100%."); return; }

  const orders = rebalanceOrders(holdings, allocation);
  const total  = totalValue(holdings);

  document.getElementById("section-results").classList.remove("hidden");
  document.getElementById("section-results").scrollIntoView({ behavior: "smooth", block: "start" });

  renderCharts(holdings, allocation, total);
  renderOrders(orders);
  renderFire();
}

// ===== Charts =====
function renderCharts(holdings, allocation, total) {
  const holdingMap = {};
  holdings.forEach(h => { holdingMap[h.symbol] = (holdingMap[h.symbol] || 0) + h.value; });

  const allSymbols = Array.from(new Set([...Object.keys(holdingMap), ...Object.keys(allocation)]));
  const colors     = allSymbols.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  const currentData = allSymbols.map(s => parseFloat(((holdingMap[s] || 0) / total * 100).toFixed(1)));
  const targetData  = allSymbols.map(s => parseFloat(((allocation[s] || 0) * 100).toFixed(1)));

  if (chartCurrent) chartCurrent.destroy();
  if (chartTarget)  chartTarget.destroy();

  const makeOpts = (data) => ({
    type: "doughnut",
    data: {
      labels: allSymbols,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }],
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
      },
    },
  });

  chartCurrent = new Chart(document.getElementById("chart-current"), makeOpts(currentData));
  chartTarget  = new Chart(document.getElementById("chart-target"),  makeOpts(targetData));
}

// ===== Orders table — build with DOM methods =====
function renderOrders(orders) {
  const tbody = document.getElementById("orders-body");
  tbody.innerHTML = "";

  const afterHoldings = orders.map(o => ({ symbol: o.symbol, value: o.target }));
  const annIncome     = estimatedAnnualIncome(afterHoldings, YIELD_TABLE);

  orders.forEach(o => {
    const tr     = document.createElement("tr");
    const badge  = document.createElement("span");
    badge.className   = "badge " + (o.action === "BUY" ? "badge-buy" : o.action === "SELL" ? "badge-sell" : "badge-hold");
    badge.textContent = o.action;

    const symStrong = document.createElement("strong");
    symStrong.textContent = o.symbol;   // escaped via textContent

    const currentSmall = document.createElement("small");
    currentSmall.style.color   = "#94A3B8";
    currentSmall.textContent   = " " + fmt(o.current);

    const targetSmall = document.createElement("small");
    targetSmall.style.color   = "#94A3B8";
    targetSmall.textContent   = " " + fmt(o.target);

    const tdSym    = document.createElement("td"); tdSym.appendChild(symStrong);
    const tdCur    = document.createElement("td"); tdCur.textContent = pct(o.currentPct); tdCur.appendChild(currentSmall);
    const tdTgt    = document.createElement("td"); tdTgt.textContent = pct(o.targetPct);  tdTgt.appendChild(targetSmall);
    const tdAction = document.createElement("td"); tdAction.appendChild(badge);
    const tdAmt    = document.createElement("td"); tdAmt.textContent = o.action === "HOLD" ? "—" : fmt(o.amount);

    tr.append(tdSym, tdCur, tdTgt, tdAction, tdAmt);
    tbody.appendChild(tr);
  });

  // Summary row
  const summaryRow  = document.createElement("tr");
  summaryRow.style.fontWeight = "600";
  const tdLabel = document.createElement("td");
  tdLabel.colSpan   = 4;
  tdLabel.style.cssText = "text-align:right;color:#64748B;font-size:0.85rem;padding-top:12px";
  tdLabel.textContent   = "Est. annual dividend income after rebalance:";
  const tdIncome = document.createElement("td");
  tdIncome.style.cssText   = "padding-top:12px;color:#10B981";
  tdIncome.textContent     = fmt(annIncome) + "/yr";
  summaryRow.append(tdLabel, tdIncome);
  tbody.appendChild(summaryRow);
}

// ===== FIRE section =====
function renderFire() {
  const holdings   = getHoldings();
  const total      = totalValue(holdings);
  const expenses   = parseFloat(document.getElementById("annual-expenses").value) || 40000;
  const monthly    = parseFloat(document.getElementById("monthly-contribution").value) || 500;
  const returnRate = (parseFloat(document.getElementById("annual-return").value) || 7) / 100;

  const target   = fireNumber(expenses);
  const progress = fireProgress(total, expenses);
  const yrs      = yearsToFire(total, monthly, returnRate, expenses);
  const income   = estimatedAnnualIncome(holdings, YIELD_TABLE);

  const barW   = (progress * 100).toFixed(1);
  const yrsStr = yrs === 0 ? "FIRE Reached!" : yrs !== null ? `${yrs} years` : "50+ years";

  const wrap = document.getElementById("fire-results");
  wrap.innerHTML = "";

  const stats = [
    ["Current portfolio value",    fmt(total)],
    [`FIRE number (${fmt(expenses)}/yr × 25)`, fmt(target)],
  ];

  stats.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "fire-stat";
    const lbl = document.createElement("span"); lbl.className = "label"; lbl.textContent = label;
    const val = document.createElement("span"); val.className = "value"; val.textContent = value;
    row.append(lbl, val);
    wrap.appendChild(row);
  });

  // Progress bar
  const progRow = document.createElement("div"); progRow.className = "fire-stat";
  const progLabel = document.createElement("span"); progLabel.className = "label"; progLabel.textContent = "Progress";
  const progVal   = document.createElement("span"); progVal.className   = "value"; progVal.textContent   = barW + "%";
  progRow.append(progLabel, progVal);
  wrap.appendChild(progRow);

  const barWrap = document.createElement("div"); barWrap.className = "progress-bar-wrap";
  const barFill = document.createElement("div"); barFill.className = "progress-bar-fill"; barFill.style.width = barW + "%";
  barWrap.appendChild(barFill);
  wrap.appendChild(barWrap);

  const progPct = document.createElement("p"); progPct.className = "progress-pct";
  progPct.textContent = fmt(total) + " of " + fmt(target);
  wrap.appendChild(progPct);

  const moreStats = [
    [`Years to FIRE (at ${fmt(monthly)}/mo + ${(returnRate * 100).toFixed(1)}% return)`, yrsStr],
    ["Est. annual dividend income",  fmt(income) + "/yr"],
    ["Est. monthly dividend income", fmt(income / 12) + "/mo"],
  ];

  moreStats.forEach(([label, value], i) => {
    const row = document.createElement("div"); row.className = "fire-stat";
    if (i === 0) row.style.marginTop = "8px";
    const lbl = document.createElement("span"); lbl.className = "label"; lbl.textContent = label;
    const val = document.createElement("span"); val.className = "value";
    val.textContent = value;
    if (i >= 1) val.style.color = "#10B981";
    row.append(lbl, val);
    wrap.appendChild(row);
  });
}

// ===== Email form =====
function handleEmailSubmit(e) {
  e.preventDefault();
  document.getElementById("email-note").textContent = "You're on the list! First digest coming soon.";
  document.getElementById("email-input").value = "";
}

// ===== Helpers =====
function fmt(n) { return "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function pct(n) { return ((n || 0) * 100).toFixed(1) + "%"; }
