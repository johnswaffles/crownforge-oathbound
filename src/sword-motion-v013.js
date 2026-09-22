import {clamp,smooth} from './oathguard-motion-v009.js';

// Shoulder XYZ, elbow flexion, wrist pitch. The modeled grip adds 24 degrees
// across the palm, so a modest wrist angle carries the point below the hand.
export const SWORD_READY=[.03,.32,.10,-.38,.42];
export function sampleSwordCarry(gait,motion,breath=0,guard=0){
 const swing=Math.sin(gait-.32)*motion;
 return [
  SWORD_READY[0]+swing*.065+breath*.006-guard*.13,
  SWORD_READY[1]+swing*.025-guard*.08,
  SWORD_READY[2]+motion*.02,
  SWORD_READY[3]-motion*.12-guard*.24,
  SWORD_READY[4]-swing*.045-guard*.08
 ];
}

// A diagonal cut: gather outside the sword shoulder, extend through the cut,
// then recover to the low guard. Chest offsets share the same timing.
const strikes=[
 [0,...SWORD_READY,0,0],
 [.26,-1.18,.40,.20,-1.03,.12,-.08,-.035],
 [.51,-.48,.16,-.04,-.20,.18,.08,.07],
 [.69,.45,.12,.015,-.26,.37,.055,.035],
 [1,...SWORD_READY,0,0]
];
export function sampleSwordStrike(t){
 t=clamp(t,0,1);let a=strikes[0],b=strikes[1];
 for(let i=1;i<strikes.length;i++)if(t<=strikes[i][0]){a=strikes[i-1];b=strikes[i];break;}
 const f=smooth((t-a[0])/(b[0]-a[0]));
 return a.slice(1).map((v,i)=>v+(b[i+1]-v)*f);
}
