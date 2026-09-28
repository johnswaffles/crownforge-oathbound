import {rig} from '../../tests/oathguard-test-rig.mjs';
import * as T from '../../vendor/three.module.js';
import {animateCandidate,DEFAULTS} from './motion.js';
import {readFileSync} from 'node:fs';
const bytes=readFileSync(new URL('../../assets/oathguard-natural-hands-v044.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=20+jsonLength+8;
function read(id,size){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],out=[];for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out.push(bytes.readFloatLE(bin+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*4)+k*4));return out;}
function geometry(material,hand){const mat=doc.materials.findIndex(m=>m.name===material),skin=doc.skins[0],handIndex=skin.joints.findIndex(i=>doc.nodes[i].name===hand),inverse=new T.Matrix4().fromArray(read(skin.inverseBindMatrices,16),handIndex*16),points=[];for(const m of doc.meshes)for(const p of m.primitives)if(p.material===mat){const a=read(p.attributes.POSITION,3);for(let i=0;i<a.length;i+=3)points.push(new T.Vector3().fromArray(a,i).applyMatrix4(inverse));}return points;}
export const shield=geometry('V4 weathered shield paint','hand_L'),blade=geometry('Crownwarden blade steel','hand_R');
export function evaluate(settings=DEFAULTS,{fps=120,startStop=false}={}){
 const m=rig(),d=m.userData.oathguard;let previous={},previousBones={},maxJump=0,maxJumpJoint='',reach=0,slip=0,n=0,soleMin=Infinity,soleMax=-Infinity,pelvisMin=Infinity,pelvisMax=-Infinity,shieldClear=Infinity,bladeClear=Infinity,bladeFloor=Infinity,speed=startStop?0:4.4;
 for(let frame=0;frame<fps*8;frame++){
  const t=frame/fps;let target=startStop?(t<1||t>5.3?0:4.4):4.4;
  speed+=Math.max(-6/fps,Math.min(4.5/fps,target-speed));m.position.z+=speed/fps;
  const s=animateCandidate(m,t,speed,settings);m.updateMatrixWorld(true);
  if(frame<fps*2&&!startStop)continue;
  const py=d.bones.pelvis.getWorldPosition(new T.Vector3()).y;if(!startStop){pelvisMin=Math.min(pelvisMin,py);pelvisMax=Math.max(pelvisMax,py);}
  for(const side of ['L','R']){
   const foot=d.bones['foot_'+side],p=foot.localToWorld(new T.Vector3(0,-.122,.257)),contact=s.diagnostics?.[side]?.contact;
   if(contact&&previous[side]?.contact&&speed>4.3&&t>2){slip+=p.distanceTo(previous[side].p)*fps;n++;}previous[side]={p,contact};reach=Math.max(reach,s.diagnostics?.[side]?.reachError||0);
   for(const z of [-.084,.257]){const y=foot.localToWorld(new T.Vector3(0,-.122,z)).y;soleMin=Math.min(soleMin,y);soleMax=Math.max(soleMax,y);}
  }
  for(const [name,b] of Object.entries(d.bones)){if(previousBones[name]&&t>.25){const jump=b.quaternion.angleTo(previousBones[name]);if(jump>maxJump){maxJump=jump;maxJumpJoint=name+' '+t.toFixed(3);}}previousBones[name]=b.quaternion.clone();}
  if(frame%4===0){for(const [points,hand,label] of [[shield,'hand_L','shield'],[blade,'hand_R','blade']]){
   const transformed=points.map(p=>p.clone().applyMatrix4(d.bones[hand].matrixWorld));
   if(label==='blade')bladeFloor=Math.min(bladeFloor,...transformed.map(p=>p.y));
   for(const side of ['L','R'])for(const [a,b,r] of [['thigh_','shin_',.17],['shin_','foot_',.14]]){
    const line=new T.Line3(d.bones[a+side].getWorldPosition(new T.Vector3()),d.bones[b+side].getWorldPosition(new T.Vector3()));
    for(const p of transformed){const distance=p.distanceTo(line.closestPointToPoint(p,true,new T.Vector3()))-r;if(label==='shield')shieldClear=Math.min(shieldClear,distance);else bladeClear=Math.min(bladeClear,distance);}
   }
  }}
 }
 return {slipSpeed:slip/n,reach,soleMin,soleMax,pelvisRange:pelvisMax-pelvisMin,shieldClear,bladeClear,bladeFloor,maxJump,maxJumpJoint};
}
if(process.argv[1]?.endsWith('check-motion.mjs')){for(const test of [{},{cadence:1.65,compression:.065,drive:1.35},{cadence:2.1,compression:0,drive:.5}])console.log(test,evaluate({...DEFAULTS,...test}));console.log('start-stop',evaluate(DEFAULTS,{startStop:true}));}
