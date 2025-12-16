// Updated analytics.js - Uses Netlify Functions for tracking
document.addEventListener('DOMContentLoaded', function() {
  // Get Netlify function base URL
  // Since site is on GitHub Pages, we need to use the Netlify site URL
  const getNetlifyFunctionUrl = (functionName) => {
    // Try to get from data attribute (set by Jekyll)
    const netlifyUrl = document.documentElement.dataset.netlifyUrl || 
                      window.NETLIFY_FUNCTIONS_URL ||
                      'https://your-netlify-site.netlify.app'; // Fallback - update this!
    
    return `${netlifyUrl}/.netlify/functions/${functionName}`;
  };

  // Function to track visit via Netlify Function
  // The function handles both getting location and storing to Supabase
  async function trackVisit() {
    try {
      const functionUrl = getNetlifyFunctionUrl('track-visit');
      console.log('Calling Netlify function:', functionUrl);
      
      // Call track-visit function which handles location and storage
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors' // Explicitly set CORS mode
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Visit tracked successfully', result);
      } else {
        const errorText = await response.text();
        console.error('Failed to track visit:', response.status, errorText);
      }
      
      // Update analytics view if we're on the analytics page
      if (window.location.pathname.includes('analytics-view.html')) {
        updateAnalyticsView();
      }
    } catch (error) {
      console.error('Failed to track visit:', error);
    }
  }
  
  // Track this visit
  trackVisit();
  
  // Function to update the analytics view
  // Reads from assets/data/analytics-stats.json (served as static file)
  window.updateAnalyticsView = async function() {
    const analyticsContainer = document.getElementById('analytics-container');
    
    if (!analyticsContainer) {
      return;
    }

    try {
      // Fetch aggregated stats from the data file
      // The file is served as a static file from assets/data
      const baseUrl = window.location.origin + (window.location.pathname.includes('/TreePage') ? '/TreePage' : '');
      const dataUrl = `${baseUrl}/assets/data/analytics-stats.json`;
      console.log('Fetching analytics data from:', dataUrl);
      
      const statsResponse = await fetch(dataUrl);
      console.log('Response status:', statsResponse.status, 'ok:', statsResponse.ok);
      
      if (!statsResponse.ok) {
        console.error('Failed to load analytics data:', statsResponse.status, statsResponse.statusText);
        const errorText = await statsResponse.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to load analytics data: ${statsResponse.status}`);
      }

      const responseText = await statsResponse.text();
      console.log('Response text:', responseText.substring(0, 200));
      
      let stats;
      try {
        stats = JSON.parse(responseText);
        console.log('Analytics data parsed successfully:', stats);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Response text was:', responseText);
        throw parseError;
      }
      console.log('totalVisits value:', stats.totalVisits, 'type:', typeof stats.totalVisits);
      
      // Check if we have valid data
      if (!stats) {
        console.error('Stats is null or undefined');
        analyticsContainer.innerHTML = '<p>No analytics data available yet. Data is updated monthly.</p>';
        return;
      }
      
      const totalVisits = Number(stats.totalVisits) || 0;
      console.log('Parsed totalVisits:', totalVisits, 'original:', stats.totalVisits);
      console.log('visitsByCountry:', stats.visitsByCountry, 'keys:', stats.visitsByCountry ? Object.keys(stats.visitsByCountry) : 'null');
      console.log('visitsByRegion:', stats.visitsByRegion);
      
      if (totalVisits === 0) {
        console.log('No visits found - totalVisits is 0');
        analyticsContainer.innerHTML = '<p>No analytics data available yet. Data is updated monthly.</p>';
        return;
      }
      
      console.log('Passed the check, proceeding to display data. totalVisits:', totalVisits);
      
      // Display the results using the aggregated stats
      let html = '<h2>Visitor Statistics</h2>';
      html += '<div class="stats-section"><h3>Visits by Country</h3><ul>';
      
      if (stats.visitsByCountry) {
        Object.keys(stats.visitsByCountry).sort().forEach(country => {
          html += `<li><strong>${country}</strong>: ${stats.visitsByCountry[country]} visit(s)</li>`;
        });
      }
      
      html += '</ul></div>';
      
      html += '<div class="stats-section"><h3>Visits by Region</h3><ul>';
      
      if (stats.visitsByRegion) {
        Object.keys(stats.visitsByRegion).sort().forEach(region => {
          html += `<li><strong>${region}</strong>: ${stats.visitsByRegion[region]} visit(s)</li>`;
        });
      }
      
      html += '</ul></div>';
      
      // Show total visits
      html += `<p class="total-visits">Total visits tracked: ${totalVisits}</p>`;
      
      // Show last updated
      if (stats.lastUpdated) {
        html += `<p class="last-updated">Last updated: ${new Date(stats.lastUpdated).toLocaleDateString()}</p>`;
      }
      
      analyticsContainer.innerHTML = html;
      
      // Trigger visual analytics if available
      if (window.createVisualAnalytics && stats.visits && stats.visits.length > 0) {
        setTimeout(() => {
          window.createVisualAnalytics(stats.visits);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      analyticsContainer.innerHTML = '<p>Failed to load analytics data. Please try again later.</p>';
    }
  };
});