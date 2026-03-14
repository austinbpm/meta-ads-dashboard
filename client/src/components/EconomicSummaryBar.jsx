import React from 'react';
import { useData } from '../DataContext';
import { CPL_TARGET } from '../config/thresholds';

const fmt = {
  currency: (v) => v == null ? '—' : `$${v.toFixed(2)}`,
  pct:      (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`,
  int:      (v) => v == null ? '—' : v.toLocaleString(),
};

function Tile({ label, value, sub, color }) {
  return (
    <div style={styles.tile}>
      <span style={{ ...styles.value, color: color || '#fff' }}>{value}</span>
      <span style={styles.label}>{label}</span>
      {sub && <span style={styles.sub}>{sub}</span>}
    </div>
  );
}

export default function EconomicSummaryBar({ onRefresh }) {
  const { summary, loading, refreshedAt } = useData();

  const cplColor = summary.blendedCPL == null
    ? '#fff'
    : summary.blendedCPL <= CPL_TARGET ? '#00C9A7' : '#FF6B6B';

  const ts = refreshedAt ? new Date(refreshedAt).toLocaleTimeString() : null;

  return (
    <div style={styles.bar}>
      <div style={styles.tiles}>
        <Tile label="Total Spend"   value={fmt.currency(summary.totalSpend)} />
        <Tile label="Total Leads"   value={fmt.int(summary.totalLeads)} />
        <Tile
          label="Blended CPL"
          value={fmt.currency(summary.blendedCPL)}
          sub={`Target: $${CPL_TARGET.toFixed(2)}`}
          color={cplColor}
        />
        <Tile label="Avg CPM"       value={fmt.currency(summary.avgCPM)} />
        <Tile label="Avg Hook Rate" value={fmt.pct(summary.avgHookRate)} />
        <Tile label="Avg Hold Rate" value={fmt.pct(summary.avgHoldRate)} />

        {/* Fatigue badge */}
        <div style={styles.tile}>
          <span style={styles.value}>
            {summary.fatigueCount > 0
              ? <span style={styles.badge}>{summary.fatigueCount}</span>
              : <span style={{ color: '#00C9A7' }}>0</span>}
          </span>
          <span style={styles.label}>Fatigue Alerts</span>
        </div>
      </div>

      <div style={styles.actions}>
        {ts && <span style={styles.ts}>Updated {ts}</span>}
        <button style={styles.btn} onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading…' : '⟳ Refresh'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#132244',
    borderBottom: '1px solid #1e3060',
    padding: '10px 20px',
    gap: 12,
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  tiles: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 90,
  },
  value: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  label: {
    fontSize: 11,
    color: '#8899BB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: 2,
  },
  sub: {
    fontSize: 10,
    color: '#8899BB',
  },
  badge: {
    background: '#FF6B6B',
    color: '#fff',
    borderRadius: 10,
    padding: '1px 8px',
    fontSize: 14,
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  ts: {
    fontSize: 11,
    color: '#8899BB',
  },
  btn: {
    background: '#1a2d58',
    color: '#fff',
    border: '1px solid #1e3060',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    transition: 'background 0.15s',
  },
};
