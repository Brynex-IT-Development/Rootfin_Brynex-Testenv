import VendorLedger from "../model/VendorLedger.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/vendor-ledgers  → add a new vendor ledger entry
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
      credit = 0,
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
    const creditNum = Number(credit) || 0;

    const newLedger = await VendorLedger.create({
      date: new Date(date),
      vendorId: String(vendorId),
      vendorName,
      storeName,
      locCode: String(locCode),
      reference,
      debit: debitNum,
      credit: creditNum,
      balance: debitNum - creditNum,
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
      query.vendorName = new RegExp(`^${escapeRegex(vendorName)}$`, "i");
    }

    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    const ledgers = await VendorLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

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
