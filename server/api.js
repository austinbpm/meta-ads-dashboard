require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Data source ────────────────────────────────────────────────────────────
// Currently serves mock_data.json.
// To swap in real Funnel.io data, replace the `getData` function below with
// a call to the Funnel API or a Google Sheets reader.  The shape of each row
// must match the field names in mock_data.json.

function getData() {
  const filePath = path.join(__dirname, 'mock_data.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/** GET /api/ads — returns all ad rows */
app.get('/api/ads', (req, res) => {
  try {
    const data = getData();
    res.json({ success: true, data, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to load ad data:', err);
    res.status(500).json({ success: false, error: 'Failed to load data' });
  }
});

/** GET /api/ads/:adName — returns rows for a single ad name */
app.get('/api/ads/:adName', (req, res) => {
  try {
    const data = getData();
    const filtered = data.filter((r) => r.ad_name === req.params.adName);
    if (!filtered.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load data' });
  }
});

/** GET /api/health */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Meta Dashboard API running on port ${PORT}`));
