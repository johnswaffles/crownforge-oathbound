import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BEAR_CLIPS, clipFrame, clipDuration, bearDirection, createBearPlayback, advanceBearPlayback } from '../src/bear-motion-v001.js';

test('bear run visits eight distinct poses and loops without an idle gap', () => {
  const seen = new Set();
  for (let t = 0; t < clipDuration('run'); t += .001) seen.add(clipFrame('run', t));
  assert.deepEqual([...seen], [4,5,6,7,8,9,10,11]);
  assert.equal(clipFrame('run', clipDuration('run')), 4);
});
test('damage event displays the claw contact pose, finishes recovery, then resumes running', () => {
  const state = createBearPlayback();
  assert.equal(advanceBearPlayback(state, 1, { moving: true }).clip, 'run');
  assert.equal(advanceBearPlayback(state, 2, { moving: true, strikeAt: 2 }).frame, 14);
  assert.equal(advanceBearPlayback(state, 2.1, { moving: true, strikeAt: 2 }).frame, 15);
  assert.equal(advanceBearPlayback(state, 2.4, { moving: true, strikeAt: 2 }).clip, 'run');
});
test('cast holds anticipation and can be interrupted without inventing a strike', () => {
  const state = createBearPlayback();
  assert.equal(advanceBearPlayback(state, 1, { cast: 1.8, castMax: 2 }).frame, 12);
  assert.equal(advanceBearPlayback(state, 2, { cast: .3, castMax: 2 }).frame, 13);
  assert.equal(advanceBearPlayback(state, 2.1, { cast: 0 }).clip, 'idle');
});
test('collapse holds the final drawing and respawn does not replay stale hits', () => {
  const state = createBearPlayback();
  advanceBearPlayback(state, 1, { strikeAt: 1, hitAt: 1 });
  assert.equal(advanceBearPlayback(state, 2, { dead: true }).frame, 16);
  assert.equal(advanceBearPlayback(state, 100, { dead: true }).frame, 19);
  assert.equal(advanceBearPlayback(state, 101, { strikeAt: 1, hitAt: 1 }).clip, 'idle');
});
test('front and rear directions mirror consistently as the camera orbits', () => {
  for (const camera of [0, 1.1, 6.5, -5]) {
    assert.deepEqual(bearDirection(camera + .7, camera), { back: false, mirror: false });
    assert.deepEqual(bearDirection(camera - .7, camera), { back: false, mirror: true });
    assert.deepEqual(bearDirection(camera + 2.4, camera), { back: true, mirror: false });
    assert.deepEqual(bearDirection(camera - 2.4, camera), { back: true, mirror: true });
  }
});
test('every animation drawing fits its source atlas and collapse retains its lower silhouette', () => {
  for (const version of ['v001', 'v002']) {
   const atlas = JSON.parse(fs.readFileSync(new URL(`../assets/bear-arcade-${version}/atlas.json`, import.meta.url)));
   for (const sheet of Object.values(atlas)) {
    assert.equal(sheet.frames.length, 20);
    for (const [x,y,w,h] of sheet.frames) {
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
      assert.ok(x+w <= sheet.width && y+h <= sheet.height);
    }
    assert.ok(sheet.frames[19][3] < sheet.frames[0][3] * .7);
    for (const clip of Object.values(BEAR_CLIPS)) for (const frame of clip.frames) assert.ok(sheet.frames[frame]);
    assert.equal(sheet.outlines.length, 20);
    sheet.outlines.forEach((outline, frame) => {
      const [, , width, height] = sheet.frames[frame];
      assert.ok(outline.length >= 3);
      for (const [x, y] of outline) assert.ok(x >= 0 && x <= width && y >= 0 && y <= height);
    });
   }
  }
});
test('rear correction preserves the approved front frame bounds, scale and silhouettes', () => {
  const before = JSON.parse(fs.readFileSync(new URL('../assets/bear-arcade-v001/atlas.json', import.meta.url)));
  const after = JSON.parse(fs.readFileSync(new URL('../assets/bear-arcade-v002/atlas.json', import.meta.url)));
  assert.deepEqual(after.front, before.front);
  assert.notDeepEqual(after.back, before.back);
});
