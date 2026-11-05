import RentLedger from "../model/RentLedger.js";

export const createRentLedger = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      date,
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

    const debitNum = Number(debit) || 0;
    const creditNum = Number(credit) || 0;
    const balanceNum = debitNum - creditNum;

    // Use date if provided, otherwise default to fromDate
    const entryDate = date ? new Date(date) : new Date(fromDate);

    const newLedger = await RentLedger.create({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      date: entryDate,
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

    const ledgers = await RentLedger.find(query).sort({ date: 1, createdAt: 1 }).lean();

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

