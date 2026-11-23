import * as THREE from './vendor/three.module.js';
import {clone as cloneSkeleton} from './vendor/SkeletonUtils.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createLandingClaw} from './landing-claw.js?v=depth-30-60-layer';
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#fish'),alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,100);camera.position.set(0,-16,25);camera.lookAt(0,0,0);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.autoClear=false;
scene.add(new THREE.HemisphereLight(0x84bbcf,0x102534,1.2));
const light=new THREE.DirectionalLight(0xc7efff,3.6);scene.add(light,light.target);
light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:90});light.shadow.bias=-.0003;light.shadow.normalBias=.035;
const fill=new THREE.DirectionalLight(0x54889d,.55);scene.add(fill);
const rayScene=new THREE.Scene(),rayCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const rayTime={value:0};const lightSample=new THREE.Vector3();
rayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{time:rayTime},vertexShader:`varying vec2 uvv;void main(){uvv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
precision highp float;varying vec2 uvv;uniform float time;
void main(){vec2 uv=vec2(uvv.x,1.-uvv.y);float d=uv.y+.12;float slope=(uv.x-.98)/d;
float envelope=exp(-pow((slope+.55)/.58,2.));
float rays=0.;
for(int i=0;i<9;i++){float f=float(i);float c=-.97+f*.12+sin(time*.17+f*2.1)*.012;float width=.03+.008*sin(f*3.);rays+=exp(-pow((slope-c)/width,2.))*(.48+.15*sin(time*.23+f));}
float attenuation=exp(-uv.y*2.6);
float glow=exp(-length((uv-vec2(.97,.015))*vec2(3.,7.)));
float alpha=clamp((rays*.11+envelope*.085)*attenuation+glow*.38,0.,.56);
gl_FragColor=vec4(mix(vec3(.17,.55,.66),vec3(.72,.91,.95),glow),alpha);
}`})));
function alignLight(){camera.updateMatrixWorld();const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),front=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,2);light.position.copy(right.multiplyScalar(w*.6)).addScaledVector(up,12).addScaledVector(front,5);light.target.position.set(0,-2,0);fill.position.copy(camera.position);}
const fish=new THREE.Group();const fish2=new THREE.Group();scene.add(fish,fish2);let mixer2;let mixer,ready=false,w=20,h=12,length=4;
// Model forward is +Z; heading and travel use the same world-space vector.
const forward=new THREE.Vector3(1,0,.12).normalize();
fish.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),forward);
let travel=0,swimPaused=false,path;
const inspectionOrientation=new THREE.Quaternion();
const routeUp=new THREE.Vector3(0,25,16).normalize();
const routeRotation=new THREE.Matrix4(),routeQuaternion=new THREE.Quaternion();
function buildPath(){
 const point=(x,y)=>new THREE.Vector3((x-.5)*w,0,0).addScaledVector(routeUp,(.5-y)*h);
 path=new THREE.CatmullRomCurve3([
 point(1.35,.17),point(.88,.17),point(.75,.22),point(.64,.37),
 point(.54,.53),point(.42,.64),point(.27,.71),point(.12,.79),point(-.35,.85)
 ],false,'centripetal');
 path.arcLengthDivisions=400;path.updateArcLengths();
}
function resize(){h=12;w=h*innerWidth/innerHeight;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);length=Math.min(9,w*.84)*.8*1.05;fish.scale.setScalar(length);fish2.scale.setScalar(length);buildPath();}
new GLTFLoader().load('./assets/scalloped_hammerhead_juvenile_low_poly.glb',g=>{
 const box=new THREE.Box3().setFromObject(g.scene),size=box.getSize(new THREE.Vector3());const normalized=new THREE.Group();g.scene.position.sub(box.getCenter(new THREE.Vector3()));normalized.add(g.scene);normalized.scale.setScalar(1/Math.max(size.x,size.y,size.z));fish.add(normalized);
 g.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.material=o.material.clone();o.material.roughness=.45;o.material.metalness=0;o.castShadow=true;o.receiveShadow=true;}});
 mixer=new THREE.AnimationMixer(g.scene);g.animations.forEach((clip,i)=>{if(i===0)mixer.clipAction(clip).play();});const second=cloneSkeleton(normalized);fish2.add(second);mixer2=new THREE.AnimationMixer(second);if(g.animations.length){mixer2.clipAction(g.animations[0]).play();mixer2.update(.8);}ready=true;window.fishPreview={ready:true,animations:g.animations.map(x=>x.name),size:size.toArray()};
},undefined,e=>{console.error(e);window.fishPreview={ready:false,error:String(e)};});
const drawLandingClaw=createLandingClaw();
resize();addEventListener('resize',resize);
const initialStory={intro:0,entrance:0,exit:0};
let frameId=0,last,elapsed=0;
function syncRendering(){
 const exited=window.oceanStory?.exit>=1;
 if(document.hidden||exited){
  if(frameId)cancelAnimationFrame(frameId);
  frameId=0;
  last=undefined;
  if(exited){
   renderer.domElement.style.visibility='hidden';
   inspectionArea.hidden=true;
   if(activePointer!==null)finishInspection();
   drawLandingClaw(0,false,0);
   if(ready)Object.assign(window.fishPreview,{fishCount:0,exitProgress:1});
  }
 }else if(!frameId){
  frameId=requestAnimationFrame(frame);
 }
}
function frame(now){
 frameId=requestAnimationFrame(frame);
 if(last!==undefined&&now-last<1000/30)return;
 const frameSeconds=last===undefined?0:(now-last)/1000;
 const dt=Math.min(frameSeconds,.06);last=now;elapsed+=dt;
const story=window.oceanStory||initialStory;
applyView(story.entrance>0);
const exitProgress=story.exit||0;
const canInspect=story.entrance>=.995&&exitProgress<.001;
inspectionArea.hidden=!canInspect;
if(!canInspect&&activePointer!==null){finishInspection();}
if(story.entrance<=0)inspectionOrientation.identity();
if(ready){
fish.visible=true;fish2.visible=story.entrance<=0;
if(story.entrance<=0){
 if(!swimPaused)travel=(travel+dt*1.5/path.getLength())%1;
 fish.position.copy(path.getPointAt(travel));
 const tangent=path.getTangentAt(travel).normalize();
 // Local +Z follows the route; world up keeps the animal upright.
 routeRotation.lookAt(tangent,new THREE.Vector3(),new THREE.Vector3(0,1,0));
 routeQuaternion.setFromRotationMatrix(routeRotation);
 fish.quaternion.copy(routeQuaternion);

 // Second shark travels left to right on its own horizontal lane.
 const secondProgress=(travel+.20)%1;
 const secondX=THREE.MathUtils.lerp(-w/2-length*.75,w/2+length*.75,secondProgress);
 fish2.position.set(secondX,0,secondX*.12).addScaledVector(routeUp,-1.3);
 fish2.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),forward);

 window.fishPreview.fishCount=2;
 window.fishPreview.position=fish.position.toArray();
 window.fishPreview.heading=tangent.toArray();
}else{
 const t=1-Math.pow(1-story.entrance,3);
 camera.updateMatrixWorld();
 const screenRight=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
 const screenUp=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
 const mobile=innerWidth<=600;
 const targetX=mobile?0:w*.25/camera.zoom;
 const targetY=mobile?-h*.22/camera.zoom:0;
 const startX=w*.5/camera.zoom+length*.6;
 const startY=-h*.5/camera.zoom-length*.7;
 fish.position.copy(screenRight)
  .multiplyScalar(THREE.MathUtils.lerp(startX,targetX,t))
  .addScaledVector(screenUp,THREE.MathUtils.lerp(startY,targetY,t));
 const heading=new THREE.Vector3(-1,0,0).addScaledVector(routeUp,.5).normalize();
 routeRotation.lookAt(heading,new THREE.Vector3(),new THREE.Vector3(0,1,0));
 fish.quaternion.setFromRotationMatrix(routeRotation);
 fish.quaternion.premultiply(inspectionOrientation);
 window.fishPreview.inspectionQuaternion=inspectionOrientation.toArray();
 if(exitProgress>0){
  // Diagonal route towards the upper-left edge, then fully outside the viewport.
  const endX=-w*.38/camera.zoom;
  const endY=h*.5/camera.zoom+length*1.15;
  fish.position.copy(screenRight).multiplyScalar(THREE.MathUtils.lerp(targetX,endX,exitProgress))
   .addScaledVector(screenUp,THREE.MathUtils.lerp(targetY,endY,exitProgress));
  const direction=screenRight.clone().multiplyScalar(endX-targetX).addScaledVector(screenUp,endY-targetY).normalize();
  const departureRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(direction,new THREE.Vector3(),new THREE.Vector3(0,1,0)));
  fish.quaternion.slerp(departureRotation,THREE.MathUtils.smoothstep(exitProgress,0,.22));
 }
 fish.visible=exitProgress<1;
 window.fishPreview.fishCount=fish.visible?1:0;
 window.fishPreview.exitProgress=exitProgress;
}
 if(!swimPaused){
  mixer.update(dt*1.5);
  if(fish2.visible)mixer2.update(dt*1.5);
 }
}
rayTime.value=elapsed;alignLight();lightSample.copy(fish.position).project(camera);const depth=THREE.MathUtils.clamp((1-lightSample.y)*.5,0,1);light.intensity=4.2*Math.exp(-depth*.8)*(.96+.04*Math.sin(elapsed*.7));renderer.clear();if(story.entrance<=0)renderer.render(rayScene,rayCamera);renderer.clearDepth();renderer.render(scene,camera);
// Update visibility only after this frame has rendered the correct fish and camera.
const layerOpacity=story.entrance>0
 ? THREE.MathUtils.smoothstep(story.entrance,0,.08)
 : Math.pow(1-THREE.MathUtils.clamp(story.intro,0,1),Math.log2(5));
renderer.domElement.style.opacity=String(layerOpacity);
renderer.domElement.style.visibility='visible';
drawLandingClaw(frameSeconds,story.entrance<=0 && story.intro<1,layerOpacity);
}

// Authoring tools are opt-in and never appear on the normal website.
const cameraEditor=new URLSearchParams(location.search).get('cameraEditor')==='1';
const view={azimuth:46,elevation:32,zoom:1.1};
function applyView(second){
 const a=THREE.MathUtils.degToRad(second?view.azimuth:0);
 const e=THREE.MathUtils.degToRad(second?view.elevation:-33);
 camera.position.set(30*Math.cos(e)*Math.sin(a),30*Math.sin(e),30*Math.cos(e)*Math.cos(a));
 camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.zoom=second?view.zoom:1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
if(cameraEditor){
 const panel=document.createElement('section');panel.id='camera-editor';
 panel.innerHTML=`<strong>Scene 2 · Camera editor</strong><p>Preview tools only</p>
 <label>Horizontal angle <output id="angle-out"></output><input id="angle" type="range" min="-180" max="180" step="1" value="0"></label>
 <label>Elevation <output id="elevation-out"></output><input id="elevation" type="range" min="-80" max="80" step="1" value="-33"></label>
 <label>Zoom <output id="zoom-out"></output><input id="zoom" type="range" min=".5" max="1.8" step=".05" value="1"></label>
 <div><button data-e="-33">Below</button><button data-e="0">Side</button><button data-e="60">Above</button><button id="reset-view">Reset</button></div>
 <div><button id="jump-scene">Go to scene 2</button><button id="pause-fish">Pause motion</button></div>
 <label>Camera settings<textarea readonly rows="3"></textarea></label>`;
 document.body.append(panel);
 const style=document.createElement('style');style.textContent=`#camera-editor{position:fixed;z-index:20;left:16px;top:16px;width:260px;max-width:calc(100vw - 64px);padding:16px;border-radius:14px;background:#071c28eb;color:#dceef5;font:12px Manrope,sans-serif}#camera-editor p{opacity:.6}#camera-editor label{display:block;margin:12px 0}#camera-editor input,#camera-editor textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px}#camera-editor output{float:right}#camera-editor button{border:0;border-radius:6px;padding:7px;margin:3px;background:#ffffff20;color:inherit;cursor:pointer}#camera-editor textarea{background:#ffffff10;color:inherit;border:0;padding:8px}`;document.head.append(style);
 function sync(){panel.querySelector('#angle').value=view.azimuth;panel.querySelector('#elevation').value=view.elevation;panel.querySelector('#zoom').value=view.zoom;panel.querySelector('#angle-out').textContent=view.azimuth+'°';panel.querySelector('#elevation-out').textContent=view.elevation+'°';panel.querySelector('#zoom-out').textContent=view.zoom.toFixed(2)+'×';panel.querySelector('textarea').value=JSON.stringify(view);}
 for(const [id,key] of [['angle','azimuth'],['elevation','elevation'],['zoom','zoom']])panel.querySelector('#'+id).oninput=e=>{view[key]=Number(e.target.value);sync()};
 panel.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{view.elevation=Number(b.dataset.e);sync()});
 panel.querySelector('#reset-view').onclick=()=>{Object.assign(view,{azimuth:46,elevation:32,zoom:1.1});sync()};
 panel.querySelector('#jump-scene').onclick=()=>scrollTo({top:innerHeight*3,behavior:'smooth'});
 panel.querySelector('#pause-fish').onclick=e=>{swimPaused=!swimPaused;e.target.textContent=swimPaused?'Resume motion':'Pause motion'};
 sync();
}
applyView(false);

// Virtual trackball: rotate freely in 3D without moving the camera or model center.
const inspectionArea=document.createElement('div');inspectionArea.id='fish-inspection';inspectionArea.hidden=true;
inspectionArea.tabIndex=0;inspectionArea.setAttribute('role','region');inspectionArea.setAttribute('aria-label','Rotate shark freely in 3D. Drag in any direction. Arrow keys rotate; Q and E roll; Home resets.');
inspectionArea.innerHTML='<div class="rotation-hint"><span>Drag freely · 360°</span><button type="button" aria-label="Reset shark orientation">Reset</button></div>';
const resetOrientationButton = inspectionArea.querySelector('button');
resetOrientationButton.addEventListener('click', () => inspectionOrientation.identity());
document.body.append(inspectionArea);
const inspectionStyle=document.createElement('style');inspectionStyle.textContent=`
#fish-inspection{position:fixed;z-index:7;left:52%;right:2%;top:20%;bottom:12%;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
#fish-inspection[hidden]{display:none}#fish-inspection.dragging{cursor:grabbing}
#fish-inspection:focus-visible{outline:1px solid #dceef580;outline-offset:-6px;border-radius:18px}
.rotation-hint{position:absolute;bottom:0;left:0;right:0;text-align:center;color:#edf7fb;font:300 13px Manrope,sans-serif;pointer-events:none}.rotation-hint button{display:block;margin:6px auto 0;padding:4px 8px;border:0;background:transparent;text-decoration:underline;text-underline-offset:3px;color:#dceef5b3;font:inherit;cursor:pointer;pointer-events:auto}
.rotation-hint button:hover,.rotation-hint button:focus-visible{color:white}
@media(max-width:600px){#fish-inspection{left:4%;right:4%;top:49%;bottom:5%}}
`;document.head.append(inspectionStyle);
let activePointer=null;
const lastTrackballPoint=new THREE.Vector3();
function trackballPoint(event){
 const rect=inspectionArea.getBoundingClientRect();
 const radius=Math.min(rect.width,rect.height)*.5;
 const x=(event.clientX-rect.left-rect.width*.5)/radius;
 const y=-(event.clientY-rect.top-rect.height*.5)/radius;
 const distance=x*x+y*y;
 return new THREE.Vector3(x,y,distance<=.5?Math.sqrt(1-distance):.5/Math.sqrt(distance)).normalize();
}
function rotateInCameraSpace(delta){
 const cameraRotation=camera.getWorldQuaternion(new THREE.Quaternion());
 const worldDelta=cameraRotation.clone().multiply(delta).multiply(cameraRotation.clone().invert());
 inspectionOrientation.premultiply(worldDelta).normalize();
}
function finishInspection(){
 const pointer=activePointer;activePointer=null;
 if(pointer!==null&&inspectionArea.hasPointerCapture(pointer))inspectionArea.releasePointerCapture(pointer);
 inspectionArea.classList.remove('dragging');
}
inspectionArea.addEventListener('pointerdown',event=>{
 if(resetOrientationButton.contains(event.target)||activePointer!==null||event.button!==0)return;
 activePointer=event.pointerId;lastTrackballPoint.copy(trackballPoint(event));
 inspectionArea.setPointerCapture(event.pointerId);inspectionArea.classList.add('dragging');
});
inspectionArea.addEventListener('pointermove',event=>{
 if(event.pointerId!==activePointer)return;
 const next=trackballPoint(event);
 rotateInCameraSpace(new THREE.Quaternion().setFromUnitVectors(lastTrackballPoint,next));
 lastTrackballPoint.copy(next);
});
for(const eventName of ['pointerup','pointercancel','lostpointercapture'])inspectionArea.addEventListener(eventName,finishInspection);
inspectionArea.addEventListener('keydown',event=>{
 const keys={ArrowLeft:[0,-1,0],ArrowRight:[0,1,0],ArrowUp:[-1,0,0],ArrowDown:[1,0,0],q:[0,0,-1],e:[0,0,1]};
 if(event.key==='Home'){event.preventDefault();inspectionOrientation.identity();return;}
 if(keys[event.key]){event.preventDefault();rotateInCameraSpace(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...keys[event.key]),Math.PI/18));}
});
inspectionArea.addEventListener('dblclick',()=>inspectionOrientation.identity());
window.addEventListener('opening:progress',syncRendering);
document.addEventListener('visibilitychange',syncRendering);
syncRendering();
