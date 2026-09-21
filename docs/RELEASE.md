# First playable release — 2026-09-21

Live game: https://crownforge-oathbound.onrender.com/
Website: https://justaskjohnny.com/#games
GitHub: https://github.com/johnswaffles/crownforge-oathbound
Render service: srv-daormv142hec73fu0mug
Render branch: codex/oathbound-initial
Website link commit: 4a04dac

## Verified

- Seven rules/save/navigation tests passed.
- Browser play: accepted Mara's patrol, investigated the cottage, defeated three bears, collected all three supplies, defended Edda against two bears, defeated Brackenmaw, equipped the rare sword and reached level five, returned to Mara and received the completion shield. This full chain was played in the local browser through normal controls, including retries and saved-session recovery.
- Equipment rewards changed Health, Attack Power, Armor and crit as expected. Compare text and bag interactions were inspected.
- Death preserves progression and offers a camp return. Saved equipment and quest stage survived a reload.
- Live Render title and game world loaded; no warning/error messages were observed in the browser log.
- The public website displayed the new Crownforge: Oathbound link after Cloudflare production deployment 4a04dac.
- Copied Crownforge bear artwork and music are byte-identical to their source files.

## First-playable limits

The fighter and forest are early stylized 3D assets. Bears use existing directional Crownforge artwork on upright planes; they are not full 3D models. Individual equipment pieces do not yet change the character model. Desktop keyboard/mouse controls are the supported experience. Saves are local to the browser, with JSON export/import. No accounts, cloud saves or multiplayer server exist.

## Last hardening pass

Clear ground telegraphs show heavy-swipe direction. Menu time is paused. Map movement routes around obstacles. Resting or recovering at camp restores at least three healing draughts. The Begin button waits for required bear artwork. Imported interrupted defense encounters restart cleanly. Runtime source is formatted for future development.
