// Netlify Function: Track visit and store in Supabase
// Geolocation via Netlify x-nf-geo header (MaxMind). ipapi.co fallback kept for non-Netlify hosts.

const { createClient } = require('@supabase/supabase-js');

// Set true when hosting off Netlify (set IP_API_KEY in env for production use).
const USE_IPAPI_GEO = false;

function parseNetlifyGeo(event) {
  const header = event.headers['x-nf-geo'];
  if (!header) {
    return null;
  }

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

function hasUsableGeo({ country, region, city }) {
  return [country, region, city].some((value) => value && value !== 'Unknown');
}

async function getLocationFromIpapi(clientIP) {
  const apiKey = process.env.IP_API_KEY || '';
  const apiUrl = apiKey
    ? `https://ipapi.co/${clientIP}/json/?key=${apiKey}`
    : `https://ipapi.co/${clientIP}/json/`;

  console.log('Calling IP geolocation API:', apiUrl);
  const locationResponse = await fetch(apiUrl);
  const responseText = await locationResponse.text();

  if (!locationResponse.ok) {
    console.error('IP API error:', locationResponse.status, locationResponse.statusText);
    console.error('IP API error body:', responseText);
  }

  let locationData;
  try {
    locationData = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('IP API response was not JSON:', responseText?.substring(0, 200));
    locationData = { country_name: 'Unknown', region: 'Unknown', city: 'Unknown' };
  }

  console.log('Location data received:', JSON.stringify(locationData, null, 2));

  if (locationData.error || locationData.reason) {
    console.error('IP API returned error:', locationData.error || locationData.reason);
  }

  return {
    country: locationData.country_name || locationData.country || 'Unknown',
    region: locationData.region || locationData.regionName || locationData.state || 'Unknown',
    city: locationData.city || 'Unknown'
  };
}

async function resolveVisitLocation(event, clientIP) {
  const netlifyGeo = parseNetlifyGeo(event);

  if (netlifyGeo && hasUsableGeo(netlifyGeo)) {
    console.log('Location from x-nf-geo:', netlifyGeo);
    return netlifyGeo;
  }

  if (USE_IPAPI_GEO && clientIP !== 'unknown') {
    console.log('x-nf-geo unavailable; falling back to ipapi.co');
    return getLocationFromIpapi(clientIP);
  }

  if (netlifyGeo) {
    console.log('Location from x-nf-geo (partial):', netlifyGeo);
    return netlifyGeo;
  }

  console.log('No geolocation data available');
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown'
  };
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Track-visit function called, method:', event.httpMethod);

    const clientIP = event.headers['x-nf-client-connection-ip'] ||
                     event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     event.headers['client-ip'] ||
                     event.clientContext?.ip ||
                     'unknown';

    console.log('Client IP detected:', clientIP);

    const location = await resolveVisitLocation(event, clientIP);
    const visitData = {
      ...location,
      timestamp: new Date().toISOString()
    };

    console.log('Visit data to store:', visitData);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('Supabase URL configured:', !!supabaseUrl);
    console.log('Supabase Key configured:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables missing!');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Supabase not configured',
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Inserting visit into Supabase...');
    const { data: insertedVisit, error: insertError } = await supabase
      .from('visits')
      .insert([visitData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting visit:', insertError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to store visit', details: insertError.message })
      };
    }

    console.log('Visit inserted successfully:', insertedVisit);

    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    console.log('Total visits count:', count);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        visit: visitData,
        totalVisits: count || 0
      })
    };
  } catch (error) {
    console.error('Error tracking visit:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to track visit',
        message: error.message,
        details: error.toString()
      })
    };
  }
};
