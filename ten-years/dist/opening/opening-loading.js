(() => {
  const mask = document.getElementById('opening-loading');
  if (location.hash && location.hash !== '#ocean-intro') {
    mask.hidden = true;
    return;
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new Set(['background', 'font']);
  if (!reduced.matches) {
    pending.add('fish');
    pending.add('water');
  }
  function reveal() {
    clearTimeout(deadline);
    removeEventListener('opening:asset-ready', onAssetReady);
    removeEventListener('scroll', onScroll);
    removeEventListener('pageshow', onScroll);
    reduced.removeEventListener('change', onMotionChange);
    mask.dataset.revealed = '';
    mask.setAttribute('aria-hidden', 'true');
  }

  function settle(asset) {
    if (pending.delete(asset) && !pending.size) reveal();
  }

  function onAssetReady(event) { settle(event.detail); }

  function onScroll() {
    // Scroll restoration and keyboard navigation may land beyond the opening.
    if (scrollY > innerHeight * .05) reveal();
  }

  function onMotionChange() {
    if (reduced.matches) {
      settle('fish');
      settle('water');
    }
  }

  const deadline = setTimeout(() => {
    for (const asset of ['fish', 'water']) {
      if (pending.has(asset)) mask.dataset[asset + 'Fallback'] = '';
    }
    dispatchEvent(new Event('opening:asset-fallback'));
    reveal();
  }, 8000);
  addEventListener('opening:asset-ready', onAssetReady);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('pageshow', onScroll);
  reduced.addEventListener('change', onMotionChange);

  const background = new Image();
  background.src = mask.dataset.background;
  background.decode().finally(() => settle('background')).catch(() => {});
  addEventListener('DOMContentLoaded', () => {
    document.fonts.load('500 1em Manrope').finally(() => settle('font')).catch(() => {});
  }, { once: true });
})();
