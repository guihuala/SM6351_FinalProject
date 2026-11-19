// One local GSAP core serves the official text components and chapter motion.
export async function setupChapterMotion() {
  let effects;
  document.documentElement.dataset.readyEffects = 'loading';
  try { effects = await import('./ready-effects.js?v=20261119-copy1'); }
  catch(error) { document.documentElement.dataset.readyEffects='fallback';console.warn('Decorative effects are unavailable:',error);return; }
  const {gsap,ScrollTrigger,mountReadyLight,mountReadyText,mountReadyHeadings} = effects;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.dataset.readyEffects = 'loading';
  let media, water, closingText, headings, motionEnabled;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lightContainer = document.querySelector('#ready-light');
  const textContainer = document.querySelector('#closing-title');
  const updateLight = () => {
    const active = !document.body.classList.contains('motion-off') && !reduced.matches;
    water?.setDepth(Number(document.documentElement.style.getPropertyValue('--ocean-depth')) || 0);
    water?.setPaletteMix(...['vu','en','cr'].map(key=>Number(document.documentElement.style.getPropertyValue(`--ambient-${key}`))||0));
    water?.setActive(active);
    closingText?.setActive(active);
    headings?.setActive(active);
  };
  if(lightContainer) water=mountReadyLight(lightContainer);
  if(textContainer) closingText=mountReadyText(textContainer);
  headings=mountReadyHeadings(document.querySelectorAll('#hero-title,#wider-title,.risk-zone .zone-title,.product-story-title,#product-connections-title,#comparison-title,#trade-title'));
  updateLight();
  document.documentElement.dataset.readyEffects = 'ready';
  new MutationObserver(updateLight).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
  function sync() {
    updateLight();
    const enabled=!document.body.classList.contains('motion-off')&&!reduced.matches;
    if(enabled===motionEnabled)return;
    motionEnabled=enabled;
    media?.revert();
    media = null;
    if (!enabled) return;
    media = gsap.matchMedia();
    media.add({desktop:'(min-width: 701px)', mobile:'(max-width: 700px)'}, context => {
      const desktop = context.conditions.desktop;
      document.querySelectorAll('.data-stop, .annual-chart').forEach(node => {
        gsap.fromTo(node, {y:desktop?26:15, opacity:.38}, {
          y:0, opacity:1, ease:'none',
          scrollTrigger:{trigger:node, start:'top 94%', end:'top 68%', scrub:.55, invalidateOnRefresh:true}
        });
      });
      document.querySelectorAll('.risk-zone .specimen').forEach((node,index) => {
        const distance = desktop ? (index % 3 === 0 ? 36 : 22) : 12;
        gsap.fromTo(node, {y:distance}, {
          y:-distance, ease:'none',
          scrollTrigger:{trigger:node, start:'top bottom', end:'bottom top', scrub:.8, invalidateOnRefresh:true}
        });
      });
      document.querySelectorAll('.product-story').forEach(section => {
        const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top 84%',end:'top 25%',scrub:.65,invalidateOnRefresh:true}});
        timeline.fromTo(section.querySelector('.product-good'),{autoAlpha:.06,y:desktop?25:14,filter:'blur(7px)'},{autoAlpha:1,y:0,filter:'blur(0px)',duration:.65,ease:'power1.out'},0);
        timeline.fromTo(section.querySelector('.product-material'),{autoAlpha:0},{autoAlpha:1,duration:.5,ease:'none'},.2);
        timeline.fromTo(section.querySelector('.product-life'),{autoAlpha:.08,x:desktop?24:10,filter:'blur(6px)'},{autoAlpha:1,x:0,filter:'blur(0px)',duration:.7,ease:'power1.out'},.3);
      });
    });
  }
  sync();
  document.addEventListener('marine:host-enter', () => {
    sync();
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      if(document.body.classList.contains('motion-off') || reduced.matches)return;
      ScrollTrigger.refresh();
      headings?.replay();closingText?.replay();
    }));
  });
  new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['class']});
  reduced.addEventListener('change',sync);
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
