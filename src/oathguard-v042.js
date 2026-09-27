import {sampleIdlePresence} from './idle-presence-v041.js';
import {characterStyle,applyCharacterStyle} from './oathguard-style-v040.js';
import {sampleJump} from './jump-motion-v037.js';
import {applyCampaignWear} from './campaign-wear-v035.js';
import * as T from '../vendor/three.module.js';
import {sampleLeg,solveLeg,clamp} from './oathguard-motion-v009.js?v=20260927-v040';
import {sampleFrontKick,sampleSwordCarry,advanceSwordStrike,strikeWeight,SWORD_READY} from './sword-motion-v034.js';
import {fitFeetToGround} from './foot-contact-v030.js?v=20260927-v040';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
const names=['pelvis','chest','head','sash','cape_0','cape_1','cape_2','cape_3','upperarm_L','forearm_L','hand_L','upperarm_R','forearm_R','hand_R','thigh_L','shin_L','foot_L','thigh_R','shin_R','foot_R'];
export async function loadOathguard(asset='assets/oathguard-natural-v039.glb'){
 const {scene}=await new GLTFLoader().loadAsync(asset);
 const bones={},rest={};
 // Three broad lighting bands and a deliberately clean, original palette.
 const ramp=new T.DataTexture(new Uint8Array([72,142,214,255]),4,1,T.RedFormat);
 ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
 for(const name of names){const bone=scene.getObjectByName(name);if(!bone)throw Error('Missing Oathguard joint: '+name);bones[name]=bone;rest[name]={q:bone.quaternion.clone(),p:bone.position.clone()};}
 const palette={'Crownwarden blade steel':'#97abb6','V11 glove leather':'#9e7048','V4 tempered steel':'#71818e','V4 engraved breastplate':'#8798a5','V4 polished rolled steel':'#bcc7d0','V4 aged brass':'#bdc9d1','V4 dark recesses':'#162638','V4 boot soles':'#233041','V4 woven mail':'#59636b','V4 oxblood leather':'#593924','V4 weathered shield paint':'#254775','Oathguard teal cloak':'#243e70'};
 const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
 for(const o of meshes){
  o.castShadow=o.receiveShadow=true;
  const materials=(Array.isArray(o.material)?o.material:[o.material]).map(old=>{
   const color=palette[old.name]||'#65798b';
   // Localized light-dependent highlights on steel; cloth and paint retain toon bands.
   if(/tempered steel|engraved breastplate|polished rolled steel|aged brass|blade steel/.test(old.name))
    return new T.MeshPhongMaterial({name:old.name,color,specular:'#718393',shininess:64});
   return new T.MeshToonMaterial({name:old.name,color,gradientMap:ramp,side:old.name==='Oathguard teal cloak'?T.DoubleSide:T.FrontSide});
  });
  materials.forEach(applyCampaignWear);
  o.material=Array.isArray(o.material)?materials:materials[0];
  // Thin inverted hull outline follows the very same skin and joints.
  const outline=o.clone();outline.name='Cartoon ink contour';outline.castShadow=false;outline.receiveShadow=false;
  const ink=new T.MeshBasicMaterial({color:'#172b40',side:T.BackSide});
  ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed += normal * 0.0025;');};
  ink.customProgramCacheKey=()=> 'oathguard-cartoon-outline-v1';
  outline.material=Array.isArray(o.material)?o.material.map(()=>ink):ink;o.parent.add(outline);
 }

 scene.userData.oathguard={bones,rest,natural:asset.includes('natural-v039'),legLength:asset.includes('natural-v039')?.5015:.425,phase:0,lastTime:null,motion:0,guard:0,lastYaw:0,turn:0,attackElapsed:1,lastAttack:0,clothMotion:0,clothTurn:0};return scene;
}
const q=new T.Quaternion(),e=new T.Euler();
export function animateOathguard(model,time,speed,attack=0,guard=false,strikeVariant=null){
 const d=model.userData.oathguard;if(!d)return;
 const dt=d.lastTime===null?0:clamp(time-d.lastTime,0,.08);d.lastTime=time;
 const blend=1-Math.exp(-dt*7),target=clamp(speed,0,1);
 d.motion+=(target-d.motion)*blend;d.guard+=((guard?1:0)-d.guard)*(1-Math.exp(-dt*10));
 const style=characterStyle(model);applyCharacterStyle(model,style);const motion=d.motion;d.phase=(d.phase+dt*(.85+.65*motion)*motion*style.gaitRate)%1;
 const yaw=model.rotation.y||0,delta=Math.atan2(Math.sin(yaw-d.lastYaw),Math.cos(yaw-d.lastYaw));d.lastYaw=yaw;
 d.turn+=(clamp(delta/(dt||1),-2,2)-d.turn)*(1-Math.exp(-dt*5));
 const jumping=sampleJump(model.userData.jumpState?.elapsed??-1);
 if(jumping){d.attackElapsed=1;delete d.pendingStrike;}
 const chain=d.chainAttacks;if(jumping)d.chainAttacks=false;
 const strike=advanceSwordStrike(d,dt,jumping?0:attack,strikeVariant),weight=strike?strikeWeight(d.attackElapsed):0;
 d.chainAttacks=chain;
 const kick=strike&&d.strikeVariant===3?sampleFrontKick(d.attackElapsed):null;
 const kickWeight=kick?.[0]||0;
 const weightForward=strike?.[10]||0;
 const idleTarget=d.natural&&!jumping&&!strike&&!d.chainAttacks?(1-motion)*(1-d.guard):0;
 d.idleBlend=(d.idleBlend??0)+(idleTarget-(d.idleBlend??0))*(1-Math.exp(-dt*5));
 const presence=sampleIdlePresence(time),idle=d.idleBlend;
 d.chestBaseScale??=d.bones.chest.scale.clone();
 d.bones.chest.scale.copy(d.chestBaseScale).multiply({x:1+presence.expand*idle*.45,y:1+presence.expand*idle*.25,z:1+presence.expand*idle});
 d.bones.chest.position.copy(d.rest.chest.p);d.bones.chest.position.y+=presence.lift*idle;

 function pose(name,x=0,y=0,z=0,order='XYZ'){if(name==='upperarm_R'||name==='upperarm_L')x+=(name==='upperarm_R'?-1:1)*Math.sin(gait)*motion*(1-weight)*style.armMovement*Math.PI/180;if(name==='forearm_R'||name==='forearm_L')x-=style.armBend*Math.PI/180;// Independent arm rhythms keep equipment alive without moving the planted feet.
 const drift=Math.sin(time*.79),settle=Math.sin(time*.43+.8);
 if(name==='upperarm_L'){x+=(.025+.045*drift+.025*presence.sigh)*idle;y+=.055*settle*idle;z+=(.035+.025*drift)*idle;}
 if(name==='forearm_L')x+=(.035+.065*Math.sin(time*.79-.55))*idle;
 if(name==='hand_L'){x+=.04*Math.sin(time*.79-1)*idle;y+=.045*Math.sin(time*.43)*idle;z+=.035*Math.sin(time*.61)*idle;}
 if(name==='upperarm_R'){x+=.055*Math.sin(time*.67+.6)*idle;y+=.035*Math.sin(time*.41)*idle;z+=.025*Math.sin(time*.67)*idle;}
 if(name==='forearm_R')x+=.065*Math.sin(time*.67-.35)*idle;
 if(name==='hand_R'){x+=.065*Math.sin(time*.67-.9)*idle;z+=.03*Math.sin(time*.41+.4)*idle;}
 if(name==='chest')x+=presence.chestPitch*idle;if(name==='head'){x+=presence.headPitch*idle;y+=presence.headYaw*idle;}if(name==='upperarm_R')z+=presence.shoulderRoll*idle;if(name==='upperarm_L')z-=presence.shoulderRoll*idle;if(name==='chest')x+=style.torsoLean*Math.PI/180;if(name==='upperarm_R')z+=style.shoulders*Math.PI/180;if(name==='upperarm_L')z-=style.shoulders*Math.PI/180;if(name==='hand_R')x+=style.swordTilt*Math.PI/180;if(name.startsWith('cape_')){x*=style.capeMotion;y*=style.capeMotion;z*=style.capeMotion;}if(d.natural){const calm=(1-motion)*(1-weight)*(1-d.guard)*(jumping?0:1);if(name==='chest')x-=.065*calm;if(name==='head')x+=.025*calm;if(name==='upperarm_R')z-=.045*calm;if(name==='upperarm_L')z+=.025*calm;}const b=d.bones[name];e.set(x,y,z,order);q.setFromEuler(e);b.quaternion.copy(d.rest[name].q).multiply(q);}
 const gait=d.phase*Math.PI*2,sway=Math.sin(gait),breath=Math.sin(time*1.55),drop=-.014-motion*motion*.082+Math.cos(gait*2)*motion*.012+(strike?.[9]||0);
 // Run drive fades out under attacks and guarding; walk retains a quieter carry.
 const run=motion*motion*(1-weight)*(1-d.guard);
 const pump=Math.sin(gait-.32);
 const hipYaw=sway*motion*.072,hipRoll=Math.sin(gait+.35)*motion*.031;
 const settle=(1-motion)*.014;
 pose('pelvis',0,hipYaw+(strike?.[8]||0),hipRoll+settle+presence.hipRoll*idle);
 d.bones.pelvis.position.copy(d.rest.pelvis.p);d.bones.pelvis.position.y+=drop;d.bones.pelvis.position.z+=weightForward;d.bones.pelvis.position.x+=presence.weightX*idle;d.bones.pelvis.position.x+=sway*motion*.027+(1-motion)*.009;
 let chestX=.025+motion*.065+breath*.008,chestY=-hipYaw*1.35+.025,chestZ=-hipRoll*.7-d.turn*.018-(1-motion)*.011;
 chestX+=run*(.07+Math.cos(gait*2-.4)*.012);
 chestY-=sway*run*.095;chestZ+=Math.sin(gait-.2)*run*.018;
 chestY+=strike?.[5]||0;chestX+=strike?.[6]||0;chestZ+=strike?.[7]||0;
 pose('head',-motion*.06-breath*.005-(strike?.[6]||0)*.25,-hipYaw*.35+Math.sin(time*.37)*.018-(strike?.[5]||0)*.85,-chestZ*.65+Math.sin(time*.41)*.004);
 const legs={};
 for(const [side,offset] of [['L',0],['R',.5]]){
  let leg=sampleLeg(d.phase+offset,motion*(1-kickWeight)*(1-weight*.65),drop,d.legLength);
  if(weightForward||weight){const step=(side==='L'?.30:-.24)*weight*(1-motion)*(1-kickWeight);const solved=solveLeg(leg.forward+step-weightForward,leg.down,d.legLength,d.legLength);leg={...leg,...solved,ankle:solved.ankle+leg.ankle+leg.hip+leg.knee};}
  if(side==='R'&&kickWeight>0){leg={...leg,hip:leg.hip*(1-kickWeight)+kick[1]*kickWeight,knee:leg.knee*(1-kickWeight)+kick[2]*kickWeight,ankle:leg.ankle*(1-kickWeight)+kick[3]*kickWeight,free:true};}
  const armSwing=Math.sin(gait+offset*Math.PI*2-.32)*motion;
  legs[side]=leg;
  pose('thigh_'+side,leg.hip,0,side==='L'?.008:-.008);pose('shin_'+side,leg.knee);pose('foot_'+side,leg.ankle);
  if(side==='R'){
   // Relaxed low guard: supported elbow, diagonal grip, point below the hand.
   const carry=sampleSwordCarry(gait,motion,breath,d.guard);
   // Counter-swing the weapon arm; elbow and wrist stabilize the blade.
   carry[0]-=pump*run*.32;
   carry[3]+=pump*run*.12-run*.12;
   carry[4]+=pump*run*.14+run*.05;
   const sword=strike?carry.map((v,i)=>strike[i]+(v-SWORD_READY[i])*(1-weight)):carry;
   // A fixed yaw/bank defines each cut's plane; the arm bends within that
   // plane, keeping the blade edge aligned through its full cutting arc.
   pose('upperarm_R',sword[0],sword[1],sword[2],'YZX');
   pose('forearm_R',sword[3]);pose('hand_R',sword[4]);
  }else{
   // Shield recoils into the windup, then braces forward with the torso.
   const shieldDrive=strike?Math.sin(2*Math.PI*d.attackElapsed)*Math.sin(Math.PI*d.attackElapsed)**2:0;
   pose('upperarm_L',armSwing*.10+pump*run*.20-.35+breath*.008-weight*.13+shieldDrive*.88,-.08-(strike?.[5]||0)*.55-shieldDrive*.28,.10-weight*.45-run*.50);
   pose('forearm_L',-.90-motion*.03-Math.max(0,armSwing)*.05-weight*.18-pump*run*.11-run*.04-shieldDrive*.40);
   pose('hand_L',Math.sin(gait-.6)*motion*.012+shieldDrive*.06,0,-shieldDrive*.045);
  }
 }
 if(kickWeight>0){
  const blendShield=(name,x,y,z)=>{const from=d.bones[name].quaternion.clone();pose(name,x,y,z);d.bones[name].quaternion.slerpQuaternions(from,d.bones[name].quaternion.clone(),kickWeight);};
  blendShield('upperarm_L',-.35,-.38,-.85);
  blendShield('forearm_L',-.50,0,0);blendShield('hand_L',0,0,-.08);
 }
 if(d.guard>.001&&!kick){
  const g=d.guard;
  pose('upperarm_L',-.35-.20*g,-.08+.08*g,.10);
  pose('forearm_L',-.90-.08*g);pose('hand_L',.03*g,0,0);
  chestX+=g*.035;chestY-=g*.035;
 }
 pose('chest',chestX,chestY,chestZ);
 d.clothStrikeYaw??=0;d.clothStrikeYaw+=((strike?.[5]||0)-d.clothStrikeYaw)*(1-Math.exp(-dt*5));
 d.clothStrike??=0;d.clothStrike+=((strike?.[6]||0)-d.clothStrike)*(1-Math.exp(-dt*5));
 d.clothMotion+=(motion-d.clothMotion)*(1-Math.exp(-dt*3));
 d.clothTurn+=(d.turn-d.clothTurn)*(1-Math.exp(-dt*2.5));
 pose('sash',-Math.max(0,-legs.L.hip,-legs.R.hip)*.62*Math.max(motion,weight));
 for(let i=0;i<4;i++)pose('cape_'+i,(i===0?0:.006)-d.clothStrike*.3+d.clothMotion*(.025+i*.006)+Math.sin(gait-.5-i*.7)*motion*.016+Math.sin(time*1.8-i*.7)*(.008+i*.007),Math.sin(time*1.3-i*.6)*.013-d.clothTurn*(.018+i*.009)+(d.clothStrikeYaw-(strike?.[5]||0))*(.10+i*.045),Math.sin(time*.9+i)*.006);
 if(jumping){
  const j=jumping,w=j.weight;
  const blendPose=(name,x=0,y=0,z=0,order='XYZ')=>{const from=d.bones[name].quaternion.clone();pose(name,x,y,z,order);d.bones[name].quaternion.slerpQuaternions(from,d.bones[name].quaternion.clone(),w);};
  d.bones.pelvis.position.lerp(d.rest.pelvis.p.clone().add(new T.Vector3(0,-j.crouch,0)),w);
  blendPose('pelvis',.07*j.tuck,-.10*j.tuck);blendPose('chest',.18+j.crouch*.6+.22*j.tuck,.12*j.tuck);blendPose('head',-.13-.10*j.tuck);
  for(const side of ['L','R']){
   const forward=side==='L'?.035+.40*j.stride:-.025-.32*j.stride;
   const down=.85-j.crouch-j.tuck*(side==='L'?.27:.19);
   const leg=solveLeg(forward,down);
   legs[side]={...leg,forward,down,lift:0};
   blendPose('thigh_'+side,leg.hip,0,side==='L'?.025:-.025);
   blendPose('shin_'+side,leg.knee);blendPose('foot_'+side,leg.ankle);
  }
  // Open the large shield clear of the knees; keep the sword pointed ahead.
  blendPose('upperarm_L',-.45-j.tuck*.30,-.20,-.82);
  blendPose('forearm_L',-.80);blendPose('hand_L');
  blendPose('upperarm_R',-.40+j.tuck*.15,.08,.50,'YZX');
  blendPose('forearm_R',-.65);blendPose('hand_R',.30);
  blendPose('sash',-.65*j.tuck);
  for(let i=1;i<4;i++)blendPose('cape_'+i,.06+j.tuck*(.07+i*.03),0,0);
  if(j.airborne){model.updateMatrixWorld(true);return;}
 }
 fitFeetToGround(model,d,legs,pose);
}
