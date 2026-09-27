import {sampleLeg as sampleWalk,solveLeg,clamp,smooth} from './oathguard-motion-v009.js';
export function runBlend(motion){return smooth((motion-.48)/.52);}
const mix=(a,b,t)=>a+(b-a)*t;
// A planted drive followed by a quicker heel recovery. Contact occupies less
// than half a cycle, leaving a brief flight phase between alternating steps.
export function sampleRunLeg(phase,motion,drop,legLength=.5015){
 const walk=sampleWalk(phase,motion,drop,legLength),blend=runBlend(motion);
 if(!blend)return walk;
 const p=((phase%1)+1)%1,duty=.42,scale=legLength/.5015;
 let forward,lift=0,rock;
 if(p<duty){
  const t=p/duty;forward=.40-.86*t;
  rock=-.08*(1-smooth(t/.22))+.38*smooth((t-.62)/.38);
 }else{
  const t=(p-duty)/(1-duty),slope=-.86/duty*(1-duty);
  forward=(2*t**3-3*t*t+1)*-.46+(t**3-2*t*t+t)*slope+(-2*t**3+3*t*t)*.40+(t**3-t*t)*slope;
  // Heel folds up sooner than the knee comes through; lower before contact.
  lift=.29*Math.sin(Math.PI*t)**2*(1.35-.7*t);
  rock=.38*(1-smooth(t/.38))-.18*Math.sin(Math.PI*t)**2-.08*smooth((t-.72)/.28);
 }
 forward=mix(walk.forward,forward*scale,blend);lift=mix(walk.lift,lift*scale,blend);
 const leg=solveLeg(forward,legLength*2+drop-lift,legLength,legLength);
 let walkRock=walk.ankle+walk.hip+walk.knee;
 const walkDuty=.68-.12*motion;
 if(p>=walkDuty){const t=(p-walkDuty)/(1-walkDuty);walkRock=(.19-.32*smooth(t)-.12*Math.sin(Math.PI*t)**2)*motion;}
 return {...leg,ankle:leg.ankle+mix(walkRock,rock,blend),lift,planted:lift<1e-5};
}
export function sampleRunBody(phase,motion){
 const b=runBlend(motion),step=(((phase% .5)+.5)%.5)/.5;
 // A small compression keeps the torso level while the legs handle push-off.
 const compression=Math.sin(Math.PI*clamp(step/.84,0,1));
 const flight=step>.84?Math.sin(Math.PI*(step-.84)/.16)**2:0;
 return {drop:b*(-.078-.006*compression*compression+.001*flight),
  yaw:b*.075*Math.sin(phase*Math.PI*2-.35),
  roll:b*.025*Math.sin(phase*Math.PI*2-.5),
  shift:b*.017*Math.sin(phase*Math.PI*2-.2)};
}
