export const VERSION='20260921-oathbound-1';
export const SAVE_KEY='crownforge-oathbound-save-v1';
export const ITEMS={
 sword:{name:'Watchkeeper’s Sword',slot:'weapon',quality:'common',min:12,max:16,speed:2,description:'An honest blade, entrusted to a new watch.'},
 shield:{name:'Crownwarden Roundshield',slot:'shield',quality:'common',armor:12,block:0,description:'Teal paint over oak and iron.'},
 tunic:{name:'Patrol Hauberk',slot:'chest',quality:'common',armor:10,vitality:1},
 boots:{name:'Worn Patrol Boots',slot:'boots',quality:'common',armor:3},
 gloves:{name:'Trailkeeper’s Grips',slot:'hands',quality:'uncommon',strength:2,armor:4},
 helm:{name:'Helm of the First Watch',slot:'head',quality:'uncommon',vitality:3,armor:7},
 legs:{name:'Brackenhide Greaves',slot:'legs',quality:'uncommon',armor:9,strength:2},
 charm:{name:'Edda’s Hearthstone',slot:'charm',quality:'uncommon',vitality:3,crit:.03,description:'A warm stone from a hearth you helped rekindle.'},
 defender:{name:'Fordkeeper’s Shield',slot:'shield',quality:'uncommon',armor:20,block:.06,vitality:2},
 oathblade:{name:'Oath of the Crossing',slot:'weapon',quality:'rare',min:19,max:25,speed:2,strength:3,description:'After blocking, your next Oathstrike deals 20% more damage.'}
};
export const SLOTS=['weapon','shield','head','chest','hands','legs','boots','charm'];
export const ABILITIES=[
 {id:'strike',name:'Oathstrike',key:'1',symbol:'⚔',cost:20,cd:0,level:1,description:'150% weapon damage. A block reduces its Resolve cost by 10.'},
 {id:'guard',name:'Iron Guard',key:'2',symbol:'⬡',cost:20,cd:16,level:1,description:'Take 40% less damage for 4 seconds. Usable during the global cooldown.'},
 {id:'bash',name:'Shield Bash',key:'3',symbol:'✦',cost:0,cd:12,level:2,description:'60% weapon damage. Interrupts a cast and delays special attacks for 3 seconds.'},
 {id:'sweep',name:'Sweeping Steel',key:'4',symbol:'☽',cost:35,cd:8,level:3,description:'110% weapon damage to up to three enemies in front of you.'},
 {id:'stand',name:'Last Stand',key:'5',symbol:'✚',cost:0,cd:60,level:4,description:'Recover 25% of maximum Health over 5 seconds. Usable during the global cooldown.'}
];
export const QUESTS=[
 {title:'The First Watch',text:'Speak with Warden Mara at the watch camp.',goal:1,reward:'Your first patrol'},
 {title:'Count the Chimneys',text:'Follow the western trail. Investigate the cottage without smoke.',goal:1,reward:'45 XP · Trailkeeper’s Grips'},
 {title:'Claws on the Road',text:'Defeat three woodland bears. Keep the road safe for the missing burner.',goal:3,reward:'50 XP · Helm of the First Watch'},
 {title:'What the Bears Scattered',text:'Recover three supply satchels by the stream.',goal:3,reward:'50 XP · Brackenhide Greaves'},
 {title:'A Light Still Burning',text:'Find Edda north of the cottage, then protect her from two bears.',goal:2,reward:'70 XP · Edda’s Hearthstone'},
 {title:'The Old Grizzly',text:'Enter the northern den and defeat Old Brackenmaw. Interrupt his roar; avoid his heavy swipe.',goal:1,reward:'100 XP · Oath of the Crossing'},
 {title:'Smoke on the Horizon',text:'Return to Warden Mara at the watch camp.',goal:1,reward:'Fordkeeper’s Shield · Adventure complete'},
 {title:'A Promise Kept',text:'The road is open. The hearth burns again. Brackenwatch remembers your first watch.',goal:1,reward:'Brackenwatch Hollow restored'}
];
export function stats(p){let s={strength:10+2*(p.level-1),vitality:10+2*(p.level-1),armor:0,crit:.05,haste:0,block:0};for(const id of Object.values(p.equipment)){const i=ITEMS[id];if(!i)continue;for(const k of Object.keys(s))s[k]+=i[k]||0;}s.block=p.equipment.shield?Math.min(.4,.1+s.block):0;s.crit=Math.min(.3,s.crit);s.haste=Math.min(.25,s.haste);s.hp=100+10*s.vitality+20*(p.level-1);s.ap=2*s.strength;s.weapon=ITEMS[p.equipment.weapon]||ITEMS.sword;return s;}
export function mitigation(armor,attackerLevel=1){return Math.min(.6,Math.max(0,armor)/(Math.max(0,armor)+100+20*attackerLevel));}
export function damage(raw,{armor=0,level=1,crit=false,blocked=false,guard=false}={}){return Math.max(1,Math.round(raw*(crit?1.5:1)*(1-mitigation(armor,level))*(blocked?.7:1)*(guard?.6:1)));}
export function fresh(){return {version:1,x:0,z:12,yaw:Math.PI,level:1,xp:0,hp:210,resolve:0,stage:0,progress:0,inventory:['sword','shield','tunic','boots'],equipment:{weapon:'sword',shield:'shield',chest:'tunic',boots:'boots'},supplies:[],coins:0,potions:3,kills:0,completed:false};}
export function awardXP(p,n){p.xp+=n;let levels=0;const thresholds=[0,65,165,300,460];while(p.level<5&&p.xp>=thresholds[p.level]){p.level++;levels++;}if(levels)p.hp=stats(p).hp;return levels;}
export function equip(p,id){if(!p.inventory.includes(id)||!ITEMS[id])return false;p.equipment[ITEMS[id].slot]=id;p.hp=Math.min(p.hp,stats(p).hp);return true;}
export function restore(raw){try{const v=JSON.parse(raw);if(v.version!==1)throw Error('version');const p=fresh();for(const k of ['level','xp','hp','resolve','stage','progress','coins','potions','kills'])if(Number.isFinite(v[k]))p[k]=v[k];p.level=Math.max(1,Math.min(5,Math.floor(p.level)));p.stage=Math.max(0,Math.min(7,Math.floor(p.stage)));p.progress=Math.max(0,Math.min(QUESTS[p.stage].goal,Math.floor(p.progress)));p.xp=Math.max(0,p.xp);p.coins=Math.max(0,Math.floor(p.coins));p.potions=Math.max(0,Math.min(99,Math.floor(p.potions)));p.inventory=[...new Set([...p.inventory,...(Array.isArray(v.inventory)?v.inventory:[]).filter(x=>ITEMS[x])])];for(const [slot,id]of Object.entries(v.equipment||{}))if(ITEMS[id]?.slot===slot&&p.inventory.includes(id))p.equipment[slot]=id;p.supplies=(Array.isArray(v.supplies)?v.supplies:[]).filter(x=>Number.isInteger(x)&&x>=0&&x<3);p.completed=p.stage===7;p.hp=Math.max(1,Math.min(stats(p).hp,p.hp));p.resolve=0;if(Number.isFinite(v.x)&&Number.isFinite(v.z)&&Math.abs(v.x)<44&&v.z>-48&&v.z<30){p.x=v.x;p.z=v.z;}if(Number.isFinite(v.yaw))p.yaw=v.yaw;return p;}catch{return null;}}
export function weaponHit(p,random=Math.random){const s=stats(p),w=s.weapon;return w.min+random()*(w.max-w.min)+s.ap*w.speed/10;}
