// The product reveal, interactive hold and globe transition have separate scroll ranges.
const products = document.querySelector('#trade-products');
const stage = document.querySelector('#trade-stage');
const ring = stage.querySelector('.trade-ring');
const ringSvg = ring.querySelector('svg');
const hold = document.createElement('div');
hold.style.height = '100vh';
const spacer = document.createElement('div');
spacer.style.height = '150vh';
products.after(hold, spacer);
const frame = document.createElement('iframe');
frame.title = 'Distribution, trade flows and subsequent chapters';
frame.inert = true;
frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:5;visibility:hidden;pointer-events:none';
frame.style.colorScheme = 'light';
document.body.append(frame);
const style = document.createElement('style');
style.textContent = `
body.ring-travel .trade-model, body.ring-travel .trade-list,
body.ring-travel .minor-label, body.ring-travel .minor-comparison,
body.ring-travel .trade-ring path {opacity:var(--detail-alpha)!important}
body.ring-travel .trade-number{opacity:var(--number-alpha)!important}
body.globe-active #trade-stage{visibility:hidden}
`;
document.head.append(style);
const clamp = n => Math.max(0, Math.min(1, n));
function ease(n) { const x=clamp(n); return x*x*(3-2*x); }

let chapter, loaded=false, active=false, pendingFrame, lastProgress;
function chapterTop() {
  return chapter.getBoundingClientRect().top + frame.contentWindow.scrollY;
}
function alignGlobe() {
  if (chapter) frame.contentWindow.scrollTo({top:chapterTop(),behavior:'instant'});
}
frame.addEventListener('load', () => {
  chapter = frame.contentDocument.querySelector('#distribution-trade');
  if (!chapter) return;
  alignGlobe();
  lastProgress=undefined;
  // A reverse scroll in the team's document crosses back into the same
  // parent timeline, including wheel events forwarded by the globe controls.
  frame.contentWindow.addEventListener('scroll', () => {
    const overshoot = frame.contentWindow.scrollY - chapterTop();
    if (active && overshoot < -1) {
      window.scrollTo({top:spacer.offsetTop + spacer.offsetHeight - innerHeight + overshoot,behavior:'instant'});
      alignGlobe();
      render();
    }
  }, {passive:true});
  render();
});
function render() {
  const start = spacer.offsetTop - innerHeight;
  const progress = clamp((scrollY-start)/spacer.offsetHeight);
  if (!loaded && scrollY >= start-2*innerHeight) {
    loaded=true;
    frame.src='../opening/complete.html?sharedOcean=1&v=transparent-ocean#distribution-trade';
  }
  if(progress===lastProgress)return;
  lastProgress=progress;
  const moving=progress>0;
  const complete=progress >= 1-0.5/spacer.offsetHeight && !!chapter;
  const entering=complete&&!active;
  const box=moving?ring.getBoundingClientRect():null;
  document.body.classList.toggle('ring-travel',moving);
  document.body.classList.toggle('globe-active',complete);
  stage.inert=moving;
  frame.inert=!complete;
  frame.style.pointerEvents=complete?'auto':'none';
  if (active && !complete && document.activeElement===frame) frame.blur();
  active=complete;
  if (!moving) {
    ringSvg.style.transform=ringSvg.style.opacity='';
    frame.style.visibility='hidden';
    return;
  }
  const move=ease(progress*3-1);
  const x=innerWidth/2, y=innerHeight/2;
  // Initial sphere radius 100, camera (110,82,332), vertical FOV 38°.
  const diameter=innerHeight*100/(Math.tan(19*Math.PI/180)*Math.sqrt(110**2+82**2+332**2-100**2));
  const scale=diameter/(Math.min(box.width,box.height)*.94);
  ringSvg.style.transform='translate('+((x-box.left-box.width/2)*move)+'px,'+((y-box.top-box.height/2)*move)+'px) scale('+(1+(scale-1)*move)+')';
  ringSvg.style.opacity=1-ease((progress-.45)/.34);
  stage.style.setProperty('--detail-alpha',1-ease(progress*3));
  stage.style.setProperty('--number-alpha',1-ease((progress-.28)/.23));
  const reveal=ease((progress-.38)/.32);
  const expand=ease(progress*3-2);
  const radius=diameter*.5*reveal+Math.hypot(x,y)*expand;
  frame.style.visibility=chapter && reveal>0?'visible':'hidden';
  frame.style.opacity=reveal;
  frame.style.clipPath=complete?'none':'circle('+radius+'px at 50% 50%)';
  if (entering) frame.focus({preventScroll:true});
}
addEventListener('scroll',()=>{
  if(pendingFrame!==undefined)return;
  pendingFrame=requestAnimationFrame(()=>{
    pendingFrame=undefined;
    render();
  });
},{passive:true});
addEventListener('resize',()=>{
  if(!active)alignGlobe();
  lastProgress=undefined;
  render();
});
render();
