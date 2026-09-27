import * as T from '../vendor/three.module.js';
import {solveLeg,clamp} from './oathguard-motion-v009.js';
// Boot sole corners in the exported ankle's local coordinates, including cartoon scaling.
export const SOLE_POINTS=[-.1102,.1102].flatMap(x=>[-.084,.086,.257].map(z=>[x,-.122,z]));
const probe=new T.Vector3();
export function soleCorrection(foot,surface,clearance=0){
 let correction=-Infinity;
 for(const point of SOLE_POINTS){
  probe.fromArray(point).applyMatrix4(foot.matrixWorld);
  correction=Math.max(correction,surface(probe.x,probe.z)+.004+clearance-probe.y);
 }
 return correction;
}
export function fitFeetToGround(model,d,legs,pose){
 const surface=model.userData.groundSurface;if(!surface)return;
 const air=model.userData.groundAirOffset||0;
 model.updateMatrixWorld(true);
 const correction=side=>soleCorrection(d.bones['foot_'+side],surface,legs[side].lift+air);
 // Raise the body to the lower support, then let each knee accommodate the difference.
 const root=clamp(legs.R.free?correction('L'):Math.min(correction('L'),correction('R')),-.2,.3);
 d.bones.pelvis.position.y+=root;
 const targets={L:{...legs.L},R:{...legs.R}};
 for(let pass=0;pass<3;pass++){
  model.updateMatrixWorld(true);
  for(const side of ['L','R']){
   if(legs[side].free)continue;
   const before=targets[side],adjust=clamp(correction(side),-.2,.3);
   const next=solveLeg(before.forward,Math.max(.45,before.down-adjust),d.legLength??.425,d.legLength??.425);
   const rock=legs[side].ankle+legs[side].hip+legs[side].knee;
   pose('thigh_'+side,next.hip,0,side==='L'?.008:-.008);pose('shin_'+side,next.knee);pose('foot_'+side,next.ankle+rock);
   targets[side]=next;
  }
 }
 model.updateMatrixWorld(true);
 d.footContact={left:correction('L'),right:correction('R'),bodyOffset:root};
}
