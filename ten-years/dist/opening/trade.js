const products = [
  ['Fins',126104.794,'#3DDCD0'],['Bodies',65801,'#5AB4FF'],['Meat',22011,'#9B8CFF'],
  ['Bones',3872.65,'#FF6FB5'],['Skins',2980.75,'#FF7A5C'],['Powder',524.399,'#FFC14D'],
  ['Specimens',0.20141,'#A8E86B']
];
const total = products.reduce((sum,p)=>sum+p[1],0);
const kg = n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const share = n=>(100*n/total).toFixed(n<1?5:2)+'%';
const stage=document.querySelector('#trade-stage');
const el=s=>stage.querySelector(s);
const summary=el('.trade-summary'), number=el('.trade-number'), ring=el('.trade-ring'), list=el('.trade-list'), model=el('.trade-model');
const oldCopy=document.querySelector('.scene-three-copy'), oldTimeline=document.querySelector('.rating-timeline');
const totalsSection = document.querySelector('#trade-total');
const productsSection = document.querySelector('#trade-products');
let selected=-1, hover=-1, enabled=false, requested=false, drawModel, ringProgress=0;
const pieces=[];
const year = summary.querySelector('p');
const explanation = summary.querySelector('h2');
const counter = number.children[1];
counter.style.fontVariantNumeric = 'tabular-nums';
for (const label of [year, explanation]) {
  label.style.opacity = '0';
  label.style.transition = 'opacity 400ms ease-out';
}
let sequence = 'waiting', timer;
let sequenceRegion, previousProgress;
function updateSequence(t) {
  const region = t <= 0 ? 'outside' : t < .25 ? 'fade' : t < 1.5 ? 'summary' : 'products';
  const movingBack = t < previousProgress;
  const firstUpdate = previousProgress === undefined;
  previousProgress = t;
  if (region === sequenceRegion) {
    if (region === 'summary' && movingBack && sequence !== 'complete') finishSequence();
    return;
  }
  sequenceRegion = region;
  clearTimeout(timer);
  if (region === 'products' ||
      (region === 'fade' && sequence !== 'waiting') ||
      (region === 'summary' && (movingBack || firstUpdate || sequence === 'complete'))) {
    finishSequence();
    return;
  }
  sequence = 'waiting';
  counter.removeAttribute('aria-hidden');
  year.style.opacity = explanation.style.opacity = '0';
  if (region === 'summary') startSequence();
}
function finishSequence() {
  clearTimeout(timer);
  sequence = 'complete';
  counter.removeAttribute('aria-hidden');
  counter.textContent = kg(total) + ' kg';
  year.style.opacity = explanation.style.opacity = '1';
}
function startSequence() {
  sequence = 'playing';
  counter.setAttribute('aria-hidden', 'true');
  const startTime = performance.now();
  function tick() {
    const elapsed = performance.now() - startTime;
    if (elapsed >= 1000) {
      sequence = 'settled';
      counter.removeAttribute('aria-hidden');
      counter.textContent = kg(total) + ' kg';
      timer = setTimeout(() => {
        year.style.opacity = '1';
        timer = setTimeout(finishSequence, 200);
      }, 300);
      return;
    }
    const cents = 10000000 + Math.floor(Math.random() * 90000000);
    counter.textContent = kg(cents / 100) + ' kg';
    const interval = 90 + Math.max(0, elapsed - 800) * 0.72;
    timer = setTimeout(tick, Math.min(interval, 1000 - elapsed));
  }
  tick();
}
const comparison = document.createElement('aside');
comparison.className = 'minor-comparison';
comparison.id = 'minor-comparison';
comparison.hidden = true;
comparison.innerHTML = '<header><strong>Powder &amp; specimens</strong><button type="button" aria-label="Close comparison">×</button></header><small>Share of their combined weight</small><div class="minor-bar" aria-hidden="true"></div>';
ring.append(comparison);
const pairWeight = products[5][1] + products[6][1];
comparison.style.setProperty('--powder-share', (100*products[5][1]/pairWeight)+'%');
comparison.querySelector('header button').onclick=()=>{
  const last=selected;
  selected=hover=-1;
  paint();
  pieces[last]?.label?.focus({preventScroll:true});
};
comparison.addEventListener('keydown',event=>{
  if(event.key==='Escape') comparison.querySelector('header button').click();
});
let paintedActive, paintedSelected, paintedEnabled, paintedSequence;
function paint(force=false){
  const active=enabled?(hover>=0?hover:selected):-1;
  if(!force&&active===paintedActive&&selected===paintedSelected&&enabled===paintedEnabled&&sequence===paintedSequence)return;
  paintedActive=active;
  paintedSelected=selected;
  paintedEnabled=enabled;
  paintedSequence=sequence;
  const p=products[active];
  number.children[0].textContent=p?.[0]||'';
  if (sequence !== 'playing') counter.textContent=kg(p?p[1]:total)+' kg';
  number.children[2].textContent=p?share(p[1]):'';
  comparison.hidden = !enabled || selected < 5;
  pieces.forEach(({circle,row,label,detail,leader},i)=>{
    if(label){
      label.hidden=!enabled;
      leader.style.visibility=enabled?'visible':'hidden';
      leader.style.opacity=i===active?'1':'.7';
      label.classList.toggle('active',i===active);
      label.setAttribute('aria-expanded',String(!comparison.hidden && selected===i));
      detail.classList.toggle('active',i===active);
    }
    circle.style.opacity=active<0||i===active?'1':'.42';
    row.classList.toggle('active',i===active);
    row.setAttribute('aria-pressed',String(i===selected));
  });
  drawModel?.(p?.[0],p?.[2]);
}
let start=0;
products.forEach(([name,weight,color],i)=>{
  const row=document.createElement('button');row.className='trade-row';row.type='button';
  row.style.setProperty('--swatch',color);
  for(const text of [name,kg(weight),share(weight)]){const cell=document.createElement('span');cell.textContent=text;row.append(cell)}
  el('.trade-rows').append(row);
  const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
  for(const [k,v] of Object.entries({cx:100,cy:100,r:82,pathLength:1,stroke:color,transform:'rotate(-90 100 100)','stroke-dashoffset':-start}))circle.setAttribute(k,v);
  const svg=el('svg');
  const fraction=weight/total;
  svg.append(circle);
  const hit=circle.cloneNode(false);
  hit.classList.add('trade-hit');
  hit.setAttribute('stroke','transparent');
  hit.setAttribute('stroke-dasharray',fraction+' '+(1-fraction));
  svg.append(hit);
  pieces.push({row,circle,start,fraction});start+=fraction;
  const targets=[row,hit];
  if(i>=5){
    const piece=pieces[i];
    const left=i===5;
    const angle=(piece.start+fraction/2)*Math.PI*2-Math.PI/2;
    const leader=document.createElementNS(circle.namespaceURI,'path');
    leader.setAttribute('d', 'M '+(100+94*Math.cos(angle))+' '+(100+94*Math.sin(angle))+' L '+(left?78:122)+' -6 H '+(left?57:143));
    leader.setAttribute('stroke',color);leader.setAttribute('fill','none');
    leader.style.pointerEvents='none';
    svg.append(leader);
    const label=document.createElement('button'),detail=document.createElement('button');
    label.type=detail.type='button';label.hidden=true;
    label.className='minor-label '+(left?'powder':'specimens');
    label.setAttribute('aria-controls',comparison.id);
    label.textContent=name+' · '+share(weight);
    detail.textContent=name+'　'+kg(weight)+' kg　'+(100*weight/pairWeight).toFixed(3)+'%';
    for(const button of [label,detail])button.style.setProperty('--swatch',color);
    comparison.append(detail);ring.append(label);
    Object.assign(piece,{label,detail,leader});
    targets.push(label,detail);
  }
  for(const target of targets){
    target.onpointerenter=e=>{if(enabled&&e.pointerType!=='touch'){hover=i;paint()}};
    target.onpointerleave=()=>{hover=-1;paint()};
    target.onclick=()=>{if(enabled){selected=selected===i && target!==pieces[i].detail?-1:i;hover=-1;paint()}};
  }
});
const clamp=x=>Math.max(0,Math.min(1,x));
function ramp(x){x=clamp(x);return x*x*(3-2*x)}
let updateFrame, ringRect;
function requestUpdate(){
  if(updateFrame!==undefined)return;
  updateFrame=requestAnimationFrame(()=>{
    updateFrame=undefined;
    update();
  });
}
function refreshGeometry(){
  ringRect=undefined;
  requestUpdate();
}
function update(){
  const distance = scrollY + innerHeight - totalsSection.offsetTop;
  const productsHeight = productsSection.offsetHeight;
  const handoff = ramp((distance - totalsSection.offsetHeight - productsHeight) / (innerHeight * .65));
  // The summary occupies one animation unit over its full section height.
  // Map the product section's scroll distance to the two existing animation units.
  const t = distance <= totalsSection.offsetHeight
    ? distance / totalsSection.offsetHeight
    : 1 + 2 * (distance - totalsSection.offsetHeight) / productsHeight;
  const visible=t>0 && handoff<1;
  updateSequence(t);
  stage.hidden=!visible;
  document.body.classList.toggle('opening-handoff',handoff>0);
  oldCopy.style.opacity=oldTimeline.style.opacity=t>0?String(1-ramp(t/.36)):'';
  if(!visible){
    if(enabled){enabled=false;selected=hover=-1;stage.classList.remove('interactive');list.inert=true;paint()}
    return;
  }
  const travel=ramp((t-1.5)/.5);
  const showList=ramp((t-2.6)/.4);
  stage.style.opacity=ramp(t/.25)*(1-handoff);
  summary.style.opacity=1-travel;
  number.style.opacity = sequence === 'waiting' ? 0 : ramp(t / 0.25);
  ringRect ??= ring.getBoundingClientRect();
  const rect=ringRect;
  number.style.left=innerWidth/2+(rect.left+rect.width/2-innerWidth/2)*travel+'px';
  number.style.top=innerHeight/2+(rect.top+rect.height/2-innerHeight/2)*travel+'px';
  const big=Number(stage.dataset.editorSize)||Math.min(innerWidth*.11,128),small=Math.min(rect.width,rect.height)*.104;
  number.children[1].style.fontSize=big+(small-big)*travel+'px';
  counter.style.color = travel === 1 ? '' : stage.dataset.editorColor || '';
  model.style.opacity=travel;
  list.style.opacity=showList;
  ringProgress=clamp((t-2)/.6);
  pieces.forEach(({circle,start,fraction})=>{
    const length=Math.min(fraction,Math.max(0,ringProgress-start));
    circle.style.visibility=length?'visible':'hidden';
    circle.setAttribute('stroke-dasharray',length+' '+(1-length));
  });
  enabled=t>=2.995&&handoff===0;stage.classList.toggle('interactive',enabled);list.inert=!enabled;
  if(!enabled){selected=hover=-1}
  paint();
  if(travel>0&&!requested){
    requested=true;
    import('./trade-model.js?v=shared-assets').then(m=>m.loadModel(model.querySelector('canvas'))).then(draw=>{drawModel=draw;paint(true)}).catch(console.error);
  }
}
addEventListener('scroll',requestUpdate,{passive:true});
addEventListener('resize',refreshGeometry);
document.fonts.ready.then(refreshGeometry);
update();

if(new URLSearchParams(location.search).get('tradeEditor') === '1'){
  import('./trade-editor.js?v=single-line').then(({openTradeEditor})=>{
    scrollTo(0, document.querySelector('#trade-total').offsetTop + innerHeight);
    update();
    finishSequence();
    openTradeEditor({stage, year, explanation, counter, update});
  });
}
