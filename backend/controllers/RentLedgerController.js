import mongoose from "mongoose";
import RentLedger from "../model/RentLedger.js";
import Transaction from "../model/Transaction.js";
import { ledgerDateMatch } from "../utils/ledgerPeriod.js";

// "Building Rent" in Record Expense is saved with category "Rent"
// (older entries too, some as "store rent"), so match those, any letter case.
const BUILDING_RENT_CATEGORY = /^(building\s+|store\s+)?rent$/i;

/**
 * Building Rent payments recorded as expenses whose Ledger Date is between two
 * dates (the payment date for entries saved without one).
 *  - With a tenantId: payments tagged with that tenant.
 *  - Without one (rent ledger entries made before tenants existed): untagged
 *    payments for that location, so tagged ones are never counted twice.
 * Returns { total, count } with total as a positive amount.
 */
const getBuildingRentPaid = async ({ tenantId, locCode }, fromDate, toDate) => {
  const query = {
    type: /^expense$/i,
    category: BUILDING_RENT_CATEGORY,
    ...ledgerDateMatch(fromDate, toDate),
  };

  if (tenantId) {
    query.tenantId = tenantId;
  } else {
    if (!locCode) return { total: 0, count: 0 };
    query.locCode = String(locCode);
    query.tenantId = null; // matches missing or null
  }

  const txns = await Transaction.find(query, { cash: 1, rbl: 1, bank: 1, upi: 1 }).lean();
  // Expenses are stored as negative amounts
  const total = txns.reduce(
    (sum, t) => sum - (Number(t.cash || 0) + Number(t.rbl || 0) + Number(t.bank || 0) + Number(t.upi || 0)),
    0
  );
  return { total: Math.round(total * 100) / 100, count: txns.length };
};

export const createRentLedger = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      date,
      tenantId,
      tenantName = "",
      dueDate,
      storeName,
      locCode,
      debit = 0,
      credit = 0,
      remarks = "",
      createdBy = "",
    } = req.body;

    if (!fromDate || !toDate || !storeName) {
      return res.status(400).json({
        success: false,
        message: "fromDate, toDate, and storeName are required fields.",
      });
    }

    // Payment Due Date is optional here (entries made before it existed have none)
    const dueDateValue = dueDate ? new Date(String(dueDate).split("T")[0]) : null;
    if (dueDateValue && isNaN(dueDateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Payment Due Date is not a valid date.",
      });
    }

    const debitNum = Number(debit) || 0;
    const creditNum = Number(credit) || 0;
    const balanceNum = debitNum - creditNum;

    // Use date if provided, otherwise default to fromDate
    const entryDate = date ? new Date(date) : new Date(fromDate);

    const newLedger = await RentLedger.create({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      date: entryDate,
      tenantId: mongoose.Types.ObjectId.isValid(tenantId) ? tenantId : null,
      tenantName: String(tenantName || "").trim(),
      dueDate: dueDateValue,
      storeName,
      locCode: locCode ? String(locCode) : "",
      debit: debitNum,
      credit: creditNum,
      balance: balanceNum,
      remarks,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Rent Ledger created successfully",
      data: newLedger,
    });
  } catch (error) {
    console.error("Error creating Rent Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating Rent Ledger",
      error: error.message,
    });
  }
};

export const getRentLedgers = async (req, res) => {
  try {
    const { DateFrom, DateTo, locCode, storeName } = req.query;

    const query = {};

    if (DateFrom && DateTo) {
      const from = new Date(DateFrom);
      from.setUTCHours(0, 0, 0, 0);

      const to = new Date(DateTo);
      to.setUTCHours(23, 59, 59, 999);

      // Match entries whose entry date or fromDate falls within the range
      query.$or = [
        { date: { $gte: from, $lte: to } },
        { fromDate: { $gte: from, $lte: to } },
        { toDate: { $gte: from, $lte: to } }
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

    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    if (storeName && storeName !== "all") {
      query.storeName = new RegExp(`^${storeName}$`, "i");
    }

    const rawLedgers = await RentLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

    // Credit = only the Building Rent paid (Record Expense) for this tenant
    // in the selected period. If a tenant has more than one rent entry in the
    // period, the payments go on the first entry only, so they are not counted twice.
    const countedPeriods = new Set();
    const ledgers = [];
    for (const item of rawLedgers) {
      const periodFrom = DateFrom || item.fromDate;
      const periodTo = DateTo || item.toDate;
      const tenantId = item.tenantId ? String(item.tenantId) : "";
      const owner = tenantId ? `tenant:${tenantId}` : `loc:${item.locCode}`;
      const key = `${owner}|${new Date(periodFrom).toISOString()}|${new Date(periodTo).toISOString()}`;

      let rentPaid = { total: 0, count: 0 };
      if (!countedPeriods.has(key)) {
        countedPeriods.add(key);
        rentPaid = await getBuildingRentPaid({ tenantId, locCode: item.locCode }, periodFrom, periodTo);
      }

      const credit = rentPaid.total;
      const debit = Number(item.debit) || 0;
      ledgers.push({
        ...item,
        credit,
        rentPaymentCount: rentPaid.count,
        balance: debit - credit,
      });
    }

    const totals = ledgers.reduce(
      (acc, item) => {
        const d = Number(item.debit) || 0;
        const c = Number(item.credit) || 0;
        acc.totalDebit += d;
        acc.totalCredit += c;
        acc.totalBalance += (d - c);
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, totalBalance: 0 }
    );

    res.status(200).json({
      success: true,
      data: ledgers,
      totals,
      count: ledgers.length,
    });
  } catch (error) {
    console.error("Error fetching Rent Ledgers:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching Rent Ledgers",
      error: error.message,
    });
  }
};

export const deleteRentLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RentLedger.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Rent Ledger record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Rent Ledger record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Rent Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting Rent Ledger",
      error: error.message,
    });
  }
};

