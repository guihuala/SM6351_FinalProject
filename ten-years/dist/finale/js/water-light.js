import * as THREE from '../vendor/three.module.js';

// Adapts the MIT-licensed PixiJS GodrayFilter by Mathew Groves / Chad Engler,
// with the original effect credited upstream to Alain Galvan.
// Unchanged upstream shaders, the pinned source, and license are retained in
// ../vendor/godray-source/. This is a decorative light layer, not data.
const SOURCE = new URL('../vendor/godray-source/', import.meta.url);
const FRAME_MS = 1000 / 24;

/**
 * Soft underwater light over the existing ocean image. The caller owns the
 * canvas size, stacking, and CSS opacity. No surface, particles, or geometry
 * beyond a single screen-sized plane are drawn.
 */
export function mountWaterLight(canvas) {
  let renderer, material, geometry, scene, camera, observer;
  let destroyed = false, active = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animation = 0, previousFrame = 0, time = 0, depth = 0, contextLost = false;
  let paletteMix = [0, 0, 0];
  const request = new AbortController();
  canvas.dataset.lightStatus = 'loading';

  function cancelFrame() {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    previousFrame = 0;
  }

  function running() {
    return !destroyed && active && !document.hidden && !contextLost && renderer && material;
  }

  function render() {
    if (!renderer || destroyed || contextLost) return;
    renderer.render(scene, camera);
  }

  function tick(now) {
    animation = 0;
    if (!running()) return;
    if (!previousFrame || now - previousFrame >= FRAME_MS) {
      const elapsed = previousFrame ? Math.min((now - previousFrame) / 1000, .1) : 0;
      previousFrame = now;
      time += elapsed * .24;
      material.uniforms.uTime.value = time;
      render();
    }
    animation = requestAnimationFrame(tick);
  }

  function start() {
    if (running() && !animation) animation = requestAnimationFrame(tick);
  }

  function resize() {
    if (!renderer || destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width || innerWidth);
    const height = Math.max(1, bounds.height || innerHeight);
    const scale = Math.min(.5, 1280 / Math.max(width, height));
    const renderWidth = Math.max(1, Math.round(width * scale));
    const renderHeight = Math.max(1, Math.round(height * scale));
    renderer.setSize(renderWidth, renderHeight, false);
    material.uniforms.uDimensions.value.set(renderWidth, renderHeight);
    material.uniforms.uInputSize.value.set(renderWidth, renderHeight, 1 / renderWidth, 1 / renderHeight);
    material.uniforms.uAspect.value = renderHeight / renderWidth;
    render();
  }

  function applyDepth() {
    if (!material) return;
    // Light gradually recedes as the scroll enters the darker ocean.
    const angle = THREE.MathUtils.degToRad(16 + depth * 4);
    material.uniforms.uLight.value.set(Math.cos(angle), Math.sin(angle));
    const base = [.21 - depth * .04, .68 - depth * .07, .92];
    const palettes = [
      [213 / 255, 184 / 255, 119 / 255], // navigation gold #d5b877
      [201 / 255, 137 / 255, 99 / 255],  // navigation copper #c98963
      [217 / 255, 116 / 255, 107 / 255], // navigation coral #d9746b
    ];
    const total=paletteMix.reduce((sum,value)=>sum+value,0);
    // Keep the default blue light unchanged; warm accents are 20% quieter.
    material.uniforms.uStrength.value = (.62 - depth * .25) * (1 - .2 * Math.min(1,total));
    material.uniforms.uBlueTint.value.setRGB(...base);
    material.uniforms.uWarmMix.value = Math.min(1,total);
    const scale=Math.max(.0001,total);
    material.uniforms.uTint.value.setRGB(...base.map((_,channel)=>palettes.reduce((sum,color,index)=>sum+color[channel]*paletteMix[index]/scale,0)));
  }

  function onVisibility() {
    if (document.hidden) cancelFrame();
    else start();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    cancelFrame();
    canvas.dataset.lightStatus = 'fallback';
  }

  function onContextRestored() {
    contextLost = false;
    canvas.dataset.lightStatus = 'ready';
    resize();
    start();
  }

  async function initialise() {
    try {
      const sources = await Promise.all(['god-ray.frag', 'perlin.frag'].map(async name => {
        const response = await fetch(new URL(name, SOURCE), { signal: request.signal });
        if (!response.ok) throw new Error(`Light source unavailable (${response.status})`);
        return response.text();
      }));
      if (destroyed) return;

      // Keep the upstream noise and ray computation. Only adapt its interface
      // from a Pixi image filter to a transparent Three.js fullscreen layer.
      const fragment = sources[0]
        .replace('in vec2 vTextureCoord;', 'varying vec2 vTextureCoord;')
        .replace('out vec4 finalColor;', 'uniform vec3 uTint;\nuniform vec3 uBlueTint;\nuniform float uStrength;\nuniform float uWarmMix;')
        .replace('uniform sampler2D uTexture;', '')
        .replace('${PERLIN}', sources[1])
        .replace(/^\s*(?:vec2 uDimensions = uDimensions;|bool uParallel = uParallel > 0\.5;|vec2 uLight = uLight;|float uAspect = uAspect;|float uTime = uTime;|vec3 uRay = uRay;)\s*$/gm, '')
        .replace('if (uParallel) {', 'if (uParallel > 0.5) {')
        .replace('finalColor = texture(uTexture, vTextureCoord) + mist;',
          `// Project two soft shafts down and inward from above the viewport.
    // Time is the upstream noise clock; convert it back to wall-clock seconds.
    float seconds = uTime / 0.24;
    float leftSway = sin(seconds * 0.262) * 0.017;
    float rightSway = sin(seconds * 0.224 + 1.9) * 0.015;
    float leftAxis = coord.x - (-0.045 + coord.y * 0.23 + leftSway);
    float rightAxis = coord.x - (1.04 - coord.y * 0.21 + rightSway);
    float width = 0.028 + coord.y * 0.035;
    // A small bundle of narrow shafts, with feathered edges rather than mist.
    float innerOffset = 0.052 + coord.y * 0.013;
    float outerOffset = 0.037 + coord.y * 0.008;
    float leftShaft = exp(-2.8 * pow(leftAxis / width, 2.0))
                    + 0.64 * exp(-3.2 * pow((leftAxis - innerOffset) / (width * 0.42), 2.0))
                    + 0.38 * exp(-3.0 * pow((leftAxis + outerOffset) / (width * 0.32), 2.0));
    float rightShaft = exp(-2.8 * pow(rightAxis / (width * 1.08), 2.0))
                     + 0.57 * exp(-3.2 * pow((rightAxis + innerOffset) / (width * 0.40), 2.0))
                     + 0.35 * exp(-3.0 * pow((rightAxis - outerOffset) / (width * 0.34), 2.0));

    // Reuse the upstream Perlin noise as elongated, gently flowing striations.
    float leftDetail = 0.5 + 0.5 * pnoise(vec3(leftAxis * 42.0, coord.y * 0.42 - seconds * 0.027, 7.2), vec3(100.0));
    float rightDetail = 0.5 + 0.5 * pnoise(vec3(rightAxis * 39.0, coord.y * 0.38 - seconds * 0.024, 31.7), vec3(100.0));
    float upstreamDetail = clamp(noise * 1.8, 0.0, 1.0);
    leftDetail = mix(leftDetail, upstreamDetail, 0.24);
    rightDetail = mix(rightDetail, upstreamDetail, 0.20);
    float leftFlow = 0.84 + 0.16 * sin(seconds * 0.286 + coord.y * 1.8);
    float rightFlow = 0.85 + 0.15 * sin(seconds * 0.232 - coord.y * 1.5 + 2.2);
    float shafts = leftShaft * (0.22 + 0.78 * leftDetail) * leftFlow
                 + rightShaft * (0.22 + 0.78 * rightDetail) * rightFlow;
    float clearCentre = 1.0 - smoothstep(0.22, 0.42, coord.x) * (1.0 - smoothstep(0.58, 0.78, coord.x));
    float falloff = 1.0 - coord.y * 0.62;
    float warmSignal = max(0.0, shafts * clearCentre * falloff);
    // The edge-light SVG owns the visible warm cores; keep this layer neutral.
    float warmAlpha = 0.0;
    // Only a very faint water texture remains, preventing fog or stacked colour.
    float blueAlpha = clamp(mist.r, 0.0, 1.0) * uStrength * 0.08;
    float totalAlpha = min(1.0, blueAlpha + warmAlpha);
    vec3 lightColor = (uBlueTint * blueAlpha + uTint * warmAlpha) / max(totalAlpha, 0.0001);
    gl_FragColor = vec4(lightColor, totalAlpha);`);

      renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: false, powerPreference: 'low-power',
        preserveDrawingBuffer: false, premultipliedAlpha: true,
      });
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      geometry = new THREE.PlaneGeometry(2, 2);
      material = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          uDimensions: { value: new THREE.Vector2(1, 1) },
          uInputSize: { value: new THREE.Vector4(1, 1, 1, 1) },
          uParallel: { value: 1 },
          uLight: { value: new THREE.Vector2() },
          uAspect: { value: 1 },
          uTime: { value: 0 },
          uRay: { value: new THREE.Vector3(.4, 1.9, .8) },
          uTint: { value: new THREE.Color() },
          uBlueTint: { value: new THREE.Color() },
          uWarmMix: { value: 0 },
          uStrength: { value: .62 },
        },
        vertexShader: 'varying vec2 vTextureCoord; void main(){ vTextureCoord=vec2(uv.x,1.0-uv.y); gl_Position=vec4(position.xy,0.0,1.0); }',
        fragmentShader: fragment,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.frustumCulled = false;
      scene.add(plane);
      applyDepth();
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      document.addEventListener('visibilitychange', onVisibility);
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
      resize();
      canvas.dataset.lightStatus = 'ready';
      start();
    } catch (error) {
      if (!destroyed) {
        canvas.dataset.lightStatus = 'fallback';
        // The teammate ocean image and existing CSS light remain the fallback.
        geometry?.dispose(); material?.dispose(); renderer?.dispose();
        renderer = null;
      }
    }
  }

  initialise();
  return {
    setActive(value) {
      active = Boolean(value);
      if (active) start(); else cancelFrame();
    },
    setDepth(value) {
      depth = Math.max(0, Math.min(1, Number(value) || 0));
      applyDepth();
    },
    setPaletteMix(vulnerable=0,endangered=0,critical=0) {
      paletteMix=[vulnerable,endangered,critical].map(value=>Math.max(0,Math.min(1,Number(value)||0)));
      applyDepth();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      request.abort();
      cancelFrame();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      geometry?.dispose(); material?.dispose(); renderer?.dispose();
      canvas.dataset.lightStatus = 'destroyed';
    },
  };
}
