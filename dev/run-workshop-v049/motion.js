import * as T from '../../vendor/three.module.js';
import {animateOathguard as original} from '../../src/oathguard-v046.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const DEFAULTS=Object.freeze({cadence:1.86,compression:.040,drive:1});
export function gaitParameters(speed,settings=DEFAULTS){
 const run=smooth((speed-1.2)/1.6);
 return {run,frequency:mix(.9,settings.cadence,Math.sqrt(clamp(speed/4.4,0,1))),duty:mix(.64,.42,run)};
}
// A grounded foot travels backwards in character space at the EXACT forward speed.
// The swing curve meets it with the same velocity, avoiding a stamp at touchdown.
export function sampleFoot(phase,speed,scaleZ=1.15,settings=DEFAULTS){
 const p=((phase%1)+1)%1,{run,frequency,duty}=gaitParameters(speed,settings);
 const travel=speed/(frequency*scaleZ),length=travel*duty,front=length*.43,back=front-length;
 let forward,lift=0,pitch=0;
 if(p<duty){forward=front-travel*p;pitch=.53*run*smooth((p/duty-.58)/.42);}
 else{
  const u=(p-duty)/(1-duty),m=-travel*(1-duty);
  forward=(2*u**3-3*u*u+1)*back+(u**3-2*u*u+u)*m+(-2*u**3+3*u*u)*front+(u**3-u*u)*m;
  // Early heel recovery, then knee leads and the lower leg unfolds into contact.
  lift=(.085+.235*run)*Math.sin(Math.PI*u)**1.6*(1+.34*Math.sin(2*Math.PI*u));
  pitch=.53*run*(1-smooth(u/.8))+.37*run*Math.sin(Math.PI*u)*Math.exp(-u*2)-.17*run*Math.sin(Math.PI*u)**2;
 }
 return {phase:p,contact:p<duty,forward,lift,pitch,frequency,duty,run};
}
function setModelRotation(model,bone,rotation){
 const parentInModel=new T.Matrix4().copy(model.matrixWorld).invert().multiply(bone.parent.matrixWorld);
 const parentQ=new T.Quaternion();parentInModel.decompose(new T.Vector3(),parentQ,new T.Vector3());
 bone.quaternion.copy(parentQ.invert().multiply(rotation));
 bone.updateWorldMatrix(false,true);
}
// Solve in unscaled model space, so the user's width and height proportions remain intact.
function solveFoot(model,d,side,targetWorld,pitch){
 model.updateMatrixWorld(true);
 const hip=d.bones['thigh_'+side],shin=d.bones['shin_'+side],foot=d.bones['foot_'+side];
 const a=model.worldToLocal(hip.getWorldPosition(V()));
 const target=model.worldToLocal(targetWorld.clone());
 const direction=target.clone().sub(a),distance=direction.length();direction.normalize();
 const upper=d.rest['shin_'+side].p.length(),lower=d.rest['foot_'+side].p.length();
 const safe=clamp(distance,.12,upper+lower-.004);
 const along=(upper*upper-lower*lower+safe*safe)/(2*safe);
 const pole=V(0,0,1).addScaledVector(direction,-direction.z).normalize();
 const knee=a.clone().addScaledVector(direction,along).addScaledVector(pole,Math.sqrt(Math.max(0,upper*upper-along*along)));
 const end=a.clone().addScaledVector(direction,safe);
 setModelRotation(model,hip,new T.Quaternion().setFromUnitVectors(V(0,-1,0),knee.clone().sub(a).normalize()));
 setModelRotation(model,shin,new T.Quaternion().setFromUnitVectors(V(0,-1,0),end.sub(knee).normalize()));
 setModelRotation(model,foot,new T.Quaternion().setFromEuler(new T.Euler(pitch,0,0)));
 return Math.max(0,distance-safe);
}
export function animateCandidate(model,time,velocity,settings=DEFAULTS){
 const d=model.userData.oathguard;
 const s=model.userData.runStudy??={phase:0,lastTime:time,blend:0,feet:{},lastSpeed:velocity,accel:0};
 const dt=clamp(time-s.lastTime,0,.05);s.lastTime=time;
 const speed=Math.max(0,velocity),goal=smooth(speed/.8);
 s.blend+=(goal-s.blend)*(1-Math.exp(-dt*14));
 s.accel+=(clamp((speed-s.lastSpeed)/(dt||1),-8,8)-s.accel)*(1-Math.exp(-dt*6));s.lastSpeed=speed;
 original(model,time,clamp(speed/4.4,0,1));
 if(s.blend<.002){s.feet={};return s;}
 const {frequency,run}=gaitParameters(speed,settings);
 s.phase=(s.phase+dt*frequency*smooth(speed/.35))%1;
 const phase=s.phase,gait=phase*Math.PI*2,step=(phase*2)%1,blend=s.blend;
 function pose(name,x=0,y=0,z=0){const b=d.bones[name],next=d.rest[name].q.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,z)));b.quaternion.slerp(next,blend);}
 // Compress on loading, rise into push-off; head does not inherit a repeated exaggerated hop.
 const compression=Math.sin(Math.PI*clamp(step/.84,0,1))**2;
 const flightDuration=.08/frequency,flightTime=clamp((step-.84)/.16,0,1)*flightDuration;
 const flightRise=.5*9.81*flightTime*(flightDuration-flightTime)/model.scale.y;
 const drop=-.105-settings.compression*compression*run+flightRise*run;
 const hipDrive=Math.cos(gait)*.07*run;
 pose('pelvis',.075*run,hipDrive,Math.sin(gait)*.018*run);
 d.bones.pelvis.position.lerp(d.rest.pelvis.p.clone().add(V(Math.sin(gait)*.012*run,drop,.025*run)),blend);
 pose('chest',.13*run+clamp(s.accel*.012,-.045,.09),-hipDrive*1.65,Math.sin(gait-.3)*-.013*run);
 pose('head',-.18*run,hipDrive*.55,0);
 // Opposite arm and leg lead together; the shield is heavier, so its arc stays tighter.
 const arm=Math.cos(gait-.12)*run*settings.drive;
 pose('upperarm_R',-.10-arm*.35,.06,.24);
 pose('forearm_R',-.65+Math.sin(gait-.40)*.12*run,0,0);
 pose('hand_R',.50+Math.sin(gait-.65)*.04*run,0,0);
 pose('upperarm_L',-.34+arm*.19,-.13,-.48);
 pose('forearm_L',-1.02-Math.sin(gait-.40)*.10*run,0,0);
 pose('hand_L',.035*Math.sin(gait-.7)*run,0,-.035);
 pose('sash',-.32*run-.14*Math.sin(gait*2-.5)*run);
 for(let i=0;i<4;i++)pose('cape_'+i,.02+run*(.07+i*.026)+Math.sin(gait-.65-i*.55)*run*(.007+i*.009),Math.sin(gait-.4-i*.4)*run*.018,0);
 model.updateMatrixWorld(true);
 s.diagnostics={};
 for(const [side,offset] of [['L',0],['R',.5]]){
  const f=sampleFoot(phase+offset,speed,model.scale.z,settings),foot=d.bones['foot_'+side];
  // Forefoot pivot stays fixed during push-off. No toe joint exists in the approved mesh.
  const pivot=V(0,-.122,.257).applyAxisAngle(V(1,0,0),f.pitch);
  const x=d.rest['thigh_'+side].p.x;
  const local=V(x,-pivot.y+f.lift+.005,f.forward+.257-pivot.z);
  let target=model.localToWorld(local.clone());
  const previous=s.feet[side];
  if(f.contact){
   if(!previous?.contact){
    // Capture the floor contact once. The same point supports the entire stance.
    const yaw=model.rotation.y;
    const anchor=target.clone().add(V(pivot.x*model.scale.x,pivot.y*model.scale.y,pivot.z*model.scale.z).applyAxisAngle(V(0,1,0),yaw));
    anchor.y=(model.userData.groundSurface?.(anchor.x,anchor.z)||0)+.004;
    s.feet[side]={contact:true,anchor};
   }
   const pivotWorld=V(pivot.x*model.scale.x,pivot.y*model.scale.y,pivot.z*model.scale.z).applyAxisAngle(V(0,1,0),model.rotation.y);
   target=s.feet[side].anchor.clone().sub(pivotWorld);
  }else{
   target.y+=(model.userData.groundSurface?.(target.x,target.z)||0);
   // Keep the release continuous when acceleration changed the stride during stance.
   if(previous?.contact){
    const pivotWorld=V(pivot.x*model.scale.x,pivot.y*model.scale.y,pivot.z*model.scale.z).applyAxisAngle(V(0,1,0),model.rotation.y);
    const offset=previous.anchor.clone().sub(pivotWorld).sub(target);offset.y=0;
    s.feet[side]={contact:false,offset};
   }else if(!previous)s.feet[side]={contact:false};
   if(s.feet[side].offset)target.addScaledVector(s.feet[side].offset,1-smooth((f.phase-f.duty)/(1-f.duty)));
  }
  // Blend IK target on start/stop as well as rotations; this avoids snapping to a pose.
  const base=foot.getWorldPosition(V());target=base.lerp(target,blend);
  let reachError=solveFoot(model,d,side,target,f.pitch*blend);
  // During the blend, the old foot angle and new ankle target disagree slightly.
  // Refit the sole after IK rather than letting the boot sink through the floor.
  for(let pass=0;pass<2;pass++){
   let correction=0;
   for(const z of [-.084,.257]){
    const p=foot.localToWorld(V(0,-.122,z));
    correction=Math.max(correction,(model.userData.groundSurface?.(p.x,p.z)||0)+.004-p.y);
   }
   if(correction<1e-7)break;
   target.y+=correction;reachError=solveFoot(model,d,side,target,f.pitch*blend);
  }
  s.diagnostics[side]={...f,target:target.toArray(),reachError};
 }
 model.updateMatrixWorld(true);return s;
}
