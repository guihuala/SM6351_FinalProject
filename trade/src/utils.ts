import type { CountryFeatureCollection, SphyrnaData, TopEntry } from './types';

export const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);

export const formatQuantity = (value: number, unit: string) => {
  if (!value) return '—';
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 2)} ${unit}`;
};

export const titleCase = (value: string) =>
  value.replace(/\b\w/g, (letter) => letter.toUpperCase());

export const normalizeCountryGeoJson = (input: {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
  }>;
}): CountryFeatureCollection => ({
  type: 'FeatureCollection',
  features: input.features
    .map((feature) => {
      const props = feature.properties;
      const code = [props.ISO_A2, props.ISO_A2_EH].find(
        (value): value is string =>
          typeof value === 'string' && /^[A-Z]{2}$/.test(value),
      );
      if (!code) return null;
      return {
        type: 'Feature' as const,
        properties: {
          code,
          name: String(props.NAME_EN || props.NAME || props.ADMIN || code),
          lat: Number(props.LABEL_Y),
          lng: Number(props.LABEL_X),
        },
        geometry: feature.geometry,
      };
    })
    .filter((feature) => feature !== null),
});

export const getRouteMidpoint = (route: {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}) => {
  const toVector = (lat: number, lng: number) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 90) * Math.PI) / 180;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: -Math.sin(phi) * Math.sin(theta),
    };
  };
  const a = toVector(route.startLat, route.startLng);
  const b = toVector(route.endLat, route.endLng);
  const x = a.x + b.x;
  const y = a.y + b.y;
  const z = a.z + b.z;
  const length = Math.hypot(x, y, z) || 1;
  return {
    lat: (Math.asin(y / length) * 180) / Math.PI,
    lng: (Math.atan2(-z / length, x / length) * 180) / Math.PI - 90,
  };
};

export const partnerNames = (entries: TopEntry[], data: SphyrnaData) =>
  entries.map((entry) => ({
    ...entry,
    name: data.countries[entry.label]?.name ?? entry.label,
  }));
