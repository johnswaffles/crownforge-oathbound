import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {rig} from '../../tests/oathguard-test-rig.mjs';
import {animateCandidate,DEFAULTS,sampleFoot} from './motion.js';
import {evaluate} from './check-motion.mjs';

test('planted toes hold their world positions; gear clears the legs across all slider corners',()=>{
 for(const cadence of [1.65,2.1])for(const compression of [0,.065])for(const drive of [.5,1.35]){
  const result=evaluate({cadence,compression,drive});
  assert.ok(result.slipSpeed<.001,JSON.stringify(result));
  assert.ok(result.soleMin>.0039,'A boot must not sink through the floor');
  assert.ok(result.reach<.001,'No unreachable run targets');
  assert.ok(result.pelvisRange<.065,'Keep full-range bounce restrained');
  assert.ok(result.shieldClear>.06,'Shield must clear conservative leg capsules');
  assert.ok(result.bladeClear>.10,'Blade must clear conservative leg capsules');
  assert.ok(result.bladeFloor>.20,'Blade must clear the floor');
 }
});
test('default run includes flight, continuous toe trajectories, and modest compression',()=>{
 const result=evaluate();assert.ok(result.pelvisRange>.02&&result.pelvisRange<.04);
 assert.ok(result.maxJump<.15,'No sudden steady-run joint changes at 120 Hz');
 let airborne=0;for(let i=0;i<1000;i++){if(!sampleFoot((i+.5)/1000,4.4).contact&&!sampleFoot((i+.5)/1000+.5,4.4).contact)airborne++;}
 assert.equal(airborne,160);
 for(const phase of [0,.42]){
  const a=sampleFoot(phase-1e-5,4.4),b=sampleFoot(phase+1e-5,4.4);
  assert.ok(Math.abs(a.forward-b.forward)<.0001);assert.ok(Math.abs(a.lift-b.lift)<.00001);
 }
});
test('start and stop stay grounded without sudden joint changes',()=>{
 const result=evaluate(DEFAULTS,{startStop:true});
 assert.ok(result.soleMin>.0039);assert.ok(result.maxJump<.16);assert.ok(result.reach<.002);
 assert.ok(result.shieldClear>.06);assert.ok(result.bladeClear>.10);
});
test('contact locking and body travel remain stable at 30, 60 and 120 Hz',()=>{
 for(const fps of [30,60,120]){const result=evaluate(DEFAULTS,{fps});assert.ok(result.slipSpeed<.001);assert.ok(result.soleMin>.0039);assert.ok(result.pelvisRange<.04);}
});
test('the opposite elbow leads with the front leg, preserving approved proportions',()=>{
 const m=rig(),d=m.userData.oathguard;let leftLead=null,rightLead=null;
 for(let i=0;i<600;i++){
  m.position.z+=4.4/120;const s=animateCandidate(m,i/120,4.4);if(i<240)continue;
  const elbow=side=>m.worldToLocal(d.bones['forearm_'+side].getWorldPosition(new T.Vector3())).z;
  if(s.phase<.02)leftLead={left:elbow('L'),right:elbow('R')};
  if(s.phase>.5&&s.phase<.52)rightLead={left:elbow('L'),right:elbow('R')};
 }
 assert.ok(leftLead.right>rightLead.right+.15,'Right elbow must lead when the left leg leads');
 assert.ok(rightLead.left>leftLead.left+.05,'Left elbow must lead when the right leg leads');
 assert.deepEqual(m.scale.toArray(),[1.15,.88,1.15]);assert.equal(d.bones.head.scale.x,1.03);
});
