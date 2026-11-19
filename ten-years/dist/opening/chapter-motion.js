const intro = document.querySelector('#trade-intro');
const chart = document.querySelector('#annual-trade');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let frame, introVisible = false;

function ease(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

function renderIntro() {
  frame = undefined;
  if (reduced.matches || !introVisible) return;
  const {top, bottom} = intro.getBoundingClientRect();
  if (top > innerHeight || bottom < 0) return;
  const progress = (innerHeight - top) / innerHeight;
  intro.style.setProperty('--trade-period-progress', ease((progress - .22) / .34));
  intro.style.setProperty('--trade-title-progress', ease((progress - .37) / .42));
  intro.style.setProperty('--trade-copy-progress', ease((progress - .67) / .52));
  intro.dataset.introMotion = '';
}

function requestIntro() {
  if (introVisible && !reduced.matches && frame === undefined) frame = requestAnimationFrame(renderIntro);
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.target === intro) {
      introVisible = entry.isIntersecting;
      requestIntro();
    } else if (!entry.isIntersecting) {
      delete chart.dataset.chartEntered;
    } else if (entry.intersectionRatio >= .24) {
      chart.dataset.chartEntered = '';
    }
  }
}, {threshold: [0, .24]});
observer.observe(intro);
observer.observe(chart);

addEventListener('scroll', requestIntro, {passive: true});
addEventListener('resize', requestIntro);
addEventListener('pageshow', requestIntro);
reduced.addEventListener('change', requestIntro);
