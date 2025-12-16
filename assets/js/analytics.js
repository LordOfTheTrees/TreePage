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
  // The function handles both getting location and storing to GitHub repo
  async function trackVisit() {
    try {
      // Call track-visit function which handles location and storage
      const response = await fetch(getNetlifyFunctionUrl('track-visit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Visit tracked successfully', result);
      } else {
        console.error('Failed to track visit');
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
  // Reads from _data/analytics-stats.json (served as static file by Jekyll)
  window.updateAnalyticsView = async function() {
    const analyticsContainer = document.getElementById('analytics-container');
    
    if (!analyticsContainer) {
      return;
    }

    try {
      // Fetch aggregated stats from the data file
      // The file is served via Jekyll data file endpoint
      const baseUrl = window.location.origin + (window.location.pathname.includes('/TreePage') ? '/TreePage' : '');
      const statsResponse = await fetch(`${baseUrl}/analytics-stats.json`);
      
      if (!statsResponse.ok) {
        throw new Error('Failed to load analytics data');
      }

      const stats = await statsResponse.json();
      
      if (!stats || stats.totalVisits === 0) {
        analyticsContainer.innerHTML = '<p>No analytics data available yet. Data is updated monthly.</p>';
        return;
      }
      
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
      html += `<p class="total-visits">Total visits tracked: ${stats.totalVisits}</p>`;
      
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