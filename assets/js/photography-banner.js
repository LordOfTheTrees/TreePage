// Homepage "latest photography" banner. Requires util.js and photo-utils.js.
document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('photography-banner');
  if (!banner) return;

  const { escapeHtml, photos } = window.TreePage;
  const { fetchPhotosFromGitHub, createDemoPhotos } = photos;

  const BANNER_COUNT = 3;
  const portfolioUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/pages/photography`;

  async function loadLatestPhotos() {
    let latest;
    try {
      latest = await fetchPhotosFromGitHub();
    } catch (error) {
      console.error('Failed to load photos for banner:', error);
      latest = createDemoPhotos();
    }
    displayPhotoBanner(latest.slice(0, BANNER_COUNT));
  }

  function displayPhotoBanner(latest) {
    if (latest.length === 0) {
      banner.innerHTML = '<div class="loading-photos"><p>No photos available</p></div>';
      return;
    }

    banner.innerHTML = latest.map((photo) => `
      <div class="photo-preview">
        <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title)}" loading="lazy">
        <div class="photo-preview-overlay">
          <div class="photo-preview-title">${escapeHtml(photo.title)}</div>
          <div class="photo-preview-location">${escapeHtml(photo.location)}</div>
        </div>
      </div>
    `).join('');
  }

  // Any preview click goes to the portfolio; one listener instead of inline onclicks.
  banner.addEventListener('click', (event) => {
    if (event.target.closest('.photo-preview')) window.location.assign(portfolioUrl);
  });

  loadLatestPhotos();
});
