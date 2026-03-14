import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import FilterBar, { defaultFilters, applyFilters } from '../components/FilterBar';
import WaterfallChart from '../components/WaterfallChart';
import KPICard from '../components/KPICard';
import { HOOK_RATE, HOLD_RATE } from '../config/thresholds';
import { exportCsv } from '../utils/exportCsv';
import { openingLine } from '../utils/nameParser';

const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
const fmtCur = (v) => v == null ? '—' : `$${v.toFixed(2)}`;

function hookColor(v, impr) {
  if (!impr || impr < 1000) return 'gray';
  if (v >= HOOK_RATE.GREEN)  return 'green';
  if (v >= HOOK_RATE.YELLOW) return 'yellow';
  return 'red';
}
function holdColor(v) {
  if (v == null) return 'gray';
  if (v >= HOLD_RATE.GREEN)  return 'green';
  if (v >= HOLD_RATE.YELLOW) return 'yellow';
  return 'red';
}

const MAX_COMPARE = 3;

function AdCard({ row, selected, onToggle }) {
  const ol = openingLine(row.parsed);
  return (
    <div style={{ ...styles.card, borderColor: selected ? '#00C9A7' : '#1e3060' }}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.adName}>{row.ad_name}</div>
          {ol && <div style={styles.opening}>{ol}</div>}
        </div>
        <button
          style={{ ...styles.compareBtn, background: selected ? '#00C9A7' : '#1a2d58', color: selected ? '#0D1B3E' : '#fff' }}
          onClick={() => onToggle(row.ad_name)}
        >
          {selected ? '✓ Comparing' : '+ Compare'}
        </button>
      </div>

      <div style={styles.kpiRow}>
        <KPICard
          label="Hook Rate"
          value={fmtPct(row.calc_hook_rate)}
          color={hookColor(row.calc_hook_rate, row.impressions)}
        />
        <KPICard
          label="Hold Rate"
          value={fmtPct(row.calc_hold_rate)}
          color={holdColor(row.calc_hold_rate)}
        />
        <KPICard
          label="Cost / ThruPlay"
          value={fmtCur(row.calc_cost_per_thruplay)}
        />
        <KPICard
          label="CPL"
          value={fmtCur(row.calc_cpl)}
          color={row.calc_cpl != null && row.calc_cpl <= 12 ? 'green' : 'red'}
        />
      </div>

      <WaterfallChart row={row} />
    </div>
  );
}

function ComparePanel({ rows, selectedIds, onClose }) {
  const selectedRows = rows.filter((r) => selectedIds.includes(r.ad_name));
  if (!selectedRows.length) return null;

  return (
    <div style={styles.comparePanel}>
      <div style={styles.comparePanelHeader}>
        <h3 style={{ margin: 0 }}>Side-by-Side Comparison</h3>
        <button style={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedRows.length}, 1fr)`, gap: 16 }}>
        {selectedRows.map((row) => (
          <div key={row.ad_name} style={styles.compareCol}>
            <div style={styles.adName}>{row.ad_name}</div>
            <div style={styles.kpiRow}>
              <KPICard label="Hook Rate" value={fmtPct(row.calc_hook_rate)} color={hookColor(row.calc_hook_rate, row.impressions)} />
              <KPICard label="Hold Rate" value={fmtPct(row.calc_hold_rate)} color={holdColor(row.calc_hold_rate)} />
            </div>
            <WaterfallChart row={row} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreativePerformance() {
  const { rows, loading, error } = useData();
  const [filters, setFilters]   = useState(defaultFilters());
  const [selected, setSelected] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  function toggleSelect(adName) {
    setSelected((prev) => {
      if (prev.includes(adName)) return prev.filter((x) => x !== adName);
      if (prev.length >= MAX_COMPARE) return prev; // max 3
      return [...prev, adName];
    });
  }

  function handleExport() {
    exportCsv(filtered.map((r) => ({
      ad_name: r.ad_name,
      hook_rate: r.calc_hook_rate,
      hold_rate: r.calc_hold_rate,
      cost_per_thruplay: r.calc_cost_per_thruplay,
      cpl: r.calc_cpl,
      impressions: r.impressions,
      '3_sec_views': r['3_second_video_views'],
      thruplay: r['video_thruplay'],
    })), 'creative_performance.csv');
  }

  if (loading) return <div style={styles.msg}>Loading…</div>;
  if (error)   return <div style={{ ...styles.msg, color: '#FF6B6B' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Creative Performance</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.length > 0 && (
            <button style={styles.compareOpen} onClick={() => setShowCompare(true)}>
              Compare {selected.length} Ad{selected.length > 1 ? 's' : ''}
            </button>
          )}
          <button style={styles.exportBtn} onClick={handleExport}>⬇ Export CSV</button>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      {selected.length > 0 && (
        <div style={styles.selectedBar}>
          Selected for comparison ({selected.length}/{MAX_COMPARE}):&nbsp;
          {selected.map((id) => (
            <span key={id} style={styles.chip}>
              {id} <button style={styles.chipX} onClick={() => toggleSelect(id)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {showCompare && (
        <ComparePanel rows={rows} selectedIds={selected} onClose={() => setShowCompare(false)} />
      )}

      <div style={styles.grid}>
        {filtered.map((row) => (
          <AdCard
            key={row.ad_name}
            row={row}
            selected={selected.includes(row.ad_name)}
            onToggle={toggleSelect}
          />
        ))}
        {filtered.length === 0 && (
          <div style={styles.empty}>No ads match the current filters.</div>
        )}
      </div>
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
  compareOpen: {
    background: '#00C9A7', color: '#0D1B3E', border: 'none',
    borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 700,
  },
  grid: { display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 },
  card: {
    background: '#132244', border: '1px solid #1e3060', borderRadius: 12,
    padding: 20, transition: 'border-color 0.2s',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  adName: { fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#fff' },
  opening: { fontSize: 12, color: '#8899BB', marginTop: 4 },
  kpiRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  compareBtn: { borderRadius: 6, border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  selectedBar: { background: '#1a2d58', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#8899BB', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { background: '#0D1B3E', border: '1px solid #1e3060', borderRadius: 12, padding: '2px 10px', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 },
  chipX: { background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', padding: 0, fontSize: 11 },
  comparePanel: { background: '#132244', border: '1px solid #00C9A7', borderRadius: 12, padding: 20, marginBottom: 20 },
  comparePanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  closeBtn: { background: 'none', border: '1px solid #1e3060', color: '#8899BB', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  compareCol: { borderRight: '1px solid #1e3060', paddingRight: 16 },
  msg: { padding: 40, textAlign: 'center', color: '#8899BB' },
  empty: { color: '#8899BB', textAlign: 'center', padding: 40 },
};
