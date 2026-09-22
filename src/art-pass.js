import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';

// Authored preview environment. Geometry sources live in art/source/watchcamp-v001.blend.
export async function installWatchcamp(scene, {floor, trees, trunks, leaves, lightLeaves, huts, grass, flowers, palette, height, colliders}) {
  const loader = new T.TextureLoader();
  const [atlas, foliage, ground, cottage, tower] = await Promise.all([
    loader.loadAsync('assets/watchcamp-materials-v001.png'),
    loader.loadAsync('assets/watchcamp-foliage-v001.png'),
    loader.loadAsync('assets/forest-floor-v001.png'),
    new GLTFLoader().loadAsync('assets/watchkeeper-cottage-v002.glb'),
    new GLTFLoader().loadAsync('assets/watchtower-v002.glb'),
  ]);
  for (const tex of [atlas,foliage,ground]) {tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;}
  ground.wrapS=ground.wrapT=T.RepeatWrapping;ground.repeat.set(42,42);
  floor.material.map=ground;floor.material.color.set('#a8b794');floor.material.needsUpdate=true;
  function surface(material, quadrant) {
    const t=atlas.clone();t.repeat.set(.478,.478);t.offset.set((quadrant%2)*.5+.01,quadrant<2?.51:.01);t.needsUpdate=true;
    material.map=t;material.color.set('#ffffff');material.needsUpdate=true;
  }
  surface(palette.bark,0);surface(palette.wood,0);surface(palette.stone,1);surface(palette.stoneDark,1);
  // Leaf cards preserve a broken silhouette and let sun through the canopy.
  leaves.visible=lightLeaves.visible=false;grass.visible=flowers.visible=false;
  let seed=6251;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const dummy=new T.Object3D();
  const leafMat=new T.MeshStandardMaterial({map:foliage,alphaTest:.45,side:T.DoubleSide,roughness:1,alphaToCoverage:true});
  const wind={value:0};
  leafMat.onBeforeCompile=shader=>{
    shader.uniforms.uWindTime=wind;
    shader.vertexShader='uniform float uWindTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
      float phase=instanceMatrix[3].x*.7+instanceMatrix[3].z*.4;
      transformed.x += sin(uWindTime*1.4+phase+position.y*2.)*.022*(position.y+.5);
      #endif`);
  };
  scene.userData.artWind=wind;
  const crowns=new T.InstancedMesh(new T.PlaneGeometry(1,1),leafMat,trees.length*26);
  const branches=new T.InstancedMesh(new T.CylinderGeometry(.055,.12,1,7),palette.bark,trees.length*7);
  const roots=new T.InstancedMesh(new T.CylinderGeometry(.025,.16,1,7),palette.bark,trees.length*5);
  function segment(batch,index,a,b,width=1) {
    dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());dummy.scale.set(width,a.distanceTo(b),width);dummy.updateMatrix();batch.setMatrixAt(index,dummy.matrix);
  }
  trees.forEach(([x,z,h],i)=>{
    const y=height(x,z);
    for(let j=0;j<7;j++) {
      const a=j*2.399+rand()*.5,reach=1.8+rand()*1.8;
      segment(branches,i*7+j,new T.Vector3(x,y+h*(.48+j*.055),z),new T.Vector3(x+Math.sin(a)*reach,y+h*(.72+j*.026),z+Math.cos(a)*reach));
    }
    for(let j=0;j<5;j++) {
      const a=j*1.256;
      segment(roots,i*5+j,new T.Vector3(x, y+.5,z),new T.Vector3(x+Math.sin(a)*1.4,height(x+Math.sin(a)*1.4,z+Math.cos(a)*1.4)+.04,z+Math.cos(a)*1.4),1.4);
    }
    for(let j=0;j<26;j++) {
      const a=j*2.399,rr=Math.sqrt(rand())*3.8;
      dummy.position.set(x+Math.sin(a)*rr,y+h*.72+rand()*3.5,z+Math.cos(a)*rr);
      dummy.rotation.set(-.3-rand()*1.8,a,rand()*.9);
      const s=2.3+rand()*2.4;dummy.scale.set(s,s,1);dummy.updateMatrix();crowns.setMatrixAt(i*26+j,dummy.matrix);
      crowns.setColorAt(i*26+j,new T.Color().setHSL(.17+rand()*.09,.18,.62+rand()*.25));
    }
  });
  for(const m of [crowns,branches,roots]) {m.castShadow=m.receiveShadow=true;scene.add(m);}
  // Low shrubs use the same authored leaf vocabulary at a believable scale.
  const shrubs=new T.InstancedMesh(new T.PlaneGeometry(1,1),leafMat,900);
  for(let i=0;i<900;i++) {
    let x=(rand()-.5)*77,z=rand()*72-45;
    const road=Math.abs(x-(z>0?0:z>-12?-10:-17))<3;
    if(road||Math.hypot(x+6,z-15)<4||Math.abs(x-16)<2.1){dummy.scale.setScalar(0);}else{const s=.35+rand()*.65;dummy.scale.set(s,s,1);}
    dummy.position.set(x,height(x,z)+.28,z);dummy.rotation.set(-.1-rand()*.65,rand()*6.28,0);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);
  }
  shrubs.receiveShadow=true;scene.add(shrubs);
  // Bent, fine meadow grass replaces the broad triangular spikes.
  let verts=[];
  for(let j=0;j<7;j++) {
    const a=j*2.399,dx=Math.sin(a)*.12,dz=Math.cos(a)*.12,h=.13+rand()*.19;
    verts.push(dx-.026,0,dz,dx+.026,0,dz,dx+.07,h*.58,dz+.02,dx-.026,0,dz,dx+.07,h*.58,dz+.02,dx+.1,h,dz+.045);
  }
  const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(verts,3));gg.computeVertexNormals();
  const meadow=new T.InstancedMesh(gg,new T.MeshStandardMaterial({color:'#748052',side:T.DoubleSide,roughness:1}),12500);
  for(let i=0;i<12500;i++) {
    let x=(rand()-.5)*88,z=rand()*86-50;
    const road=Math.abs(x-(z>0?0:z>-12?-10:-17))<1.8;
    dummy.position.set(x,height(x,z),z);dummy.rotation.set(0,rand()*6.28,0);dummy.scale.setScalar(road||Math.abs(x-16)<1.7?0:.55+rand());dummy.updateMatrix();meadow.setMatrixAt(i,dummy.matrix);
    meadow.setColorAt(i,new T.Color().setHSL(.19+rand()*.05,.23+rand()*.2,.38+rand()*.18));
  }
  meadow.receiveShadow=true;scene.add(meadow);
  for(const model of [cottage.scene,tower.scene])model.traverse(o=>{
    if(!o.isMesh)return;
    if(o.material.name.startsWith('Slate tone'))o.material.color.setScalar(.88+Number(o.material.name.slice(-1))*.027);
    if(o.material.name.startsWith('Fieldstone tone'))o.material.color.setScalar(o.material.name.endsWith('0')?1.45:.68+Number(o.material.name.slice(-1))*.027);
  });
  // Detailed lodge keeps the original building footprint and quest locations.
  huts.forEach((old,i)=>{
    const model=cottage.scene.clone(true);model.position.copy(old.position);model.scale.copy(old.scale);
    model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material.map)o.material.map.anisotropy=8;}});
    scene.add(model);old.visible=false;
  });
  const lookout=tower.scene;lookout.position.set(-10,height(-10,19),19);lookout.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});scene.add(lookout);colliders.push({x:-10,z:19,r:2.3});
  // Small irregular stepping stones, grounded at the terrain height.
  const cobbles=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),palette.stone,260);
  for(let i=0;i<260;i++){
    let z=2+rand()*22,x=Math.sin(z*.18)*.5+(rand()-.5)*2.3;
    dummy.position.set(x,height(x,z)+.015,z);dummy.rotation.set(rand()*.1,rand()*6.28,rand()*.08);dummy.scale.set(.13+rand()*.22,.045+rand()*.03,.13+rand()*.2);dummy.updateMatrix();cobbles.setMatrixAt(i,dummy.matrix);
  }
  cobbles.receiveShadow=true;cobbles.userData.walkSurface=true;scene.add(cobbles);
  // A distant enclosing ridge gives the forest a horizon instead of an empty void.
  const ridgeGeo=new T.PlaneGeometry(230,65,100,24);ridgeGeo.rotateX(-Math.PI/2);
  const rp=ridgeGeo.attributes.position,colors=[];
  for(let i=0;i<rp.count;i++){
    const x=rp.getX(i),z=rp.getZ(i),edge=Math.sin(Math.PI*(z+32.5)/65);
    const peaks=12+24*Math.exp(-(((x+31)/15)**2))+32*Math.exp(-(((x-10)/19)**2))+20*Math.exp(-(((x-58)/13)**2));
    const y=Math.max(0,edge)*(peaks+Math.sin(x*.42+z*.21)*2+Math.cos(x*.8-z*.3)*1.2);
    rp.setY(i,y); const color=new T.Color(y>32?'#c5d0ca':y>24?'#8e9b96':'#687e78');colors.push(color.r,color.g,color.b);
  }
  ridgeGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));ridgeGeo.computeVertexNormals();
  const ridge=new T.Mesh(ridgeGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));ridge.position.set(0,-2,-90);scene.add(ridge);
  const sky=new T.Mesh(new T.SphereGeometry(140,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:`varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,fragmentShader:`varying vec3 vDir; void main(){float h=normalize(vDir).y; vec3 c=mix(vec3(.66,.72,.67),vec3(.23,.40,.47),smoothstep(0.,.8,h)); gl_FragColor=vec4(c,1.);\n #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
  scene.add(sky);
  scene.userData.artReady=true;
}
