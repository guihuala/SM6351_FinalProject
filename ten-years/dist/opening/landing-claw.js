import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

export function createLandingClaw() {
  // Coordinates are measured in viewport heights, with y=0 at the top.
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 0, -1, 0.01, 10);
  camera.position.z = 3;
  scene.add(new THREE.HemisphereLight(0xc7ecfa, 0x395367, 2));
  const sunlight = new THREE.DirectionalLight(0xeafaff, 3.5);
  sunlight.position.set(2, 3, 4);
  scene.add(sunlight);

  const mount = new THREE.Group();
  scene.add(mount);
  const extension = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 10),
    new THREE.MeshStandardMaterial({color:0x627880, roughness:0.52})
  );
  scene.add(extension);
  const anchor = new THREE.Vector3(), tip = new THREE.Vector3(), localCenter = new THREE.Vector3();
  let body, ring, cable, topVertex, mixer, action, scale;
  let tipDropAtStop;
  const randomDepth = () => THREE.MathUtils.randFloat(0.3, 0.6);
  let time = 0, delay = 0, lane = Math.random(), depth = randomDepth();
  new GLTFLoader().load('./assets/claw-landing.glb', gltf => {
    body = gltf.scene;
    mount.add(body);
    ring = body.getObjectByName('aro_superior');
    cable = body.getObjectByName('cable');
    ring.geometry.computeBoundingBox();
    ring.geometry.boundingBox.getCenter(localCenter);
    const positions = cable.geometry.attributes.position;
    topVertex = 0;
    for (let i = 1; i < positions.count; i++) {
      if (positions.getY(i) > positions.getY(topVertex)) topVertex = i;
    }
    mixer = new THREE.AnimationMixer(body);
    // The authored end pose differs from its start. Reverse at each boundary.
    action = mixer.clipAction(gltf.animations[0]).setLoop(THREE.LoopPingPong, Infinity);
    action.play();
    // Measure the lowest jaw vertex in the pose at the end of the descent.
    mixer.setTime(1.8);
    body.updateWorldMatrix(true, true);
    let lowest = Infinity;
    for (const name of ['gancho01', 'gancho02', 'gancho03']) {
      const jaw = body.getObjectByName(name);
      const vertices = jaw.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        tip.fromBufferAttribute(vertices, i).applyMatrix4(jaw.matrixWorld);
        lowest = Math.min(lowest, tip.y);
      }
    }
    tipDropAtStop = ring.localToWorld(anchor.copy(localCenter)).y - lowest;
    mixer.setTime(0);
  }, undefined, error => console.error('Landing claw could not load', error));

  function restart() {
    time = 0;
    lane = Math.random();
    depth = randomDepth();
    action.reset().play();
  }

  const canvas = document.querySelector('#landing-claw');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, powerPreference:'low-power'});
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  function resize() {
    const ratio = Math.min(devicePixelRatio, 1, Math.sqrt(700000 / (innerWidth * innerHeight)));
    renderer.setDrawingBufferSize(innerWidth, innerHeight, ratio);
  }
  resize();
  addEventListener('resize', resize);

  return function draw(dt, introVisible, opacity) {
    canvas.hidden = !introVisible || !mixer || delay > 0;
    canvas.style.opacity = String(opacity);
    if (!mixer) return;
    if (!introVisible) {
      if (time || delay) { restart(); delay = 0; }
      return;
    }
    if (delay > 0) { delay -= dt; return; }
    time += dt;
    if (time >= 4.2) { canvas.hidden = true; restart(); delay = 2 + Math.random() * 2; return; }
    mixer.update(dt);
    const aspect = innerWidth / innerHeight;
    camera.left = -aspect / 2;
    camera.right = aspect / 2;
    camera.updateProjectionMatrix();
    scale = Math.min(0.032, aspect * 0.055);
    const travel = time < 1.8 ? THREE.MathUtils.smoothstep(time, 0, 1.8)
      : 1 - THREE.MathUtils.smoothstep(time, 2.8, 4.2);
    // Cancel the authored hoist translation, retaining the articulated motion.
    body.updateWorldMatrix(true, true);
    anchor.copy(localCenter).applyMatrix4(ring.matrixWorld);
    mount.worldToLocal(anchor);
    const margin = scale * 5;
    const x = (lane - 0.5) * Math.max(0, aspect - 2 * margin);
    const restTipOffset = scale * tipDropAtStop;
    const y = THREE.MathUtils.lerp(scale * 8, -depth + restTipOffset, travel);
    mount.scale.setScalar(scale);
    mount.position.set(x - scale * anchor.x, y - scale * anchor.y, -scale * anchor.z);
    mount.updateMatrixWorld(true);
    cable.getVertexPosition(topVertex, tip).applyMatrix4(cable.matrixWorld);
    extension.visible = tip.y < 0;
    extension.position.set(tip.x, tip.y / 2, tip.z);
    extension.scale.set(scale * 0.046, Math.abs(tip.y), scale * 0.046);
    renderer.render(scene, camera);
  };
}
