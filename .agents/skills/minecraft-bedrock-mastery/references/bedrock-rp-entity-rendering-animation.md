# Bedrock RP Entity Rendering & Animation Reference

Use this reference when changing EFZ resource-pack entity visuals: zombies, husks, NPCs, dead bodies, future weapons/attachables, armor, gas masks, survivor skins, render controllers, geometry, texture arrays, animations, animation controllers, or Molang render logic.

EFZ goal: strong visual identity and randomization without purple textures, invisible players, missing animations, mobile regressions, or fragile player overrides.

## Official source anchors

Verify details when target Bedrock version changes:

- Animations Overview: https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationsoverview
- Introduction to Animation Controllers: https://learn.microsoft.com/en-us/minecraft/creator/documents/introductiontoanimationcontrollers
- Animation Controllers Reference: https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationcontroller
- Animation document reference: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/animationsreference/examples/animationdefinitions/animation_document
- Animation controller document reference: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/animationsreference/examples/animationdefinitions/animation_controller_document
- Entity Modeling and Animation: https://learn.microsoft.com/en-us/minecraft/creator/documents/entitymodelingandanimation
- Creating New Entity Types / render controller examples: https://learn.microsoft.com/en-us/minecraft/creator/documents/introductiontoaddentity
- Custom animations/controllers tutorial: https://learn.microsoft.com/en-us/minecraft/creator/documents/animationsandcontrollers
- Animation upgrade notes: https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationupgrade

## Core mental model

Client entity rendering is a contract between:

1. `entity/*.entity.json` client entity file:
   - identifier,
   - materials short names,
   - texture short names,
   - geometry short names,
   - animation short names,
   - `scripts/pre_animation`, `scripts/animate`, variables,
   - render controller list.
2. `render_controllers/*.json`:
   - chooses `Geometry.*`, `Material.*`, `Texture.*`, arrays, and Molang expressions.
3. `models/entity/*.geo.json`:
   - defines geometry identifiers and bone names.
4. `animations/*.json` and `animation_controllers/*.json`:
   - define animation identifiers and controller state machines.
5. Actual texture PNG files:
   - paths must match texture short-name values exactly, excluding `.png`.

If any contract link breaks, the symptom may be purple textures, invisible models, T-poses, lost walking/attacking animations, wrong baby geometry, or vanilla fallback.

## EFZ rendering rules

- For vanilla mobs with custom skins (zombie/husk), prefer vanilla geometry and vanilla animation/controller wiring, changing only texture selection through render-controller arrays.
- For custom EFZ entities (NPCs, corpses), custom geometry is acceptable because they are isolated and easier to test.
- Treat `minecraft:player` client overrides as high-risk. Do not force living-player skins without a separate prototype and mobile test pass.
- Random skin selection can be client-side through `pre_animation` variables and render-controller texture arrays, but ranges must match array lengths exactly.
- Do not simplify animation controllers just because the entity still renders; animation loss is a runtime regression.
- Use validators for array/texture/index consistency whenever variants can drift.

## Safe texture randomization pattern

Entity file:

```json
"textures": {
  "zombie": "textures/entity/efz/zombies/zombie",
  "zombie1": "textures/entity/efz/zombies/zombie1"
},
"scripts": {
  "pre_animation": [
    "v.efz_skin = v.efz_skin_initialized ? v.efz_skin : math.die_roll_integer(1, 0, 1);",
    "v.efz_skin_initialized = 1;"
  ]
}
```

Render controller:

```json
"arrays": {
  "textures": {
    "Array.efz_zombie_skins": ["Texture.zombie", "Texture.zombie1"]
  }
},
"textures": ["Array.efz_zombie_skins[variable.efz_skin]"]
```

Rules:
- `die_roll_integer(1, 0, N)` must match last array index.
- Every `Texture.name` in the array must exist in the entity `textures` object.
- Every texture object path must have a matching `.png` file.
- Do not use scoreboard/server properties for purely visual client randomization unless persistence or gameplay sync is required.

## Geometry rules

- Geometry short names in client entities map to identifiers in `.geo.json` files.
- Render controllers use `Geometry.shortName`, not raw geometry identifiers.
- Bone names used by animations must exist in the geometry.
- If using vanilla animation controllers, use a compatible skeleton/bone set.
- If custom geometry changes bone names, review every animation/controller that references those bones.
- For baby/adult variants, ensure both geometry aliases exist before using expressions like `query.is_baby ? Geometry.baby : Geometry.default`.

## Animation rules

- Animations are raw transforms; animation controllers are logic/state machines.
- The client entity must include both an `animations` map and `scripts/animate` entries for animations/controllers to play.
- Order matters: later animations can override earlier transforms on the same channels.
- If reusing vanilla mob animations, preserve required variables and `pre_animation` expressions used by those controllers.
- Avoid removing vanilla `look_at_target`, `move`, `attack`, `riding`, `holding`, and swimming controllers unless intentionally changing behavior.
- After changing animations, test idle, walk, attack, damage, death, baby state, water/swimming, riding if relevant, and offscreen/on-screen behavior.

## Material rules

- Material short names in client entities must match render controller `Material.*` references.
- Purple/black/invisible rendering may be a material issue, not only a texture issue.
- Use vanilla materials for vanilla mob replacements when possible (`zombie`, `husk`, `entity_alphatest`, etc.).
- Use alpha/blend materials only when texture transparency actually requires it; blending can be more expensive and can render oddly on mobile.

## RP file placement checklist

- Client entities: `EFZ_Entities_RP/entity/*.entity.json`.
- Render controllers: `EFZ_Entities_RP/render_controllers/*.json`.
- Geometry: `EFZ_Entities_RP/models/entity/*.geo.json`.
- Textures: `EFZ_Entities_RP/textures/entity/efz/...`.
- Animations: `EFZ_Entities_RP/animations/*.json` if custom.
- Animation controllers: `EFZ_Entities_RP/animation_controllers/*.json` if custom.
- Localization: `EFZ_Entities_RP/texts/en_US.lang` for names where needed.

## Common failure signatures

### Purple texture
Likely causes:
- missing `.png`,
- wrong path in entity texture short name,
- render controller references a non-existent `Texture.*`,
- pack not active or wrong pack order,
- PNG format/size issue,
- stale cached RP on mobile.

### Invisible entity/player
Likely causes:
- render controller points to missing geometry/material/texture,
- geometry alias missing in client entity,
- alpha/blend material mismatch,
- client player override incomplete,
- wrong part visibility,
- model scale/part visibility all false.

### Lost animations / T-pose / stiff mob
Likely causes:
- `scripts/animate` removed or too minimal,
- animation short names missing,
- animation controllers not included,
- geometry bone names incompatible,
- required Molang variables missing,
- reusing custom geometry with vanilla animations that need different bones.

### Vanilla fallback skin
Likely causes:
- resource pack not active or overridden by another RP,
- client entity identifier mismatch,
- client entity file not loaded due to JSON issue,
- render controller failure causing fallback behavior.

### Works on PC but fails on mobile
Likely causes:
- stale mobile pack cache,
- high texture resolution/memory pressure,
- alpha/blend or complex materials,
- too many high-res variants,
- pack order differences,
- device-specific render limitations.

## EFZ zombie/husk best-practice policy

For current EFZ zombies/husks:

- Keep identifier as `minecraft:zombie` / `minecraft:husk` if replacing vanilla mobs visually.
- Keep vanilla-compatible geometry/animation/controller wiring.
- Add EFZ texture arrays and random `v.efz_skin` selection only.
- Validate with `node tools/validateZombieSkinSelector.mjs` after texture or array changes.
- Test in game with multiple spawned zombies/husks, including movement and attacks.

Do not add custom zombie/husk models until the random texture replacement is stable on mobile.

## EFZ player/survivor skin policy

- Do not override living `minecraft:player` rendering unless explicitly requested as a dedicated experiment.
- If survivor skins are needed, use them safely for dead bodies, NPC-like entities, or future custom humanoids first.
- Player account skin override is fragile because player rendering has special first-person, third-person, map, attachable, cape, armor, and animation requirements.
- Any future player override must test: first-person hands, third-person body, armor, held items, map, cape, emotes/animations, death, swimming, sneaking, and mobile.

## EFZ NPC/dead-body policy

- NPCs and dead bodies can use custom geometry/textures because they are custom identifiers.
- Keep NPC render controllers simple unless they need state changes.
- Dead-body skin variants should use entity properties/tags only if BP property ranges and RP arrays match.
- Validate dead-body property ranges in addon integrity checks.

## Validator expansion ideas

Add or extend validators to check:

- Every `Texture.*` render-controller reference exists in client entity `textures`.
- Every texture path has a `.png` file.
- Every `Geometry.*` reference exists in client entity `geometry`.
- Every geometry identifier exists in some `.geo.json` file.
- Every animation short name in `scripts/animate` exists in `animations`.
- Every animation/controller identifier exists in resource files when custom.
- Random index ranges match texture array lengths.
- Removed/disabled player client overrides are intentional.

## RP rendering QA checklist

Before calling an RP entity change stable, test in-game:

- Entity spawns and is visible.
- No purple/missing textures.
- Idle animation works.
- Walking/pathing animation works.
- Attack/hurt behavior still animates.
- Baby/adult geometry if applicable.
- Held/equipped items if applicable.
- Armor/attachables if applicable.
- Multiple random variants spawn.
- Entity remains correct after chunk unload/reload.
- Mobile import after deleting old cached pack.

## Safe implementation workflow

1. Identify whether the change is texture-only, render-controller logic, geometry, animation, or player override.
2. For texture-only changes, update textures → entity short names → render arrays → validator.
3. For geometry changes, verify geometry identifier, bone compatibility, render controller alias, and animation compatibility.
4. For animation changes, verify animation short names, controller identifiers, `scripts/animate`, variables, and Molang conditions.
5. For player overrides, stop and create a dedicated risk plan first.
6. Run JSON parse and specialized validators.
7. Do in-game visual QA on mobile before shipping.

## Release rule

Do not ship RP rendering changes based only on JSON validity. A render change is complete only after spawned in-game entities are checked for visibility, texture correctness, animation behavior, and mobile pack-cache behavior.
