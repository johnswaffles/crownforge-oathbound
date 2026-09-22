import {clamp,smooth} from './oathguard-motion-v009.js';
export {sampleSwordCarry,SWORD_READY} from './sword-motion-v013.js';
import {SWORD_READY} from './sword-motion-v013.js';

// Shoulder pitch / cut-plane yaw / bank, elbow, wrist; then chest yaw,
// pitch and roll, pelvis yaw, knee compression and forward weight transfer.
const rest=[...SWORD_READY,0,0,0,0,0,0];
const clips=[
 {name:'Descending cut',duration:(.5875/.9),keys:[
  [0,...rest],
  [.27,-2.08,-.35,.10,-.91,.16,-.065,-.025,.020,-.022,-.015,-.018],
  [.48,-.38,-.35,.10,-.34,.21,.025,.042,-.018,.013,-.026,.025],
  [.66,-.12,-.35,.10,-.30,.30,.052,.062,-.028,.024,-.019,.038],
  [.82,-.08,.36,.10,-.46,.48,.030,.020,-.012,.012,-.007,.018],
  [1,...rest]
 ]},
 {name:'Right-to-left slash',duration:(.575/.9),keys:[
  [0,...rest],
  [.28,-1.98,-.155,-.70,-.82,.16,.080,-.022,.015,.025,-.016,-.012],
  [.48,-.62,.155,-.70,-.24,.42,-.180,.035,-.010,-.025,-.024,.030],
  [.67,-.30,.445,-.70,-.18,.70,-.420,.045,-.015,-.075,-.015,.038],
  [.84,-.12,.40,-.28,-.48,.48,-.190,.018,-.008,-.035,-.006,.015],
  [1,...rest]
 ]},
 {name:'Rising cut',duration:(.5875/.9),keys:[
  [0,...rest],
  [.25,.22,-.45,.30,-.40,.38,-.045,.040,-.025,-.018,-.028,-.014],
  [.47,-.35,-.45,.30,-.32,.26,.010,.012,.008,.006,-.011,.025],
  [.65,-1.25,-.45,.30,-.48,.20,.050,-.025,.022,.020,-.004,.035],
  [.82,-.47,.34,.22,-.67,.30,.028,-.008,.010,.010,-.008,.012],
  [1,...rest]
 ]}
 ,{name:'Front kick',duration:(.5875/.9),keys:[
  [0,...rest],
  [.24,-.15,.70,.85,-.60,.28,0,-.20,-.02,0,-.035,-.025],
  [.43,-.25,.82,1.0,-.45,.25,0,-.34,-.03,0,-.02,.025],
  [.56,-.22,.80,.95,-.45,.25,0,-.30,-.02,0,-.02,.025],
  [.76,-.10,.65,.55,-.55,.32,0,-.10,0,0,-.035,0],
  [1,...rest]
 ]}
];

// Quintic Hermite tracks retain contact velocity and join with continuous acceleration.
// Only a real change of direction or the start/end of a clip settles to rest.
function prepare(keys){
 const times=keys.map(k=>k[0]),values=keys.map(k=>k.slice(1));
 const slopes=values.map(v=>v.map(()=>0));
 for(let i=1;i<keys.length-1;i++)for(let j=0;j<rest.length;j++){
  const h0=times[i]-times[i-1],h1=times[i+1]-times[i];
  const a=(values[i][j]-values[i-1][j])/h0,b=(values[i+1][j]-values[i][j])/h1;
  if(a*b>0){const w0=2*h1+h0,w1=h1+2*h0;slopes[i][j]=(w0+w1)/(w0/a+w1/b);}
 }
 return {times,values,slopes};
}
const tracks=clips.map(c=>prepare(c.keys));
export const SWORD_STRIKES=clips.map(({name,duration})=>({name,duration}));
function sampleTrack(t,variant=0){
 t=clamp(t,0,1);const {times,values,slopes}=tracks[variant]||tracks[0];
 let i=0;while(i<times.length-2&&t>times[i+1])i++;
 const h=times[i+1]-times[i],u=(t-times[i])/h,u2=u*u,u3=u2*u,u4=u3*u,u5=u4*u;
 return values[i].map((v,j)=>(1-10*u3+15*u4-6*u5)*v+(u-6*u3+8*u4-3*u5)*h*slopes[i][j]+(10*u3-15*u4+6*u5)*values[i+1][j]+(-4*u3+7*u4-3*u5)*h*slopes[i+1][j]);
}
export function sampleSwordStrike(t,variant=0){
 t=clamp(t,0,1);
 if(variant===3)return sampleTrack(t,3);
 const influence=Math.sin(Math.PI*t)**2;
 const base=sampleTrack(t,variant),body=sampleTrack(t+.032*influence,variant);
 const elbow=sampleTrack(t-.010*influence,variant),wrist=sampleTrack(t-.020*influence,variant);
 const a=[...base];
 // Weight transfer initiates the action; elbow and wrist follow the shoulder.
 // Counter the body's lead at the shoulder to preserve the authored cut plane.
 a[1]-=(body[5]-base[5])+(body[8]-base[8]);
 a[3]=elbow[3];a[4]=wrist[4];
 for(let i=5;i<a.length;i++)a[i]=body[i];
 // More visible loading and forward commitment, with a compensated cut plane.
 const coil=Math.sin(2*Math.PI*t)*Math.sin(Math.PI*t)**2;
 const lobe=(u)=>u>0&&u<1?Math.sin(Math.PI*u)**4:0;
 const bigCoil=(variant===2?.09:.40)*(lobe(t/.32)-lobe((t-.68)/.32));
 const extraYaw=body[5]*.70+coil*(variant===2?.20:.34)+bigCoil,extraHip=body[8]*1.0+coil*(variant===2?.075:.13)+bigCoil*.4;
 a[5]+=extraYaw;a[8]+=extraHip;a[1]-=extraYaw+extraHip;
 a[6]*=variant===2?1.8:2.5;a[7]*=variant===2?1.6:2.0;
 a[9]*=variant===2?2.2:3.0;a[10]*=3.8;
 // A deep combat base and decisive transfer out of the loaded back leg.
 a[9]-=(variant===2?0:.04)*Math.sin(Math.PI*t)**2;
 return a;
}
export function strikeWeight(t){return smooth(t/.22)*smooth((1-t)/.22);}

// One pending attack prevents a fresh input from snapping an unfinished cut
// back to its wind-up. Every accepted swing advances to another animation.
export function advanceSwordStrike(d,dt,attack,forcedVariant=null){
 d.nextStrike??=0;d.strikeVariant??=0;
 const trigger=attack>d.lastAttack+.05&&attack>.35;
 d.lastAttack=attack;
 if(trigger)d.pendingStrike=Number.isInteger(forcedVariant)?clamp(forcedVariant,0,SWORD_STRIKES.length-1):-1;
 if(d.attackElapsed<1)d.attackElapsed=Math.min(1,d.attackElapsed+dt/SWORD_STRIKES[d.strikeVariant].duration);
 // Review mode chains immediately at completion; normal gameplay still uses input.
 if(d.attackElapsed>=1&&d.chainAttacks&&d.pendingStrike===undefined)d.pendingStrike=Number.isInteger(d.chainVariant)?clamp(d.chainVariant,0,SWORD_STRIKES.length-1):-1;
 if(d.attackElapsed>=1&&d.pendingStrike!==undefined){
  d.strikeVariant=d.pendingStrike<0?d.nextStrike:d.pendingStrike;
  d.nextStrike=(d.strikeVariant+1)%SWORD_STRIKES.length;
  delete d.pendingStrike;d.attackElapsed=0;
 }
 return d.attackElapsed<1?sampleSwordStrike(d.attackElapsed,d.strikeVariant):null;
}

// Chamber, explosive extension, recoil, then plant; C2 joins avoid knee snaps.
export function sampleFrontKick(t){
 const keys=[[0,0,0,0,0],[.24,1,-1.65,2.05,-.30],[.43,1,-1.48,.16,.04],[.54,1,-1.48,.16,.04],[.72,1,-1.60,1.95,-.30],[1,0,0,0,0]];
 t=clamp(t,0,1);let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],u=(t-a[0])/(b[0]-a[0]),f=u*u*u*(10+u*(-15+6*u));
 return a.slice(1).map((v,j)=>v+(b[j+1]-v)*f);
}
