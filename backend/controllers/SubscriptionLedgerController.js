import SubscriptionLedger from "../model/SubscriptionLedger.js";
import Transaction from "../model/Transaction.js";
import {
  ledgerDateMatch,
  INDIRECT_EXPENSE_MATCH,
  exactNameRegex,
  nameKey,
  sumPaid,
} from "../utils/ledgerPeriod.js";

// "IT related expenses" in Record Expense → Indirect Expense (older entries were
// saved as "IT and Internet Expenses" / "IT Expenses"; reports show all three as
// "IT related expenses"). Its sub categories are the subscriptions.
const SUBSCRIPTION_CATEGORY = /^\s*it( related| and internet)? expenses\s*$/i;

/**
 * IT related expenses payments for one subscription (sub category = subscription
 * name) whose Ledger Date is between two dates (the payment date for entries
 * saved without one). Returns { total, count } with total positive.
 */
const getSubscriptionPaid = async (subscriptionName, fromDate, toDate) => {
  if (!String(subscriptionName || "").trim()) return { total: 0, count: 0 };

  const dateMatch = ledgerDateMatch(fromDate, toDate);
  const query = {
    type: /^expense$/i,
    category: SUBSCRIPTION_CATEGORY,
    subCategory: exactNameRegex(subscriptionName),
    $and: [INDIRECT_EXPENSE_MATCH, ...(dateMatch ? [dateMatch] : [])],
  };

  const txns = await Transaction.find(query, { cash: 1, rbl: 1, bank: 1, upi: 1 }).lean();
  return sumPaid(txns);
};

// POST /api/subscription-ledgers  → add a new subscription ledger entry (debit
// only; credit comes from IT related expenses payments in Record Expense)
export const createSubscriptionLedger = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      date,
      subscriptionName,
      storeName = "",
      locCode = "",
      debit = 0,
      remarks = "",
      createdBy = "",
    } = req.body;

    if (!fromDate || !toDate || !String(subscriptionName || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "fromDate, toDate, and subscriptionName are required fields.",
      });
    }

    const debitNum = Number(debit) || 0;
    if (debitNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Debit must be greater than 0.",
      });
    }

    const newLedger = await SubscriptionLedger.create({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      date: date ? new Date(date) : new Date(fromDate),
      subscriptionName: String(subscriptionName).trim(),
      storeName,
      locCode: String(locCode),
      debit: debitNum,
      credit: 0,
      balance: debitNum,
      remarks,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Subscription Ledger created successfully",
      data: newLedger,
    });
  } catch (error) {
    console.error("Error creating Subscription Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating Subscription Ledger",
      error: error.message,
    });
  }
};

// GET /api/subscription-ledgers?DateFrom=&DateTo=  → list entries + totals
export const getSubscriptionLedgers = async (req, res) => {
  try {
    const { DateFrom, DateTo, subscriptionName, locCode } = req.query;
    const query = {};

    if (DateFrom && DateTo) {
      const from = new Date(DateFrom);
      from.setUTCHours(0, 0, 0, 0);
      const to = new Date(DateTo);
      to.setUTCHours(23, 59, 59, 999);

      // Match entries whose entry date or subscription period falls within the range
      query.$or = [
        { date: { $gte: from, $lte: to } },
        { fromDate: { $gte: from, $lte: to } },
        { toDate: { $gte: from, $lte: to } },
      ];
    } else if (DateFrom) {
      const from = new Date(DateFrom);
      from.setUTCHours(0, 0, 0, 0);
      query.date = { $gte: from };
    } else if (DateTo) {
      const to = new Date(DateTo);
      to.setUTCHours(23, 59, 59, 999);
      query.date = { $lte: to };
    }

    if (subscriptionName && subscriptionName !== "all") {
      query.subscriptionName = exactNameRegex(subscriptionName);
    }

    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    const rawLedgers = await SubscriptionLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

    // Credit = only the IT related expenses paid (Record Expense) for this
    // subscription in the selected period. If a subscription has more than one
    // entry in the period, the payments go on the first entry only, so they are
    // not counted twice.
    const countedPeriods = new Set();
    const ledgers = [];
    for (const item of rawLedgers) {
      const periodFrom = DateFrom || item.fromDate;
      const periodTo = DateTo || item.toDate;
      const key = `${nameKey(item.subscriptionName)}|${new Date(periodFrom).toISOString()}|${new Date(periodTo).toISOString()}`;

      let paid = { total: 0, count: 0 };
      if (!countedPeriods.has(key)) {
        countedPeriods.add(key);
        paid = await getSubscriptionPaid(item.subscriptionName, periodFrom, periodTo);
      }

      const debit = Number(item.debit) || 0;
      ledgers.push({
        ...item,
        credit: paid.total,
        paymentCount: paid.count,
        balance: debit - paid.total,
      });
    }

    const totals = ledgers.reduce(
      (acc, item) => {
        const d = Number(item.debit) || 0;
        const c = Number(item.credit) || 0;
        acc.totalDebit += d;
        acc.totalCredit += c;
        acc.totalBalance += d - c;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, totalBalance: 0 }
    );

    res.status(200).json({ success: true, data: ledgers, totals, count: ledgers.length });
  } catch (error) {
    console.error("Error fetching Subscription Ledgers:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching Subscription Ledgers",
      error: error.message,
    });
  }
};

// DELETE /api/subscription-ledgers/:id
export const deleteSubscriptionLedger = async (req, res) => {
  try {
    const deleted = await SubscriptionLedger.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Subscription Ledger record not found" });
    }
    res.status(200).json({ success: true, message: "Subscription Ledger record deleted successfully" });
  } catch (error) {
    console.error("Error deleting Subscription Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting Subscription Ledger",
      error: error.message,
    });
  }
};
