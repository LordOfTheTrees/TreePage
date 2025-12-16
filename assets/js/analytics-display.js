// Enhanced display for analytics data
document.addEventListener('DOMContentLoaded', function() {
    // Only run on the analytics page
    if (!window.location.pathname.includes('analytics-view.html')) {
      return;
    }
    
    // Create more visual representations of the data
    // This function can be called with visits array from analytics-stats.json
    window.createVisualAnalytics = function(visits) {
      if (!visits || visits.length === 0) return;
      
      // Create a more advanced container if needed
      const advancedContainer = document.getElementById('advanced-analytics') || 
        createAdvancedContainer();
        
      // Clear existing content
      advancedContainer.innerHTML = '';
      
      // Add color-coded country distribution
      createCountryDistribution(advancedContainer, visits);
      
      // Add visit timeline
      createVisitTimeline(advancedContainer, visits);
    }
    
    function createAdvancedContainer() {
      const container = document.createElement('div');
      container.id = 'advanced-analytics';
      container.className = 'advanced-analytics';
      
      // Insert after the basic analytics container
      const basicContainer = document.getElementById('analytics-container');
      basicContainer.parentNode.insertBefore(container, basicContainer.nextSibling);
      
      return container;
    }
    
    function createCountryDistribution(container, visits) {
      // Count visits by country
      const countryCounts = {};
      let totalVisits = visits.length;
      
      visits.forEach(visit => {
        const country = visit.country || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      
      // Create visual representation
      const section = document.createElement('div');
      section.className = 'visual-section';
      section.innerHTML = '<h3>Country Distribution</h3>';
      
      const chart = document.createElement('div');
      chart.className = 'country-chart';
      
      // Generate random colors for countries
      const colors = generateColors(Object.keys(countryCounts).length);
      let colorIndex = 0;
      
      for (const country in countryCounts) {
        const percentage = (countryCounts[country] / totalVisits) * 100;
        const bar = document.createElement('div');
        bar.className = 'country-bar';
        bar.style.width = percentage + '%';
        bar.style.backgroundColor = colors[colorIndex++];
        bar.title = `${country}: ${countryCounts[country]} visits (${percentage.toFixed(1)}%)`;
        
        const label = document.createElement('span');
        label.className = 'country-label';
        label.textContent = country + ' ';
        
        const value = document.createElement('span');
        value.className = 'country-value';
        value.textContent = countryCounts[country];
        
        bar.appendChild(label);
        bar.appendChild(value);
        chart.appendChild(bar);
      }
      
      section.appendChild(chart);
      container.appendChild(section);
    }
    
    function createVisitTimeline(container, visits) {
      // Sort visits by date
      const sortedVisits = [...visits].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // Group visits by day
      const visitsByDay = {};
      sortedVisits.forEach(visit => {
        const date = new Date(visit.timestamp).toISOString().split('T')[0];
        visitsByDay[date] = (visitsByDay[date] || 0) + 1;
      });
      
      // Create timeline section
      const section = document.createElement('div');
      section.className = 'visual-section';
      section.innerHTML = '<h3>Visit Timeline</h3>';
      
      const timeline = document.createElement('div');
      timeline.className = 'visit-timeline';
      
      // Create timeline data points
      const days = Object.keys(visitsByDay).sort();
      const maxVisits = Math.max(...Object.values(visitsByDay));
      
      days.forEach(day => {
        const height = (visitsByDay[day] / maxVisits) * 100;
        const bar = document.createElement('div');
        bar.className = 'timeline-bar';
        bar.style.height = height + '%';
        bar.title = `${day}: ${visitsByDay[day]} visits`;
        
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.textContent = day.split('-').slice(1).join('/');
        
        const point = document.createElement('div');
        point.className = 'timeline-point';
        point.appendChild(bar);
        point.appendChild(label);
        
        timeline.appendChild(point);
      });
      
      section.appendChild(timeline);
      container.appendChild(section);
    }
    
    // Generate a set of distinct colors
    function generateColors(count) {
      const colors = [];
      const hueStep = 360 / count;
      
      for (let i = 0; i < count; i++) {
        const hue = i * hueStep;
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
      
      return colors;
    }
    
    // Add CSS for visualizations
    function addVisualizationStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .advanced-analytics {
          margin-top: 2rem;
        }
        
        .visual-section {
          margin-bottom: 2rem;
        }
        
        .country-chart {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 1rem;
        }
        
        .country-bar {
          height: 30px;
          color: white;
          display: flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 4px;
          transition: all 0.3s;
          cursor: default;
        }
        
        .country-bar:hover {
          opacity: 0.9;
          transform: translateX(5px);
        }
        
        .country-label {
          font-weight: bold;
          flex: 1;
        }
        
        .country-value {
          font-weight: bold;
        }
        
        .visit-timeline {
          display: flex;
          align-items: flex-end;
          height: 200px;
          gap: 5px;
          margin-top: 1rem;
          padding-bottom: 25px;
          border-bottom: 1px solid #ddd;
        }
        
        .timeline-point {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        
        .timeline-bar {
          width: 80%;
          background-color: #007bff;
          border-radius: 4px 4px 0 0;
          min-height: 4px;
        }
        
        .timeline-label {
          transform: rotate(-45deg);
          font-size: 12px;
          margin-top: 10px;
          color: #666;
        }
      `;
      
      document.head.appendChild(style);
    }
    
    // Initialize when DOM is ready
    function initialize() {
      addVisualizationStyles();
      
      // Wait for analytics data to be loaded
      // The createVisualAnalytics function will be called from analytics.js
      // after the stats are loaded
    }
    
    // Start initialization
    initialize();
  });