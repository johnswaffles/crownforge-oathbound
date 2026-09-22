# Crownforge: Oathbound — Character Creation Bible

Version 1 · 2026-09-22 · Derived from the Oathguard character review through Art Study 037.

## Read this first

Build an original, stylized fantasy character with convincing physical relationships. The target is an expressive cartoon warrior with substantial rounded armor, recognizable hands, believable equipment attachment, grounded feet, and forceful full-body combat. More realism, detail, or polish does not automatically make the result better.

The user preferred the cartoon direction over repeated realistic attempts. The approved combat direction is deliberately exaggerated: broad stance, overhead windups, visible torso and hip action, moving shield, and a forceful front kick. Start close to that level of expression instead of requiring many tiny amplitude increases.

Keep silver steel armor, blue cloth/shield, darker mail, brown leather, and restrained shine as the Oathguard baseline. Bronze/gold armor was explicitly rejected even though the original RTS Crown Guard reference uses those colors. User corrections take precedence over source-art imitation.

The latest fresh battle-wear pass has been delivered for review, not explicitly approved yet. The slower continuous attack timing was explicitly approved immediately before that pass. Preserve this distinction in future work.

## 1. Decisions to carry into the next character

| Area | Working default | Avoid repeating |
| --- | --- | --- |
| Style | Cohesive cartoon fantasy with rounded, substantial forms | Chasing photorealism while anatomy and articulation remain wrong |
| Silhouette | Readable at gameplay distance; deliberate chest/shoulder/leg mass | Primitive-looking block body, spherical head, straight slab armor |
| Head | Shaped helm covering most of the head/face for this fighter | A visible perfect sphere; use another face design only deliberately |
| Hands | Complete tapered glove/palm, distinct curled fingers, opposing thumb | Floating finger rings, partial hands, backwards or broken wrists |
| Equipment | Handle seated in the fist; shield built around its grip | Fixing attachment mistakes with extreme wrist bends |
| Cloth | One regular front sash, pinned under the belt; cape attached at shoulders | Double mini-sash, floating cape or cloth hovering off the body |
| Armor | Silver plate, darker mail, small moving highlights | All-bronze/gold armor, uniform flat white, broad dirty mottling |
| Wear | Sparse impact scratches, localized scuffs, rubbed metal | Rusty camouflage, uniformly noisy damage, neglected/trashy gear |
| Run | Opposing arm drive, chest/hip counterturn, forward intent | Legs jogging beneath an almost stationary torso |
| Combat | Exaggerated anticipation, committed cut, follow-through and recovery | Mosquito-swatting, paddling, muscle jerks or arm-only attacks |
| Timing | Roughly 0.64–0.65 seconds per current move; continuous review cycle | Fixed idle waits between attacks; treating faster as always better |

These are Oathguard-derived defaults, not a requirement that every future class have the same body, weapons, helmet or attack set. Reuse the principles and make intentional silhouette/class differences.

## 2. What to settle before detailed modeling

Create a short character brief: role, faction, body mass, equipment, silhouette, palette, three signature motions and required gameplay camera distance. Inspect the original RTS assets and the current approved Oathguard together. Use external references to understand design and movement; make original assets rather than reproducing another game's character.

For this project, the directly inspected local RTS references are:

- `../crownforge-bear-fury-preview/assets/characters-v3/crown-guard/rig-front.png`
- `../crownforge-bear-fury-preview/assets/characters-v3/crown-shieldbearer/rig-front.png`

They support blue cloth, sunburst heraldry and a Crownwarden identity. They do not override the later request for silver armor. Do not conflate the RTS UI faction swatch with the colors painted on unit art.

Make silhouette and action poses legible before spending effort on tiny rivets, engraving or texture density. More surface detail did not rescue the earlier proportions or movement.

## 3. Anatomy, equipment and cloth construction

### Body and armor

Use curved shells, domed breastplates, rolled rims, shaped helmets, and continuous limb volumes. Avoid disconnected blocks masquerading as anatomy. Armor should fit around joints and visibly leave room for elbows, knees and wrists to bend; mail can occupy those gaps.

The stockier Oathguard reference widened thighs/calves by 25%, deepened them by 20%, broadened the torso by 12%, and widened boots by 16% relative to its earlier model. These are historical changes, not multipliers to apply again. Match the current model visually first.

Its shield is 1.85 times the older width and height, approximately 3.42 times the face area. Scale the shield around its grip while keeping the hand/handle anatomically sized. Larger equipment immediately requires new movement-clearance checks.

### Hands and weapons

Construct hands in an explicit local frame: forearm into wrist, wrist into palm and knuckle row, four curled fingers with differing lengths, thenar mound, and opposing thumb. Use a continuous glove mesh. Mirror the shield hand anatomically, not by guessing rotation until it looks close from one camera.

The handle passes through the closed palm. Crossguard belongs beyond the index finger, pommel behind the little finger. Hand, handle, blade and guard must maintain their relative placement during motion. The current grip is sculpted and moves with the hand joint; fingers are not individually animated.

Check sword roll as well as its pointing direction. A blade can point at the enemy while presenting its flat face to the swing. The earlier model needed a 90-degree rotation around its handle axis to make the cutting edge lead. Test the exported geometry and animated edge direction, not just a screenshot.

### Cloth and ground

Pin the upper sash to the pelvis beneath the belt. Let its lower section move with leg clearance. Pin cape shoulders to the chest/clasps; progressively allow motion down the cape. Do not animate an attachment edge as though it were loose cloth.

Ground support must use the visible hard surface, including transformed path stones, not just the base terrain height. Sample multiple sole points and adjust the leg/pelvis. A planted boot should rest on stone; an airborne or kicking boot must not be forced down. Current support is procedural, not full rigid-body physics.

## 4. Materials: battle-ready silver, not rusty armor

Use material separation: silver plate, brighter silver rims, darker patterned mail, blue cloth, blue shield paint, and warm brown leather. Maintain the cartoon visual language with selective steel highlights. The current solution uses Phong highlights on steel and toon shading on cloth/paint, with an outline.

For wear, design a few readable incidents: a glancing chest scrape, shoulder contact, a helmet mark, knee abrasion and faint lower-leg dirt. Fresh scrapes can have a dark groove and a narrow bright lip. Large areas of clean steel should remain between marks.

Anchor wear in mesh rest coordinates so it follows the skin rather than swimming over the character. Examine highlights and scratches while the character turns. Do not change scene lighting merely to make the character look good in one pose.

Rejected appearance: broad bronze/gold coverage and large cloudy paint-wear patches. The user asked for silver and “a little used,” then for recently battled-in but maintained armor. The latest wear pass is intentionally sparse. No blood, rust layer or broken equipment was requested.

## 5. Combat authoring: solve the action, not just the arm

Design poses in this order: ready stance → load/chamber → active hit → follow-through → recovery. Inspect them as still silhouettes before judging the loop. Pair a forceful action with support and counterbalance: knees compress, hips move, chest turns, shield responds, head remains purposeful, cape follows with delay.

For this fighter, the current standing attacks use a broad fore/aft stance: about +0.30 for the lead foot and -0.24 for the rear foot at full attack weight. That is a pose reference, not a universal anatomical constant. Locomotion blends differently so the standing stance is not stacked onto a full running stride.

The user repeatedly found small increments too timid. Establish conspicuous loaded and finishing poses early, then tune excess. Do not assume “technically smooth” means forceful. Bigger windups can coexist with controlled paths through the hit interval.

### Four current attacks

1. **Descending cut:** overhead load, cut down through an opponent directly ahead, recover clear of the thigh.
2. **Right-to-left slash:** from the character's upper right to lower left, with elbow and hand staying forward of the chest at the finish. The earlier cross-body move was rejected.
3. **Rising cut:** low preparation and an upward cut through the centered opponent. A large swing out beside the target was explicitly rejected.
4. **Front kick:** arms and weapons open to the sides, torso leans back, right knee chambers, boot extends decisively forward, leg recoils, foot replants. Left support sole remains grounded.

Never solve self-intersection by moving the whole cut so far outward that it misses. Solve target contact and body clearance together. Allow a different recovery path after the active hit.

The shield is active equipment: it withdraws, opens and braces with an attack. Keep the grip and wrist coherent. Its larger face must clear both legs during running, sword attacks, kick transitions and recovery. Blend from the current carry; snapping to a nominal idle carry caused a running-entry collision.

### Timing and continuity

Current approved durations, after the user's final speed adjustments:

| Move | Duration |
| --- | ---: |
| Descending cut | 0.65278 s |
| Right-to-left slash | 0.63889 s |
| Rising cut | 0.65278 s |
| Front kick | 0.65278 s |

Exact source values are `.5875/.9` and `.575/.9`. The kick was briefly 5x faster, but that was superseded by matching the sword attacks. Do not restore old speed experiments.

The review chains all four immediately at clip completion. It retains recovery/windup motion but adds no idle waiting interval. Continuous preview chaining is not proof of gameplay cooldown or damage changes; those remain separate systems.

Use continuous interpolation through contact and smooth endpoint recovery. Current sword tracks use quintic Hermite interpolation, with small body lead and elbow/wrist lag. Compensate shoulder yaw when body rotation would change the cutting plane. Do not restart an unfinished swing on every input; a bounded pending attack avoids snapping and unlimited queues.

Change speed only after poses and paths work. Retest at the new speed: changing attack duration changes its relationship to the running gait and can expose new collisions. Maintain sufficient normalized-phase sampling in tests instead of weakening assertions when a clip gets faster.

## 6. Review and verification gates

Use the same model and animator in the isolated review and local playable preview. The review must offer Previous/current, orbit, gameplay distance, individual attack selection, full rotation, Pause and Step.

Before asking the user to evaluate the next character:

- Inspect front, side, back and three-quarter views at close and gameplay distances.
- Inspect both hands from palm and back; confirm weapon roll and shield grip.
- Confirm belt/shoulder cloth attachments and boot contact on visible ground.
- Watch idle, start/stop, walk, run and guard; check opposing arm drive and equipment clearance.
- Step through every attack's load, active hit, finish and recovery. Then watch the full-speed loop.
- Test attack entry while walking/running and while guarding, not just stationary poses.
- Confirm shader compilation and no browser errors. Rendering success alone is not visual approval.

Current automated checks include rig weights, cloth pinning, sword section orientation, gait continuity, target crossing, edge-leading cuts, sampled blade-to-leg clearance, shield-vertex-to-leg clearance, foot support, kick chamber/extension, broad stance, rotation order, queue behavior and no idle frames in continuous review.

The centered target reference is z=0.85 with x within ±0.18 and a useful vertical region; descending/rising tests require sustained contact and directional travel. These are model-specific animation checks, not a universal hitbox standard. Clearance tests use sampled geometry and conservative leg capsules, not exhaustive collision physics. A new body or weapon requires recalibrated geometry and coverage, not copied numbers alone.

There were 32 passing tests at the latest timing revision. The latest material-only change was visually checked and its animator compared to the prior file; no new full test run was claimed for that material pass. Existing tests currently import animator v034, while the live local renderer is v035 with only the wear-helper import changed. Update test imports when subsequent animation changes warrant it.

## 7. Fast workflow for the next character

1. Write the brief and select references; record any deliberate deviations from this bible.
2. Reuse the current technical foundation, not an early rejected revision. Make new versioned files.
3. Build a readable silhouette plus correct grips, cloth anchors and support points.
4. Block exaggerated action poses and the target path before fine materials.
5. Complete locomotion and full attack sequence; solve target contact and self-clearance together.
6. Tune timing and transitions; test moving entries and repeated attacks.
7. Add restrained material polish and sparse wear. Check at gameplay distance.
8. Present one internally checked candidate with Previous comparison and a short report of what changed, what was checked, and what remains uncertain.

This sequence is intended to reduce preventable review rounds. It does not replace user taste or guarantee approval. Bundle related corrections into a coherent pass, and preserve a known-good version so comparisons remain meaningful.

## 8. Current source map and project boundaries

Paths below are relative to this isolated art-preview project. Verify current imports before reuse; version numbers describe different layers and need not match.

| Purpose | Current reference |
| --- | --- |
| Rendered model | `assets/oathguard-v022.glb` |
| Editable model / generator | `art/source/oathguard-v022.blend`, `art/source/build_oathguard_v022.py` |
| Character loader / animator | `src/oathguard-v036.js` |
| Jump clock / motion | `src/jump-motion-v036.js` |
| Approved attack timing / tracks | `src/sword-motion-v034.js` |
| Latest armor wear | `src/campaign-wear-v035.js` |
| Kick-aware ground fitting | `src/foot-contact-v030.js` |
| Core gait / leg solve | `src/oathguard-motion-v009.js` |
| Review | `art-review.html`, `src/art-review.js` |
| Gameplay integration | `src/main.js`, `src/world.js` |
| Physical animation checks | `tests/sword-motion.test.mjs`, `tests/oathguard.test.mjs`, `tests/ground-contact.test.mjs` |

Local review: http://127.0.0.1:4191/art-review.html#character

This project is `/Users/johnshopinski/Documents/New project/crownforge-oathbound-art-preview`. The separate release repository is `../crownforge-oathbound`. A local review is not a deployment. Do not modify the original RTS or publish this art study merely to show a new character.

Preserve old meshes, generators, material modules and animation versions. Snapshot integration files before switching them. Back up only the scoped archive: `/Volumes/Toshiba Externa/Crownforge/Oathbound/art-preview-v001`. Never put external-drive paths in browser runtime code.

## 9. Reusable next-character brief

> Create an original Crownforge: Oathbound character using this bible and the current Oathguard as the quality baseline. Specify class, faction, silhouette and equipment first. Favor rounded cartoon forms with mechanically convincing grips, attachments and ground contact. Start with clear, exaggerated full-body action poses rather than subtle arm motion. Ensure attacks pass through a target and clear the character. Use intentional material contrast and restrained wear. Preserve approved assets, work in the isolated preview, include a previous/current comparison, and verify the complete movement sequence before presenting it. Record any character-specific differences instead of silently changing the baseline.

## Evidence trail

For reconstruction details, read the relevant revision notes rather than replaying every old experiment:

- Style and hands: OATHGUARD_V008, V009, V011.
- Attachments and blade orientation: V012, V013.
- Cut continuity and target/leg tradeoffs: V015–V018, V026.
- Stocky build and shield clearance: V019–V021.
- Rejected bronze and corrected steel: V022–V024.
- Strong combat silhouettes: V025–V029.
- Kick and continuous rotation: V030–V034.
- Latest fresh battle wear: V035.

## Jump review addition — Art Study 038

Space and the Jump button trigger one jump; holding Space does not queue repeat jumps. The shared local gameplay/review clock includes 0.18 seconds of preparation, 0.66 seconds airborne (0.76 m root lift), and 0.32 seconds of landing/recovery. These are review candidates, not approved timings. Bend both knees, counterbalance with equipment, and bypass grounded foot fitting while airborne. Resume hard-surface support at landing. Pause and Step must also pause/advance the jump. Preserve the approved sword/kick durations. The current 33-test suite imports animator v036 and includes jump retrigger, timing, airborne feet and grounded completion checks.

## Ditch leap correction — Art Study 039

The user rejected the first symmetric vertical jump as trampoline-like. Prefer a low forward leap, leading knee, trailing boot, forward torso intent, then a staggered foot placement and compression. Current candidate: 0.43 m apex, 0.56 s flight, 1.08 s total. Review stages a 1.5 m forward displacement and resets the takeoff point on the next trigger; gameplay retains its existing player-controlled horizontal movement. Animation is shared. Pending visual approval.
