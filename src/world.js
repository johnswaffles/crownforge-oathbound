import {buildWalkSurface} from './ground-surface.js';
import {animateOathguard} from './oathguard-v043.js';
import {installStructures} from './structures-v003.js';
import {installWatchcamp} from './art-pass.js';
import * as T from "../vendor/three.module.js";
export const LANDMARKS = {
  mara: { x: -2, z: 9, name: "Warden Mara Venn" },
  tovin: { x: 5, z: 13, name: "Tovin Reed" },
  cottage: { x: -14, z: -8, name: "The silent cottage" },
  edda: { x: -18, z: -27, name: "Edda Vale" },
  den: { x: 7, z: -39, name: "Brackenmaw’s Den" },
};
export const SUPPLIES = [
  { x: 20, z: -2 },
  { x: 18, z: -10 },
  { x: 22, z: -16 },
];
export const height = (x, z) =>
  0.3 * Math.sin(x * 0.13) * Math.cos(z * 0.12) +
  0.14 * Math.sin(z * 0.35 + x * 0.1);
const mat = (c, rough = 0.9, metal = 0) =>
  new T.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });
const palette = {
  bark: mat("#625342"),
  leaves: mat("#3b6452"),
  leafLight: mat("#5f7853"),
  stone: mat("#777f77"),
  stoneDark: mat("#4e6260"),
  wood: mat("#806347"),
  edge: mat("#c1a568"),
  teal: mat("#256068"),
  iron: mat("#829b9d", 0.45, 0.5),
  dark: mat("#253b40"),
  leather: mat("#544432"),
  skin: mat("#c69d79"),
  gold: mat("#c3a567", 0.4, 0.45),
  roof: mat("#344e5b"),
  plaster: mat("#c3bea4"),
  lamp: new T.MeshStandardMaterial({
    color: "#ffe1a0",
    emissive: "#ffc35a",
    emissiveIntensity: 1.6,
  }),
};
function mesh(g, m, parent, p = [0, 0, 0], s = [1, 1, 1]) {
  let o = new T.Mesh(g, m);
  o.position.set(...p);
  o.scale.set(...s);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
const sphere = new T.SphereGeometry(1, 12, 9),
  box = new T.BoxGeometry(1, 1, 1),
  cyl = new T.CylinderGeometry(1, 1, 1, 10);
function ell(parent, m, p, s) {
  return mesh(sphere, m, parent, p, s);
}
function beam(parent, a, b, r, m = palette.wood) {
  let va = new T.Vector3(...a),
    vb = new T.Vector3(...b),
    o = mesh(cyl, m, parent, va.clone().add(vb).multiplyScalar(0.5).toArray(), [
      r,
      va.distanceTo(vb),
      r,
    ]);
  o.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    vb.sub(va).normalize(),
  );
  return o;
}
function boxAt(p, m, xyz, size) {
  return mesh(box, m, p, xyz, size);
}
export function fighter({ cloth = "#28656a", armed = true } = {}) {
  let root = new T.Group(),
    body = new T.Group();
  root.add(body);
  let teal = mat(cloth);
  ell(body, palette.dark, [0, 1.18, 0], [0.29, 0.37, 0.2]);
  ell(body, palette.iron, [0, 1.45, 0.015], [0.35, 0.34, 0.23]);
  boxAt(body, teal, [0, 1.17, 0.225], [0.38, 0.5, 0.035]);
  boxAt(body, palette.gold, [0, 1.28, 0.255], [0.055, 0.24, 0.015]);
  boxAt(body, palette.gold, [0, 1.29, 0.26], [0.21, 0.045, 0.02]);
  boxAt(body, palette.leather, [0, 1.04, 0], [0.62, 0.1, 0.45]);
  boxAt(body, palette.gold, [0, 1.04, 0.25], [0.11, 0.1, 0.03]);
  const head = new T.Group();
  head.position.set(0, 1.91, 0);
  body.add(head);
  ell(head, palette.skin, [0, 0, 0.02], [0.19, 0.24, 0.175]);
  ell(head, palette.leather, [0, 0.12, -0.025], [0.205, 0.17, 0.18]);
  ell(head, palette.leather, [0, -0.13, 0.085], [0.145, 0.11, 0.13]);
  ell(head, palette.skin, [0, -0.025, 0.19], [0.045, 0.07, 0.045]);
  for (const s of [-1, 1]) {
    ell(head, palette.skin, [s * 0.185, 0, 0], [0.04, 0.065, 0.045]);
    ell(head, palette.dark, [s * 0.07, 0.03, 0.179], [0.025, 0.013, 0.012]);
    boxAt(
      head,
      palette.leather,
      [s * 0.073, 0.075, 0.167],
      [0.069, 0.022, 0.035],
    );
  }
  let arms = [],
    legs = [];
  for (const s of [-1, 1]) {
    let arm = new T.Group();
    arm.position.set(s * 0.38, 1.63, 0);
    body.add(arm);
    ell(arm, palette.iron, [s * 0.04, -0.02, 0], [0.22, 0.17, 0.24]);
    boxAt(arm, palette.gold, [s * 0.12, 0.07, 0.02], [0.06, 0.07, 0.33]);
    ell(arm, teal, [0, -0.27, 0], [0.12, 0.24, 0.12]);
    ell(arm, palette.iron, [0, -0.44, 0.03], [0.14, 0.16, 0.15]);
    ell(arm, palette.leather, [0, -0.6, 0.045], [0.105, 0.13, 0.115]);
    arms.push(arm);
    let leg = new T.Group();
    leg.position.set(s * 0.17, 0.98, 0);
    root.add(leg);
    ell(leg, palette.dark, [0, -0.23, 0], [0.145, 0.29, 0.15]);
    ell(leg, palette.iron, [0, -0.46, 0.055], [0.15, 0.12, 0.14]);
    ell(leg, palette.leather, [0, -0.67, 0], [0.155, 0.22, 0.16]);
    ell(leg, palette.leather, [0, -0.86, 0.095], [0.17, 0.11, 0.26]);
    legs.push(leg);
  }
  let cape = mesh(
    new T.PlaneGeometry(0.72, 1, 8, 10),
    new T.MeshStandardMaterial({
      color: cloth,
      side: T.DoubleSide,
      roughness: 1,
    }),
    body,
    [0, 1.19, -0.26],
  );
  cape.rotation.x = 0.18;
  if (armed) {
    let shield = new T.Group();
    arms[0].add(shield);
    shield.position.set(-0.1, -0.45, 0.22);
    let rim = mesh(
      new T.CylinderGeometry(0.34, 0.34, 0.065, 24),
      palette.gold,
      shield,
    );
    rim.rotation.x = Math.PI / 2;
    let face = mesh(new T.CylinderGeometry(0.3, 0.3, 0.085, 24), teal, shield);
    face.rotation.x = Math.PI / 2;
    ell(shield, palette.iron, [0, 0, 0.07], [0.09, 0.09, 0.065]);
    for (let i = 0; i < 8; i++) {
      let a = (i * Math.PI) / 4;
      ell(
        shield,
        palette.iron,
        [Math.cos(a) * 0.29, Math.sin(a) * 0.29, 0.054],
        [0.018, 0.018, 0.014],
      );
    }
    const sword = new T.Group();
    arms[1].add(sword);
    sword.position.set(0, -0.55, 0.1);
    beam(sword, [0, -0.12, 0], [0, 0.12, 0], 0.038, palette.leather);
    boxAt(sword, palette.gold, [0, 0.12, 0], [0.3, 0.055, 0.075]);
    let shape = new T.Shape();
    shape.moveTo(-0.065, 0.15);
    shape.lineTo(0.065, 0.15);
    shape.lineTo(0.048, 0.87);
    shape.lineTo(0, 1.06);
    shape.lineTo(-0.048, 0.87);
    shape.closePath();
    let blade = mesh(
      new T.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false }),
      palette.iron,
      sword,
    );
    sword.rotation.x = -Math.PI * 0.7;
    root.userData.sword = sword;
  }
  root.userData = { ...root.userData, arms, legs, body, cape };
  return root;
}
export function animateFighter(model, time, speed, attack = 0, guard = false) {
  if(model.userData.oathguard){animateOathguard(model,time,speed,attack,guard);return;}
  const d = model.userData,
    phase = time * 9;
  d.legs.forEach(
    (l, i) => (l.rotation.x = Math.sin(phase + i * Math.PI) * speed * 0.55),
  );
  d.arms.forEach(
    (a, i) => (a.rotation.x = -Math.sin(phase + i * Math.PI) * speed * 0.4),
  );
  d.body.position.y = Math.abs(Math.sin(phase)) * speed * 0.045;
  d.arms[1].rotation.x -= Math.sin(attack * Math.PI) * 1.7;
  if (guard) {
    d.arms[0].rotation.x = -0.9;
    d.arms[0].rotation.z = -0.3;
  } else d.arms[0].rotation.z = 0;
  let pos = d.cape.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i);
    pos.setZ(
      i,
      Math.sin(time * 4 + y * 3) * (0.5 - y) * (0.035 + speed * 0.08),
    );
  }
  pos.needsUpdate = true;
}
function terrainTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  let g = c.getContext("2d");
  g.fillStyle = "#677258";
  g.fillRect(0, 0, 1024, 1024);
  let seed = 33;
  let r = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 48000; i++) {
    let x = r() * 1024,
      y = r() * 1024,
      s = r() * 5 + 0.4;
    g.fillStyle = ["#778062", "#879070", "#52644e", "#b0aa80", "#3e5847"][
      Math.floor(r() * 5)
    ];
    g.globalAlpha = 0.3 + r() * 0.4;
    g.fillRect(x, y, s, s * 0.45);
  }
  let t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(20, 20);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
function path(scene, pts, width) {
  let c = new T.CatmullRomCurve3(
    pts.map(([x, z]) => new T.Vector3(x, height(x, z) + 0.035, z)),
  );
  let vertices = [],
    uv = [],
    indices = [];
  for (let i = 0; i <= 100; i++) {
    let t = i / 100,
      p = c.getPoint(t),
      tan = c.getTangent(t),
      n = new T.Vector3(-tan.z, 0, tan.x).normalize();
    for (let s of [-1, 1]) {
      let v = p.clone().addScaledVector(n, (s * width) / 2);
      v.y = height(v.x, v.z) + 0.04;
      vertices.push(...v.toArray());
      uv.push(s === -1 ? 0 : 1, t * 20);
    }
    if (i < 100) {
      let a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  let g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  let m = new T.MeshStandardMaterial({
    color: "#a09771",
    roughness: 1,
    map: terrainTexture(),
  });
  m.map.repeat.set(1, 1);
  mesh(g, m, scene).userData.walkSurface=true;
}
export function buildWorld(scene) {
  let randomSeed = 751;
  function r() {
    randomSeed = (1664525 * randomSeed + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  }
  let colliders = [],
    props = [],
    smoke = [];
  scene.background = new T.Color("#bdc7bd");
  scene.fog = new T.FogExp2("#b0c0b6", 0.009);
  scene.add(new T.HemisphereLight("#d8e3e9", "#727657", 2.5));
  let sun = new T.DirectionalLight("#ffe4b2", 3.4);
  sun.position.set(18, 45, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -45,
    right: 45,
    top: 40,
    bottom: -45,
    near: 1,
    far: 120,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  scene.add(sun.target);
  let ground = new T.PlaneGeometry(180, 180, 130, 130);
  ground.rotateX(-Math.PI / 2);
  let p = ground.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  ground.computeVertexNormals();
  let floor = mesh(
    ground,
    new T.MeshStandardMaterial({
      map: terrainTexture(),
      color: "#bbc49e",
      roughness: 1,
    }),
    scene,
  );
  floor.castShadow = false;
  path(
    scene,
    [
      [0, 24],
      [0, 12],
      [-3, 3],
      [-11, -4],
      [-14, -8],
      [-18, -22],
      [-17, -29],
      [0, -33],
      [7, -39],
    ],
    2.8,
  );
  path(
    scene,
    [
      [-3, 3],
      [6, -2],
      [15, -6],
      [22, -11],
    ],
    2.3,
  );
  let water = mesh(
    new T.PlaneGeometry(3.1, 68, 1, 1),
    new T.MeshStandardMaterial({
      color: "#609b9c",
      metalness: 0.4,
      roughness: 0.18,
      transparent: true,
      opacity: 0.83,
    }),
    scene,
    [16, -0.02, -8],
  );
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  for (let i = 0; i < 60; i++) {
    let z = -40 + i;
    for (let s of [-1, 1]) {
      let x = 16 + s * (1.7 + r() * 0.4);
      ell(
        scene,
        palette.stone,
        [x, height(x, z), z],
        [0.35 + r() * 0.35, 0.16 + r() * 0.2, 0.3 + r() * 0.3],
      );
    }
  }
  // Hand-built timber footbridge and rope rails.
  for (let i = 0; i < 13; i++)
    boxAt(scene, palette.wood, [13 + i * 0.48, 0.33, -6], [0.44, 0.16, 2.7]);
  for (let z of [-7.45, -4.55]) {
    for (let x of [13, 15, 17, 19]) {
      beam(scene, [x, 0.1, z], [x, 1.15, z], 0.07);
      ell(scene, palette.gold, [x, 1.19, z], [0.1, 0.07, 0.1]);
    }
    beam(scene, [13, 1, z], [19, 1, z], 0.025, palette.leather);
  }
  const treePositions = [];
  for (let i = 0; i < 160; i++) {
    let x = (r() - 0.5) * 94,
      z = r() * 92 - 54;
    if (Math.abs(x - 16) < 3) continue;
    let avoid = Object.values(LANDMARKS).some(
      (q) => Math.hypot(x - q.x, z - q.z) < 6,
    );
    let road = Math.abs(x - (z > 0 ? -2 : z > -12 ? -10 : -17)) < 4;
    if (
      avoid ||
      road ||
      Math.hypot(x, z - 12) < 10 ||
      Math.hypot(x + 10, z - 19) < 4.5 ||
      SUPPLIES.some((q) => Math.hypot(x - q.x, z - q.z) < 3)
    )
      continue;
    treePositions.push([x, z, 8 + r() * 7]);
  }
  // Decorative far tree line closes the horizon beyond the playable boundary.
  for(let i=0;i<65;i++) treePositions.push([-65+r()*130,-56-r()*20,10+r()*9]);
  const trunks = new T.InstancedMesh(
      new T.CylinderGeometry(0.35, 0.6, 1, 7),
      palette.bark,
      treePositions.length,
    ),
    leaves = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      palette.leaves,
      treePositions.length * 3,
    ),
    lightLeaves = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      palette.leafLight,
      treePositions.length * 2,
    );
  let dummy = new T.Object3D();
  treePositions.forEach(([x, z, h], i) => {
    const y = height(x, z);
    dummy.position.set(x, y + h / 2, z);
    dummy.scale.set(1, h, 1);
    dummy.rotation.set(0, r() * 6, 0.04);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    colliders.push({ x, z, r: 0.7 });
    for (let j = 0; j < 5; j++) {
      dummy.position.set(
        x + (r() - 0.5) * 3,
        y + h * (0.68 + j * 0.07),
        z + (r() - 0.5) * 3,
      );
      dummy.scale.set(2 + r() * 1.1, 1.6 + r(), 2 + r());
      dummy.rotation.set(r(), r(), r());
      dummy.updateMatrix();
      if (j < 3) leaves.setMatrixAt(i * 3 + j, dummy.matrix);
      else lightLeaves.setMatrixAt(i * 2 + j - 3, dummy.matrix);
    }
  });
  for (const m of [trunks, leaves, lightLeaves]) {
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }
  // Dense meadow plants, individually varied in color and height.
  let blades = new T.BufferGeometry();
  blades.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [
        -0.12, 0, 0, 0, 0.7, 0.04, 0.12, 0, 0, 0, 0, -0.12, 0.04, 0.55, 0, 0, 0,
        0.12,
      ],
      3,
    ),
  );
  blades.computeVertexNormals();
  let grass = new T.InstancedMesh(
    blades,
    new T.MeshStandardMaterial({ color: "#769160", side: T.DoubleSide }),
    6500,
  );
  for (let i = 0; i < 6500; i++) {
    let x = (r() - 0.5) * 94,
      z = r() * 90 - 52;
    dummy.position.set(x, height(x, z), z);
    dummy.rotation.set(0, r() * 6, 0);
    dummy.scale.setScalar(0.4 + r() * 0.65);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(
      i,
      new T.Color().setHSL(
        0.23 + r() * 0.07,
        0.2 + r() * 0.15,
        0.3 + r() * 0.17,
      ),
    );
  }
  scene.add(grass);
  let flowers = new T.InstancedMesh(
    new T.IcosahedronGeometry(0.06, 0),
    mat("#b9aed3"),
    450,
  );
  for (let i = 0; i < 450; i++) {
    let a = r() * Math.PI * 2,
      rr = 3 + r() * 17,
      x = Math.sin(a) * rr,
      z = 10 + Math.cos(a) * rr;
    dummy.position.set(x, height(x, z) + 0.2 + r() * 0.14, z);
    dummy.scale.setScalar(0.7 + r());
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(flowers);
  for (let i = 0; i < 60; i++) {
    let x = (r() - 0.5) * 85,
      z = r() * 80 - 48;
    if (Object.values(LANDMARKS).some((q) => Math.hypot(x - q.x, z - q.z) < 4))
      continue;
    let s = 0.5 + r() * 1.3;
    let o = mesh(
      new T.DodecahedronGeometry(1, 0),
      palette.stoneDark,
      scene,
      [x, height(x, z) + s * 0.2, z],
      [s, s * 0.55, s * 0.8],
    );
    o.rotation.y = r() * 6;
    colliders.push({ x, z, r: s * 0.65 });

  }
  function hut(x, z, scale = 1) {
    let g = new T.Group();
    g.position.set(x, height(x, z), z);
    g.scale.setScalar(scale);
    scene.add(g);
    boxAt(g, palette.stone, [0, 0.3, 0], [4.6, 0.6, 3.8]);
    boxAt(g, palette.plaster, [0, 1.75, 0], [4, 2.7, 3.4]);
    for (let xx of [-2, 0, 2])
      boxAt(g, palette.wood, [xx, 1.7, 1.75], [0.17, 2.8, 0.17]);
    for (let y of [0.65, 2.9])
      boxAt(g, palette.wood, [0, y, 1.76], [4.2, 0.18, 0.18]);
    for (let xx of [-1, 1]) {
      boxAt(g, palette.dark, [xx, 1.9, 1.72], [0.7, 0.9, 0.1]);
      boxAt(g, palette.lamp, [xx, 1.9, 1.78], [0.54, 0.74, 0.03]);
      boxAt(g, palette.wood, [xx, 1.9, 1.82], [0.055, 0.8, 0.04]);
      boxAt(g, palette.wood, [xx, 1.9, 1.82], [0.6, 0.055, 0.04]);
    }
    boxAt(g, palette.wood, [0, 1.35, 1.83], [0.85, 1.6, 0.12]);
    for (let i = 0; i < 5; i++)
      boxAt(
        g,
        palette.leather,
        [-0.35 + i * 0.17, 1.35, 1.9],
        [0.025, 1.55, 0.015],
      );
    ell(g, palette.gold, [0.28, 1.35, 1.98], [0.045, 0.045, 0.045]);
    for (let s of [-1, 1]) {
      let roof = boxAt(g, palette.roof, [s * 1.1, 3.4, 0], [2.6, 0.15, 4.2]);
      roof.rotation.z = -s * 0.55;
      beam(g, [s * 2.2, 2.73, 2.1], [0, 4.08, 2.1], 0.095);
      for (let i = 0; i < 9; i++) {
        let zz = -1.9 + i * 0.47;
        beam(
          g,
          [s * 0.03, 4.12, zz],
          [s * 2.25, 2.75, zz],
          0.026,
          palette.stoneDark,
        );
      }
    }
    boxAt(g, palette.stone, [1.25, 3.55, -0.75], [0.55, 2, 0.55]);
    colliders.push({ x, z, r: 2.6 * scale });
    return g;
  }
  const huts = [hut(-6, 15, 1.15), hut(-14, -11, 0.95)];
  for (let i = 0; i < 8; i++) {
    let puff = ell(
      scene,
      new T.MeshBasicMaterial({
        color: "#d6d1bb",
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      [-12.8, 4 + i * 0.6, -11.7],
      [0.25 + i * 0.055, 0.3, 0.25 + i * 0.055],
    );
    puff.visible = false;
    smoke.push(puff);
  }
  installStructures(scene,props,palette,height);
  // Preserve the environment generator's random sequence after replacing the old fire.
  for(let i=0;i<8;i++) r();
  for (let x of [-3, 5]) {
    let z = 7,
      y = height(x, z);
    beam(scene, [x, y, z], [x, y + 2.4, z], 0.06);
    boxAt(scene, palette.dark, [x, 2 + y, z], [0.29, 0.4, 0.29]);
    boxAt(scene, palette.lamp, [x, 2 + y, z], [0.21, 0.3, 0.21]);
  }
  // Rocky den with an open walkable mouth.
  for (let i = 0; i < 11; i++) {
    let a = (i / 10) * Math.PI,
      x = 7 + Math.cos(a) * 4,
      z = -40 - Math.sin(a) * 3,
      s = 2 + r();
    let o = mesh(
      new T.DodecahedronGeometry(1),
      palette.stoneDark,
      scene,
      [x, height(x, z) + 1.3, z],
      [s, 2.6 + r(), s],
    );
    o.rotation.y = r() * 6;
    colliders.push({ x, z, r: 1.5 });
  }
  let sacks = SUPPLIES.map((p, i) => {
    let g = new T.Group();
    g.position.set(p.x, height(p.x, p.z), p.z);
    scene.add(g);
    ell(g, palette.leather, [0, 0.3, 0], [0.4, 0.45, 0.32]);
    beam(g, [-0.22, 0.52, 0.22], [0.22, 0.52, 0.22], 0.025, palette.gold);
    ell(g, palette.gold, [0, 0.62, 0], [0.13, 0.055, 0.13]);
    return g;
  });
  let surface=height;
  const ready = installWatchcamp(scene, {floor, trees:treePositions, trunks, leaves, lightLeaves, huts, grass, flowers, palette, height, colliders}).then(()=>{
    scene.updateMatrixWorld(true);const surfaces=[];scene.traverse(o=>{if(o.userData.walkSurface)surfaces.push(o)});surface=buildWalkSurface(surfaces,height);
  });
  return { colliders, props, smoke, sacks, sun, ready, groundHeight:(x,z)=>surface(x,z) };
}
export function bearSprite(texture, size = 1) {
  let tex = texture.clone();
  tex.needsUpdate = true;
  tex.repeat.set(0.25, 0.25);
  tex.offset.set(0, 0.75);
  let material = new T.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.2,
    side: T.DoubleSide,
    roughness: 1,
  });
  let root = new T.Group();
  let sprite = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  sprite.scale.set(3.35 * size, 3.35 * size, 1);
  sprite.position.y = 1.45 * size;
  root.add(sprite);
  let shadow = mesh(
    new T.CircleGeometry(1, 24),
    new T.MeshBasicMaterial({
      color: "#152821",
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
    root,
    [0, 0.04, 0],
    [1.3 * size, 0.85 * size, 1],
  );
  shadow.rotation.x = -Math.PI / 2;
  root.userData = { sprite, tex, size };
  return root;
}
export function animateBear(model, time, moving, yaw, cameraYaw, attack, dead) {
  let d = model.userData;
  d.sprite.rotation.y = cameraYaw;
  let relative =
    (((yaw - cameraYaw) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let row =
    relative < Math.PI / 2
      ? 0
      : relative < Math.PI
        ? 2
        : relative < Math.PI * 1.5
          ? 3
          : 1;
  let frame = attack ? 3 : moving ? Math.floor(time * 5) % 3 : 0;
  d.tex.offset.set(frame * 0.25, (3 - row) * 0.25);
  d.sprite.position.y =
    1.45 * d.size + (moving ? Math.sin(time * 10) * 0.035 : 0);
  if (dead) {
    d.sprite.material.opacity = 0.45;
    d.sprite.scale.y = 1.4 * d.size;
    d.sprite.position.y = 0.65 * d.size;
  }
}
export { T };
