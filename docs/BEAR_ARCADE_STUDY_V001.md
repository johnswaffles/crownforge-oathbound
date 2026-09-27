# Woodland Grizzly: 2D animation study

Local review: `http://127.0.0.1:8793/games/oathbound/dev/bear-study-v001.html`

Local gameplay: `http://127.0.0.1:8793/games/oathbound/?bear=arcade-v001`

## Direction

A large, original chestnut grizzly with the strong silhouette, painted shading and distinct key poses of 1990s arcade animation. Approved for Oathbound release `20260927-bear-v047`. The current Oathguard appearance and running animation are retained.

The old bear already used a 4×4 sprite sheet: four directions with three locomotion pictures and one attack pose. The new study has two 20-pose sheets, mirrored into four camera-relative views. Each contains four breathing poses, eight running poses, four claw-strike poses, and four hit/collapse poses.

## Artwork and playback

- `assets/bear-arcade-v001/front.png` and `back.png`: original, transparent artwork from the built-in image generator.
- `assets/bear-arcade-v001/provenance.json`: complete generation prompts.
- `tools/measure-bear-atlas-v001.py`: measures each separate drawing and traces its silhouette for frame meshes. It does not modify either bitmap. This handles uneven sheet spacing and prevents adjacent drawings from leaking into a pose.
- `src/bear-arcade-v001.js`: one shared renderer for review and gameplay. Drawn foot baselines sit at the model's ground level; one constant scale per sheet preserves the lower collapse silhouette.
- `src/bear-motion-v001.js`: frame timing and state transitions. Strike contact matches the damage event. Anticipation uses the existing attack timer or special windup. Dead bears hold the final collapsed pose; respawn ignores stale attack events.

Review controls include original/current comparison, front/rear and full orbit, five clips, pause, individual drawings, frame stepping, and playback speed.

## Boundaries

The approved artwork is the default for every grizzly, including Old Brackenmaw. Ordinary play retains the existing save key. The workshop's `?bear=arcade-v001` link continues to use its separate test save. Combat damage, movement speed, cooldowns and the main character's animation are unchanged.

Four viewing directions are an intentional first-pass limit. The bear changes drawings when the camera passes a direction boundary; it is not a freely rotating 3D mesh. A future approved version can add more angles and additional in-between drawings.

## Release checks

Release `20260927-bear-v047`: 52 automated tests pass. Browser playtesting through the normal game entry point covered continuing an existing adventure, approaching and fighting a grizzly, its final collapse pose, and collecting loot. No browser errors were reported. The original bear sheet and Oathguard assets are preserved.
