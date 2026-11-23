(function(){
'use strict';
const root=document.getElementById('annual-trade');
const intro=document.getElementById('ocean-intro');
const tradeIntro=document.getElementById('trade-intro');
const productTarget=document.getElementById('product-forms');
const finale=document.getElementById('finale');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const sharedFlow=!!window.MarineDecadeFlow;
const chapterScroll=window.MarineChapterScroll?.create();
const api=MarineDecade.mount(root,{linked:true,annualFinTotal:true,year:2015,progressiveColumns:true,progressiveForms:true,pageScrollTimeline:true,sharedFlow,intro:!!intro,showChapterBack:!tradeIntro,headingTarget:tradeIntro?.querySelector('.dv-trade-intro-content'),imageBase:root.dataset?.imageBase,productTarget});
if(sharedFlow){
 const canvas=document.createElement('canvas');
 canvas.className='dv-story-flow';
 canvas.setAttribute('aria-hidden','true');
 const main=root.parentElement;
 main.before(canvas);
 window.decadeFlow=window.MarineDecadeFlow.attach(main,{viewport:true,canvas,intro,sculpture:!!intro,surfaces:[root],themeRoot:root});
}
const firstYear=2015,yearCount=10,lastYear=firstYear+yearCount-1;
const tracks=new Map();
for(const scene of [root,productTarget].filter(Boolean)){
 const track=document.createElement('div');
 track.className='dv-scroll-track';
 scene.before(track);
 track.append(scene);
 tracks.set(scene,track);
}
function scrollPosition(){
 const midpoint=window.innerHeight/2;
 for(const [scene,track] of tracks){
  const {top,bottom,height}=track.getBoundingClientRect();
  if(top>midpoint||bottom<=midpoint)continue;
  const sceneHeight=scene.offsetHeight;
  const stickyTop=Math.min(0,window.innerHeight-sceneHeight);
  return {step:(height-sceneHeight)/yearCount,offset:stickyTop-top,scene};
 }
}
let frame=0,lastScene,lastScrollYear;
function syncYear(){
 frame=0;
 const position=scrollPosition();
 if(!position){lastScene=null;return;}
 const {scene,step,offset}=position;
 if(step<=0)return;
 const year=firstYear+Math.max(0,Math.min(yearCount-1,Math.floor(offset/step)));
 if(scene!==lastScene||year!==lastScrollYear){
  lastScene=scene;
  lastScrollYear=year;
  if(api.getState().year!==year)api.setYear(year);
 }
}
function scheduleSync(){
 if(!frame)frame=window.requestAnimationFrame(syncYear);
}
function updateStickyTops(){
 for(const scene of tracks.keys()){
  scene.style.setProperty('--dv-sticky-top',Math.min(0,window.innerHeight-scene.offsetHeight)+'px');
 }
 scheduleSync();
}
const resizeObserver=new ResizeObserver(updateStickyTops);
for(const scene of tracks.keys())resizeObserver.observe(scene);
window.addEventListener('resize',updateStickyTops);
window.addEventListener('scroll',scheduleSync,{passive:true});
root.addEventListener('decade:year-change',event=>{
 const {year,origin}=event.detail;
 if(origin!=='click'&&origin!=='keyboard')return;
 const position=scrollPosition();
 if(!position||position.step<=0)return;
 const {scene,step,offset}=position;
 const index=year-firstYear;
 lastScene=scene;
 lastScrollYear=year;
 window.scrollBy({top:(index+.5)*step-offset,behavior:'instant'});
});
function followChapter(event,target,block='start'){
 if(!target||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 const destination=tracks.get(target)||target;
 if(chapterScroll)chapterScroll.to(destination,{block});
 else destination.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block});
 target.focus({preventScroll:true});
 const hash='#'+target.id;
 if(location.hash!==hash)history.pushState(null,'',hash);
}
intro?.addEventListener('click',event=>{
 if(event.target.closest('a[href="#annual-trade"]'))followChapter(event,root);
 if(event.target.closest('a[href="#trade-intro"]'))followChapter(event,tradeIntro);
 if(event.target.closest('a[href="#page-two"]'))followChapter(event,document.getElementById('page-two'));
});
tradeIntro?.addEventListener('click',event=>{
 if(event.target.closest('a[href="#annual-trade"]'))followChapter(event,root);
});
root.querySelector('.dv-chapter-link')?.addEventListener('click',event=>followChapter(event,tradeIntro||intro));
root.querySelector('a[href="#product-forms"]')?.addEventListener('click',event=>followChapter(event,productTarget));
productTarget?.querySelector('a[href="#annual-trade"]')?.addEventListener('click',event=>followChapter(event,root));
root.addEventListener('decade:boundary',event=>{
 const {origin,direction,year}=event.detail;
 if(origin!=='keyboard'||year!==(direction>0?lastYear:firstYear))return;
 const onProducts=productTarget?.contains(document.activeElement);
 const target=onProducts?(direction>0?finale:root):(direction<0?(tradeIntro||intro):productTarget);
 followChapter(event,target,onProducts&&direction<0?'end':'start');
});
function followChartHash(){
 if(location.hash!=='#annual-trade'&&location.hash!=='#product-forms')return;
 const target=location.hash==='#product-forms'?(productTarget||root):root;
 if(location.hash==='#product-forms'&&!productTarget)history.replaceState(null,'','#annual-trade');
 chapterScroll?.cancel();
 tracks.get(target).scrollIntoView({behavior:'instant'});
 target.focus({preventScroll:true});
}
window.addEventListener('hashchange',followChartHash);
followChartHash();
updateStickyTops();
window.decadeChapters={annual:api,forms:api};
window.decadeView=api;
})();
