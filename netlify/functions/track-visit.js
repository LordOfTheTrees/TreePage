// Netlify Function: Track visit and store in Supabase
// Gets location via IP geolocation API and stores in Supabase database

const { createClient } = require('@supabase/supabase-js');

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
    console.log('Request headers:', JSON.stringify(event.headers, null, 2));
    
    // Get visitor's IP from request headers
    // Netlify provides IP in x-nf-client-connection-ip header
    const clientIP = event.headers['x-nf-client-connection-ip'] || 
                     event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     event.headers['client-ip'] ||
                     event.clientContext?.ip ||
                     'unknown';
    
    console.log('Client IP detected:', clientIP);
    
    // If IP is still unknown, try to get it from Netlify's context
    if (clientIP === 'unknown' && event.requestContext) {
      console.log('Request context:', JSON.stringify(event.requestContext, null, 2));
    }

    // Get location via IP geolocation API
    const apiKey = process.env.IP_API_KEY || '';
    const apiUrl = apiKey 
      ? `https://ipapi.co/${clientIP}/json/?key=${apiKey}`
      : `https://ipapi.co/${clientIP}/json/`;

    console.log('Calling IP geolocation API:', apiUrl);
    const locationResponse = await fetch(apiUrl);
    
    if (!locationResponse.ok) {
      console.error('IP API error:', locationResponse.status, locationResponse.statusText);
      const errorText = await locationResponse.text();
      console.error('IP API error body:', errorText);
    }
    
    const locationData = await locationResponse.json();
    console.log('Location data received:', JSON.stringify(locationData, null, 2));

    // Extract relevant geographic information
    // Handle different possible response formats
    const visitData = {
      country: locationData.country_name || locationData.country || 'Unknown',
      region: locationData.region || locationData.regionName || locationData.state || 'Unknown',
      city: locationData.city || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    // Check if we got an error from the API
    if (locationData.error || locationData.reason) {
      console.error('IP API returned error:', locationData.error || locationData.reason);
    }
    
    console.log('Visit data to store:', visitData);

    // Get Supabase credentials
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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert visit into Supabase
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

    // Get total count for response
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

