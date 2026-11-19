const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../dist'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const events=JSON.parse(read('data/cites-management-events.json')),context={window:{}};
vm.runInNewContext(read('data/cites-management-events.js'),context);
assert.deepEqual(JSON.parse(JSON.stringify(context.window.MarineDecadeEvents)),events);
assert.equal(events.length,6);assert.equal(new Set(events.map(e=>e.id)).size,6);
for(const e of events){
 assert.equal(e.verified,true);assert.equal(e.taxon,'Sphyrna lewini');assert.equal(e.annotation_mode,'context_only');
 assert.ok(e.years.every(y=>Number.isInteger(y)&&y>=2015&&y<=2024));
 assert.deepEqual(e.products,['fins','fin (dried)','fin (wet)']);assert.ok(e.geography.countries.length);
 assert.ok(e.scope&&e.date_note&&e.evidence&&e.sources.length);
 if(e.date_precision==='day')assert.equal(new Date(e.date).toISOString().slice(0,10),e.date);
 else assert.match(e.date,/^\d{4}$/);
 for(const r of e.sources)assert.equal(new URL(r.url).hostname,'cites.org');
}
const byId=id=>events.find(e=>e.id===id);
assert.deepEqual(byId('id-ban-2017').years,[2017,2018]);
assert.equal(byId('mx-suspension-2023').withdrawn_at,'2023-04-13');
assert.equal(byId('ec-suspension-2024').effective_at,'2024-03-11');
assert.equal(byId('ec-suspension-2024').scope_changed_at,'2025-02-25');
assert.equal(byId('ac32-review-2023').geography.countries.length,8);
assert.match(byId('ac32-review-2023').type,/not a ban/);
assert.match(byId('id-quota-2020').scope,/fish, not kg/);
assert.deepEqual([2015,2016,2021,2022].filter(y=>events.some(e=>e.years.includes(y))),[]);
assert.match(read('project.html'),/cites-management-events.js/);
console.log('PASS: six sourced contextual records; JSON/JS parity; date precision; national scopes; review vs restriction; exact suspension/withdrawal dates; no fabricated empty-year events.');
