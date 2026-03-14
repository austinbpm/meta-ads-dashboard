import React from 'react';
import { RETENTION_DROP } from '../config/thresholds';

function dropColor(dropRate) {
  if (dropRate < RETENTION_DROP.GREEN)  return '#00C9A7';
  if (dropRate < RETENTION_DROP.YELLOW) return '#FFD166';
  return '#FF6B6B';
}

function pct(n, d) {
  if (!d || d === 0) return null;
  return n / d;
}

function fmt(v) {
  if (v == null) return '—';
  return v >= 1000 ? v.toLocaleString() : v;
}

function fmtPct(v) {
  if (v == null) return '';
  return `${(v * 100).toFixed(1)}%`;
}

/**
 * Horizontal funnel waterfall.
 * Stages: Impressions → 3-Sec → 25% → 50% → 75% → ThruPlay
 */
export default function WaterfallChart({ row }) {
  const stages = [
    { label: 'Impressions',    value: row.impressions },
    { label: '3-Sec Views',    value: row['3_second_video_views'] },
    { label: '25% Watched',    value: row['video_watches_at_25'] },
    { label: '50% Watched',    value: row['video_watches_at_50'] },
    { label: '75% Watched',    value: row['video_watches_at_75'] },
    { label: 'ThruPlay',       value: row['video_thruplay'] },
  ];

  // Filter out zero-value stages for static ads
  const isVideo = row['3_second_video_views'] > 0;
  const visible = isVideo ? stages : stages.slice(0, 1);

  const max = visible[0]?.value || 1;

  return (
    <div style={styles.container}>
      {visible.map((stage, i) => {
        const barWidth = (stage.value / max) * 100;
        const dropRate = i > 0 ? pct(visible[i - 1].value - stage.value, visible[i - 1].value) : null;
        const color = dropRate != null ? dropColor(dropRate) : '#00C9A7';

        return (
          <div key={stage.label} style={styles.row}>
            <div style={styles.stageName}>{stage.label}</div>
            <div style={styles.barWrap}>
              <div
                style={{
                  ...styles.bar,
                  width: `${barWidth}%`,
                  background: i === 0 ? '#1a2d58' : color,
                  borderColor: color,
                }}
              />
            </div>
            <div style={styles.values}>
              <span style={styles.absVal}>{fmt(stage.value)}</span>
              {dropRate != null && (
                <span style={{ ...styles.pctVal, color }}>
                  ▼ {fmtPct(dropRate)} drop
                </span>
              )}
            </div>
          </div>
        );
      })}

      {!isVideo && (
        <p style={styles.staticNote}>Static / Carousel ad — video retention N/A</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '12px 0',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 180px',
    alignItems: 'center',
    gap: 10,
  },
  stageName: {
    fontSize: 12,
    color: '#8899BB',
    textAlign: 'right',
  },
  barWrap: {
    background: '#0D1B3E',
    borderRadius: 4,
    height: 26,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    border: '1px solid transparent',
    minWidth: 4,
    transition: 'width 0.4s ease',
  },
  values: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  absVal: {
    fontSize: 13,
    fontWeight: 600,
    minWidth: 70,
  },
  pctVal: {
    fontSize: 11,
  },
  staticNote: {
    color: '#8899BB',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
};
