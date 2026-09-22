// Seconds, meters. One shared jump clock for review and local gameplay.
export const JUMP_DURATION=1.08;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function sampleJump(t){
 if(t<0||t>=JUMP_DURATION)return null;
 const air=Math.max(0,Math.min(1,(t-.20)/.56));
 const airborne=t>.20&&t<.76;
 const height=airborne?4*.43*air*(1-air):0;
 const crouch=t<.20?.15*Math.sin(Math.PI*t/.20):t>=.76?.17*Math.sin(Math.PI*(t-.76)/.32):0;
 const weight=smooth(t/.10)*(1-smooth((t-.92)/.16));
 const split=airborne?Math.sin(Math.PI*air):0;
 const stride=(airborne?Math.sin(Math.PI*air)**.65:0)+.35*smooth((t-.48)/.28)*(1-smooth((t-.80)/.28));
 return {height,crouch,weight,tuck:split,airborne,stride,
 forward:1.5*smooth((t-.12)/.76),
 phase:t<.20?'Drive off':t<.48?'Lead knee':t<.76?'Reach for landing':'Absorb landing'};
}
export function startJump(model){
 if(model.userData.jumpState)return false;
 model.userData.jumpState={elapsed:0};return true;
}
export function advanceJump(model,dt){
 const state=model.userData.jumpState;if(!state)return null;
 state.elapsed+=Math.max(0,Math.min(.08,dt));
 const pose=sampleJump(state.elapsed);
 if(!pose)delete model.userData.jumpState;
 return pose;
}
