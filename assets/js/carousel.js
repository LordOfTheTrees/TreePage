// Desktop selected-work carousel. No-ops at 900px and below, where the
// cards are color bands instead of a scroller.
document.addEventListener('DOMContentLoaded', function () {
  const scroller = document.getElementById('scroller');
  if (!scroller) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  scroller.scrollLeft = 0;

  document.querySelectorAll('.carousel-nav button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!desktop.matches) return;
      const card = scroller.querySelector('.card');
      if (!card) return;
      const styles = window.getComputedStyle(scroller);
      const parsedGap = parseFloat(styles.columnGap || styles.gap);
      const gap = Number.isNaN(parsedGap) ? 0 : parsedGap;
      const step = card.getBoundingClientRect().width + gap;
      const direction = parseInt(btn.getAttribute('data-dir'), 10);
      scroller.scrollBy({
        left: direction * step,
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });
    });
  });
});
