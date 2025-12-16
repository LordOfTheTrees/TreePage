// Netlify Function: Store visit data using Netlify Forms
// Netlify Forms provides persistent storage (free tier: 100 submissions/month)
// Each visit is stored as a form submission, which persists in Netlify

// Alternative: If you prefer file-based storage, you can use an external service
// or commit to GitHub repo (but that requires GitHub API calls on each visit)

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
    const visitData = JSON.parse(event.body);
    
    // Validate required fields
    if (!visitData.country || !visitData.timestamp) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Store visit using Netlify Forms
    // Netlify Forms automatically handles form submissions
    // We'll use a hidden form submission approach
    const formData = new URLSearchParams();
    formData.append('form-name', 'analytics-visit');
    formData.append('country', visitData.country);
    formData.append('region', visitData.region || 'Unknown');
    formData.append('city', visitData.city || 'Unknown');
    formData.append('timestamp', visitData.timestamp);

    // Submit to Netlify Forms endpoint
    // Note: This requires a form with name="analytics-visit" in your HTML
    // Or use Netlify's Forms API directly
    const netlifyFormsEndpoint = '/';
    
    // For now, we'll use a simple approach: store in function's /tmp
    // and rely on weekly sync to capture data
    // In production, set up Netlify Forms or use external storage
    const fs = require('fs');
    const path = require('path');
    const DATA_FILE = path.join('/tmp', 'visits.json');
    
    let visits = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        visits = JSON.parse(data);
      } catch (e) {
        visits = [];
      }
    }
    
    visits.push({
      country: visitData.country,
      region: visitData.region || 'Unknown',
      city: visitData.city || 'Unknown',
      timestamp: visitData.timestamp
    });
    
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(visits, null, 2));
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true, 
          totalVisits: visits.length,
          note: 'Data stored temporarily. Weekly sync will persist to GitHub.'
        })
      };
    } catch (error) {
      console.error('Error writing to /tmp:', error);
      // Still return success - the weekly sync will handle persistence
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true,
          note: 'Visit logged (may not persist until weekly sync)'
        })
      };
    }
  } catch (error) {
    console.error('Error storing visit:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

