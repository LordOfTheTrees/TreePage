// Uses Netlify Functions for tracking, then reads the aggregated stats file.
document.addEventListener('DOMContentLoaded', function() {
  const { escapeHtml } = window.TreePage;

  // `window.NETLIFY_FUNCTIONS_URL` is set by default.html from
  // site.netlify_functions_url. No fallback: without it there's nothing to
  // call and trackVisit below fails harmlessly.
  const getNetlifyFunctionUrl = (functionName) =>
    `${window.NETLIFY_FUNCTIONS_URL || ''}/.netlify/functions/${functionName}`;

  // Function to track visit via Netlify Function
  // The function handles both getting location and storing to Supabase
  async function trackVisit() {
    try {
      const response = await fetch(getNetlifyFunctionUrl('track-visit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('Failed to track visit:', response.status);
      }

      // Update analytics view if we're on the analytics page
      if (window.location.pathname.includes('analytics-view.html')) {
        window.updateAnalyticsView();
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
      // Fetch aggregated stats from the data file (updated weekly by GitHub Actions)
      const baseUrl = window.location.origin + (window.location.pathname.includes('/TreePage') ? '/TreePage' : '');
      const dataUrl = `${baseUrl}/assets/data/analytics-stats.json?t=${Date.now()}`;

      const statsResponse = await fetch(dataUrl);

      if (!statsResponse.ok) {
        throw new Error(`Failed to load analytics data: ${statsResponse.status}`);
      }

      const stats = await statsResponse.json();
      const totalVisits = Number(stats.totalVisits) || 0;

      if (totalVisits === 0) {
        analyticsContainer.innerHTML = '<p>No analytics data available yet. Data is updated weekly.</p>';
        return;
      }

      // Display the results using the aggregated stats
      let html = '<h2>Visitor Statistics</h2>';
      html += '<div class="stats-section"><h3>Visits by Country</h3><ul>';

      if (stats.visitsByCountry) {
        Object.keys(stats.visitsByCountry).sort().forEach(country => {
          html += `<li><strong>${escapeHtml(country)}</strong>: ${escapeHtml(stats.visitsByCountry[country])} visit(s)</li>`;
        });
      }

      html += '</ul></div>';

      html += '<div class="stats-section"><h3>Visits by Region</h3><ul>';

      if (stats.visitsByRegion) {
        Object.keys(stats.visitsByRegion).sort().forEach(region => {
          html += `<li><strong>${escapeHtml(region)}</strong>: ${escapeHtml(stats.visitsByRegion[region])} visit(s)</li>`;
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
