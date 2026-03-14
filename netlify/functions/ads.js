// Netlify serverless function — mirrors server/api.js
// Serves mock_data.json at /.netlify/functions/ads
// (proxied to /api/ads via netlify.toml redirect)
const path = require('path');
const fs   = require('fs');

exports.handler = async (event) => {
  // Support optional /:adName filter via query string ?adName=...
  const adNameFilter = event.queryStringParameters?.adName;

  try {
    // __dirname is netlify/functions — walk up two levels to dashboard root
    const filePath = path.join(__dirname, '..', '..', 'server', 'mock_data.json');
    const raw  = fs.readFileSync(filePath, 'utf-8');
    let data   = JSON.parse(raw);

    if (adNameFilter) {
      data = data.filter((r) => r.ad_name === adNameFilter);
      if (!data.length) {
        return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Not found' }) };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, data, refreshedAt: new Date().toISOString() }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Failed to load data' }),
    };
  }
};
