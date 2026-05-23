# EFZ Addons

EFZ is a Minecraft Bedrock DayZ-style server addon suite split into three modules:

- `EFZ_Entities`: visuals, mobs, NPCs, and grave entity/UI assets.
- `EFZ_Arsenal`: custom items, gear, food, medicine, armor, and weapons.
- `EFZ_Scripts`: gameplay logic, economy, stats, UI, infections, broken legs, and grave timers.

The project is intentionally modular. Entity changes should stay in `EFZ_Entities`, item changes should stay in `EFZ_Arsenal`, and JavaScript gameplay rules should stay in `EFZ_Scripts`.

## Packs

| Module | Behavior Pack | Resource Pack | Purpose |
| --- | --- | --- | --- |
| EFZ_Entities | `EFZ_Entities_BP` | `EFZ_Entities_RP` | Custom zombies, husks, NPCs, grave visuals, entity models, textures, and visual UI definitions. |
| EFZ_Arsenal | `EFZ_Arsenal_BP` | `EFZ_Arsenal_RP` | Splint item and future weapons, armor, food, medicine, and other trade goods. |
| EFZ_Scripts | `EFZ_Scripts_BP` | none | Server gameplay logic using `@minecraft/server`. |

## Build Order

1. Finish `EFZ_Entities`: grave entity, NPC entities, zombie/husk variants, models, textures, and visual definitions.
2. Finish `EFZ_Arsenal`: Splint item first, then future gear and trade goods.
3. Finish `EFZ_Scripts`: broken legs, infection, grave storage/timers, economy, stats, UI, NPC trades, and randomization logic.

## Bedrock Server Activation

Use the header UUIDs from each pack manifest when activating packs in a Bedrock world.

Example activation files are provided:

- `world_behavior_packs.example.json`
- `world_resource_packs.example.json`

Copy their contents into the world's `world_behavior_packs.json` and `world_resource_packs.json` when you are ready to test.

