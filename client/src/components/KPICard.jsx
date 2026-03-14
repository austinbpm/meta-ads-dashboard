import React from 'react';

/**
 * A simple metric card with optional color signal.
 * color: 'green' | 'yellow' | 'red' | 'gray' | null
 */
export default function KPICard({ label, value, color, sub }) {
  const colorMap = {
    green:  '#00C9A7',
    yellow: '#FFD166',
    red:    '#FF6B6B',
    gray:   '#8899BB',
  };
  const c = colorMap[color] || '#fff';

  return (
    <div style={styles.card}>
      <span style={{ ...styles.value, color: c }}>{value}</span>
      <span style={styles.label}>{label}</span>
      {sub && <span style={styles.sub}>{sub}</span>}
    </div>
  );
}

const styles = {
  card: {
    background: '#132244',
    border: '1px solid #1e3060',
    borderRadius: 10,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 130,
  },
  value: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  label: {
    fontSize: 11,
    color: '#8899BB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: 4,
  },
  sub: {
    fontSize: 11,
    color: '#8899BB',
    marginTop: 2,
  },
};
