import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { computeRow, adStatus, detectFatigued, economicSummary } from './utils/calculations';
import { parseAdName } from './utils/nameParser';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [raw, setRaw]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/ads');
      setRaw(res.data.data);
      setRefreshedAt(res.data.refreshedAt);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Enrich rows with computed metrics + parsed name + status
  const rows = raw.map((r) => {
    const computed = computeRow(r);
    const parsed   = parseAdName(r.ad_name);
    return { ...computed, parsed, status: adStatus(computed) };
  });

  const fatigued      = detectFatigued(rows);
  const summary       = economicSummary(rows, fatigued.length);

  return (
    <DataContext.Provider value={{ rows, summary, fatigued, loading, error, refresh, refreshedAt }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
