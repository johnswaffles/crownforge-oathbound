import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {rig} from './oathguard-test-rig.mjs';
import {animateOathguard,RELEASE_RUN} from '../src/oathguard-v051.js';
import {animateOathguard as previous} from '../src/oathguard-v046.js';
import {animateCandidate} from '../dev/run-workshop-v049/motion.js';
import {soleCorrection} from '../src/foot-contact-v030.js';
const make=()=>rig(true,'../assets/oathguard-natural-hands-v050.glb');
test('released hands use the approved run exactly on level ground',()=>{
 const a=make(),b=rig();
 assert.deepEqual(RELEASE_RUN,{cadence:1.98,compression:.065,drive:1.35});
 for(let i=0;i<600;i++){
  a.position.z=b.position.z=i*4.4/120;
  animateOathguard(a,i/120,1);animateCandidate(b,i/120,4.4,RELEASE_RUN);
  for(const name of Object.keys(a.userData.oathguard.bones)){
   const x=a.userData.oathguard.bones[name],y=b.userData.oathguard.bones[name];
   assert.ok(x.quaternion.angleTo(y.quaternion)<1e-6,name);
   assert.ok(x.position.distanceTo(y.position)<1e-8,name);
  }
 }
});
test('new run follows elevated slopes, turns and stops without penetrating terrain',()=>{
 for(const surface of [()=>3,(x,z)=>2+.05*x+.08*z,(x,z)=>1+(z>5?.07:0)]){
  const m=make();m.userData.groundSurface=surface;
  for(let i=0;i<1000;i++){
   const speed=i>700?0:4.4;m.rotation.y=Math.sin(i/170)*.5;
   m.position.x+=Math.sin(m.rotation.y)*speed/120;m.position.z+=Math.cos(m.rotation.y)*speed/120;
   m.position.y=surface(m.position.x,m.position.z);m.userData.locomotionVelocity=speed;
   animateOathguard(m,i/120,1);m.updateMatrixWorld(true);
   for(const side of ['L','R']){
    assert.ok(soleCorrection(m.userData.oathguard.bones['foot_'+side],surface)<.009,`${i} ${side}`);
    assert.ok((m.userData.runStudy.diagnostics?.[side]?.reachError??0)<.025,`Unreachable ${i} ${side}`);
   }
  }
  assert.ok(m.userData.runStudy.blend<.002,'Stopped against an obstacle despite move input');
 }
});
test('idle attacks, guard and jump retain existing action poses with the new hands',()=>{
 for(const mode of ['attack','guard','jump']){
  const a=make(),b=rig();
  for(let i=0;i<180;i++){
   const t=i/120,attack=mode==='attack'&&i===20?1:0,guard=mode==='guard';
   if(mode==='jump'){a.userData.jumpState=b.userData.jumpState={elapsed:t};}
   animateOathguard(a,t,0,attack,guard,1);previous(b,t,0,attack,guard,1);
   for(const name of Object.keys(a.userData.oathguard.bones))assert.ok(a.userData.oathguard.bones[name].quaternion.angleTo(b.userData.oathguard.bones[name].quaternion)<1e-6,`${mode} ${name}`);
  }
 }
});
test('running into a jump releases planted feet and preserves the airborne pose',()=>{
 const a=make(),b=rig();
 for(let i=0;i<240;i++){
  const time=i/120;a.position.z=b.position.z=time*4.4;
  if(i>=120)a.userData.jumpState=b.userData.jumpState={elapsed:(i-120)/120};
  animateOathguard(a,time,1);previous(b,time,1);
  if(i>144&&i<210){
   assert.deepEqual(a.userData.runStudy.feet,{});
   for(const name of Object.keys(a.userData.oathguard.bones))assert.ok(a.userData.oathguard.bones[name].quaternion.angleTo(b.userData.oathguard.bones[name].quaternion)<1e-6,`${i} ${name}`);
  }
 }
});
