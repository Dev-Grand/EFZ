# EFZ Weapons & Combat Systems Reference

Use this reference when designing or implementing EFZ custom guns, melee weapons, ammo, magazines, reloads, recoil, spread, sounds, hit detection, projectile behavior, weapon UI/HUD, armor interactions, bleeding, attachments, or combat balance.

EFZ goal: hardcore DayZ-style combat on Minecraft Bedrock mobile. Weapons should feel dangerous, scarce, tactical, and performant without giving unfair information or relying on fragile unsupported APIs.

## Official source anchors

Verify current behavior when target Bedrock version changes:

- Item definition overview: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_item
- Item components list: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponentlist
- `minecraft:cooldown`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_cooldown
- `minecraft:shooter`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_shooter
- `minecraft:projectile` item component: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_projectile
- Creating Custom Projectiles: https://learn.microsoft.com/en-us/minecraft/creator/documents/custom_projectiles
- `minecraft:weapon` note/deprecation guidance: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_weapon
- Item custom components: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcustomcomponent
- Item component registry: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcomponentregistry

## Bedrock weapon reality

Bedrock supports several approaches, each with tradeoffs:

### Native-ish item/projectile components
- Uses item components like shooter/projectile/cooldown/use modifiers.
- Better when vanilla-like projectile behavior is acceptable.
- Custom projectile docs may require experimental toggles depending on feature/version.
- Projectile entities can cost performance if spammed by automatic weapons.

### Scripted hitscan/combat logic
- Script controls shot timing, ammo, recoil/spread, ray/hit logic if suitable API is available.
- Better for firearms feel, ammo/magazine logic, recoil, and anti-abuse.
- Must be event-driven; do not raycast every tick for every player.
- Requires careful mobile and multiplayer testing.

### Hybrid approach
- Item JSON handles visuals/use/cooldowns.
- Script handles ammo, reload, sounds, damage, and special effects.
- Often best for EFZ because it keeps gameplay logic tunable and data-driven.

## EFZ weapon philosophy

- Guns should be powerful but not easy mode.
- Ammo should matter.
- Reload timing should create vulnerability.
- Recoil/spread should reward controlled fire.
- Full-auto must be performance-capped and balance-capped.
- No live kill confirmation in HUD.
- Bleeding should tie to weapon/damage type later.
- Mobile controls must be respected; avoid PC-only precision requirements.

## Arsenal pack ownership

- `EFZ_Arsenal_BP`: item definitions, ammo items, magazines, weapon behavior metadata, custom components.
- `EFZ_Arsenal_RP`: item icons, 3D models, attachables, sounds, animations, translations.
- `EFZ_Scripts_BP`: runtime combat logic, ammo state, reload state, recoil/spread, damage application, admin test tools.
- `EFZ_Main_RP`: shared/global sounds or UI assets only if truly global.

Do not bury weapon logic in RP files. RP is visual/audio; Scripts BP owns gameplay state.

## Weapon data model

Prefer a data-driven weapon table later, for example:

```js
export const WEAPONS = {
  "efz:akm": {
    displayName: "AKM",
    category: "rifle",
    ammoItemId: "efz:762x39_ammo",
    magazineSize: 30,
    damage: 9,
    headshotMultiplier: 2.0,
    fireRateRpm: 600,
    reloadTicks: 55,
    spreadHip: 5.0,
    spreadAim: 1.4,
    recoilVertical: 1.0,
    recoilHorizontal: 0.45,
    rangeBlocks: 90,
    soundFire: "efz.akm.fire",
    soundReload: "efz.akm.reload",
    bleedChance: 0.35
  }
};
```

Rules:
- Keep weapon stats in data, not scattered through logic.
- Validate data types/ranges.
- Keep item ids namespaced.
- Separate weapon item id from ammo item id.
- Use categories for balance: pistol, SMG, rifle, sniper, shotgun, melee.

## Ammo and reload design

Options:

### Simple ammo pool
- Weapon consumes ammo item directly from inventory.
- Easier for v1.
- Less realistic but stable.

### Magazine system
- Weapon uses magazine items with stored count.
- More realistic, more complex.
- Needs dynamic properties/lore/tags or separate item variants; Bedrock item stack state can be limiting.

### Recommended EFZ path
Start with simple ammo pool or simple magazine count stored per player+weapon, then expand after mobile testing.

Rules:
- Reload should take time.
- Cannot shoot while reloading.
- Reload should re-check ammo at completion.
- Switching weapons during reload should cancel or complete consistently.
- Ammo should never duplicate on cancel/relog/death.
- Death/corpse logic must capture weapon and ammo state if custom state exists.

## Firing logic rules

- Trigger shot only from item use/interaction events or custom component events.
- Enforce fire rate server-side.
- Enforce ammo count server-side.
- Enforce reload state server-side.
- Apply spread/recoil server-side enough to prevent abuse.
- Do not trust client timing or UI state.
- Do not run hit checks every tick if the player is not shooting.

## Hit detection design

Potential approaches:

### Projectile entities
Pros:
- Natural travel time/physics.
- Easier to visualize.
- Works with projectile components.

Cons:
- Performance risk for many bullets.
- Harder to tune hitscan firearm feel.
- More entity cleanup concerns.

### Hitscan/raycast-like script
Pros:
- Good firearm feel.
- No projectile entity spam.
- Easier immediate damage logic.

Cons:
- API support and edge cases must be verified.
- Needs careful line-of-sight, range, target filtering, and anti-cheat thinking.

### Recommended EFZ stance
Use event-driven hitscan-like logic if stable in the target Script API; otherwise use controlled projectile entities for slower weapons and avoid high fire-rate projectile spam.

## Damage model

Start simple and tune:

- Pistols: low-medium damage, low recoil, common ammo.
- SMGs: lower damage, high fire rate, weaker at range.
- Rifles: high damage, medium/high recoil, medium ammo scarcity.
- Snipers: very high damage, slow fire/reload, rare ammo.
- Shotguns: high close damage, steep falloff, slow reload.
- Melee: silent, stamina/risk based if stamina exists later.

Rules:
- Headshots can exist but need reliable hit location support; if not reliable, avoid fake precision.
- Armor should reduce damage, not make players immortal.
- Range/falloff prevents all weapons from being snipers.
- Bleeding chance should depend on weapon category and armor.

## Recoil/spread model

Bedrock mobile-friendly recoil should be readable:

- Hip fire: wider spread.
- Aiming/sneaking: narrower spread.
- Moving: increased spread.
- Sustained fire: increased spread/recoil.
- Short bursts: more accurate.

Implementation can be statistical spread rather than visual camera recoil if camera control is limited.

Rules:
- Do not make recoil so strong mobile players cannot compete.
- Do not make full-auto laser accurate.
- Keep recoil/spread numbers data-driven.

## Sounds and visual feedback

Weapon feel depends heavily on audio.

Needed per weapon type:
- fire sound,
- reload sound,
- dry fire/click,
- equip/switch optional,
- suppressed fire optional,
- distant shot optional later.

Rules:
- Throttle sound spam for automatic weapons.
- Avoid global sound unless intended.
- Use local/nearby audible range if possible.
- Muzzle particles should be short and capped.
- Hit markers should be avoided if they confirm kills unfairly; a generic hit sound may still reveal too much in hardcore PvP.

## UI/HUD for weapons

Avoid clutter.

Possible UI:
- actionbar can show ammo only while holding a weapon or after firing/reloading.
- Example: `$1200 | 24/90` or `$1200 | RELOADING`.
- Do not permanently show combat stats.
- Do not show kill confirmation.
- Reload/dry-fire feedback should be short and clear.

Rules:
- One HUD owner must compose money/status/ammo.
- Weapon HUD should not overwrite radiation/infection/broken-leg status.
- If too crowded, show ammo only briefly after weapon actions.

## Armor interaction

When armor is added:
- armor can reduce damage by category,
- helmets can reduce headshot damage,
- heavy armor can increase noise/slow movement if desired,
- gas mask remains radiation-focused,
- armor durability/custom state can be scripted later if reliable.

Avoid:
- armor that makes low-tier weapons useless,
- armor that removes fear of death,
- complex durability if it cannot persist safely.

## Bleeding integration

Bleeding should come with weapons/combat, not before.

Suggested model:
- bullets: medium bleed chance,
- shotguns: high close-range bleed chance,
- knives/blades: high bleed chance,
- blunt damage: low bleed chance,
- armor reduces bleed chance,
- bandage stops bleeding,
- HUD status: `BLEEDING`.

Rules:
- Bleeding should be survivable if treated.
- Bleeding should pressure decisions without becoming random instant death.
- No attacker identity or kill confirmation through bleed UI.

## Anti-abuse and multiplayer rules

- Server-side fire-rate enforcement.
- Server-side ammo enforcement.
- Server-side reload enforcement.
- Ignore firing while in safe zone if needed by design.
- Respect safe-zone PvP protection for attacker and victim.
- Prevent shooting out of safe zone or into safe zone.
- Clean state on death, leave, reload, and item loss.
- Do not allow negative ammo or duplicate ammo on reload cancel.

## Mobile controls and fairness

- Avoid requiring extremely precise headshots for basic survival.
- Prefer weapons with meaningful body-shot balance.
- Keep recoil manageable on touch.
- Keep reload/use interactions simple.
- Avoid too many weapon modes/buttons.
- Use clear sounds/messages for reload/dry fire because mobile UI is limited.

## Weapon implementation phases

### Phase 1: One pilot weapon
- One rifle or pistol.
- One ammo item.
- Basic fire rate.
- Basic damage.
- Basic reload.
- Basic sound.
- Admin give/test command.
- Mobile test.

### Phase 2: Weapon framework
- Data table.
- Shared helpers.
- Ammo/reload state.
- HUD integration.
- Safe-zone integration.
- Validator for weapon stats and item ids.

### Phase 3: Categories
- Pistols, rifles, SMGs, shotguns, snipers.
- Category recoil/spread/range/falloff.
- More sounds/icons/models.

### Phase 4: Armor and bleeding
- Armor mitigation.
- Bleeding status.
- Bandages.
- Weapon-category bleed chances.

### Phase 5: Polish
- Attachments.
- Suppressors.
- Distant sounds.
- Weapon condition/durability if reliable.

## Weapon validator ideas

Validate:
- every weapon item id exists in Arsenal BP item files,
- every ammo item id exists,
- magazine size is positive integer,
- damage is positive number,
- fire rate within sane bounds,
- reload ticks positive,
- spread/recoil non-negative,
- sound ids exist in RP sound definitions when used,
- icon/model files exist,
- no duplicate weapon ids,
- safe-zone integration uses shared protection helper.

## Combat QA checklist

Before shipping a weapon:

- Can obtain weapon/ammo via admin or loot.
- Cannot shoot without ammo.
- Cannot exceed fire rate.
- Reload consumes ammo correctly.
- Reload cannot duplicate ammo by canceling/switching/dying.
- Damage applies to mobs and players as intended.
- Safe zone blocks damage both directions.
- Corpse/death stores weapon/ammo correctly.
- HUD does not reveal kills.
- Sounds play but do not spam globally.
- Mobile controls feel usable.
- Multiple players firing does not lag badly.

## Bad idea warning signs

Warn or redesign if:
- weapon requires experimental features the project does not want enabled,
- automatic weapons spawn too many projectile entities,
- UI gives hit/kill confirmation at long range,
- ammo state can duplicate or disappear,
- recoil is impossible on mobile,
- armor makes players too tanky,
- script checks run every tick for every player unnecessarily,
- implementation depends on untested player camera control.

## Release rule

A weapon/combat feature is not ready until it has data validation, server-side ammo/fire-rate enforcement, safe-zone compatibility, death/corpse compatibility, mobile test notes, and no unfair PvP intel leaks.
