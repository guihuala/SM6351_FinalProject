import * as THREE from '../ocean/vendor/three.module.js';
import {GLTFLoader} from '../ocean/vendor/GLTFLoader.js';

export async function loadChapterShark(canvas) {
  const asset = new URL('../ocean/assets/scalloped_hammerhead_juvenile_low_poly.glb', import.meta.url);
  const {scene: shark, animations} = await new GLTFLoader().loadAsync(asset.href);
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const scene = new THREE.Scene();
  const swimmer = new THREE.Group();
  const bounds = new THREE.Box3().setFromObject(shark);
  shark.position.sub(bounds.getCenter(new THREE.Vector3()));
  swimmer.add(shark);
  swimmer.scale.setScalar(1 / bounds.getSize(new THREE.Vector3()).z);
  scene.add(swimmer, new THREE.HemisphereLight(0x94c9df, 0x183647, 2));
  const light = new THREE.DirectionalLight(0xc7efff, 3);
  light.position.set(2, 3, 1);
  scene.add(light);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 10);
  camera.position.set(2, .65, .95);
  camera.lookAt(0, 0, 0);
  const mixer = new THREE.AnimationMixer(shark);
  const swim = animations[0];
  if (swim) mixer.clipAction(swim).play();

  let width, height, lastProgress;
  return progress => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height && progress === lastProgress)) return;
    if (w !== width || h !== height) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      const halfHeight = Math.max(.29, .57 * h / w);
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.right = halfHeight * w / h;
      camera.left = -camera.right;
      camera.updateProjectionMatrix();
    }
    lastProgress = progress;
    swimmer.rotation.y = .22 * (1 - progress);
    if (swim) mixer.setTime(swim.duration * (.1 + .75 * progress));
    renderer.render(scene, camera);
  };
}
