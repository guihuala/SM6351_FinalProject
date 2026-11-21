"""Regenerate the complete entry from the current team opening."""
from pathlib import Path
import sys

DIST = Path(__file__).resolve().parents[1] / 'dist'
source = (DIST / 'opening/index.html').read_text(encoding='utf-8')
head = '''  <link rel="stylesheet" href="globe-host.css?v=20261121-scroll">
  <link rel="stylesheet" href="finale-host.css?v=20261120-scroll3">
'''
trade_chapters = '  <div class="opening-chapters decade-story-page ocean-page">\n'
next_link = '  <a class="opening-next" href="#trade-intro">Continue to annual trade data <span aria-hidden="true">→</span></a>\n'
globe_link = '  <a class="opening-next" href="#distribution-trade">Continue to the 3D globe <span aria-hidden="true">→</span></a>\n'
globe = '''
  <section id="distribution-trade" class="dv-shell globe-chapter" tabindex="-1" aria-labelledby="distribution-trade-title">
    <header class="globe-header">
      <h2 id="distribution-trade-title">Distribution and trade flow</h2>
      <nav class="globe-links" aria-label="3D globe chapter navigation">
        <a href="../sphyrna/index.html?v=20261121-render" target="_blank" rel="noopener">Open globe in a new tab</a>
        <a href="#trade-intro">Continue to Fin trade <span aria-hidden="true">↓</span></a>
      </nav>
    </header>
    <p class="globe-gestures"><span class="globe-zoom-key">Hold Shift and scroll to zoom.</span><span class="globe-zoom-touch">Pinch to zoom.</span></p>
    <iframe class="globe-frame" src="../sphyrna/index.html?v=20261121-render" loading="lazy" title="Interactive 3D globe showing scalloped hammerhead distribution and reported trade flows"></iframe>
    <nav class="globe-links" aria-label="Adjacent chapters">
      <a href="#trade-products">Trade overview <span aria-hidden="true">↑</span></a>
      <a href="#trade-intro">Continue to Fin trade <span aria-hidden="true">↓</span></a>
    </nav>
  </section>

'''
finale = '''
  <!-- Final chapter: isolated styles and scripts; earlier chapter markup is retained. -->
  <section id="finale" class="finale-host" aria-label="Final chapter: beyond one species">
    <div class="finale-window">
      <iframe id="finale-frame" class="finale-frame" data-src="../finale/index.html?integrated=1&amp;v=20261120-closing1" title="Final chapter: threatened marine species, products and CITES records" scrolling="no"></iframe>
      <div class="finale-loading" role="status"><p>Loading the final chapter…</p><a href="../finale/index.html">Open the chapter separately</a></div>
    </div>
    <noscript><a class="finale-noscript" href="../finale/index.html">Open the final chapter</a></noscript>
  </section>
'''
script = '''<script type="module" src="globe-host.js?v=20261121-render"></script>
<script type="module" src="finale-host.js?v=20261121-render"></script>
'''
assert all(source.count(part) == 1 for part in ('</head>', '</main>', '</body>', trade_chapters, next_link))
assert 'id="distribution-trade"' not in source and 'id="finale"' not in source, 'The team entry already contains an integrated chapter.'
result = (
    source.replace('</head>', head + '</head>')
    .replace(next_link, globe_link)
    .replace(trade_chapters, globe + trade_chapters)
    .replace('</main>', finale + '</main>')
    .replace('</body>', script + '</body>')
)
assert result.replace(head, '').replace(globe_link, next_link).replace(globe, '').replace(finale, '').replace(script, '') == source
target = DIST / 'opening/complete.html'
if '--verify' in sys.argv:
    assert target.read_text(encoding='utf-8') == result, 'Complete entry is out of date.'
    print('Complete entry contains the current team page, the 3D globe and the final chapter.')
else:
    target.write_text(result, encoding='utf-8')
    print(target)
