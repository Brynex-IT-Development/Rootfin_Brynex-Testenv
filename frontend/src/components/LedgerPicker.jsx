import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Search, Check } from "lucide-react";

// Note: index.css has an unlayered global rule that forces every non-submit
// <button> to display:inline-block, inherit font-size and use a transparent
// border. The "!" suffix on a few utilities below (flex!, text-sm!,
// border-gray-200!) wins over that rule.

/**
 * Searchable dropdown for the ledger forms (vendor, subscription), with an
 * optional "Add New" action at the bottom.
 *
 * items:    [{ id, name, detail? }]  detail is a second, smaller line
 * onAddNew: (searchText) => void     shown only when given
 * text:     { placeholder, loading, search, empty, addNew: (searchText) => label }
 */
const LedgerPicker = ({ items, loading, value, onChange, onAddNew, icon: Icon, text }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const selected = items.find((item) => item.id === value);

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
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || (item.detail || "").toLowerCase().includes(query)
      )
    : items;

  const choose = (item) => {
    onChange(item);
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
        <span className="flex-1 min-w-0 truncate font-medium text-gray-800">
          {selected ? selected.name : loading ? text.loading : text.placeholder}
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
                placeholder={text.search}
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#9B48D7] transition-colors"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                {items.length === 0 ? text.empty : `No matches for "${search.trim()}"`}
              </li>
            ) : (
              filtered.map((item) => {
                const isSelected = item.id === value;
                return (
                  <li key={item.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(item)}
                      className={`flex! items-center gap-3 w-full px-3 py-2 text-left text-sm! transition-colors ${
                        isSelected ? "bg-purple-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-8 h-8 shrink-0 rounded-full bg-purple-100 text-[#9B48D7] flex items-center justify-center">
                        <Icon size={14} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium text-gray-800">{item.name}</span>
                        {item.detail && (
                          <span className="block text-xs text-gray-500 truncate">{item.detail}</span>
                        )}
                      </span>
                      {isSelected && <Check size={16} className="shrink-0 text-[#9B48D7]" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {onAddNew && (
            <div className="border-t border-gray-100 p-1.5">
              <button
                type="button"
                onClick={addNew}
                className="flex! items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm! font-semibold text-[#9B48D7] hover:bg-purple-50 transition-colors"
              >
                <Plus size={16} className="shrink-0" />
                <span className="truncate">{text.addNew(search.trim())}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LedgerPicker;
