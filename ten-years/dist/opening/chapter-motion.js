const intro = document.querySelector('#trade-intro');
const chart = document.querySelector('#annual-trade');
const products = document.querySelector('#product-forms');
const shark = intro.querySelector('.dv-trade-shark');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let frame, drawShark, sharkRequested = false, introVisible = false;

function ease(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

function renderIntro() {
  frame = undefined;
  if (!introVisible) return;
  const {top, bottom} = intro.getBoundingClientRect();
  if (top > innerHeight || bottom < 0) return;
  const progress = (innerHeight - top) / innerHeight;
  drawShark?.(reduced.matches ? .7 : ease((progress - .48) / .82));
  if (reduced.matches) return;
  intro.style.setProperty('--trade-period-progress', ease((progress - .22) / .34));
  intro.style.setProperty('--trade-title-progress', ease((progress - .37) / .42));
  intro.style.setProperty('--trade-copy-progress', ease((progress - .67) / .52));
  intro.style.setProperty('--trade-shark-progress', ease((progress - .48) / .49));
  intro.dataset.introMotion = '';
}

function requestIntro() {
  if (introVisible && frame === undefined) frame = requestAnimationFrame(renderIntro);
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.target === intro) {
      introVisible = entry.isIntersecting;
      if (introVisible && shark && !sharkRequested) {
        sharkRequested = true;
        import('./chapter-shark.js').then(({loadChapterShark}) => loadChapterShark(shark)).then(draw => {
          drawShark = draw;
          shark.hidden = false;
          new ResizeObserver(requestIntro).observe(shark);
          requestIntro();
        }).catch(error => console.warn('The Fin trade shark could not load.', error));
      }
      requestIntro();
    } else if (!entry.isIntersecting) {
      delete entry.target.dataset.chartEntered;
    } else if (entry.intersectionRatio >= .24) {
      entry.target.dataset.chartEntered = '';
    }
  }
}, {threshold: [0, .24]});
observer.observe(intro);
observer.observe(chart);
if (products) observer.observe(products);

addEventListener('scroll', requestIntro, {passive: true});
addEventListener('resize', requestIntro);
addEventListener('pageshow', requestIntro);
reduced.addEventListener('change', requestIntro);
