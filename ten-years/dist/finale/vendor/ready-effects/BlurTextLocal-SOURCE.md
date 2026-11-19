# Blur Text local tag adapter

Official project: https://github.com/DavidHDev/react-bits
Upstream component: src/content/TextAnimations/BlurText/BlurText.jsx
Pinned commit: 14330e6963f6c5ddd773ee2af844d0630c22b958
Source URL: https://raw.githubusercontent.com/DavidHDev/react-bits/14330e6963f6c5ddd773ee2af844d0630c22b958/src/content/TextAnimations/BlurText/BlurText.jsx
Retrieved: 2026-11-18
License: MIT + Commons Clause, retained in this vendor directory.

BlurText.jsx remains the unmodified upstream component. BlurTextLocal.jsx is its local copy with one compatibility change: an optional `tag` prop (default `p`) controls the outer text tag. Heading islands pass `span` so the original `h2` can be retained with valid phrasing content. The animation implementation, props, effects, and timing algorithm are unchanged. The closing title continues to use the unmodified BlurText.jsx.

Local integration: ../../ready-headings.jsx. It uses a word-based blur reveal; SplitText.jsx is retained for provenance but is no longer used by the heading adapter.
