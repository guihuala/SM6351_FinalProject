const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const handlers=new Map();
const root={querySelector:()=>null,addEventListener:(name,fn)=>handlers.set(name,fn),scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}};
const tradeIntro={id:'trade-intro',querySelector:()=>null,addEventListener(){},scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}};
const products={id:'product-forms',querySelector:()=>null,scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}};
const api={pause(){this.paused=true;}};
let mountOptions,observed,visibility,productRoute;
const sandbox={
 window:{matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>handlers.set(name,fn)},
 location:{hash:'#product-forms'},
 history:{replaceState(_a,_b,hash){sandbox.location.hash=hash;},pushState(_a,_b,hash){sandbox.location.hash=hash;}},
 document:{getElementById:id=>({'annual-trade':root,'trade-intro':tradeIntro,'product-forms':productRoute})[id]},
 IntersectionObserver:class{constructor(fn){visibility=fn;}observe(element){observed=element;}},
 MarineDecade:{mount(element,options){assert.equal(element,root);mountOptions=options;return api;}}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/story.js'),'utf8'),sandbox);
assert.equal(mountOptions.linked,true);
assert.equal(mountOptions.year,2024);
assert.equal(mountOptions.releaseAtBoundary,true);
assert.equal(sandbox.window.decadeView,api);
assert.equal(sandbox.window.decadeChapters.annual,sandbox.window.decadeChapters.forms);
assert.equal(observed,root);
assert.equal(sandbox.location.hash,'#annual-trade');
assert.equal(root.scrolled,true);
assert.equal(root.focused,true);
visibility([{intersectionRatio:.8}]);assert.equal(api.paused,undefined);
visibility([{intersectionRatio:.2}]);assert.equal(api.paused,true);
handlers.get('decade:boundary')({detail:{origin:'touch',direction:-1},preventDefault(){}});
assert.equal(tradeIntro.scrolled,true);
assert.equal(tradeIntro.focused,true);
assert.equal(sandbox.location.hash,'#trade-intro');
productRoute=products;
sandbox.location.hash='#product-forms';
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/story.js'),'utf8'),sandbox);
assert.equal(mountOptions.productTarget,products);
assert.equal(sandbox.location.hash,'#product-forms');
assert.equal(products.scrolled,true);
assert.equal(products.focused,true);
sandbox.location.hash='#annual-trade';
handlers.get('decade:boundary')({detail:{origin:'touch',direction:1},preventDefault(){}});
assert.equal(sandbox.location.hash,'#product-forms');

const app=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
require('../dist/motion.js');
const choose=app.slice(app.indexOf('  function chooseYear('),app.indexOf('  function setView('));
const scrub=app.slice(app.indexOf('  function scrub('),app.indexOf('  function cancelSwitch('));
const bounded={
 M:globalThis.MarineDecadeMotion,hideInspect(){},pause(){},dismissHint(){},
 clearTimeout(){},cancelSwitch(){},settle(){},startMotion(){},
 q:()=>({textContent:''})
};
vm.runInNewContext(`let settleTimer=null,scrubDirection=1,motionOrigin='',targetProgress=8.9,progress=0,selected=2015,chapterStart=0,chapterEnd=9;
 const linked=true,destroyed=false,view='annual';
 function renderMotion(){selected=M.frame(progress).year;}
 ${choose}${scrub}
 globalThis.test={chooseYear,scrub,year:()=>selected,value:()=>targetProgress};
`,bounded);
bounded.test.chooseYear(2021,'click');
assert.equal(bounded.test.year(),2021,'direct selection commits the year immediately');
bounded.test.scrub(99,'wheel');assert.equal(bounded.test.value(),9);
bounded.test.scrub(-99,'wheel');assert.equal(bounded.test.value(),0);
console.log('PASS: one shared timeline; 2024 opens by default; old product link opens the combined view; direct selection commits immediately; playback pauses outside the view.');

const presentation=app.slice(app.indexOf('  function cancelLinkedYearAnimation('),app.indexOf('  function update(animate)'));
function node(){
  const classes=new Set();
  return {
    style:{}, attributes:{}, classList:{
      contains:name=>classes.has(name),
      toggle:(name,on)=>on?classes.add(name):classes.delete(name)
    },
    setAttribute(name,value){this.attributes[name]=value;},
    removeAttribute(name){delete this.attributes[name];}
  };
}
const heading=node(),indicator=node(),column=node(),animations=[];
heading.animate=(frames,options)=>{
  const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};
  animations.push(animation);
  return animation;
};
const product=name=>({name,row:node(),fill:node(),zero:node(),value:node()});
const geometry=product('Fins'),dried=product('Dried fins');
geometry.row.dataset={product:'fins'};
dried.row.dataset={product:'fin (dried)'};
const quantity=node(),unit=node(),label=node(),scale=node(),bars=node();
quantity.parentElement={animate:heading.animate};
const roles={'forms-year':heading,quantity,'quantity-unit':unit,'amount-label':label,'forms-scale-max':scale,'product-bars':bars};
const annual=[10,35,null,0,40].map(value=>({value}));
const reduced={matches:false};
const productYear={};
const stage={
  root:{dataset:{}}, reduced, productYear, chartX:index=>50+index*22,
  q:name=>name==='forms-year'?null:roles[name]??{querySelector:selector=>selector==='.dv-year-indicator'?indicator:column},
  D:{fmt:String}, data:annual, filters:()=>({term:'fins'}), productName:()=>'Unspecified fins (FIN)', formGeometry:[geometry,dried],
  formSeries:[{values:annual},{values:[40,40,10,10,null].map(value=>({value}))}]
};
vm.runInNewContext(`
  const linked=true,productTarget={},linkedYearAnimations=[];
  let selected=2015,linkedFormsCeiling=0;
  ${presentation}
  globalThis.select=year=>{const previous=selected;selected=year;updateLinkedYear(previous);};
`,stage);
stage.select(2015);
assert.equal(animations.length,0,'initial presentation is static');
stage.select(2016);
assert.equal(animations.length,1,'selection animates the annual amount');
assert.equal(productYear.value,'2016');
assert.equal(geometry.row.attributes['aria-pressed'],'true');
assert.equal(dried.row.attributes['aria-pressed'],'false');
assert.equal(indicator.style.transform,'translateX(72px)');
assert.equal(label.textContent,'2016 · Unspecified fins (FIN)');
assert.equal(quantity.textContent,'35');
assert.equal(unit.hidden,false);
assert.equal(scale.textContent,'40 kg');
assert.equal(geometry.fill.style.width,'87.5%');
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),true);
assert.equal(dried.fill.style.width,'100%');
stage.select(2017);
assert.equal(animations[0].cancelled,true,'rapid navigation cancels the previous label animation');
assert.equal(quantity.textContent,'No records');
assert.equal(unit.hidden,true);
assert.equal(geometry.value.textContent,'No records');
assert.equal(scale.textContent,'10 kg');
assert.equal(dried.fill.classList.contains('dv-fill-moving'),false,'axis changes must not animate between scales');
assert.equal(bars.classList.contains('dv-scale-stable'),false);
stage.select(2018);
assert.equal(geometry.value.textContent,'0 kg');
assert.equal(geometry.zero.hidden,false);
assert.equal(geometry.fill.hidden,true,'zero has only its origin marker');
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),false,'missing data is not an interpolation endpoint');
reduced.matches=true;
stage.select(2019);
assert.equal(geometry.value.textContent,'40 kg');
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),false);
assert.equal(animations.length,3);
assert.equal(animations.at(-1).cancelled,true);
console.log('PASS: linked summary, shared product scale, immediate year selection, and separate missing and zero states.');
