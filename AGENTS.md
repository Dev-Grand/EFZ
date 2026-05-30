# EFZ Agent Instructions

For every request in this repository, use the installed `minecraft-bedrock-mastery` skill and the project references in `.agents/skills/minecraft-bedrock-mastery/references/`.

Before making changes, read the relevant reference file for the work area:

- Pack structure, manifests, dependencies, UUIDs, script module versions, pack icons, packaging, and release imports: `bedrock-pack-architecture-manifests.md`
- Script API systems, menus, scoreboards, admin commands, zones, graves, multiplayer/mobile runtime bugs, and debugging: `bedrock-script-runtime-debugging.md`
- Entities, client entities, render controllers, geometry, animations, player overrides, zombie/husk variants, NPCs, corpses, armor visuals, and attachables: `bedrock-rp-entity-rendering-animation.md`
- Menus, actionbar HUD, title alerts, shops, corpse-loot UI, admin tools, and JSON UI/resource-pack screens: `bedrock-ui-ux-design.md`
- Configs, generated lists, validators, cross-pack references, trade tables, zone data, manifests, and release QA checks: `bedrock-data-validation-integrity.md`
- Script intervals, HUD updates, entities, textures, sounds, particles, weapons, zones, corpse systems, pack size, and mobile performance: `bedrock-mobile-performance-optimization.md`
- Death, loot, zones, infection, injury, economy, traders, events, PvP, progression, weapons, armor, and balance: `efz-hardcore-survival-gameplay-design.md`
- Loot, economy, traders, loot boxes, restocks, scarcity tuning, payments, prices, stock, and anti-duplication checks: `efz-loot-economy-trader-systems.md`
- Custom weapons, ammo, reloads, recoil, hit detection, damage, armor interactions, bleeding, combat HUD, sounds, and weapon validators: `efz-weapons-combat-systems.md`
- Armor, equipment, gas masks, hazmat gear, backpacks, durability, protection tuning, and wearable visuals: `efz-armor-equipment-systems.md`

Always keep EFZ split into its modular pack architecture:

- `EFZ_Entities_*`: visuals, client/server entities, models, textures, render controllers, NPC/corpse/zombie resources.
- `EFZ_Arsenal_*`: custom items, consumables, weapons, armor, gear.
- `EFZ_Scripts_BP`: gameplay logic, UI menus, economy, stats, infection, injuries, graves, zones, validation.
- `EFZ_Main_RP`: main server visual texture/resource pack.

Treat in-game reports and content logs as higher priority than static validation. JSON parsing and JS syntax checks are required, but they do not prove Bedrock runtime correctness.
