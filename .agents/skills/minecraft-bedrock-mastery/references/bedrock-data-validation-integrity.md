# Bedrock Data-Driven Validation & Integrity Reference

Use this reference when adding, editing, or validating EFZ data files, validators, generated lists, pack contracts, loot/trade tables, zone definitions, manifests, render arrays, item/entity identifiers, or release QA checks.

EFZ goal: make content expansion safe. Data should be easy to tune, while validators catch broken references before mobile testing.

## What validation can and cannot prove

Validators can prove:
- files parse,
- required fields exist,
- numeric ranges are sane,
- referenced ids/files exist,
- BP/RP/script contracts are internally consistent,
- generated lists match source assets,
- manifest dependencies line up.

Validators cannot prove:
- Minecraft runtime API compatibility,
- mobile performance,
- fun balance,
- form UI behavior,
- animation correctness in-game,
- pack cache/import behavior,
- projectile/combat feel.

Always pair static validation with targeted in-game QA for gameplay/rendering changes.

## EFZ data ownership model

Keep tunable gameplay data out of system logic when possible:

- `scripts/data/constants.js`: stable ids, objective names, high-level config constants.
- `scripts/data/trades.js`: NPC trade tables and economy data.
- `scripts/data/radiationZones.js`: radiation zone boxes.
- `scripts/data/safeZones.js`: safe-zone boxes.
- `scripts/data/patchNotes.js`: player-facing changelog entries.
- `scripts/data/links.js`: public link panel values.
- `scripts/data/zombieVariants.generated.json`: generated/random visual variant list.

Rules:
- Systems consume data; data files should not import systems.
- Constants should avoid gameplay tables that change often.
- Generated files should say or imply how they are regenerated/validated.
- Every data file that can drift should have a validator.

## Validator design principles

1. Fail fast with a clear error message.
2. Prefer exact contract checks over vague warnings.
3. Validate cross-pack links, not only local schema.
4. Keep validators deterministic and runnable from repo root.
5. Do not require Minecraft to run validators.
6. Avoid network access in validators.
7. Use stable Node/Python standard library where possible.
8. Print one success line when validation passes.
9. Include the bad path/id/key in failure messages.
10. Add validators at the same time as data-driven features.

## Standard validation layers

### Layer 1: Syntax
- JSON parse all `.json` files.
- `node --check` all `.js` and `.mjs` files.

### Layer 2: Local schema
- Required fields exist.
- Field types are correct.
- Amounts/prices/rewards are non-negative/positive as appropriate.
- Zone min/max coordinates are finite and ordered.
- Patch notes and links are non-empty.

### Layer 3: Cross-file contract
- Trade NPC ids exist in BP entity files.
- Render-controller texture arrays reference existing texture short names.
- Texture short names point to existing PNG files.
- Dead-body BP property ranges match RP/render/script assumptions.
- Script imports match manifest module dependencies.
- Manifest dependency UUIDs match real pack UUIDs.

### Layer 4: Release/package checks
- Pack icons exist and are correct size.
- Manifests have unique UUIDs.
- Script entry file exists.
- `.mcpack` archives contain `manifest.json` at archive root.

### Layer 5: In-game QA
- Menus open.
- Mobs render/animate.
- Zones trigger.
- Trades execute.
- Corpses store/return loot.
- Mobile import/load works.

## Current EFZ validator map

- `tools/validateZombieSkinSelector.mjs`:
  - texture files vs client entity texture names,
  - render arrays vs entity textures,
  - generated variant list vs entity textures,
  - random index range vs array length.
- `tools/validateAddonIntegrity.mjs`:
  - NPC trade table ids vs BP entity identifiers,
  - trade entry shapes,
  - dead-body property range,
  - script manifest UI dependency,
  - radiation/safe-zone box shapes/counts,
  - patch notes/links data.

When adding a new data-driven feature, either extend one of these or add a focused validator.

## Schema checklist examples

### Trades
Validate:
- trade table is object keyed by NPC entity id,
- every NPC id exists in `EFZ_Entities_BP/entities/*.json`,
- entries are arrays,
- `itemId` is namespaced (`namespace:item`),
- `amount` is positive integer,
- `price`/`reward` is integer `>= 0`,
- optional category/stock/restock fields have valid types when added.

Future checks:
- item ids exist in known vanilla/custom item registries where possible,
- seller/buyer tables do not duplicate impossible roles,
- prices are within configured economy bounds.

### Zones
Validate:
- `id` is unique,
- `dimensionId` is namespaced,
- `min` and `max` exist,
- x/y/z are finite numbers,
- min <= max per axis,
- expected zone count if project design requires it,
- optional warning if safe zones overlap radiation zones.

Do not over-enforce final coordinates before release if user plans to tune them later.

### Patch notes / links
Validate:
- non-empty arrays,
- string version/title/labels,
- patch note items are non-empty strings,
- link values are non-empty,
- placeholder `Soon.` is allowed only while the user intentionally wants it.

### Scoreboard/objective contracts
Validate or inspect:
- objective ids in constants are unique,
- systems reference objective ids from constants, not duplicated strings,
- menu stats labels point to real objective ids,
- README documented objective ids match constants.

### Manifests
Validate:
- unique header/module UUIDs,
- dependencies point to real pack header UUIDs,
- script modules have existing entry file,
- imported native modules (`@minecraft/server-ui`) are declared.

### RP rendering
Validate:
- every `Texture.*` reference in render controllers exists in client entity texture map,
- every client entity texture path has a PNG,
- every `Geometry.*` render-controller reference exists in client entity geometry map,
- random `die_roll_integer` max equals array length - 1,
- generated variant lists match actual texture short names.

## Good validator error examples

Good:
- `SELLER_TRADES.efz:monolith[2] has invalid price: expected integer >= 0`
- `RADIATION_ZONES.military_1 min.x must be <= max.x`
- `controller.render.efz.zombie references Texture.zombie151 but zombie.entity.json has no texture key zombie151`
- `EFZ_Scripts_BP imports @minecraft/server-ui but manifest dependency is missing`

Bad:
- `Invalid config`
- `Something is wrong`
- `Validation failed`

## Validator implementation pattern

```js
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  // validate...
  console.log('Validation passed.');
}

main();
```

Rules:
- Keep validators independent from Minecraft runtime.
- Import project data modules only if they are pure data and do not import `@minecraft/server`.
- Prefer JSON parsing over regex when checking JSON files.
- Use regex only for source-level checks like detecting imports or Molang snippets.
- Keep file paths relative to repo root.

## Generated data rules

Generated files are allowed when they reduce manual drift.

Rules:
- Generated files should be deterministic.
- Generator output should sort values consistently when order is not meaningful.
- Validator should confirm generated output matches source assets.
- Do not manually edit generated files unless necessary; regenerate instead.
- If no generator exists yet, document how the file is expected to be updated.

## Release validation command block

Use from repo root before packaging or PR finalization:

```bash
python - <<'PY'
import json,glob
for f in glob.glob('**/*.json',recursive=True):
    with open(f,encoding='utf-8') as fh:
        json.load(fh)
print('JSON OK')
PY

node --check EFZ_Scripts_BP/scripts/main.js
for f in EFZ_Scripts_BP/scripts/systems/*.js EFZ_Scripts_BP/scripts/data/*.js tools/*.mjs; do
  node --check "$f"
done

node tools/validateAddonIntegrity.mjs
node tools/validateZombieSkinSelector.mjs
```

If any command fails, fix before asking the user to test in Minecraft.

## When to add a new validator

Add or extend validation when:
- a data file references ids in another pack,
- a user will tune values later,
- assets are added in bulk,
- a system relies on matching BP/RP/script constants,
- a failure would appear as a confusing mobile runtime bug,
- a table will grow over time,
- a generated file is introduced,
- manifests/dependencies change.

## Future EFZ validators to build

High-value next validators:

1. Manifest/pack validator:
   - UUID uniqueness,
   - dependencies resolve,
   - module entry paths exist,
   - pack icons exist and are 256x256.
2. RP contract validator:
   - geometry aliases,
   - texture paths,
   - render-controller references,
   - animation/controller references where custom.
3. Script constants validator:
   - objectives/tags/entities referenced by systems are defined in constants/data.
4. UI icon validator:
   - ActionForm icon paths exist in RP.
5. Loot table validator when loot configs are added.
6. Weapon/armor stat validator when arsenal expands.
7. Performance budget validator:
   - texture dimensions/counts,
   - sound sizes,
   - direct `setActionBar` call count,
   - interval registrations.

## Validation vs design balance

Do not over-constrain data while design is still intentionally flexible. Example:
- It is okay to enforce exactly 4 radiation zones if the user requested exactly 4.
- It is bad to enforce final radiation coordinates if the user said they will tune coordinates later.
- It is okay to warn about safe-zone/radiation overlap.
- It may be bad to fail overlap if the user intentionally wants a dangerous safe-zone edge case.

Choose errors for impossible/broken states. Choose warnings or documentation for design choices.

## In-game QA link

Every validator should map to a runtime test:

- Trade validation → test one buy and one sell per NPC role.
- Zone validation → enter/leave every zone.
- Render validation → spawn entities and watch animations.
- Manifest validation → import packs on mobile.
- Menu data validation → open menu panels.
- Scoreboard validation → check actionbar/stats/admin commands.

## Release rule

A feature is not production-ready until:

1. Syntax checks pass.
2. Relevant validators pass.
3. The user-facing behavior has at least one targeted in-game test.
4. The final response lists exact commands/tests and any untested runtime risks.
