import React from 'react';
import { ENVIRONMENTS, HOOKS, SCROLL_STOPPERS, CLAIMS, CTAS, ACTORS, FORMATS } from '../config/lookups';

const ALL = '';

function Select({ label, value, onChange, options }) {
  return (
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
      <select style={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>All</option>
        {Object.entries(options).map(([code, text]) => (
          <option key={code} value={code}>{code} — {text}</option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({ filters, setFilters }) {
  const set = (key) => (val) => setFilters((f) => ({ ...f, [key]: val }));

  return (
    <div style={styles.bar}>
      <Select label="Environment"    value={filters.env}           onChange={set('env')}           options={ENVIRONMENTS} />
      <Select label="Hook"           value={filters.hook}          onChange={set('hook')}           options={HOOKS} />
      <Select label="Scroll Stopper" value={filters.scrollStopper} onChange={set('scrollStopper')} options={SCROLL_STOPPERS} />
      <Select label="Claim"          value={filters.claim}         onChange={set('claim')}          options={CLAIMS} />
      <Select label="CTA"            value={filters.cta}           onChange={set('cta')}            options={CTAS} />
      <Select label="Actor"          value={filters.actor}         onChange={set('actor')}          options={ACTORS} />
      <Select label="Format"         value={filters.format}        onChange={set('format')}         options={FORMATS} />

      {/* Date range */}
      <label style={styles.label}>
        <span style={styles.labelText}>From</span>
        <input
          type="date"
          style={styles.select}
          value={filters.dateFrom}
          onChange={(e) => set('dateFrom')(e.target.value)}
        />
      </label>
      <label style={styles.label}>
        <span style={styles.labelText}>To</span>
        <input
          type="date"
          style={styles.select}
          value={filters.dateTo}
          onChange={(e) => set('dateTo')(e.target.value)}
        />
      </label>

      <button
        style={styles.clearBtn}
        onClick={() => setFilters(defaultFilters())}
      >
        Clear
      </button>
    </div>
  );
}

export function defaultFilters() {
  return {
    env: '', hook: '', scrollStopper: '', claim: '', cta: '', actor: '', format: '',
    dateFrom: '', dateTo: '',
  };
}

export function applyFilters(rows, filters) {
  return rows.filter((r) => {
    const p = r.parsed || {};
    if (filters.env           && p.envCode           !== filters.env)           return false;
    if (filters.hook          && p.hookCode           !== filters.hook)          return false;
    if (filters.scrollStopper && p.scrollStopperCode  !== filters.scrollStopper) return false;
    if (filters.claim         && p.claimCode          !== filters.claim)         return false;
    if (filters.cta           && p.ctaCode            !== filters.cta)           return false;
    if (filters.actor         && p.actorCode          !== filters.actor)         return false;
    if (filters.format        && p.formatCode         !== filters.format)        return false;
    if (filters.dateFrom      && r.date < filters.dateFrom)                       return false;
    if (filters.dateTo        && r.date > filters.dateTo)                         return false;
    return true;
  });
}

const styles = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '12px 0',
    alignItems: 'flex-end',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  labelText: {
    fontSize: 10,
    color: '#8899BB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    background: '#1a2d58',
    color: '#fff',
    border: '1px solid #1e3060',
    borderRadius: 6,
    padding: '5px 8px',
    maxWidth: 160,
  },
  clearBtn: {
    background: 'transparent',
    color: '#8899BB',
    border: '1px solid #1e3060',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    alignSelf: 'flex-end',
  },
};
