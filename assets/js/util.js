// Shared browser helpers. Loaded first, on every page, from _layouts/default.html,
// and exposed on window.TreePage so the other scripts can share one copy.
(function (global) {
  'use strict';

  // Escape a value for safe interpolation into HTML. Every dynamic string that
  // ends up in innerHTML goes through this, whatever its source.
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Collapse a burst of calls into one, `wait` ms after the last.
  function debounce(fn, wait) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  global.TreePage = Object.assign(global.TreePage || {}, { escapeHtml, debounce });
})(window);
