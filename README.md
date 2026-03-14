# Meta Ads Performance Dashboard

Car insurance lead generation — Advantage+ campaign analytics.

## Stack
- **Frontend**: React 18, Recharts, React Router v6
- **Backend**: Node/Express serving mock data (swap-ready for Funnel.io)
- **Data**: Funnel.io export shape (Ad-level insights from Meta Ads API)

## Quick Start

### Prerequisites
- Node.js 18+

### 1. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (default port is 3001)
```

### 3. Start the backend

```bash
cd server && npm start
# Runs on http://localhost:3001
```

### 4. Start the frontend

```bash
cd client && npm start
# Opens http://localhost:3000
```

---

## Swapping in Real Funnel.io Data

The server currently reads `server/mock_data.json`. To connect live data:

**Option A — Funnel.io API pull**

1. Add `FUNNEL_API_KEY` and `FUNNEL_ACCOUNT_ID` to `.env`.
2. Replace the `getData()` function in `server/api.js` with an HTTP call to the Funnel API.
3. Map the Funnel response fields to the field names used in `mock_data.json`.

**Option B — Google Sheets export**

1. Publish the Funnel → Sheets export as a CSV URL.
2. Install `papaparse` on the server.
3. Replace `getData()` to fetch and parse the CSV, normalizing field names to match `mock_data.json`.

**Required field names** (must match exactly — see `mock_data.json` for the shape):

| Field | Type |
|---|---|
| `ad_name` | string |
| `impressions` | number |
| `amount_spent` | number |
| `cpm` | number |
| `ctr` | number |
| `cpc` | number |
| `3_second_video_views` | number |
| `video_plays` | number |
| `video_watches_at_25` | number |
| `video_watches_at_50` | number |
| `video_watches_at_75` | number |
| `video_watches_at_100` | number |
| `video_thruplay` | number |
| `cost_per_thruplay` | number \| null |
| `leads` | number |
| `cost_per_lead` | number |
| `date` | string (YYYY-MM-DD) |

---

## Ad Name Convention

```
[ENV]_[HOOK]_[SS]_[CLAIM]_[CTA]_[ACTOR]_[FORMAT]_[DATE]
```

Example: `CAR_H01_SS01_C03_CTA05_A1_VID_0315`

Lookup tables live in `client/src/config/lookups.js`.
Parser lives in `client/src/utils/nameParser.js`.
All metric formulas live in `client/src/utils/calculations.js`.
KPI thresholds live in `client/src/config/thresholds.js`.

---

## KPI Thresholds

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Hook Rate | > 25% | 15–25% | < 15% (after 1k impr) |
| Hold Rate | > 40% | 25–40% | < 25% |
| CPL Target | ≤ $12.00 | — | > $12.00 |
| Fatigue | — | — | CPM +20% WoW |
