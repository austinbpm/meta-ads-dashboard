import React from 'react';

const CONFIG = {
  Scaling:  { bg: '#00C9A7', color: '#0D1B3E' },
  Watch:    { bg: '#FFD166', color: '#0D1B3E' },
  Pause:    { bg: '#FF6B6B', color: '#fff'    },
  Learning: { bg: '#8899BB', color: '#0D1B3E' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.Learning;
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      borderRadius: 12,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
