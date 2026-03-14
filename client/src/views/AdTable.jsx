import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import FilterBar, { defaultFilters, applyFilters } from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import WaterfallChart from '../components/WaterfallChart';
import { HOOK_RATE, HOLD_RATE } from '../config/thresholds';
import { exportCsv } from '../utils/exportCsv';

const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
const fmtCur = (v) => v == null ? '—' : `$${v.toFixed(2)}`;
const fmtInt = (v) => v == null ? '—' : Number(v).toLocaleString();

function hookRateColor(v, impressions) {
  if (impressions < 1000) return '#8899BB';
  if (v >= HOOK_RATE.GREEN)  return '#00C9A7';
  if (v >= HOOK_RATE.YELLOW) return '#FFD166';
  return '#FF6B6B';
}
function holdRateColor(v) {
  if (v == null) return '#8899BB';
  if (v >= HOLD_RATE.GREEN)  return '#00C9A7';
  if (v >= HOLD_RATE.YELLOW) return '#FFD166';
  return '#FF6B6B';
}

const COLS = [
  { key: 'ad_name',          label: 'Ad Name',         fmt: (v) => v },
  { key: '_env',             label: 'Environment',     fmt: (_, r) => r.parsed?.env || '—' },
  { key: '_hook',            label: 'Hook',            fmt: (_, r) => r.parsed?.hookCode ? `${r.parsed.hookCode}` : '—' },
  { key: '_ss',              label: 'Scroll Stopper',  fmt: (_, r) => r.parsed?.scrollStopperCode || '—' },
  { key: '_format',          label: 'Format',          fmt: (_, r) => r.parsed?.format || '—' },
  { key: '_actor',           label: 'Actor',           fmt: (_, r) => r.parsed?.actor || '—' },
  { key: 'impressions',      label: 'Impressions',     fmt: fmtInt },
  { key: 'calc_hook_rate',   label: 'Hook Rate',       fmt: fmtPct },
  { key: 'calc_hold_rate',   label: 'Hold Rate',       fmt: fmtPct },
  { key: 'calc_cpl',         label: 'CPL',             fmt: fmtCur },
  { key: 'cpm',              label: 'CPM',             fmt: fmtCur },
  { key: 'amount_spent',     label: 'Spend',           fmt: fmtCur },
  { key: 'status',           label: 'Status',          fmt: (v) => v },
];

export default function AdTable() {
  const { rows, loading, error } = useData();
  const [filters, setFilters]   = useState(defaultFilters());
  const [sortKey, setSortKey]   = useState('amount_spent');
  const [sortDir, setSortDir]   = useState('desc');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      // Handle derived keys
      if (sortKey === '_env')    { av = a.parsed?.env || ''; bv = b.parsed?.env || ''; }
      if (sortKey === '_hook')   { av = a.parsed?.hookCode || ''; bv = b.parsed?.hookCode || ''; }
      if (sortKey === '_ss')     { av = a.parsed?.scrollStopperCode || ''; bv = b.parsed?.scrollStopperCode || ''; }
      if (sortKey === '_format') { av = a.parsed?.format || ''; bv = b.parsed?.format || ''; }
      if (sortKey === '_actor')  { av = a.parsed?.actor || ''; bv = b.parsed?.actor || ''; }
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'asc'
        ? (av < bv ? -1 : av > bv ? 1 : 0)
        : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function handleExport() {
    const exportRows = sorted.map((r) => ({
      ad_name:       r.ad_name,
      environment:   r.parsed?.env || '',
      hook:          r.parsed?.hookCode || '',
      hook_label:    r.parsed?.hook || '',
      scroll_stopper:r.parsed?.scrollStopperCode || '',
      ss_label:      r.parsed?.scrollStopper || '',
      format:        r.parsed?.format || '',
      actor:         r.parsed?.actor || '',
      impressions:   r.impressions,
      hook_rate:     r.calc_hook_rate,
      hold_rate:     r.calc_hold_rate,
      cpl:           r.calc_cpl,
      cpm:           r.cpm,
      spend:         r.amount_spent,
      status:        r.status,
    }));
    exportCsv(exportRows, 'ad_performance.csv');
  }

  if (loading) return <div style={styles.msg}>Loading…</div>;
  if (error)   return <div style={{ ...styles.msg, color: '#FF6B6B' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Ad Performance</h2>
        <button style={styles.exportBtn} onClick={handleExport}>⬇ Export CSV</button>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  style={styles.th}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isExpanded = expanded === row.ad_name;
              return (
                <React.Fragment key={row.ad_name}>
                  <tr
                    style={{ ...styles.tr, background: isExpanded ? '#1a2d58' : undefined }}
                    onClick={() => setExpanded(isExpanded ? null : row.ad_name)}
                  >
                    {COLS.map((col) => {
                      const raw = row[col.key];
                      const display = col.fmt(raw, row);

                      // Color-coded cells
                      let color = '#fff';
                      if (col.key === 'calc_hook_rate') color = hookRateColor(raw, row.impressions);
                      if (col.key === 'calc_hold_rate') color = holdRateColor(raw);
                      if (col.key === 'status') {
                        return (
                          <td key={col.key} style={styles.td}>
                            <StatusBadge status={display} />
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} style={{ ...styles.td, color, maxWidth: col.key === 'ad_name' ? 200 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.key === 'ad_name' ? 'nowrap' : 'normal' }}>
                          {col.key === '_hook'
                            ? <span title={row.parsed?.hook || ''}>{display}</span>
                            : display}
                        </td>
                      );
                    })}
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={COLS.length} style={styles.expandedCell}>
                        <div style={styles.expandedContent}>
                          <div style={styles.expandedMeta}>
                            <strong>Hook:</strong> {row.parsed?.hook || '—'}<br />
                            <strong>Scroll Stopper:</strong> {row.parsed?.scrollStopper || '—'}<br />
                            <strong>Claim:</strong> {row.parsed?.claim || '—'}<br />
                            <strong>CTA:</strong> {row.parsed?.cta || '—'}
                          </div>
                          <WaterfallChart row={row} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {sorted.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...styles.td, textAlign: 'center', color: '#8899BB', padding: 32 }}>No ads match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.count}>{sorted.length} of {rows.length} ads</div>
    </div>
  );
}

const styles = {
  container: { padding: '0 24px 32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20 },
  title: { fontSize: 20, fontWeight: 700 },
  exportBtn: {
    background: '#1a2d58', color: '#fff', border: '1px solid #1e3060',
    borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600,
  },
  tableWrap: { overflowX: 'auto', marginTop: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: '#1a2d58', color: '#8899BB', fontWeight: 600,
    padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
    borderBottom: '1px solid #1e3060', whiteSpace: 'nowrap', userSelect: 'none',
  },
  tr: {
    borderBottom: '1px solid #1e3060', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: { padding: '10px 12px', verticalAlign: 'middle' },
  expandedCell: { background: '#132244', padding: 0 },
  expandedContent: { padding: '16px 24px', borderTop: '2px solid #00C9A7' },
  expandedMeta: { fontSize: 13, color: '#8899BB', marginBottom: 12, lineHeight: 1.8 },
  msg: { padding: 40, textAlign: 'center', color: '#8899BB' },
  count: { marginTop: 10, color: '#8899BB', fontSize: 12 },
};
