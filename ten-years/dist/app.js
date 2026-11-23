(function (global) {
'use strict';
const D = global.MarineDecadeData, M = global.MarineDecadeMotion;
let instanceCount = 0;
const productImages = {fins:'unspecified-fins', 'fin (dried)':'dried-fins', 'fin (wet)':'wet-fins'};
const markup = `
<div class="dv-atmosphere" aria-hidden="true"></div><canvas class="dv-flow" data-role="flow-canvas" aria-hidden="true"></canvas><span class="dv-sr-only" data-role="interaction-status" role="status" aria-live="polite" aria-atomic="true"></span>
<div class="dv-layout">
  <header class="dv-header"><div class="dv-heading"><h1>A decade of trade <span>2015—2024</span></h1><p class="dv-subtitle">Scalloped hammerhead <i>Sphyrna lewini</i></p></div><div class="dv-header-actions"><button class="dv-flow-toggle" data-action="flow" type="button" aria-label="Pause background flow" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6C6 1 8 11 12 6S18 1 22 6M2 12C6 7 8 17 12 12S18 7 22 12M2 18C6 13 8 23 12 18S18 13 22 18"/></svg></button><span class="dv-badge" data-role="mode">CITES trade data</span><button class="dv-text-button" data-action="data" aria-label="Data & methods">Data</button></div></header>
  <div class="dv-toolbar"><nav class="dv-views" aria-label="Chart view"><button data-action="view-annual" aria-pressed="true">Annual quantity</button><button data-action="view-forms" aria-pressed="false">Product forms</button></nav><div class="dv-plot-heading"><span data-role="chart-label"></span><button class="dv-text-button dv-filter-button" data-action="filters" aria-label="Adjust product, reporting side and source">Filters</button></div></div>
  <div class="dv-main"><aside class="dv-focus"><div class="dv-year" data-role="year">2015</div><div class="dv-metrics-stack"><div class="dv-annual-metrics" data-role="annual-metrics"><div class="dv-amount"><strong class="dv-quantity" data-role="quantity">—</strong><span data-role="quantity-unit">kg</span></div><p class="dv-amount-label" data-role="amount-label">Reported trade</p><div class="dv-metric"><span>Year-on-year</span><b data-role="change">—</b></div><span class="dv-sr-only">Data rows <span data-role="items"></span></span><p class="dv-year-note" data-role="year-note" hidden></p></div><div class="dv-form-metrics" data-role="form-metrics" inert aria-hidden="true"></div></div></aside><div class="dv-plot"><div class="dv-chart-stage"><div class="dv-chart dv-chart-scene" data-role="chart"></div><div class="dv-chart dv-chart-scene dv-forms-chart" data-role="forms-chart" inert aria-hidden="true"></div><div class="dv-inspect" data-role="inspect" hidden aria-hidden="true"><span class="dv-inspect-year" data-role="inspect-year"></span><strong data-role="inspect-value"></strong><span class="dv-inspect-hint" data-role="inspect-hint"></span></div></div><div class="dv-chart-note"><span class="dv-legend" data-role="chart-legend"><span>All</span><span>Explored</span></span><span data-role="chart-key">Missing years are gaps</span></div><p class="dv-forms-note" data-role="forms-note">Fixed kg scale · weights are not equivalent biomass.</p></div></div>
  <div class="dv-policy"><h2 class="dv-policy-title">Policy context</h2><div class="dv-event-content" data-role="events"></div></div>
  <div class="dv-footer"><nav class="dv-navigation" aria-label="Select year"><div class="dv-years" data-role="years"></div></nav><div class="dv-transport" aria-label="Timeline controls"><button class="dv-nav-arrow" data-action="previous" aria-label="Previous year"><span aria-hidden="true">←</span> Previous</button><button class="dv-play" data-action="play" aria-pressed="false" aria-label="Play timeline"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1L11 6 3 11Z"/></svg><span>Play</span></button><button class="dv-nav-arrow" data-action="next" aria-label="Next year">Next <span aria-hidden="true">→</span></button></div></div>
  <div class="dv-bottom"><span class="dv-explore-mark" aria-hidden="true">↓</span><span class="dv-explore-copy"><span data-role="navigation-hint">Scroll or swipe to explore</span><span class="dv-explore-alternative">Year buttons and arrow keys also work</span></span><span class="dv-explore-scene" data-role="explore-scene">01 / 02</span></div>
</div>
<dialog class="dv-dialog" data-role="data-dialog" aria-label="Data & methods"><div class="dv-dialog-header"><h2>Data & methods</h2><button class="dv-close" data-action="close" aria-label="Close data panel">×</button></div><div class="dv-settings"><label data-role="product-setting"><span>Product</span><select data-role="term" aria-label="Product"><option value="fins">Fins (FIN)</option><option value="fin (dried)">Dried fins (DFN)</option><option value="fin (wet)">Wet fins (FFN)</option></select></label><label><span>Reporting side</span><select data-role="reporter" aria-label="Reporting side"><option value="E">Exporter-reported</option><option value="I">Importer-reported</option></select></label><label><span>Source</span><select data-role="source" aria-label="Specimen source"><option value="all">All sources</option><option value="W">Wild (W)</option></select></label><span class="dv-unit"><b>kg</b> / I–III</span></div><p>Annual quantity shows one product; Product forms compares FIN, DFN and FFN separately on a common kg scale. Specimen source and reporting side apply to both views within Appendices I–III. Product weights are not equivalent biomass; no product totals or animal estimates are calculated. Importer and exporter reports are analysed separately. Data rows are not transactions, shipments or animals.</p><p>Years without matching records remain missing. A reported zero stays zero.</p><p class="dv-data-meta"><span data-role="coverage"></span> · <span data-role="bottom-note">Official comparative tabulation; direct trade and re-exports included.</span></p><div data-role="provenance"><h3>Source</h3><p><a href="https://trade.cites.org/en/cites_trade" target="_blank" rel="noopener noreferrer">CITES Trade Database</a>. Compiled by UNEP-WCMC for the CITES Secretariat. Accessed 4 November 2026. Live-query comparative tabulation for <i>Sphyrna lewini</i>, 2015–2024.</p><p>FIN, DFN and FFN remain separate. This extract first records dried fins (DFN) in 2022 on the importer side and 2023 on the exporter side; changes in FIN alone do not describe all fin forms. Only explicit kg records are included. Blank/count units, g and cm³ are excluded; no unit conversion or animal-count estimate is made.</p><p><a href="data/cites-sphyrna-lewini-2015-2024-comptab.csv" download>Official CSV extract</a> · <a href="data/provenance.json" download>Provenance & exclusions</a> · <a href="https://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf" target="_blank" rel="noopener noreferrer">CITES interpretation guide</a></p></div><p>Baseline: Appendix II took effect on <a href="https://cites.org/sites/default/files/eng/cop/17/WorkingDocs/E-CoP17-56-01.pdf" target="_blank" rel="noopener noreferrer">14 September 2014</a>, before this decade. Party reservations and national rules require separate checks.</p><h3>Import replacement data</h3><p>UTF-8 CSV: Year, Quantity, Unit, Term, Reporter.type, Taxon, Importer, Exporter, Source, Appendix. Imported files stay in this browser; reloading restores the bundled CITES extract.</p><div class="dv-import-actions"><label class="dv-file">Import CSV<input data-role="csv-input" type="file" accept=".csv,text/csv"></label><a href="template.csv" download>CSV template</a><button class="dv-quiet-button" data-action="table">View data table</button></div><h3>Management context</h3><p>Import JSON with original documents, effective dates and applicable scope. Six selected records are bundled: national measures reported to CITES, a review decision and suspension recommendations. Country scopes are shown as context, never as global restrictions. Empty years do not imply no measures. <a href="data/cites-management-events.json" download>Download event register</a>.</p><label class="dv-file">Import events JSON<input data-role="events-input" type="file" accept=".json,application/json"></label><p class="dv-feedback" data-role="feedback" aria-live="polite"></p><p class="dv-statement">Trade trends alone do not establish population change or policy effectiveness. Later-year totals may change as reports are added or revised.</p></dialog>
<dialog class="dv-dialog" data-role="table-dialog" aria-label="Annual data"><div class="dv-dialog-header"><h2>Annual data</h2><button class="dv-close" data-action="close" aria-label="Close data table">×</button></div><table><caption data-role="table-caption"></caption><thead><tr><th>Year</th><th>Product</th><th>Quantity / kg</th><th>Data rows</th></tr></thead><tbody data-role="table-body"></tbody></table><div class="dv-table-actions"><button class="dv-quiet-button" data-action="export">Export filtered CSV</button><button class="dv-quiet-button" data-action="back-data">Back to methods</button></div></dialog><dialog class="dv-dialog" data-role="event-dialog" aria-label="Policy source and scope"><div class="dv-dialog-header"><span>Policy context</span><button class="dv-close" data-action="close" aria-label="Close policy details">×</button></div><div data-role="event-detail"></div></dialog>`;

// Decorative only: finite, input-driven motion with no connection to the timeline.
function attachAtmosphere(root){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)');
  let frame=0,last=0,x=0,y=0,targetX=0,targetY=0,disposed=false;
  const paint=()=>{root.style.setProperty('--dv-light-x',`${x.toFixed(2)}px`);root.style.setProperty('--dv-light-y',`${y.toFixed(2)}px`);};
  function tick(now){
    frame=0;if(disposed)return;
    const dt=last?Math.min(64,now-last):16.67;last=now;
    const ease=1-Math.exp(-dt/240);
    x+=(targetX-x)*ease;y+=(targetY-y)*ease;
    const moving=Math.abs(targetX-x)+Math.abs(targetY-y)>.05;
    if(!moving){x=targetX;y=targetY;last=0;}
    paint();if(moving)frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!disposed){last=0;frame=requestAnimationFrame(tick);}}
  function reset(immediate=false){
    targetX=targetY=0;
    if(immediate){if(frame)cancelAnimationFrame(frame);frame=0;last=0;x=y=0;paint();}
    else if(x||y)start();
  }
  function move(event){
    if(event.pointerType!=='mouse'||!fine.matches||reduced.matches||document.hidden)return;
    if(event.target.closest('dialog')){reset();return;}
    const box=root.getBoundingClientRect();if(!box.width||!box.height)return;
    targetX=(Math.max(0,Math.min(1,(event.clientX-box.left)/box.width))-.5)*64;
    targetY=(Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))-.5)*36;
    start();
  }
  const leave=()=>reset(),preference=()=>reset(true),hidden=()=>{if(document.hidden)reset(true);};
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',leave);
  root.addEventListener('focusin',leave);root.addEventListener('keydown',leave);
  document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',leave);
  reduced.addEventListener('change',preference);fine.addEventListener('change',preference);
  return ()=>{
    disposed=true;reset(true);
    root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',leave);
    root.removeEventListener('focusin',leave);root.removeEventListener('keydown',leave);
    document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',leave);
    reduced.removeEventListener('change',preference);fine.removeEventListener('change',preference);
    root.style.removeProperty('--dv-light-x');root.style.removeProperty('--dv-light-y');
  };
}

function mount(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw Error('Provide a chapter container element.');
  const linked = options.linked === true;
  const progressiveColumns = linked && options.progressiveColumns === true;
  let revealedThrough = 2015;
  const productTarget = linked && options.productTarget instanceof HTMLElement ? options.productTarget : null;
  const productTimeline = productTarget && options.progressiveForms ? new AbortController() : null;
  const chapterView=options.chapterView??null;
  if(chapterView&&!['annual','forms'].includes(chapterView))throw Error('Chapter view must be annual or forms.');
  const chapterStart=!linked&&chapterView==='forms'?11:0,chapterEnd=linked||chapterView==='annual'?9:20;
  if (root._marineDecade) root._marineDecade.destroy();
  const uid = `marine-decade-${++instanceCount}`;
  root.classList.add('dv-shell');
  root.tabIndex = 0;
  root.setAttribute('aria-label',chapterView?(chapterView==='forms'?'Product forms, 2015–2024. Scroll or use arrow keys to explore.':'Annual trade, 2015–2024. Scroll or use arrow keys to explore.'):'A decade of trade. Scroll or use arrow keys to explore.');
  root.innerHTML = markup;
  root.classList.toggle('dv-linked',linked);
  root.classList.remove('dv-trade-separated');
  root.dataset.chapter=chapterView||'';
  if(chapterView&&!linked){
    const title=root.querySelector('h1');
    if(chapterView==='forms'){
      const heading=document.createElement('h2');heading.textContent='Product forms';title.replaceWith(heading);
    }else if(options.intro){
      const heading=document.createElement('h2');heading.textContent='Annual trade';title.replaceWith(heading);
    }
    if(chapterView==='forms'||options.intro)root.querySelector('.dv-subtitle').hidden=true;
    const link=document.createElement('a');link.className='dv-chapter-link';
    link.href=chapterView==='annual'?'#product-forms':'#annual-trade';
    link.textContent=chapterView==='annual'?'↓':'↑';
    link.setAttribute('aria-label',chapterView==='annual'?'Go to product forms':'Back to annual trade');
    link.title=chapterView==='annual'?'Product forms':'Annual trade';root.querySelector('.dv-heading').append(link);
  }
  delete root.dataset.explored;
  const instructions=document.createElement('p');
  instructions.id=`${uid}-instructions`;instructions.className='dv-sr-only';
  instructions.textContent=linked
    ?'Move across the years or use the arrow keys to update the product forms. Hover over a product image or activate its button to show its annual trend.'
    :'Scroll or swipe through years. Select a year, use arrow keys, or use Play. Use the chapter arrow to move between Annual trade and Product forms.';
  root.prepend(instructions);root.setAttribute('aria-describedby',instructions.id);
  const chartLabel=root.querySelector('[data-role="chart-label"]');
  let chapterHeading=null;
  let productChart, productYear;
  const q = name => root.querySelector(`[data-role="${name}"]`) ?? productTarget?.querySelector(`[data-role="${name}"]`);
  const action = name => root.querySelector(`[data-action="${name}"]`);
  if(linked){
    root.setAttribute('aria-label',productTarget?'Annual fin trade, 2015–2024':'Annual trade and product forms, 2015–2024');
    const heading=document.createElement('h2');
    if(options.intro && options.showChapterBack!==false){
      const link=document.createElement('a');
      link.className='dv-chapter-link';
      link.href='#ocean-intro';
      link.textContent='↑';
      link.setAttribute('aria-label','Back to the surface');
      link.title='Back to the surface';
      root.querySelector('.dv-header').append(link);
    }
    heading.textContent='Fin trade';
    root.querySelector('h1').replaceWith(heading);
    root.querySelector('.dv-subtitle').hidden=true;
    root.querySelector('.dv-header-actions').remove();
    const toolbar=root.querySelector('.dv-toolbar');
    if(options.intro)heading.parentElement.append(toolbar);
    else toolbar.classList.add('dv-sr-only');
    chartLabel.id=`${uid}-series`;
    action('filters').remove();
    root.querySelector('.dv-footer').remove();
    root.querySelector('.dv-policy').remove();
    const plot=root.querySelector('.dv-plot');
    plot.insertAdjacentHTML('afterbegin','<div class="dv-linked-summary"></div>');
    q('amount-label').id=`${uid}-amount-label`;
    root.querySelector('.dv-linked-summary').append(q('amount-label'),q('quantity').parentElement);
    const forms=q('forms-chart');
    if(productTarget){
      q('product-panel').replaceChildren(forms);
      productChart=forms;
      productYear=q('product-year');
      productYear.innerHTML=D.YEARS.map(year=>`<option value="${year}">${year}</option>`).join('');
      productYear.disabled=false;
      toolbar.insertAdjacentHTML('beforeend',`<a class="dv-product-link" href="#${productTarget.id}">Product forms <span aria-hidden="true">↓</span></a>`);
    }else{
      plot.insertAdjacentHTML('afterend',`<section class="dv-linked-forms" aria-labelledby="${uid}-forms-title">
        <header class="dv-forms-heading"><h3 id="${uid}-forms-title">Product forms</h3><span data-role="forms-year"></span></header>
      </section>`);
      root.querySelector('.dv-linked-forms').append(forms);
    }
    forms.inert=false;
    forms.removeAttribute('aria-hidden');
    if(options.headingTarget instanceof HTMLElement){
      root.querySelector('.dv-layout').prepend(root.querySelector('.dv-views'));
      root.querySelector('.dv-layout').append(toolbar);
      if(!options.headingTarget.querySelector('h2')){
        chapterHeading=root.querySelector('.dv-heading');
        options.headingTarget.append(chapterHeading);
      }
      const back=root.querySelector('.dv-chapter-link');
      if(back){
        back.href=`#${options.headingTarget.closest('section[id]').id}`;
        back.setAttribute('aria-label','Back to fin trade introduction');
        back.title='Back to fin trade introduction';
        root.querySelector('.dv-linked-summary').append(back);
      }
      root.querySelector('.dv-header').remove();
      root.classList.add('dv-trade-separated');
    }
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!options.data&&!global.MarineDecadeDataset?.records?.length){
    root.innerHTML='<p>Official dataset unavailable. Reload the page or supply a verified dataset.</p>';
    throw Error('The bundled CITES dataset is missing; no demonstration data is substituted.');
  }
  let rows = D.createRecords(), demo = false, selected = 2015;
  let events = (global.MarineDecadeEvents || []).map(e=>({...e})), eventIndex = 0, data = [], chartWidth = 840;
  let playing = null, destroyed = false;
  let position=0,targetPosition=0,progress=0,targetProgress=0,view='annual',sceneBlend=0,scrubDirection=1,switchMotion=null,formSeries=[],formGeometry=[],motionFrame=0,lastFrameTime=0,settleTimer=null,motionOrigin='init';
  let chartY=value=>0,inTick=false;
  let hintFade=null,previewYear=null;
  let mounted=false;
  const linkedYearAnimations=[];
  let linkedFormsCeiling=0;
  let policyHTML='',policyPending='',policyOpacity=0,policyPhase=null,policyElapsed=0,policyFrom=0;
  const switchDuration=680;
  let touchStart = null, resizeFrame = 0,suppressProductClick=false;
  const termNames = {fins:'Fins (FIN)', 'fin (dried)':'Dried fins (DFN)', 'fin (wet)':'Wet fins (FFN)'};
  const terms=Object.keys(termNames);
  const productName=term=>term==='fins'?'Unspecified fins (FIN)':termNames[term];
  const filters = () => ({term:q('term').value,reporter:q('reporter').value,source:q('source').value});
  const caption=(next,includeAllSources=true)=>{
    const {term,reporter,source}=filters();
    const parts=[reporter==='E'?'Exporter-reported':'Importer-reported'];
    if(next==='annual')parts.unshift(linked?productName(term):termNames[term]);
    if(source==='W')parts.push('Wild (W)');
    else if(includeAllSources)parts.push('All sources');
    return parts.join(' · ');
  };
  function chartCaption(next){
    if(linked&&options.intro){
      const {reporter,source}=filters();
      return `CITES ${reporter==='E'?'exporter':'importer'} reports · ${source==='W'?'Wild (W)':'All sources'}`;
    }
    return `${caption(next,linked||!options.intro)}${next==='annual'&&!linked?' · kg':''}`;
  }
  q('year').innerHTML='<span class="dv-year-frame" data-role="year-current" aria-hidden="true"></span><span class="dv-year-frame" data-role="year-next" aria-hidden="true"></span>';
  if(!linked)q('years').innerHTML = D.YEARS.map(year => `<button data-year="${year}" aria-label="View ${year}" aria-pressed="false">${year}</button>`).join('');

  function matchesEvent(e) {
    const f=filters(),products=linked||view==='forms'?terms:[f.term];
    if(e.annotation_mode==='context_only')return e.products.some(t=>products.includes(t))&&(!e.source_codes||f.source==='all'||e.source_codes.includes(f.source));
    return products.includes(e.term)&&e.unit==='kg'&&e.reporter===f.reporter&&e.source===f.source;
  }
  function rebuild(reuseForms=false) {
    hideInspect();
    const activeFilters=filters();
    if(!reuseForms)formSeries=terms.map(term=>({term,values:D.summarize(rows,{...activeFilters,term})}));
    data=formSeries.find(series=>series.term===activeFilters.term).values;
    draw();
    if(!reuseForms)drawForms();
    update(false);renderMotion();
  }
  function startMotion(){
    if(!motionFrame&&!destroyed&&!inTick){lastFrameTime=0;motionFrame=requestAnimationFrame(tick);}
  }
  function dismissHint(){
    if(linked||root.dataset.explored==='true')return;
    root.dataset.explored='true';hintFade=0;startMotion();
  }
  function tick(now){
    motionFrame=0;if(destroyed)return;inTick=true;
    const dt=lastFrameTime?Math.min(64,now-lastFrameTime):16.67;lastFrameTime=now;
    if(switchMotion){
      switchMotion.elapsed+=dt;
      if(reduced.matches||switchMotion.elapsed>=switchDuration)switchMotion=null;
    }else{
      if(playing!==null)targetProgress=M.clamp(targetProgress+dt/Math.max(250,options.playInterval??1400),chapterStart,chapterEnd);
      if(reduced.matches&&targetProgress>9&&targetProgress<11)targetProgress=targetProgress>=progress?11:9;
      progress=reduced.matches?targetProgress:progress+(targetProgress-progress)*(1-Math.exp(-dt/((progress>8.8&&progress<11.2)?150:95)));
      if(Math.abs(targetProgress-progress)<.00015)progress=targetProgress;
    }
    if(hintFade!==null){
      hintFade+=dt;const t=reduced.matches?1:Math.min(1,hintFade/220),hint=root.querySelector('.dv-bottom');
      hint.style.opacity=String(1-M.smooth(t));
      if(t===1){hint.hidden=true;hintFade=null;}
    }
    tickPolicy(dt,reduced.matches||(!switchMotion&&Math.abs(targetProgress-progress)<.18&&!(progress>9&&progress<11)));renderMotion();inTick=false;
    if(playing!==null&&targetProgress===chapterEnd&&progress===chapterEnd)pause();
    if(switchMotion||policyPhase||hintFade!==null||playing!==null||progress!==targetProgress)motionFrame=requestAnimationFrame(tick);else lastFrameTime=0;
  }
  function renderMotion(){
    const f=M.frame(progress,reduced.matches);
    if(switchMotion){
      const t=Math.min(1,switchMotion.elapsed/switchDuration),e=M.smooth(t);
      f.blend=switchMotion.from+(switchMotion.to-switchMotion.from)*e;
      f.yearOpacity=1;f.yearOffset=0;f.contextOpacity=1-.5*Math.sin(Math.PI*t)**2;f.transitioning=true;

    }
    if(!linked&&!switchMotion){chartLabel.style.opacity=f.yearOpacity;chartLabel.textContent=chartCaption(f.view);}
    sceneBlend=f.blend;
    position=f.position;targetPosition=M.frame(targetProgress,reduced.matches).position;
    const previousYear=selected;
    const changedView=view!==f.view,changedYear=previousYear!==f.year;
    view=f.view;selected=f.year;
    root.dataset.position=position.toFixed(5);root.dataset.progress=progress.toFixed(5);root.dataset.view=view;
    root.dataset.transitioning=String(f.transitioning);
    if(changedView||changedYear||f.transitioning||playing!==null)hideInspect();
    if(changedView||changedYear){
      if(changedYear)eventIndex=0;
      if(linked)updateLinkedYear(mounted?previousYear:selected);
      else update(changedYear&&!f.transitioning);
      if(changedView)root.dispatchEvent(new CustomEvent('decade:view-change',{bubbles:true,detail:{view,year:selected,origin:motionOrigin}}));
      if(changedYear)root.dispatchEvent(new CustomEvent('decade:year-change',{bubbles:true,detail:{year:selected,position,progress,view,origin:motionOrigin,filters:filters(),demo}}));
    }
    if(linked)return;
    paintPolicy(f);
    if(switchMotion){const t=Math.min(1,switchMotion.elapsed/switchDuration);chartLabel.textContent=t<.5?switchMotion.captionFrom:chartCaption(f.view);chartLabel.style.opacity=1-Math.sin(Math.PI*t)**2;}
    const base=Math.min(9,Math.floor(position)),fraction=position-base;
    const first=q('year-current'),next=q('year-next');
    first.textContent=String(reduced.matches?selected:2015+base);next.textContent=String(Math.min(2024,2016+base));
    const reel=reduced.matches?0:M.smooth(fraction);
    first.style.transform=`translate3d(0,${-reel*100}%,0)`;
    next.style.transform=`translate3d(0,${(1-reel)*100}%,0)`;
    next.style.visibility=base===9||reduced.matches?'hidden':'visible';
    q('year').style.opacity=f.yearOpacity;q('year').style.transform=`translate3d(0,${f.yearOffset}px,0)`;q('year').setAttribute('aria-label',String(selected));
    const scene=M.sceneState(f.blend,reduced.matches),focus=M.yearFocus(position,reduced.matches);
    const annualSummary=1-M.smooth(f.blend/.45),formsSummary=M.smooth((f.blend-.55)/.45);
    for(const [name,opacity,active] of [['chart',scene.annualOpacity,view==='annual'],['forms-chart',scene.formsOpacity,view==='forms'],['annual-metrics',annualSummary*f.yearOpacity*focus.opacity,view==='annual'],['form-metrics',formsSummary*f.yearOpacity,view==='forms']]){
      const el=q(name);el.style.opacity=opacity;el.inert=!active;el.setAttribute('aria-hidden',String(!active));el.style.pointerEvents=active&&!f.transitioning?'':'none';
    }
    q('chart').style.transform=`translate3d(0,${scene.annualOffset}px,0)`;
    q('forms-chart').style.transform=`translate3d(0,${scene.formsOffset}px,0)`;
    q('annual-metrics').style.transform=`translate3d(0,${focus.offset}px,0)`;
    q('forms-note').style.opacity=f.blend;q('forms-note').setAttribute('aria-hidden',String(view!=='forms'));
    q('forms-chart').querySelectorAll('[data-form-year]').forEach(el=>{el.style.opacity=[2015,2024,selected].includes(+el.dataset.formYear)||chartWidth>550?'1':'0';});
    const annualPosition=progress>9&&!switchMotion?9:position;
    const x=chartX(annualPosition),clip=q('chart').querySelector('.dv-clip'),guide=q('chart').querySelector('.dv-guide');
    if(clip)clip.style.width=`${x+.5}px`;
    if(guide)guide.style.transform=`translateX(${x}px)`;
    const cursor=q('chart').querySelector('.dv-cursor'),value=M.valueAt(data,annualPosition);
    if(cursor){cursor.style.visibility=value===null?'hidden':'visible';if(value!==null){cursor.setAttribute('cx',x);cursor.setAttribute('cy',chartY(value));}}
    const particleMark=q('chart').querySelector('.dv-particle-cursor');
    if(particleMark){particleMark.style.visibility=value===null?'hidden':'visible';if(value!==null)particleMark.setAttribute('transform',`translate(${x} ${chartY(value)})`);}
    const formPosition=progress<11&&!switchMotion?0:position;
    formGeometry.forEach((g,i)=>{
      const state=M.barState(formSeries[i].values,formPosition,reduced.matches);
      g.fill.style.transform=`scaleX(${state.value===null?0:state.value/g.ceiling})`;
      g.fill.style.opacity=state.opacity;
      if(g.tip){g.tip.hidden=state.value===null||state.value===0;g.tip.style.left=`${state.value===null?0:state.value/g.ceiling*100}%`;g.tip.style.opacity=state.opacity;}
    });
    renderTransport();
  }
  function paintPolicy(frame){
    const policy=root.querySelector('.dv-policy');
    policy.style.opacity=policyOpacity*frame.contextOpacity;
    q('events').style.transform=`translate3d(0,${(1-policyOpacity)*4}px,0)`;
    policy.inert=frame.transitioning||policyPhase==='out'||policyPhase==='wait'||policyOpacity*frame.contextOpacity<.3||!policyHTML;
    policy.setAttribute('aria-hidden',String(policy.inert));
  }
  function settle(){
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settleTimer=null;targetProgress=M.settled(targetProgress,scrubDirection);startMotion();},240);
  }
  function scrub(delta,origin,shouldSettle=true){
    dismissHint();
    pause();clearTimeout(settleTimer);settleTimer=null;
    cancelSwitch();scrubDirection=Math.sign(delta)||scrubDirection;motionOrigin=origin;targetProgress=M.clamp(targetProgress+delta,chapterStart,chapterEnd);startMotion();
    if(shouldSettle)settle();
  }
  function cancelSwitch(){switchMotion=null;}
  function chooseYear(year,origin='api'){
    if(destroyed)return;
    const value=Number(year);if(!Number.isFinite(value))return;
    hideInspect();
    if(origin!=='api')dismissHint();
    pause();cancelSwitch();clearTimeout(settleTimer);settleTimer=null;
    motionOrigin=origin;targetProgress=M.progressFor(view,Math.round(value));
    if(linked){
      progress=targetProgress;renderMotion();
      if(origin==='click'||origin==='keyboard')q('interaction-status').textContent=`Trade data updated to ${selected}.`;
      return;
    }
    // Year controls stay in the active view, including when a scroll transition is interrupted.
    if(M.frame(progress).view!==view)progress=M.progressFor(view,selected);
    startMotion();
  }
  function setView(next,origin='api'){
    if(destroyed)return;
    if(!['annual','forms'].includes(next))throw Error('View must be annual or forms.');
    if(linked)return;
    if(chapterView&&next!==chapterView){
      pause();root.dispatchEvent(new CustomEvent('decade:navigate',{bubbles:true,detail:{view:next,year:selected,filters:filters(),origin}}));return;
    }
    hideInspect();
    if(origin!=='api')dismissHint();
    if(next===view&&!switchMotion)return;
    pause();clearTimeout(settleTimer);settleTimer=null;
    const from=sceneBlend,captionFrom=chartLabel.textContent;
    const year=selected;motionOrigin=origin;
    progress=targetProgress=M.progressFor(next,year);
    switchMotion=reduced.matches?null:{from,to:next==='forms'?1:0,elapsed:0,captionFrom};
    renderMotion();startMotion();
  }
  function step(direction,origin){
    const next=Math.round(M.frame(targetProgress).position)+direction;
    if(next<0||next>9){
      root.dispatchEvent(new CustomEvent('decade:boundary',{bubbles:true,detail:{direction,year:selected,view,origin}}));return false;
    }
    chooseYear(next+2015,origin);return true;
  }
  function cancelLinkedYearAnimation(){
    for(const animation of linkedYearAnimations.splice(0))animation.cancel();
  }
  function updateLinkedYear(previousYear=selected){
    const animate=previousYear!==selected&&!reduced.matches;
    root.dataset.year=String(selected);
    updateAmount(data[selected-2015]);
    const heading=q('forms-year');
    if(heading)heading.textContent=String(selected);
    if(productYear)productYear.value=String(selected);
    cancelLinkedYearAnimation();
    if(animate){
      const offset=6*Math.sign(selected-previousYear);
      const targets=productTarget?[q('quantity').parentElement]:[heading];
      for(const target of targets){
        const animation=target.animate?.([
          {opacity:.72,transform:`translateY(${offset}px)`},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:240,easing:'cubic-bezier(.2,.7,.25,1)'});
        if(animation)linkedYearAnimations.push(animation);
      }
    }
    const chart=q('chart');
    if(progressiveColumns&&selected>revealedThrough){
      revealedThrough=selected;
      chart.querySelectorAll('.dv-graph-point[data-unrevealed]').forEach(point=>{
        if(+point.dataset.year<=revealedThrough)point.removeAttribute('data-unrevealed');
      });
    }
    chart.querySelector('[aria-current="true"]')?.removeAttribute('aria-current');
    chart.querySelector(`[data-year="${selected}"]`)?.setAttribute('aria-current','true');
    chart.querySelector('.dv-year-indicator').style.transform=`translateX(${chartX(selected-2015)}px)`;
    updateFormValues(animate);
  }
  function updateAmount(entry){
    const {term}=filters();
    const name=linked?productName(term):termNames[term];
    q('quantity').textContent=entry.value===null?'No records':D.fmt(entry.value);
    q('quantity-unit').hidden=entry.value===null;
    q('amount-label').textContent=`${selected} · ${name}`;
  }
  function updateFormValues(animate=false){
    const activeProduct=productTarget?filters().term:null;
    if(linked){
      const max=Math.max(1,...formSeries.map(series=>series.values[selected-2015].value??0));
      const step=10**Math.floor(Math.log10(max))/5;
      const ceiling=Math.ceil(max/step)*step;
      const scaleChanged=ceiling!==linkedFormsCeiling;
      const bars=q('product-bars');
      if(scaleChanged){
        linkedFormsCeiling=ceiling;
        const maxLabel=`${D.fmt(ceiling)} kg`;
        q('forms-scale-max').textContent=maxLabel;
        bars.setAttribute('aria-label',`Separate product weights on a shared scale from 0 to ${maxLabel}`);
        if(animate&&options.progressiveForms){
          const animation=bars.animate?.([{opacity:.55},{opacity:1}],{duration:240,easing:'ease-out'});
          if(animation)linkedYearAnimations.push(animation);
        }
      }
      // Interpolate only between values that share the same axis.
      animate=animate&&!scaleChanged;
      bars.classList.toggle('dv-scale-stable',animate);
    }
    formGeometry.forEach((g,i)=>{
      const entry=formSeries[i].values[selected-2015];
      const missing=entry.value===null;
      const number=missing?'No records':D.fmt(entry.value);
      const weight=missing?number:`${number} kg`;
      g.value.textContent=linked?weight:number;
      if(linked&&!missing){
        // A newly reported bar fades in at its real length. Only two observed values can resize.
        g.fill.classList.toggle('dv-fill-moving',animate&&!g.row.classList.contains('is-missing'));
        g.fill.style.width=`${entry.value/linkedFormsCeiling*100}%`;
        g.fill.hidden=entry.value===0;
      }
      g.row.classList.toggle('is-missing',missing);
      g.row.setAttribute('aria-label',`${g.name}, ${selected}: ${weight}. View annual trend`);
      if(productTarget)g.row.setAttribute('aria-pressed',String(g.row.dataset.product===activeProduct));
      if(!linked||!missing)g.zero.hidden=entry.value!==0;
    });
  }
  function update(animate) {
    root.dataset.view=view;
    action('view-annual').setAttribute('aria-pressed',String(view==='annual'));action('view-forms').setAttribute('aria-pressed',String(view==='forms'));
    q('product-setting').hidden=view==='forms';
    const entry = data[selected - 2015], previous = data[selected - 2016];
    root.dataset.year = String(selected);
    if(!linked)updateAmount(entry);
    const comparable = entry.value !== null && previous && previous.value !== null && previous.value !== 0;
    const change = comparable ? (entry.value / previous.value - 1) * 100 : null;
    q('change').textContent = change === null ? 'N/A' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    q('change').parentElement.hidden = !!options.intro && change === null;
    q('items').textContent = entry.rows.length ? D.fmt(entry.rows.length) : '—';
    q('year-note').textContent = entry.value === null ? 'No matching records. Missing does not mean zero trade.' : selected === 2015 ? 'The record starts here.' : previous?.value === null ? 'No previous-year record; year-on-year change is unavailable.' : 'Interpret changes alongside reporting coverage and trade composition.';
    chartLabel.textContent=chartCaption(view);
    if(productTarget)q('product-caption').textContent=chartCaption('forms');
    if(linked&&options.intro)chartLabel.title=caption(view);
    q('form-metrics').innerHTML='';
    q('chart-legend').hidden=view==='forms';q('chart-key').textContent=view==='forms'?'':'Gaps = no records';
    q('chart-key').hidden=view==='forms'||!data.some(d=>d.value===null);
    if(linked)updateLinkedYear();
    else updateFormValues();
    q('navigation-hint').textContent=view==='annual'?'Scroll / swipe to explore · continue to product forms':'Scroll / swipe to explore · reverse to return';
    q('explore-scene').textContent=view==='annual'?'01 / 02':'02 / 02';
    q('year-note').hidden = !!options.intro || entry.value !== null;
    q('coverage').textContent = `${data.filter(x=>x.value!==null).length} / 10 years with records`;
    if(!linked){
      root.querySelectorAll('.dv-years [data-year]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.year === selected)));
      if(root.clientWidth<=700){
        const strip=q('years'),active=strip.querySelector('[aria-pressed="true"]');
        if(active)strip.scrollLeft+=active.getBoundingClientRect().left-strip.getBoundingClientRect().left-(strip.clientWidth-active.offsetWidth)/2;
      }
      action('previous').disabled = selected === 2015;
      action('next').disabled = selected === 2024;
      root.querySelectorAll('.dv-graph-point,.dv-form-point').forEach(point => {
        const active = +point.dataset.year === selected;
        point.setAttribute('aria-pressed', String(active));
        const circle = point.querySelector('circle');
        if (circle) {circle.setAttribute('r',point.classList.contains('dv-form-point')?'3.5':'0');circle.style.fill='';circle.style.stroke='';}
        point.querySelectorAll('text').forEach(text=>{text.style.fill='';if(text.dataset.axisYear)text.style.opacity=[2015,2024].includes(+point.dataset.year)?'1':'0';});
      });
    }
    const tableView=linked?'forms':view;
    q('table-caption').textContent=`${tableView==='forms'?'Product forms · ':''}${caption(tableView)} · kg`;
    const tableSeries=tableView==='annual'?[{term:filters().term,values:data}]:formSeries;
    q('table-body').innerHTML=tableSeries.flatMap(({term,values})=>values.map(d=>`<tr><td>${d.year}</td><td>${D.esc(termNames[term])}</td><td>${d.value===null?'No records':D.fmt(d.value)}</td><td>${d.rows.length||'—'}</td></tr>`)).join('');
    renderEvents();
  }
  function columnWidth(){return (chartWidth-52)/D.YEARS.length;}
  function chartX(index) { return linked?44+(index+.5)*columnWidth():42+index/9*(chartWidth-64); }
  function hitYear(event){
    const box=q('chart').getBoundingClientRect();
    const x=(event.clientX-box.left)*chartWidth/Math.max(1,box.width);
    if(linked)return D.YEARS[M.clamp(Math.floor((x-44)/columnWidth()),0,D.YEARS.length-1)];
    return M.nearestYear(x,chartWidth);
  }
  function hideInspect(){
    previewYear=null;q('inspect').hidden=true;
    const mark=q('chart').querySelector('.dv-preview-mark');if(mark)mark.setAttribute('hidden','');
  }
  function inspectYear(year,keyboard=false){
    if(view!=='annual'||switchMotion||(progress>9&&progress<11)||playing!==null)return hideInspect();
    const mode=keyboard?'keyboard':'pointer';
    if(previewYear===year&&!q('inspect').hidden&&q('inspect').dataset.mode===mode)return;
    const entry=data[year-2015];if(!entry)return;
    previewYear=year;
    const host=q('chart'),svg=host.querySelector('svg'),mark=host.querySelector('.dv-preview-mark');
    if(!svg)return;
    const h=svg.viewBox.baseVal.height,x=chartX(year-2015),y=entry.value===null?chartY(0):chartY(entry.value);
    if(mark){
      mark.removeAttribute('hidden');
      const line=mark.querySelector('line'),circle=mark.querySelector('circle');
      line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',16);line.setAttribute('y2',h-26);
      circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.style.visibility=entry.value===null?'hidden':'visible';
    }
    q('inspect-year').textContent=options.intro?String(year):`Preview · ${year}`;
    q('inspect-value').textContent=entry.value===null?'No records':`${D.fmt(entry.value)} kg`;
    q('inspect-hint').textContent=keyboard?'Enter to select':'Click to select';
    const tip=q('inspect');tip.hidden=false;tip.dataset.mode=mode;
    const box=host.getBoundingClientRect(),stage=tip.parentElement.getBoundingClientRect();
    const anchorX=box.left-stage.left+x/chartWidth*box.width,anchorY=box.top-stage.top+y/h*box.height;
    tip.style.left=`${Math.max(8,Math.min(stage.width-tip.offsetWidth-8,anchorX-tip.offsetWidth/2))}px`;
    const above=anchorY-tip.offsetHeight-18;
    tip.style.top=`${Math.max(4,Math.min(stage.height-tip.offsetHeight-4,above>=4?above:anchorY+18))}px`;
  }
  function previewMove(event){
    if(event.pointerType!=='mouse')return;
    if(linked){
      // The page can scroll the chart under a stationary pointer during a chapter jump.
      if(options.intro&&event.movementX===0&&event.movementY===0)return;
      const column=event.target.closest('.dv-graph-point');
      if(column){
        const year=+column.dataset.year;
        if(progressiveColumns&&year>revealedThrough)return hideInspect();
        if(year!==selected)chooseYear(year,'hover');
        return productTarget?hideInspect():inspectYear(year);
      }
      const image=event.target.closest('.dv-product-image');
      if(image)inspectProduct(image.closest('[data-product]').dataset.product,'hover');
      return hideInspect();
    }
    const yearButton=event.target.closest('.dv-years [data-year]');
    if(yearButton)return inspectYear(+yearButton.dataset.year);
    if(event.target.closest('[data-role="chart"]'))return inspectYear(hitYear(event));
    hideInspect();
  }
  function previewFocus(event){
    const point=event.target.closest('.dv-graph-point,.dv-years [data-year]');
    if(point&&(!progressiveColumns||+point.dataset.year<=revealedThrough))inspectYear(+point.dataset.year,true);
  }
  function inspectProduct(term,origin='activate'){
    if(!terms.includes(term))return;
    if(linked){
      if(filters().term===term)return;
      setFilters({term});
    }else{
      pause();hideInspect();q('term').value=term;rebuild();setView('annual','product');
      if(!chapterView)action('view-annual').focus({preventScroll:true});
    }
    if(origin!=='hover'&&(linked||!chapterView)){
      q('interaction-status').textContent=`Annual quantity · ${termNames[term]} · ${selected}. Reporting side and source unchanged.`;
    }
  }
  function draw() {
    chartWidth = Math.max(260, Math.round(q('chart').clientWidth));
    if(linked){drawColumns();return;}
    const w=chartWidth,h=Math.max(140,Math.round(q('chart').clientHeight)),top=24,bottom=30;
    const max=Math.max(1,...data.map(d=>d.value??0));
    const magnitude=10**Math.floor(Math.log10(max));
    const ceiling=Math.ceil(max/magnitude/2)*magnitude*2;
    const y=value=>h-bottom-value/ceiling*(h-top-bottom);
    chartY=y;
    let svg=`<defs><clipPath id="${uid}-clip"><rect class="dv-clip" x="0" y="0" height="${h}" style="width:${chartX(position)+.5}px"/></clipPath></defs>`;
    for(let i=0;i<=2;i++) {
      const value=ceiling*i/2;
      svg+=`<line x1="42" x2="${w-22}" y1="${y(value)}" y2="${y(value)}" class="dv-grid-line" ${i?'stroke-dasharray="2 5"':''}/><text x="31" y="${y(value)+4}" text-anchor="end">${value>=1000?D.fmt(value/1000)+'k':D.fmt(value)}</text>`;
    }
    const segments=[];let segment=[];
    data.forEach((d,i)=>{if(d.value===null){if(segment.length)segments.push(segment);segment=[];}else segment.push([chartX(i),y(d.value)]);});
    if(segment.length)segments.push(segment);
    const paths=segments.map(s=>s.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(' '));
    svg+=paths.map(path=>`<path d="${path}" fill="none" class="dv-series-full"/>`).join('');
    svg+=`<g clip-path="url(#${uid}-clip)">`+paths.map(path=>`<path d="${path}" fill="none" class="dv-series-selected"/>`).join('')+'</g>';

    svg+=`<g class="dv-guide" style="transform:translateX(${chartX(position)}px)"><line x1="0" x2="0" y1="${top-8}" y2="${h-bottom+4}"  stroke-dasharray="3 4"/></g>`;
    data.forEach((d,i)=>{
      const xx=chartX(i), yy=d.value===null?h-bottom:y(d.value);
      svg+=`<g class="dv-graph-point" data-year="${d.year}" tabindex="0" role="button" aria-label="${d.year}, ${d.value===null?'No records':D.fmt(d.value)+' kg'}${demo?', synthetic demo':''}"><rect x="${xx-18}" y="${top-12}" width="36" height="${h-top}" fill="transparent"/>${d.value===null?`<text x="${xx}" y="${h-bottom+13}" text-anchor="middle">—</text>`:`<circle cx="${xx}" cy="${yy}" r="3"/>`}<text data-axis-year="true" x="${xx}" y="${h-6}" text-anchor="middle">${d.year}</text></g>`;
    });
    if(options.intro)svg+=`<g class="dv-particle-cursor" aria-hidden="true" pointer-events="none" style="visibility:hidden">${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,r=10.5+(i%2)*2;return `<circle cx="${(Math.cos(a)*r).toFixed(2)}" cy="${(Math.sin(a)*r).toFixed(2)}" r="${i%3===0?1.1:.65}"/>`;}).join('')}</g>`;
    svg+='<circle class="dv-cursor" r="5.5" pointer-events="none" style="visibility:hidden"/><g class="dv-preview-mark" hidden pointer-events="none"><line/><circle r="7"/></g>';
    q('chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="group" aria-label="Annual reported trade, 2015–2024. Fixed vertical scale in kg.${demo?', synthetic demo':''}">${svg}</svg>`;
  }
  function drawColumns(){
    const host=q('chart');
    const w=chartWidth,h=Math.max(88,Math.round(host.clientHeight)),base=h-28,top=10;
    const step=columnWidth();
    const width=Math.min(58,step*.57);
    const max=Math.max(1,...data.map(entry=>entry.value??0));
    const magnitude=10**Math.floor(Math.log10(max));
    const ceiling=Math.ceil(max/magnitude)*magnitude;
    const y=value=>base-value/ceiling*(base-top);
    chartY=y;
    const ticks=[0,ceiling/2,ceiling];
    const grid=ticks.map(value=>`<line x1="44" x2="${w-8}" y1="${y(value)}" y2="${y(value)}" class="dv-grid-line${value===0?' dv-baseline':''}"/><text x="36" y="${y(value)+4}" text-anchor="end">${value>=1000?D.fmt(value/1000)+'k':D.fmt(value)}</text>`).join('');
    const columns=data.map((entry,index)=>{
      const x=chartX(index),value=entry.value,left=x-width/2;
      const bar=value===null?`<text x="${x}" y="${base-8}" text-anchor="middle">—</text>`
        :value===0?`<line class="dv-column-zero" x1="${x-5}" x2="${x+5}" y1="${base}" y2="${base}"/>`
        :`<rect class="dv-column" fill="url(#${uid}-column-fill)" x="${left}" y="${y(value)}" width="${width}" height="${base-y(value)}"/>
          <line class="dv-column-edge" x1="${left}" x2="${left+width}" y1="${y(value)}" y2="${y(value)}" aria-hidden="true"/>`;
      const label=w<420?`’${String(entry.year).slice(-2)}`:entry.year;
      const unrevealed=progressiveColumns&&entry.year>revealedThrough?' data-unrevealed':'';
      return `<g class="dv-graph-point" data-year="${entry.year}"${unrevealed} tabindex="0" role="button" aria-label="${entry.year}, ${value===null?'No records':D.fmt(value)+' kg'}"><rect class="dv-column-slot" x="${x-step/2}" y="3" width="${step}" height="${h-5}"/><g class="dv-column-mark">${bar}</g><text x="${x}" y="${h-8}" text-anchor="middle">${label}</text></g>`;
    }).join('');
    host.innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="group" aria-label="Annual reported trade, 2015–2024, in kilograms." aria-describedby="${uid}-amount-label ${uid}-series" style="--dv-selected-fill: url(#${uid}-selected-fill)">
      <defs>
        <linearGradient id="${uid}-column-fill" x2="0%" y2="100%">
          <stop class="dv-column-top"/><stop class="dv-column-bottom" offset="100%"/>
        </linearGradient>
        <linearGradient id="${uid}-selected-fill" x2="0%" y2="100%">
          <stop class="dv-column-selected-top"/><stop class="dv-column-selected-bottom" offset="100%"/>
        </linearGradient>
      </defs>
      ${grid}${columns}
      <line class="dv-year-indicator" x1="-8" x2="8" y1="${h-3}" y2="${h-3}" style="transform:translateX(${chartX(selected-2015)}px)" aria-hidden="true"/>
    </svg>`;
  }
  function drawForms(){
    const host=q('forms-chart');
    if(linked){
      linkedFormsCeiling=0;
      host.innerHTML=`<div class="dv-products" data-role="product-bars" role="group">${formSeries.map(({term})=>`
        <button type="button" class="dv-product" data-action="inspect-product" data-product="${D.esc(term)}">
          <img class="dv-product-image" src="${D.esc(options.imageBase ?? 'images/')}${productImages[term]}.webp" alt="" draggable="false">
          <span class="dv-product-data">
            <span class="dv-product-heading"><span class="dv-bar-label">${D.esc(productName(term))}</span><strong class="dv-bar-value"></strong></span>
            <span class="dv-product-track" aria-hidden="true">
              <span class="dv-product-fill"></span><span class="dv-product-zero" hidden></span>
            </span>
          </span>
        </button>`).join('')}
        <div class="dv-product-scale" aria-hidden="true"><span>0</span><span data-role="forms-scale-max"></span></div>
      </div>`;
      formGeometry=Array.from(host.querySelectorAll('.dv-product'),row=>({
        row,name:productName(row.dataset.product),value:row.querySelector('.dv-bar-value'),
        fill:row.querySelector('.dv-product-fill'),zero:row.querySelector('.dv-product-zero')
      }));
      return;
    }
    const max=Math.max(1,...formSeries.flatMap(s=>s.values.map(d=>d.value??0))),magnitude=10**Math.floor(Math.log10(max));
    const ceiling=Math.ceil(max/magnitude)*magnitude;
    const barRows=formSeries.map(({term})=>{
      const name=D.esc(productName(term));
      return `<button type="button" class="dv-bar-row" data-action="inspect-product" data-product="${D.esc(term)}">
        <span class="dv-bar-heading"><span class="dv-bar-label">${name}<span class="dv-bar-arrow" aria-hidden="true"> →</span></span><strong class="dv-bar-value"></strong></span>
        <span class="dv-bar-track" aria-hidden="true"><span class="dv-bar-fill"></span><span class="dv-bar-zero" hidden></span>${options.intro?'<span class="dv-bar-tip" aria-hidden="true" hidden></span>':''}</span>
      </button>`;
    }).join('');
    host.innerHTML=`<div class="dv-bars" role="group" aria-label="Reported product forms in the selected year, separate quantities on a fixed kg scale">
      ${barRows}
      <div class="dv-bar-scale" aria-label="Fixed weight scale in kg"><span>0</span><span>${D.fmt(ceiling)} kg</span></div>
    </div>`;
    formGeometry=Array.from(host.querySelectorAll('.dv-bar-row'),(row,index)=>({row,name:productName(formSeries[index].term),ceiling,fill:row.querySelector('.dv-bar-fill'),value:row.querySelector('.dv-bar-value'),zero:row.querySelector('.dv-bar-zero'),tip:row.querySelector('.dv-bar-tip')}));
  }
  function selectedEvents() {
    return demo?[]:events.filter(e=>matchesEvent(e)&&(e.years?e.years.includes(selected):+e.date.slice(0,4)===selected)).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function commitPolicy(html){
    policyHTML=html;q('events').innerHTML=html;
    root.querySelector('.dv-policy').hidden=!html;
  }
  function queuePolicy(html){
    if(html===policyPending){root.querySelector('.dv-policy').hidden=!policyHTML;return;}
    policyPending=html;
    if(reduced.matches){commitPolicy(html);policyOpacity=html?1:0;policyPhase=null;return;}
    policyFrom=policyOpacity;policyElapsed=0;
    if(policyHTML&&policyOpacity>.01)policyPhase='out';
    else{commitPolicy(html);policyOpacity=0;policyPhase=html?'wait':null;}
    startMotion();
  }
  function tickPolicy(dt,ready=true){
    if(!policyPhase)return;
    if(reduced.matches){commitPolicy(policyPending);policyOpacity=policyPending?1:0;policyPhase=null;return;}
    if(policyPhase==='wait'){
      policyElapsed=ready?policyElapsed+dt:0;
      if(policyElapsed>=90){policyElapsed=0;policyPhase='in';}
      return;
    }
    policyElapsed+=dt;
    if(policyPhase==='out'){
      policyOpacity=policyFrom*(1-M.smooth(policyElapsed/120));
      if(policyElapsed>=120){commitPolicy(policyPending);policyOpacity=0;policyElapsed=0;policyPhase=policyPending?'wait':null;}
    }else{
      policyOpacity=M.smooth(policyElapsed/280);
      if(policyElapsed>=280){policyOpacity=1;policyPhase=null;}
    }
  }
  function renderEvents() {
    if(linked)return;
    const matches=selectedEvents();
    if(!matches.length){queuePolicy('');return;}
    eventIndex=Math.min(eventIndex,matches.length-1);
    const e=matches[eventIndex],url=e.sources?.[0]?.url||e.url;
    queuePolicy(`<div class="dv-event-text"><p class="dv-event-copy">${D.esc(e.date_label||e.date)} · ${D.esc(e.type)}</p><h3 class="dv-event-title">${D.esc(e.title)}</h3><p class="dv-event-copy">${D.esc(e.scope_short||e.scope)}</p></div><div class="dv-event-links"><a href="${D.esc(url)}" target="_blank" rel="noopener noreferrer">Source ↗</a><button class="dv-text-button" data-action="event-details" aria-label="Policy scope and dates">Details</button></div>${matches.length>1?`<div class="dv-event-pager"><button data-action="event-prev" aria-label="Previous policy event" ${eventIndex===0?'disabled':''}>←</button><span>${eventIndex+1}/${matches.length}</span><button data-action="event-next" aria-label="Next policy event" ${eventIndex===matches.length-1?'disabled':''}>→</button></div>`:''}`);
  }
  function showEvent() {
    const matches=selectedEvents();
    const visible=linked?matches:matches.slice(eventIndex,eventIndex+1);
    if(!visible.length)return;
    q('event-detail').innerHTML=visible.map(e=>{
      const sources=e.sources||[{title:'Original document',url:e.url,locator:''}];
      return `<section><p class="dv-event-copy">${D.esc(e.date_label||e.date)} · ${D.esc(e.type)}</p><h2>${D.esc(e.title)}</h2><h3>Applies to</h3><p>${D.esc(e.scope)}</p><h3>Dates</h3><p>${D.esc(e.date_note||e.date)}</p><h3>Evidence</h3><p>${D.esc(e.evidence||'Provider-supplied event; original document not independently verified.')}</p><ul>${sources.map(r=>`<li><a href="${D.esc(r.url)}" target="_blank" rel="noopener noreferrer">${D.esc(r.title)} ↗</a>${r.locator?`<p>${D.esc(r.locator)}</p>`:''}</li>`).join('')}</ul></section>`;
    }).join('')+`<p class="dv-statement">Context for a global annual series, not a global restriction. Annual totals cannot isolate trade during a short suspension or demonstrate compliance or policy effectiveness. Selected documented events; an empty year is not evidence of no management measures.</p>`;
    showDialog('event-dialog');
  }
  function renderTransport(){
    if(linked)return;
    const active=playing!==null,ended=progress>=chapterEnd-.001;
    const label=active?'Pause':ended?'Replay':'Play',button=action('play');
    button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${label} timeline`);
    button.querySelector('span').textContent=label;
    button.querySelector('path').setAttribute('d',active?'M2 1H5V11H2ZM7 1H10V11H7Z':'M3 1L11 6 3 11Z');
  }
  function pause() {playing=null;renderTransport();}
  function play(){
    if(playing!==null){pause();settle();return;}
    clearTimeout(settleTimer);settleTimer=null;
    cancelSwitch();if(progress>chapterEnd-.001){progress=targetProgress=chapterStart;renderMotion();}else targetProgress=progress;
    motionOrigin='play';playing=true;
    renderTransport();
    startMotion();
  }
  let lastTimelineWheel=-Infinity;
  function wheel(event){
    if(destroyed||event.ctrlKey||event.metaKey||event.target.closest('dialog,select,input')||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
    const delta=event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?400:1);
    const direction=Math.sign(event.deltaY);
    const surface=event.currentTarget;
    const isProduct=surface===productTarget;
    const bounds=(linked||chapterView)?surface.getBoundingClientRect():null;
    const alignEnd=isProduct&&bounds.height>global.innerHeight;
    const offset=bounds?(alignEnd?bounds.bottom-global.innerHeight:bounds.top):0;
    const needsAlignment=Math.abs(offset)>2;
    if(needsAlignment&&(!(isProduct||progressiveColumns)||(offset-delta)*direction>0))return;
    const progressive=isProduct||progressiveColumns;
    if(progressive&&document.activeElement===surface)surface.blur();
    const boundary=(targetProgress>=chapterEnd&&direction>0)||(targetProgress<=chapterStart&&direction<0);
    if(boundary&&options.releaseAtBoundary){
      // A trackpad gesture that reaches the last year stays on the chart.
      if(progressive&&(selected!==(direction>0?2024:2015)||
        (direction===scrubDirection&&event.timeStamp-lastTimelineWheel<180))){
        lastTimelineWheel=event.timeStamp;
        event.preventDefault();
        return;
      }
      lastTimelineWheel=-Infinity;
      const released=surface.dispatchEvent(new CustomEvent('decade:boundary',{bubbles:true,cancelable:!!chapterView||!!productTimeline,detail:{direction,year:selected,view,origin:'wheel'}}));if(!released)event.preventDefault();return;
    }
    event.preventDefault();
    if(needsAlignment){
      const block=alignEnd?'end':'start';
      if(options.alignChapter)options.alignChapter(surface,{direction,block});
      else surface.scrollIntoView({behavior:'instant',block});
    }
    if(progressive)lastTimelineWheel=event.timeStamp;
    scrub(direction*Math.min(Math.abs(delta),180)/(options.wheelPixelsPerYear??180),'wheel');
  }
  function keydown(event) {
    if(event.target.closest('dialog,select,input,textarea,a')||event.ctrlKey||event.metaKey||event.altKey)return;
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('.dv-graph-point,.dv-form-point')){event.preventDefault();chooseYear(+event.target.dataset.year,'keyboard');return;}
    const direction={ArrowRight:1,ArrowDown:1,PageDown:1,ArrowLeft:-1,ArrowUp:-1,PageUp:-1}[event.key];
    if(direction){event.preventDefault();step(direction,'keyboard');}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();chooseYear(event.key==='Home'?2015:2024,'keyboard');}
    else if(event.key===' '&&event.target===root){event.preventDefault();dismissHint();play();}
  }
  function showDialog(name) {pause();settle();q(name).showModal();}
  function click(event) {
    const yearButton=event.target.closest('.dv-years button[data-year], .dv-graph-point, .dv-form-point');
    if(yearButton&&root.contains(yearButton)){chooseYear(+yearButton.dataset.year,'click');return;}
    if(event.target.closest('[data-role="chart"]')&&view==='annual'&&!switchMotion&&!(progress>9&&progress<11)){
      chooseYear(hitYear(event),'click');return;
    }
    const button=event.target.closest('[data-action]');if(!button)return;
    dismissHint();
    switch(button.dataset.action){
      case 'view-annual':setView('annual','click');break;
      case 'view-forms':setView('forms','click');break;
      case 'previous':step(-1,'click');break;
      case 'next':step(1,'click');break;
      case 'play':play();break;
      case 'flow':
        if(options.sharedFlow)root.dispatchEvent(new CustomEvent('decade:flow-toggle',{bubbles:true}));else flowLayer?.toggle();break;
      case 'inspect-product':
        if(suppressProductClick&&root.contains(button)){suppressProductClick=false;break;}
        inspectProduct(button.dataset.product);break;
      case 'data':
      case 'filters':showDialog('data-dialog');break;
      case 'close':button.closest('dialog').close();break;
      case 'table':q('data-dialog').close();showDialog('table-dialog');break;
      case 'back-data':q('table-dialog').close();showDialog('data-dialog');break;
      case 'export':exportCSV();break;
      case 'event-details':showEvent();break;
      case 'event-prev':eventIndex=Math.max(0,eventIndex-1);renderEvents();break;
      case 'event-next':eventIndex++;renderEvents();break;
    }
  }
  function touchstart(event){
    suppressProductClick=false;
    const product=event.target.closest('[data-action="inspect-product"]');
    const onControl=options.alignChapter?'dialog,select,input,textarea':'dialog,select,input,button,a';
    if(event.touches.length!==1||(!product&&event.target.closest(onControl))){touchStart=null;return;}
    pause();clearTimeout(settleTimer);settleTimer=null;
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY,lastY:event.touches[0].clientY,product:!!product,startProgress:targetProgress};
  }
  function touchmove(event){
    if(!touchStart||event.touches.length!==1)return;
    const point=event.touches[0],dx=touchStart.x-point.clientX,dy=touchStart.y-point.clientY;
    if(Math.abs(dy)<6||Math.abs(dx)>Math.abs(dy))return;
    if(options.alignChapter&&!event.cancelable){touchStart=null;return;}
    event.preventDefault();
    if(options.alignChapter&&!touchStart.aligned){
      touchStart.aligned=true;
      if(document.activeElement===root)root.blur();
      if(Math.abs(root.getBoundingClientRect().top)>2){
        root.scrollIntoView({behavior:'instant',block:'start'});
        // Finish arriving at the chart before a later swipe can leave it.
        touchStart.startProgress=null;
      }
    }
    if(touchStart.product)suppressProductClick=true;
    const direction=Math.sign(touchStart.lastY-point.clientY);
    const beforeFirstYear=direction<0&&targetProgress<=chapterStart;
    const afterLastYear=direction>0&&targetProgress>=chapterEnd;
    const adjacentChapter=(beforeFirstYear&&dy<0)||(productTarget&&afterLastYear&&dy>0);
    const startedAtBoundary=!options.progressiveColumns||touchStart.startProgress===(direction<0?chapterStart:chapterEnd);
    if((chapterView&&(beforeFirstYear||afterLastYear))||(linked&&options.releaseAtBoundary&&adjacentChapter&&startedAtBoundary)){
      touchStart.boundary=direction;touchStart.distance=Math.abs(touchStart.y-point.clientY);touchStart.lastY=point.clientY;return;
    }
    touchStart.boundary=null;
    scrub((touchStart.lastY-point.clientY)/160,'touch',false);
    touchStart.lastY=point.clientY;
  }
  function touchend(event){if(touchStart){const previous=touchStart;touchStart=null;settle();if(event?.type!=='touchcancel'&&previous.boundary&&previous.distance>=50)root.dispatchEvent(new CustomEvent('decade:boundary',{bubbles:true,detail:{direction:previous.boundary,year:selected,view,origin:'touch'}}));}}
  function exportCSV() {
    const f=filters();
    const series=!linked&&view==='annual'?[{term:f.term,values:data}]:formSeries;
    const csv='Data_mode,Year,Term,Unit,Reporter.type,Source,Quantity,Data_rows\r\n'+series.flatMap(({term,values})=>values.map(d=>[q('provenance').hidden?'IMPORTED':'CITES_OFFICIAL_EXTRACT',d.year,term,'kg',f.reporter,f.source,d.value===null?'':d.value,d.rows.length].join(','))).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`${demo?'DEMO-':''}Sphyrna-lewini-2015-2024.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function setData(raw) {
    if(destroyed)throw Error('This chapter has been destroyed.');
    pause();
    const parsed=D.normalize(raw);
    rows=parsed.rows;demo=false;
    const mode=q('mode');
    if(mode)mode.textContent='Imported data';
    q('bottom-note').textContent='Locally imported. Source and completeness require provider verification.';
    q('provenance').hidden=true;
    rebuild();root.dispatchEvent(new CustomEvent('decade:data-change',{bubbles:true,detail:{data:raw}}));return {retained:rows.length,excluded:parsed.excluded};
  }
  function setEvents(raw) {
    if(demo)throw Error('Import actual trade records before adding regulation events.');
    if(!Array.isArray(raw)||!raw.length)throw Error('A non-empty JSON array is required.');
    for(const [i,e] of raw.entries()) {
      if(!e||typeof e!=='object')throw Error(`Event ${i+1} must be an object.`);
      let validUrl=false;try{const url=new URL(e.url);validUrl=['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{}
      const validDate=typeof e.date==='string'&&/^20(1[5-9]|2[0-4])-\d{2}-\d{2}$/.test(e.date)&&Number.isFinite(Date.parse(e.date))&&new Date(e.date).toISOString().slice(0,10)===e.date;
      const contextDate=typeof e.date==='string'&&(/^(201[5-9]|202[0-4])$/.test(e.date)||validDate);
      const contextual=contextDate&&e.annotation_mode==='context_only'&&Array.isArray(e.years)&&e.years.length&&e.years.every(y=>Number.isInteger(y)&&y>=2015&&y<=2024)&&Array.isArray(e.products)&&e.products.length&&e.products.every(t=>['fins','fin (dried)','fin (wet)'].includes(t))&&Array.isArray(e.sources)&&e.sources.length&&e.sources.every(r=>{try{const u=new URL(r.url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}})&&typeof e.date==='string'&&/^(201[5-9]|202[0-4])(-\d{2}-\d{2})?$/.test(e.date)&&typeof e.type==='string'&&e.type.trim()&&(!e.source_codes||Array.isArray(e.source_codes));
      if(e.verified!==true||e.taxon!==D.TAXON||(!contextual&&(!validUrl||!validDate||!['review','restriction'].includes(e.type)||!['fins','fin (dried)','fin (wet)'].includes(e.term)||e.unit!=='kg'||!['E','I'].includes(e.reporter)||!['all','W'].includes(e.source)))||typeof e.title!=='string'||!e.title.trim()||typeof e.scope!=='string'||!e.scope.trim())throw Error(`Event ${i+1} requires a valid date, original document and matching scope. See the project README.`);
    }
    events=raw.map(e=>({...e}));eventIndex=0;rebuild();
    root.dispatchEvent(new CustomEvent('decade:events-change',{bubbles:true,detail:{events:raw}}));
  }
  function setFilters(next={}){
    for(const [name,allowed] of [['term',terms],['reporter',['E','I']],['source',['all','W']]]){
      if(next[name]!==undefined&&!allowed.includes(next[name]))throw Error(`Invalid ${name} filter.`);
    }
    pause();for(const name of ['term','reporter','source'])if(next[name]!==undefined)q(name).value=next[name];
    const onlyProduct=linked&&next.term!==undefined&&next.reporter===undefined&&next.source===undefined;
    eventIndex=0;rebuild(onlyProduct);
    root.dispatchEvent(new CustomEvent('decade:filters-change',{bubbles:true,detail:{filters:filters()}}));
  }
  async function change(event) {
    const role=event.target.dataset.role;
    if(role==='product-year'){chooseYear(event.target.value,'click');return;}
    if(['term','reporter','source'].includes(role)){pause();eventIndex=0;rebuild();root.dispatchEvent(new CustomEvent('decade:filters-change',{bubbles:true,detail:{filters:filters()}}));return;}
    if(!['csv-input','events-input'].includes(role))return;
    const file=event.target.files[0];if(!file)return;
    try{
      if(role==='csv-input'){
        if(file.size>40*1024*1024)throw Error('Filter to this species first. CSV files must be smaller than 40 MB.');
        const parsed=D.parseCSV(await file.text());
        if(destroyed)return;
        const result=setData(parsed);
        q('feedback').textContent=`Loaded ${result.retained} records; excluded ${result.excluded} records outside this view’s scope.`;
      }else{
        if(file.size>1024*1024)throw Error('Event files must be smaller than 1 MB.');
        const parsed=JSON.parse(await file.text());if(destroyed)return;
        setEvents(parsed);q('feedback').textContent=`Loaded ${events.length} events marked as verified by the provider. Original documents have not been independently verified.`;
      }
    }catch(error){if(!destroyed)q('feedback').textContent=`Import failed: ${error.message}`;}
    event.target.value='';
  }
  function pointerdown(event){if(event.pointerType==='touch')return;suppressProductClick=false;if(!event.target.closest('button,a,select,input,dialog,[role="button"]'))root.focus({preventScroll:true});}
  function visibility(){if(document.hidden){pause();settle();}}
  const resizeObserver=new ResizeObserver(()=>{if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;if(!destroyed)rebuild();});});
  if(linked)reduced.addEventListener('change',cancelLinkedYearAnimation);
  productTarget?.addEventListener('click',click);
  productTarget?.addEventListener('change',change);
  productTarget?.addEventListener('pointermove',previewMove,{passive:true});
  if(productTimeline){
    productTarget.addEventListener('wheel',wheel,{passive:false,signal:productTimeline.signal});
    productTarget.addEventListener('keydown',keydown,{signal:productTimeline.signal});
  }
  root.addEventListener('wheel',wheel,{passive:false});root.addEventListener('keydown',keydown);root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('touchstart',touchstart,{passive:true});root.addEventListener('touchmove',touchmove,{passive:false});root.addEventListener('touchend',touchend,{passive:true});root.addEventListener('touchcancel',touchend,{passive:true});root.addEventListener('pointerdown',pointerdown);root.addEventListener('pointermove',previewMove,{passive:true});root.addEventListener('pointerleave',hideInspect);root.addEventListener('focusin',previewFocus);root.addEventListener('focusout',hideInspect);document.addEventListener('visibilitychange',visibility);resizeObserver.observe(root);resizeObserver.observe(q('chart'));
  const detachAtmosphere=options.sharedFlow?()=>{}:attachAtmosphere(root);
  const flowLayer=options.sharedFlow?null:global.MarineDecadeFlow?.attach(root);
  if(!flowLayer&&!options.sharedFlow)action('flow')?.setAttribute('hidden','');
  const api={
    setYear:year=>chooseYear(year,'api'),setView:next=>setView(next,'api'),setData,setEvents,setFilters,play,pause:()=>{pause();settle();},
    getState:()=>({year:selected,view,position,targetPosition,progress,targetProgress,transitioning:!!switchMotion||(progress>9&&progress<11),demo,filters:filters(),playing:playing!==null}),
    destroy(){if(destroyed)return;pause();destroyed=true;productTimeline?.abort();root.removeAttribute('aria-describedby');flowLayer?.destroy();detachAtmosphere();if(linked)reduced.removeEventListener('change',cancelLinkedYearAnimation);cancelLinkedYearAnimation();clearTimeout(settleTimer);if(motionFrame)cancelAnimationFrame(motionFrame);resizeObserver.disconnect();if(resizeFrame)cancelAnimationFrame(resizeFrame);root.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());root.removeEventListener('wheel',wheel);root.removeEventListener('keydown',keydown);root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('touchstart',touchstart);root.removeEventListener('touchmove',touchmove);root.removeEventListener('touchend',touchend);root.removeEventListener('touchcancel',touchend);root.removeEventListener('pointerdown',pointerdown);root.removeEventListener('pointermove',previewMove);root.removeEventListener('pointerleave',hideInspect);root.removeEventListener('focusin',previewFocus);root.removeEventListener('focusout',hideInspect);document.removeEventListener('visibilitychange',visibility);chapterHeading?.remove();productTarget?.removeEventListener('click',click);productTarget?.removeEventListener('change',change);productTarget?.removeEventListener('pointermove',previewMove);productChart?.remove();if(productYear)productYear.disabled=true;root.classList.remove('dv-trade-separated');root.innerHTML='';delete root._marineDecade;}
  };
  root._marineDecade=api;
  if(options.data)setData(options.data);else rebuild();
  if(options.events)setEvents(options.events);
  if(!linked&&(chapterView==='forms'||(!chapterView&&options.view==='forms'))){progress=targetProgress=11;renderMotion();}
  if(options.year)chooseYear(options.year,'api');
  mounted=true;
  return api;
}
global.MarineDecade=Object.freeze({mount});
})(window);
