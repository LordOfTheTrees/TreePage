// Netlify Function: Export visit data for weekly sync
// Called by GitHub Actions to fetch all stored visits from Supabase

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Optional: Add authentication token check
  const authToken = event.headers['x-auth-token'] || event.queryStringParameters?.token;
  const expectedToken = process.env.EXPORT_AUTH_TOKEN;
  
  if (expectedToken && authToken !== expectedToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Supabase not configured' })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all visits from Supabase
    const { data: visits, error } = await supabase
      .from('visits')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching visits:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to fetch visits', details: error.message })
      };
    }

    // Transform data to match expected format
    const formattedVisits = (visits || []).map(visit => ({
      country: visit.country,
      region: visit.region,
      city: visit.city,
      timestamp: visit.timestamp
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visits: formattedVisits,
        total: formattedVisits.length,
        exportedAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error exporting visits:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to export visits' })
    };
  }
};

