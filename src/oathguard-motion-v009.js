// Two-link leg solve in the character's sagittal plane. Angles are radians.
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function solveLeg(forward,down,upper=.425,lower=.425){
 const distance=Math.hypot(forward,down),safe=clamp(distance,.12,upper+lower-.003),scale=safe/(distance||1);
 forward*=scale;down*=scale;
 const knee=Math.acos(clamp((safe*safe-upper*upper-lower*lower)/(2*upper*lower),-1,1));
 const hip=Math.atan2(-forward,down)-Math.atan2(lower*Math.sin(knee),upper+lower*Math.cos(knee));
 return {hip,knee,ankle:-hip-knee,forward,down};
}
export function sampleLeg(phase,motion,drop){
 const p=((phase%1)+1)%1,duty=.68-.12*motion,stride=.10+.24*motion;
 let forward,lift=0,rock=0;
 if(p<duty){
  const t=p/duty;forward=stride*(1-2*t);
  rock=-.13*(1-smooth(t/.18))+.19*smooth((t-.79)/.21);
 }else{
  const t=(p-duty)/(1-duty);const slope=-2*(1-duty)/duty;
  forward=stride*((2*t*t*t-3*t*t+1)*-1+(t*t*t-2*t*t+t)*slope+(-2*t*t*t+3*t*t)+(t*t*t-t*t)*slope);lift=(.065+.065*motion)*Math.sin(Math.PI*t)**2;
  rock=.19*(1-t)-.13*t-.12*Math.sin(Math.PI*t);
 }
 const leg=solveLeg(forward*motion,.85+drop-lift*motion);
 return {...leg,ankle:leg.ankle+rock*motion,lift:lift*motion,planted:p<duty};
}
// Shoulder, elbow, wrist and chest key poses: gather, wind-up, strike, follow-through, settle.
const strikes=[
 [0,.04,.38,-.15,-.58,.06,.025,-.03],
 [.28,-.98,.27,-.20,-.93,-.06,-.21,-.035],
 [.52,.12,-.14,-.03,-.37,-.08,.25,.11],
 [.70,.40,-.12,-.01,-.28,-.04,.18,.06],
 [1,.04,.38,-.15,-.58,.06,.025,-.03]
];
export function sampleStrike(t){
 t=clamp(t,0,1);let a=strikes[0],b=strikes[1];
 for(let i=1;i<strikes.length;i++)if(t<=strikes[i][0]){a=strikes[i-1];b=strikes[i];break;}
 const f=smooth((t-a[0])/(b[0]-a[0]));return a.slice(1).map((v,i)=>v+(b[i+1]-v)*f);
}
