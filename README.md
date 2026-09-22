# Crownforge: Oathbound

An original single-player browser RPG set in Crownforge’s world. First playable: Brackenwatch Hollow, a sword-and-shield fighter, five abilities, a seven-stage quest chain, equipment and saving.

## Play locally

Run `python3 -m http.server 4190 --bind 127.0.0.1` in this folder. Open http://127.0.0.1:4190/. No build or package install is required. Three.js 0.174.0 is vendored with its MIT license.

WASD moves relative to the camera. Drag the world to orbit; scroll to zoom. Click the ground or map to walk using obstacle-aware navigation. Tab selects bears; F approaches and auto-attacks; 1–5 use abilities. E interacts. Q drinks a healing draught. C opens equipment; J opens the journal; Escape opens the menu or closes a panel. Panels pause gameplay. Desktop keyboard and mouse are the supported first-release controls.

## Publish

Separate repository: https://github.com/johnswaffles/crownforge-oathbound
Render static site: repository root, branch `codex/oathbound-initial`, build `echo Oathbound-static-ready`, publish directory `.`. No secrets, server, paid game backend, or API keys are required by the game. Render serves the game independently of Crownforge and Johnny Chat.

## Source boundaries

- `src/rules.js`: item catalog, stats, damage formulas, progression, save validation.
- `src/main.js`: input, combat, quests, UI, browser saves, audio and game loop.
- `src/world.js`: editable authored 3D scenery and fighter, directional Crownforge bears.
- `src/navigation.js`: bounded obstacle-aware walking routes.
- `assets/`: shipped artwork and music only.
- `docs/DESIGN.md`: content and balance specification.

Run `npm test` for rules, saves and navigation checks. Open the browser and complete the story for integration verification. No debug cheats are shipped.

## Art and provenance

The Oathguard is an original articulated Blender character with silver armor, blue cloth and shield, weathering, four combat moves and a Space-triggered leap. Authored camp buildings, waving blue-and-silver Crownwarden banners, foliage and terrain ship as local assets. The bears reuse the user's original Crownforge grizzly atlas unchanged, displayed on vertical directional planes in the 3D world. They are not yet fully 3D rigged bears. The music `cavernous-wonder.mp3` is reused unchanged from Crownforge. Original Oathbound title artwork was generated for this project with the built-in image generation tool. No Blizzard artwork, names, music or code are used.

Versioned source and assets are also preserved on Toshiba under `Crownforge/Oathbound/v001`. The external drive is for production files; players load the published game from Render.

## Saving

Save key: `crownforge-oathbound-save-v1`. Auto-saves every eight seconds and on rewards/equipment changes. The menu exports/imports a validated JSON save. Browser saves are device/browser-specific. Importing a save restores player progression, not an in-progress enemy encounter. An interrupted Edda defense restarts from the beginning. Defeat preserves progression and returns the player to camp.
