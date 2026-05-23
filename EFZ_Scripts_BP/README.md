# EFZ Scripts BP

JavaScript gameplay logic for the EFZ server.

## Owns

- Fall damage broken-leg detection:
  - 4+ block fall/drop threshold.
  - 30% broken-bone chance from 4-5 blocks.
  - 50% broken-bone chance from 6-7 blocks.
  - 100% broken-bone chance from 8+ blocks.
  - Slowness III until treated.
  - Jump disable until treated.
- Splint consumption logic:
  - Detects use of `efz:splint`.
  - Clears broken-leg state.
  - Removes only EFZ broken-leg movement debuffs.
  - Leaves poison, nausea, infection, and other unrelated effects active.
- Infection logic:
  - Detects zombie/husk hits.
  - 20% infection chance.
  - Supports vanilla `minecraft:zombie` and `minecraft:husk`.
  - Also supports future EFZ custom attacker type IDs starting with `efz:zombie` or `efz:husk`.
  - Randomly applies one disease:
    - Nausea for 90 seconds.
    - Poison I for 30 seconds.
    - Poison II for 30 seconds.
    - Harmful poison / Fatal Poison for 30 seconds.
- Syringe consumption logic:
  - Detects use of `efz:syringe`.
  - Clears the active EFZ infection marker.
  - Removes only the disease effect that EFZ infection applied.
  - Leaves broken-leg effects, stats, and unrelated conditions active.
- Grave logic:
  - Detects player death.
  - Saves inventory.
  - Spawns EFZ dead body/grave entity.
  - Matches the body skin to the player's assigned survivor type.
  - Makes grave lootable by other players.
  - Deletes grave after 15 minutes.
- Survivor skin assignment:
  - Randomly assigns each player one persistent survivor type from `type_0` through `type_6`.
  - Stores the assignment in player dynamic properties.
  - Syncs a tag such as `efz_skin_type_3` for command/debug use.
- Economy:
  - Money tracking.
  - Buying and selling.
  - Player-to-player money/item trading.
- Personal UI:
  - Money.
  - Kills.
  - Deaths.
- Scoreboard stats:
  - `efz_money`: editable digital money balance.
  - `efz_kills`: player kills.
  - `efz_deaths`: player deaths.
  - `efz_ui`: vanilla sidebar test display with a blank title.
  - The sidebar test display only appears when one player is online, because Bedrock's vanilla sidebar is global and would not be private on a multiplayer server.
- NPC trade menus and transactions.
  - Monolith sells black market secret items, weapons, and armor.
  - Fantom buys rare and secret items for money.
  - Meudaz sells safe zone food and medicine.
  - Maverick sells safe zone armor and swords.
  - Razon buys common items for money.
- Zombie/husk randomization orchestration if script control is needed.

## Does Not Own

- Entity models, textures, or visual definitions.
- Splint item definition or icon.
- Future gear item definitions.
