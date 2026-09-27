// Authored frame timing. One-shot clips finish before returning to locomotion.
export const BEAR_CLIPS = Object.freeze({
  idle: { frames: [0, 1, 2, 3, 2, 1], durations: [.34, .28, .24, .38, .28, .34], loop: true },
  run: { frames: [4, 5, 6, 7, 8, 9, 10, 11], durations: [.085, .07, .085, .09, .085, .07, .085, .09], loop: true },
  attack: { frames: [12, 13, 14, 15], durations: [.19, .12, .085, .23] },
  hurt: { frames: [16, 0], durations: [.12, .09] },
  death: { frames: [16, 17, 18, 19], durations: [.12, .16, .19, .7] },
});

export function clipFrame(clip, elapsed) {
  const track = BEAR_CLIPS[clip] || BEAR_CLIPS.idle;
  const duration = track.durations.reduce((a, b) => a + b, 0);
  let t = Math.max(0, elapsed);
  if (track.loop) t %= duration;
  for (let i = 0; i < track.frames.length; i++) {
    if (t < track.durations[i]) return track.frames[i];
    t -= track.durations[i];
  }
  return track.frames.at(-1);
}

export function clipDuration(clip) {
  return BEAR_CLIPS[clip].durations.reduce((a, b) => a + b, 0);
}

// Four directional views, using a mirrored front/rear pair, like the original bear.
export function bearDirection(yaw, cameraYaw) {
  const relative = Math.atan2(Math.sin(yaw - cameraYaw), Math.cos(yaw - cameraYaw));
  return { back: Math.abs(relative) > Math.PI / 2, mirror: relative < 0 };
}

export function createBearPlayback() {
  return { clip: 'idle', since: 0, lastStrike: -Infinity, lastHit: -Infinity, dead: false };
}

export function advanceBearPlayback(state, time, input = {}) {
  if (input.dead) {
    if (!state.dead) { state.clip = 'death'; state.since = time; }
    state.dead = true;
  } else {
    if (state.dead) {
      const { lastStrike, lastHit } = state;
      Object.assign(state, createBearPlayback(), { since: time, lastStrike, lastHit });
    }
    const strike = Number.isFinite(input.strikeAt) && input.strikeAt > state.lastStrike;
    const hit = Number.isFinite(input.hitAt) && input.hitAt > state.lastHit;
    if (strike) {
      state.lastStrike = input.strikeAt;
      // Game damage lands now; anticipation is shown during the timer/cast windup.
      state.clip = 'attack'; state.since = time - .31;
    }
    if (hit) state.lastHit = input.hitAt;
    const busy = ['attack', 'hurt'].includes(state.clip) && time - state.since < clipDuration(state.clip);
    if (!busy) {
      const next = hit ? 'hurt' : input.moving ? 'run' : 'idle';
      if (state.clip !== next) { state.clip = next; state.since = time; }
    }
  }
  // Telegraph holds a loaded pose; the strike itself is a separate game event.
  const casting = !state.dead && input.cast > 0 && state.clip !== 'attack';
  const frame = casting ? (input.cast / Math.max(input.castMax || 1, .01) > .4 ? 12 : 13)
    : clipFrame(state.clip, time - state.since);
  return { clip: casting ? 'anticipation' : state.clip, frame };
}
