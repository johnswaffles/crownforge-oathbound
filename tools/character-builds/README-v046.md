# Original workshop run on the current Oathguard

The reference is the Original panel in the v045 workshop: v022 asset, default pose settings and 1.0 cadence. The new character keeps the v044 hands and the approved body scale, armor, materials and standing appearance.

At running speed, the v046 renderer uses the original step cycle, body sway, arm carry and cloth motion. The leg trajectory is scaled to the natural rig's longer bones while preserving the original joint angles. Standing posture adjustments blend out during a free run and return during idle, attacks, guard and jump. Gait cadence is 1.0 to match the original reference.

The regression compares both rigs' joint rotations and phases across a full run without terrain adaptation, then checks ground clearance and transitions with the current proportions. Workshop comparison uses the same runtime as the live game. No GLB asset was changed in this release.
