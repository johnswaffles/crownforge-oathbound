// Quiet breathing between actions, with one deeper breath in each 19-second cycle.
// Periodic cosine envelopes start and finish at rest, avoiding abrupt pose changes.
export function sampleIdlePresence(time){
 const breath=Math.sin(time*1.48),cycle=((time+3)%19+19)%19;
 const sigh=cycle<5?(1-Math.cos(2*Math.PI*cycle/5))*.5:0;
 return {expand:.009*(breath+1)*.5+.028*sigh,
  lift:.0035*breath+.011*sigh,
  chestPitch:-.009*breath-.023*sigh,
  headPitch:.006*breath+.018*sigh,
  headYaw:.035*Math.sin(time*.37)+.012*Math.sin(time*.71),
  shoulderRoll:.008*breath+.018*sigh,
  weightX:.009*Math.sin(time*.43),
  hipRoll:.006*Math.sin(time*.43),sigh};
}
export function shouldChainAutoAttack({auto,paused,dead,targetDead,hasTarget,distance,jumping}){
 return Boolean(auto&&!paused&&!dead&&hasTarget&&!targetDead&&distance<3.2&&!jumping);
}
