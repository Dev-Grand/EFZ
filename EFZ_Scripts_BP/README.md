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
  - Saves inventory + equipped gear (main/offhand + armor).
  - Spawns EFZ dead body/grave entity.
  - Matches the body skin to the player's assigned survivor type.
  - Makes grave lootable by other players instantly (public hardcore loot).
  - Deletes grave after 15 minutes.
  - Loot interaction uses an in-game menu with item-by-item take and take-all options.
  - Forces `keepinventory true` so vanilla drops do not bypass corpse looting.
- Survivor skin assignment:
  - Randomly assigns each player one persistent survivor type from `type_0` through `type_6`.
  - Stores the assignment in player dynamic properties.
  - Syncs a tag such as `efz_skin_type_3` for command/debug use.
- Economy:
  - Money tracking.
  - Buying and selling.
  - Player-to-player money/item trading.
- Personal HUD (action bar, multiplayer-safe):
  - Money (always).
  - Condition statuses only when active (Infection, Broken Leg, Radiation L1-L3).
- Scoreboard stats:
  - `efz_money`: editable digital money balance.
  - `efz_kills`: player kills.
  - `efz_deaths`: player deaths.
  - Detailed stats stay in the `!efz` Statistics menu; the live action bar only shows money plus active conditions to avoid PvP kill-confirmation leaks.
- NPC trade menus and transactions (configured in `scripts/data/trades.js`).
  - Monolith sells black market secret items, weapons, and armor.
  - Fantom buys rare and secret items for money.
  - Meudaz sells safe zone food and medicine.
  - Maverick sells safe zone armor and swords.
  - Razon buys common items for money.
- Zombie/husk randomization orchestration if script control is needed.
- Safe zone PvP protection:
  - Configurable safe zones in `scripts/data/safeZones.js`.
  - Players inside safe zone cannot damage or be damaged by players inside/outside.
  - Leaving safe zone grants 5 seconds of damage immunity.
- Radiation zones:
  - Configurable box zones in `scripts/data/radiationZones.js`.
  - Gas mask uses `minecraft:turtle_helmet` equipped in helmet slot.
  - Gas mask gives 80% protection (exposure accrues at 20% rate).
  - Radiation stages with gas mask:
    - Level 1 after 900 seconds (15 min).
    - Level 2 after 1200 seconds (20 min).
    - Level 3 after 1500 seconds (25 min).
  - Entry/exit title messages are shown when crossing zone boundary.
  - Action bar shows `RADIATION` immediately while inside a zone, then `RADIATION L1/L2/L3` after exposure reaches a stage.
- Player chat menus:
  - `!efz` opens a 5-button public menu (Information, Payments, Statistics, Patch Notes, EFZ).
  - Information is the main menu button and contains gameplay details, rules, and quick help tips.
  - Patch Notes renders from `scripts/data/patchNotes.js` so latest features can be updated without menu code edits.
  - EFZ links render from `scripts/data/links.js` and currently display Soon.
  - `!efzadmin` opens admin command help for OP users or players tagged `efz_admin`. If OP detection is inconsistent on a host, use `/tag <player> add efz_admin` as the reliable admin setup.
  - Admin economy/stat commands:
    - `!efz add money <amount> <user>`
    - `!efz remove money <amount> <user>`
    - `!efz set money <amount> <user>`
    - `!efz view money <user>`
    - `!efz stats <user>`


## Does Not Own

- Entity models, textures, or visual definitions.
- Splint item definition or icon.
- Future gear item definitions.


## Validation

- `node tools/validateZombieSkinSelector.mjs`
- `node tools/validateAddonIntegrity.mjs`
