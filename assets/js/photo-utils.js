// Photo loading and filename parsing, shared by the photography page and the
// homepage banner. Requires util.js. Exposed as window.TreePage.photos.
(function (global) {
  'use strict';

  const GITHUB_USERNAME = 'LordOfTheTrees';
  const REPO_NAME = 'TreePage';
  const PHOTOS_FOLDER = 'assets/images/photography';
  const PHOTO_EXTENSION = /\.(jpg|jpeg|png|gif|webp)$/i;
  const DATE_IN_NAME = /(\d{4}-\d{2}-\d{2})/;

  const stripExtension = (name) => name.replace(/\.[^/.]+$/, '');

  // Reads metadata out of a filename shaped like "2024-05-15_Naples_Italy_Sunset.jpg":
  // the date, then every underscore-separated part but the last is location,
  // and the last part is the title.
  function parsePhotoFilename(filename) {
    const parts = stripExtension(filename).split('_');
    const result = {};

    const dateMatch = filename.match(DATE_IN_NAME);
    if (dateMatch) {
      result.date = new Date(dateMatch[1]);
    }

    if (parts.length >= 2) {
      const nonDateParts = parts.filter((part) => !DATE_IN_NAME.test(part));
      if (nonDateParts.length >= 2) {
        result.location = nonDateParts.slice(0, -1).join(', ');
        result.title = nonDateParts[nonDateParts.length - 1].replace(/[-_]/g, ' ');
      } else if (nonDateParts.length === 1) {
        result.title = nonDateParts[0].replace(/[-_]/g, ' ');
      }
    }

    return result;
  }

  function toPhoto(file) {
    const meta = parsePhotoFilename(file.name);
    return {
      id: file.sha.substring(0, 8),
      filename: file.name,
      url: file.download_url,
      title: meta.title || stripExtension(file.name),
      location: meta.location || 'Unknown',
      // Undated files sort as newest.
      date: meta.date || new Date(),
      description: meta.description || '',
      size: file.size,
      githubUrl: file.html_url
    };
  }

  // Lists the photos folder through the GitHub contents API. Newest first.
  // Throws on any failure; callers decide what to fall back to.
  async function fetchPhotosFromGitHub() {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PHOTOS_FOLDER}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();
    return files
      .filter((file) => file.type === 'file' && PHOTO_EXTENSION.test(file.name))
      .map(toPhoto)
      .sort((a, b) => b.date - a.date);
  }

  // Placeholder set used when GitHub is unreachable.
  function createDemoPhotos() {
    return [
      {
        id: 'demo1',
        filename: 'demo1.jpg',
        url: 'https://picsum.photos/800/600?random=1',
        title: 'Mountain Sunrise',
        location: 'Rocky Mountains, Colorado',
        date: new Date('2024-03-15'),
        description: 'Early morning light hitting the mountain peaks'
      },
      {
        id: 'demo2',
        filename: 'demo2.jpg',
        url: 'https://picsum.photos/800/600?random=2',
        title: 'Ocean Waves',
        location: 'Pacific Coast, California',
        date: new Date('2024-02-20'),
        description: 'Powerful waves crashing against the rocky shore'
      },
      {
        id: 'demo3',
        filename: 'demo3.jpg',
        url: 'https://picsum.photos/800/600?random=3',
        title: 'City Lights',
        location: 'New York City, New York',
        date: new Date('2024-01-10'),
        description: 'Urban landscape at twilight'
      }
    ];
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  global.TreePage = Object.assign(global.TreePage || {}, {
    photos: { parsePhotoFilename, fetchPhotosFromGitHub, createDemoPhotos, formatDate }
  });
})(window);
