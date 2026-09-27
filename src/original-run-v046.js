import {sampleLeg,smooth} from './oathguard-motion-v009.js';
export const originalRunWeight=motion=>smooth((motion-.48)/.52);
// Retarget the original joint angles to the natural rig's longer leg bones.
export function originalRunLeg(phase,motion,drop,legLength,blend){
 const scale=1+(legLength/.425-1)*blend;
 const leg=sampleLeg(phase,motion,drop/scale,legLength/scale);
 return {...leg,forward:leg.forward*scale,down:leg.down*scale,lift:leg.lift*scale};
}
// Appearance remains user-selected; the original running pose takes over
// from the standing posture only while the character is running freely.
export function runningPosture(style,weight){
 return {...style,torsoLean:style.torsoLean*(1-weight),shoulders:style.shoulders*(1-weight),
  armMovement:style.armMovement*(1-weight),armBend:style.armBend*(1-weight),
  swordTilt:style.swordTilt*(1-weight),capeMotion:1+(style.capeMotion-1)*(1-weight)};
}
