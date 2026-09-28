# Oathguard hands 050 — local review

User request: remember the selected run for an upcoming deployment, then fix the hands first.

## Saved run

Read directly from the existing browser controls before any reload: **1.98** rhythm, **0.065 / 100%** landing softness, **1.35 / 135%** arm drive. The source-of-truth record is `../run-workshop-v049/approved-run-20260928.json`. Its SHA-256 locks the exact motion module used at approval. The importable preset is `../run-workshop-v049/approved-run.js`.

The original run workshop now restores that preset and shows v050 hands on the new-study side. This close-up workshop applies the same preset to both models, allowing a direct comparison of the hands.

## Hand changes

- A rounded, padded palm instead of a flat slab.
- A visible row of four curled fingers with differing lengths and thicknesses.
- A shorter opposing thumb blended into the palm, resting across the fingers.
- A smaller dorsal hand plate so the finger shapes remain visible.
- Smooth leather surfaces, practical geometry, and the existing sword/shield grip frames.

The glove is one closed surface per hand, attached to its existing wrist. Fingers are sculpted in a fixed grip, not independently animated. No weapon, body proportion, motion module, or armor outside the two hand plates was changed.

## Files

- Model: `../../assets/oathguard-natural-hands-v050.glb`
- Blender source: `../../tools/character-builds/hands-v050.blend`
- Sculpt generator: `../../tools/character-builds/sculpt-hands-v050.py`
- Packer: `../../tools/character-builds/pack-hands-v050.py`

The packer starts from the approved natural-body buffer. It removes only the old glove primitive and 336 triangles from each old dorsal hand plate, then appends the new hand geometry. All original buffer bytes remain intact. The tests verify the only removed steel triangles belonged to those small hand plates.

## Review URLs

- http://127.0.0.1:4190/dev/hand-workshop-v050/
- http://127.0.0.1:4190/dev/run-workshop-v049/

Sword/shield palm and knuckle cameras, glove-only isolation, whole-character views, approved run, pause and frame stepping are available. Screenshots are under `output/`.

## Verification

- Three hand/preset tests: recorded run values and motion checksum; preserved rig, geometry and weapon data; connected watertight gloves, normalized normals and correct wrist attachment.
- Five motion tests pass.
- All 53 existing game tests pass.
- Browser checks cover both grips, glove-only view, standing/running and full-character comparison. These are local review checks; the candidate has not been integrated into live terrain/combat gameplay.

Run:

```sh
node --test dev/hand-workshop-v050/hands.test.mjs
node --test dev/run-workshop-v049/motion.test.mjs
npm test
```

No push or deployment in this hand-review task. User plans to deploy after reviewing the hand correction.

## Release integration — 2026-09-28

The user authorized push and deployment after reviewing the hands. Production v051 incorporates the saved run and v050 hands. Earlier local-only statements above describe the review stage. See [release notes](../../docs/RELEASE_20260928.md) for integration and validation details.
