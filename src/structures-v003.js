import * as T from '../vendor/three.module.js';

function timber(parent,a,b,width,material,depth=width){
 const av=new T.Vector3(...a),bv=new T.Vector3(...b);
 const o=new T.Mesh(new T.BoxGeometry(width,av.distanceTo(bv),depth),material);
 o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());o.castShadow=o.receiveShadow=true;parent.add(o);return o;
}
let clothTexture;
function wovenCloth(){
 if(clothTexture)return clothTexture;
 const c=document.createElement('canvas');c.width=384;c.height=640;const g=c.getContext('2d');
 // Broken lower edge and two unequal, worn tails. Alpha preserves individual nicks.
 g.beginPath();g.moveTo(3,0);g.lineTo(381,0);g.lineTo(378,552);g.lineTo(371,550);g.lineTo(372,580);g.lineTo(354,621);g.lineTo(340,616);g.lineTo(337,637);g.lineTo(190,568);g.lineTo(45,626);g.lineTo(42,610);g.lineTo(19,619);g.lineTo(8,568);g.closePath();g.clip();
 const fill=g.createLinearGradient(0,0,384,640);fill.addColorStop(0,'#243e70');fill.addColorStop(.45,'#294877');fill.addColorStop(1,'#536780');g.fillStyle=fill;g.fillRect(0,0,384,640);
 for(let i=0;i<384;i+=2){g.strokeStyle=i%6?'#14243b23':'#a8b9ce27';g.beginPath();g.moveTo(i,0);g.lineTo(i,640);g.stroke();}
 for(let i=0;i<640;i+=3){g.fillStyle='#101d331b';g.fillRect(0,i,384,1);}
 // Crownwarden heraldry matches the player's shield: silver eight-ray sun on blue.
 g.fillStyle='#bdc9d1';g.beginPath();g.ellipse(192,242,22,27,0,0,Math.PI*2);g.fill();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,dx=Math.sin(a),dy=Math.cos(a),tx=Math.cos(a),ty=-Math.sin(a),r=i%2?70:98;
  g.beginPath();g.moveTo(192+dx*27+tx*11,242+dy*33+ty*11);
  g.lineTo(192+dx*r,242+dy*r*1.2);g.lineTo(192+dx*27-tx*11,242+dy*33-ty*11);g.closePath();g.fill();
 }
 g.strokeStyle='#bdc9d199';g.lineWidth=3;g.strokeRect(17,13,350,617);g.setLineDash([3,6]);g.lineWidth=1;g.strokeRect(23,19,338,605);g.setLineDash([]);
 let seed=272;for(let i=0;i<1300;i++){seed=(1664525*seed+1013904223)>>>0;let x=seed%384;seed=(1664525*seed+1013904223)>>>0;let y=seed%640;g.fillStyle=i%3?'#18294327':'#b8c6d429';g.fillRect(x,y,1+i%4,1+i%3);}
 clothTexture=new T.CanvasTexture(c);clothTexture.colorSpace=T.SRGBColorSpace;clothTexture.anisotropy=4;return clothTexture;
}
export function hangingBanner(scene,props,{x,y,z,width=1.18,length=1.92,phase=0,wall=false}){
 const root=new T.Group();root.position.set(x,y,z);scene.add(root);
 const geo=new T.PlaneGeometry(width,length,22,34);geo.translate(0,-length/2,0);
 const base=new Float32Array(geo.attributes.position.array);
 const mat=new T.MeshStandardMaterial({map:wovenCloth(),side:T.DoubleSide,roughness:1,alphaTest:.5});
 const cloth=new T.Mesh(geo,mat);cloth.castShadow=cloth.receiveShadow=true;root.add(cloth);
 const ties=new T.MeshStandardMaterial({color:'#736043',roughness:1});
 for(const s of [-1,1]){const loop=new T.Mesh(new T.TorusGeometry(.052,.014,5,12),ties);loop.position.set(s*width*.4,.014,0);root.add(loop);}
 const update=time=>{
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
   const bx=base[i*3],by=base[i*3+1],drop=-by/length,u=bx/width+.5;
   pos.setXYZ(i,bx*(1.-drop*.035)+Math.sin(time*1.2+phase+drop*3)*.065*drop,by-.13*Math.sin(Math.PI*u)-.015*Math.sin(u*23+phase)*drop,
     Math.sin(u*11+phase+drop*1.8)*(.065+.15*drop)+drop*(.1+.24*Math.sin(time*1.4+phase-drop*2))+Math.sin(u*20-time*3+drop*7)*.03*drop*drop);
  }
  if(wall)for(let i=0;i<pos.count;i++)pos.setZ(i,Math.max(-.12,pos.getZ(i)));
  pos.needsUpdate=true;geo.computeVertexNormals();
 };
 update(0);props.push({update});return root;
}
export function installStructures(scene,props,palette,height){
 for(const [x,z,phase] of [[-4,9,0],[6,17,2.3]]){
  const y=height(x,z);
  timber(scene,[x,y-.15,z],[x+.06,y+4.24,z-.07],.105,palette.wood);
  timber(scene,[x-.14,y+4.12,z],[x+1.48,y+4.04,z+.025],.065,palette.wood);
  // Lashings visibly fasten the crossbar to the mast.
  for(let i=0;i<4;i++){
   const ring=new T.Mesh(new T.TorusGeometry(.083,.011,4,12),palette.leather);ring.position.set(x+.035,y+4.04+i*.028,z);ring.rotation.y=.35;scene.add(ring);
  }
  hangingBanner(scene,props,{x:x+.7,y:y+4.02,z:z+.045,phase});
 }
 hangingBanner(scene,props,{x:-10,y:height(-10,19)+3.96,z:20.52,width:1.02,length:2.5,phase:4.2,wall:true});
 // Split rails have real thickness, staggered joints and gently leaning posts.
 for(const [a,b] of [[-8.8,-5.9],[-2.1,.6],[.6,3.8],[3.8,7.1]]){
  for(const x of [a,b]){
   const y=height(x,20),lean=Math.sin(x*8)*.065;
   timber(scene,[x,y-.15,20],[x+lean,y+1.08+.035*Math.sin(x),20+.025],.14,palette.wood,.13);
  }
  for(const h of [.49,.88])timber(scene,[a-.03,height(a,20)+h,20.04],[b+.06,height(b,20)+h-.035,20.06],.10,palette.wood,.065);
 }
 makeFire(scene,props,palette,height);
}
function makeFire(scene,props,palette,height){
 const x=2,z=15,y=height(x,z),root=new T.Group();root.position.set(x,y,z);scene.add(root);
 const stone=new T.MeshStandardMaterial({color:'#686254',roughness:1}),coal=new T.MeshStandardMaterial({color:'#1e1711',roughness:1,emissive:'#dc3c06',emissiveIntensity:.045});
 const rockMap=new T.TextureLoader().load('assets/structure-surfaces-v002.png');rockMap.colorSpace=T.SRGBColorSpace;rockMap.repeat.set(.38,.38);rockMap.offset.set(.06,.56);stone.map=rockMap;stone.color.set('#c1b9a6');
 for(let i=0;i<11;i++){
  const a=i*6.283/11,rock=new T.Mesh(new T.DodecahedronGeometry(.2,1),stone);rock.position.set(Math.sin(a)*.59,.105,Math.cos(a)*.59);rock.scale.set(1.13,.7,.82);rock.rotation.set(i*.37,i*.9,i*.22);rock.castShadow=rock.receiveShadow=true;root.add(rock);
 }
 const ash=new T.Mesh(new T.CircleGeometry(.49,28),new T.MeshStandardMaterial({color:'#282620',roughness:1}));ash.rotation.x=-Math.PI/2;ash.position.y=.025;root.add(ash);
 for(let i=0;i<6;i++){
  const a=i*2.4;const log=timber(root,[-Math.cos(a)*.39,.12,-Math.sin(a)*.39],[Math.cos(a)*.36,.17,Math.sin(a)*.36],.13,coal,.12);log.rotation.z+=.05*Math.sin(i);
 }
 const uniforms={uTime:{value:0}};
 const flameMat=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform float uTime;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 void main(){vec2 uv=vUv;float n=noise(vec2(uv.x*6.,uv.y*6.-uTime*2.8));float fine=noise(vec2(uv.x*17.,uv.y*12.-uTime*4.));float bend=sin(uv.y*6.-uTime*2.)*.075*uv.y;float width=(1.-uv.y)*.36;float d=abs(uv.x-.5-bend);float edge=width+(n-.5)*.18+(fine-.5)*.07;float body=(1.-smoothstep(edge-.025,edge+.035,d));float tip=(1.-smoothstep(.62+n*.3,1.,uv.y));float base=smoothstep(0.,.12,uv.y);float a=body*tip*base*.8;float core=clamp(1.-d/max(width,.01),0.,1.)*(1.-uv.y);vec3 c=mix(vec3(.9,.055,.002),vec3(1.,.43,.035),core);c=mix(c,vec3(1.,.83,.36),pow(core,3.));gl_FragColor=vec4(c,a);}`});
 const flameGroup=new T.Group();root.add(flameGroup);
 for(let i=0;i<3;i++){
  const f=new T.Mesh(new T.PlaneGeometry(.57+i*.11,.69+i*.1),flameMat);f.position.set((i-1)*.145,.46+i*.015,i*.035);f.rotation.z=(i-1)*.12;flameGroup.add(f);
 }
 const sparkGeometry=new T.BufferGeometry(),positions=new Float32Array(18*3);sparkGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const sparks=new T.Points(sparkGeometry,new T.PointsMaterial({color:'#ffac3e',size:.021,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));root.add(sparks);
 const smokeMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uOpacity:{value:.06}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uOpacity;void main(){vec2 p=vUv*2.-1.;float a=exp(-dot(p,p)*5.)*(1.-smoothstep(.5,1.,length(p)));gl_FragColor=vec4(.25,.27,.25,a*uOpacity);}`});
 const wisps=[];for(let i=0;i<5;i++){const w=new T.Mesh(new T.PlaneGeometry(1,1),smokeMat.clone());root.add(w);wisps.push(w);}
 const light=new T.PointLight('#ff973c',3.5,5);light.position.set(0,.65,0);root.add(light);
 props.push({update(time,camera){uniforms.uTime.value=time;flameGroup.rotation.y=Math.atan2(camera.position.x-x,camera.position.z-z);light.intensity=3.1+Math.sin(time*8)*.35+Math.sin(time*13.7)*.25;coal.emissiveIntensity=.04+Math.sin(time*3)*.015;
  for(let i=0;i<18;i++){const age=(time*.27+i*.157)%1;positions[i*3]=Math.sin(i*12.8+age*4)*(.1+age*.23);positions[i*3+1]=.25+age*1.6;positions[i*3+2]=Math.cos(i*4.3+age*3)*(.08+age*.14);}sparkGeometry.attributes.position.needsUpdate=true;
  wisps.forEach((w,i)=>{const a=(time*.13+i*.2)%1;w.position.set(a*.42+Math.sin(i+time*.4)*.1,.65+a*2.1,.03);w.scale.setScalar(.28+a*.9);w.quaternion.copy(camera.quaternion);w.material.uniforms.uOpacity.value=.09*Math.sin(a*Math.PI);});
 }});
}
