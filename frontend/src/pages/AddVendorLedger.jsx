import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, Plus, Search, Check, Building2, Info } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";
import useLedgerLocations from "../hooks/useLedgerLocations.js";
import useVendors from "../hooks/useVendors.js";

// Note: index.css has an unlayered global rule that forces every non-submit
// <button> to display:inline-block, inherit font-size and use a transparent
// border. The "!" suffix on a few utilities below (flex!, text-sm!,
// border-gray-200!) wins over that rule.

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 shadow-2xs";

// Searchable dropdown of the vendors in Purchase → Vendors, with an
// "Add New Vendor" action that opens the vendor form in a new tab.
const VendorPicker = ({ vendors, loading, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const selected = vendors.find((v) => v.id === value);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? vendors.filter(
        (v) => v.name.toLowerCase().includes(query) || v.companyName.toLowerCase().includes(query)
      )
    : vendors;

  const choose = (vendor) => {
    onChange(vendor);
    setOpen(false);
    setSearch("");
  };

  const addNew = () => {
    setOpen(false);
    setSearch("");
    window.open("/purchase/vendors/new", "_blank", "noopener");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex! items-center w-full h-11 px-3.5 rounded-xl border bg-white text-sm! text-left shadow-2xs transition-all duration-200 ${
          open
            ? "border-[#9B48D7]! ring-4 ring-purple-500/10"
            : "border-gray-200! hover:border-gray-300!"
        }`}
      >
        <span className="flex-1 min-w-0 truncate">
          {selected ? (
            <span className="font-medium text-gray-800">{selected.name}</span>
          ) : (
            <span className="font-medium text-gray-800">
              {loading ? "Loading vendors..." : "Select Vendor"}
            </span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`ml-2 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or company"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#9B48D7] transition-colors"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                {vendors.length === 0
                  ? "No vendors yet. Add one in Purchase → Vendors."
                  : `No vendors match "${search.trim()}"`}
              </li>
            ) : (
              filtered.map((v) => {
                const isSelected = v.id === value;
                const showCompany = v.companyName && v.companyName.toLowerCase() !== v.name.toLowerCase();
                return (
                  <li key={v.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(v)}
                      className={`flex! items-center gap-3 w-full px-3 py-2 text-left text-sm! transition-colors ${
                        isSelected ? "bg-purple-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-8 h-8 shrink-0 rounded-full bg-purple-100 text-[#9B48D7] flex items-center justify-center">
                        <Building2 size={14} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium text-gray-800">{v.name}</span>
                        {showCompany && (
                          <span className="block text-xs text-gray-500 truncate">{v.companyName}</span>
                        )}
                      </span>
                      {isSelected && <Check size={16} className="shrink-0 text-[#9B48D7]" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-gray-100 p-1.5">
            <button
              type="button"
              onClick={addNew}
              className="flex! items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm! font-semibold text-[#9B48D7] hover:bg-purple-50 transition-colors"
            >
              <Plus size={16} className="shrink-0" />
              <span className="truncate">Add New Vendor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AddVendorLedger = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();
  const ledgerStores = useLedgerLocations();
  const { vendors, loading: vendorsLoading, reload: reloadVendors } = useVendors();

  // Use local date parts (toISOString shifts dates back a day in IST)
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(formatDateStr(new Date()));
  const [vendorId, setVendorId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [reference, setReference] = useState("");
  const [debit, setDebit] = useState("");
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

    const selectedLoc = ledgerStores.find((l) => l.locName === storeName);
    const user = JSON.parse(localStorage.getItem("rootfinuser") || "null");

    const payload = {
      date,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      storeName,
      locCode: selectedLoc ? selectedLoc.locCode : "",
      reference: reference.trim(),
      debit: debitNum,
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
                <VendorPicker
                  vendors={vendors}
                  loading={vendorsLoading}
                  value={vendorId}
                  onChange={(vendor) => setVendorId(vendor.id)}
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
                    {ledgerStores.map((loc) => (
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

            {/* Row 4: Remarks */}
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
