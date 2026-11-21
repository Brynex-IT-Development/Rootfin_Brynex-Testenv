import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Printer, ChevronDown, MoreVertical, CheckCircle } from "lucide-react";
import baseUrl from "../api/api";
import useSidebar from "../hooks/useSidebar";

const InventoryAdjustmentDetail = () => {
  const isSidebarOpen = useSidebar();
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  
  const [adjustment, setAdjustment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdfView, setShowPdfView] = useState(true);
  
  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };
  
  // Fetch adjustment
  useEffect(() => {
    const fetchAdjustment = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/inventory/adjustments/${id}`);
        if (!response.ok) throw new Error("Failed to fetch adjustment");
        const data = await response.json();
        setAdjustment(data);
      } catch (error) {
        console.error("Error fetching adjustment:", error);
        alert("Failed to load adjustment");
        navigate("/inventory/adjustments");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAdjustment();
    }
  }, [id, API_URL, navigate]);
  
  // Print the document through a hidden iframe: no new tab, and the app's global print CSS cannot hide it
  const handlePrint = () => {
    const doc = document.getElementById("printable-invoice");
    if (!doc) {
      window.print();
      return;
    }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("");

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>${adjustment?.referenceNumber || "Inventory Adjustment"}</title>${styles}
      <style>@page { margin: 12mm; } body { margin: 0; background: #fff; }</style>
      </head><body>${doc.outerHTML}</body></html>`);
    frameDoc.close();

    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1000);
    }, 400);
  };

  // Approval: only super admins can approve a pending request (applies the stock change)
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("rootfinuser") || "null"); } catch { return null; }
  })();
  const canApprove = storedUser?.role === "superadmin";
  const [approving, setApproving] = useState(false);

  // Global button styles in index.css override Tailwind's flex utilities, so layout is set inline
  const barButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "36px",
    padding: "0 14px",
    fontSize: "14px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    flexDirection: "row",
    cursor: "pointer",
  };

  const handleApprove = async () => {
    if (!window.confirm("Approve this adjustment? Stock will be updated.")) return;
    setApproving(true);
    try {
      const response = await fetch(`${API_URL}/api/inventory/adjustments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "adjusted",
          userId: storedUser?.email || storedUser?._id || storedUser?.id || "",
          userPower: storedUser?.power || "",
          userRole: storedUser?.role || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve adjustment");
      setAdjustment(data);
    } catch (error) {
      alert(`Error approving adjustment: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  // Company information
  const companyName = "Grooms Wedding Hub";
  const companyAddress = "Thrissur Kerala 680002";
  const companyCountry = "India";
  const companyGSTIN = "32AANCB8936G1ZG";
  const companyPhone = "7593838704";
  const companyEmail = "brynexoffice@gmail.com";
  
  if (loading) {
    return (
      <div className={`transition-all duration-300 p-3 sm:p-6 bg-[#f5f7fb] min-h-screen flex items-center justify-center ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
        <div className="text-[#64748b]">Loading adjustment...</div>
      </div>
    );
  }
  
  if (!adjustment) {
    return (
      <div className={`transition-all duration-300 p-3 sm:p-6 bg-[#f5f7fb] min-h-screen flex items-center justify-center ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
        <div className="text-center">
          <p className="text-[#64748b] mb-4">Adjustment not found</p>
          <Link
            to="/inventory/adjustments"
            className="text-[#2563eb] hover:underline"
          >
            Back to Inventory Adjustments
          </Link>
        </div>
      </div>
    );
  }

  // Format branch name
  const branchName = adjustment.branch 
    ? (adjustment.branch.includes("Branch") 
        ? adjustment.branch 
        : `${adjustment.branch} Branch`)
    : "-";

  // Format created by (warehouse)
  const createdBy = adjustment.warehouse
    ? (adjustment.warehouse.includes("Warehouse")
        ? adjustment.warehouse
        : `Warehouse ${adjustment.warehouse}`)
    : adjustment.createdBy || "-";

  // Format adjustment type
  const adjustmentType = adjustment.adjustmentType === "quantity" 
    ? "Quantity" 
    : adjustment.adjustmentType === "value"
    ? "Value"
    : adjustment.adjustmentType || "-";
  
  return (
    <div className={`transition-all duration-300 min-h-screen bg-[#f5f7fb] p-3 sm:p-6 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
      {/* Print: show only the adjustment document, at the top of a clean page */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-invoice, #printable-invoice * { visibility: visible !important; }
          #printable-invoice { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: 100% !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>
      {/* Top Bar with Actions */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-lg border border-[#e2e8f0] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            to="/inventory/adjustments"
            aria-label="Back to inventory adjustments"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d4dcf4] bg-white text-[#111827] hover:bg-[#f3f4f6]"
          >
            <ArrowLeft size={16} />
          </Link>
          <Link
            to={`/inventory/adjustments/${id}/edit`}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md border border-[#d4dcf4] bg-white px-3.5 text-sm font-medium text-[#111827] hover:bg-[#f3f4f6]"
          >
            <Edit size={16} />
            Edit
          </Link>
          {canApprove && adjustment.status === "pending_approval" && (
            <button
              onClick={handleApprove}
              disabled={approving}
              style={barButtonStyle}
              className="rounded-md bg-[#16a34a] text-white font-semibold hover:bg-[#15803d] disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {approving ? "Approving..." : "Approve"}
            </button>
          )}
          <button
            onClick={handlePrint}
            style={barButtonStyle}
            className="rounded-md border border-[#d4dcf4] bg-white text-[#111827] font-medium hover:bg-[#f3f4f6]"
          >
            <Printer size={16} />
            PDF/Print
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#4b5563] cursor-pointer">
            <input
              type="checkbox"
              checked={showPdfView}
              onChange={(e) => setShowPdfView(e.target.checked)}
              className="h-4 w-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4338ca]"
            />
            Show PDF View
          </label>
          <button className="p-1.5 rounded hover:bg-[#f1f5f9]">
            <MoreVertical size={16} className="text-[#64748b]" />
          </button>
        </div>
      </div>
      
      {/* Document View */}
      {showPdfView && (
        <div id="printable-invoice" className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] overflow-hidden print:shadow-none print:border-0" style={{ maxWidth: '210mm', margin: '0 auto', position: 'relative' }}>
          {/* Status Banner - Diagonal Overlay (Top Left) */}
          {adjustment.status === "adjusted" && (
            <div 
              className="absolute top-0 left-0 bg-[#2563eb] text-white px-16 py-2 text-xs font-bold uppercase tracking-wider shadow-lg z-10"
              style={{
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left',
                marginLeft: '-35px',
                marginTop: '25px',
                letterSpacing: '0.1em',
              }}
            >
              Adjusted
            </div>
          )}
          
          <div className="p-10 print:p-8" style={{ paddingTop: adjustment.status === "adjusted" ? '60px' : '20px' }}>
            {/* Header with Company Info and Document Title */}
            <div className="mb-8">
              {/* Document Title (Centered, full width) */}
              <h1 className="text-center text-2xl font-bold tracking-wide text-[#111827] pb-4 mb-5 border-b border-[#e5e7eb]">
                INVENTORY ADJUSTMENT
              </h1>

              <div className="grid grid-cols-2 gap-6 items-start">
              {/* Company Information (Left) */}
              <div className="text-sm text-[#111827] space-y-1">
                <div>
                  <span className="font-semibold">Branch Name: </span>
                  <span>{branchName}</span>
                </div>
                <div>
                  <span className="font-semibold">Created By: </span>
                  <span>{createdBy}</span>
                </div>
                <div className="mt-2">{companyCountry}</div>
                <div>GSTIN {companyGSTIN}</div>
              </div>

              {/* Adjustment Details (Right) */}
              <div className="text-sm text-[#111827] space-y-1 text-right">
                <div>
                  <span className="font-semibold">Date: </span>
                  <span>{formatDate(adjustment.date)}</span>
                </div>
                <div>
                  <span className="font-semibold">Ref#: </span>
                  <span>{adjustment.referenceNumber || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold">Reason: </span>
                  <span>{adjustment.reason || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold">Account: </span>
                  <span>{adjustment.account || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold">Adjustment Type: </span>
                  <span>{adjustmentType}</span>
                </div>
              </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4b5563]">
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-white">#</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-white">SKU</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-white">Item & Description</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-right text-xs font-semibold text-white">Quantity Adjusted</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-right text-xs font-semibold text-white">Newly Adjusted Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustment.items && adjustment.items.length > 0 ? (
                    adjustment.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f9fafb]">
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#111827]">{index + 1}</td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] font-medium">
                          {item.itemSku || "-"}
                        </td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#111827]">
                          {item.itemName || "-"}
                        </td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-right text-[#111827] font-medium">
                          {parseFloat(item.quantityAdjusted || 0).toFixed(2)} PCS
                        </td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-right text-[#111827] font-medium">
                          {parseFloat(item.newQuantity || item.currentQuantity || 0).toFixed(2)} PCS
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="border border-[#d1d5db] px-4 py-8 text-center text-sm text-[#6b7280]">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Non-PDF View (if toggle is off) */}
      {!showPdfView && (
        <div className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#1e293b]">
                {adjustment.referenceNumber || "Inventory Adjustment"}
              </h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                adjustment.status === "adjusted"
                  ? "bg-[#dbeafe] text-[#1e40af]"
                  : adjustment.status === "pending_approval"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-[#fef3c7] text-[#92400e]"
              }`}>
                {adjustment.status === "adjusted" ? "Adjusted" : adjustment.status === "pending_approval" ? "Pending Approval" : "Draft"}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Date: </span>
              <span className="text-sm text-[#1e293b]">{formatDate(adjustment.date)}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Status: </span>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                adjustment.status === "adjusted"
                  ? "bg-[#dbeafe] text-[#1e40af]"
                  : adjustment.status === "pending_approval"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-[#fef3c7] text-[#92400e]"
              }`}>
                {adjustment.status === "adjusted" ? "Adjusted" : adjustment.status === "pending_approval" ? "Pending Approval" : "Draft"}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Reason: </span>
              <span className="text-sm text-[#1e293b]">{adjustment.reason || "-"}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Warehouse: </span>
              <span className="text-sm text-[#1e293b]">{adjustment.warehouse || "-"}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Branch: </span>
              <span className="text-sm text-[#1e293b]">{branchName}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Adjustment Type: </span>
              <span className="text-sm text-[#1e293b]">{adjustmentType}</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#64748b] mb-3">Items</h3>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-[#e2e8f0]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b]">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b]">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">Quantity Adjusted</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">Newly Adjusted Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {adjustment.items && adjustment.items.length > 0 ? (
                    adjustment.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-[#1e293b]">{item.itemSku || "-"}</td>
                        <td className="px-4 py-3 text-sm text-[#1e293b]">{item.itemName || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#1e293b]">
                          {parseFloat(item.quantityAdjusted || 0).toFixed(2)} PCS
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-[#1e293b] font-medium">
                          {parseFloat(item.newQuantity || item.currentQuantity || 0).toFixed(2)} PCS
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-[#64748b]">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAdjustmentDetail;

