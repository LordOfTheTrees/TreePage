// Photography page. Requires util.js and photo-utils.js.
document.addEventListener('DOMContentLoaded', function () {
  const { escapeHtml, debounce, photos } = window.TreePage;
  const { fetchPhotosFromGitHub, createDemoPhotos, formatDate } = photos;

  let allPhotos = [];
  let filteredPhotos = [];
  let currentPhotoIndex = 0;
  let currentView = 'grid';

  const gallery = document.getElementById('photo-gallery');
  const modal = document.getElementById('photo-modal');
  const locationFilter = document.getElementById('location-filter');
  const dateFilter = document.getElementById('date-filter');
  const searchInput = document.getElementById('search-photos');

  async function initPhotography() {
    try {
      allPhotos = await fetchPhotosFromGitHub();
    } catch (error) {
      console.error('Error loading photos from GitHub:', error);
      allPhotos = createDemoPhotos();
    }

    populateFilters();
    filterAndDisplayPhotos();
    setupEventListeners();
  }

  function populateFilters() {
    const locations = [...new Set(allPhotos.map((photo) => photo.location))].sort();
    locationFilter.innerHTML = '<option value="all">All Locations</option>';

    locations.forEach((location) => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  function filterAndDisplayPhotos() {
    const location = locationFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    filteredPhotos = allPhotos.filter((photo) => {
      const matchesLocation = location === 'all' || photo.location === location;
      const matchesSearch = !searchTerm ||
        photo.title.toLowerCase().includes(searchTerm) ||
        photo.location.toLowerCase().includes(searchTerm) ||
        photo.description.toLowerCase().includes(searchTerm);
      return matchesLocation && matchesSearch;
    });

    const oldestFirst = dateFilter.value === 'oldest';
    filteredPhotos.sort((a, b) => (oldestFirst ? a.date - b.date : b.date - a.date));

    displayPhotos();
  }

  // Every dynamic value is escaped; filenames come from the repo today, but the
  // renderer should not depend on that staying true.
  function photoCard(photo, index) {
    const title = escapeHtml(photo.title);
    const location = escapeHtml(photo.location);
    const date = escapeHtml(formatDate(photo.date));
    const description = photo.description
      ? `<div class="photo-description">${escapeHtml(photo.description)}</div>`
      : '';

    return `
      <div class="photo-item ${currentView}-view" data-index="${index}">
        <img src="${escapeHtml(photo.url)}" alt="${title}" class="photo-image" loading="lazy">
        <div class="photo-overlay">
          <div class="photo-title">${title}</div>
          <div class="photo-location">${location}</div>
          <div class="photo-date">${date}</div>
        </div>
        <div class="photo-info">
          <div class="photo-title">${title}</div>
          <div class="photo-location">${location}</div>
          <div class="photo-date">${date}</div>
          ${description}
        </div>
      </div>
    `;
  }

  function displayPhotos() {
    gallery.className = `photo-gallery ${currentView}-view`;

    if (filteredPhotos.length === 0) {
      gallery.innerHTML = '<div class="no-photos"><p>No photos found matching your criteria.</p></div>';
      return;
    }

    gallery.innerHTML = filteredPhotos.map(photoCard).join('');
  }

  function openPhotoModal(index) {
    currentPhotoIndex = index;
    const photo = filteredPhotos[index];

    document.getElementById('modal-image').src = photo.url;
    document.getElementById('modal-title').textContent = photo.title;
    document.getElementById('modal-location').textContent = photo.location;
    document.getElementById('modal-date').textContent = formatDate(photo.date);
    document.getElementById('modal-description').textContent = photo.description || '';

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closePhotoModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function navigatePhoto(direction) {
    const count = filteredPhotos.length;
    openPhotoModal((currentPhotoIndex + direction + count) % count);
  }

  function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    displayPhotos();
  }

  function setupEventListeners() {
    document.getElementById('grid-view').addEventListener('click', () => setView('grid'));
    document.getElementById('list-view').addEventListener('click', () => setView('list'));

    locationFilter.addEventListener('change', filterAndDisplayPhotos);
    dateFilter.addEventListener('change', filterAndDisplayPhotos);
    searchInput.addEventListener('input', debounce(filterAndDisplayPhotos, 300));

    // One delegated listener instead of an inline onclick per card.
    gallery.addEventListener('click', (event) => {
      const item = event.target.closest('.photo-item');
      if (item) openPhotoModal(Number(item.dataset.index));
    });

    document.querySelector('.modal-close').addEventListener('click', closePhotoModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closePhotoModal);
    document.querySelector('.prev-photo').addEventListener('click', () => navigatePhoto(-1));
    document.querySelector('.next-photo').addEventListener('click', () => navigatePhoto(1));

    document.addEventListener('keydown', (event) => {
      if (modal.style.display !== 'block') return;
      if (event.key === 'Escape') closePhotoModal();
      else if (event.key === 'ArrowLeft') navigatePhoto(-1);
      else if (event.key === 'ArrowRight') navigatePhoto(1);
    });
  }

  initPhotography();
});
