import SubscriptionLedger from "../model/SubscriptionLedger.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/subscription-ledgers  → add a new subscription ledger entry
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
      credit = 0,
      remarks = "",
      createdBy = "",
    } = req.body;

    if (!fromDate || !toDate || !subscriptionName) {
      return res.status(400).json({
        success: false,
        message: "fromDate, toDate, and subscriptionName are required fields.",
      });
    }

    const debitNum = Number(debit) || 0;
    const creditNum = Number(credit) || 0;

    const newLedger = await SubscriptionLedger.create({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      date: date ? new Date(date) : new Date(fromDate),
      subscriptionName,
      storeName,
      locCode: String(locCode),
      debit: debitNum,
      credit: creditNum,
      balance: debitNum - creditNum,
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
      query.subscriptionName = new RegExp(`^${escapeRegex(subscriptionName)}$`, "i");
    }

    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    const ledgers = await SubscriptionLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

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
