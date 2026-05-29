# Minecraft Bedrock Mastery Skill

## Purpose
Use this skill whenever working on Minecraft Bedrock addon code in this repository to reduce errors across behavior packs, resource packs, scripting, manifests, and render/animation pipelines.

## Core Rules
1. Keep BP/RP contracts in sync:
   - If a BP entity identifier changes, update matching RP `entity/*.entity.json` and any script constants using that identifier.
   - If texture short names change in RP entity files, update render controller arrays and references.
2. Never add script-only dependencies to a pack unless a script directly imports and uses them.
3. Prefer deterministic validation before shipping:
   - JSON parse checks for all `.json` files.
   - JS syntax check (`node --check`) for all script modules.
   - Run specialized validators (for example `tools/validateZombieSkinSelector.mjs`).
4. Keep Minecraft-specific constraints in mind:
   - `pre_animation` variables must be safe when queried every frame.
   - Render controller arrays should be index-safe (`query.property` range must match array length).
   - Scoreboard-backed economies should always guard missing objectives and negative balances.

## Standard Validation Workflow
Run from repo root:

```bash
python - <<'PY'
import json,glob
for f in glob.glob('**/*.json',recursive=True):
    json.load(open(f,'r',encoding='utf-8'))
print('JSON OK')
PY

node --check EFZ_Scripts_BP/scripts/main.js
for f in EFZ_Scripts_BP/scripts/systems/*.js EFZ_Scripts_BP/scripts/data/*.js tools/*.mjs; do
  node --check "$f"
done

node tools/validateZombieSkinSelector.mjs
```

## Bedrock Design Checklist
- Entities:
  - `minecraft:entity.description.identifier` matches expected namespace.
  - Spawn rules/components match intended gameplay behavior.
- RP entity:
  - Correct `materials`, `textures`, `geometry`, `render_controllers` keys.
- Render controllers:
  - Array entries exist and map to valid texture short names.
- Scripts:
  - Guard null entities/players and handle cancellation paths.
  - Avoid heavy per-tick loops when event-based hooks are available.
- Manifests:
  - Dependencies match actual imports and module usage.

## Improvement Loop (How to "learn" during tasks)
When implementing a feature:
1. Inspect at least one existing in-repo pattern before adding new logic.
2. Reuse shared helpers/constants instead of duplicating strings.
3. Add or extend a validator when feature integrity can drift over time.
4. Document the validation command in the closest README.
