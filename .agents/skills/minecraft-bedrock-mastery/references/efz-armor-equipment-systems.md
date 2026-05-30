# EFZ Armor & Equipment Systems Reference

Use this reference when designing or implementing EFZ armor, helmets, vests, boots, gas masks, hazmat gear, backpacks, equip-slot checks, armor textures/models, protection tuning, armor durability/condition, movement penalties, radiation protection, bleeding resistance, or equipment validators.

EFZ goal: armor should increase survival options without removing fear of death. Equipment should create tactical choices, scarcity, and preparation requirements while staying stable on Bedrock mobile.

## Official source anchors

Verify current behavior when target Bedrock version changes:

- `minecraft:wearable`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_wearable
- Item component list: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponentlist
- Item definition overview: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_item
- `minecraft:damage_absorption`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_damage_absorption
- `minecraft:durability`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_durability
- `minecraft:repairable`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_repairable
- `minecraft:enchantable`: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_enchantable
- `minecraft:equippable` entity component: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_equippable
- Script `EntityEquippableComponent`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent
- Script `EquipmentSlot`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/equipmentslot

## Bedrock armor reality

Bedrock armor/equipment work can be split into three layers:

### Item/component layer
- `minecraft:wearable` makes an item wearable in a slot.
- Wearable slots include head, chest, legs, feet, body, mainhand, and offhand depending on current docs/version.
- `protection` controls armor value for wearable items.
- `hides_player_location` can hide the wearer from locator maps/bars if the feature is supported in the target version.
- `minecraft:durability`, repairability, damage absorption, and enchantability can add vanilla-like equipment behavior.

### Script logic layer
- Scripts can inspect equipped items through the equippable component when the API is available.
- EFZ can use equipment state for radiation protection, bleeding resistance, armor-class mitigation, movement penalties, admin tests, and validators.
- Script reads can throw if entity/equipment state is invalid; guard carefully.

### Resource-pack visual layer
- RP owns item icons, armor textures, attachables/models, sounds, and translations.
- Armor visual work must be tested on mobile; player overrides and heavy custom wearables are fragile.
- If an item works mechanically but renders invisible/purple, treat it as an RP contract failure, not a script failure.

## EFZ armor philosophy

- Armor should reduce risk, not remove risk.
- Heavy gear should have a tradeoff: rarity, noise, speed penalty, stamina penalty later, or repair burden.
- Gas masks are utility gear first, not combat armor.
- Hazmat/CBRN gear should open radiation routes but should not be best-in-slot PvP armor.
- Armor must not make low-tier weapons completely useless.
- Armor stats must be data-driven so balance can be changed without rewriting combat logic.
- Mobile players must understand equipment effects without reading long text mid-fight.

## Pack ownership

- `EFZ_Arsenal_BP`: armor item JSON, wearable slots, protection/durability/repair components, item ids.
- `EFZ_Arsenal_RP`: item icons, armor textures, attachables/models, sounds, translations.
- `EFZ_Scripts_BP`: runtime armor rules, radiation/gas-mask checks, combat mitigation, bleeding resistance, movement penalties, admin tools, validators.
- `EFZ_Main_RP`: shared UI/sound assets only when reused across multiple systems.

Do not put gameplay rules in RP files. RP is visual/audio. Scripts and item components own behavior.

## Recommended armor tiers

Start simple:

### Civilian clothing
- Common.
- Low or no protection.
- No mobility penalty.
- Good for cosmetic identity and early-game progression.

### Light armor
- Low-medium protection.
- Minimal mobility penalty.
- Common enough for early PvP.
- Should not fully stop rifle damage.

### Military vest/helmet
- Medium-high protection.
- Rare.
- Better bullet mitigation.
- Optional mobility/noise penalty.
- Should still lose to good positioning and repeated shots.

### Heavy armor
- High protection.
- Very rare.
- Noticeable movement/noise/stamina tradeoff if those systems exist.
- Avoid making players unkillable.

### Gas mask / CBRN gear
- Radiation-focused.
- Gas mask can use helmet slot when intentionally based on turtle helmet or custom head wearable.
- CBRN suit may use body/chest/legs/feet depending on available assets and target slot support.
- Combat protection should be low unless intentionally balanced as rare endgame gear.

## Armor data model

Prefer a future data table:

```js
export const ARMOR_ITEMS = {
  "efz:military_helmet": {
    displayName: "Military Helmet",
    slot: "head",
    armorClass: "military",
    bulletReduction: 0.18,
    meleeReduction: 0.10,
    bleedChanceMultiplier: 0.8,
    radiationMultiplier: 1.0,
    movementMultiplier: 1.0,
    durabilityMode: "vanilla"
  },
  "minecraft:turtle_helmet": {
    displayName: "Gas Mask",
    slot: "head",
    armorClass: "utility",
    bulletReduction: 0.0,
    meleeReduction: 0.0,
    bleedChanceMultiplier: 1.0,
    radiationMultiplier: 0.2,
    movementMultiplier: 1.0,
    durabilityMode: "none"
  }
};
```

Rules:
- Keep item ids exact and namespace-qualified.
- Use reduction multipliers carefully; many small reductions stack into huge survivability.
- Keep radiation protection separate from combat armor protection.
- Validate every armor id against item files before release.

## Equipment slot design

Core slots:
- head: helmets, gas masks, face protection,
- chest: vests, chest armor,
- legs: pants/leg armor,
- feet: boots,
- offhand: utility equipment only if it does not conflict with weapon/combat plans,
- body: only if supported and tested in the target version.

Rules:
- Do not overload one slot with too many must-have systems.
- Gas mask in head slot means helmets and gas masks compete, which is good survival tension.
- If backpacks are added, decide early whether they are armor-slot, offhand, inventory item, or purely scripted state.

## Script equipment access rules

When reading equipment:
- get the equippable component from the player,
- read only the slots needed for the system,
- guard missing component/items,
- avoid per-tick scans unless absolutely necessary,
- cache only short-lived derived state unless persistence is required.

Recommended cadence:
- radiation/gas-mask check can run on the radiation interval,
- combat mitigation checks should run only when damage occurs,
- HUD updates should use the single HUD owner,
- admin/stat views can read on demand.

Avoid:
- scanning every equipment slot every tick for every player,
- assuming all players have equippable component available during join/death transitions,
- storing stale armor state after the item was removed,
- using try/catch around imports.

## Combat mitigation model

When custom weapons are added, armor should be applied in script after base damage is calculated:

1. Identify weapon damage type.
2. Read victim equipment relevant to damage type.
3. Apply armor reduction by slot/category.
4. Apply armor condition/durability if supported.
5. Apply bleeding chance after armor reduction.
6. Apply final damage.

Suggested first pass:
- helmet reduces headshot damage only if hit-location support is reliable,
- vest reduces torso/general bullet damage,
- boots/legs are mostly cosmetic or minor movement/bleed modifiers until limb hit logic exists,
- gas mask does not reduce bullet damage.

If reliable hit location is not available, do not fake complex limb armor. Use simple total armor class or vest/helmet presence rules.

## Radiation gear rules

Current EFZ gas-mask concept:
- helmet slot item,
- `minecraft:turtle_helmet` can be used as the gas-mask id until custom assets are added,
- 80% radiation protection means exposure accrues at 20% rate,
- protection should be checked by radiation system, not by combat system.

Future optional CBRN expansion:
- full CBRN set can improve radiation protection or reduce filter drain,
- do not make CBRN both strongest radiation gear and strongest PvP armor unless it is intentionally very rare,
- keep zone warnings and HUD clear when protection changes.

## Durability and condition

Durability options:

### Vanilla durability
- Good for normal armor items if components support the target design.
- Easier to understand.
- Less custom persistence work.

### Scripted condition
- Useful for military armor, plates, filters, or repair kits.
- Needs dynamic properties, scoreboards, lore, item variants, or controlled item replacement.
- More flexible, but easier to break or duplicate if not tested.

Recommended EFZ path:
- Start with vanilla durability or no custom condition.
- Add scripted condition only after weapons and corpse-loot handling are stable.
- Never add complex condition to many armor pieces at once.

## Backpacks and inventory expansion

Backpacks are high-risk in Bedrock because true inventory expansion is not simple through scripts.

Safer options:
- backpack as rare container item that opens a scripted storage menu,
- backpack as cosmetic/progression item with no extra storage,
- backpack as scoreboard/dynamic-property storage only if persistence is fully validated.

Avoid claiming a backpack gives native extra inventory unless the implementation is proven in-game.

## Movement/noise tradeoffs

Hardcore tradeoffs can make armor more realistic:
- heavy vest reduces speed slightly,
- heavy boots increase footstep/noise event chance later,
- gas mask can slightly reduce visibility/comfort only if UI supports it cleanly,
- CBRN suit can reduce stamina or speed later.

Rules:
- Do not stack too many penalties; players will stop using gear.
- Make penalties predictable and documented in the item description/menu.
- Keep mobile usability first.

## Visual and RP rules

Armor visuals must be conservative:
- item icon must exist,
- texture path must match RP definition,
- attachable/model geometry must exist if used,
- animations should not replace player controllers unless necessary,
- test Steve/Alex/slim/default models if player visuals are touched,
- test first-person and third-person if custom weapons and armor overlap.

Purple/invisible armor means:
- missing texture,
- bad texture short name,
- bad geometry identifier,
- invalid attachable/client item reference,
- pack not loaded or cached incorrectly,
- or unsupported player override path.

## HUD and menu rules

Armor should not clutter the actionbar.

Recommended:
- combat HUD remains minimal,
- armor details live in `!efz` Statistics or future Equipment menu,
- radiation HUD only shows radiation status/stage, not every armor value,
- show short title/chat messages only when protection-critical gear changes if needed.

Avoid:
- live armor percentages for enemies,
- hit confirmation from armor damage,
- constant armor durability spam.

## Admin and QA tools

When armor is added, admin tools should include:
- give gas mask,
- give armor tier,
- clear armor/equipment test state,
- inspect equipped item ids,
- simulate radiation with/without gear,
- simulate weapon damage against armor once weapons exist.

## Armor validator ideas

Validate:
- every armor item id exists in Arsenal BP item files,
- every configured slot is valid,
- every model/icon/texture file exists when referenced,
- radiation gear ids match radiation config,
- gas mask item id matches the radiation script constant,
- armor reductions are between 0 and a safe maximum,
- movement multipliers are sane,
- no item is configured as both best radiation and best combat gear unless explicitly allowed,
- all pack icons/manifests still validate after adding assets.

## Armor QA checklist

Before shipping armor/equipment:
- Item imports correctly.
- Item icon is not purple/missing.
- Item equips to intended slot.
- Item cannot stack when worn if it should be armor.
- Protection works or intentionally does not work.
- Radiation gear changes exposure rate correctly.
- Death/corpse loot captures equipped armor.
- Safe zone rules are unaffected.
- Armor does not reveal PvP intel.
- Mobile performance remains stable.
- Player model is not invisible.
- Existing skins/animations still work.

## Bad idea warning signs

Warn or redesign if:
- armor requires fragile player client overrides,
- custom visuals make player skins invisible,
- armor turns all PvP into long bullet-sponge fights,
- gear effects require every-tick full inventory scans,
- scripted durability can duplicate items,
- backpack storage can be lost on restart,
- penalties make gear annoying instead of tactical,
- the implementation depends on untested preview-only behavior.

## Release rule

An armor/equipment feature is not ready until item ids, slots, visuals, radiation/combat effects, death/corpse behavior, mobile rendering, and validators all pass targeted in-game QA.
