import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";

const VendorLedgers = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();

  // Initial Date Filters (Start of current month to today)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  // Use local date parts (toISOString shifts dates back a day in IST)
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [dateFrom, setDateFrom] = useState(formatDateStr(firstDay));
  const [dateTo, setDateTo] = useState(formatDateStr(today));

  const [ledgers, setLedgers] = useState([]);
  const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(false);
  // Nothing is loaded until the user picks a date range and clicks Fetch Data
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(null);

  // Vendor / Location filters (applied to the fetched rows)
  const [vendorFilter, setVendorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const fetchLedgers = async () => {
    setLoading(true);
    setHasFetched(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/vendor-ledgers?DateFrom=${dateFrom}&DateTo=${dateTo}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch vendor ledgers: ${res.statusText}`);
      }
      const json = await res.json();
      setLedgers(json.data || []);
      setTotals(json.totals || { totalDebit: 0, totalCredit: 0, totalBalance: 0 });
    } catch (err) {
      console.error("Error fetching vendor ledgers:", err);
      setError(err.message || "Failed to load vendor ledgers");
      setLedgers([]);
      setTotals({ totalDebit: 0, totalCredit: 0, totalBalance: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor ledger entry?")) return;
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/vendor-ledgers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      fetchLedgers();
    } catch (err) {
      setError(err.message || "Failed to delete entry");
    }
  };

  const vendorOptions = useMemo(
    () => [...new Set(ledgers.map((r) => r.vendorName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [ledgers]
  );
  const locationOptions = useMemo(
    () => [...new Set(ledgers.map((r) => r.storeName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [ledgers]
  );

  const filteredLedgers = useMemo(
    () =>
      ledgers.filter(
        (r) =>
          (vendorFilter === "all" || r.vendorName === vendorFilter) &&
          (locationFilter === "all" || r.storeName === locationFilter)
      ),
    [ledgers, vendorFilter, locationFilter]
  );

  // Totals follow the filters; with no filter they match the server totals
  const filteredTotals = useMemo(() => {
    if (vendorFilter === "all" && locationFilter === "all") return totals;
    return filteredLedgers.reduce(
      (acc, r) => {
        const d = Number(r.debit) || 0;
        const c = Number(r.credit) || 0;
        acc.totalDebit += d;
        acc.totalCredit += c;
        acc.totalBalance += d - c;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, totalBalance: 0 }
    );
  }, [filteredLedgers, totals, vendorFilter, locationFilter]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return Number(val).toLocaleString("en-IN");
  };

  return (
    <div className={`min-h-screen bg-[#FAFAFB] transition-all duration-300 ${isSidebarOpen ? "md:ml-64 ml-0" : "ml-0"}`}>
      <div className="w-full px-6 sm:px-10 py-8">

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
            <span className="text-gray-900 font-semibold">Vendor Ledgers</span>
          </nav>
        </div>

        {/* Date Filters & Action Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={fetchLedgers}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#18181B] hover:bg-black text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 h-[42px]"
            >
              {loading ? "Fetching..." : "Fetch Data"}
            </button>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vendor</label>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 shadow-xs min-w-[180px] cursor-pointer"
              >
                <option value="all">All Vendors</option>
                {vendorOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 shadow-xs min-w-[180px] cursor-pointer"
              >
                <option value="all">All Locations</option>
                {locationOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate("/ledgers/vendor/new")}
              className="flex items-center justify-center gap-2 bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer h-[42px]"
            >
              <Plus size={16} />
              <span>New Vendor Ledger</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Vendor Ledgers Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1F1F1F] text-white text-[11px] font-semibold tracking-wider uppercase">
                  <th className="py-4 px-6">DATE</th>
                  <th className="py-4 px-6">VENDOR NAME</th>
                  <th className="py-4 px-6">LOCATION</th>
                  <th className="py-4 px-6">REFERENCE</th>
                  <th className="py-4 px-6">DUE DATE</th>
                  <th className="py-4 px-6">DEBIT (₹)</th>
                  <th className="py-4 px-6">CREDIT (₹)</th>
                  <th className="py-4 px-6">BALANCE</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-gray-400">
                      Loading vendor ledgers...
                    </td>
                  </tr>
                ) : filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-14 text-center text-gray-400">
                      {!hasFetched
                        ? "Select a date range and click Fetch Data to view records."
                        : ledgers.length === 0
                        ? "No vendor ledger records found for the selected date range."
                        : "No vendor ledger records match the selected vendor / location."}
                    </td>
                  </tr>
                ) : (
                  filteredLedgers.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-normal text-gray-800 whitespace-nowrap">
                        {formatDateDisplay(row.date)}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">{row.vendorName}</td>
                      <td className="py-4 px-6 text-gray-700">{row.storeName || "-"}</td>
                      <td className="py-4 px-6 text-gray-700">{row.reference || "-"}</td>
                      <td className="py-4 px-6 font-normal text-gray-800 whitespace-nowrap">
                        {row.dueDate ? formatDateDisplay(row.dueDate) : "-"}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">{formatCurrency(row.debit)}</td>
                      <td
                        className="py-4 px-6 font-medium text-gray-800"
                        title={`Vendor payments: ${row.paymentCount || 0} expense${row.paymentCount === 1 ? "" : "s"} in Record Expense`}
                      >
                        {formatCurrency(row.credit)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{formatCurrency(row.balance)}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(row._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLedgers.length > 0 && (
                <tfoot>
                  <tr className="bg-[#E5E7EB] text-gray-900 text-sm font-bold border-t-2 border-gray-300">
                    <td className="py-4 px-6 uppercase tracking-wider">TOTAL</td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6">{formatCurrency(filteredTotals.totalDebit)}</td>
                    <td className="py-4 px-6">{formatCurrency(filteredTotals.totalCredit)}</td>
                    <td className="py-4 px-6">{formatCurrency(filteredTotals.totalBalance)}</td>
                    <td className="py-4 px-6"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorLedgers;
