const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const story=fs.readFileSync(path.join(__dirname,'../dist/story.js'),'utf8');

function mountStory({hasProducts=true,hash='' }={}){
  const handlers=new Map(),frames=new Map();
  let scrollY=0,frameId=0,mountOptions;
  const api={
    year:2015,changes:[],
    getState(){return {year:this.year};},
    setYear(year){this.year=year;this.changes.push(year);}
  };
  function scene(id,top){
    return {
      id,top,offsetHeight:800,style:{setProperty(){}},querySelector:()=>null,
      before(track){track.top=top;},
      contains(element){return element===this;},
      addEventListener(name,fn){handlers.set(id+':'+name,fn);},
      scrollIntoView(){scrollY=top;},
      focus(){sandbox.document.activeElement=this;}
    };
  }
  const intro=scene('trade-intro',0),root=scene('annual-trade',1000);
  const products=hasProducts?scene('product-forms',5800):null,finale=scene('finale',10600);
  const sandbox={
    window:{
      innerHeight:800,matchMedia:()=>({matches:true}),
      addEventListener:(name,fn)=>handlers.set(name,fn),
      requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},
      scrollBy({top}){scrollY+=top;}
    },
    location:{hash},
    history:{replaceState(_a,_b,hash){sandbox.location.hash=hash;},pushState(_a,_b,hash){sandbox.location.hash=hash;}},
    document:{
      getElementById:id=>[intro,root,products,finale].find(element=>element?.id===id),
      createElement:()=>({
        append(){},
        getBoundingClientRect(){return {top:this.top-scrollY,bottom:this.top-scrollY+4800,height:4800};},
        scrollIntoView({block}){scrollY=this.top+(block==='end'?4000:0);}
      })
    },
    ResizeObserver:class{observe(){}},
    MarineDecade:{mount(element,options){assert.equal(element,root);mountOptions=options;return api;}}
  };
  vm.runInNewContext(story,sandbox);
  function scrollTo(top=scrollY){
    scrollY=top;
    handlers.get('scroll')();
    const pending=[...frames.values()];
    frames.clear();
    pending.forEach(fn=>fn());
  }
  const dispatch=(name,detail)=>handlers.get('annual-trade:'+name)({detail,preventDefault(){}});
  return {sandbox,root,products,finale,api,mountOptions,scrollTo,dispatch};
}

const fallback=mountStory({hasProducts:false,hash:'#product-forms'});
assert.equal(fallback.sandbox.location.hash,'#annual-trade');
assert.equal(fallback.sandbox.document.activeElement,fallback.root);

const {sandbox,root,products,finale,api,mountOptions,scrollTo,dispatch}=mountStory();
assert.equal(mountOptions.linked,true);
assert.equal(mountOptions.annualFinTotal,true);
assert.equal(mountOptions.progressiveColumns,true);
assert.equal(mountOptions.progressiveForms,true);
assert.equal(mountOptions.pageScrollTimeline,true);
assert.equal(mountOptions.productTarget,products);
assert.equal(sandbox.window.decadeChapters.annual,sandbox.window.decadeChapters.forms);

const years=Array.from({length:10},(_,index)=>2015+index);
function scrollYears(scene,sequence){
  for(const year of sequence){
    scrollTo(scene.top+(year-2015)*400+200);
    assert.equal(api.year,year,scene.id+' at '+year);
  }
}
scrollYears(root,years);
scrollYears(products,years);
scrollTo(finale.top);
scrollYears(products,[...years].reverse());
scrollYears(root,[...years].reverse());
scrollTo(root.top+200);
api.setYear(2020);
dispatch('decade:year-change',{year:2020,origin:'click'});
scrollTo();
assert.equal(api.year,2020,'manual selection moves to its scroll position');
scrollTo(root.top+2600);
assert.equal(api.year,2021,'scrolling continues from the manually selected year');
scrollTo(root.top+3800);
dispatch('decade:boundary',{year:2024,direction:1,origin:'keyboard'});
scrollTo();
assert.equal(sandbox.document.activeElement,products);
assert.equal(api.year,2015,'forward navigation starts the next chart from 2015');
dispatch('decade:boundary',{year:2015,direction:-1,origin:'keyboard'});
scrollTo();
assert.equal(sandbox.document.activeElement,root);
assert.equal(api.year,2024,'backward navigation returns to the last year of the previous chart');
console.log('PASS: both charts show each year in both directions and manual year controls stay synchronized.');

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
console.log('PASS: direct year selection and timeline bounds.');

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
const futureColumns=[2016,2017,2018,2019].map(year=>{
  const point=node();
  point.dataset={year};
  point.setAttribute('data-unrevealed','');
  return point;
});
const stage={
  root:{dataset:{}}, reduced, productYear, chartX:index=>50+index*22,
  q:name=>name==='forms-year'?null:roles[name]??{
    querySelector:selector=>selector==='.dv-year-indicator'?indicator:column,
    querySelectorAll:()=>futureColumns.filter(point=>'data-unrevealed' in point.attributes)
  },
  D:{fmt:String}, data:annual, filters:()=>({term:'fins'}), annualName:()=>'Unspecified fins (FIN)', formGeometry:[geometry,dried],
  formSeries:[{values:annual},{values:[40,40,10,10,null].map(value=>({value}))}]
};
vm.runInNewContext(`
  const linked=true,annualFinTotal=false,progressiveColumns=true,productTarget={},linkedYearAnimations=[],options={};
  let selected=2015,linkedFormsCeiling=0,revealedThrough=2015;
  ${presentation}
  globalThis.select=year=>{const previous=selected;selected=year;updateLinkedYear(previous);};
`,stage);
stage.select(2015);
assert.equal(animations.length,0,'initial presentation is static');
assert.equal(futureColumns.filter(point=>'data-unrevealed' in point.attributes).length,4);
stage.select(2016);
assert.equal('data-unrevealed' in futureColumns[0].attributes,false);
assert.equal('data-unrevealed' in futureColumns[1].attributes,true);
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
stage.select(2015);
assert.equal(futureColumns.some(point=>'data-unrevealed' in point.attributes),false,'revisiting a year keeps the explored bars visible');
console.log('PASS: linked summary, shared product scale, immediate year selection, and separate missing and zero states.');
