// A small reusable pool: animate only transform and opacity.
const layer=document.createElement('div');
layer.id='bubbles';layer.setAttribute('aria-hidden','true');document.body.append(layer);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pool=[];
function cycle(item,initial=false){
 const size=38+Math.random()*50;
 const x=4+Math.random()*92;
 const y=65+Math.random()*42;
 const rise=32+Math.random()*45;
 const drift=(Math.random()-.5)*80;
 const duration=11000+Math.random()*8000;
 item.el.style.width=`${size}px`;item.el.style.height=`${size}px`;item.el.style.left=`${x}%`;item.el.style.top=`${y}%`;
 item.animation=item.el.animate([
  {transform:'translate3d(0,0,0) scale(.88)',opacity:0,offset:0},
  {transform:`translate3d(${drift*.2}px,-${rise*.15}vh,0) scale(.94)`,opacity:.3,offset:.18},
  {transform:`translate3d(${drift}px,-${rise*.55}vh,0) scale(1)`,opacity:.24,offset:.55},
  {transform:`translate3d(${drift*.5}px,-${rise*.82}vh,0) scale(1.05)`,opacity:.09,offset:.82},
  {transform:`translate3d(${drift*.8}px,-${rise}vh,0) scale(1.08)`,opacity:0,offset:1}
 ],{duration,easing:'linear',fill:'both'});
 item.animation.onfinish=()=>cycle(item);
 if(initial)item.animation.currentTime=duration*Math.random();
 if(document.hidden||reduced.matches)item.animation.pause();
}
for(let i=0;i<8;i++){const el=document.createElement('img');el.src='./assets/bubble.png';el.alt='';el.draggable=false;layer.append(el);const item={el};pool.push(item);cycle(item,true)}
function sync(){layer.hidden=reduced.matches;for(const item of pool){if(document.hidden||reduced.matches)item.animation.pause();else item.animation.play()}}
document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
