import Transaction from "../model/Transaction.js";

/*
 * Location expenses — same rules as the Income & Expenses report
 * (frontend/src/pages/IncomeExpenseReport.jsx), so ledger credits match the report.
 *
 * Counts:
 *   - MongoDB transactions classified as expenses (expense type, direct/indirect,
 *     expense categories, returns / sales returns)
 *   - Security refunds (MongoDB + TWS GetReturnList)
 *   - Booking cancellations (TWS GetDeleteList)
 * Does NOT count Cash-to-Bank / Bank-to-Cash transfers (they move money, not spend it).
 */

const TWS_BASE = "https://rentalapi.rootments.live/api/GetBooking";

// Department codes have no TWS rental data
const DEPT_LOC_CODES = new Set(["759", "102", "101", "858", "103"]);

// Keep in sync with IncomeExpenseReport.jsx
const EXPENSE_CATEGORIES = new Set([
  "petty expenses","staff reimbursement","maintenance expenses","telephone internet",
  "utility bill","salary","rent","courier charges","asset purchase","promotion_services",
  "spot incentive","other expenses","shoe sales return",
  "shirt sales return","dry cleaning","altration","material","travel exp","fuel exp",
  "waste management","water charges","printing stationary","staff welfare",
  "staff accommodation","incentive","write off",
  "office supplies","bank fees and charges","travel expense","directors travelling expense",
  "employee travel expenses","cluster travelling expense","telephone expense","automobile expense",
  "it and internet expenses","rent expense","janitorial expense","postage","bad debt",
  "salaries and employee wages","meals and entertainment","depreciation expense","consultant expense",
  "repairs and maintenance","repairs & maintenance","other expenses","lodging","transportation expense",
  "depreciation and amortisation","epf contribution-employer","esi contribution-employer",
  "interest and fine","fines and penalties","rates & taxes","interest on tds",
  "fine's and penalty-electricity","interest & late fee","telephone & internet expense",
  "office expenses [parent]","printing and stationery","printing & stationary","internet expenses",
  "internet expense","office expenses","office expense","printer consumables","fuel expenses",
  "legal charges","charity","cleaning expenses","labour charges office","parking charge",
  "subscription charges","marketing & promotion","advertising and marketing","salary and wages",
  "salary/salary advance","salary advance","employee wages","overtime payment","consultation charges","accounting charges",
  "bank charges","finance charges","paytm deductions","car loan interest","emi","utility charges",
  "electricity charges","staff welfare expenses","staff food and accomodation","gift expenses",
  "rent expenses - warehouse","generator expenses","meeting expenses","vehicle insurance",
  "printer service","domain purchase","filing fees","selling expenses","discount allowed",
  "equipment rent","mca charges","gst late fees and interest","rental supplies expense",
  "training & development expenses","interior designing","audit fee","lease registration charges",
  "payment gateway charges","house rent allowance","utility connection / government fees",
  "tds late fee","trademark expense","cost of goods sold","labor","materials","subcontractor",
  "job costing","transportation expenses","freight expenses","dry cleaning expenses",
  "uniform stitching","alteration expense","raw materials / dress accessories","raw materials and consumables",
  "raw materials","raw material","raw materials & consumables","raw materials/dress accessories",
  "freight charges","product expenses","labour charges - warehouse","uniform expense","food expense",
  "refund"
]);

const toYmd = (d) => new Date(d).toISOString().split("T")[0];

const fetchTwsRows = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.warn(`TWS fetch failed (${res.status}): ${url}`);
      return [];
    }
    const json = await res.json();
    return json?.dataSet?.data || [];
  } catch (err) {
    console.warn("TWS fetch error:", url, err.message);
    return [];
  }
};

// Amount of a TWS refund row (refunds are money going out)
const twsRefundAmount = (item, prefix) => {
  const rbl = Math.abs(Number(item.rblRazorPay || 0));
  const cash = Math.abs(Number(item[`${prefix}CashAmount`] || 0));
  const bank = rbl !== 0 ? 0 : Math.abs(Number(item[`${prefix}BankAmount`] || 0));
  const upi = rbl !== 0 ? 0 : Math.abs(Number(item[`${prefix}UPIAmount`] || 0));
  return cash + rbl + bank + upi;
};

// Classify one MongoDB transaction the same way the report does.
// Returns "expense", "security" or null (not an expense).
const classifyTransaction = (t) => {
  const tp = (t.type || "").toLowerCase();
  const sub = (t.subCategory || "").toLowerCase().trim();
  const cat = (t.category || "").toLowerCase().trim();
  const inv = (t.invoiceNo || "").toUpperCase();
  const rmk = (t.remark || t.remarks || "").toUpperCase();
  const expType = (t.expenseType || "").toLowerCase().trim();

  const isShoeOrShirtSale = ["shoe sales", "shirt sales", "mixed sales"].some((s) => sub === s || cat === s);
  const isSalesReturn = ["shoe sales return", "shirt sales return", "mixed sales return"].some((s) => sub === s || cat === s);
  const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");
  const isDirectOrIndirect =
    expType === "direct" || expType === "indirect" ||
    rmk.includes("[DIRECT") || rmk.includes("[INDIRECT") ||
    tp === "direct" || tp === "indirect" || tp === "direct expense" || tp === "indirect expense";

  const isBankToCash =
    cat === "bank to cash" || sub === "bank to cash" ||
    cat.includes("bank to cash") || sub.includes("bank to cash") ||
    cat.includes("cash to branch") || sub.includes("cash to branch");
  const isCashToBank =
    !isBankToCash &&
    (cat === "bulk amount transfer" || cat === "cash to bank" ||
      sub === "bulk amount transfer" || sub === "cash to bank" || tp === "money transfer");

  const isExpenseCategory = tp === "expense" || isDirectOrIndirect || EXPENSE_CATEGORIES.has(cat);
  const isActualExpense = isExpenseCategory || isReturnInvoice;

  if (!isActualExpense && !isShoeOrShirtSale && !isSalesReturn && !isReturnInvoice &&
      (inv.startsWith("INV-") || inv.startsWith("RTN-") || inv.startsWith("RET-"))) return null;

  if (isBankToCash || isCashToBank) return null;
  if (cat.includes("security refund") || sub.includes("security refund") ||
      (tp === "return" && !isSalesReturn && !isReturnInvoice)) return "security";
  if (isReturnInvoice || tp === "return" || isSalesReturn) return "expense";
  if (tp === "income") return null;
  if (isExpenseCategory) return "expense";
  return null;
};

/**
 * Total expenses for one location between two dates (inclusive).
 * Returns { total, breakdown: { [category]: amount } } — amounts are positive.
 */
export const getLocationExpenses = async (locCode, fromDate, toDate) => {
  const empty = { total: 0, breakdown: {} };
  if (!locCode || !fromDate || !toDate) return empty;

  const code = String(locCode);
  const from = new Date(fromDate);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setUTCHours(23, 59, 59, 999);

  const locNum = Number(code);
  const locMatch = !isNaN(locNum) ? { $in: [code, locNum] } : code;

  const isStore = !DEPT_LOC_CODES.has(code);
  const df = toYmd(from);
  const dt = toYmd(to);

  const [txns, cancelRows, returnRows] = await Promise.all([
    Transaction.find(
      { locCode: locMatch, date: { $gte: from, $lte: to } },
      { type: 1, category: 1, subCategory: 1, invoiceNo: 1, remark: 1, expenseType: 1, cash: 1, rbl: 1, bank: 1, upi: 1 }
    ).lean(),
    isStore ? fetchTwsRows(`${TWS_BASE}/GetDeleteList?LocCode=${code}&DateFrom=${df}&DateTo=${dt}`) : [],
    isStore ? fetchTwsRows(`${TWS_BASE}/GetReturnList?LocCode=${code}&DateFrom=${df}&DateTo=${dt}`) : [],
  ]);

  const breakdown = {};
  let signedTotal = 0; // expenses are negative; refunds/reversals can be positive
  const add = (label, signedAmount) => {
    if (!signedAmount) return;
    breakdown[label] = (breakdown[label] || 0) + signedAmount;
    signedTotal += signedAmount;
  };

  for (const t of txns) {
    const kind = classifyTransaction(t);
    if (!kind) continue;
    const value = Number(t.cash || 0) + Number(t.rbl || t.rblRazorPay || 0) + Number(t.bank || 0) + Number(t.upi || 0);
    add(kind === "security" ? "Security Refund" : (t.category || "Other"), value);
  }
  for (const item of cancelRows) add("Cancel", -twsRefundAmount(item, "delete"));
  for (const item of returnRows) add("Security Refund", -twsRefundAmount(item, "return"));

  // Show as positive amounts
  const positiveBreakdown = Object.fromEntries(
    Object.entries(breakdown).map(([k, v]) => [k, Math.round(-v * 100) / 100])
  );
  return { total: Math.round(-signedTotal * 100) / 100, breakdown: positiveBreakdown };
};
