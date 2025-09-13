// Photography banner for homepage
document.addEventListener('DOMContentLoaded', function() {
  const banner = document.getElementById('photography-banner');
  
  // Only run on pages that have the photography banner
  if (!banner) return;
  
  // GitHub repository settings
  const GITHUB_USERNAME = 'LordOfTheTrees';
  const REPO_NAME = 'TreePage';
  const PHOTOS_FOLDER = 'assets/images/photography';
  
  // Load and display latest photos
  async function loadLatestPhotos() {
    try {
      const photos = await fetchPhotosFromGitHub();
      displayPhotoBanner(photos.slice(0, 3)); // Show 3 latest photos
    } catch (error) {
      console.error('Failed to load photos for banner:', error);
      displayPhotoBanner(createDemoPhotos().slice(0, 3));
    }
  }
  
  // Fetch photos from GitHub API
  async function fetchPhotosFromGitHub() {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PHOTOS_FOLDER}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const files = await response.json();
    const photoFiles = files.filter(file => 
      file.type === 'file' && 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
    );
    
    const photos = photoFiles.map(file => {
      const photoData = parsePhotoFilename(file.name);
      
      return {
        id: file.sha.substring(0, 8),
        filename: file.name,
        url: file.download_url,
        title: photoData.title || file.name.replace(/\.[^/.]+$/, ""),
        location: photoData.location || 'Unknown',
        date: photoData.date || new Date(),
        description: photoData.description || ''
      };
    });
    
    // Sort by date (newest first)
    return photos.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  // Parse filename for metadata
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
        url: 'https://picsum.photos/600/400?random=1',
        title: 'Mountain Sunrise',
        location: 'Rocky Mountains, Colorado',
        date: new Date('2024-03-15'),
        description: 'Early morning light hitting the mountain peaks'
      },
      {
        id: 'demo2', 
        filename: 'demo2.jpg',
        url: 'https://picsum.photos/600/400?random=2',
        title: 'Ocean Waves',
        location: 'Pacific Coast, California',
        date: new Date('2024-02-20'),
        description: 'Powerful waves crashing against the rocky shore'
      },
      {
        id: 'demo3',
        filename: 'demo3.jpg', 
        url: 'https://picsum.photos/600/400?random=3',
        title: 'City Lights',
        location: 'New York City, New York',
        date: new Date('2024-01-10'),
        description: 'Urban landscape at twilight'
      }
    ];
  }
  
  // Display photos in banner
  function displayPhotoBanner(photos) {
    if (!photos || photos.length === 0) {
      banner.innerHTML = '<div class="loading-photos"><p>No photos available</p></div>';
      return;
    }
    
    const photosHTML = photos.map(photo => `
      <div class="photo-preview" onclick="window.open('${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/pages/photography', '_self')">
        <img src="${photo.url}" alt="${photo.title}" loading="lazy">
        <div class="photo-preview-overlay">
          <div class="photo-preview-title">${photo.title}</div>
          <div class="photo-preview-location">${photo.location}</div>
        </div>
      </div>
    `).join('');
    
    banner.innerHTML = photosHTML;
  }
  
  // Initialize banner
  loadLatestPhotos();
});
