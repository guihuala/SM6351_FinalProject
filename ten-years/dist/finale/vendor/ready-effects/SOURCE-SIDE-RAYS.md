# React Bits Side Rays

Official repository: https://github.com/DavidHDev/react-bits

Pinned commit: ed33ebe4acfe29e60fb759bcccc70a138ce2dcef

Source: https://github.com/DavidHDev/react-bits/blob/ed33ebe4acfe29e60fb759bcccc70a138ce2dcef/src/content/Backgrounds/SideRays/SideRays.jsx

Retrieved: 2026-11-18

License: MIT + Commons Clause; see SideRays.LICENSE.md.

SideRays.jsx and SideRays.css are the unmodified upstream source.

The website imports SideRaysLocal.jsx, a copy with only these lifecycle changes:

- A `paused` prop is forwarded through `settingsRef` and checked by the render
  scheduler and frame callback. This suspends invisible light completely.
- Pointer handlers return immediately when mouse following is disabled or the
  component is paused. The website never follows the pointer or uses click pulses.
- The existing reduced-motion media query is reread when a frame is requested,
  so changing the system preference does not leave a component permanently frozen.
- An introductory source comment points to this record.

All GLSL shader strings and all geometry, color, beam and noise algorithms are
unchanged. Runtime prop updates already use upstream's `settingsRef`, so changing
the risk palette does not rebuild the WebGL program or canvas. The small React
island in `src/ready-light.jsx` mounts exactly two instances, one per side. Its
CSS masks leave the center of the teammate's deep-blue background unobstructed.

The island freezes movement for reduced-motion and the page's Motion-off state,
continues to reflect palette changes in a static frame, and fully pauses when
the document is hidden or the risk palette has zero weight.

The bundled renderer caps each decorative canvas at approximately 260,000
drawing pixels. The CSS positions, dimensions, masks and shader are unchanged.
