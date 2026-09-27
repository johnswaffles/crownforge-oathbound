import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {rig} from './oathguard-test-rig.mjs';
import {animateOathguard as original} from '../src/oathguard-v045.js';
import {animateOathguard} from '../src/oathguard-v046.js';
import {soleCorrection} from '../src/foot-contact-v030.js';
test('new appearance runs with the original cadence and joint poses before terrain fitting',()=>{
 const old=rig(false),current=rig();old.userData.groundSurface=null;current.userData.groundSurface=null;
 old.userData.oathguard.motion=current.userData.oathguard.motion=1;
 for(let i=0;i<360;i++){
  original(old,i/120,1);animateOathguard(current,i/120,1);
  const a=old.userData.oathguard,b=current.userData.oathguard;
  assert.ok(Math.abs(a.phase-b.phase)<1e-9);
  for(const name of ['pelvis','chest','head','upperarm_L','forearm_L','hand_L','upperarm_R','forearm_R','hand_R','thigh_L','shin_L','foot_L','thigh_R','shin_R','foot_R','cape_0','cape_1','cape_2','cape_3']){
   assert.ok(a.bones[name].quaternion.angleTo(b.bones[name].quaternion)<1e-6,`${name} diverged at ${i}`);
  }
 }
 assert.equal(current.scale.x,1.15);assert.equal(current.scale.y,.88);assert.equal(current.userData.oathguard.bones.head.scale.x,1.03);
});
test('original run retargeted to current legs clears terrain and blends into standing and combat',()=>{
 // A discontinuous seven-centimeter curb permits a matching support-height step.
 for(const [surface,stepLimit] of [[()=>0,.045],[(x,z)=>.025*x+.02*z,.045],[(x,z)=>x>.15?.07:0,.085]]){
 const m=rig(),d=m.userData.oathguard;m.userData.groundSurface=surface;let previous=null;
 for(let i=0;i<1080;i++){const speed=i<300?1:i<420?0:1;m.rotation.y=Math.sin(i/180)*.3;animateOathguard(m,i/120,speed,i===650?1:0,i>=800&&i<900,0);m.updateMatrixWorld(true);
 for(const side of ['L','R'])assert.ok(soleCorrection(d.bones['foot_'+side],surface)<.008,`Ground penetration at ${i} ${side}`);
 const pelvis=d.bones.pelvis.getWorldPosition(new T.Vector3());if(previous)assert.ok(pelvis.distanceTo(previous)<stepLimit,`Abrupt body movement at ${i}`);previous=pelvis;
 }
 }
});
