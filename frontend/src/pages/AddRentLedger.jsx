import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, Plus, Search, Check, UserPlus, MapPin, Info } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";
import useLedgerLocations from "../hooks/useLedgerLocations.js";

// Note: index.css has an unlayered global rule that forces every non-submit
// <button> to display:inline-block, inherit font-size and use a transparent
// border. The "!" suffix on a few utilities below (flex!, text-sm!,
// border-gray-200!) wins over that rule.

const tenantInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

// Searchable tenant dropdown with an "Add New Tenant" action at the bottom.
const TenantPicker = ({ tenants, loading, value, onChange, onAddNew }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const selected = tenants.find((t) => t._id === value);

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
    ? tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.storeName || "").toLowerCase().includes(query)
      )
    : tenants;

  const choose = (tenant) => {
    onChange(tenant);
    setOpen(false);
    setSearch("");
  };

  const addNew = () => {
    const prefill = search.trim();
    setOpen(false);
    setSearch("");
    onAddNew(prefill);
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
            <>
              <span className="font-medium text-gray-800">{selected.name}</span>
              {selected.storeName && (
                <span className="text-gray-400"> · {selected.storeName}</span>
              )}
            </>
          ) : (
            <span className="font-medium text-gray-800">
              {loading ? "Loading tenants..." : "Select Tenant"}
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
                placeholder="Search tenant or location"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#9B48D7] transition-colors"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                {tenants.length === 0
                  ? "No tenants yet. Add your first tenant below."
                  : `No tenants match "${search.trim()}"`}
              </li>
            ) : (
              filtered.map((t) => {
                const isSelected = t._id === value;
                return (
                  <li key={t._id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(t)}
                      className={`flex! items-center gap-3 w-full px-3 py-2 text-left text-sm! transition-colors ${
                        isSelected ? "bg-purple-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-8 h-8 shrink-0 rounded-full bg-purple-100 text-[#9B48D7] text-xs font-semibold flex items-center justify-center">
                        {tenantInitials(t.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium text-gray-800">{t.name}</span>
                        {t.storeName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{t.storeName}</span>
                          </span>
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
              <span className="truncate">
                {search.trim() ? `Add "${search.trim()}" as new tenant` : "Add New Tenant"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 shadow-2xs";
const selectClass =
  "w-full h-11 px-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-2xs";

// Calls /api/<path>, falling back to /user/<path> if the API route is missing.
const fetchWithFallback = async (path, options) => {
  let res = await fetch(`${baseUrl.baseUrl}api/${path}`, options);
  if (res.status === 404) {
    res = await fetch(`${baseUrl.baseUrl}user/${path}`, options);
  }
  return res;
};

const AddRentLedger = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();
  const fallbackLocations = useLedgerLocations();

  // Use local date parts (toISOString shifts dates back a day in IST)
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date();

  const [fromDate, setFromDate] = useState(formatDateStr(today));
  const [toDate, setToDate] = useState(formatDateStr(today));
  const [tenantId, setTenantId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [debit, setDebit] = useState("");

  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // Add New Tenant modal
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantLocation, setNewTenantLocation] = useState("");
  const [tenantError, setTenantError] = useState(null);
  const [isSavingTenant, setIsSavingTenant] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const loadTenants = async () => {
      setTenantsLoading(true);
      try {
        const res = await fetchWithFallback("rent-tenants");
        if (!res.ok) return;
        const json = await res.json();
        setTenants(Array.isArray(json?.data) ? json.data : []);
      } catch (err) {
        console.warn("Could not load tenants:", err);
      } finally {
        setTenantsLoading(false);
      }
    };
    loadTenants();
  }, []);

  const selectTenant = (tenant) => {
    setTenantId(tenant._id);
    if (tenant.storeName) setStoreName(tenant.storeName);
  };

  const openTenantModal = (prefillName = "") => {
    setNewTenantName(prefillName);
    setNewTenantLocation(storeName);
    setTenantError(null);
    setShowTenantModal(true);
  };

  const closeTenantModal = () => {
    if (isSavingTenant) return;
    setShowTenantModal(false);
  };

  useEffect(() => {
    if (!showTenantModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSavingTenant) setShowTenantModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTenantModal, isSavingTenant]);

  const handleSaveTenant = async (e) => {
    if (e) e.preventDefault();
    setTenantError(null);

    const name = newTenantName.trim();
    if (!name) {
      setTenantError("Please enter the tenant name.");
      return;
    }
    if (!newTenantLocation) {
      setTenantError("Please select a location.");
      return;
    }

    const loc = fallbackLocations.find((l) => l.locName === newTenantLocation);

    setIsSavingTenant(true);
    try {
      const res = await fetchWithFallback("rent-tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          storeName: newTenantLocation,
          locCode: loc ? loc.locCode : "",
        }),
      });
      const json = await res.json();

      if (res.status === 409 && json?.data?._id) {
        // Tenant already exists for this location: just select it.
        const existing = json.data;
        setTenants((prev) => (prev.some((t) => t._id === existing._id) ? prev : [...prev, existing]));
        selectTenant(existing);
        setShowTenantModal(false);
        setStatusMessage({ type: "success", text: `Tenant "${existing.name}" already exists and has been selected.` });
        return;
      }

      if (!res.ok) {
        setTenantError(json?.message || "Failed to save tenant.");
        return;
      }

      const created = json.data;
      setTenants((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      selectTenant(created);
      setShowTenantModal(false);
      setStatusMessage({ type: "success", text: `Tenant "${created.name}" added.` });
    } catch (err) {
      console.error(err);
      setTenantError("Network error: Failed to save tenant.");
    } finally {
      setIsSavingTenant(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!fromDate) {
      setStatusMessage({ type: "error", text: "Please select a From Date." });
      return;
    }

    if (!toDate) {
      setStatusMessage({ type: "error", text: "Please select a To Date." });
      return;
    }

    if (!tenantId) {
      setStatusMessage({ type: "error", text: "Please select a Tenant." });
      return;
    }

    if (!storeName) {
      setStatusMessage({ type: "error", text: "Please select a Location." });
      return;
    }

    if (!debit || parseFloat(debit) < 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Debit amount." });
      return;
    }

    const selectedLoc = fallbackLocations.find((l) => l.locName === storeName);
    const locCode = selectedLoc ? selectedLoc.locCode : "";
    const selectedTenant = tenants.find((t) => t._id === tenantId);

    setIsSubmitting(true);

    const payload = {
      fromDate,
      toDate,
      date: fromDate,
      tenantId,
      tenantName: selectedTenant ? selectedTenant.name : "",
      storeName,
      locCode,
      debit: parseFloat(debit) || 0,
    };

    try {
      const res = await fetchWithFallback("rent-ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: json?.message || "Failed to save rent ledger." });
      } else {
        setStatusMessage({ type: "success", text: "Rent Ledger saved successfully!" });
        setTimeout(() => {
          navigate("/ledgers/rent");
        }, 600);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error: Failed to save rent ledger." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/ledgers/rent");
  };

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
            <span className="text-gray-500 font-medium">Rent Ledger</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">Add New Rent Ledger</span>
          </nav>
        </div>

        {/* Section Header with Title & Close Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Rent Ledger</h1>

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

            {/* Row 1: From Date & To Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 2: Tenant & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tenant</label>
                <TenantPicker
                  tenants={tenants}
                  loading={tenantsLoading}
                  value={tenantId}
                  onChange={selectTenant}
                  onAddNew={openTenantModal}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Location</label>
                <div className="relative">
                  <select
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select Location</option>
                    {fallbackLocations.map((loc) => (
                      <option key={loc.locCode} value={loc.locName}>
                        {loc.locName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Debit & Credit (automatic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Debit (₹)</label>
                <input
                  type="number"
                  step="any"
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
                    Filled automatically from <span className="font-semibold text-gray-700">Building Rent</span> expenses recorded for this tenant in Record Expense.
                  </span>
                </div>
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
                  <span>Save Rent Ledger</span>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Add New Tenant Modal */}
      {showTenantModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] px-4"
          onMouseDown={closeTenantModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-tenant-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveTenant}>
              {/* Header */}
              <div className="flex items-start gap-3.5 px-6 pt-6 pb-5">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-50 text-[#9B48D7] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 id="add-tenant-title" className="text-base font-bold text-gray-900 leading-tight">
                    Add New Tenant
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Save a tenant once and pick it in any rent ledger.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeTenantModal}
                  aria-label="Close"
                  className="flex! items-center justify-center w-8 h-8 -mt-1 -mr-2 shrink-0 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 space-y-4">
                {tenantError && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                    {tenantError}
                  </div>
                )}

                <div>
                  <label htmlFor="new-tenant-name" className="block text-xs font-medium text-gray-600 mb-2">
                    Tenant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-tenant-name"
                    type="text"
                    autoFocus
                    autoComplete="off"
                    placeholder="e.g. Ramesh Kumar"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="new-tenant-location" className="block text-xs font-medium text-gray-600 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      id="new-tenant-location"
                      value={newTenantLocation}
                      onChange={(e) => setNewTenantLocation(e.target.value)}
                      className={`${selectClass} pl-10`}
                    >
                      <option value="">Select Location</option>
                      {fallbackLocations.map((loc) => (
                        <option key={loc.locCode} value={loc.locName}>
                          {loc.locName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Picking this tenant later fills in this location automatically.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeTenantModal}
                  disabled={isSavingTenant}
                  className="px-5 py-2.5 rounded-xl border bg-white border-gray-200! hover:bg-gray-100 text-gray-700 font-semibold text-sm! transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTenant}
                  className="px-5 py-2.5 rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingTenant ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Save Tenant</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRentLedger;
