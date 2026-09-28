import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {APPROVED_RUN} from '../run-workshop-v049/approved-run.js';
const root=new URL('../../',import.meta.url);
function load(path){const bytes=readFileSync(new URL(path,root)),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);return {bytes,json,bin};}
function read(g,id){const a=g.json.accessors[id],v=g.json.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5126:4,5125:4,5123:2,5121:1}[a.componentType],method={5126:'readFloatLE',5125:'readUInt32LE',5123:'readUInt16LE',5121:'readUInt8'}[a.componentType];return Array.from({length:a.count},(_,i)=>Array.from({length:n},(_,j)=>g.bin[method]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||n*size)+j*size)));}

test('the exact user-selected run is durably recorded against its unchanged animator',()=>{
 const record=JSON.parse(readFileSync(new URL('../run-workshop-v049/approved-run-20260928.json',import.meta.url)));
 assert.deepEqual(APPROVED_RUN,{cadence:1.98,compression:.065,drive:1.35});assert.deepEqual(record.settings,APPROVED_RUN);
 assert.equal(createHash('sha256').update(readFileSync(new URL(record.motionSource,root))).digest('hex'),record.motionSha256);
 const source=readFileSync(new URL('workshop.js',import.meta.url),'utf8');assert.ok(source.includes('animateCandidate(m,time,speed,APPROVED_RUN)'));assert.ok(!source.includes('localStorage.setItem'));
});
test('new gloves preserve the original buffers, rig, weapons and all non-hand armor',()=>{
 const before=load('assets/oathguard-natural-v039.glb'),after=load('assets/oathguard-natural-hands-v050.glb');
 assert.deepEqual(after.bin.subarray(0,before.bin.length),before.bin);
 assert.deepEqual(after.json.skins,before.json.skins);
 for(let i=0;i<before.json.nodes.length;i++){
  const a={...before.json.nodes[i]},b={...after.json.nodes[i]};
  if(['hand_L','hand_R'].includes(a.name))b.children=b.children.filter(x=>x<before.json.nodes.length);
  if(!a.children?.length)delete a.children;if(!b.children?.length)delete b.children;assert.deepEqual(b,a);
 }
 let totalRemoved=0;
 for(let i=0;i<before.json.meshes.length;i++){
  const expected=before.json.meshes[i].primitives.filter(p=>before.json.materials[p.material].name!=='V11 glove leather');
  const actual=after.json.meshes[i].primitives;assert.equal(expected.length,actual.length);
  for(let j=0;j<expected.length;j++){
   const a=expected[j],b=actual[j];assert.deepEqual(b.attributes,a.attributes);assert.equal(b.material,a.material);
   if(before.json.materials[a.material].name!=='V4 tempered steel'||a.attributes.JOINTS_0===undefined)assert.deepEqual(b,a);
   else{
    const old=read(before,a.indices).flat(),next=read(after,b.indices).flat(),removed=[];let k=0;
    for(let t=0;t<old.length;t+=3){const tri=old.slice(t,t+3);if(tri.every((v,n)=>v===next[k+n]))k+=3;else removed.push(tri);}
    assert.equal(k,next.length);totalRemoved+=removed.length;
    const positions=read(before,a.attributes.POSITION),js=read(before,a.attributes.JOINTS_0),weights=read(before,a.attributes.WEIGHTS_0),skin=before.json.skins[0],inverse=read(before,skin.inverseBindMatrices);
    for(const tri of removed)for(const v of tri){const j=js[v][0],bone=before.json.nodes[skin.joints[j]].name;assert.ok(bone==='hand_L'||bone==='hand_R');assert.equal(weights[v][0],1);const local=positions[v].map((x,n)=>x+inverse[j][12+n]);assert.ok(Math.abs(local[0])<.045&&local[1]>-.09&&local[1]<0&&Math.abs(local[2])<.045,'Only the small dorsal hand plates may be replaced');}
   }
  }
 }
 assert.equal(totalRemoved,672);
});
test('each new glove is a connected closed surface with valid normals attached to the correct wrist',()=>{
 const g=load('assets/oathguard-natural-hands-v050.glb');
 for(const side of ['L','R']){
  const wrist=g.json.nodes.find(n=>n.name==='hand_'+side),index=g.json.nodes.findIndex(n=>n.name==='Natural glove v050 '+side);assert.ok(wrist.children.includes(index));
  const mesh=g.json.meshes[g.json.nodes[index].mesh],p=mesh.primitives[0],pos=read(g,p.attributes.POSITION),normal=read(g,p.attributes.NORMAL),idx=read(g,p.indices).flat();
  assert.ok(pos.length>8000&&pos.length<25000,'Keep the curved hand detailed and practical for the browser');
  pos.forEach(v=>assert.ok(v.every(Number.isFinite)));normal.forEach(v=>assert.ok(Math.abs(Math.hypot(...v)-1)<.001));
  const edges=new Map(),parents=pos.map((_,i)=>i);const find=i=>parents[i]===i?i:parents[i]=find(parents[i]);
  for(let i=0;i<idx.length;i+=3){assert.equal(new Set(idx.slice(i,i+3)).size,3);for(let j=0;j<3;j++){const a=idx[i+j],b=idx[i+(j+1)%3];parents[find(a)]=find(b);const key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);}}
  assert.equal(new Set(idx.map(find)).size,1,'No detached fingertips or floating glove pieces');
  assert.ok([...edges.values()].every(n=>n===2),'The glove must have no open seams or non-manifold edges');
 }
});
