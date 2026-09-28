import * as T from '../../vendor/three.module.js';
import {loadOathguard} from '../../src/oathguard-v046.js';
import {animateCandidate} from '../run-workshop-v049/motion.js';
import {APPROVED_RUN} from '../run-workshop-v049/approved-run.js';
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new T.Scene();scene.background=new T.Color('#203038');scene.add(new T.HemisphereLight('#e6eff4','#5c5d4c',2));
const sun=new T.DirectionalLight('#fff2d6',2.8);sun.position.set(3,5,4);scene.add(sun);
const fill=new T.DirectionalLight('#b6d7e9',1.6);fill.position.set(-3,2,-3);scene.add(fill);
const camera=new T.PerspectiveCamera(35,1,.001,100),grid=new T.GridHelper(80,160,'#728475','#455950');scene.add(grid);
let time=0,last=0,distance=0,paused=false;
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';};$('step').onclick=()=>{paused=true;$('pause').textContent='Play';advance(1/60);};
const models=await Promise.all([loadOathguard('../../assets/oathguard-natural-hands-v044.glb'),loadOathguard('../../assets/oathguard-natural-hands-v050.glb')]);
for(const m of models){m.userData.groundSurface=()=>0;scene.add(m);}
$('loading').hidden=true;
$('view').onchange=()=>{$('isolate').disabled=['body','side'].includes($('view').value);if($('isolate').disabled)$('isolate').checked=false;};
function advance(dt){time+=dt;const speed=$('mode').value==='run'?4.4:0;distance+=speed*dt;for(const m of models){m.position.z=distance;animateCandidate(m,time,speed,APPROVED_RUN);}}
advance(0);
function render(){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);renderer.setScissorTest(true);models.forEach(m=>m.visible=false);
 const view=$('view').value,isBody=['body','side'].includes(view),isPalm=view.endsWith('Palm'),side=view.startsWith('shield')?'L':'R';
 grid.visible=isBody;grid.position.z=Math.floor(distance/10)*10;
 for(let i=0;i<2;i++){
  const m=models[i],hand=m.userData.oathguard.bones['hand_'+side];m.visible=true;
  const glove=hand.children.find(o=>o.isMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(mat=>mat.name==='V44 fitted glove leather'));
  m.traverse(o=>{if(o.isMesh)o.visible=isBody||!$('isolate').checked||o.geometry===glove?.geometry;});
  const target=isBody?new T.Vector3(0,.92,distance):hand.localToWorld(new T.Vector3(0,-.057,0));
  if(isBody){camera.position.set(view==='side'?4.3:3.5,view==='side'?1.35:1.7,distance+(view==='side'?.22:3.8));}
  else{
   // Camera moves in the wrist frame so the grip remains inspectable during motion.
   const sideSign=side==='R'?-1:1;
   const offset=new T.Vector3((isPalm?1:-1)*sideSign*.29,.045,isPalm?.17:.18);
   camera.position.copy(hand.localToWorld(new T.Vector3(0,-.057,0).add(offset)));
  }
  camera.lookAt(target);camera.aspect=w/2/h;camera.fov=2*Math.atan(Math.tan(35*Math.PI/360)*Math.max(1,.85/camera.aspect))*180/Math.PI;camera.updateProjectionMatrix();
  sun.position.set(target.x+3,target.y+4,target.z+3);fill.position.set(target.x-3,target.y+1,target.z-3);
  renderer.setViewport(i*w/2,0,w/2,h);renderer.setScissor(i*w/2,0,w/2,h);renderer.render(scene,camera);m.visible=false;
 }
}
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;if(!paused)advance(dt*Number($('rate').value));render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
