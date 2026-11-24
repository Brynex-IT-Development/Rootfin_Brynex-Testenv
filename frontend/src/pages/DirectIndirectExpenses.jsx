import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import baseUrl from "../api/api";
import { 
  ChevronDown, 
  X, 
  Menu, 
  ArrowLeft, 
  Search, 
  Check, 
  UploadCloud, 
  IndianRupee, 
  Layers, 
  Building2, 
  FileText,
  Lock,
  Plus
} from "lucide-react";
import { BsBank2 } from "react-icons/bs";
import { MdCurrencyRupee } from "react-icons/md";
import { useSidebar } from "../hooks/useSidebar.js";
import {
  IMAGE_CONFIG,
  processImageFiles,
  getFilesFromDragEvent,
  triggerFileInput,
} from "../utils/imageUpload";

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  searchPlaceholder = "Search...",
  icon: Icon = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        (opt.label || "").toLowerCase().includes(term) ||
        (opt.value || "").toLowerCase().includes(term)
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full h-12 flex items-center justify-between rounded-xl border bg-white px-4 text-sm transition-all duration-200 select-none outline-none ${
          isOpen
            ? "border-[#9B48D7] ring-4 ring-purple-500/10 shadow-xs"
            : "border-gray-200 hover:border-gray-300"
        } ${
          disabled
            ? "bg-gray-50/80 text-gray-400 cursor-not-allowed border-gray-200"
            : "cursor-pointer hover:bg-gray-50/30"
        }`}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
          {Icon && (
            <Icon size={16} className={`shrink-0 ${selectedOption ? "text-[#9B48D7]" : "text-gray-400"}`} />
          )}
          <span
            className={`truncate text-left block text-sm ${
              selectedOption ? "text-gray-900 font-medium" : "text-gray-400 font-normal"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {disabled ? (
            <Lock size={14} className="text-gray-400" />
          ) : (
            <>
              {selectedOption && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      onChange("");
                    }
                  }}
                  className="p-1 text-gray-300 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear selection"
                >
                  <X size={13} />
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180 text-[#9B48D7]" : ""
                }`}
              />
            </>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in-0 duration-150">
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9B48D7] focus:ring-2 focus:ring-purple-500/10 font-normal"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch("");
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-purple-50/90 text-[#9B48D7] font-semibold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#9B48D7] shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-7 text-center text-xs text-gray-400">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DIRECT_EXPENSE_CATS = [
  { value: "Dry Cleaning Expense", label: "Dry Cleaning Expense" },
  { value: "Alteration", label: "Alteration" },
  { value: "Raw Materials And Consumables", label: "Raw Materials And Consumables" },
  { value: "Freight Charges", label: "Freight Charges" },
  { value: "Stitching expense", label: "Stitching expense" },
  { value: "Material/Dress Accessories", label: "Material/Dress Accessories" },
  { value: "Alteration Expense", label: "Alteration Expense" },
];

const INDIRECT_EXPENSE_CATS = [
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Bank Fees and Charges", label: "Bank Fees and Charges" },
  { value: "Travel Expense", label: "Travel Expense" },
  { value: "Directors Travelling Expense", label: "Directors Travelling Expense" },
  { value: "IT related expenses", label: "IT related expenses" },
  { value: "Building Rent", label: "Building Rent" },
  { value: "Repairs and Maintenance", label: "Repairs and Maintenance" },
  { value: "EPF Contribution-Employer", label: "EPF Contribution-Employer" },
  { value: "ESI Contribution-Employer", label: "ESI Contribution-Employer" },
  { value: "Telephone & Internet Expense", label: "Telephone & Internet Expense" },
  { value: "Office Expenses", label: "Office Expenses" },
  { value: "Charity", label: "Charity" },
  { value: "Cleaning Expenses", label: "Cleaning Expenses" },
  { value: "Labour charge", label: "Labour charge" },
  { value: "Electricity Charges", label: "Electricity Charges" },
  { value: "Water Charges", label: "Water Charges" },
  { value: "Courier Charges", label: "Courier Charges" },
  { value: "Parking charge", label: "Parking charge" },
  { value: "Subscription Charges", label: "Subscription Charges" },
  { value: "Marketing & Promotion", label: "Marketing & Promotion" },
  { value: "Salary /salary advances/ Wages", label: "Salary /salary advances/ Wages" },
  { value: "Staff Welfare Expenses", label: "Staff Welfare Expenses" },
  { value: "Generator Expenses", label: "Generator Expenses" },
  { value: "Meeting Expenses", label: "Meeting Expenses" },
  { value: "House Rent Allowance", label: "House Rent Allowance" },
  { value: "Equipment Rent", label: "Equipment Rent" },
  { value: "GST fees", label: "GST fees" },
  { value: "Training & Development Expenses", label: "Training & Development Expenses" },
  { value: "Interior Designing", label: "Interior Designing" },
  { value: "Audit Fee", label: "Audit Fee" },
  { value: "Lease Registration Charges", label: "Lease Registration Charges" },
  { value: "TDS", label: "TDS" },
];

const fallbackLocations = [
  { locName: "Z-Edapally1", locCode: "144" },
  { locName: "Warehouse", locCode: "858" },
  { locName: "G-Edappally", locCode: "702" },
  { locName: "HEAD OFFICE01", locCode: "759" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Z- Edappal", locCode: "100" },
  { locName: "Z.Perinthalmanna", locCode: "133" },
  { locName: "Z.Kottakkal", locCode: "122" },
  { locName: "G.Kottayam", locCode: "701" },
  { locName: "G.Perumbavoor", locCode: "703" },
  { locName: "G.Thrissur", locCode: "704" },
  { locName: "G.Chavakkad", locCode: "706" },
  { locName: "G.Calicut ", locCode: "712" },
  { locName: "G.Vadakara", locCode: "708" },
  { locName: "G.Edappal", locCode: "707" },
  { locName: "G.Perinthalmanna", locCode: "709" },
  { locName: "G.Kottakkal", locCode: "711" },
  { locName: "G.Manjeri", locCode: "710" },
  { locName: "G.Palakkad ", locCode: "705" },
  { locName: "G.Kalpetta", locCode: "717" },
  { locName: "G.Kannur", locCode: "716" },
  { locName: "G.Mg Road", locCode: "718" },
  { locName: "Dappr Squad", locCode: "555" },
  { locName: "Production", locCode: "101" },
  { locName: "Office", locCode: "102" },
  { locName: "WAREHOUSE", locCode: "103" }
];

const BANK_ACCOUNTS = [
  { value: "Hdfc SG **0420",       label: "Hdfc SG **0420" },
  { value: "Hdfc ZR **9637",       label: "Hdfc ZR **9637" },
  { value: "Hdfc Statutory **9726",label: "Hdfc Statutory **9726" },
  { value: "Federal ED **8633",    label: "Federal ED **8633" },
  { value: "Federal MG **9433",    label: "Federal MG **9433" },
  { value: "Federal DS **8575",    label: "Federal DS **8575" },
  { value: "Federal Rootments",    label: "Federal Rootments" },
  { value: "IDFC First Bank",      label: "IDFC First Bank"},
];

const DirectIndirectExpenses = ({ initialType = "direct" }) => {
  const isSidebarOpen = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isIndirectUrl = location.pathname.includes("indirect");
  const [expenseType, setExpenseType] = useState(isIndirectUrl ? "indirect" : initialType);

  useEffect(() => {
    if (location.pathname.includes("indirect")) {
      setExpenseType("indirect");
    } else if (location.pathname.includes("direct")) {
      setExpenseType("direct");
    }
  }, [location.pathname]);

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")) || {};
  const isAdmin = (currentusers.power || "").toLowerCase() === "admin" || (currentusers.role || "").toLowerCase() === "admin";
  const isSuperAdmin = (currentusers.role || "").toLowerCase() === "superadmin";
  const isFinancialHead = (currentusers.role || "").toLowerCase() === "financial_head";
  const canSelectStore = isAdmin || isSuperAdmin || isFinancialHead;
  const canManageCategories = isSuperAdmin || isFinancialHead;

  const defaultStore = canSelectStore ? "" : (currentusers.locCode || "759");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [branch, setBranch] = useState(defaultStore);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  // Custom Categories from Database
  const [customDirectCats, setCustomDirectCats] = useState([]);
  const [customIndirectCats, setCustomIndirectCats] = useState([]);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [catModalError, setCatModalError] = useState("");

  // Subcategory States & Management
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [isAddSubCatModalOpen, setIsAddSubCatModalOpen] = useState(false);
  const [subCatParentCategory, setSubCatParentCategory] = useState("");
  const [newSubCatName, setNewSubCatName] = useState("");
  const [addingSubCat, setAddingSubCat] = useState(false);
  const [subCatModalError, setSubCatModalError] = useState("");

  // Fetch custom categories on mount
  const fetchCustomCategories = async () => {
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/expense-categories`);
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setCustomDirectCats(
          list
            .filter((c) => c.expenseType === "direct")
            .map((c) => ({ value: c.name, label: c.name }))
        );
        setCustomIndirectCats(
          list
            .filter((c) => c.expenseType === "indirect")
            .map((c) => ({ value: c.name, label: c.name }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch custom expense categories:", err);
    }
  };

  // Fetch subcategories for current expenseType and selected category
  const fetchSubCategories = async () => {
    try {
      const url = `${baseUrl.baseUrl}api/expense-subcategories?expenseType=${expenseType}${category ? `&category=${encodeURIComponent(category)}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setSubCategoriesList(list.map((sc) => ({ value: sc.name, label: sc.name, category: sc.category })));
      }
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
    }
  };

  useEffect(() => {
    fetchCustomCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories();
    setSubCategory("");
  }, [category, expenseType]);

  const handleAddCategorySubmit = async (e) => {
    if (e) e.preventDefault();
    setCatModalError("");
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCatModalError("Category name cannot be empty.");
      return;
    }

    setAddingCat(true);
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/expense-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          expenseType: expenseType, // "direct" or "indirect"
          createdBy: currentusers.name || currentusers.username || (isSuperAdmin ? "SuperAdmin" : "FinancialHead"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCatModalError(json.message || "Failed to add category.");
      } else {
        await fetchCustomCategories();
        setCategory(trimmed);
        setNewCatName("");
        setIsAddCatModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      setCatModalError("Network error: Could not add category.");
    } finally {
      setAddingCat(false);
    }
  };

  const handleAddSubCategorySubmit = async (e) => {
    if (e) e.preventDefault();
    setSubCatModalError("");
    const trimmedSub = newSubCatName.trim();
    const targetParentCat = subCatParentCategory.trim() || category.trim();

    if (!targetParentCat) {
      setSubCatModalError("Please select a parent Category.");
      return;
    }
    if (!trimmedSub) {
      setSubCatModalError("Subcategory name cannot be empty.");
      return;
    }

    setAddingSubCat(true);
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/expense-subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedSub,
          category: targetParentCat,
          expenseType: expenseType,
          createdBy: currentusers.name || currentusers.username || (isSuperAdmin ? "SuperAdmin" : "FinancialHead"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubCatModalError(json.message || "Failed to add subcategory.");
      } else {
        if (category !== targetParentCat) {
          setCategory(targetParentCat);
        }
        await fetchSubCategories();
        setSubCategory(trimmedSub);
        setNewSubCatName("");
        setIsAddSubCatModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding subcategory:", err);
      setSubCatModalError("Network error: Could not add subcategory.");
    } finally {
      setAddingSubCat(false);
    }
  };
  
  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  
  // Image Upload States
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadNotice, setUploadNotice] = useState("");

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const categories = useMemo(() => {
    const defaultList = expenseType === "direct" ? DIRECT_EXPENSE_CATS : INDIRECT_EXPENSE_CATS;
    const customList = expenseType === "direct" ? customDirectCats : customIndirectCats;

    // Combine avoiding duplicates
    const combined = [...defaultList];
    const existingValues = new Set(defaultList.map((c) => c.value.toLowerCase()));

    customList.forEach((c) => {
      if (!existingValues.has(c.value.toLowerCase())) {
        combined.push(c);
        existingValues.add(c.value.toLowerCase());
      }
    });

    return combined;
  }, [expenseType, customDirectCats, customIndirectCats]);

  // Reset category when tab switches
  useEffect(() => {
    setCategory("");
  }, [expenseType]);

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = getFilesFromDragEvent(e);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    setUploadErrors([]);
    setUploadNotice("");

    try {
      const remainingSlots = IMAGE_CONFIG.MAX_FILES - images.length;
      if (remainingSlots <= 0) {
        setUploadErrors([`You can only upload up to ${IMAGE_CONFIG.MAX_FILES} images.`]);
        setUploading(false);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      const { images: processedImages, errors: validationErrors } = await processImageFiles(filesToProcess);

      if (validationErrors.length > 0) {
        setUploadErrors(validationErrors);
      }

      if (processedImages.length > 0) {
        setImages((prev) => [...prev, ...processedImages]);

        const compressedImages = processedImages.filter((image) => image.compressed);
        if (compressedImages.length > 0) {
          const originalBytes = compressedImages.reduce((sum, image) => sum + image.originalSize, 0);
          const compressedBytes = compressedImages.reduce((sum, image) => sum + image.size, 0);
          const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
          setUploadNotice(
            `${compressedImages.length} image${compressedImages.length === 1 ? " was" : "s were"} compressed from ${formatMb(originalBytes)} to ${formatMb(compressedBytes)}.`,
          );
        }
      }
    } catch (error) {
      setUploadErrors(["Error processing images. Please try again."]);
      console.error("Image upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadNotice("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!category) {
      setStatusMessage({ type: "error", text: "Please select a Category." });
      return;
    }

    const targetBranch = canSelectStore ? branch : (currentusers.locCode || "759");
    if (!targetBranch) {
      setStatusMessage({ type: "error", text: "Please select a Branch." });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Amount." });
      return;
    }

    if (splitPayment) {
      const total = parseFloat(cashAmount || 0) + parseFloat(bankAmount || 0) + parseFloat(upiAmount || 0);
      if (Math.abs(total - parseFloat(amount || 0)) > 0.01) {
        setStatusMessage({ type: "error", text: "Sum of Cash, Bank, and UPI must equal the total Amount." });
        return;
      }
    }

    if (images.length === 0) {
      setStatusMessage({ type: "error", text: "Please upload at least one Attachment." });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      type: "Expense",
      expenseType: expenseType, // "direct" | "indirect"
      category: category,
      subCategory: subCategory.trim() || "",
      remark: remarks.trim() ? `[${expenseType.toUpperCase()}] ${remarks.trim()}` : `[${expenseType.toUpperCase()}] ${category}${subCategory ? ` - ${subCategory}` : ""}`,
      locCode: targetBranch,
      isAdminLevel: canSelectStore,
      amount: `-${amount}`,
      cash: splitPayment ? `-${cashAmount || "0"}` : paymentMethod === "cash" ? `-${amount}` : "0",
      bank: splitPayment ? `-${bankAmount || "0"}` : paymentMethod === "bank" ? `-${amount}` : "0",
      upi:  splitPayment ? `-${upiAmount  || "0"}` : paymentMethod === "upi"  ? `-${amount}` : "0",
      paymentMethod: splitPayment ? "split" : paymentMethod,
      bankAccount: (paymentMethod === "bank" || splitPayment) ? bankAccount : "",
      date: new Date().toISOString().split("T")[0],
      attachment: images[0]?.base64 || null,
    };

    try {
      const res = await fetch(`${baseUrl.baseUrl}user/createPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: json?.message || "Failed to save expense." });
      } else {
        setStatusMessage({
          type: "success",
          text: `${expenseType === "direct" ? "Direct" : "Indirect"} Expense saved successfully!`,
        });
        handleCancel();
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error: Failed to save expense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCategory("");
    if (canSelectStore) setBranch("");
    setAmount("");
    setRemarks("");
    setPaymentMethod("bank");
    setSplitPayment(false);
    setCashAmount("");
    setBankAmount("");
    setUpiAmount("");
    setBankAccount("");
    setImages([]);
    setUploadErrors([]);
    setUploadNotice("");
    navigate("/record-expense");
  };

  return (
    <div className={`min-h-screen bg-[#FAFAFB] transition-all duration-300 ${isSidebarOpen ? "md:ml-64 ml-0" : "ml-0"}`}>
      <div className="w-full px-6 sm:px-10 py-8">
        
        {/* Top Header: Sidebar Menu Toggle, Back Button & Direct / Indirect Expense Pill Switch */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs cursor-pointer transition-colors"
            title="Toggle Sidebar Menu"
          >
            <Menu size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/record-expense")}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs cursor-pointer transition-colors"
            title="Back to Expense List"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="inline-flex bg-[#EBECEF] p-1 rounded-full border border-gray-200/70 shadow-xs">
            <button
              type="button"
              onClick={() => setExpenseType("direct")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                expenseType === "direct"
                  ? "bg-white text-gray-900 shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
            >
              Direct Expense
            </button>
            <button
              type="button"
              onClick={() => setExpenseType("indirect")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                expenseType === "indirect"
                  ? "bg-white text-gray-900 shadow-xs font-semibold"
                  : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
            >
              Indirect Expense
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
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

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Category, Sub Category, Branch, Amount (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Category <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={categories}
                    placeholder="Select Category"
                    searchPlaceholder="Search category..."
                    icon={Layers}
                  />
                </div>
                {canManageCategories && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatModalError("");
                      setNewCatName("");
                      setIsAddCatModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-full bg-[#8A2BE2] hover:bg-[#7822c9] text-white p-0 shrink-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:scale-105 active:scale-95"
                    style={{
                      display: "grid",
                      placeItems: "center",
                    }}
                    title={`Add new ${expenseType} category`}
                  >
                    <Plus size={22} strokeWidth={2.7} className="m-auto block" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Sub Category
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    value={subCategory}
                    onChange={(val) => setSubCategory(val)}
                    options={subCategoriesList}
                    placeholder={category ? (subCategoriesList.length > 0 ? "Select Sub Category" : "No subcategories (optional)") : "Select category first"}
                    searchPlaceholder="Search subcategory..."
                    icon={Layers}
                  />
                </div>
                {canManageCategories && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubCatModalError("");
                      setNewSubCatName("");
                      setSubCatParentCategory(category || "");
                      setIsAddSubCatModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-full bg-[#8A2BE2] hover:bg-[#7822c9] text-white p-0 shrink-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:scale-105 active:scale-95"
                    style={{
                      display: "grid",
                      placeItems: "center",
                    }}
                    title={`Add subcategory for ${category || `${expenseType} category`}`}
                  >
                    <Plus size={22} strokeWidth={2.7} className="m-auto block" />
                  </button>
                )}
              </div>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Branch <span className="text-red-500 font-bold">*</span>
              </label>
              <SearchableSelect
                value={branch || (canSelectStore ? "" : (currentusers.locCode || "759"))}
                onChange={(val) => setBranch(val)}
                options={fallbackLocations.map((loc) => ({
                  value: loc.locCode,
                  label: loc.locName,
                }))}
                placeholder="Select Branch"
                searchPlaceholder="Search branch..."
                disabled={!canSelectStore}
                icon={Building2}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Amount <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative w-full h-12 flex items-center rounded-xl border border-gray-200 bg-white px-3.5 transition-all duration-200 focus-within:border-[#9B48D7] focus-within:ring-4 focus-within:ring-purple-500/10 hover:border-gray-300">
                <IndianRupee size={16} className="text-gray-400 shrink-0 select-none mr-2" />
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
                />
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount("")}
                    className="p-1 text-gray-300 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0 ml-1"
                    title="Clear amount"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Way of Payment */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-3 uppercase">
              Way of Payment
            </label>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { id: "cash", label: "Cash", icon: <MdCurrencyRupee size={18} /> },
                { id: "bank", label: "Bank", icon: <BsBank2 size={16} /> },
                { id: "upi",  label: "UPI",  icon: <span className="font-bold italic text-sm">UPI</span> },
              ].map(({ id, label, icon }) => {
                const active = !splitPayment && paymentMethod === id;
                return (
                  <label 
                    key={id} 
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${
                      active 
                        ? 'border-[#9B48D7] bg-[#faf5ff] text-[#9B48D7] font-semibold ring-2 ring-purple-500/20 shadow-xs' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 font-medium'
                    } cursor-pointer select-none transition-all`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={active}
                      onChange={() => { setPaymentMethod(id); setSplitPayment(false); }}
                      className="w-4 h-4 accent-[#9B48D7]"
                    />
                    <span className="flex items-center gap-1.5 text-sm">
                      {icon} {label}
                    </span>
                  </label>
                );
              })}

              <label 
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${
                  splitPayment 
                    ? 'border-[#9B48D7] bg-[#faf5ff] text-[#9B48D7] font-semibold ring-2 ring-purple-500/20 shadow-xs' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 font-medium'
                } cursor-pointer select-none transition-all`}
              >
                <input 
                  type="checkbox" 
                  checked={splitPayment} 
                  onChange={() => setSplitPayment(!splitPayment)}
                  className="w-4 h-4 accent-[#9B48D7]" 
                />
                <span className="text-sm">Split Payment (Cash + Bank + UPI)</span>
              </label>
            </div>

            {/* Bank Account Dropdown - shown when Bank is selected or in Split Payment */}
            {(paymentMethod === "bank" || splitPayment) && (
              <div className="mt-4 max-w-xs">
                <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                  Bank Account <span className="text-red-500 font-bold">*</span>
                </label>
                <SearchableSelect
                  value={bankAccount}
                  onChange={(val) => setBankAccount(val)}
                  options={BANK_ACCOUNTS}
                  placeholder="Select Bank Account"
                  searchPlaceholder="Search bank account..."
                  icon={BsBank2}
                />
              </div>
            )}

            {splitPayment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-purple-50/20 p-4 rounded-xl border border-purple-100">
                {[
                  ["Cash", cashAmount, setCashAmount], 
                  ["Bank", bankAmount, setBankAmount], 
                  ["UPI", upiAmount, setUpiAmount]
                ].map(([lbl, val, setVal]) => (
                  <div key={lbl}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">{lbl} Amount</label>
                    <div className="relative flex items-center rounded-xl border border-gray-200 bg-white px-3 h-11 focus-within:border-[#9B48D7] focus-within:ring-2 focus-within:ring-purple-500/10">
                      <span className="text-gray-400 text-sm mr-1.5">Γé╣</span>
                      <input 
                        type="number" 
                        step="any"
                        value={val} 
                        onChange={e => setVal(e.target.value)} 
                        placeholder="0.00"
                        className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Attachment (Left) and Remarks (Right) (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            
            {/* Attachment */}
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Attachment <span className="text-red-500 font-bold">*</span>
              </label>

              {/* Upload Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-2xl p-6 bg-white flex flex-col items-center justify-center text-center min-h-[220px] transition-all duration-200 ${
                  dragActive
                    ? "border-[#9B48D7] bg-purple-50/20"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/10"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#9B48D7] mb-3">
                  <UploadCloud size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Drag image(s) here or browse images
                </p>
                <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">
                  Up to 15 images. Large images up to 30MB are compressed automatically.
                </p>

                <button
                  type="button"
                  onClick={() => triggerFileInput(fileInputRef)}
                  disabled={uploading}
                  className="mt-4 rounded-xl bg-[#1E232A] hover:bg-black text-white px-6 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? "Compressing..." : "Upload Images"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.heic,.heif"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>

              {/* Error messages if any */}
              {uploadErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-500 font-medium">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {uploadNotice && (
                <p className="mt-2 text-xs text-emerald-700 font-medium" role="status">
                  {uploadNotice}
                </p>
              )}

              {/* Uploaded Images Thumbnails */}
              {images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-500">
                    Uploaded Images ({images.length}/{IMAGE_CONFIG.MAX_FILES})
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square shadow-2xs"
                      >
                        <img
                          src={img.base64 || img}
                          alt={img.name || `Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.compressed && (
                          <span className="absolute bottom-1 left-1 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            Compressed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-2 uppercase">
                Remarks
              </label>
              <div className="relative flex-1">
                <textarea
                  placeholder="Enter remarks or details about this expense..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full h-[220px] rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10 hover:border-gray-300 transition-all duration-200 resize-none font-normal leading-relaxed"
                />
              </div>
            </div>

          </div>

          {/* Row 3: Action Buttons (Bottom Left) */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-8 py-2.5 text-sm font-semibold transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Expense</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-7 py-2.5 text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>

        {/* Modal for Super Admin & Financial Head to Add Category */}
        {isAddCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Plus size={18} className="text-[#9B48D7]" />
                  <span>Add New {expenseType === "direct" ? "Direct" : "Indirect"} Category</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Courier & Freight, Software Licensing..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Will be saved permanently as an active {expenseType} category and available to all stores.
                  </p>
                </div>

                {catModalError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                    {catModalError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddCatModalOpen(false)}
                    disabled={addingCat}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingCat || !newCatName.trim()}
                    className="rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {addingCat ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Super Admin & Financial Head to Add Subcategory */}
        {isAddSubCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Plus size={18} className="text-[#9B48D7]" />
                  <span>Add New Sub Category</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubCatModalOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubCategorySubmit} className="mt-5 space-y-4">
                {/* Select Parent Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={subCatParentCategory}
                    onChange={(val) => setSubCatParentCategory(val)}
                    options={categories}
                    placeholder="Select Parent Category"
                    searchPlaceholder="Search category..."
                    icon={Layers}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    The subcategory will be tied exclusively to this {expenseType} category.
                  </p>
                </div>

                {/* Subcategory Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Sub Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Courier charges - DHL, Fiber Net..."
                    value={newSubCatName}
                    onChange={(e) => setNewSubCatName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#9B48D7] focus:ring-4 focus:ring-purple-500/10"
                  />
                </div>

                {subCatModalError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                    {subCatModalError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSubCatModalOpen(false)}
                    disabled={addingSubCat}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingSubCat || !newSubCatName.trim() || !subCatParentCategory}
                    className="rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-5 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {addingSubCat ? "Adding..." : "Add Sub Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DirectIndirectExpenses;

