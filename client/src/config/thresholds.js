// KPI Thresholds — all threshold logic lives here

export const HOOK_RATE = {
  GREEN: 0.25,   // > 25% → Scaling
  YELLOW: 0.15,  // 15–25% → Watch
  // < 15% after 1,000 impressions → Pause
  // < 1,000 impressions → Learning
  MIN_IMPRESSIONS_PAUSE: 1000,
  PAUSE_THRESHOLD: 0.05,         // < 5% after 1,000 impressions → hard Pause rule
  MIN_IMPRESSIONS_SCALE: 2000,
};

export const HOLD_RATE = {
  GREEN: 0.40,   // > 40% → Strong
  YELLOW: 0.25,  // 25–40% → Watch
  // < 25% → Weak
};

export const CPL_TARGET = 12.00; // dollars

export const FATIGUE_CPM_INCREASE = 0.20; // 20% WoW CPM increase triggers fatigue alert

export const RETENTION_DROP = {
  GREEN: 0.20,   // < 20% drop between funnel stages → green
  YELLOW: 0.35,  // 20–35% drop → yellow
  // > 35% drop → red
};

export const SCALE_RULE = {
  MIN_IMPRESSIONS: 2000,
  HOOK_RATE: 0.25,
  HOLD_RATE: 0.40,
};
