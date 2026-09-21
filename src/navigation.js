// Small-zone grid navigation. Rounded clearance prevents diagonal corner cutting.
export function findPath(start, end, clear) {
  const cell = 1,
    startX = Math.round(start.x),
    startZ = Math.round(start.z),
    goalX = Math.round(end.x),
    goalZ = Math.round(end.z);
  const key = (x, z) => x + "," + z;
  let open = [{ x: startX, z: startZ, g: 0, f: 0, parent: null }],
    seen = new Map(),
    closed = new Set(),
    best = open[0],
    bestD = Infinity;
  seen.set(key(startX, startZ), open[0]);
  for (let attempts = 0; open.length && attempts < 9000; attempts++) {
    open.sort((a, b) => a.f - b.f);
    let n = open.shift(),
      k = key(n.x, n.z);
    if (closed.has(k)) continue;
    closed.add(k);
    let d = Math.hypot(n.x - goalX, n.z - goalZ);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
    if (d < 1.2) break;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      let x = n.x + dx,
        z = n.z + dz,
        nk = key(x, z);
      if (
        Math.abs(x) > 43 ||
        z < -46 ||
        z > 28 ||
        closed.has(nk) ||
        !clear(x, z)
      )
        continue;
      if (dx && dz && (!clear(n.x + dx, n.z) || !clear(n.x, n.z + dz)))
        continue;
      let g = n.g + Math.hypot(dx, dz),
        old = seen.get(nk);
      if (old && old.g <= g) continue;
      let next = {
        x,
        z,
        g,
        f: g + Math.hypot(x - goalX, z - goalZ),
        parent: n,
      };
      seen.set(nk, next);
      open.push(next);
    }
  }
  let path = [];
  while (best.parent) {
    path.push({ x: best.x, z: best.z });
    best = best.parent;
  }
  path.reverse();
  if (clear(end.x, end.z) && bestD < 1.2) path.push({ x: end.x, z: end.z });
  return path;
}
