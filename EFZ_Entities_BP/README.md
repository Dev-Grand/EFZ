# EFZ Entities BP

Behavior definitions for anything that exists as an entity in the world.

## Owns

- Player grave behavior entity.
- Dead body behavior entity with synced survivor skin variants.
- 5 NPC vendor behavior entities:
  - Monolith: black market secret items, weapons, armor.
  - Meudaz: safe zone food and medicine.
  - Maverick: safe zone armor and swords.
  - Fantom: black market buyer for rare and secret items.
  - Razon: safe zone buyer for common sellable items.
- Zombie and husk variant entity definitions.
- Spawn rules for custom zombie/husk variants.
- Current texture pool:
  - 151 zombie skins.
  - 25 husk skins.

## Does Not Own

- Splint or gear item definitions. Those belong in `EFZ_Arsenal`.
- Fall damage, infection, economy, stats, inventory saving, timers, and trading logic. Those belong in `EFZ_Scripts`.

## Dead Body Skin Variants

`efz:dead_body` has a synced integer property named `efz:skin_type`.

- `0`: `type_0`
- `1`: `type_1`
- `2`: `type_2`
- `3`: `type_3`
- `4`: `type_4`
- `5`: `type_5`
- `6`: `type_6`

`EFZ_Scripts` will set this property when spawning a body so it matches the dead player's assigned survivor type.

## NPC Roles

- `efz:monolith`: black market seller.
- `efz:fantom`: black market buyer.
- `efz:meudaz`: safe zone seller for food and medicine.
- `efz:maverick`: safe zone seller for armor and swords.
- `efz:razon`: safe zone buyer for common items.
