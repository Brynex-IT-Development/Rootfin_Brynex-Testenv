import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import baseUrl from "../api/api.js";
import { useSidebar } from "../hooks/useSidebar.js";

const RentLedgers = () => {
  const navigate = useNavigate();
  const isSidebarOpen = useSidebar();

  // Initial Date Filters (Start of current month to today)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDateStr = (d) => d.toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(formatDateStr(firstDay));
  const [dateTo, setDateTo] = useState(formatDateStr(today));

  const [ledgers, setLedgers] = useState([]);
  const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLedgers = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`${baseUrl.baseUrl}api/rent-ledgers?DateFrom=${dateFrom}&DateTo=${dateTo}`);
      if (res.status === 404) {
        res = await fetch(`${baseUrl.baseUrl}user/rent-ledgers?DateFrom=${dateFrom}&DateTo=${dateTo}`);
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch rent ledgers: ${res.statusText}`);
      }
      const json = await res.json();
      setLedgers(json.data || []);
      setTotals(json.totals || { totalDebit: 0, totalCredit: 0, totalBalance: 0 });
    } catch (err) {
      console.error("Error fetching rent ledgers:", err);
      setError(err.message || "Failed to load rent ledgers");
      setLedgers([]);
      setTotals({ totalDebit: 0, totalCredit: 0, totalBalance: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

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
            <span className="text-gray-900 font-semibold">Rent Ledgers</span>
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
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate("/ledgers/rent/new")}
              className="flex items-center justify-center gap-2 bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer h-[42px]"
            >
              <Plus size={16} />
              <span>New Rent Ledger</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Rent Ledgers Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1F1F1F] text-white text-[11px] font-semibold tracking-wider uppercase">
                  <th className="py-4 px-6">DATE</th>
                  <th className="py-4 px-6">STORE NAME</th>
                  <th className="py-4 px-6">DEBIT (₹)</th>
                  <th className="py-4 px-6">CREDIT (₹)</th>
                  <th className="py-4 px-6">BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-14 text-center text-gray-400">
                      Loading rent ledgers...
                    </td>
                  </tr>
                ) : ledgers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-14 text-center text-gray-400">
                      No rent ledger records found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  ledgers.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-normal text-gray-800 whitespace-nowrap">
                        {formatDateDisplay(row.date || row.fromDate)}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {row.storeName}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {formatCurrency(row.debit)}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {formatCurrency(row.credit)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {ledgers.length > 0 && (
                <tfoot>
                  <tr className="bg-[#E5E7EB] text-gray-900 text-sm font-bold border-t-2 border-gray-300">
                    <td className="py-4 px-6 uppercase tracking-wider">TOTAL</td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6">{formatCurrency(totals.totalDebit)}</td>
                    <td className="py-4 px-6">{formatCurrency(totals.totalCredit)}</td>
                    <td className="py-4 px-6">{formatCurrency(totals.totalBalance)}</td>
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

export default RentLedgers;

