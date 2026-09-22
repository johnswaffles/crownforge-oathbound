import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bytes=readFileSync(new URL('../assets/oathguard-v022.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const bin=bytes.subarray(20+jsonLength+8);
function accessor(index){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType];const values=[];for(let i=0;i<a.count;i++)for(let j=0;j<n;j++){const off=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||n*size)+j*size;values.push(a.componentType===5126?bin.readFloatLE(off):size===1?bin.readUInt8(off):size===2?bin.readUInt16LE(off):bin.readUInt32LE(off));}return values;}
test('Oathguard exports all articulated joints and valid normalized skin weights',()=>{
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 assert.equal(doc.skins.length,1);
 const skin=doc.skins[0],names=skin.joints.map(i=>doc.nodes[i].name);
 for(const name of ['pelvis','chest','head','sash','cape_0','cape_1','cape_2','cape_3','upperarm_L','forearm_L','hand_L','upperarm_R','forearm_R','hand_R','thigh_L','shin_L','foot_L','thigh_R','shin_R','foot_R'])assert.ok(names.includes(name),name);
 for(const mesh of doc.meshes)for(const p of mesh.primitives){
  const weights=accessor(p.attributes.WEIGHTS_0),joints=accessor(p.attributes.JOINTS_0);
  for(let i=0;i<weights.length;i+=4)assert.ok(Math.abs(weights.slice(i,i+4).reduce((a,b)=>a+b,0)-1)<.001);
  assert.ok(joints.every(j=>Number.isInteger(j)&&j<skin.joints.length));
  assert.ok(accessor(p.attributes.POSITION).every(Number.isFinite));
 }
});

test('sash belt edge and cape shoulder edge remain pinned to their attachment bones',()=>{
 const names=doc.skins[0].joints.map(i=>doc.nodes[i].name);let sashPins=0,capePins=0;
 for(const mesh of doc.meshes)for(const p of mesh.primitives){
  if(doc.materials[p.material].name!=='Oathguard teal cloak')continue;
  const pos=accessor(p.attributes.POSITION),weights=accessor(p.attributes.WEIGHTS_0),joints=accessor(p.attributes.JOINTS_0);
  for(let i=0;i<pos.length/3;i++){
   const [x,y,z]=pos.slice(i*3,i*3+3);
   const sash=Math.abs(x)<.15&&y>1.06&&y<1.077&&z>.07;
   const cape=y>1.515&&y<1.60&&z<-.02;
   if(!sash&&!cape)continue;
   let anchored=0;for(let j=0;j<4;j++)if(names[joints[i*4+j]]===(sash?'pelvis':'chest'))anchored+=weights[i*4+j];
   assert.ok(anchored>.999,`Unpinned ${sash?'belt':'shoulder'} vertex at ${x},${y},${z}`);
   if(sash)sashPins++;else capePins++;
  }
 }
 assert.ok(sashPins>10);assert.ok(capePins>10);
});

test('sword edge lies in the grip and forearm cutting plane, not flat across it',()=>{
 const names=doc.skins[0].joints.map(i=>doc.nodes[i].name),section=[];
 for(const mesh of doc.meshes)for(const p of mesh.primitives){
  if(doc.materials[p.material].name!=='Crownwarden blade steel')continue;
  const pos=accessor(p.attributes.POSITION),weights=accessor(p.attributes.WEIGHTS_0),joints=accessor(p.attributes.JOINTS_0);
  for(let i=0;i<pos.length/3;i++){
   if(![0,1,2,3].some(j=>names[joints[i*4+j]]==='hand_R'&&weights[i*4+j]>.999))continue;
   const x=pos[i*3]/1.12-.293,y=pos[i*3+1]-.899,z=pos[i*3+2];
   const across=y*Math.cos(.42)+z*Math.sin(.42),along=-y*Math.sin(.42)+z*Math.cos(.42);
   if(along>.12&&along<.66)section.push([x,across]);
  }
 }
 assert.ok(section.length>10);
 const span=j=>Math.max(...section.map(p=>p[j]))-Math.min(...section.map(p=>p[j]));
 assert.ok(span(0)<.016,'Broad face must not lead the forearm swing');
 assert.ok(span(1)>.035,'Cutting edge must span the forearm swing plane');
});
