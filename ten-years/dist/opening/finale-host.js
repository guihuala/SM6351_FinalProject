// Keep the final chapter aligned with the host document and connect keyboard navigation.
const CHANNEL='sm6351-finale';
const host=document.getElementById('finale');
const frame=document.getElementById('finale-frame');
const pane=host?.querySelector('.finale-window');

if(host&&frame&&pane){
  document.title='The Global Trade of Sphyrna lewini — Complete project';
  let loaded=false,started=false,active=false,frameHeight=innerHeight,pending=0,lastY=null,lastActive=null;
  let pendingScroll=0;
  let wheelTarget=null,wheelAt=0,wheelDeadline=0,expectedY=null;
  let inViewport=!('IntersectionObserver' in window);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finite=value=>typeof value==='number'&&Number.isFinite(value);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const sectionTop=()=>host.getBoundingClientRect().top+scrollY;
  const emit=message=>frame.contentWindow?.postMessage({channel:CHANNEL,...message},location.origin);

  function cancelWheel(){wheelTarget=null;wheelAt=0;expectedY=null;}
  function cancelInput(){pendingScroll=0;cancelWheel();}

  function sync(now){
    pending=0;
    if(!loaded)return;
    if(pendingScroll){
      const delta=pendingScroll;
      pendingScroll=0;
      scrollBy({top:delta,behavior:'instant'});
    }
    if(wheelTarget!==null){
      const dt=wheelAt?Math.min(40,now-wheelAt):1000/60;
      wheelAt=now;
      const remaining=wheelTarget-scrollY;
      // A short tail softens a notched wheel without adding a long inertia
      // effect. Finish within 120ms of the last tick, and stop at subpixels.
      const finished=now>=wheelDeadline||Math.abs(remaining)<.75;
      const next=finished?wheelTarget:scrollY+remaining*(1-Math.exp(-dt/22));
      scrollTo({top:next,behavior:'instant'});
      expectedY=scrollY;
      if(finished||Math.abs(wheelTarget-expectedY)<.75)cancelWheel();
    }
    const rect=host.getBoundingClientRect();
    active=rect.top<innerHeight&&rect.bottom>0;
    const y=clamp(-rect.top,0,Math.max(0,frameHeight-innerHeight));
    if(wheelTarget!==null)requestSync();
    if(y===lastY&&active===lastActive)return;
    lastY=y;lastActive=active;
    // Both documents are same-origin: apply both positions in the same frame,
    // with postMessage retained for an independently opened chapter.
    const receive=frame.contentWindow?.SM6351FinaleViewport;
    if(typeof receive==='function')receive({y,active});
    else emit({type:'viewport',y,active});
  }

  function requestSync(){if(loaded&&!pending)pending=requestAnimationFrame(sync);}
  function onScroll(){
    // A scrollbar drag or other native input takes over immediately.
    if(wheelTarget!==null&&expectedY!==null&&Math.abs(scrollY-expectedY)>1)cancelInput();
    if(inViewport||active)requestSync();
  }
  function resizePane(){
    cancelInput();
    pane.style.height=`${innerHeight}px`;
    lastY=null;requestSync();
  }
  function start(){
    if(started)return;
    started=true;
    frame.src=frame.dataset.src;
  }

  function receive(source,message){
    if(source!==frame.contentWindow)return;
    if(!message||message.channel!==CHANNEL)return;
    if(message.type==='ready'||message.type==='resize'){
      if(!finite(message.height)||message.height<1||message.height>300000)return;
      cancelInput();
      frameHeight=Math.max(innerHeight,Math.ceil(message.height));
      host.style.height=`${frameHeight}px`;
      loaded=true;host.classList.add('is-loaded');
      lastY=null;requestSync();
      return;
    }
    // Navigation requests are honoured only while this chapter is in view.
    if(!loaded||!active)return;
    if(message.type==='cancel-scroll'){cancelInput();return;}
    if(message.type==='scroll'&&finite(message.delta)){
      const delta=clamp(message.delta,-innerHeight*2,innerHeight*2);
      if(message.smooth===true&&!reduced.matches){
        if(wheelTarget===null){wheelAt=0;expectedY=scrollY;}
        wheelTarget=clamp((wheelTarget??scrollY)+pendingScroll+delta,0,Math.max(0,sectionTop()+frameHeight-innerHeight));
        wheelDeadline=performance.now()+120;
        pendingScroll=0;
      }else{
        cancelWheel();
        pendingScroll+=delta;
      }
      requestSync();
      return;
    }
    cancelInput();
    if(message.type==='navigate'&&finite(message.y)){
      const target=sectionTop()+clamp(message.y,0,Math.max(0,frameHeight-innerHeight));
      scrollTo({top:target,behavior:'instant'});
    }else if(message.type==='previous'){
      const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
      document.getElementById('product-forms')?.scrollIntoView({behavior,block:'start'});
    }else if(message.type==='home'){
      scrollTo({top:0,behavior:'instant'});
    }else if(message.type==='end'){
      scrollTo({top:sectionTop()+Math.max(0,frameHeight-innerHeight),behavior:'instant'});
    }
    requestSync();
  }
  function onMessage(event){
    if(event.origin===location.origin)receive(event.source,event.data);
  }

  addEventListener('message',onMessage);
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',resizePane,{passive:true});
  addEventListener('pageshow',requestSync);
  addEventListener('wheel',cancelInput,{passive:true});
  addEventListener('pointerdown',cancelInput,{passive:true});
  addEventListener('keydown',event=>{
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancelInput();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelInput();});
  reduced.addEventListener('change',()=>{cancelInput();requestSync();});
  document.fonts?.ready.then(requestSync);
  if('IntersectionObserver' in window){
    const viewportObserver=new IntersectionObserver(([entry])=>{
      inViewport=entry.isIntersecting;
      requestSync();
    });
    viewportObserver.observe(host);
    const preload=Math.min(550,Math.round(innerHeight*.65));
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){start();observer.disconnect();}
    },{rootMargin:`${preload}px 0px`,threshold:0});
    observer.observe(host);
  }else start();
  resizePane();
  window.SM6351Integration=Object.freeze({
    getState:()=>({loaded,started,active,chapterHeight:frameHeight,childScroll:lastY}),
    receive,
    enter(){start();host.scrollIntoView({behavior:'instant',block:'start'});requestSync();}
  });
}
