# EFZ Arsenal BP

Behavior definitions for EFZ items and gear.

## Owns

- Splint custom item.
- Syringe custom item.
- Future weapons.
- Future armor.
- Future food.
- Future medicines.
- Future vendor goods.

## Does Not Own

- Broken leg healing logic. `EFZ_Scripts` detects Splint use and removes debuffs.
- Vendor menus and economy transactions. Those belong in `EFZ_Scripts`.
- Item textures and icons. Those belong in `EFZ_Arsenal_RP`.

## Splint Rules

- Identifier: `efz:splint`.
- Max stack size: 4.
- Consumable even when the player is not hungry.
- Runs the `efz:splint` custom script component when consumed.
- Must only remove broken-leg effects. It must not remove poison, nausea, infection effects, or unrelated conditions.

## Syringe Rules

- Identifier: `efz:syringe`.
- Max stack size: 4.
- Consumable even when the player is not hungry.
- Runs the `efz:syringe` custom script component when consumed.
- Must only remove the active EFZ infection disease effect. It must not remove broken-leg effects, money/stats, or unrelated conditions.
