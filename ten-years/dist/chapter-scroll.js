(function(global){
'use strict';
function create(){
 const reduced=global.matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,active=false,wheelDirection=0,expectedY;
 function cancel(){
  if(frame)global.cancelAnimationFrame(frame);
  frame=0;active=false;wheelDirection=0;
  global.removeEventListener('wheel',wheel,true);
  global.removeEventListener('scroll',onScroll);
 }
 function to(element,{direction=0,block='start'}={}){
  cancel();
  const bounds=element.getBoundingClientRect();
  const offset=block==='end'?bounds.bottom-global.innerHeight:bounds.top;
  const start=global.scrollY,end=Math.max(0,Math.min(start+offset,document.documentElement.scrollHeight-global.innerHeight));
  if(reduced.matches||Math.abs(end-start)<1){global.scrollTo({top:end,behavior:'instant'});return;}
  const duration=Math.min(740,450+Math.abs(end-start)*.15);
  let last,elapsed=0;
  active=true;wheelDirection=direction;expectedY=start;
  global.addEventListener('wheel',wheel,{passive:!direction,capture:true});
  global.addEventListener('scroll',onScroll,{passive:true});
  function tick(now){
   // A stalled frame should not jump across the rest of the chapter.
   if(last!==undefined)elapsed+=Math.min(48,now-last);
   last=now;
   const t=Math.min(1,elapsed/duration),ease=t*t*t*(10+t*(-15+6*t));
   global.scrollTo({top:start+(end-start)*ease,behavior:'instant'});
   expectedY=global.scrollY;
   if(t<1)frame=global.requestAnimationFrame(tick);else cancel();
  }
  frame=global.requestAnimationFrame(tick);
 }
 function onScroll(){if(Math.abs(global.scrollY-expectedY)>1)cancel();}
 function wheel(event){
  if(event&&wheelDirection&&Math.sign(event.deltaY)===wheelDirection&&
    Math.abs(event.deltaY)>=Math.abs(event.deltaX)&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){
   event.preventDefault();
   event.stopPropagation();
  }else cancel();
 }
 const key=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancel();};
 const inputs=['touchstart','pointerdown','resize'];
 inputs.forEach(name=>global.addEventListener(name,cancel,{passive:true,capture:true}));
 global.addEventListener('keydown',key,true);reduced.addEventListener('change',cancel);
 return {to,cancel,getState:()=>({active}),destroy(){cancel();inputs.forEach(name=>global.removeEventListener(name,cancel,true));global.removeEventListener('keydown',key,true);reduced.removeEventListener('change',cancel);}};
}
global.MarineChapterScroll=Object.freeze({create});
})(window);
