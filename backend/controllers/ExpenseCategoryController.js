import ExpenseCategory from "../model/ExpenseCategory.js";
import ExpenseSubCategory from "../model/ExpenseSubCategory.js";

// GET /api/expense-categories?expenseType=direct | indirect
export const getExpenseCategories = async (req, res) => {
  try {
    const { expenseType } = req.query;
    const filter = { isActive: true };
    if (expenseType) {
      filter.expenseType = expenseType.toLowerCase();
    }
    const categories = await ExpenseCategory.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// POST /api/expense-categories
export const createExpenseCategory = async (req, res) => {
  try {
    const { name, expenseType, createdBy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    if (!expenseType || !["direct", "indirect"].includes(expenseType.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Valid expenseType (direct or indirect) is required" });
    }

    const trimmedName = name.trim();
    const type = expenseType.toLowerCase();

    // Check case-insensitive duplicate
    const existing = await ExpenseCategory.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      expenseType: type,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({ success: true, data: existing, message: "Category reactivated" });
      }
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const newCategory = await ExpenseCategory.create({
      name: trimmedName,
      expenseType: type,
      createdBy: createdBy || "Admin",
      isActive: true,
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error("Error creating expense category:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create category" });
  }
};

// GET /api/expense-subcategories?category=...&expenseType=...
export const getExpenseSubCategories = async (req, res) => {
  try {
    const { category, expenseType } = req.query;
    const filter = { isActive: true };
    if (expenseType) {
      filter.expenseType = expenseType.toLowerCase();
    }
    if (category) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }
    const subCategories = await ExpenseSubCategory.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: subCategories });
  } catch (error) {
    console.error("Error fetching expense subcategories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subcategories" });
  }
};

// POST /api/expense-subcategories (Supports single string or array of names)
export const createExpenseSubCategory = async (req, res) => {
  try {
    const { name, names, category, expenseType, createdBy } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Parent category is required" });
    }
    if (!expenseType || !["direct", "indirect"].includes(expenseType.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Valid expenseType (direct or indirect) is required" });
    }

    const trimmedCat = category.trim();
    const type = expenseType.toLowerCase();
    const creator = createdBy || "Admin";

    // Build list of names to add
    const rawNames = Array.isArray(names) ? names : [name];
    const cleanNames = rawNames
      .map((n) => (n || "").trim())
      .filter((n) => n.length > 0);

    if (cleanNames.length === 0) {
      return res.status(400).json({ success: false, message: "At least one subcategory name is required" });
    }

    const createdItems = [];
    for (const subName of cleanNames) {
      const existing = await ExpenseSubCategory.findOne({
        name: { $regex: new RegExp(`^${subName}$`, "i") },
        category: { $regex: new RegExp(`^${trimmedCat}$`, "i") },
        expenseType: type,
      });

      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          await existing.save();
          createdItems.push(existing);
        }
      } else {
        const newSub = await ExpenseSubCategory.create({
          name: subName,
          category: trimmedCat,
          expenseType: type,
          createdBy: creator,
          isActive: true,
        });
        createdItems.push(newSub);
      }
    }

    res.status(201).json({ success: true, data: createdItems });
  } catch (error) {
    console.error("Error creating expense subcategories:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create subcategories" });
  }
};
