export type ViewMode = 'distribution' | 'trade';

export interface CountryLocation {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export interface DistributionCountry extends CountryLocation {
  count: number;
}

export interface QuantityChannel {
  term: string;
  unit: string;
  importerQuantity: number;
  exporterQuantity: number;
  records: number;
}

export interface TopEntry {
  label: string;
  value: number;
}

export interface TradeRoute {
  id: string;
  year: number;
  exporter: string;
  importer: string;
  exporterName: string;
  importerName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  records: number;
  topTerms: TopEntry[];
  topPurposes: TopEntry[];
  channels: QuantityChannel[];
}

export interface TradeCountry {
  code: string;
  name: string;
  exportRecords: number;
  importRecords: number;
  topTerms: TopEntry[];
}

export interface TradeYear {
  records: number;
  routes: number;
  exporters: number;
  importers: number;
  topTerms: TopEntry[];
  countries: Record<string, TradeCountry>;
}

export interface SphyrnaData {
  meta: {
    title: string;
    commonName: string;
    status: 'CR';
    statusLabel: string;
    window: [number, number];
    source: string;
    distributionSource: string;
    sourceUrls: string[];
    gbifCheckedAt: string;
  };
  summary: {
    cleanedRows: number;
    years: number;
    exporters: number;
    importers: number;
    totalOccurrences: number;
    occurrenceCountries: number;
    productCounts: TopEntry[];
  };
  years: Record<string, TradeYear>;
  routes: TradeRoute[];
  countries: Record<string, CountryLocation>;
  distribution: DistributionCountry[];
  cleanedRows: Array<{
    id: string;
    year: number;
    appendix: string;
    taxon: string;
    importer: string;
    exporter: string;
    origin: string;
    importerQuantity: number | null;
    exporterQuantity: number | null;
    term: string;
    unit: string;
    purpose: string;
    source: string;
  }>;
}

export interface CountryFeature {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    lat: number;
    lng: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: unknown;
  };
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

export type Selection =
  | { type: 'country'; code: string }
  | { type: 'route'; route: TradeRoute };

export interface FocusTarget {
  key: string;
  lat: number;
  lng: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export interface PointerPosition {
  x: number;
  y: number;
}

export type HoverState =
  | { layer: 'polygon'; data: CountryFeature }
  | { layer: 'point'; data: DistributionCountry }
  | { layer: 'arc'; data: TradeRoute };
