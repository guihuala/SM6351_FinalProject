"""Regenerate only the additive complete entry from the current team opening."""
from pathlib import Path
import sys

DIST = Path(__file__).resolve().parents[1] / 'dist'
source = (DIST / 'opening/index.html').read_text(encoding='utf-8')
head = '  <link rel="stylesheet" href="finale-host.css?v=20261120-scroll3">\n'
section = '''
  <!-- Final chapter: isolated styles and scripts; earlier chapter markup is retained. -->
  <section id="finale" class="finale-host" aria-label="Final chapter: beyond one species">
    <div class="finale-window">
      <iframe id="finale-frame" class="finale-frame" data-src="../finale/index.html?integrated=1" title="Final chapter: threatened marine species, products and CITES records" scrolling="no"></iframe>
      <div class="finale-loading" role="status"><p>Loading the final chapter…</p><a href="../finale/index.html">Open the chapter separately</a></div>
    </div>
    <noscript><a class="finale-noscript" href="../finale/index.html">Open the final chapter</a></noscript>
  </section>
'''
script = '<script type="module" src="finale-host.js?v=20261120-scroll3"></script>\n'
assert all(source.count(tag) == 1 for tag in ('</head>', '</main>', '</body>'))
assert 'id="finale"' not in source, 'The team entry already contains a final chapter; review the new integration.'
result = source.replace('</head>', head + '</head>').replace('</main>', section + '</main>').replace('</body>', script + '</body>')
assert result.replace(head, '').replace(section, '').replace(script, '') == source
target = DIST / 'opening/complete.html'
if '--verify' in sys.argv:
    assert target.read_text(encoding='utf-8') == result, 'Complete entry is out of date.'
    print('Complete entry contains the current team page plus the final chapter.')
else:
    target.write_text(result, encoding='utf-8')
    print(target)
