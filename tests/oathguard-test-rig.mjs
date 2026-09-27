import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
export function rig(natural=true){
 const bytes=readFileSync(new URL(natural?'../assets/oathguard-natural-hands-v044.glb':'../assets/oathguard-v022.glb',import.meta.url)),g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const nodes=g.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);return o;});g.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>nodes[i].add(nodes[j])));
 const model=new T.Group();g.scenes[g.scene||0].nodes.forEach(i=>model.add(nodes[i]));const bones={},rest={};for(const i of g.skins[0].joints){const b=nodes[i];bones[b.name]=b;rest[b.name]={q:b.quaternion.clone(),p:b.position.clone()};}
 model.userData.oathguard={bones,rest,natural,legLength:natural?.5015:.425,phase:0,lastTime:null,motion:0,guard:0,lastYaw:0,turn:0,attackElapsed:1,lastAttack:0,clothMotion:0,clothTurn:0};model.userData.groundSurface=()=>0;return model;
}
