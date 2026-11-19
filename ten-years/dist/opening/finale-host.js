// The earlier chapters remain unchanged. This bridge only owns #finale.
const CHANNEL='sm6351-finale';
const host=document.getElementById('finale');
const frame=document.getElementById('finale-frame');

if(host&&frame){
  document.title='The Global Trade of Sphyrna lewini — Complete project';
  let loaded=false,started=false,active=false,frameHeight=innerHeight,pending=0,lastY=null,lastActive=null;
  const finite=value=>typeof value==='number'&&Number.isFinite(value);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const sectionTop=()=>host.getBoundingClientRect().top+scrollY;
  const emit=message=>frame.contentWindow?.postMessage({channel:CHANNEL,...message},location.origin);

  function sync(){
    pending=0;
    const rect=host.getBoundingClientRect();
    active=rect.top<innerHeight&&rect.bottom>0;
    if(!loaded)return;
    const y=clamp(-rect.top,0,Math.max(0,frameHeight-innerHeight));
    if(y===lastY&&active===lastActive)return;
    lastY=y;lastActive=active;
    emit({type:'viewport',y,active});
  }

  function requestSync(){if(!pending)pending=requestAnimationFrame(sync);}
  function start(){
    if(started)return;
    started=true;
    frame.src=frame.dataset.src;
  }

  function onMessage(event){
    if(event.source!==frame.contentWindow||event.origin!==location.origin)return;
    const message=event.data;
    if(!message||message.channel!==CHANNEL)return;
    if(message.type==='ready'||message.type==='resize'){
      if(!finite(message.height)||message.height<1||message.height>300000)return;
      frameHeight=Math.max(innerHeight,Math.ceil(message.height));
      host.style.height=`${frameHeight}px`;
      loaded=true;host.classList.add('is-loaded');
      lastY=null;requestSync();
      return;
    }
    // Navigation requests are honoured only while this chapter is in view.
    if(!loaded||!active)return;
    if(message.type==='scroll'&&finite(message.delta)){
      const delta=clamp(message.delta,-innerHeight*2,innerHeight*2);
      scrollBy({top:delta,behavior:'instant'});
    }else if(message.type==='navigate'&&finite(message.y)){
      const target=sectionTop()+clamp(message.y,0,Math.max(0,frameHeight-innerHeight));
      scrollTo({top:target,behavior:'instant'});
    }else if(message.type==='previous'){
      document.getElementById('product-forms')?.scrollIntoView({behavior:'instant',block:'start'});
    }else if(message.type==='home'){
      scrollTo({top:0,behavior:'instant'});
    }else if(message.type==='end'){
      scrollTo({top:sectionTop()+Math.max(0,frameHeight-innerHeight),behavior:'instant'});
    }
    requestSync();
  }

  // The shared chart emits keyboard boundaries on its annual root even when
  // the key came from Product forms. Release only the final product boundary.
  document.getElementById('annual-trade')?.addEventListener('decade:boundary',event=>{
    const detail=event.detail;
    const products=document.getElementById('product-forms');
    if(detail?.origin!=='keyboard'||detail.direction!==1||detail.year!==2024||!products?.contains(document.activeElement))return;
    event.preventDefault();
    start();
    host.scrollIntoView({behavior:'instant',block:'start'});
    host.tabIndex=-1;
    host.focus({preventScroll:true});
    if(location.hash!=='#finale')history.pushState(null,'','#finale');
    requestSync();
  });

  addEventListener('message',onMessage);
  addEventListener('scroll',requestSync,{passive:true});
  addEventListener('resize',()=>{lastY=null;requestSync();},{passive:true});
  addEventListener('pageshow',requestSync);
  document.fonts?.ready.then(requestSync);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){start();observer.disconnect();}
    },{rootMargin:'1200px 0px',threshold:0});
    observer.observe(host);
  }else start();
  requestSync();
  window.SM6351Integration=Object.freeze({
    getState:()=>({loaded,started,active,chapterHeight:frameHeight,childScroll:lastY}),
    enter(){start();host.scrollIntoView({behavior:'instant',block:'start'});requestSync();}
  });
}
