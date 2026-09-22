// Object-space wear follows the skinned surface without swimming during animation.
export function applyCampaignWear(material){
 const paint=material.name==='V4 weathered shield paint';
 const metal=/tempered steel|engraved breastplate|polished rolled steel|aged brass/.test(material.name);
 const mail=material.name==='V4 woven mail';
 const cloth=material.name==='Oathguard teal cloak';
 if(!paint&&!metal&&!cloth&&!mail)return;
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 campaignPosition;\nvarying vec3 campaignNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncampaignPosition=position;campaignNormal=normal;');
  shader.fragmentShader=`varying vec3 campaignPosition;
varying vec3 campaignNormal;
float battleLine(vec2 p,vec2 a,vec2 b,float width){
 vec2 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0);
 float d=length(p-a-ab*t);float aa=max(fwidth(d),.0003);
 return 1.0-smoothstep(width,width+aa,d);
}
float campaignHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float campaignNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(campaignHash(i),campaignHash(i+vec3(1,0,0)),f.x),mix(campaignHash(i+vec3(0,1,0)),campaignHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(campaignHash(i+vec3(0,0,1)),campaignHash(i+vec3(1,0,1)),f.x),mix(campaignHash(i+vec3(0,1,1)),campaignHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 wp=campaignPosition;
 float patina=campaignNoise(wp*31.0);
 float grain=campaignNoise(wp*170.0);
 diffuseColor.rgb*=mix(${cloth?'0.78,1.10':'0.94,1.025'},patina);
 ${mail?`
 // Staggered interlocking ring pattern on existing mail sleeves and collar.
 vec3 an=abs(normalize(campaignNormal));
 vec2 uv=an.x>an.z?wp.zy:wp.xy;
 vec2 ringUV=uv*90.0;ringUV.x+=mod(floor(ringUV.y),2.0)*.5;
 vec2 rf=fract(ringUV)-.5;
 float radius=length(rf*vec2(1.0,1.25));
 float ring=(1.0-smoothstep(.055,.105,abs(radius-.33)));
 float glint=ring*smoothstep(-.25,.30,rf.y);
 diffuseColor.rgb*=.48+ring*.45+glint*.34;
 `:cloth?`diffuseColor.rgb*=mix(.94,1.04,grain);`:`
 // Broken diagonal scuffs, grouped into short marks rather than uniform stripes.
 vec3 scratchGrid=vec3(wp.x*19.0+wp.y*8.0,wp.y*115.0+wp.z*31.0,wp.z*23.0);
 vec3 cell=floor(scratchGrid);vec3 f=fract(scratchGrid);
 float line=1.0-smoothstep(.035,.09,abs(f.y-.5));
 float ends=smoothstep(.08,.23,f.x)*(1.0-smoothstep(.65,.89,f.x));
 float scratch=line*ends*step(.93,campaignHash(cell))*smoothstep(.30,.55,grain);
 float chips=smoothstep(.74,.88,grain)*smoothstep(.68,.83,patina);
 float rub=smoothstep(.65,.96,abs(normalize(campaignNormal).y))*smoothstep(.46,.69,patina);
 vec3 exposed=vec3(.42,.47,.51);
 diffuseColor.rgb=mix(diffuseColor.rgb,exposed,${paint?'min(.92,chips*.95+scratch*.65)':'chips*.23'});
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.70,.76,.80),scratch*${paint?'.25':'.19'}+rub*${paint?'0.0':'.025'});
 float groove=(1.0-smoothstep(.025,.075,abs(f.y-.59)))*ends*step(.93,campaignHash(cell));
 diffuseColor.rgb*=1.0-groove*.16;
 ${metal?`
 // Authored glancing impacts, deliberately sparse and anchored to armor panels.
 vec2 p=wp.xy;
 float scars=0.0;
 scars=max(scars,battleLine(p,vec2(-.14,1.46),vec2(-.015,1.385),.0018));
 scars=max(scars,battleLine(p,vec2(-.115,1.445),vec2(-.028,1.39),.0010));
 scars=max(scars,battleLine(p,vec2(.075,1.31),vec2(.14,1.345),.0014));
 scars=max(scars,battleLine(p,vec2(.32,1.58),vec2(.425,1.54),.0018));
 scars=max(scars,battleLine(p,vec2(-.41,1.565),vec2(-.35,1.525),.0012));
 scars=max(scars,battleLine(p,vec2(-.07,1.90),vec2(-.015,1.86),.0013));
 scars=max(scars,battleLine(p,vec2(.115,.57),vec2(.18,.54),.0016));
 scars=max(scars,battleLine(p,vec2(-.20,.37),vec2(-.14,.33),.0013));
 float face=smoothstep(.20,.65,normalize(campaignNormal).z)*smoothstep(.01,.06,wp.z);
 float scuff=exp(-dot((p-vec2(-.075,1.415))*vec2(18.,37.),(p-vec2(-.075,1.415))*vec2(18.,37.)))
  +exp(-dot((p-vec2(.39,1.555))*vec2(25.,50.),(p-vec2(.39,1.555))*vec2(25.,50.)))
  +exp(-dot((p-vec2(.16,.55))*vec2(36.,42.),(p-vec2(.16,.55))*vec2(36.,42.)));
 scuff=clamp(scuff,0.0,1.0)*face*(.55+.45*grain);
 diffuseColor.rgb*=1.0-scuff*.24;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.13,.16),scars*face*.65);
 // A tiny light-catching lip beside each fresh scrape gives it depth.
 float lip=battleLine(p,vec2(-.14,1.4625),vec2(-.015,1.3875),.0008)
  +battleLine(p,vec2(.32,1.5825),vec2(.425,1.5425),.0008);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.64,.71,.76),min(1.0,lip)*face*.48);
 diffuseColor.rgb*=1.0-(1.0-smoothstep(.14,.46,wp.y))*grain*.08;
 `:''}

 `}
 `);
 };
 material.customProgramCacheKey=()=>`campaign-wear-v035-${paint}-${metal}-${cloth}-${mail}`;
}
