import mongoose from "mongoose";
import VendorLedger from "../model/VendorLedger.js";
import Vendor from "../model/Vendor.js";
import Transaction from "../model/Transaction.js";
import { ledgerDateMatch } from "../utils/ledgerPeriod.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactName = (name) => new RegExp(`^\\s*${escapeRegex(String(name).trim())}\\s*$`, "i");
const nameKey = (name) => String(name || "").trim().toLowerCase();

// The "Vendor" and "Vendors" categories in Record Expense → Indirect Expense
const VENDOR_CATEGORY = /^\s*vendors?\s*$/i;
const INDIRECT_EXPENSE = [{ expenseType: /^\s*indirect\s*$/i }, { remark: /^\s*\[INDIRECT/i }];

/**
 * Vendor payments recorded in Record Expense → Indirect Expense (category
 * "Vendor" or "Vendors") whose Ledger Date is between two dates (the payment
 * date for entries saved without one).
 *  - Payments tagged with the vendor's id.
 *  - Older payments saved before the vendor id was stored, matched by vendor name
 *    (Record Expense keeps it in subCategory). Only untagged ones, so a payment is
 *    never counted twice.
 * A missing date leaves that side open. Returns { total, count } with total positive.
 */
const getVendorPaid = async ({ vendorId, vendorName }, fromDate, toDate) => {
  const byName = vendorName
    ? { $or: [{ vendorName: exactName(vendorName) }, { subCategory: exactName(vendorName) }] }
    : null;

  const match = [];
  if (mongoose.isValidObjectId(vendorId)) {
    match.push({ vendorId });
    if (byName) match.push({ vendorId: null, ...byName });
  } else if (byName) {
    match.push(byName);
  }
  if (!match.length) return { total: 0, count: 0 };

  const dateMatch = ledgerDateMatch(fromDate, toDate);
  const query = {
    type: /^expense$/i,
    category: VENDOR_CATEGORY,
    $and: [{ $or: INDIRECT_EXPENSE }, { $or: match }, ...(dateMatch ? [dateMatch] : [])],
  };

  const txns = await Transaction.find(query, { cash: 1, rbl: 1, bank: 1, upi: 1 }).lean();
  // Expenses are stored as negative amounts
  const total = txns.reduce(
    (sum, t) => sum - (Number(t.cash || 0) + Number(t.rbl || 0) + Number(t.bank || 0) + Number(t.upi || 0)),
    0
  );
  return { total: Math.round(total * 100) / 100, count: txns.length };
};

// POST /api/vendor-ledgers  → add a new vendor ledger entry (debit only;
// credit comes from Vendor payments in Record Expense)
export const createVendorLedger = async (req, res) => {
  try {
    const {
      date,
      vendorId = "",
      vendorName,
      storeName = "",
      locCode = "",
      reference = "",
      debit = 0,
      remarks = "",
      createdBy = "",
    } = req.body;

    if (!date || !vendorName) {
      return res.status(400).json({
        success: false,
        message: "date and vendorName are required fields.",
      });
    }

    const debitNum = Number(debit) || 0;
    if (debitNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Debit must be greater than 0.",
      });
    }

    const newLedger = await VendorLedger.create({
      date: new Date(date),
      vendorId: mongoose.isValidObjectId(vendorId) ? String(vendorId) : "",
      vendorName: String(vendorName).trim(),
      storeName,
      locCode: String(locCode),
      reference,
      debit: debitNum,
      credit: 0,
      balance: debitNum,
      remarks,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Vendor Ledger created successfully",
      data: newLedger,
    });
  } catch (error) {
    console.error("Error creating Vendor Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating Vendor Ledger",
      error: error.message,
    });
  }
};

// GET /api/vendor-ledgers?DateFrom=&DateTo=&vendorName=  → list entries + totals
export const getVendorLedgers = async (req, res) => {
  try {
    const { DateFrom, DateTo, vendorName, locCode } = req.query;
    const query = {};

    if (DateFrom || DateTo) {
      query.date = {};
      if (DateFrom) {
        const from = new Date(DateFrom);
        from.setUTCHours(0, 0, 0, 0);
        query.date.$gte = from;
      }
      if (DateTo) {
        const to = new Date(DateTo);
        to.setUTCHours(23, 59, 59, 999);
        query.date.$lte = to;
      }
    }

    if (vendorName && vendorName !== "all") {
      query.vendorName = exactName(vendorName);
    }

    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    const rawLedgers = await VendorLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

    // Entries typed in before vendors were picked from the list may have no
    // vendorId: look it up by name so all of a vendor's entries are matched together.
    const untaggedNames = [
      ...new Set(
        rawLedgers
          .filter((l) => !mongoose.isValidObjectId(l.vendorId) && l.vendorName)
          .map((l) => nameKey(l.vendorName))
      ),
    ];
    const idByName = new Map();
    if (untaggedNames.length) {
      const found = await Vendor.find(
        { displayName: { $in: untaggedNames.map(exactName) } },
        { displayName: 1 }
      ).lean();
      found.forEach((v) => idByName.set(nameKey(v.displayName), String(v._id)));
    }

    const rows = rawLedgers.map((item) => {
      const vendorId = mongoose.isValidObjectId(item.vendorId)
        ? String(item.vendorId)
        : idByName.get(nameKey(item.vendorName)) || "";
      const owner = vendorId ? `id:${vendorId}` : `name:${nameKey(item.vendorName)}`;
      return { item, vendorId, owner };
    });

    // Credit = only the Vendor payments (Record Expense) for this vendor in the
    // selected period. If a vendor has more than one entry in the period, the
    // payments go on the first entry only, so they are not counted twice.
    const firstRowByOwner = new Map();
    rows.forEach((row) => {
      if (!firstRowByOwner.has(row.owner)) firstRowByOwner.set(row.owner, row);
    });
    const paidByOwner = new Map(
      await Promise.all(
        [...firstRowByOwner.entries()].map(async ([owner, row]) => [
          owner,
          await getVendorPaid({ vendorId: row.vendorId, vendorName: row.item.vendorName }, DateFrom, DateTo),
        ])
      )
    );

    const ledgers = rows.map((row) => {
      const paid = firstRowByOwner.get(row.owner) === row
        ? paidByOwner.get(row.owner)
        : { total: 0, count: 0 };
      const debit = Number(row.item.debit) || 0;
      return {
        ...row.item,
        credit: paid.total,
        paymentCount: paid.count,
        balance: debit - paid.total,
      };
    });

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
    console.error("Error fetching Vendor Ledgers:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching Vendor Ledgers",
      error: error.message,
    });
  }
};

// DELETE /api/vendor-ledgers/:id
export const deleteVendorLedger = async (req, res) => {
  try {
    const deleted = await VendorLedger.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Vendor Ledger record not found" });
    }
    res.status(200).json({ success: true, message: "Vendor Ledger record deleted successfully" });
  } catch (error) {
    console.error("Error deleting Vendor Ledger:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting Vendor Ledger",
      error: error.message,
    });
  }
};
