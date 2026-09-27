import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {buildWalkSurface} from '../src/ground-surface.js';
import {fitFeetToGround,soleCorrection} from '../src/foot-contact-v030.js';
import {sampleLeg} from '../src/oathguard-motion-v009.js';

function rig(motion,phase,jump){
 const model=new T.Group();model.position.set(.2,jump,.3);model.rotation.y=.63;
 const pelvis=new T.Bone();pelvis.position.y=1.133;model.add(pelvis);
 const bones={pelvis},legs={},drop=-.014-motion*motion*.082+Math.cos(phase*Math.PI*4)*motion*.012;
 pelvis.position.y+=drop;pelvis.rotation.set(0,.03,.014);
 function pose(name,x=0,y=0,z=0){bones[name].rotation.set(x,y,z);}
 for(const [side,offset] of [['L',0],['R',.5]]){
  const thigh=new T.Bone(),shin=new T.Bone(),foot=new T.Bone();pelvis.add(thigh);thigh.add(shin);shin.add(foot);
  thigh.position.x=(side==='L'?-1:1)*.1344;shin.position.y=foot.position.y=-.5015;
  Object.assign(bones,{['thigh_'+side]:thigh,['shin_'+side]:shin,['foot_'+side]:foot});
  const leg=legs[side]=sampleLeg(phase+offset,motion,drop,.5015);
  pose('thigh_'+side,leg.hip,0,side==='L'?.008:-.008);pose('shin_'+side,leg.knee);pose('foot_'+side,leg.ankle);
 }
 model.userData.groundAirOffset=jump;
 return {model,d:{bones,legLength:.5015},legs,pose};
}

test('natural-proportion soles meet hard surfaces while preserving lifted feet and jump clearance',()=>{
 for(const motion of [0,.45,1])for(const phase of [0,.2,.49,.7])for(const jump of [0,.3]){
  for(const surface of [()=>.09,(x,z)=>.03+.035*x+.025*z,(x,z)=>x>.15?.105:.045]){
   const {model,d,legs,pose}=rig(motion,phase,jump);model.userData.groundSurface=surface;
   fitFeetToGround(model,d,legs,pose);
   for(const side of ['L','R']){
    const error=soleCorrection(d.bones['foot_'+side],surface,legs[side].lift+jump);
    assert.ok(Math.abs(error)<.002,JSON.stringify({motion,phase,jump,side,error}));
   }
  }
 }
});
