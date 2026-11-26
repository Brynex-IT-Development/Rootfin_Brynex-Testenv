import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown, Plus, Repeat, Info } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";
import useLedgerLocations from "../hooks/useLedgerLocations.js";
import LedgerPicker from "../components/LedgerPicker.jsx";

// The "!" suffix on a few utilities (flex!, text-sm!, border-gray-200!) wins
// over the global <button> rule in index.css.

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 shadow-2xs";

// Subscriptions are the sub categories of "IT related expenses" (Record Expense
// → Indirect Expense). Payments recorded under one show up as Credit here.
const SUBSCRIPTION_CATEGORY = "IT related expenses";
const SUBCATEGORIES_PATH = "api/expense-subcategories";

const AddSubscriptionLedger = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();
  const ledgerStores = useLedgerLocations();

  // Use local date parts (toISOString shifts dates back a day in IST)
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date();

  const [date, setDate] = useState(formatDateStr(today));
  const [subscriptionId, setSubscriptionId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [debit, setDebit] = useState("");
  const [remarks, setRemarks] = useState("");

  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);

  // Add New Subscription modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState(null);
  const [isSavingNew, setIsSavingNew] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Returns the loaded list so a caller can pick from it right away
  const loadSubscriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ expenseType: "indirect", category: SUBSCRIPTION_CATEGORY });
      const res = await fetch(`${baseUrl.baseUrl}${SUBCATEGORIES_PATH}?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      const list = (Array.isArray(json?.data) ? json.data : [])
        .map((sc) => ({ id: String(sc._id), name: String(sc.name || "").trim() }))
        .filter((sc) => sc.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      setSubscriptions(list);
      return list;
    } catch (err) {
      console.warn("Could not load subscriptions:", err);
      return [];
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const openAddModal = (prefill = "") => {
    setNewName(prefill);
    setAddError(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (!isSavingNew) setShowAddModal(false);
  };

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSavingNew) setShowAddModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal, isSavingNew]);

  const handleSaveNew = async (e) => {
    if (e) e.preventDefault();
    setAddError(null);

    const name = newName.trim();
    if (!name) {
      setAddError("Please enter the subscription name.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("rootfinuser") || "null");
    setIsSavingNew(true);
    try {
      const res = await fetch(`${baseUrl.baseUrl}${SUBCATEGORIES_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: SUBSCRIPTION_CATEGORY,
          expenseType: "indirect",
          createdBy: user?.email || "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(json?.message || "Failed to save subscription.");
        return;
      }

      // The API returns nothing for a name that already exists, so reload and pick by name
      const list = await loadSubscriptions();
      const match = list.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (match) setSubscriptionId(match.id);
      setShowAddModal(false);
      setStatusMessage({ type: "success", text: `Subscription "${match?.name || name}" is ready to use.` });
    } catch (err) {
      console.error(err);
      setAddError("Network error: Failed to save subscription.");
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!date) {
      setStatusMessage({ type: "error", text: "Please select a Date." });
      return;
    }
    const selected = subscriptions.find((s) => s.id === subscriptionId);
    if (!selected) {
      setStatusMessage({ type: "error", text: "Please select a Subscription." });
      return;
    }
    if (!(parseFloat(debit) > 0)) {
      setStatusMessage({ type: "error", text: "Please enter a valid Debit amount." });
      return;
    }

    const selectedLoc = ledgerStores.find((l) => l.locName === storeName);
    const user = JSON.parse(localStorage.getItem("rootfinuser") || "null");

    const payload = {
      // The backend still stores a period, so a single date is sent as both ends
      fromDate: date,
      toDate: date,
      date,
      subscriptionName: selected.name,
      storeName,
      locCode: selectedLoc ? selectedLoc.locCode : "",
      debit: parseFloat(debit),
      remarks: remarks.trim(),
      createdBy: user?.email || "",
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/subscription-ledgers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: json?.message || "Failed to save subscription ledger." });
      } else {
        setStatusMessage({ type: "success", text: "Subscription Ledger saved successfully!" });
        setTimeout(() => navigate("/ledgers/subscription"), 600);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error: Failed to save subscription ledger." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/ledgers/subscription");

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
            <span className="text-gray-500 font-medium">Subscription Ledger</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">Add New Subscription Ledger</span>
          </nav>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Subscription Ledger</h1>
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

            {/* Row 1: Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Row 2: Subscription & Store */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Subscription</label>
                <LedgerPicker
                  items={subscriptions}
                  loading={subscriptionsLoading}
                  value={subscriptionId}
                  onChange={(sub) => setSubscriptionId(sub.id)}
                  onAddNew={openAddModal}
                  icon={Repeat}
                  text={{
                    placeholder: "Select Subscription",
                    loading: "Loading subscriptions...",
                    search: "Search subscription",
                    empty: "No subscriptions yet. Add your first one below.",
                    addNew: (search) => (search ? `Add "${search}" as new subscription` : "Add New Subscription"),
                  }}
                />
              </div>

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
                    Filled automatically from <span className="font-semibold text-gray-700">IT related expenses</span> payments recorded for this subscription in Record Expense → Indirect Expense.
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
                  <span>Save Subscription Ledger</span>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Add New Subscription Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] px-4"
          onMouseDown={closeAddModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-subscription-title"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveNew}>
              {/* Header */}
              <div className="flex items-start gap-3.5 px-6 pt-6 pb-5">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-50 text-[#9B48D7] flex items-center justify-center">
                  <Repeat size={20} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 id="add-subscription-title" className="text-base font-bold text-gray-900 leading-tight">
                    Add New Subscription
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Also added as a sub category of IT related expenses, so it can be picked in Record Expense.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddModal}
                  aria-label="Close"
                  className="flex! items-center justify-center w-8 h-8 -mt-1 -mr-2 shrink-0 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 space-y-4">
                {addError && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                    {addError}
                  </div>
                )}

                <div>
                  <label htmlFor="new-subscription-name" className="block text-xs font-medium text-gray-600 mb-2">
                    Subscription Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-subscription-name"
                    type="text"
                    autoFocus
                    autoComplete="off"
                    placeholder="e.g. Google Workspace"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isSavingNew}
                  className="px-5 py-2.5 rounded-xl border bg-white border-gray-200! hover:bg-gray-100 text-gray-700 font-semibold text-sm! transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNew}
                  className="px-5 py-2.5 rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingNew ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Save Subscription</span>
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

export default AddSubscriptionLedger;
