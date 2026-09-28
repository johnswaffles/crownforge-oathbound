# Oathguard Run Workshop 049

Local motion proposal requested on 2026-09-28. Open:

http://127.0.0.1:4190/dev/run-workshop-v049/

If the existing local game server is stopped, run from the Oathbound repository:

```sh
python3 -m http.server 4190 --bind 127.0.0.1
```

## Review

Left: the current v046 game animator, approved proportions and v044 hands/model.
Right: the same body and materials with a separate procedural run. As of 2026-09-28, the new study also uses the revised v050 gloves and smaller hand plates.

Try Side / Slow motion to inspect contact and heel recovery. Front, Behind and Gameplay distance expose equipment clearance and silhouette. Start & stop shows the transition. Pause and Step frame allow pose inspection. Rhythm, landing softness and arm drive save to a separate localStorage key, `oathbound-run-study-v049`. Reset affects only this study. No existing Character Studio profiles are written.

This directory is isolated: neither `src/main.js` nor `src/world.js` imports the experiment. No live deployment was made.

## What the current run was doing

The live game travels at 4.4 world units per second but sends a binary movement flag to its animator. At full speed, v046 advances 1.5 complete gait cycles per second. Its foot target is independent of world travel. Each foot is treated as planted for 56% of its cycle, creating overlap rather than a running flight interval.

A 120 Hz flat-ground test of v046, with its real exported rig and approved width/height, measured mean planted forefoot movement of about **1.90 world units per second**. That is a concrete source of skating. It is not a claim that foot sliding is the only reason the user dislikes the animation.

## New motion

- Contact points stay fixed in world space while the root travels forward. Two-bone inverse kinematics positions the leg around that support, preserving the approved nonuniform model scale.
- A foot spends 42% of its full-speed cycle in contact, leaving two brief flight intervals. The ankle rolls around the forefoot during push-off. The approved boot has no articulated toe joint, so its sole remains rigid.
- A velocity-matched foot path connects push-off, early heel recovery and the next landing. A release offset fades out during the swing to avoid a jump when speed changed during the preceding stance.
- Knees absorb loading, the pelvis/chest counter-rotate, and the opposite arm leads with the front leg. The shield arm uses a smaller arc. The torso leans forward; the head remains steadier.
- A small ballistic rise covers the brief full-speed flight interval. The rest of the body motion is authored procedurally, not produced by a rigid-body or muscle simulation.
- The foot solve checks the sole again during start/stop blending to prevent sinking.

Default full-speed vertical pelvis range is **3.75 cm** in world units. The control range peaks at about 6 cm. This intentionally keeps the user's earlier objection to excessive bounce in mind.

## Research used

1. [Daniel Holden — Inverse Kinematics and Foot Locking](https://theorangeduck.com/page/inverse-kinematics-foot-locking), read 2026-09-28. Explains retaining a contact location on the floor, solving a leg toward it, handling foot orientation and blending when contact changes. This informed the contact targets, model-space IK and release transition. The study uses its own small analytic solver, not copied article code.
2. [Daniel Holden — Spring-It-On: The Game Developer's Spring-Roll-Call](https://theorangeduck.com/page/spring-roll-call), read 2026-09-28. Explains frame-rate-independent exponential damping and the importance of velocity continuity. The workshop uses time-based damping for its pose blend and acceleration response; it does not claim to implement the article's full inertialization system.
3. [GDC — Dynamic Walking with Semi-Procedural Animation, Rune Skovbo Johansen](https://www.gdcvault.com/play/966/Dynamic-Walking-with-Semi-Procedural). The public session listing was inspected as a relevant reference. The full talk was not viewed, and implementation claims are not attributed to it.

## Verification

```sh
node --test dev/run-workshop-v049/motion.test.mjs
node dev/run-workshop-v049/check-motion.mjs
npm test
```

- Five new motion tests pass: all eight slider-range corners; world-space contact retention; sole/floor clearance; sampled shield/blade versus conservative leg capsules; flight and continuous foot paths; start/stop; 30/60/120 Hz; arm opposition; approved proportions.
- All 53 existing game tests pass.
- The default steady-run test reports effectively zero planted-toe drift (floating-point error), with the floor at y=0. This is a controlled numerical result, not a promise of zero sliding on every game terrain or turn.
- Browser review covers side/front/back/three-quarter and distant cameras, pause/step, slow motion, start/stop, sliders, local persistence/reset and the contact-marker toggle. Browser screenshots are stored under `output/`.

## Before live integration

This is a flat-ground workshop, with a scripted speed ramp. The game's actual collision movement, turning, rough terrain, combat, guarding and jumping still need candidate-specific integration and gameplay checks. The unchanged live animator's passing combat tests do not validate those interactions for this study. Integrate measured velocity from successful movement rather than the current binary moving flag; otherwise blocked movement could still play a running pose. Review the movement visually with the user before changing the live import.

## User approval captured 2026-09-28

The user selected rhythm 1.98, compression 0.065 (100%), and arm drive 1.35 (135%). See approved-run-20260928.json and approved-run.js. These are now the workshop fallback and Restore saved run values. Browser slider edits remain separate from the frozen approval record. Hands v050 are local for review; no live integration has been made.

## Release integration — 2026-09-28

The user authorized push and deployment after reviewing the hands. Production v051 incorporates the saved run and v050 hands. Earlier local-only statements above describe the review stage. See [release notes](../../docs/RELEASE_20260928.md) for integration and validation details.
