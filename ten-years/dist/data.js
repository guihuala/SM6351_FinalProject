(function (global) {
'use strict';
const YEARS = Array.from({length:10},(_,i)=>2015+i), TAXON='Sphyrna lewini';
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createRecords(){
 return (global.MarineDecadeDataset?.records || []).map(row=>({...row}));
}
function parseCSV(text){text=text.replace(/^\uFEFF/,'');let result=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(!quoted&&cell.length)throw Error('Invalid CSV quoting.');else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))result.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('The CSV contains an unclosed quote.');row.push(cell);if(row.some(v=>v.trim()))result.push(row);if(result.length<2)throw Error('The CSV needs a header and at least one record.');const headers=result.shift().map(s=>s.trim());if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV headers.');return result.map((values,i)=>{if(values.length!==headers.length)throw Error(`Row ${i+2} has a different number of columns from the header.`);return Object.fromEntries(headers.map((h,j)=>[h,values[j].trim()]))})}
function normalize(raw){if(!Array.isArray(raw)||!raw.length)throw Error("No records to import.");const required=['Year','Quantity','Unit','Term','Reporter.type','Taxon','Importer','Exporter','Source','Appendix'];for(const key of required)if(!(key in raw[0]))throw Error(`Missing ${key}. Use the CSV template; importer and exporter quantities must be separate rows.`);let excluded=0;const rows=[];raw.forEach((r,i)=>{const year=Number(r.Year),q=Number(r.Quantity);if(r.Taxon.toLowerCase()!==TAXON.toLowerCase()||!YEARS.includes(year)||!['I','II','III'].includes(r.Appendix.toUpperCase())||r.Unit.toLowerCase()!=='kg'||!['fins','fin (dried)','fin (wet)'].includes(r.Term.toLowerCase())){excluded++;return}const report=({'e':'E','exporter':'E','exporter-reported':'E','i':'I','importer':'I','importer-reported':'I'})[r['Reporter.type'].toLowerCase()];if(r.Quantity===null||r.Quantity===undefined||String(r.Quantity).trim()===''||!Number.isFinite(q)||q<0)throw Error(`Row ${i+2} has a missing or invalid quantity. Clean the file before importing; do not replace missing values with zero.`);if(!report)throw Error(`Row ${i+2}: Reporter.type must be E / I or Exporter / Importer.`);rows.push({...r,Year:year,Quantity:q,Unit:'kg',Term:r.Term.toLowerCase(),'Reporter.type':report,Source:r.Source.toUpperCase(),Appendix:r.Appendix.toUpperCase()})});if(!rows.length)throw Error('No matching Sphyrna lewini records. Required: 2015–2024, Appendices I–III, kg, and fins / fin (dried) / fin (wet).');return{rows,excluded}}

function summarize(rows, filters) {
 const terms = Array.isArray(filters.term) ? filters.term : [filters.term];
 const matched = rows.filter(r=>terms.includes(r.Term) && r['Reporter.type']===filters.reporter && (filters.source==='all'||r.Source===filters.source));
 return YEARS.map(year=>{const entries=matched.filter(r=>r.Year===year);return {year,rows:entries,value:entries.length?Number(entries.reduce((sum,r)=>sum+r.Quantity,0).toFixed(6)):null};});
}
global.MarineDecadeData = Object.freeze({YEARS,TAXON,fmt,esc,createRecords,parseCSV,normalize,summarize});
})(window);
