import Tenant from "../model/Tenant.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createTenant = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const storeName = String(req.body.storeName || "").trim();
    const locCode = req.body.locCode ? String(req.body.locCode).trim() : "";
    const createdBy = req.body.createdBy || "";

    if (!name || !storeName) {
      return res.status(400).json({
        success: false,
        message: "Tenant name and location are required.",
      });
    }

    const existing = await Tenant.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      locCode,
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Tenant "${existing.name}" already exists for ${existing.storeName}.`,
        data: existing,
      });
    }

    const tenant = await Tenant.create({ name, storeName, locCode, createdBy });

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Error creating Tenant:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating Tenant",
      error: error.message,
    });
  }
};

export const getTenants = async (req, res) => {
  try {
    const { locCode } = req.query;
    const query = { isActive: true };
    if (locCode && locCode !== "all") {
      query.locCode = String(locCode);
    }

    const tenants = await Tenant.find(query).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  } catch (error) {
    console.error("Error fetching Tenants:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching Tenants",
      error: error.message,
    });
  }
};
