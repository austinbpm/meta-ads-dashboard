import { HOOK_RATE, HOLD_RATE, SCALE_RULE, FATIGUE_CPM_INCREASE } from '../config/thresholds';

/**
 * All metric formula calculations.
 * Input: a single ad row from the data source (raw field names from Funnel export).
 * All division results are guarded against divide-by-zero (return null instead of Infinity/NaN).
 */

const safe = (numerator, denominator) =>
  denominator && denominator > 0 ? numerator / denominator : null;

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// ─── Calculated metrics ────────────────────────────────────────────────────

/** Hook Rate = 3-Second Video Views / Impressions */
export const hookRate = (row) =>
  safe(row['3_second_video_views'], row['impressions']);

/** Hold Rate = Video ThruPlay / 3-Second Video Views */
export const holdRate = (row) =>
  safe(row['video_thruplay'], row['3_second_video_views']);

/** CPL = Amount Spent / Leads */
export const cpl = (row) =>
  safe(row['amount_spent'], row['leads']);

/** Cost per ThruPlay = Amount Spent / Video ThruPlay */
export const costPerThruplay = (row) =>
  safe(row['amount_spent'], row['video_thruplay']);

/** Retention at 25% = Video Watches at 25% / 3-Second Video Views */
export const retention25 = (row) =>
  safe(row['video_watches_at_25'], row['3_second_video_views']);

/** Retention at 50% = Video Watches at 50% / 3-Second Video Views */
export const retention50 = (row) =>
  safe(row['video_watches_at_50'], row['3_second_video_views']);

/** Retention at 75% = Video Watches at 75% / 3-Second Video Views */
export const retention75 = (row) =>
  safe(row['video_watches_at_75'], row['3_second_video_views']);

/** Retention at 100% = Video Watches at 100% / 3-Second Video Views */
export const retention100 = (row) =>
  safe(row['video_watches_at_100'], row['3_second_video_views']);

// ─── Computed row (all metrics in one object) ──────────────────────────────

/**
 * Returns the ad row enriched with all calculated metrics.
 * Raw Funnel fields are preserved. Calculated fields are added.
 */
export function computeRow(row) {
  return {
    ...row,
    calc_hook_rate:         hookRate(row),
    calc_hold_rate:         holdRate(row),
    calc_cpl:               cpl(row),
    calc_cost_per_thruplay: costPerThruplay(row),
    calc_retention_25:      retention25(row),
    calc_retention_50:      retention50(row),
    calc_retention_75:      retention75(row),
    calc_retention_100:     retention100(row),
  };
}

// ─── Aggregation helpers ───────────────────────────────────────────────────

/**
 * Aggregate a set of computed rows into summary metrics for leaderboard use.
 */
export function aggregateRows(rows) {
  const hookRates    = rows.map((r) => r.calc_hook_rate).filter((v) => v !== null);
  const holdRates    = rows.map((r) => r.calc_hold_rate).filter((v) => v !== null);
  const cpls         = rows.map((r) => r.calc_cpl).filter((v) => v !== null);
  const ctrs         = rows.map((r) => r['ctr']).filter((v) => v !== null && v !== undefined);
  const cpms         = rows.map((r) => r['cpm']).filter((v) => v !== null && v !== undefined);
  const ssRetentions = rows.map((r) => retention25(r)).filter((v) => v !== null);

  return {
    avgHookRate:    avg(hookRates),
    avgHoldRate:    avg(holdRates),
    avgCPL:         avg(cpls),
    avgCTR:         avg(ctrs),
    avgCPM:         avg(cpms),
    avgSSRetention: avg(ssRetentions),
    totalSpend:     sum(rows.map((r) => r['amount_spent'] || 0)),
    totalLeads:     sum(rows.map((r) => r['leads'] || 0)),
    count:          rows.length,
  };
}

// ─── Status badge logic ────────────────────────────────────────────────────

/**
 * Returns one of: "Scaling" | "Watch" | "Pause" | "Learning"
 */
export function adStatus(row) {
  const impr = row['impressions'] || 0;
  const hr   = row.calc_hook_rate;
  const hold = row.calc_hold_rate;

  if (impr < HOOK_RATE.MIN_IMPRESSIONS_PAUSE) return 'Learning';
  if (impr >= SCALE_RULE.MIN_IMPRESSIONS && hr >= SCALE_RULE.HOOK_RATE && hold >= SCALE_RULE.HOLD_RATE)
    return 'Scaling';
  if (hr >= HOOK_RATE.GREEN) return 'Scaling';
  if (hr >= HOOK_RATE.YELLOW) return 'Watch';
  return 'Pause';
}

// ─── Fatigue detection ─────────────────────────────────────────────────────

/**
 * Returns ad names where CPM increased > 20% comparing the older half
 * of date-sorted rows vs the newer half (proxy for week-over-week).
 */
export function detectFatigued(allRows) {
  const byAd = {};
  allRows.forEach((r) => {
    const name = r['ad_name'];
    if (!byAd[name]) byAd[name] = [];
    byAd[name].push(r);
  });

  const fatigued = [];
  Object.entries(byAd).forEach(([adName, rows]) => {
    if (rows.length < 2) return;
    const sorted  = [...rows].sort((a, b) => a['date'].localeCompare(b['date']));
    const mid     = Math.floor(sorted.length / 2);
    const prevCPM = avg(sorted.slice(0, mid).map((r) => r['cpm']).filter(Boolean));
    const currCPM = avg(sorted.slice(mid).map((r) => r['cpm']).filter(Boolean));
    if (prevCPM && currCPM && (currCPM - prevCPM) / prevCPM > FATIGUE_CPM_INCREASE) {
      fatigued.push(adName);
    }
  });
  return fatigued;
}

// ─── Economic summary ──────────────────────────────────────────────────────

export function economicSummary(computedRows, fatigueCount = 0) {
  const totalSpend = sum(computedRows.map((r) => r['amount_spent'] || 0));
  const totalLeads = sum(computedRows.map((r) => r['leads'] || 0));
  const hookRates  = computedRows.map((r) => r.calc_hook_rate).filter((v) => v !== null);
  const holdRates  = computedRows.map((r) => r.calc_hold_rate).filter((v) => v !== null);

  return {
    totalSpend,
    totalLeads,
    blendedCPL:  safe(totalSpend, totalLeads),
    avgCPM:      avg(computedRows.map((r) => r['cpm']).filter(Boolean)),
    avgHookRate: avg(hookRates),
    avgHoldRate: avg(holdRates),
    fatigueCount,
  };
}
