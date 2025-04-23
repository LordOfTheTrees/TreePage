// Updated analytics.js - Focuses on tracking geographic data
document.addEventListener('DOMContentLoaded', function() {
  // Function to get visitor's IP and geographic information
  async function trackVisit() {
    try {
      // Get visitor's IP information using a free IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Store relevant geographic information
      const geoData = {
        country: data.country_name,
        region: data.region,
        city: data.city,
        timestamp: new Date().toISOString()
      };
      
      // Get existing visit data
      const visits = JSON.parse(localStorage.getItem('site_geo_visits') || '[]');
      visits.push(geoData);
      
      // Save updated visits data
      localStorage.setItem('site_geo_visits', JSON.stringify(visits));
      
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
  window.updateAnalyticsView = function() {
    const visits = JSON.parse(localStorage.getItem('site_geo_visits') || '[]');
    const analyticsContainer = document.getElementById('analytics-container');
    
    if (!analyticsContainer || visits.length === 0) {
      return;
    }
    
    // Count visits by country
    const countryCounts = {};
    visits.forEach(visit => {
      const country = visit.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    
    // Display the results
    let html = '<h2>Visitor Statistics</h2>';
    html += '<div class="stats-section"><h3>Visits by Country</h3><ul>';
    
    Object.keys(countryCounts).sort().forEach(country => {
      html += `<li><strong>${country}</strong>: ${countryCounts[country]} visit(s)</li>`;
    });
    
    html += '</ul></div>';
    
    // Count visits by region
    const regionCounts = {};
    visits.forEach(visit => {
      if (visit.country && visit.region) {
        const region = `${visit.region}, ${visit.country}`;
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    });
    
    html += '<div class="stats-section"><h3>Visits by Region</h3><ul>';
    
    Object.keys(regionCounts).sort().forEach(region => {
      html += `<li><strong>${region}</strong>: ${regionCounts[region]} visit(s)</li>`;
    });
    
    html += '</ul></div>';
    
    // Show total visits
    html += `<p class="total-visits">Total visits tracked: ${visits.length}</p>`;
    
    analyticsContainer.innerHTML = html;
  };
});