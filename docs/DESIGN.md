# First Watch design — v0.1

## Canon and scope

Crownforge’s Veyoran Crownwardens descend from soldiers who allowed civilians to cross Bracken Ford before royal treasure. Their winter patrol tradition is to count the chimneys. This adventure proposes a new patrol near Brackenwatch Hollow. Mara Venn, Tovin Reed, Edda Vale and Old Brackenmaw are new story material; older Chronicle assets are not altered.

Single player, desktop browser, one fighter, one small zone. Third-person 3D camera with temporary directional bear artwork from Crownforge. Eight gear slots. Maximum level five. No accounts or multiplayer service. Character visuals do not yet change to depict every equipped item; equipment affects derived stats and weapon effects.

## Stats

Strength starts at 10, +2 per level; each grants 2 Attack Power. Vitality starts at 10, +2 per level; each grants 10 Health. Maximum Health = 100 + 10 × Vitality + 20 × (level − 1), including equipment. Starter tunic adds 1 Vitality: 210 starting Health.

Weapon hit = random weapon damage + Attack Power × base weapon interval / 10. Starter sword = 12–16 damage, 2 seconds: 16–20 base hit. Oathstrike = 150% weapon hit.

Armor reduction = min(60%, Armor / (Armor + 100 + 20 × attacker level)). Critical chance starts at 5%, capped at 30%; crits deal 150% damage. Haste caps at 25% and affects auto-attack interval only. Shield block chance starts at 10%, capped at 40%; blocks require frontal attacks and reduce damage 30%. Armor, block and Iron Guard multiply sequentially. Minimum hit = 1.

Resolve caps at 100. Successful auto-attacks generate 10. Direct hits received generate 5 at most once per second. After five seconds out of combat, Resolve decays at 8/sec and Health regenerates at 5% max/sec. Block grants a five-second window with a 10-Resolve discount to Oathstrike.

## Abilities

- Level 1 Oathstrike: 20 Resolve; 150% weapon hit; 1.5s global cooldown.
- Level 1 Iron Guard: 20 Resolve; 40% damage reduction for 4s; 16s cooldown; off global cooldown.
- Level 2 Shield Bash: free; 60% weapon hit; interrupt, 3s special delay; 12s cooldown; global cooldown.
- Level 3 Sweeping Steel: 35 Resolve; 110% weapon hit to three frontal nearby enemies; 8s cooldown; global cooldown.
- Level 4 Last Stand: free; heals 25% Health over 5s; 60s cooldown; off global cooldown.
- Healing draught: heals 40% Health; 25s cooldown; consumable. Start with three. Resting at camp or returning after defeat replenishes your supply to at least three. Buy extras for five coins at Tovin.

## Progression

Cumulative XP levels: 0, 65, 165, 300, 460. Normal bears award 18; boss 60. Level-up restores Health. Quest rewards supply remaining experience; the intended story reaches level five.

The First Watch → investigate cottage (+45 XP, gloves) → kill three bears (+50, helmet) → collect three stream satchels (+50, greaves) → defend Edda from two bears (+70, charm) → defeat Brackenmaw (+100, rare sword) → return to Mara (shield).

Bears drop three coins; Brackenmaw drops fifteen. Some remains contain a draught. Loot is explicit with E. The rare sword increases the post-block Oathstrike by 20%. Quest items appear in the pack and must be equipped by the player.

## Future boundaries

A fully 3D bear, a more detailed fighter, equipment appearance changes, additional zones and richer audio can improve this established slice. Multiplayer would require authoritative server combat, persistent accounts, reconciliation and hosting; the static single-player deployment does not supply that infrastructure.
