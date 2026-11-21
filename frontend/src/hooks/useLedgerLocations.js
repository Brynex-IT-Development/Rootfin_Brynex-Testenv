import { useEffect, useState } from "react";
import baseUrl from "../api/api.js";
import ledgerStores from "../data/ledgerStores.js";

// Locations for the ledger forms: the built-in list plus any store added in
// Manage Stores (loaded from /api/stores), so new stores show up automatically.
const useLedgerLocations = () => {
  const [locations, setLocations] = useState(ledgerStores);

  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      try {
        const res = await fetch(`${baseUrl.baseUrl}api/stores`);
        if (!res.ok) return;
        const data = await res.json();
        const stores = Array.isArray(data?.stores) ? data.stores : [];

        const knownCodes = new Set(ledgerStores.map((l) => String(l.locCode)));
        const extra = stores
          .filter((s) => s.locCode && s.isActive !== false && !knownCodes.has(String(s.locCode)))
          .map((s) => ({ locName: s.name, locCode: String(s.locCode) }));

        if (!cancelled && extra.length) {
          setLocations([...ledgerStores, ...extra]);
        }
      } catch (err) {
        console.warn("Could not load stores for ledger locations:", err);
      }
    };

    loadStores();
    return () => {
      cancelled = true;
    };
  }, []);

  return locations;
};

export default useLedgerLocations;
