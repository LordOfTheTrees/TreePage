javascript
// This file works with analytics.html to track visitor information
document.addEventListener('DOMContentLoaded', function() {
  // Function to export visitor data as a JSON file
  window.exportVisitorData = function() {
    const visits = JSON.parse(localStorage.getItem('site_visits') || '[]');
    
    if (visits.length === 0) {
      alert('No visitor data available.');
      return;
    }
    
    // Create a downloadable JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(visits, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "visitor_data_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Add an admin panel link to the footer if you're the admin
  const isAdmin = localStorage.getItem('site_admin') === 'true';
  if (isAdmin) {
    const footer = document.querySelector('.site-footer .social-links');
    if (footer) {
      const adminLink = document.createElement('a');
      adminLink.href = '#';
      adminLink.innerHTML = '<span class="icon">Analytics</span>';
      adminLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.exportVisitorData();
      });
      footer.appendChild(adminLink);
    }
  }
  
  // Set admin status (you would normally use a password, this is just for demo)
  window.setAdminStatus = function() {
    const password = prompt('Enter admin password:');
    if (password === 'temporary_password') {
      localStorage.setItem('site_admin', 'true');
      alert('Admin status granted. Refresh the page to see admin controls.');
    }
  };
});