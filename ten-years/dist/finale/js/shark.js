import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const MODEL_URL = new URL('../../ocean/assets/scalloped_hammerhead_juvenile_low_poly.glb', import.meta.url).href;
const SCROLL_FRAME_MS = 1000 / 60;
const IDLE_FRAME_MS = 1000 / 30;

/**
 * A local, transparent 3D layer for the hand-off from one shark to the group.
 * The caller owns canvas positioning, opacity, and the surrounding page.
 */
export function mountShark(canvas, { onReady } = {}) {
  let destroyed = false;
  let reported = false;
  const report = (result) => {
    if (!destroyed && !reported) {
      reported = true;
      onReady?.(result);
    }
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
  } catch (error) {
    report({ ok: false, error: String(error) });
    return { setProgress() {}, setActive() {}, destroy() { destroyed = true; } };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 60);
  camera.position.set(0, 4.2, 13);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const rig = new THREE.Group();
  scene.add(rig);
  scene.add(new THREE.HemisphereLight(0xbce9ef, 0x102535, 1.4));
  const key = new THREE.DirectionalLight(0xe7f8ff, 3.0);
  key.position.set(-3, 8, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x529ab8, 0.6);
  fill.position.set(5, 1, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x77d4e7, 1.25);
  rim.position.set(2, 4, -6);
  scene.add(rim);

  const screenRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const screenUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = media.matches;
  let active = true;
  let inViewport = true;
  let contextLost = false;
  let ready = false;
  let mixer;
  let model;
  let progress = 0;
  let targetProgress = 0;
  let elapsed = 0;
  let last = 0;
  let nextRenderAt = 0;
  let followUntil = 0;
  let dirty = true;
  let frameId = 0;
  let width = 0;
  let height = 0;
  let worldWidth = 12;
  let initialLength = 5;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

  function visible() {
    return !destroyed && !contextLost && inViewport && !document.hidden && width > 0 && height > 0;
  }

  function pose() {
    const t = progress * progress * (3 - 2 * progress);
    const mobile = width / Math.max(height, 1) < 0.85;
    const startX = worldWidth * (mobile ? 0.025 : 0.19);
    const endX = worldWidth * (mobile ? 0.18 : 0.30);
    const startY = mobile ? -0.8 : -0.45;
    const endY = 1.25;
    const floatY = reducedMotion ? 0 : Math.sin(elapsed * 0.54) * 0.075;
    rig.position.copy(screenRight)
      .multiplyScalar(THREE.MathUtils.lerp(startX, endX, t))
      .addScaledVector(screenUp, THREE.MathUtils.lerp(startY, endY, t) + floatY);
    rig.scale.setScalar(initialLength * THREE.MathUtils.lerp(1, 0.30, t));
    // The supplied model's forward vector is local +Z.
    rig.rotation.set(
      reducedMotion ? 0.025 : 0.025 + Math.sin(elapsed * 0.28) * 0.018,
      -1.13 + (reducedMotion ? 0 : Math.sin(elapsed * 0.23) * 0.045),
      reducedMotion ? -0.025 : -0.025 + Math.sin(elapsed * 0.38) * 0.012,
    );
  }

  function draw() {
    if (!ready || !visible()) return;
    pose();
    renderer.render(scene, camera);
    dirty = false;
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    last = 0;
    nextRenderAt = 0;
  }

  function frame(now) {
    frameId = 0;
    if (!ready || !visible()) return;
    const moving = active && !reducedMotion;
    if (!moving && !dirty) return;
    // Follow the page at up to 60fps while the pose is changing. Slow idle
    // swimming keeps its 30fps budget; neither path runs outside the viewport.
    const following = now < followUntil || Math.abs(progress - targetProgress) > 0.0001;
    const interval = following ? SCROLL_FRAME_MS : IDLE_FRAME_MS;
    if (moving && now + 0.5 < nextRenderAt) {
      frameId = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.08) : 1 / 60;
    last = now;
    if (moving) {
      elapsed += dt;
      progress += (targetProgress - progress) * (1 - Math.exp(-dt / 0.09));
      if (Math.abs(progress - targetProgress) < 0.0001) progress = targetProgress;
      mixer?.update(dt * 0.85);
    } else progress = targetProgress;
    draw();
    if (moving) {
      // Advance the deadline rather than rounding every frame's delta. This
      // avoids an occasional extra display interval at the 30fps boundary.
      nextRenderAt = nextRenderAt && now - nextRenderAt < interval
        ? nextRenderAt + interval
        : now + interval;
      frameId = requestAnimationFrame(frame);
    } else {
      last = 0;
      nextRenderAt = 0;
    }
  }

  function resume() {
    if (!ready || !visible()) {
      stop();
      return;
    }
    if (!active || reducedMotion) {
      progress = targetProgress;
      if (!dirty) {
        stop();
        return;
      }
    }
    if (!frameId) {
      last = 0;
      nextRenderAt = 0;
      frameId = requestAnimationFrame(frame);
    }
  }

  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return;
    width = nextWidth;
    height = nextHeight;
    if (!width || !height) {
      stop();
      return;
    }
    worldWidth = 8 * width / height;
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.top = 4;
    camera.bottom = -4;
    camera.updateProjectionMatrix();
    const mobile = width / height < 0.85;
    initialLength = Math.min(6.4, worldWidth * (mobile ? 0.70 : 0.43));
    if (nextPixelRatio !== pixelRatio) {
      pixelRatio = nextPixelRatio;
      renderer.setPixelRatio(pixelRatio);
    }
    renderer.setSize(width, height, false);
    dirty = true;
    nextRenderAt = 0;
    resume();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    if (inViewport === entry.isIntersecting) return;
    inViewport = entry.isIntersecting;
    if (inViewport) {
      dirty = true;
      resume();
    } else stop();
  }, { threshold: 0 });
  intersectionObserver.observe(canvas);

  function onVisibilityChange() { dirty = true; resume(); }
  function onMotionChange(event) {
    if (reducedMotion === event.matches) return;
    reducedMotion = event.matches;
    progress = targetProgress;
    dirty = true;
    nextRenderAt = 0;
    resume();
  }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    stop();
  }
  function onContextRestored() {
    contextLost = false;
    pixelRatio = 0;
    resize();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  media.addEventListener('change', onMotionChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  function disposeModel(root) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    root.traverse((object) => {
      if (!object.isMesh) return;
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  }

  new GLTFLoader().load(MODEL_URL, (gltf) => {
    if (destroyed) {
      disposeModel(gltf.scene);
      return;
    }
    try {
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const length = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(length) || length <= 0) throw new Error('The model has invalid dimensions.');
      model.position.sub(box.getCenter(new THREE.Vector3()));
      const normalized = new THREE.Group();
      normalized.scale.setScalar(1 / length);
      normalized.add(model);
      rig.add(normalized);
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (!material) continue;
          if ('roughness' in material) material.roughness = Math.max(material.roughness, 0.58);
          if ('metalness' in material) material.metalness = 0;
        }
      });
      mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length) {
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        mixer.update(0.35);
      }
      ready = true;
      dirty = true;
      resize();
      resume();
      report({ ok: true, animations: gltf.animations.map((clip) => clip.name) });
    } catch (error) {
      report({ ok: false, error: String(error) });
      if (model) disposeModel(model);
    }
  }, undefined, (error) => {
    report({ ok: false, error: String(error?.message || error) });
  });

  resize();

  return {
    setProgress(value) {
      const next = Number(value);
      if (destroyed || !Number.isFinite(next)) return;
      const clamped = THREE.MathUtils.clamp(next, 0, 1);
      if (clamped === targetProgress) return;
      targetProgress = clamped;
      dirty = true;
      if (reducedMotion || !active || !inViewport || document.hidden) progress = targetProgress;
      followUntil = performance.now() + 180;
      if (nextRenderAt) nextRenderAt = Math.min(nextRenderAt, performance.now() + SCROLL_FRAME_MS);
      resume();
    },
    setActive(value) {
      const next = Boolean(value);
      if (destroyed || next === active) return;
      active = next;
      dirty = true;
      nextRenderAt = 0;
      if (!active) {
        progress = targetProgress;
      }
      resume();
    },
    destroy() {
      if (destroyed) return;
      stop();
      destroyed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      media.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      mixer?.stopAllAction();
      if (model) {
        mixer?.uncacheRoot(model);
        disposeModel(model);
      }
      scene.clear();
      renderer.dispose();
    },
  };
}
