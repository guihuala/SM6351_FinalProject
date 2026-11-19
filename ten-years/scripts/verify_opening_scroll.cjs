const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '../dist/opening', file), 'utf8');
const element = () => ({
  style: {},
  setAttribute() {},
  replaceChildren() {},
  append() {},
  querySelector() { return {...element(), textContent: 'Read this scene.'}; }
});

function verifySceneReversal() {
  let viewport = 800;
  let pending;
  const handlers = new Map();
  const timelines = [];
  const sections = {
    '#page-two': 2,
    '#page-three': 6,
    '#trade-total': 11
  };
  const elements = new Map();
  const context = {
    window: {dispatchEvent() {}},
    scrollY: 0,
    Event: class {},
    document: {
      createElement: element,
      createTextNode: text => text,
      fonts: {ready: {then() {}}},
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, {
            ...element(),
            getBoundingClientRect: () => ({top: sections[selector] * viewport - context.scrollY}),
            querySelectorAll: () => [element(), element(), element()]
          });
        }
        return elements.get(selector);
      }
    },
    gsap: {
      set() {},
      timeline({paused}) {
        assert.equal(paused, true);
        const timeline = {
          fromTo() { return this; },
          to() { return this; },
          progress(value) { this.value = value; }
        };
        timelines.push(timeline);
        return timeline;
      }
    },
    addEventListener(name, fn) { handlers.set(name, fn); },
    requestAnimationFrame(fn) { assert.equal(pending, undefined); pending = fn; return 1; }
  };
  vm.runInNewContext(read('depth-transition.js'), context);

  function flush() {
    const run = pending;
    pending = undefined;
    run();
  }

  function at(screens) {
    context.scrollY = viewport * screens;
    handlers.get('scroll')();
    handlers.get('scroll')();
    flush();
    return JSON.stringify({
      state: context.window.oceanStory,
      progress: timelines.map(timeline => timeline.value),
      second: elements.get('.scene-two-copy').style.visibility,
      third: elements.get('.scene-three-copy').style.visibility,
      rating: elements.get('.rating-timeline').style.visibility
    });
  }

  flush();
  const checkpoints = [0, 2.5, 4.5, 6.5, 8, 15];
  const forward = checkpoints.map(at);
  const backward = [...checkpoints].reverse().map(at).reverse();
  assert.deepEqual(backward, forward, 'A scene at the same scroll position is identical in both directions');
  assert.deepEqual(JSON.parse(forward[1]), {
    state: {intro: 1, entrance: .5, exit: 0},
    progress: [.5, 0, 0],
    second: 'visible', third: 'hidden', rating: 'hidden'
  });
  assert.equal(JSON.parse(forward[4]).second, 'hidden');
  assert.equal(JSON.parse(forward[4]).rating, 'visible');

  viewport = 480;
  context.scrollY = 6.5 * viewport;
  handlers.get('resize')();
  flush();
  assert.equal(timelines[1].value, .5, 'The reveal range follows actual section geometry after resize');
}

function verifyCounterReversal() {
  const source = read('trade.js');
  const sequence = source.slice(source.indexOf("let sequence = 'waiting'"), source.indexOf('const comparison'));
  const labels = () => ({style: {}});
  const counter = {setAttribute() {}, removeAttribute() {}};
  const timers = new Set();
  const context = {
    total: 221294.79, kg: value => String(value), counter, year: labels(), explanation: labels(),
    performance: {now: () => 0},
    setTimeout(fn) { timers.add(fn); return fn; },
    clearTimeout(fn) { timers.delete(fn); }
  };
  vm.runInNewContext(sequence, context);
  context.updateSequence(0);
  context.updateSequence(.4);
  assert.equal(timers.size, 1, 'First forward visit animates the counter');
  context.updateSequence(.35);
  assert.equal(timers.size, 0, 'Reversing cancels an unfinished counter');
  assert.equal(counter.textContent, '221294.79 kg');
  context.updateSequence(3);
  context.updateSequence(.8);
  assert.equal(timers.size, 0, 'Returning from the products shows the settled total');
  assert.equal(context.explanation.style.opacity, '1');
  context.updateSequence(.15);
  assert.equal(context.explanation.style.opacity, '1', 'The scene fades out as a whole on return');
  context.updateSequence(.4);
  assert.equal(timers.size, 0, 'Changing direction in the fade does not replay the counter');
  context.updateSequence(0);
  context.updateSequence(.4);
  assert.equal(timers.size, 1, 'A fresh visit can still animate the counter');
}

verifySceneReversal();
verifyCounterReversal();
console.log('PASS: opening scenes are reversible across direct jumps and resize, and the trade total stays settled on return.');
