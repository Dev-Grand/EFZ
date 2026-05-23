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

For living players, scripts assign each player a persistent random survivor type. Fully forcing the player's visible account skin requires a player-render resource override, which is more fragile than normal custom entities and should be tested separately before relying on it for the server.

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
- The generated variant list for future randomization is `EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json`.
