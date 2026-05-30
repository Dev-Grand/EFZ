---
name: minecraft-bedrock-mastery
description: Use automatically for all EFZ Minecraft Bedrock project work, including Bedrock behavior/resource packs, Script API systems, entities, render controllers, UI, economy, traders, loot, zombies, graves, corpses, survival mechanics, weapons, armor, mobile performance, validation, packaging, and debugging.
---

# Minecraft Bedrock Mastery Skill

## Purpose
Use this skill whenever working on Minecraft Bedrock addon code in this repository to reduce errors across behavior packs, resource packs, scripting, manifests, entity rendering, animations, UI forms, and mobile runtime behavior.

EFZ is a fixed-map, hardcore DayZ-style Minecraft Bedrock project. Prefer stable Bedrock-native solutions over fragile tricks, especially because the project must run cleanly on mobile devices.

## Professional Honesty Rule
- Be direct when an idea is risky, unsupported, or likely to break on mobile.
- Explain the limitation, then propose the closest reliable Bedrock-compatible alternative.
- Never claim a feature is fully possible if it depends on fragile client UI/render overrides or untested engine behavior.
- Separate **what scripts can do**, **what resource packs can do**, and **what requires external server/bot tooling**.


## Focused References
- For loot, economy, traders, loot boxes, restocks, scarcity tuning, payments, prices, stock, and anti-duplication checks, read `references/efz-loot-economy-trader-systems.md` before changing those systems.
- For armor, equipment, gas masks, hazmat gear, backpacks, durability, protection tuning, and wearable visuals, read `references/efz-armor-equipment-systems.md` before adding or changing equipment systems.
- For custom weapons and combat systems, read `references/efz-weapons-combat-systems.md` before adding/tuning guns, ammo, reloads, recoil, hit detection, damage, armor interactions, bleeding, combat HUD, sounds, or weapon validators.
- For hardcore survival gameplay design, read `references/efz-hardcore-survival-gameplay-design.md` before adding/tuning death, loot, zones, infection, injury, economy, traders, events, PvP, progression, weapons, armor, or balance changes.
- For data-driven validation and integrity checks, read `references/bedrock-data-validation-integrity.md` before adding/editing configs, generated lists, validators, cross-pack references, trade tables, zone data, manifests, or release QA checks.
- For mobile performance optimization, read `references/bedrock-mobile-performance-optimization.md` before adding or tuning script intervals, HUD updates, entities, textures, sounds, particles, weapons, zones, corpse systems, or pack size.
- For pack architecture, manifests, dependencies, UUIDs, script module versions, pack icons, packaging, and release imports, read `references/bedrock-pack-architecture-manifests.md` first.
- For RP entity rendering and animation work, read `references/bedrock-rp-entity-rendering-animation.md` before changing client entities, render controllers, geometry, animations, player overrides, zombie/husk variants, NPCs, corpses, armor visuals, or attachables.
- For deep script runtime debugging, read `references/bedrock-script-runtime-debugging.md` before implementing or fixing EFZ script systems, menus, scoreboards, admin commands, zones, graves, or multiplayer/mobile runtime bugs.
- For premium Bedrock UI/UX design, read `references/bedrock-ui-ux-design.md` before changing EFZ menus, actionbar HUD, title alerts, shops, corpse-loot UI, admin tools, or JSON UI/resource-pack screen work.

## Runtime-First Bedrock Rule
Static validation is necessary but not enough. Bedrock addons can pass JSON/JS checks and still fail in-game because of:
- manifest module/version mismatches,
- experimental API differences,
- form/UI timing and chat cancellation behavior,
- entity render-controller or animation-controller runtime failures,
- mobile resource limits,
- pack load order and stale cached packs.

When a user reports an in-game failure, treat the in-game report as more important than validator success.

## Core Rules
1. Keep BP/RP contracts in sync:
   - If a BP entity identifier changes, update matching RP `entity/*.entity.json`, render controllers, animations, and any script constants using that identifier.
   - If texture short names change in RP entity files, update render-controller arrays and references.
   - If entity properties change in BP, update every script or RP render controller reading those properties.
2. Never add script-only dependencies to a pack unless a script directly imports and uses them.
3. Prefer deterministic validation before shipping:
   - JSON parse checks for all `.json` files.
   - JS syntax check (`node --check`) for all script modules.
   - Run specialized validators (`tools/validateAddonIntegrity.mjs`, `tools/validateZombieSkinSelector.mjs`).
4. Keep Minecraft-specific constraints in mind:
   - `pre_animation` variables must be safe when queried every frame.
   - Render-controller arrays should be index-safe (`query.property`/variables range must match array length).
   - Scoreboard-backed economies should always guard missing objectives and negative balances.
   - Forms can fail or cancel; always handle cancellation and surface useful player/admin feedback.
5. Keep mobile performance in mind:
   - Avoid unnecessary per-tick loops; use intervals or events where possible.
   - Keep actionbar/HUD text short.
   - Avoid very large custom UI/resource overrides unless necessary.

## EFZ Architecture Preferences
- Public UX: use `ActionFormData`, `ModalFormData`, actionbar, and title/subtitle; avoid fragile custom UI hacks unless explicitly requested and tested.
- Admin UX: provide both menu flows and text-command fallbacks where practical.
- Hardcore HUD: avoid real-time PvP intel such as live kill counters; keep detailed stats in menus.
- Fixed map zones: use data-driven coordinate boxes (`scripts/data/*Zones.js`) so the user can tune coordinates later.
- Persistent gameplay state: prefer scoreboards, dynamic properties, or entity tags over in-memory `Map` when state must survive reloads.
- Corpse/death flow: preserve hardcore public looting unless the user explicitly asks for owner protection.
- Player rendering: treat `minecraft:player` client overrides as high-risk. Do not re-add forced living-player skin overrides without a dedicated test plan.
- Zombie/husk rendering: prefer vanilla geometry/animation controllers plus EFZ texture swaps unless custom models are specifically required and tested.


## Bedrock UI Mastery Rules
Goal: make EFZ UI feel premium, fast, and readable on mobile while staying inside stable Bedrock constraints. Big-server quality comes from disciplined information architecture, consistent visual language, icons, fast flows, and strong error handling—not from pretending Script API supports arbitrary HUD widgets.

### UI Surface Selection
- Use `ActionFormData` for navigation, shops, corpse-loot lists, leaderboards, patch notes, and any “choose one action” flow. Buttons may include resource-pack icon paths when assets exist.
- Use `ModalFormData` for input flows such as payments, reports, admin money edits, filters, amount entry, and dropdown selectors. Validate all returned values because mobile text input is error-prone.
- Use `MessageFormData` for two-choice confirmations: confirm purchase, delete/reset, accept/decline, yes/no.
- Use actionbar only for short live survival state. Do not let multiple systems call `setActionBar`; compose one final HUD line in one owner system.
- Use title/subtitle only for important events: entered radiation zone, safe-zone state changes, death/corpse events, critical infection/injury warnings. Avoid spam.
- Treat JSON UI/resource-pack screen customization as advanced and fragile. Only use it when forms/actionbar/titles cannot meet the design, and isolate it in a dedicated UI PR with mobile testing.

### Premium EFZ UI Design Pattern
- Every menu needs a clear title, one-sentence purpose, primary action first, secondary actions after, and a Back/Close path.
- Keep button names short: 1–3 words when possible. Use second-line text only for explanation (`Title\nSubtitle`).
- Use consistent ordering: Information → player actions → economy → stats → patch/links → admin tools.
- Use consistent semantic colors in text: `§a` success, `§c` danger/error, `§e` warning/info, `§6` money/economy, `§7` secondary text. Do not over-color every word.
- Prefer progressive disclosure: show simple menus first, then deeper detail screens. Avoid one giant menu with too many buttons.
- For mobile, limit common menus to ~5–8 visible choices; paginate long lists such as corpse loot, shops, reports, and leaderboards.
- For high-pressure gameplay menus (corpse looting/trading), keep taps minimal: Take Stack, Take All, Next/Previous, Back.
- Always handle `result.canceled`, `selection === undefined`, player logout, stale target player/entity, full inventory, and changed money values after the form was opened.
- After successful actions, send short feedback and refresh the menu only if the player likely needs more actions.

### UI Reliability Checklist
- Ensure `@minecraft/server-ui` is in the script pack manifest when imported.
- Call `.show(player)` from a safe scheduled context (`system.run`) after canceling chat commands; forms can fail if called from restricted execution.
- Catch `.show()` errors and send a player-facing fallback message.
- Do not stack multiple forms at once; reopen only after the previous promise resolves.
- Keep raw text values sanitized; never trust amount fields or dropdown indexes.
- For icon buttons, verify icon files exist in the RP and keep paths stable. Missing icons should not block core functionality.
- Add QA steps for every new UI: cancel, close chat, reopen, invalid input, target logout, insufficient money, inventory full, and mobile readability.

### UI Source Anchors
- Official `@minecraft/server-ui` module docs: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui
- Official `ActionFormData` docs: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata
- Official `MessageFormData` docs: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/messageformdata
- Official JSON UI docs: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuilist
- Use these docs to confirm current module versions, methods, manifest dependencies, button/icon support, cancellation behavior, and JSON UI file roles before complex UI work.

## Bedrock Feature Reality Checks
Before implementing a requested feature, classify it:

### Safe / Stable
- Script events and intervals.
- Scoreboard objectives and numeric stats.
- Entity tags for small persistent markers.
- ActionForm/ModalForm menus.
- Config/data modules for trades/zones/patch notes.
- Resource-pack texture swaps through render controllers when arrays and texture names are validated.

### Possible but Needs Care
- Custom entity models and animation controllers.
- Player client-entity overrides.
- Complex inventory/corpse UI emulation.
- Cross-pack entity-property driven rendering.
- OP/admin detection through Script API fields.
- Custom weapons with reload/recoil/ammo scripts.

### Usually External / Not Script-Native
- Discord bot/webhook integration from Realm-style script-only environments.
- True native slash-command autocomplete for custom commands.
- Persistent arbitrary right-side HUD panels using Script API alone.
- Fully custom free-layout UI like a web app.

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

node tools/validateAddonIntegrity.mjs
node tools/validateZombieSkinSelector.mjs
```

## In-Game QA Checklist
After static checks, ask for or perform targeted runtime testing when possible:

1. Pack import/load:
   - Confirm the world loads without script error popups.
   - Confirm old cached pack versions were removed/reimported if behavior seems stale.
2. Chat/menu systems:
   - Test lowercase and uppercase command input (for example `!efz` and `!EFZ`).
   - Test form cancellation paths.
   - Test admin fallback tag: `/tag <player> add efz_admin`.
3. HUD/actionbar:
   - Confirm only one system owns `setActionBar` composition.
   - Confirm radiation/infection/broken-leg statuses appear together without overwriting each other.
4. RP/entity rendering:
   - Spawn/check zombies, husks, NPCs, dead bodies, and players.
   - Watch for purple textures, invisible models, missing animations, wrong geometry, and vanilla fallback.
5. Gameplay systems:
   - Test corpse looting with full inventory and equipped armor.
   - Test safe-zone damage from inside-to-inside, inside-to-outside, outside-to-inside, and exit immunity.
   - Test radiation entry/exit and gas-mask mitigation.
6. Mobile-specific:
   - Verify forms are readable and buttons are tappable.
   - Keep menu labels short.
   - Avoid high-frequency chat spam, title spam, or actionbar flicker.

## Bedrock Design Checklist
- Entities:
  - `minecraft:entity.description.identifier` matches expected namespace.
  - Components and properties match script and RP expectations.
  - Spawn rules/components match intended gameplay behavior.
- RP entity:
  - Correct `materials`, `textures`, `geometry`, `animations`, `animation_controllers`, and `render_controllers` keys.
  - Do not replace vanilla entity controllers with minimal custom controllers unless animation loss is acceptable.
- Render controllers:
  - Array entries exist and map to valid texture short names.
  - Geometry aliases exist in the RP entity file.
  - Expressions are valid for target engine versions.
- Scripts:
  - Guard null entities/players and handle cancellation paths.
  - Avoid heavy per-tick loops when event-based hooks are available.
  - Use one owner for HUD/actionbar composition.
  - Avoid `try/catch` around imports.
- Manifests:
  - Dependencies match actual imports and module usage.
  - UUID dependencies point to the correct packs.
  - Module versions should match the target Bedrock version being tested.

## Debugging Playbook
When something breaks in-game:
1. Identify whether the failure is BP script, RP rendering, pack import/cache, or pack order.
2. Check for script error messages first; one import/module failure can prevent all systems from registering.
3. If a chat command fails, verify the chat event subscription registered and that the command is canceled/handled.
4. If forms do not open, add player-facing failure messages and verify `@minecraft/server-ui` manifest dependency.
5. If mobs are purple, validate texture paths, material names, render-controller arrays, and geometry aliases.
6. If mobs lose animations, compare against vanilla controller wiring before simplifying controllers.
7. If players turn invisible, remove or disable `minecraft:player` client overrides before attempting more complex fixes.
8. If GitHub cannot merge, inspect the conflict files/blocks; do not keep piling changes into a conflicted PR.

## Improvement Loop (How to "learn" during tasks)
When implementing a feature:
1. Inspect at least one existing in-repo pattern before adding new logic.
2. Prefer official Bedrock docs / stable Bedrock Wiki patterns for API or render behavior when uncertain.
3. Reuse shared helpers/constants instead of duplicating strings.
4. Add or extend a validator when feature integrity can drift over time.
5. Document the validation command and runtime test notes in the closest README.
6. Keep changes smaller when possible so GitHub conflicts and mobile runtime debugging are easier.
