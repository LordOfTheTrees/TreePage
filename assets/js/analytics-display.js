// Enhanced display for analytics data
document.addEventListener('DOMContentLoaded', function() {
    // Only run on the analytics page
    if (!window.location.pathname.includes('analytics-view.html')) {
      return;
    }
    
    // Create more visual representations of the data
    // Called from analytics.js with the visits array from assets/data/analytics-stats.json
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
      const totalVisits = visits.length;
      
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
    
    function startOfWeekMondayUTC(d) {
      const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const dow = new Date(utc).getUTCDay();
      const diffToMonday = dow === 0 ? -6 : 1 - dow;
      return new Date(utc + diffToMonday * 86400000);
    }

    function addDaysUTC(monday, n) {
      const x = new Date(monday.getTime());
      x.setUTCDate(x.getUTCDate() + n);
      return x;
    }

    function weekKeyUTC(ts) {
      const m = startOfWeekMondayUTC(new Date(ts));
      return m.toISOString().slice(0, 10);
    }

    const TOTAL_WEEKS = 52;
    const VISIBLE_WEEKS = 16;

    function createVisitTimeline(container, visits) {
      const visitsByWeek = {};
      visits.forEach(visit => {
        const key = weekKeyUTC(visit.timestamp);
        visitsByWeek[key] = (visitsByWeek[key] || 0) + 1;
      });

      let maxTs = 0;
      visits.forEach(v => {
        const t = new Date(v.timestamp).getTime();
        if (t > maxTs) maxTs = t;
      });
      const anchor = new Date(Math.max(maxTs, Date.now()));
      const latestMonday = startOfWeekMondayUTC(anchor);

      const weeksData = [];
      for (let i = 0; i < TOTAL_WEEKS; i++) {
        const monday = addDaysUTC(latestMonday, -(TOTAL_WEEKS - 1 - i) * 7);
        const key = monday.toISOString().slice(0, 10);
        const count = visitsByWeek[key] || 0;
        const label = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        weeksData.push({ monday, key, count, label });
      }

      const section = document.createElement('div');
      section.className = 'visual-section timeline-section';

      const heading = document.createElement('h3');
      heading.textContent = 'Visit timeline (weekly)';
      section.appendChild(heading);

      const help = document.createElement('p');
      help.className = 'timeline-help';
      help.textContent =
        `Each bar is one week (Monday–Sunday). Showing ${VISIBLE_WEEKS} weeks (~four months) at a time over the last ${TOTAL_WEEKS} weeks. Use the slider to view earlier periods.`;
      section.appendChild(help);

      const controls = document.createElement('div');
      controls.className = 'timeline-controls';

      const sliderLabel = document.createElement('label');
      sliderLabel.className = 'timeline-slider-label';
      sliderLabel.setAttribute('for', 'timeline-week-window');
      sliderLabel.innerHTML =
        '<span class="timeline-slider-hint">Earlier</span><span class="timeline-slider-hint">More recent</span>';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = 'timeline-week-window';
      slider.className = 'timeline-slider';
      slider.min = '0';
      slider.max = String(TOTAL_WEEKS - VISIBLE_WEEKS);
      slider.value = String(TOTAL_WEEKS - VISIBLE_WEEKS);
      slider.setAttribute('aria-valuemin', '0');
      slider.setAttribute('aria-valuemax', String(TOTAL_WEEKS - VISIBLE_WEEKS));
      slider.setAttribute(
        'aria-label',
        'Scroll the weekly chart between older and more recent weeks'
      );

      controls.appendChild(sliderLabel);
      controls.appendChild(slider);
      section.appendChild(controls);

      const timeline = document.createElement('div');
      timeline.className = 'visit-timeline';
      timeline.setAttribute('role', 'img');
      timeline.setAttribute('aria-label', 'Weekly visit counts');

      function renderWindow(startIndex) {
        const slice = weeksData.slice(startIndex, startIndex + VISIBLE_WEEKS);
        const maxVisits = Math.max(1, ...slice.map(w => w.count));
        timeline.innerHTML = '';
        slice.forEach(week => {
          const height = (week.count / maxVisits) * 100;
          const bar = document.createElement('div');
          bar.className = 'timeline-bar';
          bar.style.height = height + '%';
          bar.title = `Week of ${week.key}: ${week.count} visit(s)`;

          const label = document.createElement('div');
          label.className = 'timeline-label';
          label.textContent = week.label;

          const point = document.createElement('div');
          point.className = 'timeline-point';
          point.appendChild(bar);
          point.appendChild(label);

          timeline.appendChild(point);
        });
      }

      const startIndex = () => parseInt(slider.value, 10);
      renderWindow(startIndex());

      slider.addEventListener('input', () => {
        renderWindow(startIndex());
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
    
    
    // Initialize when DOM is ready
    function initialize() {
      // Wait for analytics data to be loaded
      // The createVisualAnalytics function will be called from analytics.js
      // after the stats are loaded
    }
    
    // Start initialization
    initialize();
  });