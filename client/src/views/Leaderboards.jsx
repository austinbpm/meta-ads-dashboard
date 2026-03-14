import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../DataContext';
import { aggregateRows } from '../utils/calculations';
import { HOOKS, SCROLL_STOPPERS, CLAIMS, CTAS, ENVIRONMENTS } from '../config/lookups';
import { exportCsv } from '../utils/exportCsv';
import { subDays, parseISO, isAfter } from 'date-fns';

const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
const fmtCur = (v) => v == null ? '—' : `$${v.toFixed(2)}`;
const fmtInt = (v) => v == null ? '—' : Number(v).toLocaleString();

// ─── Generic leaderboard table ──────────────────────────────────────────────

function LeaderboardTable({ title, rows, columns, onRowClick, onExport }) {
  return (
    <div style={styles.board}>
      <div style={styles.boardHeader}>
        <h3 style={styles.boardTitle}>{title}</h3>
        <button style={styles.exportBtn} onClick={onExport}>⬇ CSV</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={styles.th}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row._key}
                style={styles.tr}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ ...styles.td, color: c.color ? c.color(row[c.key]) : '#fff' }}>
                    {c.fmt ? c.fmt(row[c.key]) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ ...styles.td, textAlign: 'center', color: '#8899BB', padding: 24 }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Grouping helpers ────────────────────────────────────────────────────────

function groupBy(rows, keyFn) {
  const groups = {};
  rows.forEach((r) => {
    const k = keyFn(r);
    if (!k) return;
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  return groups;
}

function last30(rows) {
  const cutoff = subDays(new Date(), 30);
  return rows.filter((r) => r.date && isAfter(parseISO(r.date), cutoff));
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function Leaderboards() {
  const { rows, loading, error } = useData();
  const navigate                  = useNavigate();
  const [period, setPeriod]       = useState('all'); // 'all' | '30d'

  const data = useMemo(() => period === '30d' ? last30(rows) : rows, [rows, period]);

  // ── 1. Hook Leaderboard ────────────────────────────────────────────────────
  const hookBoard = useMemo(() => {
    const groups = groupBy(data, (r) => r.parsed?.hookCode);
    return Object.entries(groups)
      .map(([code, rs], i) => {
        const agg = aggregateRows(rs);
        return { _key: code, rank: i + 1, code, text: HOOKS[code] || code, ...agg };
      })
      .sort((a, b) => (b.avgHookRate ?? -1) - (a.avgHookRate ?? -1))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data]);

  // ── 2. Scroll Stopper Leaderboard ─────────────────────────────────────────
  const ssBoard = useMemo(() => {
    const groups = groupBy(data, (r) => r.parsed?.scrollStopperCode);
    return Object.entries(groups)
      .map(([code, rs]) => {
        const agg = aggregateRows(rs);
        return { _key: code, code, text: SCROLL_STOPPERS[code] || code, ...agg };
      })
      .sort((a, b) => (b.avgSSRetention ?? -1) - (a.avgSSRetention ?? -1))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data]);

  // ── 3. Claim Leaderboard ───────────────────────────────────────────────────
  const claimBoard = useMemo(() => {
    const groups = groupBy(data, (r) => r.parsed?.claimCode);
    return Object.entries(groups)
      .map(([code, rs]) => {
        const agg = aggregateRows(rs);
        return { _key: code, code, text: CLAIMS[code] || code, ...agg };
      })
      .sort((a, b) => (b.avgHoldRate ?? -1) - (a.avgHoldRate ?? -1))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data]);

  // ── 4. CTA Leaderboard ────────────────────────────────────────────────────
  const ctaBoard = useMemo(() => {
    const groups = groupBy(data, (r) => r.parsed?.ctaCode);
    return Object.entries(groups)
      .map(([code, rs]) => {
        const agg = aggregateRows(rs);
        return { _key: code, code, text: CTAS[code] || code, ...agg };
      })
      .sort((a, b) => (b.avgCTR ?? -1) - (a.avgCTR ?? -1))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data]);

  // ── 5. Environment Leaderboard ────────────────────────────────────────────
  const envBoard = useMemo(() => {
    const groups = groupBy(data, (r) => r.parsed?.envCode);
    return Object.entries(groups)
      .map(([code, rs]) => {
        const agg = aggregateRows(rs);
        // Best hook = hook with lowest CPL among ads in this env
        const hookGroups = groupBy(rs, (r) => r.parsed?.hookCode);
        let bestHook = null, bestCPL = Infinity;
        Object.entries(hookGroups).forEach(([hCode, hrs]) => {
          const hAgg = aggregateRows(hrs);
          if (hAgg.avgCPL != null && hAgg.avgCPL < bestCPL) {
            bestCPL = hAgg.avgCPL;
            bestHook = hCode;
          }
        });
        return { _key: code, code, env: ENVIRONMENTS[code] || code, bestHook, ...agg };
      })
      .sort((a, b) => {
        if (a.avgCPL == null) return 1;
        if (b.avgCPL == null) return -1;
        return a.avgCPL - b.avgCPL; // ascending — lower CPL is better
      })
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data]);

  // Drill-through: navigate to Ad Table with a filter pre-applied
  // (we pass state via navigate; AdTable will need to handle this)
  function drillHook(row)  { navigate('/', { state: { hook: row.code } }); }
  function drillSS(row)    { navigate('/', { state: { scrollStopper: row.code } }); }
  function drillClaim(row) { navigate('/', { state: { claim: row.code } }); }
  function drillCTA(row)   { navigate('/', { state: { cta: row.code } }); }
  function drillEnv(row)   { navigate('/', { state: { env: row.code } }); }

  if (loading) return <div style={styles.msg}>Loading…</div>;
  if (error)   return <div style={{ ...styles.msg, color: '#FF6B6B' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <h2 style={styles.title}>Component Leaderboards</h2>
        <div style={styles.toggle}>
          <button style={{ ...styles.toggleBtn, ...(period === 'all' ? styles.toggleActive : {}) }} onClick={() => setPeriod('all')}>All Time</button>
          <button style={{ ...styles.toggleBtn, ...(period === '30d' ? styles.toggleActive : {}) }} onClick={() => setPeriod('30d')}>Last 30 Days</button>
        </div>
      </div>

      {/* 1. Hook */}
      <LeaderboardTable
        title="1 · Hook Leaderboard (ranked by Avg Hook Rate)"
        rows={hookBoard}
        onRowClick={drillHook}
        onExport={() => exportCsv(hookBoard, 'hook_leaderboard.csv')}
        columns={[
          { key: 'rank',         label: '#',              fmt: (v) => v },
          { key: 'code',         label: 'Code',           fmt: (v) => v },
          { key: 'text',         label: 'Hook Text',      fmt: (v) => v },
          { key: 'avgHookRate',  label: 'Avg Hook Rate',  fmt: fmtPct },
          { key: 'avgHoldRate',  label: 'Avg Hold Rate',  fmt: fmtPct },
          { key: 'avgCPL',       label: 'Avg CPL',        fmt: fmtCur },
          { key: 'totalSpend',   label: 'Total Spend',    fmt: fmtCur },
          { key: 'count',        label: '# Ads',          fmt: fmtInt },
        ]}
      />

      {/* 2. Scroll Stopper */}
      <LeaderboardTable
        title="2 · Scroll Stopper Leaderboard (ranked by 3-sec → 25% Retention)"
        rows={ssBoard}
        onRowClick={drillSS}
        onExport={() => exportCsv(ssBoard, 'ss_leaderboard.csv')}
        columns={[
          { key: 'rank',           label: '#',               fmt: (v) => v },
          { key: 'code',           label: 'Code',            fmt: (v) => v },
          { key: 'text',           label: 'SS Text',         fmt: (v) => v },
          { key: 'avgSSRetention', label: 'Avg SS Retention',fmt: fmtPct },
          { key: 'avgHookRate',    label: 'Avg Hook Rate',   fmt: fmtPct },
          { key: 'avgCPL',         label: 'Avg CPL',         fmt: fmtCur },
          { key: 'totalSpend',     label: 'Total Spend',     fmt: fmtCur },
          { key: 'count',          label: '# Ads',           fmt: fmtInt },
        ]}
      />

      {/* 3. Claim */}
      <LeaderboardTable
        title="3 · Claim Leaderboard (ranked by Avg Hold Rate)"
        rows={claimBoard}
        onRowClick={drillClaim}
        onExport={() => exportCsv(claimBoard, 'claim_leaderboard.csv')}
        columns={[
          { key: 'rank',        label: '#',             fmt: (v) => v },
          { key: 'code',        label: 'Code',          fmt: (v) => v },
          { key: 'text',        label: 'Claim',         fmt: (v) => v },
          { key: 'avgHoldRate', label: 'Avg Hold Rate', fmt: fmtPct },
          { key: 'avgCPL',      label: 'Avg CPL',       fmt: fmtCur },
          { key: 'totalSpend',  label: 'Total Spend',   fmt: fmtCur },
          { key: 'count',       label: '# Ads',         fmt: fmtInt },
        ]}
      />

      {/* 4. CTA */}
      <LeaderboardTable
        title="4 · CTA Leaderboard (ranked by Avg CTR)"
        rows={ctaBoard}
        onRowClick={drillCTA}
        onExport={() => exportCsv(ctaBoard, 'cta_leaderboard.csv')}
        columns={[
          { key: 'rank',       label: '#',         fmt: (v) => v },
          { key: 'code',       label: 'Code',      fmt: (v) => v },
          { key: 'text',       label: 'CTA',       fmt: (v) => v },
          { key: 'avgCTR',     label: 'Avg CTR',   fmt: fmtPct },
          { key: 'avgCPL',     label: 'Avg CPL',   fmt: fmtCur },
          { key: 'totalSpend', label: 'Total Spend',fmt: fmtCur },
          { key: 'count',      label: '# Ads',     fmt: fmtInt },
        ]}
      />

      {/* 5. Environment */}
      <LeaderboardTable
        title="5 · Environment Leaderboard (ranked by Avg CPL ascending)"
        rows={envBoard}
        onRowClick={drillEnv}
        onExport={() => exportCsv(envBoard, 'env_leaderboard.csv')}
        columns={[
          { key: 'rank',        label: '#',             fmt: (v) => v },
          { key: 'env',         label: 'Environment',   fmt: (v) => v },
          { key: 'avgHookRate', label: 'Avg Hook Rate', fmt: fmtPct },
          { key: 'avgHoldRate', label: 'Avg Hold Rate', fmt: fmtPct },
          { key: 'avgCPM',      label: 'Avg CPM',       fmt: fmtCur },
          { key: 'avgCPL',      label: 'Avg CPL',       fmt: fmtCur },
          { key: 'totalSpend',  label: 'Total Spend',   fmt: fmtCur },
          { key: 'count',       label: '# Ads',         fmt: fmtInt },
          { key: 'bestHook',    label: 'Best Hook',     fmt: (v) => v || '—' },
        ]}
      />
    </div>
  );
}

const styles = {
  container: { padding: '0 24px 48px' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700 },
  toggle: { display: 'flex', gap: 0, border: '1px solid #1e3060', borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { background: '#1a2d58', color: '#8899BB', border: 'none', padding: '7px 16px', fontSize: 13, cursor: 'pointer' },
  toggleActive: { background: '#00C9A7', color: '#0D1B3E', fontWeight: 700 },
  board: { marginTop: 28 },
  boardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  boardTitle: { fontSize: 15, fontWeight: 700, color: '#8899BB' },
  exportBtn: { background: '#1a2d58', color: '#fff', border: '1px solid #1e3060', borderRadius: 6, padding: '4px 12px', fontSize: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: '#1a2d58', color: '#8899BB', fontWeight: 600, padding: '9px 12px', textAlign: 'left', borderBottom: '1px solid #1e3060', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #1e3060', cursor: 'pointer', transition: 'background 0.1s' },
  td: { padding: '9px 12px', verticalAlign: 'middle' },
  msg: { padding: 40, textAlign: 'center', color: '#8899BB' },
};
