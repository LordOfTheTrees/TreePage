// Netlify Function: record one visit in Supabase.
// Geolocation comes from Netlify's x-nf-geo header (MaxMind). The ipapi.co
// path is a fallback for hosting off Netlify; see docs/analytics.md, D5.

const { createClient } = require('@supabase/supabase-js');

// Set true when hosting off Netlify (and set IP_API_KEY for production use).
const USE_IPAPI_GEO = false;

const UNKNOWN_LOCATION = { country: 'Unknown', region: 'Unknown', city: 'Unknown' };

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

const respond = (statusCode, payload) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(payload)
});

// One client per warm container rather than one per request.
let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

function parseNetlifyGeo(event) {
  const header = event.headers['x-nf-geo'];
  if (!header) return null;

  try {
    const geo = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    return {
      country: geo.country?.name || geo.country?.code || 'Unknown',
      region: geo.subdivision?.name || geo.subdivision?.code || 'Unknown',
      city: geo.city || 'Unknown'
    };
  } catch (err) {
    console.error('Failed to parse x-nf-geo:', err.message);
    return null;
  }
}

const hasUsableGeo = ({ country, region, city }) =>
  [country, region, city].some((value) => value && value !== 'Unknown');

async function getLocationFromIpapi(clientIP) {
  const apiKey = process.env.IP_API_KEY || '';
  const apiUrl = `https://ipapi.co/${clientIP}/json/${apiKey ? `?key=${apiKey}` : ''}`;

  const response = await fetch(apiUrl);
  const text = await response.text();
  if (!response.ok) {
    console.error('IP API error:', response.status, text.substring(0, 200));
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ...UNKNOWN_LOCATION };
  }

  return {
    country: data.country_name || data.country || 'Unknown',
    region: data.region || data.regionName || data.state || 'Unknown',
    city: data.city || 'Unknown'
  };
}

async function resolveVisitLocation(event, clientIP) {
  const netlifyGeo = parseNetlifyGeo(event);
  if (netlifyGeo && hasUsableGeo(netlifyGeo)) return netlifyGeo;

  if (USE_IPAPI_GEO && clientIP !== 'unknown') return getLocationFromIpapi(clientIP);

  return netlifyGeo || { ...UNKNOWN_LOCATION };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...HEADERS,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  const client = getSupabase();
  if (!client) {
    console.error('Supabase environment variables missing.');
    return respond(500, { error: 'Supabase not configured' });
  }

  try {
    // The IP is used only to resolve a location and is never stored.
    const clientIP = event.headers['x-nf-client-connection-ip'] ||
                     event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     event.headers['client-ip'] ||
                     event.clientContext?.ip ||
                     'unknown';

    const location = await resolveVisitLocation(event, clientIP);
    const { error } = await client
      .from('visits')
      .insert([{ ...location, timestamp: new Date().toISOString() }]);

    if (error) {
      console.error('Error inserting visit:', error.message);
      return respond(500, { error: 'Failed to store visit' });
    }

    return respond(200, { success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    return respond(500, { error: 'Failed to track visit' });
  }
};
