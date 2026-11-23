const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const dir=path.resolve(__dirname,'../dist');const ctx={window:{},Intl};vm.createContext(ctx);
for(const file of ['data.js','data/cites-fins-2015-2024.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx);
const D=ctx.window.MarineDecadeData,bundle=ctx.window.MarineDecadeDataset;
assert.equal(bundle.records.length,194);assert.equal(bundle.metadata.retained_kg_comparative_rows,146);assert.equal(bundle.metadata.raw_comparative_rows,399);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'data',bundle.metadata.raw_file))).digest('hex'),bundle.metadata.raw_sha256);
assert.ok(bundle.records.every(r=>r.Taxon==='Sphyrna lewini'&&r.Unit==='kg'&&r.Appendix==='II'&&r.Year>=2015&&r.Year<=2024));
const audit=JSON.parse(fs.readFileSync(path.join(dir,'data/annual-audit.json'),'utf8'));
for(const term of ['fins','fin (dried)','fin (wet)'])for(const source of ['all','W'])for(const reporter of ['E','I']){
 const observed=D.summarize(D.createRecords(),{term,source,reporter});
 for(const item of observed){const expected=audit.find(a=>a.Year===item.year&&a.Term===term&&a.Source===source&&a['Reporter.type']===reporter);assert.equal(item.rows.length,expected.Data_rows);assert.equal(item.value,expected.Quantity===null?null:Number(expected.Quantity));}
}
const series=D.summarize(D.createRecords(),{term:'fins',source:'all',reporter:'E'});
assert.deepEqual(Array.from(series,r=>r.value),[7302.97,15622.92,14410.17,6253.55,8177.66,14248.061,43126.301,28909.014,18241.69,10513.76]);
const allForms=['fins','fin (dried)','fin (wet)'];
for(const source of ['all','W'])for(const reporter of ['E','I']){
 const combined=D.summarize(D.createRecords(),{term:allForms,source,reporter});
 for(const item of combined){
  const observed=audit.filter(r=>r.Year===item.year&&r.Source===source&&r['Reporter.type']===reporter&&r.Quantity!==null);
  const expected=observed.length?Number(observed.reduce((sum,r)=>sum+Number(r.Quantity),0).toFixed(6)):null;
  assert.equal(item.value,expected);
  assert.equal(item.rows.length,observed.reduce((sum,r)=>sum+r.Data_rows,0));
 }
}
assert.equal(D.summarize(D.createRecords(),{term:allForms,source:'all',reporter:'E'})[9].value,19005.37);
assert.equal(D.summarize(D.createRecords(),{term:'fins',source:'all',reporter:'I'})[9].value,79.2);
assert.equal(D.summarize(D.createRecords(),{term:'fin (dried)',source:'all',reporter:'E'})[0].value,null);
assert.ok(!bundle.records.some(r=>r.Term==='fin (dried)'&&r.Year<2022));
assert.equal(D.normalize(D.parseCSV(fs.readFileSync(path.join(dir,'data/cites-fins-2015-2024.csv'),'utf8'))).rows.length,194);
const zero={...bundle.records[0],Year:2024,Quantity:0,Term:'fins','Reporter.type':'E'};assert.equal(D.summarize([zero],{term:'fins',source:'all',reporter:'E'})[9].value,0);assert.equal(D.summarize([zero],{term:'fins',source:'all',reporter:'E'})[0].value,null);
assert.equal(D.summarize([zero],{term:allForms,source:'all',reporter:'E'})[9].value,0);
assert.equal(D.normalize([zero]).rows[0].Quantity,0);
assert.equal(typeof D.createDemoRecords,'undefined');
console.log('PASS: official CSV checksum; 194 normalized side rows; all 120 annual audit values/counts; fixed terms, units, source, reporting side; missing vs zero; CSV roundtrip; no demo fallback.');
