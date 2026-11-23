const scene = document.querySelector('#scene');
const mask = document.querySelector('#opening-loading');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let app, loading = false, failed = false, playing = false, fishRequested = false;
let fishTimer, waterTimer;

function canStartFish() {
  return !document.hidden && !reduced.matches &&
    scrollY < innerHeight * 6 && (window.oceanStory?.exit ?? 0) < 1;
}

function canStartWater() {
  return !mask?.hasAttribute('data-water-fallback') &&
    !document.hidden && !reduced.matches && scrollY <= innerHeight * .05;
}

function syncScene() {
  const intro = window.oceanStory?.intro ?? 0;
  const visible = !failed && !mask?.hasAttribute('data-water-fallback') && !reduced.matches && intro < 1;
  if (scene.hidden === visible) scene.hidden = !visible;
  if (!canStartFish()) {
    clearTimeout(fishTimer);
    fishTimer = undefined;
  } else if (!fishRequested && fishTimer === undefined) {
    // Let the static opening paint before allocating the first WebGL renderer.
    fishTimer = setTimeout(() => {
      fishTimer = undefined;
      if (!canStartFish()) return;
      fishRequested = true;
      import('./fish.js?v=opening-loading').catch(error => {
        dispatchEvent(new CustomEvent('opening:asset-ready', {detail: 'fish'}));
        console.warn('The animated shark is unavailable.', error);
      });
    }, 350);
  }
  const active = visible && !document.hidden && intro < .65;
  if (app && playing !== active) {
    playing = active;
    if (active) app.play();
    else app.stop();
  }
  if (!canStartWater()) {
    clearTimeout(waterTimer);
    waterTimer = undefined;
  } else if (!app && !loading && active && waterTimer === undefined) {
    // Start water alongside the shark when the loading screen is waiting for it.
    const waiting = mask && !mask.hidden && !mask.hasAttribute('data-revealed');
    waterTimer = setTimeout(() => {
      waterTimer = undefined;
      if (canStartWater()) loadScene();
    }, waiting ? 0 : 2600);
  }
}

async function loadScene() {
  loading = true;
  try {
    const { Application } = await import('https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.184/build/runtime.js');
    if (!canStartWater()) {
      loading = false;
      return;
    }
    const instance = new Application(scene);
    await instance.load('https://prod.spline.design/nKLH316Z3wAxXA5k/scene.splinecode');
    if (mask?.hasAttribute('data-water-fallback')) {
      instance.stop();
      return;
    }
    app = window.splineApp = instance;
    playing = true;
    syncScene();
    dispatchEvent(new CustomEvent('opening:asset-ready', {detail: 'water'}));
  } catch (error) {
    failed = true;
    scene.hidden = true;
    dispatchEvent(new CustomEvent('opening:asset-ready', {detail: 'water'}));
    console.warn('The animated water is unavailable.', error);
  }
}

addEventListener('opening:progress', syncScene);
addEventListener('opening:asset-fallback', syncScene);
addEventListener('scroll', syncScene, {passive: true});
document.addEventListener('visibilitychange', syncScene);
reduced.addEventListener('change', syncScene);
syncScene();
