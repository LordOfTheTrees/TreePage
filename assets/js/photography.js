// Photography page functionality
document.addEventListener('DOMContentLoaded', function() {
  let allPhotos = [];
  let filteredPhotos = [];
  let currentPhotoIndex = 0;
  let currentView = 'grid';

  // GitHub repository settings
  const GITHUB_USERNAME = 'LordOfTheTrees';
  const REPO_NAME = 'TreePage';
  const PHOTOS_FOLDER = 'assets/images/photography';
  
  // Initialize the photography page
  async function initPhotography() {
    try {
      await loadPhotosFromGitHub();
      populateFilters();
      filterAndDisplayPhotos();
      setupEventListeners();
    } catch (error) {
      console.error('Failed to load photography data:', error);
      showError('Failed to load photos. Please try again later.');
    }
  }
  
  // Load photos from GitHub repository
  async function loadPhotosFromGitHub() {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PHOTOS_FOLDER}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const files = await response.json();
      const photoFiles = files.filter(file => 
        file.type === 'file' && 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      );
      
      allPhotos = await Promise.all(photoFiles.map(async (file) => {
        // Try to get photo metadata from filename or commit info
        const photoData = parsePhotoFilename(file.name);
        
        return {
          id: file.sha.substring(0, 8),
          filename: file.name,
          url: file.download_url,
          title: photoData.title || file.name.replace(/\.[^/.]+$/, ""),
          location: photoData.location || 'Unknown',
          date: photoData.date || new Date(file.name.match(/\d{4}-\d{2}-\d{2}/) ? 
            file.name.match(/\d{4}-\d{2}-\d{2}/)[0] : Date.now()),
          description: photoData.description || '',
          size: file.size,
          githubUrl: file.html_url
        };
      }));
      
      // Sort by date (newest first by default)
      allPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
      
    } catch (error) {
      console.error('Error loading photos from GitHub:', error);
      // Fallback to demo data if GitHub fails
      allPhotos = createDemoPhotos();
    }
  }
  
  // Parse filename for metadata (expects format like: "2024-05-15_Naples_Italy_Sunset.jpg")
  function parsePhotoFilename(filename) {
    const parts = filename.replace(/\.[^/.]+$/, "").split('_');
    const result = {};
    
    // Try to extract date (YYYY-MM-DD format)
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      result.date = new Date(dateMatch[1]);
    }
    
    // Try to extract location and title from filename parts
    if (parts.length >= 2) {
      const nonDateParts = parts.filter(part => !part.match(/\d{4}-\d{2}-\d{2}/));
      if (nonDateParts.length >= 2) {
        result.location = nonDateParts.slice(0, -1).join(', ');
        result.title = nonDateParts[nonDateParts.length - 1].replace(/[-_]/g, ' ');
      } else if (nonDateParts.length === 1) {
        result.title = nonDateParts[0].replace(/[-_]/g, ' ');
      }
    }
    
    return result;
  }
  
  // Create demo photos if GitHub loading fails
  function createDemoPhotos() {
    return [
      {
        id: 'demo1',
        filename: 'demo1.jpg',
        url: 'https://picsum.photos/800/600?random=1',
        title: 'Mountain Sunrise',
        location: 'Rocky Mountains, Colorado',
        date: new Date('2024-03-15'),
        description: 'Early morning light hitting the mountain peaks',
        size: 245760
      },
      {
        id: 'demo2', 
        filename: 'demo2.jpg',
        url: 'https://picsum.photos/800/600?random=2',
        title: 'Ocean Waves',
        location: 'Pacific Coast, California',
        date: new Date('2024-02-20'),
        description: 'Powerful waves crashing against the rocky shore',
        size: 189432
      },
      {
        id: 'demo3',
        filename: 'demo3.jpg', 
        url: 'https://picsum.photos/800/600?random=3',
        title: 'City Lights',
        location: 'New York City, New York',
        date: new Date('2024-01-10'),
        description: 'Urban landscape at twilight',
        size: 334521
      }
    ];
  }
  
  // Populate filter dropdowns
  function populateFilters() {
    const locationFilter = document.getElementById('location-filter');
    const locations = [...new Set(allPhotos.map(photo => photo.location))].sort();
    
    // Clear existing options except "All Locations"
    locationFilter.innerHTML = '<option value="all">All Locations</option>';
    
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }
  
  // Filter and display photos based on current filters
  function filterAndDisplayPhotos() {
    const locationFilter = document.getElementById('location-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const searchTerm = document.getElementById('search-photos').value.toLowerCase();
    
    // Apply filters
    filteredPhotos = allPhotos.filter(photo => {
      const matchesLocation = locationFilter === 'all' || photo.location === locationFilter;
      const matchesSearch = !searchTerm || 
        photo.title.toLowerCase().includes(searchTerm) ||
        photo.location.toLowerCase().includes(searchTerm) ||
        photo.description.toLowerCase().includes(searchTerm);
      
      return matchesLocation && matchesSearch;
    });
    
    // Apply sorting
    if (dateFilter === 'oldest') {
      filteredPhotos.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      filteredPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    displayPhotos();
  }
  
  // Display photos in the gallery
  function displayPhotos() {
    const gallery = document.getElementById('photo-gallery');
    
    if (filteredPhotos.length === 0) {
      gallery.innerHTML = '<div class="no-photos"><p>No photos found matching your criteria.</p></div>';
      return;
    }
    
    const photosHTML = filteredPhotos.map((photo, index) => `
      <div class="photo-item ${currentView}-view" data-index="${index}" onclick="openPhotoModal(${index})">
        <img src="${photo.url}" alt="${photo.title}" class="photo-image" loading="lazy">
        <div class="photo-overlay">
          <div class="photo-title">${photo.title}</div>
          <div class="photo-location">${photo.location}</div>
          <div class="photo-date">${formatDate(photo.date)}</div>
        </div>
        <div class="photo-info">
          <div class="photo-title">${photo.title}</div>
          <div class="photo-location">${photo.location}</div>
          <div class="photo-date">${formatDate(photo.date)}</div>
          ${photo.description ? `<div class="photo-description">${photo.description}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    gallery.innerHTML = photosHTML;
    gallery.className = `photo-gallery ${currentView}-view`;
  }
  
  // Format date for display
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Open photo modal
  window.openPhotoModal = function(index) {
    currentPhotoIndex = index;
    const photo = filteredPhotos[index];
    
    document.getElementById('modal-image').src = photo.url;
    document.getElementById('modal-title').textContent = photo.title;
    document.getElementById('modal-location').textContent = photo.location;
    document.getElementById('modal-date').textContent = formatDate(photo.date);
    document.getElementById('modal-description').textContent = photo.description || '';
    
    document.getElementById('photo-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  };
  
  // Close photo modal
  function closePhotoModal() {
    document.getElementById('photo-modal').style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Navigate photos in modal
  function navigatePhoto(direction) {
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex < 0) {
      currentPhotoIndex = filteredPhotos.length - 1;
    } else if (currentPhotoIndex >= filteredPhotos.length) {
      currentPhotoIndex = 0;
    }
    
    openPhotoModal(currentPhotoIndex);
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // View toggle buttons
    document.getElementById('grid-view').addEventListener('click', () => {
      currentView = 'grid';
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('grid-view').classList.add('active');
      displayPhotos();
    });
    
    document.getElementById('list-view').addEventListener('click', () => {
      currentView = 'list';
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('list-view').classList.add('active');
      displayPhotos();
    });
    
    // Filter controls
    document.getElementById('location-filter').addEventListener('change', filterAndDisplayPhotos);
    document.getElementById('date-filter').addEventListener('change', filterAndDisplayPhotos);
    document.getElementById('search-photos').addEventListener('input', debounce(filterAndDisplayPhotos, 300));
    
    // Modal controls
    document.querySelector('.modal-close').addEventListener('click', closePhotoModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closePhotoModal);
    document.querySelector('.prev-photo').addEventListener('click', () => navigatePhoto(-1));
    document.querySelector('.next-photo').addEventListener('click', () => navigatePhoto(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('photo-modal').style.display === 'block') {
        switch(e.key) {
          case 'Escape':
            closePhotoModal();
            break;
          case 'ArrowLeft':
            navigatePhoto(-1);
            break;
          case 'ArrowRight':
            navigatePhoto(1);
            break;
        }
      }
    });
  }
  
  // Utility function for debouncing search
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Show error message
  function showError(message) {
    const gallery = document.getElementById('photo-gallery');
    gallery.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
  }
  
  // Get latest photos for homepage banner
  window.getLatestPhotos = function(limit = 3) {
    return allPhotos.slice(0, limit);
  };
  
  // Initialize everything
  initPhotography();
});
