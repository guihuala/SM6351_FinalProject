# Trade — Sphyrna lewini Distribution & Trade Flow

An interactive 3D globe that tells a single-species story in two views:

1. **Distribution** — mapped GBIF occurrence countries for the scalloped hammerhead.
2. **Trade flow** — annual CITES-reported export-to-import country relationships, 2015–2024.

The visual language uses a simplified solid-color Earth, restrained country fills, a deep-blue underwater background, and the button system from the supplied style guide.

## Run

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Do not open `dist/index.html` with a `file://` URL. Serve it through HTTP so browsers can load the local GeoJSON, textures, and data.

## Interaction

- Drag the globe to rotate and use the wheel or pinch gesture to zoom.
- Switch between **Distribution** and **Trade flow** using the top-right buttons.
- In trade mode, exporter countries use muted coral and importer countries use white.
- Hover red occurrence circles or trade arcs for contextual information.
- Click a country or trade route to pin its detail panel.
- In trade mode, use the year selector to change the annual network.
- **Reset** restores the camera and clears the current selection.

## Data preparation

The supplied comparative CSV is read by `scripts/extract-data.mjs`:

```bash
npm run prepare:data -- "C:/path/to/comptab.csv"
```

The cleaned output is `public/data/sphyrna-data.json`.

The script also requests the mapped occurrence country facet for GBIF species key `2418789` and stores the result with the trade data. The raw CSV is not modified.

## Data rules

- Only rows where `Taxon = Sphyrna lewini` are retained.
- All 399 source rows pass the species, country-code, year, and numeric-quantity checks.
- Import-side and export-side quantities remain separate.
- Quantities remain separate by product term and unit.
- Trade line weight represents comparative record count, not biological abundance or a synthesized quantity.
- Distribution counts describe mapped GBIF records and observation coverage, not population abundance.

## Sources and credits

- CITES Trade Database 2026.1 comparative CSV supplied by the project owner.
- IUCN Red List 2026-1.
- GBIF species occurrence search for `Sphyrna lewini`.
- Natural Earth country geometry.
- Deep-water background and Manrope font reused from the user-supplied Sphyrna lewini website package.

## Stack

React, TypeScript, Three.js, React Three Fiber, Drei, `r3f-globe`, and Vite.
