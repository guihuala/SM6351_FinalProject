import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse';

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, 'public/data');
const inputPath =
  process.argv[2] ??
  'C:/Users/71080/Desktop/6351 Information visualization/comptab_2026-11-15 11_24_comma_separated(1).csv';
const years = Array.from({ length: 10 }, (_, index) => 2015 + index);
const topN = 8;

const manualLocations = {
  AQ: ['Antarctica', -74, 0],
  EU: ['European Union', 50.85, 4.35],
  HK: ['Hong Kong', 22.3193, 114.1694],
  MO: ['Macao', 22.1987, 113.5439],
  SG: ['Singapore', 1.3521, 103.8198],
  TW: ['Taiwan', 23.7, 121],
  XK: ['Kosovo', 42.6026, 20.903],
  ZZ: ['Unspecified', 0, 0],
};

const add = (map, key, amount = 1) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

const sortedTop = (map, limit = topN) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));

const cleanText = (value) => String(value ?? '').trim();

const cleanQuantity = (value) => {
  const cleaned = cleanText(value).replaceAll(',', '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const standardTerm = (value) => {
  const term = cleanText(value).toLowerCase();
  return term || 'unspecified';
};

const standardUnit = (value) => {
  const unit = cleanText(value).toLowerCase();
  if (!unit) return 'unit not reported';
  if (unit === 'number of specimens') return 'specimens';
  return unit;
};

const parseRows = async (filePath) => {
  const rows = [];
  const parser = createReadStream(filePath).pipe(
    parse({
      bom: true,
      columns: true,
      relax_quotes: true,
      relax_column_count: true,
    }),
  );
  for await (const row of parser) rows.push(row);
  return rows;
};

const countriesGeoJson = JSON.parse(
  await readFile(path.join(outputRoot, 'countries.geojson'), 'utf8'),
);
const countryLookup = {};
for (const feature of countriesGeoJson.features) {
  const props = feature.properties;
  const code = [props.ISO_A2, props.ISO_A2_EH].find(
    (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value),
  );
  if (!code) continue;
  countryLookup[code] = {
    code,
    name: props.NAME_EN || props.NAME || props.ADMIN || code,
    lat: Number(props.LABEL_Y),
    lng: Number(props.LABEL_X),
  };
}
for (const [code, [name, lat, lng]] of Object.entries(manualLocations)) {
  countryLookup[code] = { code, name, lat, lng };
}

const rawRows = await parseRows(inputPath);
const cleanedRows = rawRows
  .map((row, index) => {
    const year = Number(cleanText(row.Year));
    const importer = cleanText(row.Importer).toUpperCase();
    const exporter = cleanText(row.Exporter).toUpperCase();

    return {
      id: `sl-${year}-${String(index + 1).padStart(4, '0')}`,
      year,
      appendix: cleanText(row['App.']),
      taxon: cleanText(row.Taxon),
      importer,
      exporter,
      origin: cleanText(row.Origin),
      importerQuantity: cleanQuantity(row['Importer reported quantity']),
      exporterQuantity: cleanQuantity(row['Exporter reported quantity']),
      term: standardTerm(row.Term),
      unit: standardUnit(row.Unit),
      purpose: cleanText(row.Purpose),
      source: cleanText(row.Source),
    };
  })
  .filter(
    (row) =>
      row.taxon === 'Sphyrna lewini' &&
      years.includes(row.year) &&
      /^[A-Z]{2}$/.test(row.importer) &&
      /^[A-Z]{2}$/.test(row.exporter) &&
      row.importer !== row.exporter &&
      (row.importerQuantity !== null || row.exporterQuantity !== null),
  );

const occurrenceResponse = await fetch(
  'https://api.gbif.org/v1/occurrence/search?taxonKey=2418789&limit=0&hasCoordinate=true&facet=country&facetLimit=100',
);
if (!occurrenceResponse.ok) {
  throw new Error(`GBIF occurrence request failed: ${occurrenceResponse.status}`);
}
const occurrenceJson = await occurrenceResponse.json();
const distributionCountries = (occurrenceJson.facets?.[0]?.counts ?? [])
  .filter((entry) => countryLookup[entry.name])
  .map((entry) => ({
    ...countryLookup[entry.name],
    count: Number(entry.count),
  }))
  .sort((a, b) => b.count - a.count);

const yearsData = {};
const routes = [];

for (const year of years) {
  const rows = cleanedRows.filter((row) => row.year === year);
  const routeMap = new Map();
  const countryMap = new Map();
  const termMap = new Map();

  for (const row of rows) {
    add(termMap, row.term);
    const routeKey = `${row.exporter}|${row.importer}`;
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, {
        exporter: row.exporter,
        importer: row.importer,
        records: 0,
        terms: new Map(),
        channels: new Map(),
        purposes: new Map(),
      });
    }
    const route = routeMap.get(routeKey);
    route.records += 1;
    add(route.terms, row.term);
    if (row.purpose) add(route.purposes, row.purpose);
    const channelKey = `${row.term}|${row.unit}`;
    const channel = route.channels.get(channelKey) ?? {
      term: row.term,
      unit: row.unit,
      importerQuantity: 0,
      exporterQuantity: 0,
      records: 0,
    };
    channel.importerQuantity += row.importerQuantity ?? 0;
    channel.exporterQuantity += row.exporterQuantity ?? 0;
    channel.records += 1;
    route.channels.set(channelKey, channel);

    for (const [role, code] of [
      ['export', row.exporter],
      ['import', row.importer],
    ]) {
      if (!countryMap.has(code)) {
        countryMap.set(code, {
          code,
          name: countryLookup[code]?.name ?? code,
          exportRecords: 0,
          importRecords: 0,
          terms: new Map(),
        });
      }
      const country = countryMap.get(code);
      if (role === 'export') country.exportRecords += 1;
      else country.importRecords += 1;
      add(country.terms, row.term);
    }
  }

  const yearRoutes = [...routeMap.values()]
    .map((route) => ({
      id: `route-${year}-${route.exporter}-${route.importer}`,
      year,
      exporter: route.exporter,
      importer: route.importer,
      exporterName: countryLookup[route.exporter]?.name ?? route.exporter,
      importerName: countryLookup[route.importer]?.name ?? route.importer,
      startLat: countryLookup[route.exporter]?.lat,
      startLng: countryLookup[route.exporter]?.lng,
      endLat: countryLookup[route.importer]?.lat,
      endLng: countryLookup[route.importer]?.lng,
      records: route.records,
      topTerms: sortedTop(route.terms, 5),
      topPurposes: sortedTop(route.purposes, 5),
      channels: [...route.channels.values()]
        .sort((a, b) => b.records - a.records)
        .slice(0, 6),
    }))
    .filter(
      (route) =>
        Number.isFinite(route.startLat) &&
        Number.isFinite(route.startLng) &&
        Number.isFinite(route.endLat) &&
        Number.isFinite(route.endLng),
    )
    .sort((a, b) => b.records - a.records);

  routes.push(...yearRoutes);
  yearsData[year] = {
    records: rows.length,
    routes: yearRoutes.length,
    exporters: new Set(rows.map((row) => row.exporter)).size,
    importers: new Set(rows.map((row) => row.importer)).size,
    topTerms: sortedTop(termMap, 8),
    countries: Object.fromEntries(
      [...countryMap.entries()].map(([code, country]) => [
        code,
        {
          ...country,
          topTerms: sortedTop(country.terms, 5),
          terms: undefined,
        },
      ]),
    ),
  };
}

const productCounts = cleanedRows.reduce((map, row) => {
  add(map, row.term);
  return map;
}, new Map());

const output = {
  meta: {
    title: 'Sphyrna lewini',
    commonName: 'Scalloped hammerhead',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    window: [2015, 2024],
    source: 'CITES Trade Database 2026.1 comparative export',
    distributionSource:
      'GBIF occurrence search, Sphyrna lewini (species key 2418789), mapped records',
    sourceUrls: [
      'https://trade.cites.org/en/cites_trade',
      'https://www.gbif.org/species/2418789',
    ],
    gbifCheckedAt: new Date().toISOString(),
  },
  summary: {
    cleanedRows: cleanedRows.length,
    years: 10,
    exporters: new Set(cleanedRows.map((row) => row.exporter)).size,
    importers: new Set(cleanedRows.map((row) => row.importer)).size,
    totalOccurrences: Number(occurrenceJson.count ?? 0),
    occurrenceCountries: distributionCountries.length,
    productCounts: sortedTop(productCounts, 20),
  },
  years: yearsData,
  routes,
  countries: countryLookup,
  distribution: distributionCountries,
  cleanedRows,
};

await writeFile(
  path.join(outputRoot, 'sphyrna-data.json'),
  JSON.stringify(output),
  'utf8',
);

console.log(
  `Wrote ${cleanedRows.length} cleaned lines, ${routes.length} annual routes, and ${distributionCountries.length} distribution countries.`,
);
