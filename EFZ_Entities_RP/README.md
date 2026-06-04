# EFZ Entities RP

Visual resources for EFZ entities.

## Owns

- Grave model, texture, animations, render controller, and UI art.
- Dead body survivor textures and render variants.
- NPC models/textures for Monolith, Meudaz, Maverick, Fantom, and Razon.
- 151 zombie textures.
- 25 husk textures.
- Client entity files and texture routing for entity variants.

## Planned Asset Slots

- `textures/entity/efz/zombies/`: zombie skins converted from source TGA files.
- `textures/entity/efz/husks/`: husk skins copied from source PNG files.
- `textures/entity/efz/npcs/`: NPC textures.
- `textures/entity/efz/grave/`: grave textures.
- `textures/entity/efz/survivors/`: player/dead-body survivor skins `type_0.png` through `type_6.png`.

## Survivor Skins

The current `type_0` through `type_6` textures are 1024x512 classic humanoid skin maps. They are suitable for EFZ dead-body entities and other humanoid custom entities.

For living players, scripts still assign each player a persistent random survivor type for corpse/dead-body matching. The risky `minecraft:player` client override is intentionally disabled for now because it made live players invisible during mobile testing. Fully forcing visible living-player skins should be handled later as a separate, dedicated rendering pass.

## NPC Textures

- `monolith.png`: 1024x512 black market seller.
- `fantom.png`: 1024x512 black market buyer.
- `meudaz.png`: 256x128 safe zone food/medicine seller.
- `maverick.png`: 1024x512 safe zone armor/sword seller.
- `razon.png`: 256x128 safe zone common-item buyer.

## Zombie And Husk Textures

- Zombies: 151 PNG textures in `textures/entity/efz/zombies/`.
- Husks: 25 PNG textures in `textures/entity/efz/husks/`.
- Source zombies were TGA files in `My data/zombie/`; they were converted to PNG for safer Bedrock resource-pack use.
- Source husks were already PNG files and were copied into the pack.
- Zombie and husk texture randomization is now handled by generated EFZ custom infected entities, not by random render-controller texture arrays.
- Each generated infected entity keeps vanilla-style zombie/husk geometry and animation-controller wiring, but owns exactly one fixed texture. Scripts replace natural `minecraft:zombie` and `minecraft:husk` spawns with a random `efz:infected_*` variant.
- The vanilla `minecraft:zombie` and `minecraft:husk` client entities remain as fixed-texture fallbacks only.
- The generated variant/entity list is `EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json`.

## Random Skin Selector Validation

Run this repo check after adding/removing zombie or husk skins to ensure all selector files stay in sync:

- `node tools/validateZombieSkinSelector.mjs`

It validates:
- texture files on disk,
- generated BP infected entity files,
- generated RP infected client entity files,
- the fixed infected render controller,
- and `EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json`.

Regenerate infected variants after adding/removing zombie or husk textures:

- `node tools/generateInfectedVariants.mjs`
