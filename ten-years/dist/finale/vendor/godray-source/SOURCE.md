# GodrayFilter source

Project: PixiJS Filters
Source: https://github.com/pixijs/filters
Commit: e9d1ca987864f121680bb0d7e9612c05b37748de
Retrieved: 2026-11-18
License: MIT (see LICENSE.txt)
Original effect credited by upstream to Alain Galvan.

The original shader and noise source are retained unchanged here. The local module ../../js/water-light.js adapts the shader interface to Three.js, changes the output to a transparent cyan light layer, and limits its intensity, animation rate, and rendering resolution. This is an atmospheric visual treatment, not a physical simulation or data encoding.

Official documentation: https://pixijs.io/filters/docs/GodrayFilterOptions.html
