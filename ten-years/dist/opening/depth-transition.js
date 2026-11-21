const state = window.oceanStory = {intro: 0, entrance: 0, exit: 0};
const background = document.querySelector('.deep-background');
const title = document.querySelector('.ocean-title');
const cue = document.querySelector('.scroll-cue');
const secondSection = document.querySelector('#page-two');
const thirdSection = document.querySelector('#page-three');
const tradeSection = document.querySelector('#trade-total');
const secondCopy = document.querySelector('.scene-two-copy');
const thirdCopy = document.querySelector('.scene-three-copy');
const ratingTimeline = document.querySelector('.rating-timeline');
const assessments = ratingTimeline.querySelectorAll('li');

function revealCopy(copy) {
  const paragraph = copy.querySelector('p');
  const text = paragraph.textContent;
  paragraph.setAttribute('aria-label', text);
  paragraph.replaceChildren();
  const words = text.trim().split(/\s+/).map((word, index) => {
    if (index) paragraph.append(document.createTextNode(' '));
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    paragraph.append(span);
    return span;
  });
  gsap.set(paragraph, {autoAlpha: 1});
  return gsap.timeline({paused: true}).fromTo(words, {opacity: 0, y: 5}, {
    opacity: 1, y: 0, ease: 'sine.out', duration: .8 / 1.8, stagger: {amount: 1 / 1.8}
  });
}

const secondReveal = revealCopy(secondCopy);
const thirdReveal = revealCopy(thirdCopy);
const ratings = gsap.timeline({paused: true});
ratings.fromTo(ratingTimeline, {'--rail-progress': 0}, {'--rail-progress': 1, duration: .45, ease: 'power2.out'}, 0);
assessments.forEach((item, start) => {
  const badge = item.querySelector('.rating-badge');
  ratings
    .to(item.querySelector('.rating-dot'), {opacity: 1, duration: .16}, start)
    .to(item.querySelector('.rating-year'), {opacity: 1, duration: .2}, start)
    .to(item.querySelector('.rating-line'), {scaleY: 1, duration: .5, ease: 'none'}, start + .2)
    .to(badge, {opacity: 1, scale: 1, duration: .22, ease: 'power2.out'}, start + .7)
    .to(badge, {boxShadow: '0 0 16px 3px currentColor', duration: .12}, start + .7)
    .to(item.querySelector('.rating-label'), {opacity: 1, duration: .25}, start + .75);
});

let secondTop, thirdTop, exitStart, secondScreen, thirdScreen, animationEnd;
let frame, lastY;
function progress(y, start, duration) {
  return Math.max(0, Math.min(1, (y - start) / Math.max(1, duration)));
}

function render() {
  frame = undefined;
  const y = Math.min(animationEnd, Math.max(0, scrollY));
  if (y === lastY) return;
  lastY = y;
  const intro = progress(y, 0, secondTop);
  const entrance = progress(y, secondTop, secondScreen);
  const exit = progress(y, exitStart, thirdTop - exitStart);
  const third = progress(y, thirdTop, thirdScreen);
  const rating = progress(y, thirdTop + thirdScreen, thirdScreen * assessments.length);

  Object.assign(state, {intro, entrance, exit});
  background.style.opacity = intro * intro * (3 - 2 * intro);
  title.style.opacity = 1 - Math.min(1, intro * 2);
  title.style.transform = `translateY(calc(-50% - ${intro * 80}px))`;
  cue.style.visibility = intro > .03 ? 'hidden' : 'visible';
  secondCopy.style.transform = `translateY(calc(-50% - ${exit * (thirdTop - exitStart)}px))`;
  secondCopy.style.visibility = entrance > 0 && exit < 1 ? 'visible' : 'hidden';
  thirdCopy.style.visibility = third > 0 ? 'visible' : 'hidden';
  ratingTimeline.style.visibility = rating > 0 ? 'visible' : 'hidden';
  secondReveal.progress(entrance);
  thirdReveal.progress(third);
  ratings.progress(rating);
  window.dispatchEvent(new Event('opening:progress'));
}

function requestRender() {
  if (frame === undefined && Math.min(animationEnd, Math.max(0, scrollY)) !== lastY) {
    frame = requestAnimationFrame(render);
  }
}

function measure() {
  const top = element => element.getBoundingClientRect().top + scrollY;
  secondTop = top(secondSection);
  thirdTop = top(thirdSection);
  exitStart = (secondTop + thirdTop) / 2;
  secondScreen = (thirdTop - secondTop) / 4;
  thirdScreen = (top(tradeSection) - thirdTop) / 5;
  animationEnd = thirdTop + thirdScreen * (1 + assessments.length);
  lastY = undefined;
  requestRender();
}

addEventListener('scroll', requestRender, {passive: true});
addEventListener('resize', measure);
addEventListener('pageshow', measure);
document.fonts.ready.then(measure);
measure();
