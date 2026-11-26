import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, Building2, Info } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";
import useVendors from "../hooks/useVendors.js";
import LedgerPicker from "../components/LedgerPicker.jsx";

// Note: index.css has an unlayered global rule that forces every non-submit
// <button> to display:inline-block, inherit font-size and use a transparent
// border. The "!" suffix on a few utilities below (flex!, text-sm!,
// border-gray-200!) wins over that rule.

// Vendor ledgers are only kept for these three locations
const VENDOR_LOCATIONS = [
  { locName: "Warehouse", locCode: "103" },
  { locName: "Production", locCode: "101" },
  { locName: "Office", locCode: "102" },
];

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 shadow-2xs";

const AddVendorLedger = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();
  const { vendors, loading: vendorsLoading, reload: reloadVendors } = useVendors();
  // Company shown under the name when it differs
  const vendorItems = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    detail: v.companyName && v.companyName.toLowerCase() !== v.name.toLowerCase() ? v.companyName : "",
  }));

  // Use local date parts (toISOString shifts dates back a day in IST)
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(formatDateStr(new Date()));
  const [vendorId, setVendorId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [reference, setReference] = useState("");
  const [debit, setDebit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // A vendor added in another tab shows up when you come back to this one
  useEffect(() => {
    window.addEventListener("focus", reloadVendors);
    return () => window.removeEventListener("focus", reloadVendors);
  }, [reloadVendors]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!date) {
      setStatusMessage({ type: "error", text: "Please select a Date." });
      return;
    }
    const selectedVendor = vendors.find((v) => v.id === vendorId);
    if (!selectedVendor) {
      setStatusMessage({ type: "error", text: "Please select a Vendor." });
      return;
    }
    const debitNum = parseFloat(debit) || 0;
    if (debitNum <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Debit amount." });
      return;
    }
    if (!dueDate) {
      setStatusMessage({ type: "error", text: "Please select a Payment Due Date." });
      return;
    }

    const selectedLoc = VENDOR_LOCATIONS.find((l) => l.locName === storeName);
    const user = JSON.parse(localStorage.getItem("rootfinuser") || "null");

    const payload = {
      date,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      storeName,
      locCode: selectedLoc ? selectedLoc.locCode : "",
      reference: reference.trim(),
      debit: debitNum,
      dueDate,
      remarks: remarks.trim(),
      createdBy: user?.email || "",
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/vendor-ledgers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: json?.message || "Failed to save vendor ledger." });
      } else {
        setStatusMessage({ type: "success", text: "Vendor Ledger saved successfully!" });
        setTimeout(() => navigate("/ledgers/vendor"), 600);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error: Failed to save vendor ledger." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/ledgers/vendor");

  return (
    <div className={`min-h-screen bg-[#FAFAFB] transition-all duration-300 ${isSidebarOpen ? "md:ml-64 ml-0" : "ml-0"}`}>
      <div className="w-full max-w-4xl px-6 sm:px-10 py-8">

        {/* Top Breadcrumb Bar */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[#2A2B2F] hover:bg-black text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <nav className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Ledgers</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500 font-medium">Vendor Ledger</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">Add New Vendor Ledger</span>
          </nav>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Vendor Ledger</h1>
          <button
            type="button"
            onClick={handleCancel}
            className="flex! items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200! bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-xs! font-semibold shadow-xs transition-all cursor-pointer"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-medium border shadow-xs transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs uppercase font-bold text-gray-500 hover:text-gray-800 cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Row 1: Date & Vendor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Vendor</label>
                <LedgerPicker
                  items={vendorItems}
                  loading={vendorsLoading}
                  value={vendorId}
                  onChange={(vendor) => setVendorId(vendor.id)}
                  onAddNew={() => window.open("/purchase/vendors/new", "_blank", "noopener")}
                  icon={Building2}
                  text={{
                    placeholder: "Select Vendor",
                    loading: "Loading vendors...",
                    search: "Search vendor or company",
                    empty: "No vendors yet. Add one in Purchase → Vendors.",
                    addNew: () => "Add New Vendor",
                  }}
                />
              </div>
            </div>

            {/* Row 2: Store & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Location <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className={`${inputClass} pr-10 appearance-none cursor-pointer`}
                  >
                    <option value="">Select Location</option>
                    {VENDOR_LOCATIONS.map((loc) => (
                      <option key={loc.locCode} value={loc.locName}>
                        {loc.locName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Bill / Reference No. <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BILL-0012"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 3: Debit & Credit (automatic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Debit (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Enter amount"
                  value={debit}
                  onChange={(e) => setDebit(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Credit (₹)</label>
                <div className="flex items-start gap-2.5 min-h-11 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-500 leading-relaxed">
                  <Info size={14} className="shrink-0 mt-0.5 text-gray-400" />
                  <span>
                    Filled automatically from <span className="font-semibold text-gray-700">Vendor / Vendors</span> payments recorded for this vendor in Record Expense → Indirect Expense.
                  </span>
                </div>
              </div>
            </div>

            {/* Row 4: Payment Due Date & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="vendor-due-date" className="block text-xs font-medium text-gray-600 mb-2">
                  Payment Due Date
                </label>
                <input
                  id="vendor-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Remarks <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Any notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl bg-[#EFEFEF] hover:bg-gray-200 text-gray-800 font-semibold text-sm! transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white font-semibold text-sm transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Vendor Ledger</span>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AddVendorLedger;
