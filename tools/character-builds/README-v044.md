# Oathguard hands and run, v044

The release retains the v043 approved body proportions, colors and 1.26 gait cadence.

## Hands

Blender sculpts separate fitted glove meshes with tapered palms, four curled fingers and opposing thumbs. The glove geometry replaces only the old glove material primitive. The new meshes attach directly to their corresponding hand bones, using the same sword grip frame. The original armor, sword, shield, skeleton and natural proportions remain byte-identical in the original GLB buffer. Leather uses soft rough shading and a thinner contour than the armor.

Rebuild from the project root:

```
/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/character-builds/sculpt-hands-v044.py
python3 tools/character-builds/pack-hands-v044.py
```

## Motion

`src/run-motion-v044.js` blends a distinct run above walking speed. A planted drive occupies 42% of a full stride; the recovery foot lifts earlier and higher, with a short flight interval. The pelvis compresses after contact and rises into push-off. Chest rotation opposes the hips, while elbows and wrists follow the shoulder with a small phase delay. Existing idle breathing, attacks, guard and jump remain separate blends. Movement speed and damage timing are unchanged.

`dev/character-review-v044.html` compares the previous live rig against the new one at the exact approved style, with running, hand closeups and attack views. Run `npm test` for asset preservation, ground contact, gait continuity and existing gameplay checks.
