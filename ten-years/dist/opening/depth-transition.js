gsap.registerPlugin(ScrollTrigger);
window.oceanStory={intro:0,entrance:0,exit:0};
const state=window.oceanStory;
const background=document.querySelector('.deep-background');
const title=document.querySelector('.ocean-title');
const cue=document.querySelector('.scroll-cue');
function apply(){
 const eased=state.intro*state.intro*(3-2*state.intro);
 background.style.opacity=eased;
 title.style.opacity=String(1-Math.min(1,state.intro*2));
 title.style.transform=`translateY(calc(-50% - ${state.intro*80}px))`;
 cue.style.visibility=state.intro>.03?'hidden':'visible';
 window.dispatchEvent(new Event('opening:progress'));
}
gsap.to(state,{intro:1,ease:'none',onUpdate:apply,scrollTrigger:{start:0,end:()=>innerHeight*2,scrub:.5,invalidateOnRefresh:true}});
function revealCopy(selector, startScreen, trigger) {
  const paragraph = document.querySelector(selector);
  const originalText=paragraph.textContent;
  paragraph.setAttribute('aria-label',originalText);
  paragraph.replaceChildren();
  const words=[];
  originalText.trim().split(/\s+/).forEach((word,index)=>{
   if(index)paragraph.append(document.createTextNode(' '));
   const wrapper=document.createElement('span');wrapper.style.display='inline-block';wrapper.setAttribute('aria-hidden','true');
   wrapper.textContent=word;
   words.push(wrapper);
   paragraph.append(wrapper);
  });
  gsap.set(paragraph,{autoAlpha:1,y:0});
  return gsap.timeline({scrollTrigger:{
    trigger, start:trigger ? 'top top' : ()=>innerHeight*startScreen, end:()=>'+='+innerHeight,
    scrub:1.5, invalidateOnRefresh:true
  }}).fromTo(words,{opacity:0,y:5},{
    opacity:1,y:0,ease:'sine.out',duration:.8/1.8,stagger:{amount:1/1.8}
  },0);
}
revealCopy('.scene-two-copy p', 2)
  .fromTo(state,{entrance:0},{entrance:1,ease:'none',onUpdate:apply,duration:1},0);
// One screen for the paragraph, followed by one screen per assessment.
const assessments = document.querySelectorAll('.rating-timeline li');
const thirdSection = document.querySelector('#page-three');
revealCopy('.scene-three-copy p', 0, thirdSection);
const thirdScene = gsap.timeline();
const ratingTimeline = document.querySelector('.rating-timeline');
thirdScene.eventCallback('onUpdate', () => {
  ratingTimeline.classList.toggle('rail-open', thirdScene.progress() > 0);
});
assessments.forEach((item, index) => {
  const start = index;
  const badge = item.querySelector('.rating-badge');
  thirdScene
    .to(item.querySelector('.rating-dot'), {opacity:1, duration:0.16}, start)
    .to(item.querySelector('.rating-year'), {opacity:1, duration:0.2}, start)
    .to(item.querySelector('.rating-line'), {scaleY:1, duration:0.5, ease:'none'}, start + 0.2)
    .to(badge, {opacity:1, scale:1, duration:0.22, ease:'power2.out'}, start + 0.7)
    .to(badge, {boxShadow:'0 0 16px 3px currentColor', duration:0.12}, start + 0.7)
    .to(item.querySelector('.rating-label'), {opacity:1, duration:0.25}, start + 0.75);
});
ScrollTrigger.create({
  trigger: thirdSection,
  start: () => 'top -=' + innerHeight,
  end: () => '+=' + (innerHeight * assessments.length),
  animation: thirdScene,
  scrub: true
});
gsap.to(state,{exit:1,ease:'none',scrollTrigger:{start:()=>innerHeight*4,end:()=>innerHeight*6,scrub:.5,invalidateOnRefresh:true},onUpdate:()=>{
 const copy=document.querySelector('.scene-two-copy');
 copy.style.transform=`translateY(calc(-50% - ${state.exit*innerHeight*2}px))`;
 copy.style.visibility=state.exit>=1?'hidden':'visible';
 window.dispatchEvent(new Event('opening:progress'));
}});
await document.fonts.ready;
ScrollTrigger.refresh();
apply();
