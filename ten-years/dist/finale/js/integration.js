// The optional host owns page scrolling; the standalone chapter keeps its native behaviour.
const embedded = window.parent !== window && new URLSearchParams(location.search).get('integrated') === '1';

if (embedded) {
  document.documentElement.dataset.integrated = 'true';
  const channel = 'sm6351-finale', origin = location.origin;
  globalThis.__MARINE_EMBEDDED = true;
  globalThis.__MARINE_HOST_ACTIVE = false;
  let active = false, lastExternalY = 0, lastNavigationY = null;
  let heightFrame = 0, scrollFrame = 0, readySent = false, lastHeight = 0, touch = null;

  const send = (type, detail = {}) => window.parent.postMessage({channel, type, ...detail}, origin);
  const maximumY = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const clampY = value => Math.max(0, Math.min(Number(value) || 0, maximumY()));
  const element = target => target?.nodeType === 1 ? target : target?.parentElement;
  const nativeControl = target => Boolean(element(target)?.closest('input,select,textarea,[contenteditable="true"],[role="slider"]'));
  const modalOpen = () => Boolean(document.querySelector('dialog[open]'));

  function canScrollLocally(target, delta, axis = 'y') {
    for (let node = element(target); node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node), horizontal = axis === 'x';
      if (!/(auto|scroll|overlay)/.test(horizontal ? style.overflowX : style.overflowY)) continue;
      const position = horizontal ? node.scrollLeft : node.scrollTop;
      const range = horizontal ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
      if (range > 1 && (delta < 0 ? position > 1 : position < range - 1)) return true;
    }
    return false;
  }

  function reportHeight() {
    heightFrame = 0;
    const height = Math.ceil(Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0, innerHeight));
    if (!readySent) {
      readySent = true; lastHeight = height;
      send('ready', {height});
    } else if (Math.abs(height - lastHeight) > 1) {
      lastHeight = height;
      send('resize', {height});
    }
  }

  function requestHeight() {
    if (!heightFrame) heightFrame = requestAnimationFrame(reportHeight);
  }

  function connectChapter() {
    const api = window.marineChapter;
    if (!api?.setHostActive) return false;
    api.setHostActive(active);
    requestHeight();
    return true;
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== origin) return;
    const message = event.data;
    if (!message || message.channel !== channel || message.type !== 'viewport' ||
        typeof message.y !== 'number' || !Number.isFinite(message.y) || typeof message.active !== 'boolean') return;
    active = message.active;
    globalThis.__MARINE_HOST_ACTIVE = active;
    lastExternalY = clampY(message.y);
    lastNavigationY = null;
    window.scrollTo({top: lastExternalY, behavior: 'instant'});
    connectChapter();
  });

  document.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const y = clampY(window.scrollY);
      if (!active || Math.abs(y - lastExternalY) <= 1 ||
          (lastNavigationY !== null && Math.abs(y - lastNavigationY) <= 1)) return;
      lastNavigationY = y;
      send('navigate', {y});
    });
  }, {passive: true});

  document.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || nativeControl(event.target)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight : 1);
    if (!delta || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (canScrollLocally(event.target, delta)) return;
    if (event.cancelable) event.preventDefault();
    if (!modalOpen()) send('scroll', {delta});
  }, {passive: false});

  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || nativeControl(event.target)) { touch = null; return; }
    const point = event.touches[0];
    touch = {x: point.clientX, y: point.clientY, target: event.target};
  }, {passive: true});
  document.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) { touch = null; return; }
    const point = event.touches[0], dx = touch.x - point.clientX, delta = touch.y - point.clientY;
    touch.x = point.clientX; touch.y = point.clientY;
    if (!delta || Math.abs(dx) > Math.abs(delta) || canScrollLocally(touch.target, delta)) return;
    if (event.cancelable) event.preventDefault();
    if (!modalOpen()) send('scroll', {delta});
  }, {passive: false});
  for (const name of ['touchend', 'touchcancel']) document.addEventListener(name, () => { touch = null; }, {passive: true});

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || modalOpen() ||
        nativeControl(event.target) || element(event.target)?.closest('button,a,[role="button"]')) return;
    const delta = ({ArrowDown: 64, ArrowUp: -64, PageDown: innerHeight * .85,
      PageUp: -innerHeight * .85, ' ': innerHeight * .85 * (event.shiftKey ? -1 : 1)})[event.key];
    if (delta !== undefined) {
      if (canScrollLocally(event.target, delta)) return;
      event.preventDefault(); send('scroll', {delta});
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); send('navigate', {y: event.key === 'Home' ? 0 : maximumY()});
    }
  });

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = element(event.target)?.closest('a');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (link.hasAttribute('data-finale-previous') || link.hasAttribute('data-finale-home')) {
      event.preventDefault(); send(link.hasAttribute('data-finale-previous') ? 'previous' : 'home'); return;
    }
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch { return; }
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;
    event.preventDefault();
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const y = clampY(target.getBoundingClientRect().top + window.scrollY - padding);
    if (location.hash !== href) history.pushState(null, '', href);
    send('navigate', {y});
    target.focus?.({preventScroll: true});
  });

  function start() {
    requestHeight();
    const observer = new ResizeObserver(requestHeight);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
    document.fonts?.ready.then(requestHeight);
    document.addEventListener('load', requestHeight, true);
    window.addEventListener('resize', requestHeight);
    let remaining = 180;
    function poll() { if (!connectChapter() && --remaining > 0) requestAnimationFrame(poll); }
    poll();
  }
  document.addEventListener('marine:ready', () => { connectChapter(); requestHeight(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
}
