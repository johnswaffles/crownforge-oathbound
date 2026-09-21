import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  stats,
  damage,
  mitigation,
  equip,
  awardXP,
  restore,
  weaponHit,
  ITEMS,
} from "../src/rules.js";
test("starting equipment gives 210 health and damage in the intended range", () => {
  let p = fresh();
  assert.equal(stats(p).hp, 210);
  assert.equal(
    weaponHit(p, () => 0),
    16,
  );
  assert.equal(
    weaponHit(p, () => 1),
    20,
  );
  assert.equal(stats(p).armor, 25);
});
test("armor, shield and guard multiply rather than create immunity", () => {
  assert.equal(
    damage(100, { armor: 120, level: 1, blocked: true, guard: true }),
    21,
  );
  assert.equal(mitigation(10000, 1), 0.6);
  assert.equal(damage(100, { crit: true }), 150);
});
test("equipment changes derived health and clamps current health safely", () => {
  let p = fresh();
  p.inventory.push("charm");
  assert(equip(p, "charm"));
  assert.equal(stats(p).hp, 240);
  assert.equal(stats(p).crit, 0.08);
  assert.equal(equip(p, "oathblade"), false);
});
test("quest and encounter experience unlock levels through five", () => {
  let p = fresh();
  assert.equal(awardXP(p, 65), 1);
  assert.equal(p.level, 2);
  assert.equal(p.hp, 250);
  awardXP(p, 10000);
  assert.equal(p.level, 5);
});
test("save round-trip preserves quest, inventory and equipment", () => {
  let p = fresh();
  p.stage = 3;
  p.progress = 2;
  p.supplies = [0, 2];
  p.inventory.push("helm");
  equip(p, "helm");
  let q = restore(JSON.stringify(p));
  assert.equal(q.stage, 3);
  assert.deepEqual(q.supplies, [0, 2]);
  assert.equal(q.equipment.head, "helm");
});
test("invalid saves and hostile item values cannot corrupt equipment", () => {
  assert.equal(restore("not json"), null);
  assert.equal(restore('{"version":7}'), null);
  let p = restore(
    JSON.stringify({
      version: 1,
      stage: 999,
      level: -1,
      inventory: ["fake"],
      equipment: { head: "sword" },
      x: 1e9,
      z: 0,
      hp: -100,
    }),
  );
  assert.equal(p.stage, 7);
  assert.equal(p.level, 1);
  assert.equal(p.equipment.head, undefined);
  assert.equal(p.x, 0);
  assert.equal(p.hp, 1);
});
import { findPath } from "../src/navigation.js";
test("walking routes around a wall without crossing occupied cells", () => {
  const clear = (x, z) => !(x >= 1 && x <= 3 && z >= -2 && z <= 2);
  let path = findPath({ x: 0, z: 0 }, { x: 5, z: 0 }, clear);
  assert(path.length > 5);
  assert(path.every((p) => clear(p.x, p.z)));
  assert.deepEqual(path.at(-1), { x: 5, z: 0 });
});
