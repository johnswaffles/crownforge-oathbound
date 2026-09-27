import * as T from '../vendor/three.module.js';
import * as previousBear from '../src/bear-arcade-v001.js';
import { loadArcadeBear, arcadeBearSprite, poseArcadeBear } from '../src/bear-arcade-v002.js';
import { BEAR_CLIPS, clipFrame, clipDuration } from '../src/bear-motion-v001.js';

const $ = id => document.getElementById(id);
const renderer = new T.WebGLRenderer({ canvas: $('stage'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
const scene = new T.Scene();
scene.background = new T.Color('#26362b');
scene.fog = new T.Fog('#26362b', 12, 28);
scene.add(new T.HemisphereLight('#fff2d7', '#708265', 2));
const sun = new T.DirectionalLight('#ffe6b7', 2.6);
sun.position.set(-3, 8, 6); scene.add(sun);
const camera = new T.PerspectiveCamera(35, 1, .05, 60);
const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: '#64705b', roughness: 1 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const loader = new T.TextureLoader();
try {
  const [assets, previousAssets, ground] = await Promise.all([
    loadArcadeBear(),
    previousBear.loadArcadeBear(),
    loader.loadAsync(new URL('../assets/forest-floor-v001.png', import.meta.url).href),
  ]);
  ground.colorSpace = T.SRGBColorSpace;
  ground.wrapS = ground.wrapT = T.RepeatWrapping; ground.repeat.set(12, 12);
  floor.material.map = ground; floor.material.needsUpdate = true;
  const old = previousBear.arcadeBearSprite(previousAssets), current = arcadeBearSprite(assets);
  scene.add(old, current);
  // Soft woodland silhouettes stay behind the viewing circle.
  const trunk = new T.MeshStandardMaterial({ color: '#283b2b' });
  for (let i = 0; i < 28; i++) {
    const angle = i * 2.399, radius = 13 + Math.sin(i * 4.2) * 3;
    const tree = new T.Mesh(new T.CylinderGeometry(.12, .27, 10, 7), trunk);
    tree.position.set(Math.sin(angle) * radius, 5, Math.cos(angle) * radius); scene.add(tree);
  }
  let time = 0, previous = performance.now(), paused = false, selected = null;
  const imageFront = assets.front.image, imageBack = assets.back.image;
  let buttons = [];
  function drawFrames() {
    $('frames').replaceChildren(); buttons = [];
    const unique = [...new Set(BEAR_CLIPS[$('action').value].frames)];
    const isBack = Math.abs(Math.atan2(Math.sin(.65 - Number($('angle').value) * Math.PI / 180), Math.cos(.65 - Number($('angle').value) * Math.PI / 180))) > Math.PI / 2;
    const sheet = assets.atlas[isBack ? 'back' : 'front'], image = isBack ? imageBack : imageFront;
    unique.forEach((frame, i) => {
      const button = document.createElement('button'); button.className = 'frame';
      button.setAttribute('aria-label', `Inspect ${$('action').selectedOptions[0].text} frame ${i + 1}`);
      const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 98;
      const context = canvas.getContext('2d'), [x, y, w, h] = sheet.frames[frame];
      const scale = Math.min(114 / w, 92 / h);
      const left = (120 - w * scale) / 2, top = 96 - h * scale;
      context.beginPath();
      sheet.outlines[frame].forEach(([px, py], index) => context[index ? 'lineTo' : 'moveTo'](left + px * scale, top + py * scale));
      context.closePath(); context.clip();
      context.drawImage(image, x, y, w, h, left, top, w * scale, h * scale);
      const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0');
      button.append(canvas, number); button.onclick = () => { paused = true; selected = frame; $('pause').textContent = 'Play'; };
      $('frames').append(button); buttons.push({ button, frame });
    });
  }
  $('pause').onclick = () => { paused = !paused; selected = null; $('pause').textContent = paused ? 'Play' : 'Pause'; };
  $('step').onclick = () => {
    const frames = [...new Set(BEAR_CLIPS[$('action').value].frames)];
    const frame = selected ?? clipFrame($('action').value, time % clipDuration($('action').value));
    selected = frames[(frames.indexOf(frame) + 1) % frames.length]; paused = true; $('pause').textContent = 'Play';
  };
  $('action').onchange = () => { time = 0; selected = null; drawFrames(); };
  $('angle').oninput = () => { $('angle-value').textContent = $('angle').value + '°'; drawFrames(); };
  $('front').onclick = () => { $('angle').value = 0; $('angle').oninput(); };
  $('back').onclick = () => { $('angle').value = 180; $('angle').oninput(); };
  $('speed').oninput = () => $('speed-value').textContent = $('speed').value + '×';
  $('compare').onchange = () => { $('old-label').hidden = !$('compare').checked; document.querySelector('.stage-labels').classList.toggle('single', !$('compare').checked); };
  drawFrames(); $('loading').hidden = true;
  function render(now) {
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    if (!paused) time += dt * Number($('speed').value);
    const action = $('action').value, duration = clipDuration(action);
    const phase = action === 'death' ? time % (duration + 1.1) : time % duration;
    const frame = selected ?? clipFrame(action, phase);
    const yaw = Number($('angle').value) * Math.PI / 180;
    const compare = $('compare').checked, bounds = $('stage').getBoundingClientRect();
    const width = Math.round(bounds.width), height = Math.round(bounds.height), count = compare ? 2 : 1;
    renderer.setSize(width, height, false); renderer.setScissorTest(true);
    old.visible = current.visible = false;
    for (let i = 0; i < count; i++) {
      const model = compare && i === 0 ? old : current;
      if (model === old) {
        previousBear.poseArcadeBear(old, frame, .65, yaw);
      } else poseArcadeBear(current, frame, .65, yaw);
      model.visible = true;
      camera.aspect = width / count / height;
      const distance = Math.max(6.7, 3.9 / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
      camera.position.set(Math.sin(yaw) * distance, 1.4 + distance * .18, Math.cos(yaw) * distance); camera.lookAt(0, 1.4, 0);
      camera.updateProjectionMatrix();
      renderer.setViewport(i * width / count, 0, width / count, height);
      renderer.setScissor(i * width / count, 0, width / count, height);
      renderer.render(scene, camera); model.visible = false;
    }
    for (const item of buttons) { item.button.classList.toggle('active', item.frame === frame); item.button.setAttribute('aria-pressed', String(item.frame === frame)); }
    $('status').textContent = `${paused ? 'Paused' : 'Playing'} · ${$('action').selectedOptions[0].text} · ${current.userData.display.view} · pose ${frame + 1}/20`;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
} catch (error) {
  $('loading').textContent = 'The artwork could not load. Reload the study to try again.';
  $('status').textContent = error.message;
  console.error(error);
}
