# Bear rear-view correction

Release marker: `20260927-bear-v048`.

The first arcade bear's rear drawings put a shoulder-like mass and oversized foreleg at the near rump. The anatomy was wrong in the bitmap itself. The replacement sheet draws the pelvis and two hind legs nearest the camera, with a short tail and the shoulders, forelegs and head farther away. All 20 rear drawings are replaced, including the eight running poses, four claw poses, and collapse sequence.

`src/bear-arcade-v002.js` loads the corrected rear sheet and atlas from `assets/bear-arcade-v002/`. The front image and its measured frame data remain exactly as approved in `bear-arcade-v001`. Animation timing, mirrored directions, combat events and saves retain the existing behavior.

Generation used the built-in image tool; the complete prompt is in `assets/bear-arcade-v002/provenance.json`. The original front sheet was the identity/style reference. The faulty rear sheet remains available for comparison.

Rebuild metadata without editing bitmaps:

```sh
python3 tools/measure-bear-atlas-v001.py --directory assets/bear-arcade-v002 --views back --base-atlas assets/bear-arcade-v001/atlas.json
```

The workshop now compares the previous and corrected bear on the same exact frame and starts in rear-view idle. Review link: `http://127.0.0.1:8793/games/oathbound/dev/bear-study-v001.html?update=rear-fix-v048`.
