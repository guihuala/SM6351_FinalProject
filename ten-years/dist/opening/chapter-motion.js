const intro = document.querySelector('#trade-intro');
const chart = document.querySelector('#annual-trade');
const products = document.querySelector('#product-forms');
const shark = intro.querySelector('.dv-trade-shark');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const visible = new Set();
let frame, drawShark;

function ease(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

function render() {
  frame = undefined;
  const height = innerHeight;
  const scenes = Array.from(visible, scene => [scene, scene.getBoundingClientRect()]);
  for (const [scene, {top, bottom}] of scenes) {
    const enter = (height - top) / height;
    const remaining = bottom / height;
    const reveal = ease((enter - .1) / .52);
    const leave = ease(remaining / .45);
    scene.style.setProperty('--trade-scene-opacity', reveal * leave);
    scene.style.setProperty('--trade-scene-offset', 1 - reveal);
    if (scene !== intro) continue;
    const sharkProgress = ease((enter - .48) / .82);
    drawShark?.(reduced.matches ? .7 : sharkProgress);
    intro.style.setProperty('--trade-period-progress', ease((enter - .22) / .34));
    intro.style.setProperty('--trade-title-progress', ease((enter - .37) / .42));
    intro.style.setProperty('--trade-copy-progress', ease((enter - .67) / .52));
    intro.style.setProperty('--trade-shark-progress', ease((enter - .48) / .49));
  }
}

function requestRender() {
  if (visible.size && frame === undefined) frame = requestAnimationFrame(render);
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
  requestRender();
});
for (const scene of [intro, chart, products]) {
  if (scene) observer.observe(scene);
}

if (shark) {
  const preload = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    preload.disconnect();
    import('./chapter-shark.js').then(({loadChapterShark}) => loadChapterShark(shark)).then(draw => {
      drawShark = draw;
      // Prepare the first frame before the model scrolls into view.
      if (!visible.has(intro)) draw(reduced.matches ? .7 : 0);
      new ResizeObserver(requestRender).observe(shark);
      requestRender();
    }).catch(error => console.warn('The Fin trade shark could not load.', error));
  }, {rootMargin: '100% 0px'});
  preload.observe(intro);
}

addEventListener('scroll', requestRender, {passive: true});
addEventListener('resize', requestRender);
addEventListener('pageshow', requestRender);
reduced.addEventListener('change', requestRender);
