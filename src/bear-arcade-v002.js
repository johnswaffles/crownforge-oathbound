import * as T from '../vendor/three.module.js';
import { advanceBearPlayback, bearDirection, createBearPlayback } from './bear-motion-v001.js';

const FRONT_ASSETS = new URL('../assets/bear-arcade-v001/', import.meta.url);
const ASSETS = new URL('../assets/bear-arcade-v002/', import.meta.url);
export async function loadArcadeBear() {
  const loader = new T.TextureLoader();
  const [front, back, response] = await Promise.all([
    loader.loadAsync(new URL('front.png', FRONT_ASSETS).href),
    loader.loadAsync(new URL('back.png', ASSETS).href),
    fetch(new URL('atlas.json', ASSETS)),
  ]);
  if (!response.ok) throw Error('The bear animation atlas could not load.');
  const atlas = await response.json();
  for (const texture of [front, back]) {
    texture.colorSpace = T.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = T.LinearFilter;
    texture.magFilter = T.LinearFilter;
  }
  const geometry = {};
  for (const view of ['front', 'back']) {
    geometry[view] = atlas[view].frames.map((rect, i) => {
      const [, , width, height] = rect;
      const points = atlas[view].outlines[i].map(([x, y]) => new T.Vector2(x / width - .5, 1 - y / height));
      const shape = new T.Shape(points);
      const mesh = new T.ShapeGeometry(shape);
      const positions = mesh.getAttribute('position'), uv = mesh.getAttribute('uv');
      for (let vertex = 0; vertex < positions.count; vertex++) uv.setXY(vertex, positions.getX(vertex) + .5, positions.getY(vertex));
      return mesh;
    });
  }
  return { front, back, atlas, geometry };
}

export function arcadeBearSprite(assets, size = 1) {
  const root = new T.Group();
  const textures = [assets.front.clone(), assets.back.clone()];
  textures.forEach(texture => { texture.needsUpdate = true; });
  const material = new T.MeshStandardMaterial({
    map: textures[0], transparent: true, alphaTest: .42, side: T.DoubleSide,
    roughness: 1, emissiveMap: textures[0], emissive: '#ffffff', emissiveIntensity: .25,
  });
  // Bottom-centered geometry keeps every painted paw at ground height.
  const sprite = new T.Mesh(assets.geometry.front[0], material);
  root.add(sprite);
  const shadow = new T.Mesh(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({
    color: '#101c18', transparent: true, opacity: .27, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  shadow.scale.set(1.13 * size, .7 * size, 1);
  root.add(shadow);
  root.userData = { arcadeBear: true, sprite, shadow, textures, size, assets,
    playback: createBearPlayback(), display: { clip: 'idle', frame: 0 } };
  root.userData.playback.since = -Math.random() * 1.8;
  poseArcadeBear(root, 0, 0, 0);
  return root;
}

export function poseArcadeBear(model, frame, yaw, cameraYaw) {
  const d = model.userData;
  const direction = bearDirection(yaw, cameraYaw);
  const view = direction.back ? 'back' : 'front';
  const sheet = d.assets.atlas[view];
  const rect = sheet.frames[frame];
  d.sprite.geometry = d.assets.geometry[view][frame];
  const texture = d.textures[direction.back ? 1 : 0];
  const [x, y, width, height] = rect;
  texture.repeat.set(width / sheet.width, height / sheet.height);
  texture.offset.set(x / sheet.width, 1 - (y + height) / sheet.height);
  d.sprite.material.map = texture;
  d.sprite.material.emissiveMap = texture;
  const units = sheet.unitsPerPixel * d.size;
  d.sprite.scale.set(width * units * (direction.mirror ? -1 : 1), height * units, 1);
  d.sprite.rotation.y = cameraYaw;
  d.sprite.position.y = .025;
  d.sprite.material.opacity = 1;
  d.display.frame = frame;
  d.display.view = `${direction.back ? 'Rear' : 'Front'} ${direction.mirror ? 'left' : 'right'}`;
}

export function animateArcadeBear(model, time, moving, yaw, cameraYaw, attack, dead, details = {}) {
  const d = model.userData;
  const pose = advanceBearPlayback(d.playback, time, { ...details, moving, dead });
  d.display.clip = pose.clip;
  poseArcadeBear(model, pose.frame, yaw, cameraYaw);
  d.shadow.material.opacity = dead ? .18 : .27;
}
