import * as T from '../../vendor/three.module.js';
import {loadOathguard,animateOathguard} from '../../src/oathguard-v046.js';
import {animateCandidate} from './motion.js';
import {APPROVED_RUN} from './approved-run.js';
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas');
const settings={...APPROVED_RUN};try{const saved=JSON.parse(localStorage.getItem('oathbound-run-study-v049')||'null');for(const [key,min,max] of [['cadence',1.65,2.1],['compression',0,.065],['drive',.5,1.35]])if(Number.isFinite(saved?.[key]))settings[key]=Math.max(min,Math.min(max,saved[key]));}catch{}
function sync(){for(const key of Object.keys(settings)){ $(key).value=settings[key];$(key+'Value').textContent=key==='cadence'?settings[key].toFixed(2):key==='compression'?Math.round(settings[key]/.065*100)+'%':Math.round(settings[key]*100)+'%';}}
sync();for(const key of Object.keys(settings))$(key).oninput=()=>{settings[key]=Number($(key).value);sync();if(models)advance(0);try{localStorage.setItem('oathbound-run-study-v049',JSON.stringify(settings));$('saved').textContent='Study adjustments saved locally.';}catch{$('saved').textContent='These adjustments last for this session.';}};
$('reset').onclick=()=>{Object.assign(settings,APPROVED_RUN);sync();if(models)advance(0);try{localStorage.removeItem('oathbound-run-study-v049');}catch{}$('saved').textContent='Your saved run settings restored.';};
let paused=false,time=0,last=0,speed=4.4,cycleTime=0,distance=0;
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';};$('step').onclick=()=>{paused=true;$('pause').textContent='Play';advance(1/60);};
$('mode').onchange=()=>{cycleTime=0;};
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#203038');scene.fog=new T.Fog('#203038',13,28);scene.add(new T.HemisphereLight('#dce9f0','#555d46',2));
const sun=new T.DirectionalLight('#ffedcc',2.5);sun.position.set(3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-4;sun.shadow.bias=-.0003;scene.add(sun);scene.add(sun.target);
const fill=new T.DirectionalLight('#aecfe3',1.2);fill.position.set(-3,3,-4);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#34433e',roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const ground=new T.Group();scene.add(ground);const grid=new T.GridHelper(80,160,'#748274','#465950');grid.position.y=.002;ground.add(grid);
// Regular marks make foot slipping visible without hiding it behind an in-place loop.
for(const x of [-1.1,1.1]){const line=new T.Mesh(new T.BoxGeometry(.015,.003,80),new T.MeshBasicMaterial({color:'#839082'}));line.position.set(x,.004,0);ground.add(line);}
const markers=['L','R'].map(()=>{const m=new T.Mesh(new T.RingGeometry(.07,.10,32),new T.MeshBasicMaterial({color:'#e7bf75',side:T.DoubleSide}));m.rotation.x=-Math.PI/2;scene.add(m);return m;});
const camera=new T.PerspectiveCamera(34,1,.01,100);
let models;
try{models=await Promise.all([loadOathguard('../../assets/oathguard-natural-hands-v044.glb'),loadOathguard('../../assets/oathguard-natural-hands-v050.glb')]);for(const m of models){scene.add(m);m.userData.groundSurface=()=>0;}for(let i=0;i<100;i++){models.forEach(m=>m.position.z=i*4.4/60);animateOathguard(models[0],i/60,1);animateCandidate(models[1],i/60,4.4,settings);}time=99/60;distance=99*4.4/60;$('loading').hidden=true;}catch(e){$('loading').textContent='The character could not load. Refresh this workshop to try again.';console.error(e);throw e;}
function advance(dt){
 time+=dt;cycleTime+=dt;
 const mode=$('mode').value;
 let target=mode==='idle'?0:mode==='walk'?1.5:4.4;
 if(mode==='start'){const p=cycleTime%8;target=p<1.1||p>5.3?0:4.4;}
 const change=Math.max(-6*dt,Math.min(4.5*dt,target-speed));speed+=change;distance+=speed*dt;
 for(const m of models)m.position.z=distance;
 animateOathguard(models[0],time,speed>0.02?1:0);
 const state=animateCandidate(models[1],time,speed,settings);
 const l=state.diagnostics?.L?.contact,r=state.diagnostics?.R?.contact;
 $('contacts').textContent=speed<.1?'Settled':l?'Left foot · contact':r?'Right foot · contact':'Both feet · recovery';
 $('movement').textContent=(mode==='start'?(target>0?'Accelerating / running':'Slowing / resting'):mode==='run'?'Steady run':mode==='walk'?'Walk':'Idle')+' · '+speed.toFixed(1)+' m/s';
}
function render(){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
 renderer.setScissorTest(true);models.forEach(m=>m.visible=false);floor.position.z=distance;ground.position.z=Math.floor(distance/10)*10;
 sun.position.set(3,6,distance+4);sun.target.position.set(0,0,distance);fill.position.z=distance-4;
 const views={side:[4.1,1.35,.2],quarter:[3.5,1.65,3.4],front:[.05,1.35,4.4],back:[-.6,1.65,-4.5],game:[5.1,5.2,6.3]};
 const view=$('camera').value,pos=views[view],target=new T.Vector3(view==='side'?0:-.15,.91,distance+(view==='side'?.22:0));
 camera.position.set(pos[0],pos[1],distance+pos[2]);camera.lookAt(target);camera.aspect=(w/2)/h;camera.fov=2*Math.atan(Math.tan(34*Math.PI/360)*Math.max(1,({front:.96,quarter:.86,side:.88,back:.82,game:.86}[$('camera').value])/camera.aspect))*180/Math.PI;camera.updateProjectionMatrix();
 for(let i=0;i<2;i++){
  const m=models[i];m.visible=true;
  markers.forEach((marker,j)=>{const s=['L','R'][j],foot=m.userData.oathguard.bones['foot_'+s];marker.visible=$('markers').checked;const v=foot.localToWorld(new T.Vector3(0,-.122,.257));marker.position.set(v.x,.009,v.z);marker.material.color.set(i===1&&m.userData.runStudy?.diagnostics?.[s]?.contact?'#e7bf75':'#657d80');});
  renderer.setViewport(i*w/2,0,w/2,h);renderer.setScissor(i*w/2,0,w/2,h);renderer.render(scene,camera);m.visible=false;
 }
}
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;if(!paused)advance(dt*Number($('rate').value));render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
