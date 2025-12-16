// Netlify Function: Track visit and store in GitHub repo
// Gets location via IP geolocation API and appends to _data/visits.json in repo

const { Octokit } = require('@octokit/rest');

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
    // Get visitor's IP from request headers
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0] || 
                     event.headers['x-nf-client-connection-ip'] || 
                     event.clientContext?.ip ||
                     'unknown';

    // Get location via IP geolocation API
    const apiKey = process.env.IP_API_KEY || '';
    const apiUrl = apiKey 
      ? `https://ipapi.co/${clientIP}/json/?key=${apiKey}`
      : `https://ipapi.co/${clientIP}/json/`;

    const locationResponse = await fetch(apiUrl);
    const locationData = await locationResponse.json();

    // Extract relevant geographic information
    const visitData = {
      country: locationData.country_name || 'Unknown',
      region: locationData.region || 'Unknown',
      city: locationData.city || 'Unknown',
      timestamp: new Date().toISOString()
    };

    // Get GitHub token and repo info
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'LordOfTheTrees';
    const repoName = process.env.GITHUB_REPO_NAME || 'TreePage';

    if (!githubToken) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'GitHub token not configured' })
      };
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });

    // Read existing visits.json file
    let existingVisits = [];
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: '_data/visits.json'
      });
      
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      existingVisits = JSON.parse(content);
      sha = data.sha; // Get SHA for update
    } catch (error) {
      // File doesn't exist yet, start with empty array
      if (error.status !== 404) {
        console.error('Error reading visits.json:', error);
      }
    }

    // Add new visit
    existingVisits.push(visitData);

    // Encode content to base64
    const content = Buffer.from(JSON.stringify(existingVisits, null, 2)).toString('base64');

    // Write updated visits.json to repo
    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: '_data/visits.json',
      message: `Add visit from ${visitData.country} [skip ci]`,
      content: content,
      sha: sha
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        visit: visitData,
        totalVisits: existingVisits.length
      })
    };
  } catch (error) {
    console.error('Error tracking visit:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to track visit' })
    };
  }
};

