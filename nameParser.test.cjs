// Quick CJS test — runs without a bundler
// mirrors the lookup objects from lookups.js

const HOOKS = {
  H01: "If you own a car…",
  H02: "If you have car insurance…",
  H03: "If your car insurance is about to renew…",
  H04: "If you're paying for car insurance…",
  H05: "If your car insurance bill went up this year…",
  H06: "If you're paying more than $39 per month…",
  H07: "If your car insurance is more than $39 per month…",
  H08: "If your car insurance bill looks like this…",
  H09: "If you have any of these vehicles…",
  H10: "If you're looking for ways to save money...",
  H11: "If budgeting has you stressed…",
  H12: "If money's getting tight…",
};
const SCROLL_STOPPERS = {
  SS01: "listen up", SS02: "you need to hear this", SS03: "your life just got easier",
  SS04: "I'm about to change your life", SS05: "you have to check this out",
  SS06: "this site could help you save big", SS07: "this site could save you hundreds",
  SS08: "this site could save you up to $1,000 per year",
  SS09: "this tip could help you save big", SS10: "this tip could save you hundreds",
  SS11: "this tip could save you up to $1,000 per year",
};
const CLAIMS = {
  C01: "Old rate wasn't close to lowest option", C02: "Found options a lot cheaper than current rate",
  C03: "Got offers as low as $39/mo", C04: "Top carriers starting at $39/mo",
  C05: "Some people saving up to $1,000/year",
};
const CTAS = {
  CTA01: "It's a no-brainer", CTA02: "Tap to see your options",
  CTA03: "I put the link below, go see for yourself",
  CTA04: "Swipe to see how much you could save", CTA05: "It's a win-win",
};
const ACTORS = { A1: "Actor 1", A2: "Actor 2", A3: "Actor 3", A4: "Actor 4", A5: "Actor 5" };
const FORMATS = { VID: "Video UGC", STATIC: "Static Image", CAR3: "Carousel 3-card", CAR5: "Carousel 5-card" };
const ENVIRONMENTS = {
  CAR: "In Car", ROOM: "In Room", OUT: "Outside", COOK: "Cooking",
  GAS: "Gas Station", DESK: "Desk / Bills", GROC: "Grocery Store", NA: "N/A",
};

function parseAdName(adName) {
  if (!adName) return null;
  const parts = adName.split('_');
  const raw = {
    env: parts[0] || null, hook: parts[1] || null, scrollStopper: parts[2] || null,
    claim: parts[3] || null, cta: parts[4] || null, actor: parts[5] || null,
    format: parts[6] || null, date: parts[7] || null,
  };
  Object.keys(raw).forEach((k) => { if (raw[k] === 'NA') raw[k] = null; });
  return {
    envCode: raw.env, hookCode: raw.hook, scrollStopperCode: raw.scrollStopper,
    claimCode: raw.claim, ctaCode: raw.cta, actorCode: raw.actor,
    formatCode: raw.format, date: raw.date,
    env:           raw.env   ? (ENVIRONMENTS[raw.env]          ?? raw.env)   : null,
    hook:          raw.hook  ? (HOOKS[raw.hook]                ?? raw.hook)  : null,
    scrollStopper: raw.scrollStopper ? (SCROLL_STOPPERS[raw.scrollStopper] ?? raw.scrollStopper) : null,
    claim:         raw.claim ? (CLAIMS[raw.claim]              ?? raw.claim) : null,
    cta:           raw.cta   ? (CTAS[raw.cta]                  ?? raw.cta)   : null,
    actor:         raw.actor ? (ACTORS[raw.actor]              ?? raw.actor) : null,
    format:        raw.format ? (FORMATS[raw.format]           ?? raw.format): null,
  };
}

const samples = [
  "CAR_H01_SS01_C03_CTA05_A1_VID_0315",
  "COOK_H12_SS12_C05_CTA06_A2_VID_0328",
  "NA_H06_SS09_C03_NA_NA_STATIC_0401",
];

samples.forEach((name) => {
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(parseAdName(name), null, 2));
});
