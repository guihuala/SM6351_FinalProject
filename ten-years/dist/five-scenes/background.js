import * as THREE from './vendor/three.module.js';
const canvas=document.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const uniforms={time:{value:0},resolution:{value:new THREE.Vector2()},pointer:{value:new THREE.Vector2()}};
const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
precision highp float;
varying vec2 vUv;uniform float time;uniform vec2 resolution;uniform vec2 pointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float height(vec2 p){float t=time*.17;return sin(p.x*.72+t)*.25+sin(p.y*1.2-t*.8+p.x*.24)*.19+noise(p*.9+vec2(t*.35,-t*.22))*.65+noise(p*2.5-vec2(t*.3,t*.15))*.18;}
void main(){vec2 uv=vUv;float down=1.-uv.y;float aspect=resolution.x/resolution.y;
vec3 col=mix(vec3(.013,.064,.087),vec3(.021,.119,.186),smoothstep(.08,.95,down));
float haze=exp(-pow((uv.x-.53)*1.8,2.));col*=.77+.23*haze;
// Perspective projection of a water ceiling; its reflected light follows the wave normals.
float horizon=.79+pointer.y*.008;
float above=uv.y-horizon;
if(above>0.){
 float depth=1./max(above*5.,.035);
 vec2 p=vec2((uv.x-.5)*aspect*depth*5.+pointer.x*.12,depth*3.);
 float h=height(p),e=.06;
 vec3 n=normalize(vec3((height(p+vec2(e,0))-h)/e,1.,(height(p+vec2(0,e))-h)/e));
 float reflectance=pow(max(dot(n,normalize(vec3(-.35,1.,.4))),0.),12.);
 float veins=smoothstep(.38,.8,noise(p*1.2+vec2(time*.045,h)));
 vec3 surface=vec3(.005,.033,.049)+vec3(.045,.105,.145)*reflectance*(.28+.72*veins);
 float fade=smoothstep(0.,.075,above);
 col=mix(col,surface,fade);
}
// Low-contrast shafts and suspended haze, without a simulated seabed.
float shafts=pow(.5+.5*sin((uv.x+down*.14)*23.+noise(vec2(uv.x*6.,time*.025))*2.),9.);
col+=vec3(.006,.016,.020)*shafts*exp(-down*3.5);
col+=vec3(.002,.006,.009)*noise(vec2(uv.x*6.+time*.012,down*4.));
float vignette=1.-.23*pow(abs(uv.x-.5)*2.,2.5)-.08*pow(down,4.);
col*=vignette;
col+=(hash(gl_FragCoord.xy)-.5)*.009;
gl_FragColor=vec4(col,1.);
}`});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.getDrawingBufferSize(uniforms.resolution.value);render();}
let elapsed=0,last=0,frame=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function render(){uniforms.time.value=elapsed;renderer.render(scene,camera);}
function loop(now){frame=requestAnimationFrame(loop);if(now-last<1000/30)return;elapsed+=Math.min((now-last)/1000,.06);last=now;render();}
function resume(){cancelAnimationFrame(frame);last=performance.now();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(loop);else render();}
document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);addEventListener('resize',resize);
addEventListener('pointermove',e=>{uniforms.pointer.value.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);},{passive:true});resize();resume();
