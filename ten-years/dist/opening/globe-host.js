const frame = document.querySelector('#distribution-trade .globe-frame');
let connectedDocument;
let pendingScroll = 0;
let scrollFrame;

function scrollPage(delta) {
  pendingScroll += delta;
  if (scrollFrame !== undefined) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = undefined;
    const top = pendingScroll;
    pendingScroll = 0;
    if (top) window.scrollBy({ top, behavior: 'instant' });
  });
}

function connectGlobe() {
  const doc = frame.contentDocument;
  if (!doc || doc.URL === 'about:blank' || doc === connectedDocument) return;
  connectedDocument = doc;
  let gesture = null;

  const field = target => target.closest('input, select, textarea, [contenteditable="true"]');
  const localPanel = target => target.closest('.detail-panel');

  function canScrollPanel(panel, delta) {
    if (!panel) return false;
    const maximum = panel.scrollHeight - panel.clientHeight;
    return delta < 0 ? panel.scrollTop > 1 : panel.scrollTop < maximum - 1;
  }

  // Capture the wheel before the globe's camera controls use it to zoom.
  doc.addEventListener('wheel', event => {
    const { deltaY, deltaX, deltaMode, target } = event;
    if (!deltaY || Math.abs(deltaX) > Math.abs(deltaY) || event.shiftKey ||
        event.ctrlKey || event.metaKey || field(target) || canScrollPanel(localPanel(target), deltaY)) return;
    event.preventDefault();
    event.stopPropagation();
    scrollPage(deltaY * (deltaMode === 1 ? 18 : deltaMode === 2 ? innerHeight : 1));
  }, { capture: true, passive: false });

  function gestureDirection(x, y) {
    if (!gesture.direction) {
      const horizontal = Math.abs(x - gesture.x);
      const vertical = Math.abs(y - gesture.y);
      if (Math.max(horizontal, vertical) >= 8) {
        gesture.direction = vertical > horizontal ? 'vertical' : 'horizontal';
      }
    }
    return gesture.direction;
  }

  doc.addEventListener('touchstart', event => {
    gesture = null;
    if (event.touches.length !== 1 || field(event.target)) return;
    const point = event.touches[0];
    // Screen coordinates stay stable as scrolling moves the iframe.
    gesture = { x: point.screenX, y: point.screenY, lastY: point.screenY, target: event.target };
  }, { passive: true });

  // A vertical swipe moves the story. Horizontal drags and two fingers still reach the globe.
  doc.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || !gesture || !gesture.target.closest('.scene')) return;
    if (gestureDirection(event.screenX, event.screenY) !== 'horizontal') event.stopPropagation();
  }, { capture: true });

  doc.addEventListener('touchmove', event => {
    if (!gesture || event.touches.length !== 1) return;
    const point = event.touches[0];
    if (gestureDirection(point.screenX, point.screenY) !== 'vertical') return;
    const delta = gesture.lastY - point.screenY;
    gesture.lastY = point.screenY;
    if (!delta || canScrollPanel(localPanel(gesture.target), delta)) return;
    if (event.cancelable) event.preventDefault();
    scrollPage(delta);
  }, { passive: false });

  for (const type of ['touchend', 'touchcancel']) {
    doc.addEventListener(type, () => { gesture = null; }, { passive: true });
  }

  doc.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || field(event.target)) return;
    const onControl = event.target.closest('button, a, [role="button"]');
    const delta = ({
      PageDown: innerHeight * .85,
      PageUp: -innerHeight * .85,
      ArrowDown: onControl ? 0 : 64,
      ArrowUp: onControl ? 0 : -64,
      ' ': onControl ? 0 : innerHeight * .85 * (event.shiftKey ? -1 : 1),
    })[event.key];
    if (!delta || canScrollPanel(localPanel(event.target), delta)) return;
    event.preventDefault();
    scrollPage(delta);
  });
}

if (frame) {
  frame.addEventListener('load', connectGlobe);
  connectGlobe();
}
