#!/usr/bin/env python3
"""Rebuild the frozen browser dataset from the unmodified official CITES extract."""
import csv
import hashlib
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/cites-sphyrna-lewini-2015-2024-comptab.csv'
OUT = ROOT / 'dist/data'
OUT.mkdir(parents=True, exist_ok=True)
TERMS = {'fins': 'FIN', 'fin (dried)': 'DFN', 'fin (wet)': 'FFN'}
params = [('filters[time_range_start]', '2015'), ('filters[time_range_end]', '2024'),
          ('filters[taxon_concepts_ids][]', '6544'), ('filters[selection_taxon]', 'taxonomic_cascade'),
          ('filters[report_type]', 'comptab'), ('filters[csv_separator]', 'comma')]
source_url = 'https://trade.cites.org/en/cites_trade/exports/download?' + urlencode(params)
raw_bytes = RAW.read_bytes()
assert hashlib.sha256(raw_bytes).hexdigest() == "a06c0cc08b405945bc72d66b96b2d2076c3027589b9b5412b4a73dcf62895586", "Frozen official extract checksum changed; review before rebuilding."
raw = list(csv.DictReader(raw_bytes.decode('utf-8-sig').splitlines()))
assert len(raw) == 399, 'Unexpected frozen extract row count; review provenance before rebuilding.'
assert all(r['Taxon'] == 'Sphyrna lewini' and 2015 <= int(r['Year']) <= 2024 for r in raw)
assert all(None not in r and len(r) == 16 for r in raw), 'Incomplete or malformed download.'
records = []
fin_rows = [r for r in raw if r['Term'] in TERMS]
retained = [r for r in fin_rows if r['Unit'] == 'kg' and r['App.'] in ['I', 'II', 'III']]
for line, row in enumerate(raw, start=2):
    if row['Term'] not in TERMS or row['Unit'] != 'kg' or row['App.'] not in ['I', 'II', 'III']:
        continue
    for reporter, column in [('E', 'Exporter reported quantity'), ('I', 'Importer reported quantity')]:
        # Blank is an absent reporting side, not a zero quantity.
        value = row[column]
        if value == '':
            continue
        quantity = Decimal(value)
        assert quantity.is_finite() and quantity >= 0
        records.append(dict(Year=int(row['Year']), Quantity=float(quantity), Unit='kg', Term=row['Term'],
                            **{'Term.code': TERMS[row['Term']], 'Reporter.type': reporter},
                            Taxon=row['Taxon'], Importer=row['Importer'], Exporter=row['Exporter'],
                            Origin=row['Origin'], Source=row['Source'], Appendix=row['App.'],
                            Purpose=row['Purpose'], **{'Comparative.row':line, 'Original.quantity':value}))
annual = []
for term, code in TERMS.items():
    for source in ['all', 'W']:
        for reporter in ['E', 'I']:
            for year in range(2015, 2025):
                entries = [r for r in records if r['Term'] == term and r['Reporter.type'] == reporter
                           and r['Year'] == year and (source == 'all' or r['Source'] == source)]
                total = sum((Decimal(r['Original.quantity']) for r in entries), Decimal(0))
                annual.append(dict(Year=year, Term=term, **{'Term.code':code, 'Reporter.type':reporter},
                                   Source=source, Unit='kg', Quantity=str(total) if entries else None,
                                   Data_rows=len(entries)))
metadata = {
    'title':'CITES Trade Database: Sphyrna lewini fin products, 2015–2024',
    'publisher':'CITES Secretariat; compiled and maintained by UNEP-WCMC',
    'accessed_date':'2026-11-04', 'response_date_utc':'2026-11-04T13:57:02Z',
    'source_url':source_url, 'database_url':'https://trade.cites.org/en/cites_trade',
    'guide_url':'https://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf',
    'taxon_id':6544, 'taxon':'Sphyrna lewini', 'years':[2015,2024],
    'download_type':'Live-query comparative tabulation (comptab), not the full shipment database',
    'database_version':'Live query accessed 2026-11-04; not labelled as the static 2026.1 release',
    'raw_file':RAW.name, 'raw_sha256':hashlib.sha256(raw_bytes).hexdigest(), 'raw_bytes':len(raw_bytes),
    'raw_comparative_rows':len(raw), 'fin_product_comparative_rows':len(fin_rows),
    'retained_kg_comparative_rows':len(retained), 'normalized_reporting_side_rows':len(records),
    'non_fin_rows_excluded':len(raw)-len(fin_rows),
    'fin_rows_excluded_by_unit':dict(Counter(r['Unit'] or '(blank)' for r in fin_rows if r['Unit'] != 'kg')),
    'taxon_lookup_url':'https://trade.cites.org/api/v1/auto_complete_taxon_concepts?locale=en&taxonomy=CITES&taxon_concept_query=Sphyrna+lewini&visibility=cites_trade',
    'term_codes_url':'https://trade.cites.org/api/v1/terms?locale=en',
    'product_codes':TERMS, 'selected_appendices':sorted(set(r['App.'] for r in retained)),
    'reporting_sides':dict(Counter(r['Reporter.type'] for r in records)),
    'default_filters':{'term':'fins','reporter':'E','source':'all','unit':'kg'},
    'conventions':[
        'FIN, DFN and FFN are kept as separate source terms. Fin trade totals their reported kg within each year, reporting side and selected source filter.',
        'Only explicitly reported kg rows are retained. No unit conversion is applied.',
        'Blank and Number of specimens units, g and cm3 are excluded from the kg series.',
        'Importer and exporter quantities are split into independent rows; absent side quantities are omitted, not zero-filled.',
        'All countries, purposes and sources are included by default. Wild-only filtering uses W.',
        'Direct trade and re-exports are retained; quantities are not unique animals, harvest, or population pressure.',
        'Counts are comparative-table rows for the selected reporting side, not original transactions or shipments.',
        'No matching annual record is null; a reported numeric zero remains zero.',
        'Later-year reporting coverage may be incomplete or revised; temporal alignment does not establish policy effectiveness.'
    ]
}
fields = list(records[0])
with (OUT/'cites-fins-2015-2024.csv').open('w', newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(records)
(OUT/RAW.name).write_bytes(raw_bytes)
(OUT/'provenance.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
(OUT/'annual-audit.json').write_text(json.dumps(annual,ensure_ascii=False,indent=2)+'\n')
payload={'metadata':metadata,'records':records}
(OUT/'cites-fins-2015-2024.js').write_text('window.MarineDecadeDataset = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'raw_rows':len(raw),'fin_rows':len(fin_rows),'kg_rows':len(retained),'normalized_rows':len(records),'by_side':metadata['reporting_sides'],'excluded_units':metadata['fin_rows_excluded_by_unit']},indent=2))
for r in annual:
    if r['Term']=='fins' and r['Source']=='all' and r['Reporter.type']=='E':
        print(r['Year'],r['Quantity'],r['Data_rows'])
