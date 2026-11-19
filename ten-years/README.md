# A decade of trade — real CITES data

The [main site](dist/opening/index.html) opens with the underwater scenes and trade overview, followed by a fin trade introduction and the annual charts. The [standalone page](dist/project.html#annual-trade) also opens the annual charts. Both routes use the same frozen official CITES extract for 2015 to 2024.

## Current chart layout

The annual chart shows one column per year. Hovering over a column selects its year and displays the exact weight above the chart. Focusing a column previews its value, and keyboard or touch activation selects it. The selected column has an underline, and the displayed weight fades into place when the year changes. The chart opens on 2024. Wheel and swipe also browse years.

Use **Product forms** or continue scrolling to reach the next chapter. The three specimens identify FIN, DFN and FFN. Their bars use one kilogram scale for the selected year, with exact weights by each name. An observed zero is marked at the origin and a missing observation reads “No records.” Both chapters share the year, including changes made with the **Year** selector on the product page. Hovering over a product image or activating its button selects that product in the annual chart while preserving the year. The standalone charts open on exporter-reported data for all sources. The embedding API can change the reporting side and source together for both charts.

`window.decadeView` is the shared standalone instance. The previous `window.decadeChapters.annual` and `.forms` handles both refer to that instance. Link to the charts with `#annual-trade` or `#product-forms`. The unconfigured `MarineDecade.mount` API still supports the original two-scene mode for embedders.

The following sections document previous iterations and the underlying data and embedding API.

## Previous composition

The chapter now uses an editorial layout: a compact header and view/filter toolbar, a single horizontal year/quantity/change summary, a full-width unframed chart, a compact policy annotation and one connected timeline. The previous large left column, chart card and repeated year/product labels have been removed from the visible composition. At 1280×720 the plot width is about 1178px, compared with about 799px in the preceding layout.

Policy dates and scope are progressively disclosed through the existing Scope & dates dialog, with source links and event pagination retained. Phone year controls use a horizontally scrollable strip that keeps the selected year in view. All previous year, playback, keyboard, wheel/touch, filtering and data-method controls remain available. Summary text fades out before the next chart summary fades in, avoiding overlapping labels during view switches. The existing palette and bundled font families are retained; light intensity is reduced to support the simpler hierarchy.

Visual QA covered 1280×720, 1024×768, 375×667, 320×568 and 844×390, including missing records, product forms, policy pagination/details and the data/filter dialog. Current captures: `preview-editorial-desktop.jpg` and `preview-editorial-mobile.jpg`. The sections below document prior iterations; the current chapter layout above takes precedence.

## Design update

See the [project design standard](../design/DESIGN-STANDARD.md) for the approved palette, typography scale, bundled fonts and original references.

The chapter follows the supplied Abyssal Bloom palette: abyssal black background, deep blue surfaces, cobalt controls, cyan chart highlights, silver text, and restrained copper policy markers. Manrope headings and Inter body copy follow the supplied responsive type scale. Manrope Medium 500 and Inter Regular 400 / Medium 500 are bundled locally, together with their SIL Open Font Licenses; no font network request is required. The supplied desktop/mobile scales are H1 96/44, H2 48/32, H3 28/24, lead 20/18, body 18/16, captions 14/14 and buttons 16/16 px. Chart marks and dialogs use the same scoped theme tokens.

Each desktop/mobile chapter fits its viewport. Wheel/touch input explores its years, with boundary navigation between the two chapter sections; dialogs scroll internally. Compact chapter title/data-label sizes adapt to available height; bundled typography and palette tokens remain in use.

## Preview

The first chart-stage refinement gives the plots a wider desktop column, a restrained deep-blue glow and a rounded frame. Grid lines and supporting dividers are quieter; the footer explains scroll/swipe exploration, retains the keyboard alternative on desktop, and displays the current view as 01/02 or 02/02. Existing year, playback, filter and data controls remain in place. The frame uses compact padding on phones and short screens, within the fixed chapter layout. Palette and bundled fonts are unchanged; no new animation or external asset is added.

Localhost visual QA covered 1280×720, 1024×768, 390×844, 375×667, 844×390 and 320×568. Phone missing-data copy now spans the summary width. At phone heights of 620px or less, years use a horizontally scrollable strip that keeps the selected year visible; policy dates and scope remain available in the Scope & dates dialog, while the compact row shows the title and source/details controls. Compact product bars use smaller spacing to avoid label/track overlap. Browser checks included view/year selection, keyboard navigation, playback to its endpoint, product filtering and policy details. Preview captures are saved as `preview-stage-desktop.jpg`, `preview-stage-mobile.jpg` and `preview-stage-small-phone.jpg`.

Run a local server from the `ten-years` directory to preview the full page, including the 3D models:

```sh
python3 -m http.server 8765 --directory dist
```

Open [http://localhost:8765/](http://localhost:8765/).

Scroll down/up to move continuously through two scenes. Global progress 0–9 explores annual quantities, 9–11 crossfades to Product forms, and 11–20 explores product forms. The year fades out during the scroll transition and resets to 2015 in the second view; reversing retraces the transition. Releasing at the exact transition midpoint completes toward the scrolling direction. View buttons crossfade while preserving the selected year; year buttons/arrows remain local to the active view. Touch movement follows the same timeline. On release, motion settles smoothly to a nearby year. Year buttons, arrow keys and playback remain available. Annual figures remain actual year totals; animation positions do not create additional observed quantities. Missing intervals are not connected.

## Official source

CITES Trade Database (2026). Compiled by UNEP-WCMC for the CITES Secretariat. Available at [trade.cites.org](https://trade.cites.org/en/cites_trade). Accessed **4 November 2026**.

- Source: live-query **comparative tabulation** (`comptab`), not the static full shipment database.
- Accepted taxon: *Sphyrna lewini*, official taxon ID **6544**.
- Query: 2015–2024, all countries, sources, purposes and terms. The exact download URL is in `dist/data/provenance.json`.
- Official response: **41,814 bytes, 399 comparative rows**. The original file is retained unmodified.
- SHA-256: `a06c0cc08b405945bc72d66b96b2d2076c3027589b9b5412b4a73dcf62895586`.
- This is a live-query snapshot accessed in 2026, **not** labelled as the static 2026.1 database release. Later downloads can differ as reports are updated.

The official [interpretation guide](https://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf) explains comparative aggregation, reporting-side differences, units and re-exports. These are essential to interpreting the numbers.

## Displayed scope

Default: **fins (FIN), kg, exporter-reported, all sources**.

The Filters panel offers three separate fin products:

| Official term | Code | Handling |
| --- | --- | --- |
| fins | FIN | Default series |
| fin (dried) | DFN | Separate series |
| fin (wet) | FFN | Separate series |

These products are never summed. The frozen extract first records DFN in 2022 and FFN in 2024. This does not establish the introduction date of a code or the start of that trade. A change in FIN alone does not describe all fin forms.

Only rows explicitly reported in **kg** and Appendix I–III are retained; all retained rows happen to be Appendix II. Other units are excluded, not converted. Of 245 fin-product comparative rows:

- 146 kg rows are retained.
- 64 blank-unit, 33 “Number of specimens”, one g and one cm³ row are excluded.
- The other 154 rows in the original extract concern non-fin terms and are excluded.

Importer and exporter quantity columns are split into independent records, producing **194 reporting-side rows** across all three fin products (103 exporter, 91 importer). Blank side quantities are omitted, not zero-filled. Numeric zero remains zero. Main figures and CSV exports use a fixed reporting side; the two sides are never added.

The table's **Data rows** count refers to non-missing comparative groups on the selected reporting side. It is **not** a count of original reports, transactions, shipments or animals. Direct trade and re-exports are included; quantities do not represent unique animals or harvest. All purposes and sources are included by default, including any confiscated/seized-source entries. Wild-only filtering selects source W.

## Default FIN annual audit, kg

| Year | Exporter-reported | Importer-reported |
| --- | ---: | ---: |
| 2015 | 7,302.970 | 7,741.310 |
| 2016 | 15,622.920 | 9,119.710 |
| 2017 | 14,410.170 | 5,827.510 |
| 2018 | 6,253.550 | 2,934.300 |
| 2019 | 8,177.660 | 6,993.400 |
| 2020 | 14,248.061 | 11,759.210 |
| 2021 | 43,126.301 | 18,792.320 |
| 2022 | 28,909.014 | 2,765.160 |
| 2023 | 18,241.690 | 1,953.244 |
| 2024 | 10,513.760 | 79.200 |

Differences between the sides are retained. The latest year's small importer total must not be interpreted as total trade or conservation improvement. Coverage and quantities may change with subsequent reporting. No population comparison or effectiveness claim is made.

## Reproducibility and files

- `data/raw/cites-sphyrna-lewini-2015-2024-comptab.csv`: original official extract.
- `data/raw/cites-response-headers.txt`: response headers, including byte length and timestamp.
- `data/raw/cites-sphyrna-lewini-taxon.json`, `cites-trade-terms.json`: official taxon and term lookups.
- `scripts/build_cites_dataset.py`: filters the frozen extract, splits reporting sides, uses Decimal for annual audit totals and generates browser assets. Rejects a changed original checksum.
- `scripts/verify_cites_dataset.cjs`: verifies the source checksum, all 120 annual product/source/side aggregates and counts, known FIN totals, missing vs zero, normalized CSV roundtrip, and absence of a demo generator.
- `dist/data/cites-fins-2015-2024.js`: bundled real records; works without network access or a server.
- `dist/data/cites-fins-2015-2024.csv`: normalized reporting-side records, including original quantities and original comparative CSV row numbers.
- `dist/data/annual-audit.json`: exact Decimal-derived annual totals.
- `dist/data/provenance.json`: source URLs, scope, exclusions and checksum.
- `dist/data/cites-sphyrna-lewini-2015-2024-comptab.csv`: downloadable copy of the unmodified official extract.

```sh
python3 scripts/build_cites_dataset.py
node scripts/verify_cites_dataset.cjs
```

## Integration

Load `style.css`, `data.js`, `data/cites-fins-2015-2024.js`, `data/cites-management-events.js`, `motion.js`, `flow.js`, then `app.js`. Provide a container with an explicit height and call:

```js
const chapter = MarineDecade.mount(container, { releaseAtBoundary: true });
chapter.setYear(2021); // smooth year transition in the current view
chapter.setView('forms'); // crossfade, preserving the current selected year
chapter.play();
chapter.pause();
chapter.getState(); // year, view, local position/targetPosition, global progress/targetProgress, transitioning, filters, playing
chapter.destroy();
```

Styles are scoped to `.dv-shell`. Do not copy the standalone body class into the host project. Wheel and keyboard listeners remain local to the chapter. `decade:year-change`, `decade:view-change` and `decade:boundary` events allow chapter coordination. Optional `wheelPixelsPerYear` (180) and `playInterval` (1,400 ms/year) tune motion. Reduced-motion preferences disable reels, crossfades and cursor interpolation; the scroll transition advances directly between views. `mount(container, {view:'forms', year:2024})` can initialize the second scene. Playback traverses both scenes and ends at Product forms 2024; replay there restarts Annual quantity 2015. Pausing, filter interaction or opening a dialog stops playback. The host receives boundary events only at the beginning/end of the entire scroll sequence.

CSV replacement imports remain browser-local. They must use the normalized template with `Year,Quantity,Unit,Term,Reporter.type,Taxon,Importer,Exporter,Source,Appendix`; use the official term labels above. Imported files are labelled separately and the bundled provenance panel is hidden to avoid attributing a replacement file to this frozen extract.

Six selected management records are bundled in `dist/data/cites-management-events.json` and its browser JS equivalent. See [EVENTS.md](EVENTS.md) for verification and exclusions. They display at corresponding years, with source links and a scope/date details dialog. The policy row reserves its height to keep scroll animation and chart geometry stable. National measures remain contextual; they do not create lines or quantitative thresholds on the global curve. Reviews are explicitly not bans. No events are invented for empty years.

`setEvents()` accepts the existing exact-filter schema or the bundled context schema. Provider imports replace the event register and are not independently verified. Context events require `verified`, exact taxon, year list, product list, safe source URLs, title, scope, date and type. A year-only date remains a year; no first-of-January default is invented. Legacy events are also displayed only as context; their filter labels are not proof of geographic applicability.


## Product forms and verification

Product forms now uses three directly labelled horizontal bars for the selected year, on one linear kg scale fixed across all ten years and products for the selected reporting side/source. Scrolling changes the year and bar lengths. It does not sum products, compute composition percentages or imply equal biomass. Fins (FIN) is displayed as “Fins, unspecified (FIN)” to distinguish it from the explicit dried/wet terms. Missing years show “No records” and a dashed empty baseline, while reported zero remains 0 kg. The scale changes only with shared filters or data replacement.

Numeric labels are actual annual totals. Bar lengths interpolate only between adjacent observed quantities; an isolated record fades in at its reported weight instead of growing from an invented zero. Reduced motion shows the annual state directly.

With default exporter/all-source filters, DFN has records in 2023–2024 (6,279.61 and 7,178.61 kg), and FFN has one in 2024 (1,313 kg). Importer DFN records begin in 2022. The direct bar labels, full 30-row data table and filtered CSV show each product separately; all share the current reporting side/source. Annual quantity retains its selected single product when returning from Product forms. Product selection is hidden in the forms view.

Policy events are shared contextual cards in both views; forms matches events relevant to any of the three products. They do not add global restriction lines or quota thresholds. The row retains its geometry and becomes non-interactive during transitions. Source references and scope/date dialogs are unchanged.

Run `node scripts/verify_motion.cjs` in addition to the two existing verification scripts. It checks the two-scene mapping, reversible transitions, year bounds, reduced-motion snapping, release direction and missing-data cursor behavior. Browser QA covers both scenes, shared filters, preserved years, policy pagination/details, playback, forward/reverse wheel transitions and 1280×720, 390×844, 375×667 and phone-landscape layouts.


## Transition refinement

Scene blending now uses a quintic easing envelope. Scroll resets fade 2024 out with a restrained upward drift, replace it only inside a fully transparent central interval, and fade 2015 in from below. The reverse scroll follows the same envelope. Chart captions and policy context follow the reset fade; direct view switches preserve the year and crossfade over 680 ms.

Policy content has a separate phase inside the existing animation clock: 120 ms out, replace text at zero opacity, wait for 90 ms of stable timeline motion, then 280 ms in. Rapid year/page requests coalesce to the most recent content, including empty years. Outgoing or near-invisible links remain inert. No new timer, decorative overlay or layout movement is introduced. Reduced-motion skips these effects. `node scripts/verify_policy_motion.cjs` verifies replacement timing, rapid requests, empty years and reduced motion; `verify_motion.cjs` also checks the invisible reset interval and forward/reverse symmetry.


## Clear controls

The two views are numbered and named. Previous, Play/Pause/Replay and Next have visible text alongside their icons. Year buttons retain the active-year underline/background; hovering over another year no longer resembles selection. Playback still uses the same clock and the reset/policy fade behavior above. Compact mobile layouts retain all controls and the fixed single screen. Asset query versions prevent the local preview reusing a previous chart script/style after this update.


## Continuous motion refinement

Year reels now use the same smooth easing as the timeline. Annual metrics use a subtle phase-linked opacity/position envelope instead of a separate Web Animation on every year change; displayed values remain actual annual totals. Scene transitions use complementary fades and at most 8px of vertical travel on the chart layers, keeping scales and the stage frame fixed. Direct view changes take 680ms, preserve the selected year and can reverse from the current blend.

Policy information follows the year reveal. During rapid scrubbing, new policy content waits until the timeline approaches its target before fading in; interrupted waits restart and pending content coalesces to the latest year. The existing animation clock drives all phases. Hidden/outgoing policy links remain inert, and reduced-motion mode skips the new offsets, fades and waits.

Verified the new fade envelopes, reversible motion, policy reveal order, interrupted waits, missing/zero values and reduced-motion states with the motion scripts. Localhost browser checks covered rapid year requests, interrupted view switches, forward/reverse scroll transitions and 375×667 phone layout.


## Deep-sea atmosphere

A decorative, aria-hidden layer adds low-intensity light using the existing surface and secondary palette tokens. Desktop mouse input gently shifts that layer by at most 32px horizontally and 18px vertically, with a 240ms exponential response. The chart stage retains its opaque abyssal background and existing static gradient, so the moving light cannot change graph contrast or geometry. The decorative layer is clipped to avoid adding hidden scroll overflow and never intercepts input.

Mouse movement does not alter year, playback, chart coordinates or filters. Pointer leave, keyboard/focus interaction and window blur return the light to center. Touch, coarse-pointer and phone-width views use static light. Reduced-motion changes and hidden tabs immediately cancel ambient updates; the finite animation loop stops once settled, and all listeners/frames are cleaned up on destroy. No continuous particle loop, bitmap asset or external dependency is added.

Run `node scripts/verify_atmosphere.cjs` for mouse bounds, event coalescing, idle stop, reset behavior, touch/reduced-motion exclusions and cleanup. Localhost QA confirmed identical chart geometry and values before/after mouse input, working year/view controls, no additional shell scrolling, and static light at 375×667. Preview captures: `preview-deep-light-desktop.jpg` and `preview-deep-light-mobile.jpg`.


## Further decluttering

Product forms now has a compact year-only summary. Its reporting-side/source caption stays visible, numeric bar labels omit repeated unit suffixes, and kg is identified on the shared scale and in accessible row labels. The two former chart footnotes are consolidated into one fixed-scale/biomass caveat, which remains visible on small and short screens. Annual quantity places kg in its caption and shows only the start/end year labels inside the plot; all year hit areas, labels for assistive technology and timeline controls are preserved.

The exploration hint fades over 220ms after a real timeline/view/control interaction and then releases its layout space. Reduced-motion mode hides it immediately. API-driven initial years do not dismiss it, and persistent screen-reader instructions remain associated with the chapter using aria-describedby. The existing animation clock handles dismissal; the chart resize observer redraws geometry after the released space or view-summary height changes.

Localhost QA confirmed that hint dismissal increases the 1280×720 chart height from 276px to 300px, leaves only 2015/2024 axis labels, and preserves screen-reader instructions. Product forms was inspected at 375×667, 320×568 and 844×390 with the fixed-scale caveat visible and no overlapping labels. Current previews: `preview-declutter-desktop.jpg` and `preview-declutter-mobile.jpg`.


## Inspect and explore

Annual quantity supports a separate observation preview: moving a mouse over the plot or year buttons shows a hollow marker, guide and actual annual quantity. Keyboard focus on a graph point/year button shows the same preview. A preview never changes the selected year or filters. Clicking a plot column or confirming a focused graph point selects that year using the existing timeline. Missing observations show No records without a fabricated marker or zero. Preview UI is hidden during playback, scene transitions, rebuilds and on pointer/focus exit. Native labels remain available to assistive technology.

Product rows are native buttons with small directional affordances. Activating one selects that product and opens Annual quantity at the current year, retaining reporting side/source. A live status confirms the change. Missing products remain explorable. Vertical touch movement starting on a product row still scrubs the timeline; a swipe suppresses drill-in activation, while a tap activates it. Timeline dots and the play icon provide restrained hover feedback; reduced-motion mode skips their displacement.

Run `node scripts/verify_exploration.cjs` for responsive hit mapping, boundary clamping and product tap/swipe behavior. Browser QA covered preview without selection, keyboard confirmation, mobile product drill-in with retained year and filters, missing-product drill-in, missing-value preview and 320px/375px product-row layout. Current captures: `preview-explore-inspector.jpg` and `preview-explore-products-mobile.jpg`.


## Continuous deep-sea flow

A dedicated canvas layer now draws broad, shaded ribbons instead of relying only on the earlier finite gradient shift. The decorative field drifts continuously, bends with mouse movement and responds to timeline direction/scroll impulses. It never reads trade quantities or modifies chart geometry, scales, labels, filters or timeline progress. A cached mask removes the flow completely from the chart stage and foreground reading areas; a feathered surround blends those protected regions into the background.

The wave icon independently pauses/resumes background flow. On phones it sits beside the playback area, with reserved spacing on 320px screens. Reduced-motion preferences use a static field and disable animation; hidden tabs, offscreen chapters and open dialogs suspend drawing. Desktop rendering is capped at 30fps and DPR 1.5; phones use 20fps and DPR 1. The existing tooltip/plot selection and product drill-in remain available. Embedders that omit the optional flow module get the existing static atmosphere with the flow toggle hidden.

Run `node scripts/verify_flow.cjs` for bounded geometry, opaque reading-area masks, capped resolution, a single scheduled animation frame, pause/resume, reduced motion, hidden-tab suspension and cleanup. Browser QA confirmed identical consecutive screenshots while paused and differing frames while running, unchanged chart dimensions/year/quantity after mouse input, 375×667 and 320×568 layouts without scrolling/overlapping controls, and retained product drill-in. These continuous-flow behaviors supersede the earlier finite-atmosphere-only description.

### 跨章光流與捲動

獨立頁的兩章共用一個固定光流畫布，換章沿用相同動畫時鐘、滑鼠狀態與暫停設定。章節之間的小段留白承接光帶，閱讀區遮罩跟隨文件捲動，圖表、數字與操作保持清晰。頁首箭頭及時間軸邊界換章使用漸進起步／收尾，新的捲動、觸碰或按鍵會立即接管；減少動態效果時直接到達章節。

驗證：`node ten-years/scripts/verify_chapter_scroll.cjs`、`node ten-years/scripts/verify_flow.cjs`、`node ten-years/scripts/verify_story.cjs`。

### 粒子雕塑開場

視覺參考：https://lusion.co/about。重做其立體粒子聚散的互動原理，使用本機繪製的粒子與專案色盤；沒有引用原站模型、影片或程式。開場可用滑鼠撥動、點擊擴散，手機可點觸。捲入資料章節後縮至邊緣，仍由閱讀區遮罩保護圖表；開場與兩章共用暫停設定。減少動態效果時維持靜態造型。桌面上限 5,400 粒、手機 1,800 粒，沿用既有畫面更新率及解析度上限。

`node ten-years/scripts/verify_particle_sculpture.cjs` 驗證造型、擴散回聚、暫停、捲動變形與手機粒子上限。

### 光絲與圖表連動

粒子改為細小的中心微光與稀疏光絲，去掉大顆球體的高光外觀。開場粒子進入資料章節時，依實際圖表位置展開為閱讀區上方的細流；所選年份決定局部聚光位置，產品章節展開為三股流線。流線不表示交易量，整個圖表閱讀區仍有遮罩保護。

年度圖的細微光點固定在原有資料游標位置，產品長條末端標記使用原有共同比例；兩者沒有獨立循環動畫。缺值不顯示標記，報告零值不產生正長度端點。資料、比例尺、原始折線與操作均維持原邏輯。

新增檢查：`node ten-years/scripts/verify_chart_particles.cjs`。本輪瀏覽器畫面確認受自動審核連線中斷影響，待補做；程式、互動與資料檢查已通過。
