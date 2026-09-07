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

<script src="{{ site.baseurl }}/assets/js/photo-utils.js"></script>
<script src="{{ site.baseurl }}/assets/js/photography.js"></script>
