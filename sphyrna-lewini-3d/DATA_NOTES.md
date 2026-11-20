# Data notes

## Cleaning scope

- Species filter: exact match on `Sphyrna lewini`.
- Time window: 2015–2024 inclusive.
- Country validation: two-letter import and export codes must be present and different.
- Numeric parsing: thousands separators are removed; blank values remain `null`.
- Product terms are trimmed and lowercased.
- Blank units are retained as `unit not reported`; `Number of specimens` is normalized to `specimens`.
- All 399 supplied rows remain in the cleaned dataset.

## Distribution layer

The distribution view uses the country facet returned by the GBIF occurrence API for species key `2418789`, filtered to records with coordinates. It contains 27,246 mapped records represented across 85 countries.

The circles represent mapped occurrence-record density. They do not represent abundance, population size, catch volume, or complete biological range.

## Trade layer

Trade records are grouped by year, exporter, and importer for visualization. The annual map contains 289 aggregated country relationships across the ten-year window.

Arc weight represents the number of comparative records. It is not a conversion of kilograms into specimens or a combined cross-product quantity.

The detail panel shows importer-reported (`IM`) and exporter-reported (`EX`) quantities side by side. They are not summed.

## Missingness and interpretation

A country without a matching annual trade record is not labeled as zero trade. It only means that no matching record appeared in this frozen comparative export.

Countries and routes describe reported trade relationships, not confirmed shipping paths or transaction coordinates.

## Sources

- CITES Trade Database 2026.1
- IUCN Red List 2026-1
- GBIF species 2418789
- Natural Earth boundaries
