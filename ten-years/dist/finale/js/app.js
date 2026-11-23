import {autoUpdate, computePosition, flip, offset, shift} from '../vendor/floating-ui.dom.js';
import {setupChapterMotion} from './motion.js?v=20261123-scroll2';
import {PRODUCT_CASES, productForRisk, productByID, validateProductCases, productStoryHTML, productConnectionsHTML, productPreviewHTML, productSourceCreditsHTML} from './product-stories.js?v=20261119-copy1';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => new Intl.NumberFormat('en').format(value);
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const slug = {VU:'vulnerable', EN:'endangered', CR:'critically-endangered'};
const riskColors = {VU:'#d5b877', EN:'#c98963', CR:'#d9746b'};
const riskRamps = {VU:[[8,20,30],[139,110,43],[213,184,120]],EN:[[11,19,29],[155,101,66],[220,179,155]],CR:[[14,18,29],[171,89,83],[233,173,168]]};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const embedded = Boolean(globalThis.__MARINE_EMBEDDED) || (window.parent !== window && new URLSearchParams(location.search).get('integrated') === '1');
const state = {data:null, images:[], speciesByID:new Map(), imageByName:new Map(), classStats:new Map(), groupStats:new Map(), trade:false, motion:!reducedMotion.matches, hostActive:!embedded || Boolean(globalThis.__MARINE_HOST_ACTIVE), extra:{}, limit:100, activeRisk:null};
let shark = null, framePending = false, statusTimer;
let popoverAnchor=null, popoverCleanup=null, popoverPositionVersion=0;
let scrollNodes=null, controlledShark=null, sharkProgress=null, sharkActive=null;

function setStyleProperty(node,name,value) {
  const text=String(value);
  if(node.style.getPropertyValue(name)!==text)node.style.setProperty(name,text);
}

function setAttributeValue(node,name,value) {
  const text=String(value);
  if(node.getAttribute(name)!==text)node.setAttribute(name,text);
}

function setClassValue(node,name,value) {
  const enabled=Boolean(value);
  if(node.classList.contains(name)!==enabled)node.classList.toggle(name,enabled);
}

function prepareSharkControl() {
  if(!shark)return false;
  if(controlledShark!==shark){controlledShark=shark;sharkProgress=null;sharkActive=null;}
  return true;
}

function setSharkProgress(value) {
  if(!prepareSharkControl()||sharkProgress===value)return;
  sharkProgress=value;shark.setProgress(value);
}

function setSharkActive(value) {
  const next=Boolean(value);
  if(!prepareSharkControl()||sharkActive===next)return;
  sharkActive=next;shark.setActive(next);
}

function getScrollNodes() {
  if(!scrollNodes)scrollNodes={
    ocean:$('.ocean'),progressBar:$('.page-progress'),
    hero:$('#surface'),preview:$('.hero .risk-strip'),zones:$$('.risk-zone'),
    nav:$('.risk-nav'),navLinks:$$('.risk-nav a[data-risk]'),epilogue:$('#epilogue')
  };
  return scrollNodes;
}

function riskChannels(value,risk,max=250) {
  const stops=riskRamps[risk],t=clamp(value/max),segment=t<.5?0:1;
  const [from,to]=[stops[segment],stops[segment+1]],position=segment===0?t*2:(t-.5)*2;
  return from.map((channel,i)=>Math.round(channel+(to[i]-channel)*position));
}

function riskCellStyle(value,risk,max=250) {
  const colour=riskChannels(value,risk,max);
  // Estimate the fixed translucent fill over the neutral glass before choosing ink.
  const channels=colour.map((channel,i)=>(channel*.83+[8,24,40][i]*.17)/255).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4);
  const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  return `--cell-color:rgba(${colour.join(',')},.83);--cell-ink:${luminance>.18?'#061622':'#f6fcff'};--cell-tint:${riskColors[risk]}`;
}

function renderColourKeys() {
  $$('.scale-swatches[data-scale],.heatmap-key>.scale-swatches').forEach(node=>{
    const max=Number(node.dataset.scale||160),key=node.closest('.heatmap-key');
    key.classList.add('risk-colour-key');
    key.innerHTML=`<span class="legend-description">Colour identifies risk · lighter shades show more entries</span><div class="risk-legend-items">${state.data.groups.map(group=>`<div class="risk-key-item"><span style="color:${riskColors[group.code]}">${escape(group.label)}</span><div class="scale-swatches" aria-hidden="true">${[0,.2,.4,.6,.8,1].map(t=>`<i style="background:rgba(${riskChannels(t*max,group.code,max).join(',')},.83)"></i>`).join('')}</div></div>`).join('')}</div><span class="scale-range">Shared count range: 0 — ${max}</span>`;
  });
}

function toast(message) {
  const node = $('#app-status'); node.textContent = message; node.classList.add('visible');
  clearTimeout(statusTimer); statusTimer = setTimeout(() => node.classList.remove('visible'), 3200);
}

function openDialog(id) {
  closePopover(false);
  const dialog = typeof id === 'string' ? document.getElementById(id) : id;
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
}

function setupDialogs() {
  $$('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.open)));
  $$('dialog').forEach(dialog => {
    $('[data-close]',dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); }});
    dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.style.overflow = ''; });
  });
}

function imageHTML(image, className = '', lazy = true) {
  if (!image) return '';
  const source = String(image.file || '').replace(/^\.\//,'');
  const sourceClip=String(image.suggestedCssClipPath||'');
  const clip=/^inset\([\d.% ]+\)$/.test(sourceClip)?` style="clip-path:${escape(sourceClip)}"`:'';
  return `<img class="${className}"${clip} src="./${escape(source)}" alt="${escape(image.commonName || image.scientificName)}${image.imageType === 'illustration' ? ' — illustration' : ''}" ${lazy?'loading="lazy"':'fetchpriority="high"'} decoding="async" width="${image.width||600}" height="${image.height||400}">`;
}

function specimenHTML(species, image, index, count, miniature = false) {
  const desktopLeft = miniature ? [2,37,70,14,52,74,34,4][index%8] : [5,57,24,61,2,48,20,66][index%8];
  const top = miniature ? [3,0,12,51,54,63,76,25][index%8] : 3 + index * (70 / Math.max(1,count-1));
  const mobileLeft = miniature ? [3,53,5,54,4,53][index%6] : [4,46,10,47,1,44,7,45][index%8];
  const mobileTop = miniature ? [1,6,33,39,65,72][index%6] : top;
  const wide = /Balaenoptera|Rhincodon|Dermochelys|Mobula|Dugong|Isurus|Sphyrna|Pristis|Glaucostegus/.test(species.scientificName);
  const classMode = image.displayMode === 'transparent' ? 'transparent' : image.displayMode === 'black' ? 'black' : 'photograph';
  const fullStyle = `left:${desktopLeft}%;top:${top}%;--mobile-left:${mobileLeft}%;--mobile-top:${mobileTop}%;--delay:-${index*1.8}s;${wide&&!miniature?'--specimen-wide:1;':''}`;
  const familiar = species.scientificName === 'Sphyrna lewini';
  return `<figure class="specimen image-mode-${classMode} ${species.tradeIdentified?'is-recorded':'is-other'} ${familiar?'familiar':''}" style="${fullStyle}" data-candidate-id="${escape(species.candidateID)}" data-recorded="${species.tradeIdentified}"><button aria-label="Explore ${escape(species.scientificName)}, ${escape(species.riskLabel)}" data-species="${escape(species.candidateID)}"><span class="specimen-art">${imageHTML(image)}</span><figcaption>${image.commonName?`<span class="specimen-common">${escape(image.commonName)}</span>`:''}<em>${escape(species.scientificName)}</em>${familiar?'<span class="familiar-label">The life we began with</span>':''}<span class="specimen-record">${species.tradeIdentified?'With CITES records':'No CITES match in this dataset'}</span></figcaption><span class="specimen-action" aria-hidden="true">↗</span></button></figure>`;
}

function specimensForGroup(group) {
  const available = state.images.map(image => ({image,species:state.data.species.find(s=>s.scientificName===image.scientificName)})).filter(pair=>pair.species?.risk===group.code);
  const visualOrder={VU:['Caretta caretta','Alopias vulpinus','Callorhinus ursinus','Dermochelys coriacea','Physeter macrocephalus','Lepidochelys olivacea'],EN:['Isurus oxyrinchus','Balaenoptera borealis','Cephalorhynchus hectori','Carcharhinus acronotus','Eubalaena japonica','Carcharhinus plumbeus'],CR:['Sphyrna lewini','Eretmochelys imbricata','Balaenoptera ricei','Phocoena sinus','Lepidochelys kempii','Eubalaena glacialis']};
  const order = new Map((visualOrder[group.code]||group.curatedNames).map((n,i)=>[n,i]));
  return available.sort((a,b)=>(order.get(a.species.scientificName)??99)-(order.get(b.species.scientificName)??99)).slice(0,8);
}

function buildTradeStatistics() {
  const rows=state.data.classMatrix.displayRows;
  const primaryClasses=new Set(rows.filter(row=>row.key!=='OTHER_CLASSES').map(row=>row.key));
  state.classStats.clear();state.groupStats.clear();
  for(const group of state.data.groups){
    const members=new Map(state.data.species.filter(species=>species.risk===group.code).map(species=>[String(species.candidateID),species]));
    const classes=new Map(rows.map(row=>[row.key,{total:0,recorded:0}]));
    let recorded=0;
    for(const species of members.values()){
      const key=primaryClasses.has(species.class)?species.class:'OTHER_CLASSES',counts=classes.get(key);
      counts.total+=1;
      if(species.tradeIdentified){counts.recorded+=1;recorded+=1;}
    }
    state.classStats.set(group.code,classes);
    state.groupStats.set(group.code,{total:members.size,recorded});
  }
}

function matrixHTML() {
  const groups=state.data.groups, rows=state.data.classMatrix.displayRows;
  return `<div class="matrix matrix-transposed" data-matrix-mode="identified" role="group" aria-label="Candidate entries with identified CITES records, 2015–2024: risk groups in rows and taxonomic classes in columns"><span class="matrix-corner"></span>${rows.map(row=>`<span class="matrix-column class-heading">${escape(row.label)}</span>`).join('')}${groups.map(group=>`<span class="matrix-risk-label" style="color:${riskColors[group.code]}">${escape(group.label)}</span>${rows.map(row=>{const counts=state.classStats.get(group.code).get(row.key),value=counts.recorded;return `<button class="matrix-cell" style="${riskCellStyle(value,group.code,180)}" data-count="${value}" data-candidate-total="${counts.total}" data-matrix-mode="identified" data-matrix-risk="${group.code}" data-matrix-class="${row.key}" title="${escape(group.label)} · ${escape(row.label)} · ${number(value)} of ${number(counts.total)} candidate entries with identified records" aria-label="${escape(row.label)}, ${escape(group.label)}: ${value} of ${counts.total} candidate entries have identified CITES records, 2015–2024. Explore recorded entries"></button>`;}).join('')}`).join('')}</div>`;
}

function compositionHTML(group) {
  const rows=state.data.classMatrix.displayRows,classes=state.classStats.get(group.code);
  return `<div class="composition-glass composition-trade"><div class="composition-summary"><span class="risk-badge" style="--risk:${riskColors[group.code]}">${escape(group.label)}</span><p>Study entries grouped by IUCN class. Each entry is counted once in this risk group.</p></div><div class="composition-legend" aria-label="Bar legend"><span class="candidate-key">All study entries</span><span class="recorded-key">With CITES records</span></div><div class="composition-head" aria-hidden="true"><span>Class</span><span class="composition-axis"><i>0</i><i>125</i><i>250 entries</i></span><span>With records</span><span>Study list</span></div><div class="composition-list" role="group" aria-label="${escape(group.label)}: all candidate entries compared with the subset having identified CITES records, by class">${rows.map(row=>{const counts=classes.get(row.key);return `<button class="composition-row" data-matrix-mode="identified" data-matrix-risk="${group.code}" data-matrix-class="${row.key}" data-recorded-count="${counts.recorded}" data-candidate-total="${counts.total}" aria-label="${escape(row.label)}, ${escape(group.label)}: ${counts.recorded} of ${counts.total} candidate entries have identified CITES records, 2015–2024. Explore recorded entries"><span class="composition-label">${escape(row.label)}</span><span class="composition-track composition-track-comparison" aria-hidden="true"><span class="composition-candidate-fill" style="width:${counts.total/250*100}%"></span><span class="composition-fill composition-record-fill" style="width:${counts.recorded/250*100}%"></span></span><span class="composition-count" style="${riskCellStyle(counts.recorded,group.code,180)}">${number(counts.recorded)}</span><span class="composition-share composition-candidates">${number(counts.total)}</span></button>`;}).join('')}</div></div>`;
}

function groupFinding(group) {
  const rows=state.data.classMatrix.displayRows,classes=state.classStats.get(group.code);
  const largest=rows.reduce((a,b)=>classes.get(b.key).recorded>classes.get(a.key).recorded?b:a);
  const count=classes.get(largest.key).recorded,total=state.groupStats.get(group.code).recorded;
  return {label:largest.label,count,total,heading:`${largest.label}: ${number(count)} of ${number(total)} entries with records.`};
}

function renderZones() {
  scrollNodes=null;
  $('#risk-zones').innerHTML = state.data.groups.map((group,index)=>{
    const finding=groupFinding(group), product=productForRisk(group.code), pairs=specimensForGroup(group).filter(pair=>pair.species.scientificName!==product.species),totals=state.groupStats.get(group.code);
    return `<section class="risk-zone" id="${slug[group.code]}" data-risk="${group.code}" aria-labelledby="title-${group.code}"><header class="zone-header"><p class="eyebrow">${String(index+1).padStart(2,'0')} / RISK GROUP</p><h2 class="zone-title" id="title-${group.code}">${escape(group.label)}</h2><p class="risk-description">${escape(group.riskDescription)}</p><p class="zone-count"><strong>${number(totals.recorded)} of ${number(totals.total)}</strong> entries in our study list have CITES records</p><p class="field-instruction">Select a species for details.</p></header><div class="specimen-field" style="--field-count:${pairs.length}" aria-label="A selection of ${escape(group.label.toLowerCase())} marine candidates">${pairs.map((p,i)=>specimenHTML(p.species,p.image,i,pairs.length)).join('')}</div>${productStoryHTML(group,state.imageByName)}<div class="data-stop"><div class="chart-heading"><div><span class="chart-kicker">STUDY ENTRIES BY ANIMAL GROUP</span><h3>${escape(finding.heading)}</h3></div><p>The neutral bar shows all study entries in each class. The coloured segment shows entries with CITES records. The count scale is 0–250 in all three chapters.</p></div>${compositionHTML(group)}<p class="chart-note">CITES Appendix I–III · 2015–2024. Includes commercial and non-commercial reports. Counts are study entries, not sales or animals. “Other classes” combines the remaining classes. Select a row to view entries with records.</p><div class="matrix-group-action"><button class="text-link" data-explore-risk="${group.code}">View ${number(totals.recorded)} entries with records <span aria-hidden="true">↗</span></button></div></div></section>`;
  }).join('');
  // The image layout changes position on small screens while preserving the same reading order.
  const mobileStyle=document.createElement('style');
  mobileStyle.textContent='@media(max-width:700px){.specimen{left:var(--mobile-left)!important;top:var(--mobile-top)!important}}';document.head.append(mobileStyle);
  // The entry transition accepts genuine transparent cutouts only. A photograph
  // must never appear as a floating rectangular patch in the shared sea.
  const companionNames=['Caretta caretta','Isurus oxyrinchus','Balaenoptera ricei'];
  const companions=companionNames.map(name=>state.imageByName.get(name)).filter(image=>image?.displayMode==='transparent');
  $('#hero-companions').innerHTML=companions.map(image=>imageHTML(image,'hero-companion',false)).join('');
  $('#risk-comparison').innerHTML=`<div class="matrix-glass">${matrixHTML()}</div><p class="matrix-scroll-hint">Swipe to compare all classes <span aria-hidden="true">&#8594;</span></p>`;
  $$('[data-matrix-risk]').forEach(cell=>cell.addEventListener('click',event=>showMatrixPreview(cell,event.detail===0)));
  $$('[data-explore-risk]').forEach(button=>button.addEventListener('click',()=>openCatalogue({risk:button.dataset.exploreRisk,trade:'identified'})));
}

function renderAnnual() {
  const years=state.data.years;
  const lastYear=years[years.length-1],lastCount=state.data.annualCoverage.total[years.length-1];
  $('.annual-chart .chart-heading h3').textContent=`${number(lastCount)} study entries appear in the ${lastYear} reports.`;
  $('#annual-heatmap').innerHTML=`<div class="annual-grid" role="group" aria-label="Annual counts of candidate entries with identified CITES records"><span class="annual-corner"></span>${years.map(y=>`<span class="year-label">${y}</span>`).join('')}${state.data.groups.map(g=>`<span class="annual-row-label" style="color:${riskColors[g.code]}">${escape(g.label)}</span>${state.data.annualCoverage[g.code].map((v,i)=>`<button class="annual-cell" style="${riskCellStyle(v,g.code,160)}" aria-label="${escape(g.label)}, ${years[i]}: ${v} distinct candidate entries with identified records. Explore entries" title="${g.label} · ${years[i]} · ${v} entries" data-annual-risk="${g.code}" data-annual-year="${years[i]}" data-count="${v}"></button>`).join('')}`).join('')}</div>`;
  $$('.annual-cell').forEach(cell=>cell.addEventListener('click',event=>showAnnualPreview(cell,event.detail===0)));
}

function closePopover(restoreFocus=false) {
  const anchor=popoverAnchor;
  ++popoverPositionVersion;
  popoverCleanup?.();popoverCleanup=null;
  $('#context-popover').hidden=true;
  if(anchor){anchor.setAttribute('aria-expanded','false');anchor.closest('.specimen')?.classList.remove('popover-active');}
  popoverAnchor=null;
  if(restoreFocus&&anchor?.isConnected)anchor.focus({preventScroll:true});
}

async function positionPopover() {
  const panel=$('#context-popover');
  if(panel.hidden||!popoverAnchor)return;
  if(!popoverAnchor.isConnected){closePopover(false);return;}
  const anchor=popoverAnchor, version=++popoverPositionVersion;
  const rect=anchor.getBoundingClientRect(), gap=16;
  if(rect.bottom<0||rect.top>innerHeight||rect.right<0||rect.left>innerWidth){closePopover(false);return;}
  const width=Math.min(innerWidth>700&&innerWidth<=1100?288:338,innerWidth-28);panel.style.width=`${width}px`;
  if(innerWidth<=700){
    // Small screens keep the concise floating panel above the risk navigation.
    const height=panel.getBoundingClientRect().height;
    panel.style.left=`${Math.round((innerWidth-width)/2)}px`;
    panel.style.top=`${Math.round(Math.max(gap,innerHeight-height-78))}px`;
    panel.style.visibility='visible';
    return;
  }
  try{
    const {x,y}=await computePosition(anchor,panel,{
      strategy:'fixed',placement:'right-start',
      middleware:[offset({mainAxis:18,crossAxis:Math.min(rect.height*.15,35)}),flip({padding:gap,fallbackPlacements:['left-start','bottom','top']}),shift({padding:gap,crossAxis:true})]
    });
    // A queued result must not reposition a newer or already-closed panel.
    if(version!==popoverPositionVersion||popoverAnchor!==anchor||panel.hidden)return;
    panel.style.left=`${Math.round(x)}px`;panel.style.top=`${Math.round(y)}px`;
    panel.style.visibility='visible';
  }catch(error){
    if(version!==popoverPositionVersion||popoverAnchor!==anchor||panel.hidden)return;
    closePopover(false);console.warn('Quick information positioning is unavailable:',error);
  }
}

function showPopover(anchor,html,keyboard=false) {
  closePopover(false);
  const panel=$('#context-popover');panel.innerHTML=`<button class="popover-close" data-popover-close aria-label="Close quick information">×</button>${html}`;
  panel.style.visibility='hidden';panel.style.left='0px';panel.style.top='0px';
  panel.hidden=false;popoverAnchor=anchor;
  anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-controls','context-popover');anchor.setAttribute('aria-haspopup','dialog');
  anchor.closest('.specimen')?.classList.add('popover-active');
  // Only the open panel observes scrolling, resizing, layout shifts and transforms.
  popoverCleanup=autoUpdate(anchor,panel,positionPopover,{animationFrame:!!anchor.closest('.specimen,.product-story')});
  if(panel.hidden){popoverCleanup();popoverCleanup=null;}
  if(keyboard)panel.focus({preventScroll:true});
}

function showSpeciesPreview(id,anchor,keyboard=false) {
  const s=state.speciesByID.get(String(id));if(!s)return;
  const image=state.imageByName.get(s.scientificName);
  const years=s.recordYears?.length||0;
  const status=s.tradeIdentified?`CITES records in ${years} of the 10 study years`:!s.joinEligible?'Matching unresolved':'No CITES match in this dataset';
  showPopover(anchor,`<p class="popover-eyebrow">SPECIES DETAILS</p><span class="risk-badge" style="--risk:${riskColors[s.risk]}">${escape(s.riskLabel)}</span><h3 id="popover-title">${escape(image?.commonName||s.scientificName)}</h3>${image?.commonName?`<p class="popover-scientific"><em>${escape(s.scientificName)}</em></p>`:''}<p class="popover-record ${s.tradeIdentified?'identified':''}">${escape(status)}</p><p class="popover-footnote">CITES Appendix I–III · 2015–2024</p><button class="popover-action" data-open-details="${escape(s.candidateID)}">Details &amp; sources <span aria-hidden="true">↗</span></button>`,keyboard);
}

function previewMatches(risk,classKey=null,year=null,identified=false) {
  const mainKeys=state.data.classMatrix.displayRows.filter(r=>r.key!=='OTHER_CLASSES').map(r=>r.key);
  const yi=year===null?-1:state.data.years.indexOf(year);
  const matches=state.data.species.filter(s=>s.risk===risk&&(!classKey||(classKey==='OTHER_CLASSES'?!mainKeys.includes(s.class):s.class===classKey))&&(!identified||s.tradeIdentified)&&(year===null||s.annualPresence?.[yi]));
  return [...new Map(matches.map(s=>[String(s.candidateID),s])).values()];
}

function showMatrixPreview(anchor,keyboard=false) {
  const risk=anchor.dataset.matrixRisk,classKey=anchor.dataset.matrixClass;
  const group=state.data.groups.find(g=>g.code===risk),row=state.data.classMatrix.displayRows.find(r=>r.key===classKey);
  const identified=anchor.dataset.matrixMode==='identified',allMatches=previewMatches(risk,classKey);
  const matches=identified?allMatches.filter(s=>s.tradeIdentified):allMatches;
  showPopover(anchor,`<p class="popover-eyebrow">${identified?'ENTRIES WITH CITES RECORDS':'STUDY ENTRIES IN THIS CLASS'}</p><span class="risk-badge" style="--risk:${riskColors[risk]}">${escape(group.label)}</span><h3 id="popover-title">${escape(row.label)}</h3><p class="popover-count">${number(matches.length)}<small>${identified?`of ${number(allMatches.length)} study entries appear in CITES reports`:'study entries'}</small></p><p class="popover-footnote">CITES Appendix I–III · 2015–2024 · all reported purposes</p><p class="popover-samples">${matches.length?matches.slice(0,3).map(s=>`<em>${escape(s.scientificName)}</em>`).join('<br>'):'No study entries in this class have a confirmed match in this dataset.'}${matches.length>3?'<br><span>and more…</span>':''}</p><button class="popover-action" data-popover-list-risk="${risk}" data-popover-list-class="${classKey}" data-popover-list-trade="${identified?'identified':''}">${identified?'View entries with records':'View study entries'} <span aria-hidden="true">↗</span></button>`,keyboard);
}

function showAnnualPreview(anchor,keyboard=false) {
  const risk=anchor.dataset.annualRisk,year=Number(anchor.dataset.annualYear),group=state.data.groups.find(g=>g.code===risk);
  const matches=previewMatches(risk,null,year,true);
  showPopover(anchor,`<p class="popover-eyebrow">CITES REPORTS · ${year}</p><span class="risk-badge" style="--risk:${riskColors[risk]}">${escape(group.label)}</span><h3 id="popover-title">The ${year} reports</h3><p class="popover-count">${number(matches.length)}<small>study entries with CITES records</small></p><p class="popover-footnote">An entry may appear in more than one year. Risk groups use IUCN 2026-1 throughout.</p><button class="popover-action" data-popover-list-risk="${risk}" data-popover-list-year="${year}">View entries for this year <span aria-hidden="true">↗</span></button>`,keyboard);
}

function showSpecies(id) {
  const s=state.speciesByID.get(String(id)); if(!s)return;
  const image=state.imageByName.get(s.scientificName);
  const coverage=s.tradeIdentified?'This entry appears in CITES Appendix I–III reports from 2015–2024.':s.joinEligible?'No record was matched in our 2015–2024 CITES dataset.':'The taxonomic match needs review, so records have not been assigned to this entry.';
  const presence=s.annualPresence||[];
  const years=state.data.years.filter((_,i)=>presence[i]);
  const anomaly=s.scientificName==='Hippocampus kuda'&&s.tradeTerms?.includes('raw corals');
  const terms=(s.tradeTerms||[]).filter(term=>!(anomaly&&term==='raw corals')).slice(0,12);
  const detail=$('#species-detail');
  detail.innerHTML=`<div class="detail-specimen-top">${imageHTML(image,'detail-image',false)}<div><span class="risk-badge" style="--risk:${riskColors[s.risk]}">${escape(s.riskLabel)}</span><h2>${escape(s.scientificName)}</h2>${image?.commonName?`<p class="detail-common">${escape(image.commonName)}${image.imageType==='illustration'?' · illustration':''}</p>`:''}</div></div><p class="detail-description">${escape(state.data.groups.find(g=>g.code===s.risk).riskDescription)}. Risk classification: IUCN 2026-1.</p><div class="detail-facts"><div><dt>Class</dt><dd>${escape(s.classLabel)}</dd></div><div><dt>Family</dt><dd>${escape(s.family)}</dd></div><div><dt>Years with CITES records</dt><dd>${s.tradeIdentified?`${years.length} of 10 years`:'Not identified'}</dd></div><div><dt>Name matching</dt><dd>${s.joinEligible?'Unambiguous name':'Needs review'}</dd></div></div><p class="detail-description">${coverage}</p>${terms.length?`<p class="detail-terms"><strong>Terms reported in the source records</strong><br>${terms.map(escape).join(' · ')}${(s.tradeTerms||[]).length>12?' · …':''}</p><p class="chart-note">Terms are preserved from reported records. They do not establish end uses, quantities, animals, or independent transactions.</p>`:''}${anomaly?'<p class="chart-note">Two “raw corals” line items in the seahorse records are flagged as a source anomaly. They are not interpreted as seahorse products.</p>':''}${!s.tradeIdentified?'<p class="chart-note">No identified record does not prove an absence of trade. This includes records that cannot be safely assigned to an IUCN candidate.</p>':''}<div class="detail-links"><a class="text-link" href="${escape(s.iucnUrl)}" target="_blank" rel="noopener">IUCN assessment ↗</a><a class="text-link" href="${escape(s.wormsUrl)}" target="_blank" rel="noopener">WoRMS identity ↗</a></div>${image?`<p class="chart-note">Image: ${escape(image.attribution)} · <a href="${escape(image.sourceUrl)}" target="_blank" rel="noopener">${escape(image.license)}</a>${image.imageType==='illustration'?' · scientific illustration':''}</p>`:''}`;
  openDialog('species-dialog');
}

function openCatalogue(options={}) {
  state.extra={classKey:options.classKey||null,year:options.year||null}; state.limit=100;
  $('#catalogue-risk').value=options.risk||''; $('#catalogue-trade').value=options.trade||''; $('#catalogue-search').value='';
  renderCatalogue();openDialog('catalogue-dialog');
}

function renderCatalogue() {
  const risk=$('#catalogue-risk').value, trade=$('#catalogue-trade').value, query=$('#catalogue-search').value.trim().toLowerCase();
  let list=[...state.speciesByID.values()].filter(s=>(!risk||s.risk===risk)&&(!trade||(trade==='identified'?s.tradeIdentified:!s.tradeIdentified))&&(!query||`${s.scientificName} ${s.family} ${s.classLabel}`.toLowerCase().includes(query)));
  if(state.extra.classKey){const key=state.extra.classKey;const mainKeys=state.data.classMatrix.displayRows.filter(r=>r.key!=='OTHER_CLASSES').map(r=>r.key);list=list.filter(s=>key==='OTHER_CLASSES'?!mainKeys.includes(s.class):s.class===key);}
  if(state.extra.year){const yearIndex=state.data.years.indexOf(state.extra.year);list=list.filter(s=>s.annualPresence?.[yearIndex]);}
  const context=[];
  if(state.extra.classKey)context.push(state.data.classMatrix.displayRows.find(r=>r.key===state.extra.classKey)?.label||state.extra.classKey);
  if(state.extra.year)context.push(`CITES reports from ${state.extra.year}`);
  $('#catalogue-context').innerHTML=context.length?`<span>${escape(context.join(' · '))}</span><button class="context-clear" id="clear-extra">Clear this focus</button>`:'';
  $('#clear-extra')?.addEventListener('click',()=>{state.extra={};state.limit=100;renderCatalogue();});
  $('#catalogue-count').textContent=`${number(list.length)} study ${list.length===1?'entry':'entries'}${list.length>state.limit?` · showing ${state.limit}`:''}`;
  $('#catalogue-results').innerHTML=list.length?list.slice(0,state.limit).map(s=>`<button class="catalogue-entry" data-species="${escape(s.candidateID)}"><span class="catalogue-name">${escape(s.scientificName)}<span class="catalogue-class">${escape(s.classLabel)}</span></span><span class="risk-badge" style="--risk:${riskColors[s.risk]}">${escape(s.riskLabel)}</span><span class="catalogue-coverage ${s.tradeIdentified?'recorded':''}">${s.tradeIdentified?'With CITES records':!s.joinEligible?'Matching unresolved':'No confirmed match'}</span></button>`).join('')+(list.length>state.limit?'<button class="load-more" id="load-more">Show 100 more entries ↓</button>':''):'<p class="empty-list">No entries match these filters. Try a broader search.</p>';
  $('#load-more')?.addEventListener('click',()=>{state.limit+=100;renderCatalogue();});
}

function renderCredits() {
  $('#image-credits').innerHTML=state.images.map(image=>`<div class="credit-entry"><em>${escape(image.scientificName)}</em>${image.imageType==='illustration'?' · illustration':''}<br>${escape(image.attribution)} · <a href="${escape(image.sourceUrl)}" target="_blank" rel="noopener">Original source</a> · <a href="${escape(image.licenseUrl||image.sourceUrl)}" target="_blank" rel="noopener">${escape(image.license)}</a></div>`).join('');
  $('#product-source-credits').innerHTML=productSourceCreditsHTML();
}

function updateMotion() {
  const enabled = state.motion && !reducedMotion.matches;
  const active = enabled && state.hostActive;
  setClassValue(document.body,'motion-disabled',!enabled);
  setClassValue(document.body,'motion-off',!active);
  const toggle=$('#motion-toggle'),label=$('.motion-label');
  setAttributeValue(toggle,'aria-pressed',state.motion);
  const text=state.motion?'Motion on':'Motion off';
  if(label.textContent!==text)label.textContent=text;
  setAttributeValue(toggle,'title',state.motion?'Pause background and specimen motion':'Resume background and specimen motion');
  if(shark)setSharkActive(active&&$('#surface').getBoundingClientRect().bottom>0&&!document.hidden);
}

function setHostActive(value) {
  const next=Boolean(value);
  if(next===state.hostActive)return;
  state.hostActive=next;
  updateMotion();requestScroll();
  if(next)document.dispatchEvent(new Event('marine:host-enter'));
}

function updateScroll() {
  framePending=false;
  const {ocean,progressBar,hero,preview,zones,nav,navLinks,epilogue}=getScrollNodes();
  const vh=innerHeight,y=scrollY;
  // Read the complete frame's geometry before changing inherited properties.
  // Reuse the zone rectangles for depth, palette, and navigation calculations.
  const heroRect=hero.getBoundingClientRect();
  const zoneRects=zones.map(zone=>zone.getBoundingClientRect());
  const epilogueTop=epilogue.getBoundingClientRect().top;
  const scrollRange=progressBar.hidden?1:Math.max(1,document.documentElement.scrollHeight-vh);
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
  const p=clamp(-heroRect.top/Math.max(1,heroRect.height-vh));
  const previewStep=clamp((p-.12)/.28);
  const previewReveal=previewStep*previewStep*(3-2*previewStep);
  let depth=0,ambience=[0,0,0],activeRisk,navAlpha=0;
  if(zones.length){
    const start=zoneRects[0].top+y,end=zoneRects[zoneRects.length-1].bottom+y;
    depth=clamp((y-start)/(end-start));
    const readingPosition=y+vh*.45;
    const enter=smooth((readingPosition-start+vh*.22)/(vh*.44));
    ambience=[enter,0,0];
    zoneRects.slice(1).forEach((rect,index)=>{
      const mix=smooth((readingPosition-(rect.top+y)+vh*.16)/(vh*.32));
      ambience[index]*=1-mix;ambience[index+1]=enter*mix;
    });
    const leave=1-smooth((readingPosition-end)/(vh*.85));
    ambience=ambience.map(value=>value*leave);
    const activeIndex=zoneRects.findIndex(rect=>rect.top<vh*.45&&rect.bottom>vh*.45);
    activeRisk=activeIndex<0?undefined:zones[activeIndex].dataset.risk;
    const fadeIn=clamp((y-(start-vh*.65))/Math.max(160,vh*.23));
    const fadeOut=smooth((epilogueTop-vh*.4)/(vh*.45));
    navAlpha=Math.min(fadeIn,fadeOut);
  }

  // Apply only changed values after all layout reads have completed.
  setStyleProperty(hero,'--hero-progress',p.toFixed(3));
  setStyleProperty(ocean,'--entry-ocean-alpha',(embedded?smooth(y/Math.max(1,vh*.85)):1).toFixed(3));
  if(preview){
    setStyleProperty(preview,'--risk-preview',previewReveal.toFixed(3));
    const visible=previewReveal>.01;
    if(preview.inert===visible)preview.inert=!visible;
    setAttributeValue(preview,'aria-hidden',!visible);
    setClassValue(preview,'is-revealed',visible);
  }
  setSharkProgress(p);
  setSharkActive(state.motion&&state.hostActive&&!reducedMotion.matches&&heroRect.bottom>0&&heroRect.top<vh&&!document.hidden);
  const roundedDepth=Number(depth.toFixed(3)),roundedMix=ambience.map(value=>Number(value.toFixed(3)));
  if(zones.length){
    setStyleProperty(ocean,'--ocean-depth',depth.toFixed(3));
    ['vu','en','cr'].forEach((key,index)=>setStyleProperty(ocean,`--ambient-${key}`,ambience[index].toFixed(3)));
    if(activeRisk!==state.activeRisk){
      state.activeRisk=activeRisk;
      navLinks.forEach(link=>{
        const selected=link.dataset.risk===activeRisk;
        setClassValue(link,'active',selected);
        if(selected)setAttributeValue(link,'aria-current','step');
        else if(link.hasAttribute('aria-current'))link.removeAttribute('aria-current');
      });
    }
    if(nav.hidden)nav.hidden=false;
    setStyleProperty(nav,'--nav-alpha',navAlpha.toFixed(3));
    const visible=navAlpha>.01;
    setClassValue(nav,'is-visible',visible);
    setAttributeValue(nav,'aria-hidden',!visible);
    if(nav.inert===visible)nav.inert=!visible;
  }
  if(!progressBar.hidden)setStyleProperty(progressBar,'--page-progress',clamp(y/scrollRange).toFixed(4));
  document.dispatchEvent(new CustomEvent('marine:visual-update',{
    detail:{depth:roundedDepth,mix:roundedMix}
  }));
}

function requestScroll() { if(!framePending){framePending=true;requestAnimationFrame(updateScroll);} }

async function init() {
  setupDialogs();
  $('#motion-toggle').addEventListener('click',()=>{state.motion=!state.motion;updateMotion();});
  reducedMotion.addEventListener('change',event=>{if(event.matches){state.motion=false;updateMotion();}});
  updateMotion();
  try{
    const [dataResponse,imageResponse]=await Promise.all([fetch('./data/marine-data.json'),fetch('./data/image-credits.json')]);
    if(!dataResponse.ok)throw new Error('The verified data could not be loaded.');
    state.data=await dataResponse.json();
    const creditData=imageResponse.ok?await imageResponse.json():{images:[]};state.images=creditData.images||[];
    state.speciesByID=new Map(state.data.species.map(s=>[String(s.candidateID),s]));state.imageByName=new Map(state.images.map(i=>[i.scientificName,i]));
    validateProductCases(state.data,state.imageByName);
    buildTradeStatistics();
    $('#pool-total').textContent=number(state.data.totals.candidateEntries);$('#trade-total').textContent=number(state.data.totals.tradeIdentifiedEntries);
    renderZones();renderAnnual();renderCredits();
    $('#product-connections-content').innerHTML=productConnectionsHTML(state.data);
    // Risk sections are inserted from local data. Align an incoming fragment
    // after that layout exists, before text entrance triggers measure it.
    const requestedSection=location.hash ? document.getElementById(location.hash.slice(1)) : null;
    requestedSection?.scrollIntoView({behavior:'instant',block:'start'});
    setupChapterMotion();
    renderColourKeys();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting)),{rootMargin:'120px 0px',threshold:0});
    $$('.specimen').forEach(specimen=>observer.observe(specimen));
    document.addEventListener('click',event=>{
      const close=event.target.closest('[data-popover-close]');if(close){closePopover(true);return;}
      const details=event.target.closest('[data-open-details]');if(details){showSpecies(details.dataset.openDetails);return;}
      const entries=event.target.closest('[data-popover-list-risk]');if(entries){openCatalogue({risk:entries.dataset.popoverListRisk,classKey:entries.dataset.popoverListClass,year:entries.dataset.popoverListYear?Number(entries.dataset.popoverListYear):null,trade:entries.dataset.popoverListTrade||(entries.dataset.popoverListYear?'identified':'')});return;}
      const productButton=event.target.closest('[data-product-preview]');
      if(productButton){
        const item=productByID(productButton.dataset.productPreview);
        if(!item)return;
        if(popoverAnchor===productButton)closePopover(false);
        else showPopover(productButton,productPreviewHTML(item,state.data.groups.find(group=>group.code===item.risk)),event.detail===0);
        return;
      }
      const button=event.target.closest('[data-species]');
      if(button){if(button.closest('dialog'))showSpecies(button.dataset.species);else if(popoverAnchor===button)closePopover(false);else showSpeciesPreview(button.dataset.species,button,event.detail===0);return;}
      if(!event.target.closest('#context-popover')&&!event.target.closest('[data-matrix-risk],[data-annual-risk]'))closePopover(false);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#context-popover').hidden){event.preventDefault();event.stopPropagation();closePopover(true);}},true);
    $('#explore-recorded').addEventListener('click',()=>openCatalogue({trade:'identified'}));
    ['catalogue-search','catalogue-risk','catalogue-trade'].forEach(id=>document.getElementById(id).addEventListener(id==='catalogue-search'?'input':'change',()=>{state.limit=100;renderCatalogue();}));
    document.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll,{passive:true});
    document.addEventListener('visibilitychange',()=>{updateMotion();requestScroll();});
    if(matchMedia('(pointer:fine)').matches)document.addEventListener('pointermove',event=>{if(state.motion&&state.hostActive)setStyleProperty(getScrollNodes().ocean,'--light-x',`${48+(event.clientX/innerWidth)*5}%`);},{passive:true});
    try{const module=await import('./shark.js?v=20261119-model-static1');shark=module.mountShark($('#shark-canvas'),{onReady:result=>{if(!result.ok){document.body.classList.add('no-model');const fallback=state.imageByName.get('Sphyrna lewini');if(fallback)$('#hero-companions').insertAdjacentHTML('beforeend',imageHTML(fallback,'model-fallback',false));}}});updateMotion();}catch(error){console.warn('The model is unavailable:',error);document.body.classList.add('no-model');}
    updateScroll();
    window.marineChapter={getState:()=>({version:'20261119-copy1',productExamples:PRODUCT_CASES.length,risk:state.activeRisk,tradeRevealed:state.trade,motion:state.motion,hostActive:state.hostActive,candidateEntries:state.data.totals.candidateEntries,tradeIdentifiedEntries:state.data.totals.tradeIdentifiedEntries}),showCatalogue:openCatalogue,setHostActive,setTradeRevealed:()=>{}};
    document.dispatchEvent(new Event('marine:ready'));
  }catch(error){console.error(error);$('#risk-zones').innerHTML='<p class="loading-copy">The local data could not load. Please open this chapter using the local preview link, then reload.</p>';toast('The verified chapter data could not be loaded.');}
}

init();
