(() => {
  const mask = document.getElementById('opening-loading');
  if (location.hash && location.hash !== '#ocean-intro') {
    mask.hidden = true;
    return;
  }

  function reveal() {
    if (mask.hasAttribute('data-revealed')) return;
    clearTimeout(deadline);
    removeEventListener('scroll', onScroll);
    removeEventListener('pageshow', onScroll);
    mask.dataset.revealed = '';
    mask.setAttribute('aria-hidden', 'true');
  }

  function onScroll() {
    // Scroll restoration and keyboard navigation may land beyond the opening.
    if (scrollY > innerHeight * .05) reveal();
  }

  const deadline = setTimeout(reveal, 1000);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('pageshow', onScroll);

  const background = new Image();
  background.src = mask.dataset.background;
  background.decode().then(reveal, reveal);
})();
