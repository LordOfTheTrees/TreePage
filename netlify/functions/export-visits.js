// Netlify Function: Export visit data for weekly sync
// Called by GitHub Actions to fetch all stored visits

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'visits.json');

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
    // Read visits from storage
    // Note: /tmp doesn't persist between function invocations
    // This will only return visits from the current function execution
    // For production, use Netlify Forms API or external storage
    let visits = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        visits = JSON.parse(data);
      } catch (e) {
        visits = [];
      }
    }
    
    // TODO: For production, fetch from Netlify Forms API instead
    // Example: const forms = await fetch('https://api.netlify.com/api/v1/forms/{form_id}/submissions')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visits: visits,
        total: visits.length,
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

