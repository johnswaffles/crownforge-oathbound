# Oathbound boundaries

This is a separate browser RPG. Do not modify or deploy Crownforge: Dawn of Kingdoms as part of Oathbound work.

Keep gameplay rules in src/rules.js, rendering in src/world.js, and native user interaction in src/main.js. Preserve existing user-owned assets. New art versions must use new filenames. Runtime assets must ship with the game; never reference /Volumes paths from browser code.

Run npm test and browser-play the changed flow before release. Never claim a live release from a Git push alone. Verify the public game and website link.

Toshiba archive: /Volumes/Toshiba Externa/Crownforge/Oathbound/v001. Update only this game's scoped archive; do not overwrite unrelated Crownforge masters. No multiplayer/backend is present in v0.1.
