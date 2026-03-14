import {
  HOOKS,
  SCROLL_STOPPERS,
  CLAIMS,
  CTAS,
  ACTORS,
  FORMATS,
  ENVIRONMENTS,
} from '../config/lookups';

/**
 * Parses an ad name following the convention:
 *   [ENV]_[HOOK]_[SS]_[CLAIM]_[CTA]_[ACTOR]_[FORMAT]_[DATE]
 *
 * Returns an object with both raw codes and resolved display labels.
 * "NA" values are normalized to null.
 */
export function parseAdName(adName) {
  if (!adName) return null;

  const parts = adName.split('_');

  const raw = {
    env:           parts[0] || null,
    hook:          parts[1] || null,
    scrollStopper: parts[2] || null,
    claim:         parts[3] || null,
    cta:           parts[4] || null,
    actor:         parts[5] || null,
    format:        parts[6] || null,
    date:          parts[7] || null,
  };

  // Normalize "NA" strings → null
  Object.keys(raw).forEach((k) => {
    if (raw[k] === 'NA') raw[k] = null;
  });

  return {
    // Raw codes (null when N/A)
    envCode:           raw.env,
    hookCode:          raw.hook,
    scrollStopperCode: raw.scrollStopper,
    claimCode:         raw.claim,
    ctaCode:           raw.cta,
    actorCode:         raw.actor,
    formatCode:        raw.format,
    date:              raw.date,

    // Resolved display labels (null when code is null or unknown)
    env:           raw.env   ? (ENVIRONMENTS[raw.env]           ?? raw.env)   : null,
    hook:          raw.hook  ? (HOOKS[raw.hook]                 ?? raw.hook)  : null,
    scrollStopper: raw.scrollStopper ? (SCROLL_STOPPERS[raw.scrollStopper] ?? raw.scrollStopper) : null,
    claim:         raw.claim ? (CLAIMS[raw.claim]               ?? raw.claim) : null,
    cta:           raw.cta   ? (CTAS[raw.cta]                   ?? raw.cta)   : null,
    actor:         raw.actor ? (ACTORS[raw.actor]               ?? raw.actor) : null,
    format:        raw.format ? (FORMATS[raw.format]            ?? raw.format): null,
  };
}

/** Convenience: full opening line = Hook + Scroll Stopper */
export function openingLine(parsed) {
  if (!parsed) return '';
  const parts = [parsed.hook, parsed.scrollStopper].filter(Boolean);
  return parts.join(' — ');
}
