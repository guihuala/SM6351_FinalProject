// One local GSAP core serves the official text components and chapter motion.
export async function setupChapterMotion() {
  let effects;
  document.documentElement.dataset.readyEffects = 'loading';
  try { effects = await import('./ready-effects.js?v=20261123-scroll2'); }
  catch(error) { document.documentElement.dataset.readyEffects='fallback';console.warn('Decorative effects are unavailable:',error);return; }
  const {gsap,ScrollTrigger,mountReadyLight,mountReadyText,mountReadyHeadings} = effects;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.dataset.readyEffects = 'loading';
  let media, water, closingText, headings, motionEnabled;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lightContainer = document.querySelector('#ready-light');
  const textContainer = document.querySelector('#closing-title');
  const oceanStyle=document.querySelector('.ocean').style;
  let visual={
    depth:Number(oceanStyle.getPropertyValue('--ocean-depth'))||0,
    mix:['vu','en','cr'].map(key=>Number(oceanStyle.getPropertyValue(`--ambient-${key}`))||0)
  };
  let appliedDepth=null,appliedMix=null,appliedActive=null;
  const updateLight = () => {
    const active = !document.body.classList.contains('motion-off') && !reduced.matches;
    if(appliedDepth!==visual.depth){water?.setDepth(visual.depth);appliedDepth=visual.depth;}
    if(!appliedMix||visual.mix.some((value,index)=>value!==appliedMix[index])){
      water?.setPaletteMix(...visual.mix);appliedMix=visual.mix.slice();
    }
    if(appliedActive!==active){
      water?.setActive(active);closingText?.setActive(active);headings?.setActive(active);
      appliedActive=active;
    }
  };
  if(lightContainer) water=mountReadyLight(lightContainer);
  if(textContainer) closingText=mountReadyText(textContainer);
  headings=mountReadyHeadings(document.querySelectorAll('#hero-title,#wider-title,.risk-zone .zone-title,.product-story-title,#product-connections-title,#comparison-title,#trade-title'));
  updateLight();
  document.documentElement.dataset.readyEffects = 'ready';
  document.addEventListener('marine:visual-update',event=>{
    const next=event.detail;
    if(!next||!Number.isFinite(next.depth)||!Array.isArray(next.mix)||next.mix.length!==3||!next.mix.every(Number.isFinite))return;
    visual=next;
    updateLight();
  });
  function sync() {
    updateLight();
    const enabled=!document.body.classList.contains('motion-disabled')&&!reduced.matches;
    if(enabled===motionEnabled)return;
    // Prepare the effects on first entry and keep their measurements on exit.
    if(enabled&&document.body.classList.contains('motion-off'))return;
    motionEnabled=enabled;
    media?.revert();
    media = null;
    if (!enabled) return;
    media = gsap.matchMedia();
    media.add({desktop:'(min-width: 701px)', mobile:'(max-width: 700px)'}, context => {
      const desktop = context.conditions.desktop;
      document.querySelectorAll('.data-stop, .annual-chart').forEach(node => {
        gsap.fromTo(node, {y:desktop?18:10, opacity:.38}, {
          y:0, opacity:1, ease:'none',
          scrollTrigger:{trigger:node, start:'top 94%', end:'top 68%', scrub:.16, invalidateOnRefresh:true}
        });
      });
      document.querySelectorAll('.risk-zone .specimen').forEach((node,index) => {
        const distance = desktop ? (index % 3 === 0 ? 24 : 16) : 8;
        gsap.fromTo(node, {y:distance}, {
          y:-distance, ease:'none',
          scrollTrigger:{trigger:node, start:'top bottom', end:'bottom top', scrub:.22, invalidateOnRefresh:true}
        });
      });
      document.querySelectorAll('.product-story').forEach(section => {
        const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top 84%',end:'top 25%',scrub:.18,invalidateOnRefresh:true}});
        // Keep the large cutouts on transform/opacity layers. Text retains its
        // separate repeatable BlurText reveal; images need no live blur pass.
        timeline.fromTo(section.querySelector('.product-good'),{autoAlpha:.06,y:desktop?18:10},{autoAlpha:1,y:0,duration:.65,ease:'power1.out'},0);
        timeline.fromTo(section.querySelector('.product-material'),{autoAlpha:0},{autoAlpha:1,duration:.5,ease:'none'},.2);
        timeline.fromTo(section.querySelector('.product-life'),{autoAlpha:.08,x:desktop?16:8},{autoAlpha:1,x:0,duration:.7,ease:'power1.out'},.3);
      });
    });
  }
  sync();
  document.addEventListener('marine:host-enter', () => {
    sync();
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      if(document.body.classList.contains('motion-off') || reduced.matches)return;
      headings?.replay();closingText?.replay();
    }));
  });
  new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['class']});
  reduced.addEventListener('change',sync);
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
