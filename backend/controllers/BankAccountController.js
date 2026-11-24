import BankAccount from "../model/BankAccount.js";

// Initial default accounts to seed if collection is empty
const DEFAULT_ACCOUNTS = [
  "Hdfc SG **0420",
  "Hdfc ZR **9637",
  "Hdfc Statutory **9726",
  "Federal ED **8633",
  "Federal MG **9433",
  "Federal DS **8575",
  "Federal Rootments",
  "IDFC First Bank"
];

// GET /api/bank-accounts
export const getBankAccounts = async (_req, res) => {
  try {
    let accounts = await BankAccount.find({ isActive: true }).sort({ name: 1 });

    // Seed defaults if empty
    if (accounts.length === 0) {
      const seedData = DEFAULT_ACCOUNTS.map((name) => ({
        name,
        isActive: true,
        createdBy: "System",
      }));
      await BankAccount.insertMany(seedData, { ordered: false }).catch(() => {});
      accounts = await BankAccount.find({ isActive: true }).sort({ name: 1 });
    }

    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bank accounts" });
  }
};

// POST /api/bank-accounts
export const createBankAccount = async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Bank account name is required" });
    }

    const trimmed = name.trim();

    const existing = await BankAccount.findOne({
      name: { $regex: new RegExp(`^${trimmed}$`, "i") },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({ success: true, data: existing, message: "Bank account reactivated" });
      }
      return res.status(409).json({ success: false, message: "Bank account already exists" });
    }

    const newAccount = await BankAccount.create({
      name: trimmed,
      createdBy: createdBy || "Admin",
      isActive: true,
    });

    res.status(201).json({ success: true, data: newAccount });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create bank account" });
  }
};
