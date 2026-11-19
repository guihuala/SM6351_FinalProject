const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
require('../dist/motion.js');const M=globalThis.MarineDecadeMotion;
for(const width of [260,343,800,1178]){
 assert.equal(M.nearestYear(-100,width),2015);assert.equal(M.nearestYear(width+100,width),2024);
 for(let i=0;i<10;i++)assert.equal(M.nearestYear(42+i/9*(width-64),width),2015+i);
}
const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
const touch=source.slice(source.indexOf('  function touchstart('),source.indexOf('  function exportCSV('));
const calls=[];const sandbox={clearTimeout(){},pause(){},settle(){calls.push('settle');},scrub:(...args)=>calls.push(args),root:{dispatchEvent:e=>calls.push(e.detail)},CustomEvent:class{constructor(_name,options){this.detail=options.detail;}}};
vm.runInNewContext(`let touchStart=null,suppressProductClick=false,settleTimer=null,chapterView=null,chapterStart=0,chapterEnd=20,targetProgress=0,selected=2015,view='annual',linked=false;const options={releaseAtBoundary:true};${touch};globalThis.test={touchstart,touchmove,touchend,suppressed:()=>suppressProductClick,chapter:(nextView,start,end,target)=>{chapterView=nextView;view=nextView;chapterStart=start;chapterEnd=end;targetProgress=target;selected=2015+target-start;},link:()=>{chapterView=null;targetProgress=chapterStart;linked=true;}};`,sandbox);
const t=sandbox.test,target={closest:()=>({})},event=(x,y)=>({target,touches:[{clientX:x,clientY:y}],preventDefault(){calls.push('prevent');}});
t.touchstart(event(100,100));t.touchmove(event(102,70));assert.equal(t.suppressed(),true);assert.equal(calls[0],'prevent');assert.ok(calls[1][0]>0);t.touchend();assert.equal(calls.at(-1),'settle');
calls.length=0;t.touchstart(event(100,100));t.touchend();assert.equal(t.suppressed(),false,'a tap on a product remains an activation');
calls.length=0;t.touchstart(event(100,100));t.touchmove(event(150,99));assert.equal(t.suppressed(),false);assert.equal(calls.length,0,'horizontal movement does not scrub years');
console.log('PASS: plot hit testing across widths and outside bounds; swiping product rows explores time without drilling in; taps remain actionable.');

calls.length=0;t.chapter('forms',11,20,11);t.touchstart(event(100,100));t.touchmove(event(100,165));t.touchend();assert.equal(calls.at(-1).direction,-1);assert.equal(calls.at(-1).origin,'touch');
calls.length=0;t.chapter('annual',0,9,9);t.touchstart(event(100,100));t.touchmove(event(100,35));t.touchend();assert.equal(calls.at(-1).direction,1);
console.log('PASS: boundary swipes navigate between independent chapters.');
calls.length=0;t.link();t.touchstart(event(100,100));t.touchmove(event(100,165));t.touchend();assert.equal(calls.at(-1).direction,-1);
calls.length=0;t.touchstart(event(100,100));t.touchmove(event(100,165));t.touchend({type:'touchcancel'});assert.equal(calls.at(-1),'settle');
console.log('PASS: the first year releases an upward swipe back to the introduction, and cancelled swipes stay put.');
