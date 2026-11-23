import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import GlobeScene from './components/GlobeScene';
import type {
  CountryFeature,
  CountryFeatureCollection,
  DistributionCountry,
  FocusTarget,
  HoverState,
  PointerPosition,
  Selection,
  SphyrnaData,
  TradeRoute,
  ViewMode,
} from './types';
import {
  formatNumber,
  formatQuantity,
  normalizeCountryGeoJson,
  titleCase,
} from './utils';

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`;
const embedded = window.parent !== window;

function LoadingScreen({ error }: { error?: string }) {
  return (
    <main className="loading-screen">
      <div className="loading-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>{error ?? 'Preparing the Pacific current…'}</p>
      <small>One species · one reported trade network</small>
    </main>
  );
}

function HoverCard({
  hover,
  data,
  year,
  mode,
  position,
}: {
  hover: HoverState;
  data: SphyrnaData;
  year: number;
  mode: ViewMode;
  position: PointerPosition;
}) {
  const left = Math.min(window.innerWidth - 315, position.x + 18);
  const top = Math.min(window.innerHeight - 220, position.y + 18);

  if (hover.layer === 'arc') {
    const route = hover.data;
    return (
      <div className="hover-card" style={{ left, top }} role="tooltip">
        <span className="hover-kicker">Trade relationship · {year}</span>
        <strong>
          {route.exporterName}
          <i className="hover-arrow">→</i>
          {route.importerName}
        </strong>
        <div className="hover-facts">
          <span>Comparative records</span>
          <b>{formatNumber(route.records)}</b>
          <span>Leading form</span>
          <b>{route.topTerms[0]?.label ?? '—'}</b>
        </div>
        <small>Click the arc for reported quantities</small>
      </div>
    );
  }

  if (hover.layer === 'point') {
    const country = hover.data;
    const rank = data.distribution.findIndex((item) => item.code === country.code) + 1;
    return (
      <div className="hover-card" style={{ left, top }} role="tooltip">
        <span className="hover-kicker">Mapped occurrence country</span>
        <strong>{country.name}</strong>
        <div className="hover-facts">
          <span>GBIF records</span>
          <b>{formatNumber(country.count)}</b>
          <span>Density rank</span>
          <b>#{rank} of {data.distribution.length}</b>
        </div>
        <small>Click for the country record</small>
      </div>
    );
  }

  const feature = hover.data as CountryFeature;
  if (mode === 'distribution') {
    const country = data.distribution.find((item) => item.code === feature.properties.code);
    return (
      <div className="hover-card" style={{ left, top }} role="tooltip">
        <span className="hover-kicker">Distribution country</span>
        <strong>{feature.properties.name}</strong>
        {country ? (
          <div className="hover-facts">
            <span>GBIF records</span>
            <b>{formatNumber(country.count)}</b>
            <span>Source</span>
            <b>GBIF mapped occurrence</b>
          </div>
        ) : (
          <p className="hover-empty">No mapped country count in the current distribution layer.</p>
        )}
      </div>
    );
  }

  const country = data.years[String(year)]?.countries[feature.properties.code];
  return (
    <div className="hover-card" style={{ left, top }} role="tooltip">
      <span className="hover-kicker">Trade country · {year}</span>
      <strong>{feature.properties.name}</strong>
      <div className="hover-facts">
        <span>Export records</span>
        <b>{formatNumber(country?.exportRecords ?? 0)}</b>
        <span>Import records</span>
        <b>{formatNumber(country?.importRecords ?? 0)}</b>
        <span>Leading form</span>
        <b>{country?.topTerms[0]?.label ?? '—'}</b>
      </div>
      <small>Click country to isolate its links</small>
    </div>
  );
}

function DetailPanel({
  selection,
  mode,
  year,
  data,
  onClose,
  onShowTrade,
}: {
  selection: Selection;
  mode: ViewMode;
  year: number;
  data: SphyrnaData;
  onClose: () => void;
  onShowTrade: (code?: string) => void;
}) {
  if (selection.type === 'route') {
    const route = selection.route;
    return (
      <aside className="detail-panel" aria-label="Trade route details">
        <button className="panel-close" onClick={onClose} aria-label="Close details">
          ×
        </button>
        <span className="panel-kicker">Selected flow · {year}</span>
        <h2>
          {route.exporterName}
          <i>→</i>
          {route.importerName}
        </h2>
        <div className="panel-stat-row">
          <div>
            <strong>{formatNumber(route.records)}</strong>
            <span>comparative records</span>
          </div>
          <div>
            <strong>{route.topTerms[0]?.label ?? '—'}</strong>
            <span>leading product form</span>
          </div>
        </div>
        <section className="panel-section">
          <div className="section-heading">
            <span>Reported channels</span>
            <small>units stay separate</small>
          </div>
          {route.channels.map((channel, index) => (
            <div className="channel-row" key={`${channel.term}-${channel.unit}-${index}`}>
              <span className="channel-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{titleCase(channel.term)}</strong>
                <small>{channel.records} comparative record(s)</small>
              </div>
              <div className="channel-quantities">
                <span>EX {formatQuantity(channel.exporterQuantity, channel.unit)}</span>
                <span>IM {formatQuantity(channel.importerQuantity, channel.unit)}</span>
              </div>
            </div>
          ))}
        </section>
        <p className="panel-method">
          EX and IM are independently reported quantities. This visualization does not add them
          together or convert across product units.
        </p>
      </aside>
    );
  }

  const code = selection.code;
  const location = data.countries[code];
  if (mode === 'distribution') {
    const country = data.distribution.find((item) => item.code === code);
    const rank = data.distribution.findIndex((item) => item.code === code) + 1;
    return (
      <aside className="detail-panel" aria-label="Distribution country details">
        <button className="panel-close" onClick={onClose} aria-label="Close details">
          ×
        </button>
        <span className="panel-kicker">Distribution record</span>
        <h2>{country?.name ?? location?.name ?? code}</h2>
        {country ? (
          <>
            <div className="distribution-big">
              <strong>{formatNumber(country.count)}</strong>
              <span>mapped GBIF occurrences</span>
            </div>
            <div className="distribution-rank">
              <span>Density rank</span>
              <b>#{rank} of {data.distribution.length} countries</b>
            </div>
            <p className="panel-method">
              Occurrence counts describe recorded observation coverage, not abundance or complete
              biological range.
            </p>
          </>
        ) : (
          <p className="panel-method">No mapped occurrence country is recorded for this area.</p>
        )}
        <button className="panel-action" onClick={() => onShowTrade(code)}>
          Trace this country in trade
        </button>
      </aside>
    );
  }

  const country = data.years[String(year)]?.countries[code];
  return (
    <aside className="detail-panel" aria-label={`${year} trade country details`}>
      <button className="panel-close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      <span className="panel-kicker">Trade country report · {year}</span>
      <h2>{country?.name ?? location?.name ?? code}</h2>
      {country ? (
        <>
          <div className="panel-stat-row">
            <div>
              <strong>{formatNumber(country.exportRecords)}</strong>
              <span>export records</span>
            </div>
            <div>
              <strong>{formatNumber(country.importRecords)}</strong>
              <span>import records</span>
            </div>
          </div>
          <section className="panel-section">
            <div className="section-heading">
              <span>Product forms reported</span>
              <small>comparative rows</small>
            </div>
            <div className="term-list">
              {country.topTerms.map((term) => (
                <span key={term.label}>
                  {titleCase(term.label)}
                  <b>{term.value}</b>
                </span>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="panel-method">
          No matching trade record for this country in {year}. This is not by itself evidence of
          zero trade.
        </p>
      )}
      <p className="panel-method">Trade records show reported partner relationships, not actual shipping routes.</p>
    </aside>
  );
}

export default function App() {
  const [data, setData] = useState<SphyrnaData | null>(null);
  const [countries, setCountries] = useState<CountryFeatureCollection | null>(null);
  const [error, setError] = useState<string>();
  const [mode, setMode] = useState<ViewMode>('distribution');
  const [year, setYear] = useState(2024);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [pointer, setPointer] = useState<PointerPosition>({ x: 0, y: 0 });
  const [focus, setFocus] = useState<FocusTarget | null>({
    key: 'distribution',
    lat: 16,
    lng: 34,
  });
  const [resetSignal, setResetSignal] = useState(0);
  const [scene, setScene] = useState<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!scene) return;
    let inView = !('IntersectionObserver' in window);
    const sync = () => setRendering(inView && !document.hidden);
    // The rootless observer also clips to the host viewport when embedded.
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.intersectionRatio > 0;
          sync();
        }, { threshold: 0.001 })
      : undefined;
    observer?.observe(scene);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [scene]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(assetUrl('data/sphyrna-data.json')).then((response) => {
        if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
        return response.json() as Promise<SphyrnaData>;
      }),
      fetch(assetUrl('data/countries.geojson')).then((response) => {
        if (!response.ok) throw new Error(`Country geometry failed: ${response.status}`);
        return response.json() as Promise<
          Parameters<typeof normalizeCountryGeoJson>[0]
        >;
      }),
    ])
      .then(([tradeData, geoJson]) => {
        if (cancelled) return;
        setData(tradeData);
        setCountries(normalizeCountryGeoJson(geoJson));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load the species data.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const routes = useMemo(
    () => data?.routes.filter((route) => route.year === year) ?? [],
    [data, year],
  );
  const yearData = data?.years[String(year)];

  const hoveredCode =
    hover?.layer === 'polygon' ? hover.data.properties.code : undefined;
  const hoveredDistributionCode =
    hover?.layer === 'point' ? hover.data.code : undefined;
  const hoveredRouteId = hover?.layer === 'arc' ? hover.data.id : undefined;

  const handleHover = useCallback(
    (
      layer: 'polygon' | 'point' | 'arc' | undefined,
      payload?: CountryFeature | DistributionCountry | TradeRoute,
    ) => {
      if (!layer || !payload) {
        setHover(null);
        return;
      }
      setHover({ layer, data: payload } as HoverState);
    },
    [],
  );

  const select = useCallback((next: Selection, target: FocusTarget) => {
    setHover(null);
    setSelection(next);
    setFocus(target);
  }, []);

  const switchMode = (nextMode: ViewMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setSelection(null);
    setHover(null);
    setFocus(
      nextMode === 'distribution'
        ? { key: 'distribution', lat: 16, lng: 34 }
        : { key: 'trade', lat: 13, lng: 112 },
    );
  };

  const showTradeForCountry = (code?: string) => {
    setMode('trade');
    setHover(null);
    if (code && data?.countries[code]) {
      const location = data.countries[code];
      setSelection({ type: 'country', code });
      setFocus({ key: `trade-${code}`, lat: location.lat, lng: location.lng });
    } else {
      setSelection(null);
      setFocus({ key: 'trade', lat: 13, lng: 112 });
    }
  };

  const resetView = () => {
    setSelection(null);
    setHover(null);
    setFocus(
      mode === 'distribution'
        ? { key: 'distribution-reset', lat: 16, lng: 34 }
        : { key: 'trade-reset', lat: 13, lng: 112 },
    );
    setResetSignal((value) => value + 1);
  };

  if (error) return <LoadingScreen error={error} />;
  if (!data || !countries) return <LoadingScreen />;

  const selectedCountry =
    selection?.type === 'country'
      ? data.countries[selection.code]?.name ?? selection.code
      : undefined;

  return (
    <main
      className={`app-shell mode-${mode}`}
      onPointerMove={(event) => setPointer({ x: event.clientX, y: event.clientY })}
      onPointerLeave={() => setHover(null)}
    >
      <div className="deep-water" aria-hidden="true" />
      <div className="scene" ref={setScene} aria-label="Interactive 3D globe">
        <Canvas
          camera={{ position: [110, 82, 332], fov: 38, near: 1, far: 2000 }}
          dpr={[1, embedded ? 1.35 : 1.7]}
          frameloop={rendering ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <GlobeScene
              rendering={rendering}
              mode={mode}
              countries={countries}
              data={data}
              year={year}
              routes={routes}
              tradeCountries={yearData?.countries ?? {}}
              hoveredCode={hoveredCode}
              hoveredDistributionCode={hoveredDistributionCode}
              hoveredRouteId={hoveredRouteId}
              selection={selection}
              focus={focus}
              resetSignal={resetSignal}
              onHover={handleHover}
              onSelect={select}
              onClear={() => setSelection(null)}
            />
          </Suspense>
        </Canvas>
      </div>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="brand">
        <h1>
          <em>Sphyrna lewini</em>
          <span>Scalloped hammerhead</span>
        </h1>
        <div className="status-line">
          <i />
          Critically Endangered
        </div>
      </header>

      <nav className="view-switch" aria-label="Map mode">
        <div className="view-button-group" role="group" aria-label="Globe view">
          <button
            className={`view-button ${mode === 'distribution' ? 'is-selected' : ''}`}
            aria-pressed={mode === 'distribution'}
            onClick={() => switchMode('distribution')}
          >
            Distribution
          </button>
          <button
            className={`view-button ${mode === 'trade' ? 'is-selected' : ''}`}
            aria-pressed={mode === 'trade'}
            onClick={() => switchMode('trade')}
          >
            Trade flow
          </button>
        </div>
        <button className="view-button reset-button" onClick={resetView}>
          Reset
        </button>
      </nav>

      <section className={`year-picker ${mode === 'trade' ? 'is-visible' : ''}`}>
        <label htmlFor="year">Reporting year</label>
        <select
          id="year"
          value={year}
          onChange={(event) => {
            setYear(Number(event.target.value));
            setSelection(null);
            setHover(null);
          }}
        >
          {Array.from({ length: 10 }, (_, index) => 2024 - index).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </section>

      <p className="mode-label" aria-live="polite">
        {mode === 'distribution'
          ? 'Where the species has been recorded'
          : 'How reported trade connects countries'}
      </p>

      <aside className={`legend ${mode === 'trade' ? 'trade-legend' : ''}`}>
        <span className="legend-heading">
          {mode === 'distribution' ? 'Distribution signals' : 'Trade signals'}
        </span>
        {mode === 'distribution' ? (
          <>
            <div>
              <i className="legend-dot occurrences" />
              <span>Occurrence density<small>GBIF mapped records</small></span>
            </div>
            <div>
              <i className="legend-country" />
              <span>Recorded country<small>national count available</small></span>
            </div>
          </>
        ) : (
          <>
            <div>
              <i className="legend-country exporter" />
              <span>Exporting country<small>reported origin</small></span>
            </div>
            <div>
              <i className="legend-country importer" />
              <span>Importing country<small>reported destination</small></span>
            </div>
            <div>
              <i className="legend-route" />
              <span>Trade relationship<small>moving dots show direction</small></span>
            </div>
          </>
        )}
      </aside>

      <section className="data-ribbon">
        {mode === 'distribution' ? (
          <>
            <div>
              <span>Mapped occurrences</span>
              <strong>{formatNumber(data.summary.totalOccurrences)}</strong>
            </div>
            <div>
              <span>Countries represented</span>
              <strong>{data.summary.occurrenceCountries}</strong>
            </div>
            <p>GBIF occurrence coverage · all available years</p>
          </>
        ) : (
          <>
            <div>
              <span>{year} trade records</span>
              <strong>{formatNumber(yearData?.records ?? 0)}</strong>
            </div>
            <div>
              <span>Country pairs</span>
              <strong>{formatNumber(yearData?.routes ?? 0)}</strong>
            </div>
            <div>
              <span>Export / import</span>
              <strong>
                {yearData?.exporters ?? 0} / {yearData?.importers ?? 0}
              </strong>
            </div>
            <p>Arc weight = comparative record count</p>
          </>
        )}
      </section>

      <div className={`selection-tag ${selection ? 'is-visible' : ''}`}>
        {selection?.type === 'route'
          ? `${selection.route.exporterName} → ${selection.route.importerName}`
          : selectedCountry ?? ''}
      </div>

      {selection && (
        <DetailPanel
          selection={selection}
          mode={mode}
          year={year}
          data={data}
          onClose={() => setSelection(null)}
          onShowTrade={showTradeForCountry}
        />
      )}

      {hover && (
        <HoverCard hover={hover} data={data} year={year} mode={mode} position={pointer} />
      )}
    </main>
  );
}
