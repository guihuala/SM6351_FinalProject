"""Regenerate the complete entry from the current team opening."""
from pathlib import Path
import sys

DIST = Path(__file__).resolve().parents[1] / 'dist'
source = (DIST / 'opening/index.html').read_text(encoding='utf-8')
head = '''  <link rel="stylesheet" href="globe-host.css?v=20261121-parent-chrome-free">
  <link rel="stylesheet" href="finale-host.css?v=20261123-smooth1">
'''
trade_chapters = '  <div class="opening-chapters decade-story-page ocean-page">\n'
next_link = '  <a class="opening-next" href="#trade-intro">Continue to annual trade data <span aria-hidden="true">→</span></a>\n'
globe_link = '  <a class="opening-next" href="#distribution-trade">Continue to the 3D globe <span aria-hidden="true">→</span></a>\n'
globe = '''
  <section id="distribution-trade" class="dv-shell globe-chapter" tabindex="-1" aria-label="Distribution and trade flow">
    <iframe class="globe-frame" src="../trade/index.html?v=scroll-performance" loading="lazy" title="Interactive 3D globe showing scalloped hammerhead distribution and reported trade flows"></iframe>
  </section>

'''
finale = '''
  <!-- Final chapter: isolated styles and scripts; earlier chapter markup is retained. -->
  <section id="finale" class="finale-host" tabindex="-1" aria-label="Final chapter: beyond one species">
    <div class="finale-window">
      <iframe id="finale-frame" class="finale-frame" data-src="../finale/index.html?integrated=1&amp;v=20261123-smooth1" title="Final chapter: threatened marine species, products and CITES records" scrolling="no"></iframe>
      <div class="finale-loading" role="status"><p>Loading the final chapter…</p><a href="../finale/index.html">Open the chapter separately</a></div>
    </div>
    <noscript><a class="finale-noscript" href="../finale/index.html">Open the final chapter</a></noscript>
  </section>
'''
script = '''<script type="module" src="globe-host.js?v=20261121-render"></script>
<script type="module" src="finale-host.js?v=scroll-performance"></script>
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
