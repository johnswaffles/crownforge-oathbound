// User-selected workshop appearance, 2026-09-27. No local service required.
export const RELEASE_STYLE=Object.freeze({
  "width": 1.15,
  "height": 0.88,
  "headScale": 1.03,
  "torsoLean": 10,
  "shoulders": 4.76,
  "armMovement": 0,
  "armBend": 10.22,
  "swordTilt": 0,
  "capeMotion": 1.8,
  "gaitRate": 1,
  "shininess": 120,
  "outline": 1,
  "cloak": "#243e70",
  "shield": "#254775",
  "steel": "#8798a5"
});
const ORIGINAL_STYLE=Object.freeze({"width":1,"height":1,"headScale":1,"torsoLean":0,"shoulders":0,"armMovement":0,"armBend":0,"swordTilt":0,"capeMotion":1,"gaitRate":1,"shininess":64,"outline":1,"cloak":"#243e70","shield":"#254775","steel":"#8798a5"});
export function characterStyle(model){return model.userData.oathguard.natural?RELEASE_STYLE:ORIGINAL_STYLE;}
export function applyCharacterStyle(model,p){
 const d=model.userData.oathguard;if(!d)return;
 model.userData.studioScale??=model.scale.clone();model.scale.copy(model.userData.studioScale).multiply({x:p.width,y:p.height,z:p.width});
 d.studioHeadScale??=d.bones.head.scale.clone();d.bones.head.scale.copy(d.studioHeadScale).multiplyScalar(p.headScale);
 model.traverse(o=>{if(!o.isMesh)return;if(o.name==='Cartoon ink contour'){o.visible=p.outline>.5;return;}
 for(const m of Array.isArray(o.material)?o.material:[o.material]){
  m.userData.studioOriginalColor??=m.color.clone();
  if(m.name==='Oathguard teal cloak')m.color.copy(p.cloak==='#243e70'?m.userData.studioOriginalColor:new m.color.constructor(p.cloak));
  if(m.name==='V4 weathered shield paint')m.color.set(p.shield);
  if(/engraved breastplate|tempered steel|polished rolled steel/.test(m.name))m.color.copy(p.steel==='#8798a5'?m.userData.studioOriginalColor:new m.color.constructor(p.steel));
  if('shininess' in m)m.shininess=p.shininess;
 }});
}
