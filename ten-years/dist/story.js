(function(){
'use strict';
const root=document.getElementById('annual-trade');
const intro=document.getElementById('ocean-intro');
const tradeIntro=document.getElementById('trade-intro');
const productTarget=document.getElementById('product-forms');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const sharedFlow=!!window.MarineDecadeFlow;
const api=MarineDecade.mount(root,{linked:true,year:2024,releaseAtBoundary:true,sharedFlow,intro:!!intro,headingTarget:tradeIntro?.querySelector('.dv-trade-intro-content'),imageBase:root.dataset?.imageBase,productTarget});
const chapterScroll=window.MarineChapterScroll?.create();
if(sharedFlow){
 const canvas=document.createElement('canvas');
 canvas.className='dv-story-flow';
 canvas.setAttribute('aria-hidden','true');
 const main=root.parentElement;
 main.before(canvas);
 window.decadeFlow=window.MarineDecadeFlow.attach(main,{viewport:true,canvas,intro,sculpture:!!intro,surfaces:[root],themeRoot:root});
}
function followChapter(event,target){
 if(!target||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 if(chapterScroll)chapterScroll.to(target);
 else target.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
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
if(tradeIntro||intro||productTarget){
 root.addEventListener('decade:boundary',event=>{
  if(event.detail.origin==='touch')followChapter(event,event.detail.direction<0?(tradeIntro||intro):productTarget);
 });
}
function followProductLink(){
 if(location.hash!=='#product-forms')return;
 if(!productTarget)history.replaceState(null,'','#annual-trade');
 chapterScroll?.cancel();
 const target=productTarget||root;
 target.scrollIntoView({behavior:'instant'});
 target.focus({preventScroll:true});
}
window.addEventListener('hashchange',followProductLink);
followProductLink();
new IntersectionObserver(entries=>{
 if(entries[0].intersectionRatio<.5)api.pause();
},{threshold:[0,.5]}).observe(root);
window.decadeChapters={annual:api,forms:api};
window.decadeView=api;
})();
