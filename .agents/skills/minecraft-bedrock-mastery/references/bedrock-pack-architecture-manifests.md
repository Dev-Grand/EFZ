# Bedrock Pack Architecture, Manifests & Release Packaging Reference

Use this reference when changing EFZ pack structure, `manifest.json`, UUID dependencies, script module versions, pack icons, `.mcpack` exports, pack load order, or release packaging.

EFZ goal: multiple packs that import cleanly on mobile, resolve dependencies correctly, avoid stale-cache confusion, and keep Scripts/Entities/Arsenal/Main responsibilities separated.

## Official source anchors

Verify details when target Bedrock version changes:

- Manifest overview / Add-Ons manifest: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest
- Pack manifest document: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/manifestreference/packmanifestdocument
- Manifest dependency docs: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/manifestreference/dependency
- Manifest module docs: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/manifestreference/module
- Manifest header docs: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/manifestreference/header
- Script module versioning: https://learn.microsoft.com/en-us/minecraft/creator/documents/scriptversioning
- Introduction to Behavior Packs: https://learn.microsoft.com/en-us/minecraft/creator/documents/behaviorpack
- Introduction to Resource Packs: https://learn.microsoft.com/minecraft/creator/documents/resourcepack
- Introduction to Scripting: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/introduction
- Resource pack dependency validation: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/mctoolsvalreference/rpdepends

## EFZ pack ownership model

Keep responsibilities clear:

- `EFZ_Scripts_BP`: script gameplay systems only: menus, stats, graves, radiation, safe-zone PvP, NPC trade logic. Owns `@minecraft/server` and `@minecraft/server-ui` dependencies.
- `EFZ_Entities_BP`: custom entity behavior definitions: NPCs, dead bodies, future custom mobs. Owns BP identifiers/properties/components.
- `EFZ_Entities_RP`: custom entity visuals: client entities, render controllers, geometry, textures, NPC/corpse/zombie/husk visuals.
- `EFZ_Arsenal_BP`: item behavior definitions for medicine, weapons, armor, ammo, future combat items.
- `EFZ_Arsenal_RP`: item icons, attachables, models, textures, sounds for arsenal content.
- `EFZ_Main_RP`: global/base resource overrides, sounds, UI assets, vanilla texture/audio replacements.

Do not place content in the wrong pack just because it “works.” Wrong ownership causes packaging, dependency, and merge problems later.

## Manifest mental model

Every pack needs a `manifest.json` with:

- `format_version`: manifest schema version.
- `header`: pack identity shown in Minecraft UI, including name, description, UUID, version, and often `min_engine_version`.
- `modules`: what the pack contains (`data`, `resources`, `script`, etc.). Every module UUID must be unique and different from the header UUID.
- `dependencies`: other packs or script modules needed before this pack can work.
- optional `capabilities` / `metadata` only when truly needed.

A manifest can be valid JSON but still broken if UUIDs, versions, module types, or dependencies are wrong.

## UUID rules

- Header UUID uniquely identifies the pack.
- Module UUID uniquely identifies the module and must not equal the header UUID.
- Do not reuse UUIDs across different packs or modules.
- Do not regenerate UUIDs casually after a pack is already used in worlds; changing the header UUID makes Minecraft treat it as a new pack.
- If creating a replacement test pack, intentionally changing UUIDs can help avoid cache conflicts, but do not do that for production packs without a migration reason.

## Version rules

- Header and module versions identify pack content version.
- Companion BP/RP dependencies should reference the exact target pack UUID and expected version.
- When changing pack content for mobile testing, bump pack versions when stale cache/import confusion is likely.
- Keep version arrays consistent unless intentionally moving to manifest v3/semver string format.
- Script API module versions are not the same as Minecraft game versions; check script module versioning docs.
- Prefer stable script module tracks unless a feature absolutely needs beta APIs.

## Dependency rules

Pack dependencies can reference:

1. Other packs by `uuid` + `version`.
2. Native script modules by `module_name` + semver string, such as `@minecraft/server`.

Rules:
- If a script imports `@minecraft/server-ui`, `EFZ_Scripts_BP/manifest.json` must include `@minecraft/server-ui` dependency.
- If a BP depends on RP visuals, use a UUID dependency on the companion RP.
- If an RP depends on another shared RP, declare it only when load order is necessary.
- Do not add dependencies “just in case”; unnecessary dependencies increase import/activation friction.
- If Minecraft says a dependency is missing, compare the dependency UUID/version against the dependency pack header UUID/version exactly.

## Module rules

- Behavior packs normally include `data` modules.
- Resource packs include `resources` modules.
- Script packs include a `script` module with `language: "javascript"` and `entry` path.
- Script entry paths are relative to the pack root and must match file casing exactly.
- Module UUIDs should be stable for production packs.
- One script entrypoint should register systems through small modules rather than scattering multiple entrypoints.

## EFZ dependency graph policy

Preferred simple graph:

- `EFZ_Scripts_BP` may depend on:
  - `@minecraft/server`,
  - `@minecraft/server-ui` if menus/forms are used,
  - `EFZ_Entities_BP` if it spawns/interacts with custom entities,
  - `EFZ_Arsenal_BP` if it gives/checks custom items.
- `EFZ_Entities_BP` should depend on `EFZ_Entities_RP` when custom entity visuals are required.
- `EFZ_Arsenal_BP` should depend on `EFZ_Arsenal_RP` when custom item visuals are required.
- `EFZ_Main_RP` should stay a global resource pack and avoid becoming a hidden dependency unless truly required.

Keep the graph shallow. Deep dependency chains make mobile import and GitHub conflict debugging harder.

## Pack icon rules

- Use `pack_icon.png` at pack root.
- Prefer 256x256 PNG for compatibility and clean display.
- BP/RP pairs may share the same icon when they are one feature group.
- Pack icons are visual identity only; they should not require manifest changes.
- Validate icon dimensions and PNG header after generating icons.

## Pack naming rules

- Pack names should be clear in the Minecraft UI:
  - `EFZ Scripts BP`,
  - `EFZ Entities BP`,
  - `EFZ Entities RP`,
  - `EFZ Arsenal BP`,
  - `EFZ Arsenal RP`,
  - `EFZ Main RP`.
- Descriptions should include role and warnings if needed, not long changelogs.
- Changelogs belong in data files/docs, not manifest descriptions.

## Release packaging rules

For `.mcpack`:

- Zip the contents of the pack folder, not a folder nested one level too deep if the import target expects manifest at zip root.
- The zip root must contain `manifest.json` and `pack_icon.png` if present.
- Rename `.zip` to `.mcpack`.
- Test import on a clean mobile device or after deleting previous cached versions.

Example safe packaging pattern from repo root:

```bash
mkdir -p dist
for pack in EFZ_Scripts_BP EFZ_Entities_BP EFZ_Entities_RP EFZ_Arsenal_BP EFZ_Arsenal_RP EFZ_Main_RP; do
  (cd "$pack" && zip -qr "../dist/${pack}.mcpack" .)
done
```

Do not package with the pack directory itself as the only root folder unless you confirmed Minecraft imports it correctly.

## Mobile import/cache rules

Mobile Bedrock can show stale behavior if old packs remain cached.

Before testing a new release:
- Delete old imported EFZ packs from Storage if possible.
- Reimport new `.mcpack` files.
- Confirm pack versions/names/icons changed as expected.
- Re-activate packs in the world.
- If a resource change does not appear, suspect cache or pack order before rewriting code.

## Merge/conflict rules

- Avoid giant all-in-one PRs. Split high-risk areas:
  - manifest/packaging,
  - script gameplay,
  - RP rendering,
  - icons/assets,
  - docs/skills.
- Do not keep piling changes onto a PR that GitHub says cannot merge.
- If conflicts happen, inspect conflict files/blocks before editing more code.
- Binary assets like icons cannot be resolved line-by-line; prefer replacing them intentionally in a clean branch.

## Manifest validation checklist

For every `manifest.json`:

- JSON parses.
- Header UUID is unique across repo.
- Module UUIDs are unique across repo and not equal to header UUID.
- Module types match pack role.
- Script module has correct `entry` and `language`.
- Dependency UUIDs match real pack header UUIDs.
- Dependency versions match real pack header versions.
- Script module dependencies match actual imports.
- `min_engine_version` matches intended target.
- Pack icon exists if expected.

## Validator expansion ideas

Add or extend validators to check:

- Duplicate UUIDs across all manifests.
- Missing dependency targets.
- Dependency version mismatch.
- Script imports vs manifest module dependencies.
- Script entry file exists.
- Pack root has `manifest.json`.
- Pack icon exists/dimensions are 256x256 when required.
- BP/RP pair dependencies are present where expected.
- Packaging output has manifest at archive root.

## EFZ release QA checklist

Before giving a build to mobile testers:

1. Run JSON parse check.
2. Run JS syntax checks.
3. Run addon integrity validators.
4. Verify all manifests.
5. Verify pack icons/dimensions.
6. Build `.mcpack` files into `dist/`.
7. Import on mobile.
8. Activate packs in intended order.
9. Confirm script boot marker/logs.
10. Smoke test menu, radiation, safe zone, corpse loot, NPC trade, zombie/husk visuals.

## Common failure signatures

- Pack imports but does nothing: wrong module type, missing script module, wrong script entry, pack not activated.
- Script systems all fail: missing `@minecraft/server` dependency, wrong module version, import error.
- Menus fail only: missing `@minecraft/server-ui` dependency or incompatible module version.
- Custom entity is invisible/vanilla: BP/RP dependency missing, RP not active, pack order, or client entity mismatch.
- Minecraft reports missing dependency: UUID or version mismatch.
- New icon/content not showing on mobile: stale pack cache or version not bumped.
- GitHub cannot merge: branch drift/conflicts; stop and resolve conflict files before adding more.

## Release rule

A pack architecture/manifest change is not complete until the pack imports cleanly, dependencies resolve, script systems boot, visuals load, and mobile cache/pack-order behavior is tested or explicitly called out as untested.
