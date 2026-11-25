/*
 * Which date a Record Expense payment counts on in the Rent and Vendor Ledgers.
 *
 * Building Rent and Vendor payments have a "Ledger Date" (periodDate) picked on
 * the expense page, so rent for October paid in November still counts in October.
 * The payment's own date stays the day it was paid (cash book and day closing
 * use that). Entries saved before the Ledger Date existed count on their date.
 */

/**
 * MongoDB condition matching payments whose ledger date is between two dates
 * (inclusive). A missing date leaves that side open; both missing → null.
 */
export const ledgerDateMatch = (fromDate, toDate) => {
  if (!fromDate && !toDate) return null;

  const range = {};
  if (fromDate) {
    const from = new Date(fromDate);
    from.setUTCHours(0, 0, 0, 0);
    range.$gte = from;
  }
  if (toDate) {
    const to = new Date(toDate);
    to.setUTCHours(23, 59, 59, 999);
    range.$lte = to;
  }

  // periodDate: null matches entries where it is missing or null
  return { $or: [{ periodDate: range }, { periodDate: null, date: range }] };
};

/** Ledger Date sent with a new payment → Date, or null if missing/invalid. */
export const parseLedgerDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value).split("T")[0]); // "YYYY-MM-DD" → UTC midnight
  return isNaN(d.getTime()) ? null : d;
};

/* ── Matching payments to a ledger ─────────────────────────────────────── */

// Saved from Record Expense → Indirect Expense (older entries only have the
// "[INDIRECT]" remark prefix)
export const INDIRECT_EXPENSE_MATCH = {
  $or: [{ expenseType: /^\s*indirect\s*$/i }, { remark: /^\s*\[INDIRECT/i }],
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Regex matching a name exactly, ignoring letter case and outer spaces. */
export const exactNameRegex = (name) =>
  new RegExp(`^\\s*${escapeRegex(String(name).trim())}\\s*$`, "i");

/** Key for grouping by name: trimmed, lower case. */
export const nameKey = (name) => String(name || "").trim().toLowerCase();

/** Total of expense payments (stored negative) as a positive amount, plus count. */
export const sumPaid = (txns) => {
  const total = txns.reduce(
    (sum, t) => sum - (Number(t.cash || 0) + Number(t.rbl || 0) + Number(t.bank || 0) + Number(t.upi || 0)),
    0
  );
  return { total: Math.round(total * 100) / 100, count: txns.length };
};
