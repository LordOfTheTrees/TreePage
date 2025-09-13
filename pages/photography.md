---
layout: page
title: Photography
permalink: /pages/photography/
---

<div class="photography-header">
  <h1>Photography Portfolio</h1>
  <p class="photography-subtitle">Capturing moments through my lens</p>
</div>

<div class="photography-controls">
  <div class="view-controls">
    <button id="grid-view" class="view-btn active" data-view="grid">
      <span class="icon">⊞</span> Grid
    </button>
    <button id="list-view" class="view-btn" data-view="list">
      <span class="icon">☰</span> List
    </button>
  </div>
  
  <div class="filter-controls">
    <select id="location-filter" class="filter-select">
      <option value="all">All Locations</option>
    </select>
    
    <select id="date-filter" class="filter-select">
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
    </select>
    
    <input type="text" id="search-photos" placeholder="Search photos..." class="search-input">
  </div>
</div>

<div id="photo-gallery" class="photo-gallery grid-view">
  <div class="loading-spinner">
    <p>Loading photography portfolio...</p>
  </div>
</div>

<div id="photo-modal" class="photo-modal">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <button class="modal-nav prev-photo">❮</button>
    <button class="modal-nav next-photo">❯</button>
    <div class="modal-image-container">
      <img id="modal-image" src="" alt="">
    </div>
    <div class="modal-info">
      <h3 id="modal-title"></h3>
      <p id="modal-location"></p>
      <p id="modal-date"></p>
      <p id="modal-description"></p>
    </div>
  </div>
</div>

<script src="{{ site.baseurl }}/assets/js/photography.js"></script>

<style>
.photography-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.photography-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.photography-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn.active {
  background: #0366d6;
  color: white;
  border-color: #0366d6;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select, .search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  width: 200px;
}

.photo-gallery {
  margin-bottom: 2rem;
}

.photo-gallery.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.photo-gallery.list-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.photo-item.list-view {
  display: flex;
  flex-direction: row;
  max-height: 200px;
}

.photo-item.list-view .photo-image {
  width: 300px;
  height: 200px;
  flex-shrink: 0;
}

.photo-item.list-view .photo-info {
  padding: 1rem;
  flex: 1;
}

.photo-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 1rem;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-overlay {
  transform: translateY(0);
}

.photo-info {
  padding: 1rem;
}

.photo-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.photo-location {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.photo-date {
  color: #888;
  font-size: 0.8rem;
}

.photo-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

.modal-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 2rem;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1001;
}

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  padding: 1rem;
  cursor: pointer;
  border-radius: 4px;
  z-index: 1001;
}

.prev-photo {
  left: 30px;
}

.next-photo {
  right: 30px;
}

.modal-image-container {
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.modal-info {
  position: absolute;
  bottom: 20px;
  left: 30px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 1rem;
  border-radius: 4px;
  max-width: 400px;
}

.loading-spinner {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .photography-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
    margin-top: 0.5rem;
  }
  
  .photo-gallery.grid-view {
    grid-template-columns: 1fr;
  }
  
  .photo-item.list-view {
    flex-direction: column;
    max-height: none;
  }
  
  .photo-item.list-view .photo-image {
    width: 100%;
    height: 200px;
  }
  
  .modal-nav {
    display: none;
  }
  
  .modal-info {
    position: relative;
    bottom: auto;
    left: auto;
    margin-top: 1rem;
    max-width: none;
  }
}
</style>
