import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronDown } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";
import useLedgerLocations from "../hooks/useLedgerLocations.js";

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 shadow-2xs";

// Common subscriptions shown as suggestions; the user can still type any name
const commonSubscriptions = [
  "Google Workspace",
  "Microsoft 365",
  "Zoho",
  "Tally",
  "AWS",
  "Internet / Broadband",
  "Mobile Recharge",
  "Software License",
];

const AddSubscriptionLedger = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();
  const ledgerStores = useLedgerLocations();

  const formatDateStr = (d) => d.toISOString().split("T")[0];
  const today = new Date();

  const [fromDate, setFromDate] = useState(formatDateStr(today));
  const [toDate, setToDate] = useState(formatDateStr(today));
  const [subscriptionName, setSubscriptionName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [debit, setDebit] = useState("");
  const [credit, setCredit] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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
    if (toDate < fromDate) {
      setStatusMessage({ type: "error", text: "To Date cannot be before From Date." });
      return;
    }
    if (!subscriptionName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a Subscription Name." });
      return;
    }
    if (!debit || parseFloat(debit) < 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Debit amount." });
      return;
    }

    const selectedLoc = ledgerStores.find((l) => l.locName === storeName);
    const user = JSON.parse(localStorage.getItem("rootfinuser") || "null");

    const payload = {
      fromDate,
      toDate,
      date: fromDate,
      subscriptionName: subscriptionName.trim(),
      storeName,
      locCode: selectedLoc ? selectedLoc.locCode : "",
      debit: parseFloat(debit) || 0,
      credit: parseFloat(credit) || 0,
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
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

            {/* Row 1: Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Row 2: Subscription & Store */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Subscription Name</label>
                <input
                  type="text"
                  list="subscription-ledger-names"
                  placeholder="e.g. Google Workspace"
                  value={subscriptionName}
                  onChange={(e) => setSubscriptionName(e.target.value)}
                  className={inputClass}
                />
                <datalist id="subscription-ledger-names">
                  {commonSubscriptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
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

            {/* Row 3: Debit & Credit */}
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
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Credit (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Enter amount"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  className={inputClass}
                />
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
                className="px-6 py-2.5 rounded-xl bg-[#EFEFEF] hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors cursor-pointer"
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
    </div>
  );
};

export default AddSubscriptionLedger;
