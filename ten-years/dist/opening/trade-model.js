import * as THREE from '../ocean/vendor/three.module.js';
import {GLTFLoader} from '../ocean/vendor/GLTFLoader.js';

export async function loadModel(canvas){
  const {scene:shark}=await new GLTFLoader().loadAsync('../ocean/assets/scalloped_hammerhead_juvenile_low_poly.glb');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0,0);
  const scene=new THREE.Scene(),group=new THREE.Group();
  scene.add(group);group.add(shark);shark.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(shark,true),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const point=new THREE.Vector3(), materials=[];
  shark.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const pos=mesh.geometry.attributes.position;
    const mask=new Float32Array(pos.count);
    const coords=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){
      mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
      const z=(point.z-bounds.min.z)/size.z;
      const y=(point.y-center.y)/size.y;
      coords.set([ (point.x-center.x)/size.x, y, z ], i*3);
      const x=Math.abs(point.x-center.x)/size.x;
      // Isolate the caudal, dorsal and paired lateral fin regions in the resting pose.
      mask[i]=Number(z<.125 || (z>.2&&z<.8&&(y>.16 || x>.22)));
    }
    mesh.geometry.setAttribute('bodyCoord',new THREE.BufferAttribute(coords,3));
    mesh.geometry.setAttribute('finMask',new THREE.BufferAttribute(mask,1));
    const material=mesh.material.clone();
    const uniforms={productId:{value:0},productColor:{value:new THREE.Color()}};
    materials.push(uniforms);
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms);
      shader.vertexShader='attribute vec3 bodyCoord; attribute float finMask; varying vec3 vBody; varying float vFin;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBody=bodyCoord;vFin=finMask;');
      shader.fragmentShader='uniform int productId; uniform vec3 productColor; varying vec3 vBody; varying float vFin;\n'+shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float fins=smoothstep(.25,.8,vFin);
        float trunk=(1.-fins)*smoothstep(.12,.24,vBody.z)*(1.-smoothstep(.76,.86,vBody.z));
        float region=0.;
        if(productId==1) region=fins;
        if(productId==2) region=trunk;
        if(productId==3) region=trunk*(1.-smoothstep(.08,.25,abs(vBody.y)));
        if(productId==4) region=(1.-smoothstep(.025,.09,abs(vBody.y)))*smoothstep(.06,.18,vBody.z);
        if(productId==5 || productId==7) region=1.;
        if(productId==6) region=.25+.75*step(.74,fract(sin(dot(floor(vBody*95.),vec3(12.9898,78.233,39.425)))*43758.5453));
        diffuseColor.rgb=mix(diffuseColor.rgb,productColor,region*.88);
      `);
    };
    mesh.material=material;
  });
  shark.position.sub(center);group.scale.setScalar(1/size.z);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,10);
  camera.position.set(-2,1.1,.72);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xe0f7ff,0x627d88,2.3));
  const light=new THREE.DirectionalLight(0xecf9ff,2.4);light.position.set(-2,3,1);scene.add(light);
  const categories=['Fins','Bodies','Meat','Bones','Skins','Powder','Specimens'];
  let previous=null,previousColor;
  function render(active,color,force=false){
    if(active===previous&&!force)return;
    previous=active; previousColor=color;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    const half=Math.max(.24,.58*h/w);
    camera.top=half;camera.bottom=-half;camera.right=half*w/h;camera.left=-camera.right;camera.updateProjectionMatrix();
    materials.forEach(u=>{u.productId.value=categories.indexOf(active)+1;if(color)u.productColor.value.set(color)});renderer.render(scene,camera);
  }
  new ResizeObserver(()=>render(previous,previousColor,true)).observe(canvas);
  return render;
}
