import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleLeg,solveLeg,sampleStrike} from '../src/oathguard-motion-v009.js';

test('leg solve reaches its foot target without inverted knees or non-finite poses',()=>{
 for(const motion of [0,.45,1])for(let i=0;i<400;i++){
  const phase=i/400,drop=-.014-motion*motion*.141+Math.cos(phase*Math.PI*4)*motion*.018;
  const leg=sampleLeg(phase,motion,drop);
  assert.ok(Object.values(leg).every(v=>typeof v==='boolean'||Number.isFinite(v)));
  assert.ok(leg.knee>0&&leg.knee<2.5);
  const forward=-.425*Math.sin(leg.hip)-.425*Math.sin(leg.hip+leg.knee);
  const down=.425*Math.cos(leg.hip)+.425*Math.cos(leg.hip+leg.knee);
  assert.ok(Math.abs(forward-leg.forward)<1e-9);
  assert.ok(Math.abs(down-leg.down)<1e-9);
  if(leg.planted)assert.equal(leg.lift,0);
 }
 const unreachable=solveLeg(2,.8);assert.ok(Number.isFinite(unreachable.knee));
});

test('gait closes continuously and strike returns to its ready pose',()=>{
 for(const motion of [.45,1]){
  const drop=-.014-motion*motion*.141+motion*.018;
  const a=sampleLeg(1-1e-6,motion,drop),b=sampleLeg(0,motion,drop);
  for(const key of ['hip','knee','ankle'])assert.ok(Math.abs(a[key]-b[key])<1e-4,key);
 }
 sampleStrike(0).forEach((v,i)=>assert.ok(Math.abs(v-sampleStrike(1)[i])<1e-12));
 let before=sampleStrike(0);
 for(let i=1;i<=1000;i++){
  const next=sampleStrike(i/1000);
  next.forEach((v,j)=>assert.ok(Math.abs(v-before[j])<.03));before=next;
 }
});

test('foot target velocity remains continuous at lift-off and landing',()=>{
 for(const motion of [.3,.6,1]){
  const duty=.68-.12*motion,h=1e-5,drop=-.12;
  for(const phase of [duty,1]){
   const before=sampleLeg(phase-h,motion,drop),at=sampleLeg(phase,motion,drop),after=sampleLeg(phase+h,motion,drop);
   assert.ok(Math.abs((at.forward-before.forward)/h-(after.forward-at.forward)/h)<.02);
   assert.ok(Math.abs((at.lift-before.lift)/h-(after.lift-at.lift)/h)<.02);
  }
 }
});
