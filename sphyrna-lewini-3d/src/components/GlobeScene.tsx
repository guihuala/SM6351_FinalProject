import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MeshPhongMaterial,
  Vector3,
} from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import R3fGlobe, { type GlobeMethods } from 'r3f-globe';
import type {
  CountryFeature,
  CountryFeatureCollection,
  DistributionCountry,
  FocusTarget,
  Selection,
  SphyrnaData,
  TradeCountry,
  TradeRoute,
  ViewMode,
} from '../types';
import { getRouteMidpoint } from '../utils';

interface GlobeSceneProps {
  rendering: boolean;
  mode: ViewMode;
  countries: CountryFeatureCollection;
  data: SphyrnaData;
  year: number;
  routes: TradeRoute[];
  tradeCountries: Record<string, TradeCountry>;
  hoveredCode?: string;
  hoveredDistributionCode?: string;
  hoveredRouteId?: string;
  selection: Selection | null;
  focus: FocusTarget | null;
  resetSignal: number;
  onHover: (
    layer: 'polygon' | 'point' | 'arc' | undefined,
    payload?: CountryFeature | DistributionCountry | TradeRoute,
  ) => void;
  onSelect: (selection: Selection, focus: FocusTarget) => void;
  onClear: () => void;
}

function OceanParticles() {
  const geometry = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 225 + Math.random() * 620;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const buffer = new BufferGeometry();
    buffer.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return buffer;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#8cced3"
        size={0.8}
        transparent
        opacity={0.24}
        depthWrite={false}
        blending={AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function CameraRig({
  focus,
  resetSignal,
  globeRef,
  controlsRef,
}: {
  focus: FocusTarget | null;
  resetSignal: number;
  globeRef: React.RefObject<GlobeMethods | undefined>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const { size } = useThree();
  const animation = useRef({ active: false, target: camera.position.clone() });

  useEffect(() => {
    if (!focus) return;
    let { lat, lng } = focus;
    if (
      focus.startLat !== undefined &&
      focus.startLng !== undefined &&
      focus.endLat !== undefined &&
      focus.endLng !== undefined
    ) {
      const midpoint = getRouteMidpoint({
        startLat: focus.startLat,
        startLng: focus.startLng,
        endLat: focus.endLat,
        endLng: focus.endLng,
      });
      lat = midpoint.lat;
      lng = midpoint.lng;
    }
    const coords = globeRef.current?.getCoords(lat, lng);
    if (!coords) return;
    const direction = new Vector3(coords.x, coords.y, coords.z).normalize();
    animation.current.target.copy(
      direction.multiplyScalar(size.width <= 760 ? 430 : 350),
    );
    animation.current.active = true;
  }, [focus, globeRef, size.width]);

  useEffect(() => {
    if (!resetSignal) return;
    const factor = size.width <= 760 ? 1.24 : 1;
    animation.current.target.set(110 * factor, 82 * factor, 332 * factor);
    animation.current.active = true;
  }, [resetSignal, size.width]);

  useFrame(() => {
    if (!animation.current.active) return;
    camera.position.lerp(animation.current.target, 0.075);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update();
    if (camera.position.distanceTo(animation.current.target) < 0.01) {
      animation.current.active = false;
    }
  });

  return null;
}

export default function GlobeScene({
  rendering,
  mode,
  countries,
  data,
  routes,
  tradeCountries,
  hoveredCode,
  hoveredDistributionCode,
  hoveredRouteId,
  selection,
  focus,
  resetSignal,
  onHover,
  onSelect,
  onClear,
}: GlobeSceneProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (rendering) globeRef.current?.resumeAnimation();
    else globeRef.current?.pauseAnimation();
  }, [rendering]);

  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: new Color('#0a3b50'),
        emissive: new Color('#02131f'),
        emissiveIntensity: 0.48,
        specular: new Color('#3c7785'),
        shininess: 7,
      }),
    [],
  );

  const distributionMap = useMemo(
    () => new Map(data.distribution.map((country) => [country.code, country])),
    [data.distribution],
  );
  const distributionPeaks = useMemo(
    () => data.distribution.slice(0, 18),
    [data.distribution],
  );

  const selectedRoute = selection?.type === 'route' ? selection.route : undefined;
  const selectedCode = selection?.type === 'country' ? selection.code : undefined;
  const selectedCodes = new Set<string>();
  if (selectedCode) selectedCodes.add(selectedCode);
  if (selectedRoute) {
    selectedCodes.add(selectedRoute.exporter);
    selectedCodes.add(selectedRoute.importer);
  }

  const polygonCapColor = (object: object) => {
    const feature = object as CountryFeature;
    const code = feature.properties.code;
    const isHovered =
      hoveredCode === code || hoveredDistributionCode === code;

    if (mode === 'distribution') {
      const occurrence = distributionMap.get(code);
      if (!occurrence) {
        return isHovered ? 'rgba(177, 206, 205, 0.74)' : 'rgba(126, 164, 168, 0.54)';
      }
      return isHovered
        ? 'rgba(188, 210, 198, 0.78)'
        : 'rgba(148, 184, 187, 0.68)';
    }

    const trade = tradeCountries[code];
    if (!trade) {
      return isHovered ? 'rgba(153, 188, 189, 0.68)' : 'rgba(102, 143, 151, 0.5)';
    }
    const both = trade.exportRecords > 0 && trade.importRecords > 0;
    if (both) return isHovered ? 'rgba(234, 158, 145, 0.7)' : 'rgba(176, 105, 117, 0.48)';
    if (trade.exportRecords > 0) {
      return isHovered ? 'rgba(255, 161, 142, 0.72)' : 'rgba(188, 78, 73, 0.48)';
    }
    return isHovered
      ? 'rgba(226, 238, 235, 0.76)'
      : 'rgba(190, 211, 210, 0.58)';
  };

  const polygonStrokeColor = (object: object) => {
    const feature = object as CountryFeature;
    const code = feature.properties.code;
    if (selectedCodes.has(code) || hoveredCode === code || hoveredDistributionCode === code) {
      return 'rgba(207, 226, 224, 0.72)';
    }
    if (mode === 'distribution' && distributionMap.has(code)) {
      return 'rgba(181, 210, 211, 0.62)';
    }
    if (
      mode === 'trade' &&
      (tradeCountries[code]?.exportRecords || tradeCountries[code]?.importRecords)
    ) {
      return 'rgba(229, 198, 180, 0.74)';
    }
    return 'rgba(177, 210, 209, 0.32)';
  };

  const pointRadius = (object: object) => {
    const country = object as DistributionCountry;
    const radius = 0.18 + Math.log10(country.count + 1) / 6;
    return hoveredDistributionCode === country.code ? radius * 1.55 : radius;
  };

  const pointColor = (object: object) => {
    const country = object as DistributionCountry;
    return hoveredDistributionCode === country.code
      ? 'rgba(255, 184, 169, 0.98)'
      : 'rgba(210, 80, 75, 0.8)';
  };

  const arcColor = (object: object) => {
    const route = object as TradeRoute;
    if (selectedRoute?.id === route.id) return 'rgba(255, 249, 226, 1)';
    if (hoveredRouteId === route.id) return 'rgba(255, 197, 173, 0.96)';
    if (selectedCode) {
      return route.exporter === selectedCode || route.importer === selectedCode
        ? 'rgba(243, 241, 220, 0.75)'
        : 'rgba(196, 220, 215, 0.04)';
    }
    if (selectedRoute) return 'rgba(196, 220, 215, 0.06)';
    return 'rgba(239, 247, 236, 0.58)';
  };

  const arcStroke = (object: object) => {
    const route = object as TradeRoute;
    const base = 0.105 + Math.min(0.18, Math.log10(route.records + 1) * 0.07);
    if (selectedRoute?.id === route.id) return base * 2.3;
    if (hoveredRouteId === route.id) return base * 1.7;
    return base;
  };

  const endpointLabels = useMemo(() => {
    if (mode === 'distribution') {
      return distributionPeaks.slice(0, 7).map((country) => ({
        lat: country.lat,
        lng: country.lng,
        text: country.name.toUpperCase(),
        color: '#d8ebe6',
      }));
    }
    if (!selectedRoute) return [];
    return [
      {
        lat: selectedRoute.startLat,
        lng: selectedRoute.startLng,
        text: `${selectedRoute.exporterName} · ORIGIN`.toUpperCase(),
        color: '#ffd7c6',
      },
      {
        lat: selectedRoute.endLat,
        lng: selectedRoute.endLng,
        text: `${selectedRoute.importerName} · DESTINATION`.toUpperCase(),
        color: 'rgba(214, 231, 228, 0.9)',
      },
    ];
  }, [distributionPeaks, mode, selectedRoute]);

  const emissionRings = useMemo(() => {
    if (mode === 'distribution') {
      return distributionPeaks.slice(0, 11).map((country) => ({
        ...country,
        color: '#d85c55',
      }));
    }
    if (!selectedRoute) return [];
    return [
      {
        lat: selectedRoute.startLat,
        lng: selectedRoute.startLng,
        color: '#d45d55',
      },
      {
        lat: selectedRoute.endLat,
        lng: selectedRoute.endLng,
        color: '#f4f1e9',
      },
    ];
  }, [distributionPeaks, mode, selectedRoute]);

  const handleHover = (layer: string | undefined, payload?: object) => {
    if (!layer || !payload) {
      onHover(undefined);
      return;
    }
    if (layer === 'polygon' || layer === 'point' || layer === 'arc') {
      onHover(
        layer,
        payload as CountryFeature | DistributionCountry | TradeRoute,
      );
    }
  };

  const handleClick = (layer: string, payload?: object) => {
    if (!payload) {
      onClear();
      return;
    }
    if (layer === 'arc') {
      const route = payload as TradeRoute;
      onSelect(
        { type: 'route', route },
        {
          key: route.id,
          lat: 0,
          lng: 0,
          startLat: route.startLat,
          startLng: route.startLng,
          endLat: route.endLat,
          endLng: route.endLng,
        },
      );
      return;
    }
    if (layer === 'polygon' || layer === 'point') {
      const code =
        layer === 'polygon'
          ? (payload as CountryFeature).properties.code
          : (payload as DistributionCountry).code;
      const location =
        data.countries[code] ??
        countries.features.find((feature) => feature.properties.code === code)?.properties;
      if (!location) return;
      onSelect(
        { type: 'country', code },
        { key: `country-${code}`, lat: location.lat, lng: location.lng },
      );
      return;
    }
    onClear();
  };

  return (
    <>
      <fog attach="fog" args={['#061c2b', 760, 1700]} />
      <ambientLight intensity={0.66} />
      <hemisphereLight args={['#76c7d2', '#03131f', 0.9]} />
      <directionalLight position={[180, 150, 260]} intensity={1.55} color="#fff1dc" />
      <directionalLight position={[-260, -80, -180]} intensity={0.76} color="#4a9cb6" />
      <OceanParticles />
      <R3fGlobe
        ref={globeRef}
        globeMaterial={globeMaterial}
        atmosphereColor="#5ecbd0"
        atmosphereAltitude={0.075}
        polygonsData={countries.features}
        polygonCapColor={polygonCapColor}
        polygonSideColor="rgba(9, 41, 54, 0.55)"
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={(object: object) => {
          const code = (object as CountryFeature).properties.code;
          return selectedCodes.has(code) || hoveredCode === code
            ? 0.013
            : 0.006;
        }}
        polygonCapCurvatureResolution={2}
        polygonsTransitionDuration={650}
        pointsData={mode === 'distribution' ? data.distribution : []}
        pointLat="lat"
        pointLng="lng"
        pointColor={pointColor}
        pointRadius={pointRadius}
        pointAltitude={(object: object) =>
          hoveredDistributionCode === (object as DistributionCountry).code
            ? 0.038
            : 0.014
        }
        pointResolution={18}
        pointsTransitionDuration={720}
        arcsData={mode === 'trade' ? routes : []}
        arcColor={arcColor}
        arcStroke={arcStroke}
        arcAltitudeAutoScale={0.32}
        arcDashLength={0.13}
        arcDashGap={0.22}
        arcDashAnimateTime={3900}
        arcCurveResolution={52}
        arcCircularResolution={5}
        arcsTransitionDuration={750}
        ringsData={emissionRings}
        ringColor="color"
        ringMaxRadius={(object: object) =>
          1.2 + Math.min(3.8, Math.log10((object as DistributionCountry).count ?? 1))
        }
        ringPropagationSpeed={0.7}
        ringRepeatPeriod={1750}
        labelsData={endpointLabels}
        labelText="text"
        labelColor="color"
        labelAltitude={0.018}
        labelSize={0.44}
        labelDotRadius={0}
        labelResolution={2}
        onHover={handleHover}
        onClick={handleClick}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.065}
        rotateSpeed={0.4}
        zoomSpeed={0.58}
        minDistance={210}
        maxDistance={560}
        autoRotate={mode === 'distribution' && !selection}
        autoRotateSpeed={0.13}
        onStart={() => {
          if (controlsRef.current) controlsRef.current.autoRotate = false;
        }}
        onChange={() => globeRef.current?.setPointOfView(camera)}
      />
      <CameraRig
        focus={focus}
        resetSignal={resetSignal}
        globeRef={globeRef}
        controlsRef={controlsRef}
      />
    </>
  );
}
