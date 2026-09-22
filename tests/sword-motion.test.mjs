import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {animateOathguard} from '../src/oathguard-v037.js';
import {sampleSwordStrike,SWORD_READY,SWORD_STRIKES} from '../src/sword-motion-v034.js';
import {soleCorrection} from '../src/foot-contact-v019.js';

function exportedRig(){
 const bytes=readFileSync(new URL('../assets/oathguard-v022.glb',import.meta.url));
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const nodes=doc.nodes.map(n=>{
  const o=new T.Object3D();o.name=n.name;
  if(n.translation)o.position.fromArray(n.translation);
  if(n.rotation)o.quaternion.fromArray(n.rotation);
  if(n.scale)o.scale.fromArray(n.scale);
  return o;
 });
 doc.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>nodes[i].add(nodes[j])));
 const model=new T.Group();doc.scenes[doc.scene||0].nodes.forEach(i=>model.add(nodes[i]));
 const bones={},rest={};
 for(const i of doc.skins[0].joints){const bone=nodes[i];bones[bone.name]=bone;rest[bone.name]={q:bone.quaternion.clone(),p:bone.position.clone()};}
 model.userData.oathguard={bones,rest,phase:0,lastTime:null,motion:0,guard:0,lastYaw:0,turn:0,attackElapsed:1,lastAttack:0,clothMotion:0,clothTurn:0};
 model.userData.groundSurface=()=>0;
 return model;
}

test('descending, rising and kick weapon poses clear both armored legs',()=>{
 for(const variant of [0,2,3])for(const speed of [0,.45,1])for(const guard of [false,true]){
  const model=exportedRig(),d=model.userData.oathguard;
  for(let i=0;i<360;i++){
   animateOathguard(model,i/240,speed,i===60?1:0,guard,variant);model.updateMatrixWorld(true);
   for(const side of ['L','R'])for(const [top,bottom,radius] of [['thigh_','shin_',.158],['shin_','foot_',.132]]){
    const a=d.bones[top+side].getWorldPosition(new T.Vector3()),b=d.bones[bottom+side].getWorldPosition(new T.Vector3()),leg=new T.Line3(a,b);
    for(let along=.087;along<=.895;along+=.025)for(const across of [-.026,0,.026]){
     const point=new T.Vector3(.293*1.12-.3472,.899-.975-along*Math.sin(.42)+across*Math.cos(.42),along*Math.cos(.42)+across*Math.sin(.42)).applyMatrix4(d.bones.hand_R.matrixWorld);
     const clearance=point.distanceTo(leg.closestPointToPoint(point,true,new T.Vector3()));
     assert.ok(clearance>radius,`${side} ${top} blade clearance ${clearance} at phase ${d.attackElapsed}, speed ${speed}, guard ${guard}`);
    }
   }
  }
 }
});

test('descending cut crosses a centered opponent in front of the character',()=>{
 const model=exportedRig(),d=model.userData.oathguard,hits=[];
 const point=along=>new T.Vector3(.293*1.12-.3472,.899-.975-along*Math.sin(.42),along*Math.cos(.42)).applyMatrix4(d.bones.hand_R.matrixWorld);
 for(let i=0;i<240;i++){
  animateOathguard(model,i/480,0,i===0?1:0,false,0);model.updateMatrixWorld(true);
  if(d.attackElapsed<.30||d.attackElapsed>.66)continue;
  const a=point(.087),b=point(.895),f=(.85-a.z)/(b.z-a.z);
  if(f<0||f>1)continue;
  const contact=a.lerp(b,f);
  if(Math.abs(contact.x)<.18&&contact.y>.8&&contact.y<1.9)hits.push(contact.y);
 }
 assert.ok(hits.length>20,`Expected a sustained centered cut, got ${hits.length} samples`);
 assert.ok(hits[0]-hits.at(-1)>.35,'Blade must descend through the target, not merely point toward it');
});

test('low sword guard keeps the blade forward and below the fist across the gait',()=>{
 for(const speed of [0,.45,1]){
  const model=exportedRig(),hand=model.userData.oathguard.bones.hand_R;
  for(let i=0;i<240;i++){
   animateOathguard(model,i/60,speed);model.updateMatrixWorld(true);
   const direction=new T.Vector3(0,-Math.sin(.42),Math.cos(.42)).transformDirection(hand.matrixWorld);
   assert.ok(direction.y<-.15,'Low guard must not revert to an upright hammer pose');
   assert.ok(direction.z>.5,'Point should stay forward of the sword hand');
  }
 }
});

test('all three cuts recover continuously and keep their tips clear of hard ground',()=>{
 for(let variant=0;variant<3;variant++){
 assert.deepEqual(sampleSwordStrike(0,variant).slice(0,5),SWORD_READY);
 sampleSwordStrike(0,variant).forEach((v,i)=>assert.ok(Math.abs(v-sampleSwordStrike(1,variant)[i])<1e-12));
 let previous=sampleSwordStrike(0,variant);
 for(let i=1;i<=1000;i++){
  const pose=sampleSwordStrike(i/1000,variant);
  pose.forEach((v,j)=>assert.ok(Math.abs(v-previous[j])<.03));previous=pose;
 }
 }
 for(let variant=0;variant<3;variant++)for(const speed of [0,.45,1])for(const guard of [false,true]){
  const model=exportedRig(),hand=model.userData.oathguard.bones.hand_R;
  for(let i=0;i<240;i++){
   animateOathguard(model,i/60,speed,i===60?1:0,guard,variant);model.updateMatrixWorld(true);
   const tip=new T.Vector3(.293*1.12-.3472,.899-.895*Math.sin(.42)-.975,.895*Math.cos(.42)).applyMatrix4(hand.matrixWorld);
   assert.ok(tip.y>.12,`Swing ${variant}, speed ${speed}, guard ${guard} loses ground clearance at frame ${i}: ${tip.y}`);
  }
 }
});

test('strike tracks carry velocity through contact without discontinuities',()=>{
 const h=1e-5;
 for(let variant=0;variant<3;variant++){
  const contact=variant===2?.47:.48;
  const before=sampleSwordStrike(contact-h,variant),at=sampleSwordStrike(contact,variant),after=sampleSwordStrike(contact+h,variant);
  assert.ok(Math.abs((after[0]-before[0])/(2*h))>1,'Shoulder must keep moving through contact');
  for(let i=0;i<at.length;i++)assert.ok(Math.abs((at[i]-before[i])/h-(after[i]-at[i])/h)<.01,'Contact velocity must be continuous');
  for(const t of [0,1]){
   const a=sampleSwordStrike(t,variant),b=sampleSwordStrike(t===0?h:1-h,variant);
   a.forEach((v,i)=>assert.ok(Math.abs((v-b[i])/h)<.01,'Start and recovery settle smoothly'));
  }
 }
});

test('movement has continuous acceleration across authored and delayed joint poses',()=>{
 const times=[[.27,.48,.66,.82],[.28,.48,.67,.84],[.25,.47,.65,.82]],h=1e-5;
 for(let variant=0;variant<3;variant++)for(const key of times[variant])for(const delay of [0,.032,-.010,-.020]){
  let lo=0,hi=1;
  for(let k=0;k<45;k++){const mid=(lo+hi)/2;if(mid+delay*Math.sin(Math.PI*mid)**2<key)lo=mid;else hi=mid;}
  const t=(lo+hi)/2,a=sampleSwordStrike(t-2*h,variant),b=sampleSwordStrike(t-h,variant),c=sampleSwordStrike(t,variant),d=sampleSwordStrike(t+h,variant),e=sampleSwordStrike(t+2*h,variant);
  c.forEach((v,j)=>{
   const before=(v-2*b[j]+a[j])/(h*h),after=(e[j]-2*d[j]+v)/(h*h);
   assert.ok(Math.abs(before-after)<.2,`Acceleration snap in swing ${variant}, channel ${j}: ${before} to ${after}`);
  });
 }
});

test('repeated attacks cycle all three cuts without interrupting an active swing',()=>{
 const model=exportedRig(),d=model.userData.oathguard,seen=[];let previous=1;
 for(let i=0;i<600;i++){
  const attack=i%100===10?1:0;
  animateOathguard(model,i/60,0,attack);
  if(d.attackElapsed===0&&previous!==0)seen.push(d.strikeVariant);
  previous=d.attackElapsed;
 }
 assert.deepEqual(seen,[0,1,2,3,0,1]);
 const interrupted=exportedRig(),state=interrupted.userData.oathguard;
 animateOathguard(interrupted,0,0,1);animateOathguard(interrupted,.08,0,0);
 const phase=state.attackElapsed;
 animateOathguard(interrupted,.16,0,1);
 assert.equal(state.strikeVariant,0);assert.ok(state.attackElapsed>phase);
 assert.equal(state.pendingStrike,-1);
 for(let i=3;i<25;i++)animateOathguard(interrupted,i*.08,0,0);
 assert.equal(state.strikeVariant,1);assert.equal(state.pendingStrike,undefined);
});

test('attack weight transfer keeps both standing boots on the support surface',()=>{
 for(let variant=0;variant<3;variant++){
  const model=exportedRig(),d=model.userData.oathguard;
  for(let i=0;i<100;i++){
   animateOathguard(model,i/60,0,i===5?1:0,false,variant);
   for(const side of ['L','R'])assert.ok(Math.abs(soleCorrection(d.bones['foot_'+side],()=>0))<.002);
  }
 }
});

test('replacement slash travels from the character upper right to lower left',()=>{
 const model=exportedRig(),d=model.userData.oathguard,hand=d.bones.hand_R;
 let start,end;
 for(let i=0;i<240;i++){
  animateOathguard(model,i/240,0,i===0?1:0,false,1);model.updateMatrixWorld(true);
  const tip=new T.Vector3(.293*1.12-.3472,.899-.895*Math.sin(.42)-.975,.895*Math.cos(.42)).applyMatrix4(hand.matrixWorld);
  if(!start&&d.attackElapsed>=.28)start=tip;
  if(!end&&d.attackElapsed>=.67){
   end=tip;
   const handInChest=d.bones.chest.worldToLocal(hand.getWorldPosition(new T.Vector3()));
   const elbowInChest=d.bones.chest.worldToLocal(d.bones.forearm_R.getWorldPosition(new T.Vector3()));
   assert.ok(handInChest.z>.22&&elbowInChest.z>.15,'Follow-through must stay in front of the breastplate');
  }
 }
 assert.ok(start.x>.30&&start.y>1.8,`Expected upper-right start: ${start.toArray()}`);
 assert.ok(end.x<-.20&&end.y<1.0,`Expected lower-left finish: ${end.toArray()}`);
 assert.ok(start.x-end.x>.7&&start.y-end.y>1,'Slash must cross and descend clearly');
});

test('the cutting edge leads through the active part of all three swings',()=>{
 for(let variant=0;variant<3;variant++){
 const model=exportedRig(),d=model.userData.oathguard,hand=d.bones.hand_R;
 let previous=null,checked=0;
 for(let i=0;i<360;i++){
  animateOathguard(model,i/480,0,i===120?1:0,false,variant);model.updateMatrixWorld(true);
  const point=new T.Vector3(.293*1.12-.3472,.899-.6*Math.sin(.42)-.975,.6*Math.cos(.42)).applyMatrix4(hand.matrixWorld);
  if(previous&&d.attackElapsed>.32&&d.attackElapsed<.63){
   const axis=new T.Vector3(0,-Math.sin(.42),Math.cos(.42)).transformDirection(hand.matrixWorld);
   const edge=new T.Vector3(0,Math.cos(.42),Math.sin(.42)).transformDirection(hand.matrixWorld);
   const velocity=point.clone().sub(previous);velocity.addScaledVector(axis,-velocity.dot(axis)).normalize();
   assert.ok(Math.abs(velocity.dot(edge))>.95,`Swing ${variant} at ${d.attackElapsed}: edge alignment ${Math.abs(velocity.dot(edge))}`);
   checked++;
  }
  previous=point;
 }
 assert.ok(checked>40);
 }
});

test('run gives both hands a clear opposing drive and settles back to idle',()=>{
 const model=exportedRig(),d=model.userData.oathguard,positions={L:[],R:[]};
 for(let i=0;i<360;i++){
  animateOathguard(model,i/60,1);model.updateMatrixWorld(true);
  if(i<180)continue;
  for(const side of ['L','R'])positions[side].push(d.bones.chest.worldToLocal(d.bones['hand_'+side].getWorldPosition(new T.Vector3())).z);
 }
 for(const side of ['L','R'])assert.ok(Math.max(...positions[side])-Math.min(...positions[side])>.12,`${side} hand needs visible fore/aft travel`);
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const l=mean(positions.L),r=mean(positions.R);
 assert.ok(positions.L.reduce((s,v,i)=>s+(v-l)*(positions.R[i]-r),0)<0,'Arms should counter-swing');
 for(let i=360;i<540;i++)animateOathguard(model,i/60,0);
 assert.ok(d.motion<.00001,'Running effort should blend away on stopping');
});

test('enlarged shield clears both legs during strides and all four attacks',()=>{
 const bytes=readFileSync(new URL('../assets/oathguard-v022.glb',import.meta.url));
 const jsonLength=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=20+jsonLength+8;
 const read=(id,size)=>{const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],out=[];
  for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out.push(bytes.readFloatLE(bin+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*4)+k*4));return out;};
 const paint=doc.materials.findIndex(m=>m.name==='V4 weathered shield paint');
 const primitive=doc.meshes[0];
 const positions=read(primitive.primitives.find(p=>p.material===paint).attributes.POSITION,3);
 const skin=doc.skins[0],handIndex=skin.joints.findIndex(i=>doc.nodes[i].name==='hand_L');
 const inverse=new T.Matrix4().fromArray(read(skin.inverseBindMatrices,16),handIndex*16);
 const shield=[];for(let i=0;i<positions.length;i+=3)shield.push(new T.Vector3().fromArray(positions,i).applyMatrix4(inverse));
 for(const speed of [0,.45,1])for(const variant of [null,0,1,2,3]){
  const model=exportedRig(),d=model.userData.oathguard;
  for(let frame=0;frame<360;frame++){
   animateOathguard(model,frame/120,speed,variant!==null&&frame===100?1:0,false,variant);model.updateMatrixWorld(true);
   for(const side of ['L','R'])for(const [top,bottom,radius] of [['thigh_','shin_',.158],['shin_','foot_',.132]]){
    const line=new T.Line3(d.bones[top+side].getWorldPosition(new T.Vector3()),d.bones[bottom+side].getWorldPosition(new T.Vector3()));
    for(const local of shield){const point=local.clone().applyMatrix4(d.bones.hand_L.matrixWorld);
     const distance=point.distanceTo(line.closestPointToPoint(point,true,new T.Vector3()));
     assert.ok(distance>radius,`Shield clips ${side} ${top}: ${distance} at ${frame}, speed ${speed}`);
    }
   }
  }
 }
});

test('rising cut crosses a centered opponent in front of the character',()=>{
 const model=exportedRig(),d=model.userData.oathguard,hits=[];
 const point=along=>new T.Vector3(.293*1.12-.3472,.899-.975-along*Math.sin(.42),along*Math.cos(.42)).applyMatrix4(d.bones.hand_R.matrixWorld);
 for(let i=0;i<240;i++){
  animateOathguard(model,i/480,0,i===0?1:0,false,2);model.updateMatrixWorld(true);
  if(d.attackElapsed<.30||d.attackElapsed>.66)continue;
  const a=point(.087),b=point(.895),f=(.85-a.z)/(b.z-a.z);
  if(f<0||f>1)continue;
  const contact=a.lerp(b,f);
  if(Math.abs(contact.x)<.18&&contact.y>.8&&contact.y<1.9)hits.push(contact.y);
 }
 assert.ok(hits.length>20,`Expected a sustained centered cut, got ${hits.length} samples`);
 assert.ok(hits.at(-1)-hits[0]>.35,'Blade must rise through the target, not merely point toward it');
});

test('standing attacks open a staggered stance and drive the hips forward',()=>{
 for(const variant of [0,1,2]){
  const model=exportedRig(),d=model.userData.oathguard;let stance=0,drive=0;
  for(let i=0;i<240;i++){
   animateOathguard(model,i/120,0,i===20?1:0,false,variant);model.updateMatrixWorld(true);
   const left=d.bones.foot_L.getWorldPosition(new T.Vector3()),right=d.bones.foot_R.getWorldPosition(new T.Vector3());
   stance=Math.max(stance,Math.abs(left.z-right.z));drive=Math.max(drive,d.bones.pelvis.position.z-d.rest.pelvis.p.z);
  }
  assert.ok(stance>.35,`Swing ${variant} needs a broad fighting stance`);
  assert.ok(drive>.10,`Swing ${variant} needs forward commitment`);
 }
});

test('front kick chambers then drives a lifted boot forward while the support sole stays planted',()=>{
 for(const speed of [0,.45,1])for(const guard of [false,true]){
  const model=exportedRig(),d=model.userData.oathguard;let chamber,impact,maxSupport=0;
  for(let i=0;i<420;i++){
   animateOathguard(model,i/240,speed,i===20?1:0,guard,3);model.updateMatrixWorld(true);
   const t=d.attackElapsed;
   if(d.strikeVariant!==3||t>=1)continue;
   const foot=d.bones.foot_R.getWorldPosition(new T.Vector3());
   if(t>.25&&t<.70)maxSupport=Math.max(maxSupport,Math.abs(soleCorrection(d.bones.foot_L,()=>0)));
   if(!chamber&&t>=.24)chamber=foot.clone();
   if(!impact&&t>=.43)impact=foot.clone();
   if(t>.30&&t<.60){
    const left=d.bones.hand_L.getWorldPosition(new T.Vector3()),right=d.bones.hand_R.getWorldPosition(new T.Vector3());
    assert.ok(right.x-left.x>.8,'Weapons should open to both sides');
   }
  }
  assert.ok(maxSupport<.004,`Supporting sole drift ${maxSupport}`);
  assert.ok(impact.z>chamber.z+.30,'Kick must extend forward from the chamber');
  assert.ok(impact.z>.65&&impact.y>.65,'Boot should reach the opponent above the ground');
  assert.ok(Math.abs(soleCorrection(d.bones.foot_R,()=>0))<.15,'Kicking foot must return to locomotion');
 }
});

 test('all attacks run at 90 percent of the previous speed',()=>{
 assert.deepEqual(SWORD_STRIKES.map(s=>s.duration),[.5875/.9,.575/.9,.5875/.9,.5875/.9]);
 });


test('continuous review chains all four attacks without idle frames and stops when released',()=>{
 const model=exportedRig(),d=model.userData.oathguard,seen=[];d.chainAttacks=true;
 for(let i=0;i<720;i++){
  animateOathguard(model,i/120,0,0);
  assert.ok(d.attackElapsed<1,'No idle gap may occur between chained attacks');
  if(d.attackElapsed===0)seen.push(d.strikeVariant);
 }
 assert.deepEqual(seen.slice(0,8),[0,1,2,3,0,1,2,3]);
 d.chainAttacks=false;
 for(let i=720;i<840;i++)animateOathguard(model,i/120,0,0);
 assert.equal(d.attackElapsed,1);assert.equal(d.pendingStrike,undefined);
});

// Jump uses the exported rig and the same clock in review and gameplay.
const {startJump,advanceJump,sampleJump,JUMP_DURATION}=await import('../src/jump-motion-v037.js');
test('jump rejects retrigger, pauses without elapsed time and finishes grounded',()=>{
 const model=exportedRig();assert.equal(startJump(model),true);
 assert.equal(startJump(model),false);advanceJump(model,0);
 assert.equal(model.userData.jumpState.elapsed,0);
 let peak=0;
 for(let i=0;i<300;i++){
  const j=advanceJump(model,1/240);peak=Math.max(peak,j?.height||0);
  model.position.y=j?.height||0;model.userData.groundAirOffset=model.position.y;
  animateOathguard(model,i/240,0);model.updateMatrixWorld(true);
  for(const side of ['L','R']){
   const foot=model.userData.oathguard.bones['foot_'+side];
   assert.ok(Number.isFinite(foot.matrixWorld.elements[13]));
   if(j&&j.height>.3)assert.ok(soleCorrection(foot,()=>0)<-.15,'both boots visibly airborne');
   if(!j)assert.ok(Math.abs(soleCorrection(foot,()=>0))<.02,'boots return to hard ground');
  }
 }
 assert.ok(peak>.42);assert.equal(model.userData.jumpState,undefined);
 assert.equal(sampleJump(JUMP_DURATION),null);assert.equal(startJump(model),true);
});

test('ditch leap drives forward with a lead knee and trailing boot instead of a symmetric bounce',()=>{
 const model=exportedRig();startJump(model);advanceJump(model,.08);advanceJump(model,.08);advanceJump(model,.08);advanceJump(model,.08);advanceJump(model,.08);
 animateOathguard(model,.4,0);model.updateMatrixWorld(true);
 const bones=model.userData.oathguard.bones;
 const lead=bones.foot_L.getWorldPosition(new T.Vector3()),trail=bones.foot_R.getWorldPosition(new T.Vector3());
 assert.ok(lead.z-trail.z>.45,'split stride visible at flight midpoint');
 let last=0;
 for(let t=0;t<1.08;t+=.01){const j=sampleJump(t);assert.ok(j.forward>=last);last=j.forward;assert.ok(j.height<=.431);}
 assert.ok(last>1.49,'review leap clears a 1.5 meter span');
});
