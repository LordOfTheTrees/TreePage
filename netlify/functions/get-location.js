// Netlify Function: Proxy for IP geolocation API
// This hides the API key from client-side code and avoids CORS issues

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get visitor's IP from request headers
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0] || 
                     event.headers['x-nf-client-connection-ip'] || 
                     event.clientContext?.ip ||
                     'unknown';

    // Call IP geolocation API
    // Using ipapi.co (free tier: 1,000 requests/day)
    // Alternative: ip-api.com, ipgeolocation.io, etc.
    const apiKey = process.env.IP_API_KEY || '';
    const apiUrl = apiKey 
      ? `https://ipapi.co/${clientIP}/json/?key=${apiKey}`
      : `https://ipapi.co/${clientIP}/json/`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract relevant geographic information
    const geoData = {
      country: data.country_name || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(geoData)
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch location data' })
    };
  }
};

