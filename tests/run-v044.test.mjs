import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleRunLeg,sampleRunBody} from '../src/run-motion-v044.js';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {animateOathguard} from '../src/oathguard-v044.js';
import {soleCorrection} from '../src/foot-contact-v030.js';
import {rig} from './oathguard-test-rig.mjs';
test('run has a planted drive, heel recovery and two brief flight intervals',()=>{
 let flight=0,contact=0,maxLift=0;
 for(let i=0;i<1000;i++){const p=i/1000,drop=sampleRunBody(p,1).drop,a=sampleRunLeg(p,1,drop),b=sampleRunLeg(p+.5,1,drop);if(a.planted)contact++;if(a.lift>.001&&b.lift>.001)flight++;maxLift=Math.max(maxLift,a.lift);for(const key of ['hip','knee','ankle','forward','down'])assert.ok(Number.isFinite(a[key]));assert.ok(a.knee>=0&&a.knee<2.4);}
 assert.ok(contact>=419&&contact<=425);assert.ok(flight>70&&flight<180);assert.ok(maxLift>.26&&maxLift<.32);
});
test('run foot path and velocity are continuous at contact and toe-off',()=>{
 for(const p of [0,.42,1])for(const motion of [.6,.8,1]){const h=1e-6,drop=-.04,a=sampleRunLeg(p-h,motion,drop),b=sampleRunLeg(p,motion,drop),c=sampleRunLeg(p+h,motion,drop);for(const key of ['forward','lift','hip','knee','ankle']){assert.ok(Math.abs(a[key]-c[key])<.001,key);assert.ok(Math.abs((b[key]-a[key])/h-(c[key]-b[key])/h)<.025,`${motion} ${p} ${key}`);}}
});
test('latest approved rig keeps soles above ground through run, stop, turns and attacks',()=>{
 const m=rig(),d=m.userData.oathguard;let previous=null;
 for(let i=0;i<900;i++){
  const speed=i<360?1:i<480?0:1;m.rotation.y=Math.sin(i/180)*.3;animateOathguard(m,i/120,speed,i===600?1:0,false,0);m.updateMatrixWorld(true);
  for(const side of ['L','R'])assert.ok(soleCorrection(d.bones['foot_'+side],()=>0)<.008,`Ground penetration at ${i} ${side}`);
  const pelvis=d.bones.pelvis.getWorldPosition(new T.Vector3());if(previous)assert.ok(pelvis.distanceTo(previous)<.045,`Abrupt root displacement at ${i}`);previous=pelvis;
 }
});
test('new gloves replace the old glove primitive and are attached to the correct wrist',()=>{
 const b=readFileSync(new URL('../assets/oathguard-natural-hands-v044.glb',import.meta.url)),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const side of ['L','R']){const wrist=g.nodes.find(n=>n.name==='hand_'+side);assert.ok(wrist.children.some(i=>g.nodes[i].name==='Fitted glove '+side));}
 assert.ok(g.meshes.every(m=>m.primitives.every(p=>g.materials[p.material].name!=='V11 glove leather')));
});
test('hand replacement preserves every byte of the approved armor and weapon geometry',()=>{
 const old=readFileSync(new URL('../assets/oathguard-natural-v039.glb',import.meta.url)),updated=readFileSync(new URL('../assets/oathguard-natural-hands-v044.glb',import.meta.url));
 const oldBin=old.subarray(28+old.readUInt32LE(12)),newBin=updated.subarray(28+updated.readUInt32LE(12));assert.deepEqual(newBin.subarray(0,oldBin.length),oldBin);
});
