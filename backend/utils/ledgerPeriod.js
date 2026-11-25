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
