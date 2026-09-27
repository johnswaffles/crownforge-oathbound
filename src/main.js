import {shouldChainAutoAttack} from './idle-presence-v041.js';
import {startJump,advanceJump} from './jump-motion-v037.js';
import {loadOathguard} from './oathguard-v044.js';
import { findPath } from "./navigation.js";
import {
  T,
  buildWorld,
  fighter,
  animateFighter,
  bearSprite,
  animateBear,
  height,
  LANDMARKS,
  SUPPLIES,
} from "./world.js?v=20260927-v044";
import {
  VERSION,
  SAVE_KEY,
  ITEMS,
  SLOTS,
  ABILITIES,
  QUESTS,
  stats,
  mitigation,
  damage,
  fresh,
  awardXP,
  equip,
  restore,
  weaponHit,
} from "./rules.js";
const $ = (id) => document.getElementById(id),
  canvas = $("world");
let renderer;
try {
  renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  $("load-status").textContent =
    "This adventure needs WebGL 2. Please try a current desktop browser with hardware acceleration enabled.";
  $("begin").disabled = true;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new T.Scene(),
  camera = new T.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 150),
  world = buildWorld(scene);
let stored = null;
try {
  stored = restore(localStorage.getItem(SAVE_KEY));
} catch {}
let p = fresh(),
  started = false,
  paused = false,
  dead = false,
  target = null,
  auto = false,
  moveTo = null,
  camYaw = 0.42,
  camPitch = 0.29,
  camDist = 9.5,
  time = 0,
  last = performance.now(),
  attackAnim = 0,
  gcd = 0,
  combatUntil = 0,
  autoTimer = 0,
  guardUntil = 0,
  standUntil = 0,
  blockUntil = 0,
  potionCd = 0,
  hitResolveAt = 0,
  questDefending = false,
  respawnTimer = 0,
  saveAt = 0,
  uiAt = 0,
  guide = false,
  jump = 0;
let route = [],
  routeKey = "",
  routeAt = 0;
const cds = {},
  keys = new Set(),
  enemies = [],
  npcMeshes = [],
  labels = [],
  sparks = [];
let player;
try { player = await loadOathguard(); }
catch(error){$("load-status").textContent="The Oathguard model could not load. Reload to retry.";throw error;}
scene.add(player);
player.userData.groundSurface=world.groundHeight;
let selectedRing = new T.Mesh(
  new T.RingGeometry(1.2, 1.27, 48),
  new T.MeshBasicMaterial({
    color: "#e0bd76",
    transparent: true,
    opacity: 0.9,
    side: T.DoubleSide,
    depthWrite: false,
  }),
);
selectedRing.rotation.x = -Math.PI / 2;
scene.add(selectedRing);
selectedRing.visible = false;
const guideRing = new T.Mesh(
  new T.RingGeometry(0.55, 0.7, 32),
  new T.MeshBasicMaterial({
    color: "#e8d190",
    transparent: true,
    opacity: 0.85,
    side: T.DoubleSide,
    depthWrite: false,
  }),
);
guideRing.rotation.x = -Math.PI / 2;
scene.add(guideRing);
guideRing.visible = false;
const npcs = Object.entries(LANDMARKS).filter(([id]) =>
  ["mara", "tovin", "edda"].includes(id),
);
for (const [id, n] of npcs) {
  let m = fighter({
    cloth: id === "edda" ? "#9a765c" : id === "tovin" ? "#5d7660" : "#345a73",
    armed: id === "mara",
  });
  m.position.set(n.x, height(n.x, n.z), n.z);
  m.rotation.y = id === "mara" ? 1 : Math.PI;
  scene.add(m);
  npcMeshes.push({ id, model: m, ...n });
}
function label(html) {
  let e = document.createElement("div");
  e.className = "world-label";
  e.innerHTML = html;
  $("world-labels").append(e);
  return e;
}
for (const n of npcMeshes)
  n.label = label(
    `<b>!</b>${n.name}<i>${n.id === "mara" ? "Crownwarden captain" : n.id === "tovin" ? "Provisioner" : "Charcoal burner"}</i>`,
  );
let texture;
try {
  await world.ready;
  texture = await new T.TextureLoader().loadAsync(
    "assets/crownforge-grizzly-reference.png",
  );
  texture.colorSpace = T.SRGBColorSpace;
} catch {
  $("load-status").textContent =
    "Preview assets could not load. Reload to try again.";
  throw Error("Missing preview art");
}
const spawns = [
  [-9, -2],
  [-5, -10],
  [-19, -13],
  [10, -5],
  [21, -9],
  [23, -20],
  [-13, -22],
  [-25, -28],
  [2, -29],
];
function spawn(x, z, { boss = false, defense = false } = {}) {
  let lv = boss ? 5 : defense ? 3 : z < -18 ? 3 : 2;
  let e = {
    x,
    z,
    homeX: x,
    homeZ: z,
    yaw: 0,
    level: lv,
    hp: boss ? 590 : defense ? 115 : 100 + lv * 12,
    maxHp: boss ? 590 : defense ? 115 : 100 + lv * 12,
    armor: boss ? 25 : 8,
    model: bearSprite(texture, boss ? 1.45 : 1),
    boss,
    defense,
    dead: false,
    looted: false,
    timer: 1.5 + Math.random(),
    special: boss ? 4 : 7,
    cast: 0,
    castMax: 0,
    castType: "",
    stun: 0,
    enraged: 0,
    aggro: false,
    attack: 0,
    respawn: 0,
  };
  e.label = label(
    `${boss ? "Old Brackenmaw" : "Woodland Grizzly"}<i>Level ${lv}${boss ? " · ELITE" : ""}</i>`,
  );
  scene.add(e.model);
  const telegraphGeometry = new T.CircleGeometry(
    4,
    32,
    -Math.PI / 3,
    (Math.PI * 2) / 3,
  );
  telegraphGeometry.rotateX(-Math.PI / 2);
  telegraphGeometry.rotateY(-Math.PI / 2);
  e.telegraph = new T.Mesh(
    telegraphGeometry,
    new T.MeshBasicMaterial({
      color: "#e87b42",
      transparent: true,
      opacity: 0.28,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  e.telegraph.visible = false;
  scene.add(e.telegraph);
  enemies.push(e);
  return e;
}
spawns.forEach(([x, z]) => spawn(x, z));
spawn(7, -36, { boss: true });
const audio = new Audio("assets/cavernous-wonder.mp3");
audio.loop = true;
audio.volume = 0.22;
let music = false,
  audioCtx;
function sound(freq = 180, duration = 0.08, type = "triangle") {
  if (!started) return;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    let o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(35, freq * 0.45),
      audioCtx.currentTime + duration,
    );
    g.gain.setValueAtTime(0.045, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + duration);
  } catch {}
}
function notify(text) {
  let e = document.createElement("div");
  e.textContent = text;
  $("notifications").prepend(e);
  setTimeout(() => e.remove(), 5500);
  while ($("notifications").children.length > 4)
    $("notifications").lastChild.remove();
}
function save() {
  if (!started || dead) return;
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...p, hp: Math.ceil(p.hp) }),
    );
    $("save-status").textContent =
      "Adventure saved · " +
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    $("save-status").textContent =
      "Saving unavailable · use Export save in the menu";
  }
}
function begin(useSave) {
  p = useSave && stored ? stored : fresh();
  started = true;
  dead = false;
  paused = false;
  camYaw = p.yaw - Math.PI;
  $("title-screen").hidden = true;
  $("hud").hidden = false;
  player.position.set(p.x, height(p.x, p.z), p.z);
  camera.position.set(p.x, 8, p.z + 10);
  if (p.stage === 4 && p.progress > 0) {
    p.progress = 0;
    notify("Edda’s defense is ready to begin again.");
  }
  world.sacks.forEach((m, i) => (m.visible = !p.supplies.includes(i)));
  updateUI();
  save();
  notify(
    p.stage === 0
      ? "Welcome, Oathguard. Speak to Mara nearby with E."
      : "Welcome back. Your watch continues.",
  );
  canvas.focus();
}
$("begin").onclick = () => {
  if (stored) {
    showPanel(
      `<div class="dialogue"><div class="eyebrow">A NEW WATCH</div><h2>Begin a separate adventure?</h2><p>Your current browser save will be replaced. Export it from the in-game menu first if you want to keep a copy.</p><button id="confirm-new" class="primary">Start a new adventure</button></div>`,
    );
    $("confirm-new").onclick = () => {
      closePanel();
      begin(false);
    };
  } else begin(false);
};
$("continue").hidden = !stored;
$("continue").onclick = () => begin(true);
$("begin").disabled = false;
$("load-status").textContent = "Ready · Best played with keyboard and mouse";
function showPanel(html) {
  paused = true;
  keys.clear();
  moveTo = null;
  $("panel-content").innerHTML = html;
  $("panel").hidden = false;
  $("close-panel").focus();
}
function closePanel() {
  paused = false;
  $("panel").hidden = true;
  canvas.focus();
}
$("close-panel").onclick = closePanel;
function statText(i) {
  const parts = Object.entries({Strength:i.strength,Vitality:i.vitality,Armor:i.armor,"Crit %":i.crit?Math.round(i.crit*100):0,"Block %":i.block?Math.round(i.block*100):0}).filter(([,v])=>v).map(([k,v])=>`+${v} ${k}`);
  if(i.min) parts.push(`${i.min}–${i.max} damage`, `${i.speed}s`);
  return parts.join(" · ");
}
function character() {
  let s = stats(p);
  showPanel(
    `<div class="eyebrow">THE OATHGUARD · LEVEL ${p.level} FIGHTER</div><h2>Character & Equipment</h2><p>Your first oath is written in the things you carry.</p><div class="equipment-layout"><div><h3>Equipped</h3><div class="gear-grid">${SLOTS.map(
      (slot) => {
        let i = ITEMS[p.equipment[slot]];
        return `<div class="gear"><small>${slot}</small><b class="${i?.quality || ""}">${i?.name || "Empty slot"}</b>${i ? `<small style="margin-top:6px;letter-spacing:0;text-transform:none">${statText(i)}</small>` : ""}</div>`;
      },
    ).join(
      "",
    )}</div></div><div><h3>Attributes</h3><div class="stats">${Object.entries({
      Health: `${Math.ceil(p.hp)} / ${s.hp}`,
      Strength: s.strength,
      Vitality: s.vitality,
      "Attack Power": s.ap,
      Armor: s.armor,
      "Reduction*": `${Math.round(mitigation(s.armor, p.level) * 100)}%`,
      Critical: `${Math.round(s.crit * 100)}%`,
      Haste: `${Math.round(s.haste * 100)}%`,
      Block: `${Math.round(s.block * 100)}%`,
      "Block strength": "30%",
      Resolve: `${Math.floor(p.resolve)} / 100`,
      Coins: p.coins,
    })
      .map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`)
      .join(
        "",
      )}</div><p style="font-size:10px">*Armor reduction against an enemy of your level. Strength grants 2 Attack Power; Vitality grants 10 Health. Critical hits deal 150% damage. Blocks protect against frontal attacks.</p><h3>Class training</h3>${ABILITIES.map((a) => `<p style="font-size:10px"><b style="color:${p.level >= a.level ? "#e2c98f" : "#78918b"}">${a.name}${p.level < a.level ? ` · Level ${a.level}` : ""}</b> — ${a.description}</p>`).join("")}</div></div><h3>Your pack</h3><div class="bag">${p.inventory
      .map((id) => {
        let i = ITEMS[id],
          current = ITEMS[p.equipment[i.slot]],
          wearing = p.equipment[i.slot] === id;
        let copy = { ...p, equipment: { ...p.equipment, [i.slot]: id } },
          next = stats(copy);
        let delta = [
          ["Health", next.hp - s.hp],
          ["Attack Power", next.ap - s.ap],
          ["Armor", next.armor - s.armor],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${k}`)
          .join(" · ");
        return `<button data-equip="${id}" ${wearing ? "disabled" : ""} title="${i.description || ""}"><strong class="${i.quality}">${i.name}</strong><small>${statText(i)}</small><small>${wearing ? "Equipped" : delta || "Click to equip"}${!wearing && current ? ` · replaces ${current.name}` : ""}</small></button>`;
      })
      .join("")}</div>`,
  );
  document.querySelectorAll("[data-equip]").forEach(
    (b) =>
      (b.onclick = () => {
        equip(p, b.dataset.equip);
        save();
        character();
        sound(450);
      }),
  );
}
$("character-open").onclick = character;
function journal() {
  showPanel(
    `<div class="eyebrow">BRACKENWATCH HOLLOW</div><h2>Journal of the First Watch</h2><p>At Bracken Ford, the first Crownwardens let the people cross. Now you carry their promise into the quiet places.</p>${QUESTS.slice(
      0,
      7,
    )
      .map(
        (q, i) =>
          `<div class="journal-entry ${i < p.stage ? "done" : ""}"><h3>${i < p.stage ? "✓" : i === p.stage ? "◇" : "·"} ${q.title}</h3><p>${i <= p.stage ? q.text : "Continue your watch to discover this chapter."}</p>${i === p.stage ? `<p style="color:#dfc388">${p.progress} / ${q.goal} · ${q.reward}</p>` : ""}</div>`,
      )
      .join("")}`,
  );
}
$("journal-open").onclick = journal;
function settings() {
  showPanel(
    `<div class="eyebrow">REST A MOMENT</div><h2>Your watch is paused.</h2><p><b>WASD</b> move · <b>Drag the world</b> to orbit · <b>Scroll</b> to zoom · <b>Space</b> jump<br><b>Tab</b> select nearest bear · <b>F</b> auto-attack & approach · <b>1–5</b> abilities<br><b>E</b> speak, investigate, collect, loot · <b>Q</b> healing draught<br><b>C</b> character · <b>J</b> journal · <b>Escape</b> close panel / clear target<br>Click the ground or map to walk there. Manual movement cancels walking orders.</p><p>Progress saves in this browser. Export a copy before clearing browser data or switching devices.</p><div class="settings-actions"><button id="music">Music ${music ? "on" : "off"}</button><button id="export">Export save</button><button id="import">Import save</button><input type="file" id="import-file" accept="application/json" hidden><button id="resume">Return to the watch</button></div><p style="font-size:10px">First playable · ${VERSION} · Existing Crownforge bears adapted as directional artwork within a new 3D world.</p>`,
  );
  $("resume").onclick = closePanel;
  $("music").onclick = () => {
    music = !music;
    if (music) audio.play().catch(() => notify("Music could not start."));
    else audio.pause();
    settings();
  };
  $("export").onclick = () => {
    let url = URL.createObjectURL(
        new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "oathbound-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("import").onclick = () => $("import-file").click();
  $("import-file").onchange = async (e) => {
    let f = e.target.files[0];
    if (!f) return;
    let next = restore(await f.text());
    if (!next) {
      notify("That file is not a compatible Oathbound save.");
      return;
    }
    stored = next;
    closePanel();
    locationReloadState(next);
  };
}
function locationReloadState(next) {
  p = next;
  if (p.stage === 4) p.progress = 0;
  target = null;
  auto = false;
  moveTo = null;
  questDefending = false;
  for (const e of enemies) {
    if (e.defense) {
      e.dead = true;
      e.model.visible = false;
    } else {
      e.dead = false;
      e.looted = false;
      e.hp = e.maxHp;
      e.aggro = false;
      e.x = e.homeX;
      e.z = e.homeZ;
      e.cast = 0;
      e.model.userData.sprite.material.opacity = 1;
      e.model.userData.sprite.scale.set(
        3.35 * e.model.userData.size,
        3.35 * e.model.userData.size,
        1,
      );
    }
  }
  world.sacks.forEach((m, i) => (m.visible = !p.supplies.includes(i)));
  save();
  updateUI();
  notify("Adventure restored.");
}
$("settings-open").onclick = settings;
function reward(xp, id) {
  if (id && !p.inventory.includes(id)) {
    p.inventory.push(id);
    notify(`Received: ${ITEMS[id].name}. Open Character (C) to equip it.`);
  }
  let lv = awardXP(p, xp);
  if (lv) {
    notify(
      `Level ${p.level}! Health restored.${ABILITIES.filter(
        (a) => a.level <= p.level && a.level > p.level - lv,
      )
        .map((a) => " " + a.name + " learned.")
        .join("")}`,
    );
    sound(620, 0.35);
  }
  p.stage++;
  p.progress = 0;
  if (p.stage === 5 && enemies.some((e) => e.boss && e.dead)) {
    reward(100, "oathblade");
    return;
  }
  notify(`Quest complete · ${QUESTS[p.stage - 1].title}`);
  save();
  updateUI();
}
function speak(id) {
  if (id === "mara") {
    let finish = p.stage === 6;
    showPanel(
      `<div class="dialogue"><div class="eyebrow">WARDEN MARA VENN · CROWNWARDENS</div><h2>${finish ? "Every hearth matters." : p.stage === 7 ? "Welcome home, Oathguard." : "Count the chimneys."}</h2><p class="quote">“${finish ? "I can see Edda’s chimney from here. You brought more than a road back to us today. You brought someone home." : p.stage === 0 ? "My first captain told me to count the smoke twice. Four cottages, four hearths. This morning, I counted three. Follow the west trail. Find out why Edda’s chimney is cold." : p.stage === 7 ? "The first Crownwardens held a crossing. You held a promise. Rest here as long as you need." : "A good watch starts with noticing who is missing. Follow the trail, and come home safe."}”</p><div class="rewards">${finish ? "Reward: Fordkeeper’s Shield · Brackenwatch Hollow restored" : p.stage === 0 ? "Your first quest: Count the Chimneys" : QUESTS[p.stage].text}</div><button id="dialog-action" class="primary">${finish ? "Complete the first watch" : p.stage === 0 ? "Accept the first watch" : "Return to the trail"}</button></div>`,
    );
    $("dialog-action").onclick = () => {
      closePanel();
      if (p.stage === 0) {
        p.stage = 1;
        guide = true;
        save();
        updateUI();
      } else if (finish) {
        reward(0, "defender");
        p.completed = true;
        save();
        notify(
          "Brackenwatch Hollow restored. Thank you for keeping the first watch.",
        );
      }
    };
  } else if (id === "tovin") {
    showPanel(
      `<div class="dialogue"><div class="eyebrow">TOVIN REED · PROVISIONER</div><h2>Something for the road.</h2><p class="quote">“A full flask and a sound shield. That’s what I send everyone out with.”</p><p>Coins: ${p.coins} · Healing draughts: ${p.potions}</p><div class="settings-actions"><button id="buy" ${p.coins < 5 ? "disabled" : ""}>Buy healing draught · 5 coins</button><button id="rest">Rest at the hearth</button></div></div>`,
    );
    $("buy").onclick = () => {
      if (p.coins >= 5) {
        p.coins -= 5;
        p.potions++;
        save();
        speak("tovin");
      }
    };
    $("rest").onclick = () => {
      p.hp = stats(p).hp;
      p.resolve = 0;
      p.potions = Math.max(3, p.potions);
      save();
      closePanel();
      notify("Rested. Health and three trail draughts restored.");
    };
  } else if (id === "edda") {
    if (p.stage !== 4 || questDefending) {
      showPanel(
        `<div class="dialogue"><div class="eyebrow">EDDA VALE · CHARCOAL BURNER</div><h2>${p.stage > 4 ? "You kept your promise." : "Quiet. They’re close."}</h2><p class="quote">“${p.stage > 4 ? "When you pass my cottage, count the smoke. There will be a fire waiting." : "The old bear drove me from the stream. I made it this far, but the others caught my scent. Please, help me reach the road."}”</p></div>`,
      );
      return;
    }
    showPanel(
      `<div class="dialogue"><div class="eyebrow">EDDA VALE · CHARCOAL BURNER</div><h2>A light still burning.</h2><p class="quote">“I thought no one would notice the smoke was gone. There are two bears on the ridge. Hold them here, and I can get back to the trail.”</p><div class="rewards">Defend Edda against two bears. Use Sweeping Steel when they close together.</div><button id="defend" class="primary">I’ll hold the clearing</button></div>`,
    );
    $("defend").onclick = () => {
      closePanel();
      questDefending = true;
      p.progress = 0;
      for (const [x, z] of [
        [-20, -31],
        [-14, -30],
      ]) {
        let e = spawn(x, z, { defense: true });
        e.aggro = true;
      }
      combatUntil = time + 10;
      notify("Hold the clearing! Two bears are approaching.");
    };
  }
}
function interactables() {
  let list = npcMeshes.map((n) => ({ ...n, kind: "npc" }));
  list.push({ ...LANDMARKS.cottage, id: "cottage", kind: "cottage" });
  if (p.stage === 3)
    SUPPLIES.forEach((s, i) => {
      if (!p.supplies.includes(i))
        list.push({
          ...s,
          id: i,
          kind: "supply",
          name: "Recover scattered supplies",
        });
    });
  for (const e of enemies)
    if (e.dead && !e.looted)
      list.push({ ...e, ref: e, kind: "loot", name: "Search bear remains" });
  return list;
}
function nearestInteraction() {
  return interactables()
    .map((o) => ({ ...o, d: Math.hypot(o.x - p.x, o.z - p.z) }))
    .filter((o) => o.d < 3.1)
    .sort((a, b) => a.d - b.d)[0];
}
function interact() {
  if (paused || dead) return;
  let o = nearestInteraction();
  if (!o) return;
  if (
    combatUntil > time &&
    enemies.some((e) => e.aggro && !e.dead && dist(e) < 9)
  ) {
    notify("Finish the fight before interacting.");
    return;
  }
  if (o.kind === "npc") speak(o.id);
  else if (o.kind === "cottage") {
    if (p.stage === 1) {
      showPanel(
        `<div class="dialogue"><div class="eyebrow">THE SILENT COTTAGE</div><h2>The hearth is cold.</h2><p>Yesterday’s ash lies undisturbed. A torn satchel hangs from the door. Outside, deep claw marks lead toward the stream.</p><p>Someone left in a hurry. Someone who expected to come home.</p><div class="rewards">45 XP · Trailkeeper’s Grips<br>Next: clear three bears from the road.</div><button id="investigate" class="primary">Follow the tracks</button></div>`,
      );
      $("investigate").onclick = () => {
        closePanel();
        reward(45, "gloves");
      };
    } else
      notify(
        p.stage > 4
          ? "Smoke rises again. Edda’s hearth is warm."
          : "Bear tracks lead away from the cold hearth.",
      );
  } else if (o.kind === "supply") {
    p.supplies.push(o.id);
    world.sacks[o.id].visible = false;
    p.progress = p.supplies.length;
    sound(550);
    notify(`Supplies recovered · ${p.progress} / 3`);
    if (p.progress === 3) reward(50, "legs");
    save();
  } else if (o.kind === "loot") {
    o.ref.looted = true;
    p.coins += o.boss ? 15 : 3;
    if (Math.random() < 0.4) p.potions++;
    notify(`Recovered ${o.boss ? 15 : 3} coins and useful supplies.`);
    save();
  }
}
$("interact").onclick = interact;
function dist(e) {
  return Math.hypot(e.x - p.x, e.z - p.z);
}
function select(e) {
  target = e;
  auto = false;
  moveTo = null;
  updateUI();
}
function cycleTarget() {
  let available = enemies
    .filter((e) => !e.dead && dist(e) < 23)
    .sort((a, b) => dist(a) - dist(b));
  if (!available.length) {
    notify("No bears nearby.");
    return;
  }
  let i = available.indexOf(target);
  select(available[(i + 1) % available.length]);
}
function face(e) {
  p.yaw = Math.atan2(e.x - p.x, e.z - p.z);
}
function float(text, x, z, color = "#f0dfaa") {
  let q = new T.Vector3(x, height(x, z) + 2.4, z).project(camera);
  let el = document.createElement("div");
  el.className = "float";
  el.style.left = (q.x * 0.5 + 0.5) * innerWidth + "px";
  el.style.top = (-q.y * 0.5 + 0.5) * innerHeight + "px";
  el.style.color = color;
  el.textContent = text;
  $("combat-feedback").append(el);
  setTimeout(() => el.remove(), 1100);
}
function hitEnemy(e, raw) {
  if (e.dead) return;
  let critical = Math.random() < stats(p).crit,
    n = damage(raw, { armor: e.armor, level: p.level, crit: critical });
  e.hp -= n;
  e.aggro = true;
  combatUntil = time + 5;
  float(n + (critical ? "!" : ""), e.x, e.z);
  sound(150, 0.08, "sawtooth");
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  e.hp = 0;
  e.dead = true;
  e.aggro = false;
  e.cast = 0;
  e.respawn = time + 75;
  p.kills++;
  let lv = awardXP(p, e.boss ? 60 : 18);
  if (lv) {
    notify(`Level ${p.level}! New training available on your action bar.`);
    sound(700, 0.3);
  }
  if (p.stage === 2 && !e.defense && !e.boss) {
    p.progress++;
    if (p.progress >= 3) reward(50, "helm");
  } else if (p.stage === 4 && e.defense) {
    p.progress++;
    if (p.progress >= 2) {
      questDefending = false;
      reward(70, "charm");
      notify("Edda is safe. Old Brackenmaw still blocks the northern trail.");
    }
  } else if (p.stage === 5 && e.boss) {
    reward(100, "oathblade");
    notify("Brackenmaw has fallen. Return to Mara.");
  }
  if (target === e) {
    auto = false;
    target = null;
  }
  save();
}
function receive(raw, e) {
  let s = stats(p),
    facing = Math.cos(Math.atan2(e.x - p.x, e.z - p.z) - p.yaw) > 0.1,
    blocked = facing && Math.random() < s.block,
    n = damage(raw, {
      armor: s.armor,
      level: e.level,
      blocked,
      guard: guardUntil > time,
    });
  p.hp -= n;
  combatUntil = time + 5;
  if (time >= hitResolveAt) {
    p.resolve = Math.min(100, p.resolve + 5);
    hitResolveAt = time + 1;
  }
  if (blocked) {
    blockUntil = time + 5;
    float("BLOCK", p.x, p.z, "#9ddce3");
    sound(460);
  } else float("-" + n, p.x, p.z, "#f7a196");
  if (p.hp <= 0) {
    p.hp = 0;
    dead = true;
    auto = false;
    moveTo = null;
    keys.clear();
    $("death").hidden = false;
    for (const en of enemies) {
      en.aggro = false;
      en.cast = 0;
    }
    sound(75, 0.5);
  }
}
function use(id) {
  if (!started || paused || dead) return;
  let a = ABILITIES.find((x) => x.id === id),
    s = stats(p);
  if (p.level < a.level) {
    notify(`${a.name} unlocks at level ${a.level}.`);
    return;
  }
  if ((cds[id] || 0) > time) return;
  let defensive = ["guard", "stand"].includes(id),
    cost = id === "strike" && blockUntil > time ? 10 : a.cost;
  if (p.resolve < cost) {
    notify("Build Resolve with auto-attacks (F).");
    return;
  }
  if (!defensive) {
    if (gcd > time) return;
    if (!target || target.dead) {
      cycleTarget();
      if (!target) return;
    }
    if (dist(target) > 3.2) {
      auto = true;
      notify("Closing to melee range.");
      return;
    }
    face(target);
    auto = true;
    gcd = time + 1.5;
    attackAnim = 1;
  }
  p.resolve -= cost;
  cds[id] = time + a.cd;
  if (id === "strike") {
    let bonus =
      p.equipment.weapon === "oathblade" && blockUntil > time ? 1.2 : 1;
    blockUntil = 0;
    hitEnemy(target, weaponHit(p) * 1.5 * bonus);
  }
  if (id === "guard") {
    guardUntil = time + 4;
    sound(340, 0.18);
    notify("Iron Guard · 40% damage reduction");
  }
  if (id === "bash") {
    let e = target;
    if (e.cast > 0) {
      e.cast = 0;
      e.special = 3;
      e.stun = time + 0.5;
      float("INTERRUPTED", e.x, e.z, "#a1e0e0");
    }
    hitEnemy(e, weaponHit(p) * 0.6);
  }
  if (id === "sweep") {
    enemies
      .filter(
        (e) =>
          !e.dead &&
          dist(e) < 4.3 &&
          Math.cos(Math.atan2(e.x - p.x, e.z - p.z) - p.yaw) > -0.1,
      )
      .slice(0, 3)
      .forEach((e) => hitEnemy(e, weaponHit(p) * 1.1));
  }
  if (id === "stand") {
    standUntil = time + 5;
    sound(560, 0.3);
    notify("Last Stand · recovering Health");
  }
  updateUI();
}
$("abilities").innerHTML = ABILITIES.map(
  (a) =>
    `<button id="ability-${a.id}" title="${a.name}: ${a.description} ${a.cost} Resolve · ${a.cd}s cooldown"><kbd>${a.key}</kbd><span class="ability-icon">${a.symbol}</span><small>${a.name}</small><em></em></button>`,
).join("");
ABILITIES.forEach((a) => ($("ability-" + a.id).onclick = () => use(a.id)));
function toggleAttack() {
  if (!target) cycleTarget();
  if (target) {
    auto = !auto;
    if (auto) face(target);
  }
}
$("auto").onclick = toggleAttack;
function potion() {
  if (paused || dead || potionCd > time || p.potions < 1) return;
  p.potions--;
  p.hp = Math.min(stats(p).hp, p.hp + stats(p).hp * 0.4);
  potionCd = time + 25;
  float("+HEALTH", p.x, p.z, "#a3e1a4");
  sound(650, 0.15);
  save();
}
$("potion").onclick = potion;
$("respawn").onclick = () => {
  dead = false;
  p.hp = stats(p).hp;
  p.resolve = 0;
  p.potions = Math.max(3, p.potions);
  target = null;
  p.x = 0;
  p.z = 12;
  guardUntil = standUntil = blockUntil = 0;
  combatUntil = 0;
  $("death").hidden = true;
  if (questDefending) {
    p.progress = 0;
    questDefending = false;
    for (const e of enemies.filter((e) => e.defense)) {
      e.dead = true;
      e.looted = true;
      e.model.visible = false;
    }
  }
  for (const e of enemies.filter((e) => !e.dead)) {
    e.x = e.homeX;
    e.z = e.homeZ;
    e.hp = e.maxHp;
  }
  save();
  notify("Restored at the watch camp. Your progress is safe.");
};
function objective() {
  if (p.stage === 0 || p.stage >= 6) return LANDMARKS.mara;
  if (p.stage === 1) return LANDMARKS.cottage;
  if (p.stage === 2)
    return (
      enemies
        .filter((e) => !e.dead && !e.boss && !e.defense)
        .sort((a, b) => dist(a) - dist(b))[0] || LANDMARKS.cottage
    );
  if (p.stage === 3)
    return SUPPLIES.find((_, i) => !p.supplies.includes(i)) || LANDMARKS.edda;
  if (p.stage === 4) return LANDMARKS.edda;
  return { x: 7, z: -36 };
}
$("track").onclick = () => {
  guide = !guide;
  notify(
    guide
      ? "The gold marker and map diamond show your objective. Click the map to walk toward it."
      : "Objective marker hidden.",
  );
};
function updateUI() {
  let s = stats(p),
    q = QUESTS[p.stage];
  $("level").textContent = p.level;
  $("hp-bar").style.width = Math.max(0, (p.hp / s.hp) * 100) + "%";
  $("hp-text").textContent = `${Math.ceil(p.hp)} / ${s.hp}`;
  $("resolve-bar").style.width = p.resolve + "%";
  $("resolve-text").textContent = `${Math.floor(p.resolve)} Resolve`;
  $("quest-name").textContent = q.title;
  $("quest-text").textContent = q.text;
  $("quest-progress").textContent =
    p.stage === 7
      ? "✓ The first watch is complete"
      : p.stage === 0
        ? "Speak to Mara"
        : p.stage === 6
          ? "Return to the watch camp"
          : `${p.progress} / ${q.goal} ${p.stage === 2 ? "bears defeated" : p.stage === 3 ? "supplies recovered" : p.stage === 4 ? "bears defeated" : "objectives"}`;
  $("quest-reward").textContent = q.reward;
  $("potion-count").textContent =
    `${p.potions} draught${p.potions === 1 ? "" : "s"}`;
  $("potion").querySelector("em").textContent =
    potionCd > time ? Math.ceil(potionCd - time) : "";
  $("auto").classList.toggle("active", auto);
  const thresholds = [0, 65, 165, 300, 460];
  $("xp-bar").style.width =
    p.level === 5
      ? "100%"
      : Math.min(
          100,
          ((p.xp - thresholds[p.level - 1]) /
            (thresholds[p.level] - thresholds[p.level - 1])) *
            100,
        ) + "%";
  $("target-frame").hidden = !target || target.dead;
  if (target && !target.dead) {
    $("target-name").textContent =
      `${target.boss ? "Old Brackenmaw" : "Woodland Grizzly"} · ${target.level}`;
    $("target-bar").style.width = (target.hp / target.maxHp) * 100 + "%";
    $("target-hp").textContent = `${Math.ceil(target.hp)} / ${target.maxHp}`;
    $("cast-wrap").hidden = target.cast <= 0;
    if (target.cast > 0) {
      $("cast-bar").style.width =
        (1 - target.cast / target.castMax) * 100 + "%";
      $("cast-text").textContent =
        target.castType === "roar"
          ? "Enraging Roar · interrupt!"
          : "Heavy Swipe · step away!";
    }
  }
  for (const a of ABILITIES) {
    let b = $("ability-" + a.id),
      cd = Math.max(0, (cds[a.id] || 0) - time);
    b.classList.toggle("locked", p.level < a.level);
    b.classList.toggle("unaffordable", p.resolve < a.cost);
    b.querySelector("em").textContent =
      p.level < a.level
        ? `Lv ${a.level}`
        : cd > 0
          ? Math.ceil(cd)
          : !["guard", "stand"].includes(a.id) && gcd > time
            ? (gcd - time).toFixed(1)
            : "";
  }
  $("buffs").textContent = [
    guardUntil > time ? `Iron Guard ${Math.ceil(guardUntil - time)}s` : "",
    standUntil > time ? "Last Stand" : "",
    blockUntil > time ? "Reprisal ready" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  let near = nearestInteraction();
  $("interact").hidden = !near || paused || dead;
  if (near)
    $("interact").querySelector("span").textContent =
      near.kind === "npc"
        ? `Speak with ${near.name}`
        : near.kind === "cottage"
          ? "Investigate the cottage"
          : near.name;
  $("combat-hint").textContent =
    target && !target.dead && !near
      ? auto
        ? dist(target) > 3.2
          ? "Approaching target…"
          : "Auto-attacking · spend Resolve with 1"
        : "F to attack · 1–5 abilities"
      : "";
  $("zone-name").textContent =
    p.z < -31
      ? "Brackenmaw’s Den"
      : p.x > 12
        ? "Willowbend Stream"
        : p.z < -17
          ? "The Charcoal Clearing"
          : p.z < 0
            ? "The Silent Trail"
            : "Brackenwatch Hollow";
}
function canMove(x, z, r = 0.4) {
  return (
    Math.abs(x) < 44 &&
    z > -47 &&
    z < 29 &&
    !world.colliders.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r)
  );
}
function move(dx, dz) {
  let x = p.x + dx,
    z = p.z + dz;
  if (canMove(x, z)) {
    p.x = x;
    p.z = z;
    return true;
  }
  if (canMove(x, p.z)) p.x = x;
  if (canMove(p.x, z)) p.z = z;
  return false;
}
let pointer = null,
  dragged = false;
canvas.addEventListener("pointerdown", (e) => {
  if (!started || paused) return;
  pointer = {
    x: e.clientX,
    y: e.clientY,
    startX: e.clientX,
    startY: e.clientY,
  };
  dragged = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointer) return;
  let dx = e.clientX - pointer.x,
    dy = e.clientY - pointer.y;
  if (Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > 4)
    dragged = true;
  if (dragged) {
    camYaw -= dx * 0.006;
    camPitch = Math.max(0.18, Math.min(1.1, camPitch + dy * 0.004));
  }
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
const ray = new T.Raycaster();
canvas.addEventListener("pointerup", (e) => {
  if (!pointer) return;
  pointer = null;
  if (dragged || paused || dead) return;
  ray.setFromCamera(
    new T.Vector2(
      (e.clientX / innerWidth) * 2 - 1,
      (-e.clientY / innerHeight) * 2 + 1,
    ),
    camera,
  );
  let hit = ray.intersectObjects(
    enemies.filter((e) => !e.dead).map((e) => e.model),
    true,
  )[0];
  if (hit) {
    select(enemies.find((e) => e.model.children.includes(hit.object)));
    return;
  }
  let plane = new T.Plane(new T.Vector3(0, 1, 0), 0),
    point = new T.Vector3();
  if (ray.ray.intersectPlane(plane, point)) {
    moveTo = {
      x: Math.max(-43, Math.min(43, point.x)),
      z: Math.max(-46, Math.min(28, point.z)),
    };
    auto = false;
  }
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    camDist = Math.max(4, Math.min(19, camDist + e.deltaY * 0.012));
  },
  { passive: false },
);
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea")) return;
  if (["Tab", " ", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
  if (!started) return;
  if (e.key === "Escape") {
    if (paused) closePanel();
    else if (target) {
      target = null;
      auto = false;
    } else settings();
    return;
  }
  if (paused || dead) return;
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(e.key)
  ) {
    keys.add(e.key.toLowerCase());
    moveTo = null;
  }
  if (e.repeat) return;
  if (e.key === "Tab") cycleTarget();
  if (e.key.toLowerCase() === "f") toggleAttack();
  if (e.key.toLowerCase() === "e") interact();
  if (e.key.toLowerCase() === "c") character();
  if (e.key.toLowerCase() === "j") journal();
  if (e.key.toLowerCase() === "q") potion();
  if (e.key === " ") startJump(player);
  let a = ABILITIES.find((a) => a.key === e.key);
  if (a) use(a.id);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (document.hidden && started && !paused && !dead) {
    save();
    settings();
  }
});
window.addEventListener("beforeunload", save);
$("minimap").onclick = (e) => {
  if (paused || dead) return;
  let rect = e.target.getBoundingClientRect();
  moveTo = {
    x: ((e.clientX - rect.left) / rect.width - 0.5) * 90,
    z: ((e.clientY - rect.top) / rect.height) * 90 - 55,
  };
  auto = false;
  notify("Walking to the map marker. WASD cancels.");
};
function tick(dt) {
  if (!paused && !dead) time += dt;
  let moving = 0,
    s = stats(p);
  if (started && !paused && !dead) {
    let forward =
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0),
      side =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
      dx = -Math.sin(camYaw) * forward + Math.cos(camYaw) * side,
      dz = -Math.cos(camYaw) * forward - Math.sin(camYaw) * side;
    if (forward || side) {
      let len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
      move(dx * dt * 4.4, dz * dt * 4.4);
      p.yaw = Math.atan2(dx, dz);
      moving = 1;
    } else {
      let dest =
        auto && target && !target.dead && dist(target) > 2.65 ? target : moveTo;
      if (dest) {
        let k = Math.round(dest.x) + "," + Math.round(dest.z);
        if (k !== routeKey || time > routeAt) {
          route = findPath(p, dest, canMove);
          routeKey = k;
          routeAt = time + 2;
        }
        while (
          route.length &&
          Math.hypot(route[0].x - p.x, route[0].z - p.z) < 0.35
        )
          route.shift();
        let waypoint = route[0] || dest;
        let dd = Math.hypot(waypoint.x - p.x, waypoint.z - p.z);
        dest = waypoint;
        if (dd > 0.35) {
          dx = (dest.x - p.x) / dd;
          dz = (dest.z - p.z) / dd;
          let moved = move(dx * dt * 4.4, dz * dt * 4.4);
          if (!moved && moveTo) {
            move(-dz * dt * 3, dx * dt * 3);
          }
          p.yaw = Math.atan2(dx, dz);
          moving = 1;
        } else moveTo = null;
      }
    }
    if (auto && target && !target.dead && dist(target) < 3.2) {
      face(target);
      autoTimer -= dt;
      if (autoTimer <= 0) {
        autoTimer = s.weapon.speed / (1 + s.haste);
        hitEnemy(target, weaponHit(p));
        p.resolve = Math.min(100, p.resolve + 10);
        attackAnim = 1;
      }
    }
    if (time > combatUntil) {
      p.hp = Math.min(s.hp, p.hp + s.hp * 0.05 * dt);
      p.resolve = Math.max(0, p.resolve - 8 * dt);
    }
    if (standUntil > time) p.hp = Math.min(s.hp, p.hp + s.hp * 0.05 * dt);
    for (const e of enemies) {
      if (e.boss && p.stage >= 6) {
        e.aggro = false;
        continue;
      }
      if (e.dead) {
        if (!e.defense && !e.boss && time > e.respawn && dist(e) > 15) {
          e.dead = false;
          e.looted = false;
          e.hp = e.maxHp;
          e.x = e.homeX;
          e.z = e.homeZ;
          e.model.userData.sprite.material.opacity = 1;
          e.model.userData.sprite.scale.set(3.35, 3.35, 1);
        }
        continue;
      }
      let distance = dist(e);
      if (distance < (e.boss ? 7 : 5) && p.stage >= 2) e.aggro = true;
      if (e.aggro) {
        if (distance > 23 || Math.hypot(e.x - e.homeX, e.z - e.homeZ) > 18) {
          e.aggro = false;
          e.hp = e.maxHp;
          e.cast = 0;
        } else {
          combatUntil = time + 5;
          e.yaw = Math.atan2(p.x - e.x, p.z - e.z);
          if (e.stun > time) continue;
          if (e.cast > 0) {
            e.cast -= dt;
            if (e.cast <= 0) {
              if (e.castType === "roar") {
                e.enraged = time + 8;
                float("ENRAGED", e.x, e.z, "#ec986f");
              } else if (
                distance < 4 &&
                Math.cos(Math.atan2(p.x - e.x, p.z - e.z) - e.castYaw) > 0.4
              )
                receive(e.boss ? 58 : 33, e);
              e.special = e.boss ? 7 : 10;
            }
          } else {
            if (distance > 2.5) {
              e.x += Math.sin(e.yaw) * dt * (e.boss ? 2.4 : 2.1);
              e.z += Math.cos(e.yaw) * dt * (e.boss ? 2.4 : 2.1);
            }
            e.timer -= dt;
            e.special -= dt;
            if (distance < 3 && e.timer <= 0) {
              e.timer = 2.2;
              receive(
                (e.boss ? 23 : 12 + e.level) * (e.enraged > time ? 1.5 : 1),
                e,
              );
              e.attack = 0.5;
            }
            if (distance < 5 && e.special <= 0) {
              e.castMax = e.boss ? 2.2 : 2;
              e.cast = e.castMax;
              e.castType = e.boss && Math.random() < 0.45 ? "roar" : "swipe";
              e.castYaw = e.yaw;
            }
          }
        }
      } else {
        let d = Math.hypot(e.x - e.homeX, e.z - e.homeZ);
        if (d > 0.2) {
          e.yaw = Math.atan2(e.homeX - e.x, e.homeZ - e.z);
          e.x += Math.sin(e.yaw) * dt * 2;
          e.z += Math.cos(e.yaw) * dt * 2;
        }
      }
      e.attack = Math.max(0, e.attack - dt);
    }
    attackAnim = Math.max(0, attackAnim - dt * 2.5);
    jump = advanceJump(player,dt)?.height || 0;
    saveAt += dt;
    if (saveAt > 8) {
      saveAt = 0;
      save();
    }
  }
  player.position.set(p.x, height(p.x, p.z) + jump, p.z);
  player.userData.groundAirOffset=jump;
  // Ease visual facing through the shortest turn; gameplay facing remains authoritative.
  const facingDelta = Math.atan2(Math.sin(p.yaw-player.rotation.y),Math.cos(p.yaw-player.rotation.y));
  player.rotation.y += facingDelta * (1-Math.exp(-dt*12));
  if(player.userData.oathguard)player.userData.oathguard.chainAttacks=shouldChainAutoAttack({auto,paused,dead,hasTarget:!!target,targetDead:target?.dead,distance:target?dist(target):Infinity,jumping:jump>0});
  animateFighter(
    player,
    time,
    paused ? 0 : moving,
    attackAnim,
    guardUntil > time,
  );
  player.rotation.z = dead ? Math.PI / 2 : 0;
  for (const n of npcMeshes) {
    animateFighter(n.model, time * 0.5, 0);
    if (n.id === "edda" && p.stage >= 5) {
      n.model.position.set(-12, height(-12, -7), -7);
      n.x = -12;
      n.z = -7;
    }
    let q = n.model.position
      .clone()
      .add(new T.Vector3(0, 2.65, 0))
      .project(camera);
    n.label.style.left = (q.x * 0.5 + 0.5) * innerWidth + "px";
    n.label.style.top = (-q.y * 0.5 + 0.5) * innerHeight + "px";
    n.label.hidden =
      !started || q.z > 1 || Math.hypot(n.x - p.x, n.z - p.z) > 20;
    n.label.querySelector("b").textContent =
      (n.id === "mara" && (p.stage === 0 || p.stage === 6)) ||
      (n.id === "edda" && p.stage === 4)
        ? "!"
        : n.id === "tovin"
          ? "◇"
          : "";
  }
  for (const e of enemies) {
    e.telegraph.visible = e.cast > 0 && !e.dead && e.castType === "swipe";
    e.telegraph.position.set(e.x, height(e.x, e.z) + 0.08, e.z);
    e.telegraph.rotation.y = e.castYaw || 0;
    e.telegraph.material.opacity = 0.18 + 0.17 * (1 - e.cast / Math.max(1, e.castMax));
    if ((e.boss && p.stage >= 6 && !e.dead) || (e.defense && e.looted)) {
      e.model.visible = false;
      e.label.hidden = true;
      continue;
    }
    e.model.position.set(e.x, height(e.x, e.z), e.z);
    animateBear(
      e.model,
      time,
      e.aggro && dist(e) > 2.5 && !e.cast,
      e.yaw,
      camYaw,
      e.attack > 0 || e.cast > 0,
      e.dead,
    );
    let q = new T.Vector3(
      e.x,
      height(e.x, e.z) + (e.boss ? 4.2 : 3.1),
      e.z,
    ).project(camera);
    e.label.style.left = (q.x * 0.5 + 0.5) * innerWidth + "px";
    e.label.style.top = (-q.y * 0.5 + 0.5) * innerHeight + "px";
    e.label.hidden = !started || e.dead || dist(e) > 16 || q.z > 1;
    e.label.style.color = e === target ? "#f5d18d" : "#f0b2a2";
  }
  selectedRing.visible = !!target && !target.dead;
  if (selectedRing.visible) {
    selectedRing.position.set(
      target.x,
      height(target.x, target.z) + 0.07,
      target.z,
    );
    selectedRing.scale.setScalar(target.boss ? 1.5 : 1);
    selectedRing.material.color.set(target.cast > 0 ? "#ee7255" : "#d8bf7d");
  }
  let obj = objective();
  guideRing.visible = guide && started && !!obj;
  if (guideRing.visible) {
    guideRing.position.set(obj.x, height(obj.x, obj.z) + 0.09, obj.z);
    guideRing.scale.setScalar(1 + Math.sin(time * 3) * 0.08);
  }
  world.smoke.forEach((o, i) => {
    o.visible = p.stage >= 6;
    o.position.y = 4 + ((i * 0.6 + time * 0.25) % 4);
    o.material.opacity = 0.22 * (1 - (o.position.y - 4) / 4);
  });
  world.props.forEach((o) => {
    if(o.update)o.update(time,camera);
    if (o.flame)
      o.flame.scale.y = 0.8 + Math.sin(time * 9 + o.flame.position.x) * 0.2;
    if (o.flag) {
      let pos = o.flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++)
        pos.setZ(i, Math.sin(pos.getX(i) * 3 + time * 2) * 0.09);
      pos.needsUpdate = true;
    }
  });
  let look = new T.Vector3(p.x, height(p.x, p.z) + 1.35, p.z);
  let desired = new T.Vector3(
    p.x + Math.sin(camYaw) * camDist * Math.cos(camPitch),
    look.y + Math.sin(camPitch) * camDist,
    p.z + Math.cos(camYaw) * camDist * Math.cos(camPitch),
  );
  camera.position.lerp(desired, 1 - Math.exp(-dt * 9));
  camera.lookAt(look);
  uiAt += dt;
  if (uiAt > 0.12) {
    uiAt = 0;
    if (started) {
      updateUI();
      drawMap();
    }
  }
  if(scene.userData.artWind)scene.userData.artWind.value=time;
  renderer.render(scene, camera);
}
function drawMap() {
  let g = $("minimap").getContext("2d"),
    w = 180;
  g.clearRect(0, 0, w, w);
  g.fillStyle = "#173b38";
  g.fillRect(0, 0, w, w);
  const xy = (x, z) => [(x / 90 + 0.5) * w, ((z + 55) / 90) * w];
  g.strokeStyle = "#598580";
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(...xy(16, -55));
  g.lineTo(...xy(16, 35));
  g.stroke();
  g.strokeStyle = "#a2996b";
  g.lineWidth = 2;
  g.beginPath();
  [
    [0, 24],
    [0, 12],
    [-14, -8],
    [-18, -27],
    [7, -36],
  ].forEach(([x, z], i) => (i ? g.lineTo(...xy(x, z)) : g.moveTo(...xy(x, z))));
  g.stroke();
  for (const n of npcMeshes) {
    g.fillStyle = "#a7d8cb";
    let [x, y] = xy(n.x, n.z);
    g.fillRect(x - 2, y - 2, 4, 4);
  }
  for (const e of enemies.filter((e) => !e.dead)) {
    g.fillStyle = e.boss ? "#eeb66b" : "#a96855";
    let [x, y] = xy(e.x, e.z);
    g.beginPath();
    g.arc(x, y, e.boss ? 3 : 1.7, 0, 7);
    g.fill();
  }
  let obj = objective();
  if (obj) {
    let [x, y] = xy(obj.x, obj.z);
    g.strokeStyle = "#f6dc8e";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x, y - 5);
    g.lineTo(x + 4, y);
    g.lineTo(x, y + 5);
    g.lineTo(x - 4, y);
    g.closePath();
    g.stroke();
  }
  if (moveTo) {
    let [x, y] = xy(moveTo.x, moveTo.z);
    g.strokeStyle = "#eef3e3";
    g.strokeRect(x - 2, y - 2, 4, 4);
  }
  let [x, y] = xy(p.x, p.z);
  g.save();
  g.translate(x, y);
  g.rotate(-p.yaw);
  g.fillStyle = "#f9edd1";
  g.beginPath();
  g.moveTo(0, 5);
  g.lineTo(-3, -3);
  g.lineTo(3, -3);
  g.closePath();
  g.fill();
  g.restore();
  g.fillStyle = "#e4d8ac";
  g.font = "9px Georgia";
  g.fillText("N", 87, 13);
}
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
