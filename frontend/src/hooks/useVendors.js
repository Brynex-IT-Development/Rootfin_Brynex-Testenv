import { useCallback, useEffect, useState } from "react";
import baseUrl from "../api/api.js";

// Name shown for a vendor, same order as the Purchase → Vendors page
export const vendorDisplayName = (v = {}) =>
  (v.displayName || v.companyName || `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.name || "").trim();

const normalize = (list) =>
  list
    .map((v) => ({
      id: String(v.id || v._id || ""),
      name: vendorDisplayName(v),
      companyName: (v.companyName || "").trim(),
    }))
    .filter((v) => v.id && v.name)
    .sort((a, b) => a.name.localeCompare(b.name));

// All vendors from Purchase → Vendors, for the vendor pickers in
// Vendor Ledger and Record Expense (both must list the same vendors).
const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/purchase/vendors`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVendors(normalize(Array.isArray(data) ? data : data?.data || []));
    } catch (err) {
      console.warn("Could not load vendors, using the saved list:", err);
      try {
        const saved = JSON.parse(localStorage.getItem("vendors") || "[]");
        if (Array.isArray(saved) && saved.length) setVendors(normalize(saved));
      } catch {
        // no saved list
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { vendors, loading, reload };
};

export default useVendors;
