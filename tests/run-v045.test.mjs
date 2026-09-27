import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {rig} from './oathguard-test-rig.mjs';
import {animateOathguard as previous} from '../src/oathguard-v044.js';
import {animateOathguard} from '../src/oathguard-v045.js';
import {soleCorrection} from '../src/foot-contact-v045.js';
function bounce(animate){const m=rig(),ys=[];for(let i=0;i<720;i++){animate(m,i/120,1);if(i>240)ys.push(m.userData.oathguard.bones.head.getWorldPosition(new T.Vector3()).y);}return Math.max(...ys)-Math.min(...ys);}
test('running torso bounce is reduced by at least sixty percent with the approved proportions',()=>{
 const old=bounce(previous),current=bounce(animateOathguard);assert.ok(current<old*.4,`${old} -> ${current}`);assert.ok(current<.022);
});
test('steadier run still grounds the soles and transitions smoothly on paths and slopes',()=>{
 for(const surface of [()=>0,(x,z)=>.025*x+.02*z,(x,z)=>x>.15?.07:0]){
 const m=rig(),d=m.userData.oathguard;m.userData.groundSurface=surface;let previous=null;
 for(let i=0;i<1080;i++){const speed=i<300?1:i<420?0:1;m.rotation.y=Math.sin(i/180)*.3;animateOathguard(m,i/120,speed,i===650?1:0,i>=800&&i<900,0);m.updateMatrixWorld(true);
 for(const side of ['L','R'])assert.ok(soleCorrection(d.bones['foot_'+side],surface)<.008,`Ground penetration at ${i} ${side}`);
 const pelvis=d.bones.pelvis.getWorldPosition(new T.Vector3());if(previous)assert.ok(pelvis.distanceTo(previous)<.045,`Abrupt body movement at ${i}`);previous=pelvis;
 }
 }
});
