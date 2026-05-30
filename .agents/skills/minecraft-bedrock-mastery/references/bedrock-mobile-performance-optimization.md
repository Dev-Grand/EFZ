# Bedrock Mobile Performance Optimization Reference

Use this reference when adding or tuning EFZ systems that can affect mobile performance: script intervals, HUD/menu updates, entity visuals, zombie/husk variants, corpse loot, safe/radiation zones, NPC trades, sounds, textures, pack size, weapons, armor, particles, and release QA.

EFZ goal: stable hardcore survival gameplay on mobile devices. Prioritize frame stability, low UI friction, predictable scripts, and resource-pack discipline over flashy systems.

## Official source anchors

Verify current behavior when target Bedrock version changes:

- `system.run` guide / script ticks / timed callbacks: https://learn.microsoft.com/en-us/minecraft/creator/documents/systemrunguide
- Script Error Handling Best Practices: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/error-handling
- Building Multiplayer-Aware Scripts: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/multiplayer-scripts
- Introduction to Scripting: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/introduction
- Resource Pack introduction / pack order: https://learn.microsoft.com/en-us/minecraft/creator/documents/resourcepack
- Entity Modeling and Animation: https://learn.microsoft.com/en-us/minecraft/creator/documents/entitymodelingandanimation
- Creating New Entity Types: https://learn.microsoft.com/en-us/minecraft/creator/documents/introductiontoaddentity
- Minecraft file extensions / `.mcpack`: https://learn.microsoft.com/en-us/minecraft/creator/documents/minecraftfileextensions

## Mobile-first performance philosophy

- Assume the weakest target phone, not the development PC.
- Prefer stable 20 TPS behavior over visual richness.
- Use less frequent updates unless gameplay requires immediate response.
- Avoid hidden costs: too many forms, particles, sounds, high-res textures, active entities, and per-player loops can stack.
- Treat player reports of stutter, delayed forms, or pack import failures as real even when code validators pass.
- Do not add a feature unless its runtime cost matches its gameplay value.

## EFZ performance budget priorities

Highest priority systems must stay lightweight:

1. HUD/actionbar status.
2. Safe-zone PvP protection.
3. Radiation exposure checks.
4. Infection/broken-leg effects.
5. Corpse/death logic.
6. NPC interactions/trades.
7. Stats/money tracking.
8. Future weapon/combat systems.

Lower-priority polish should never harm these systems.

## Script interval rules

Use the slowest interval that still feels correct:

- HUD: 40 ticks is usually enough for money/status display.
- Radiation exposure: 20 ticks is acceptable if using simple zone checks; slower is possible if tuned.
- Playtime tracking: 1200 ticks / 1 minute.
- Money delta tracking: 20–40 ticks or event-driven when possible.
- Grave despawn checks: schedule per corpse or use low-frequency checks.
- Admin/debug monitoring: only on demand.

Avoid per-tick loops unless the feature genuinely needs per-tick behavior.

## Script loop rules

- Avoid nested loops over players × entities unless bounded and necessary.
- Cache simple per-player state, but clear on `playerLeave`.
- Recompute cheap facts; cache expensive scans.
- Use zone bounding boxes for fixed-map areas; they are cheap.
- Avoid scanning all world entities for every player.
- Split long-running work across ticks or use `system.runJob` when appropriate for large generator-style jobs.
- Guard independent loop work so one player/entity failure does not stop the whole interval.

## Entity count rules

- Entity count is one of the biggest mobile risks.
- Corpse entities should despawn after a clear lifetime.
- Do not spawn decorative or debug entities permanently.
- Avoid AI-heavy entities in safe zones unless needed.
- Horde/event systems must cap spawn counts and clean up far/old entities.
- Future loot crates should be static blocks/entities only where needed; avoid thousands of active ticking entities.

## Resource-pack texture rules

- High-resolution textures look good but increase memory pressure.
- Use 1024x512 humanoid skins only when visually necessary.
- Avoid using high-res variants for large numbers of common mobs if mobile stutter appears.
- Prefer 256x/512x for common mobile-facing assets unless the asset is close-up and important.
- Pack icons should be 256x256.
- Remove unused textures before release.
- If purple/missing textures appear only on mobile, suspect cache, pack order, format, or memory pressure.

## Entity rendering/animation performance rules

- Prefer vanilla geometry/animation controllers for common mobs with custom texture swaps.
- Avoid custom geometry for dozens/hundreds of common mobs until tested on mobile.
- Avoid alpha/blend materials unless transparency is required.
- Keep render-controller Molang expressions simple.
- Do not use complex per-frame `pre_animation` logic for common mobs.
- Test groups of spawned zombies/husks, not just one mob.

## UI performance rules

- Forms are interaction moments, not live HUD replacements.
- Keep form bodies short; long text can feel slow and unreadable on mobile.
- Paginate large lists: corpse loot, shops, reports, leaderboards.
- Do not reopen forms in tight loops.
- Use actionbar as one composed line; avoid multiple systems overwriting it.
- Titles should be event-based, not repeated every interval.
- Prefer dropdowns and presets over manual text typing when possible.

## Sound/particle rules

- Sounds are powerful but can become spammy and expensive.
- Radiation Geiger sounds should be throttled and intensity-based, not played every tick.
- Avoid constant area-wide sound spam in multiplayer.
- Particle effects should be rare and meaningful, especially on mobile.
- Do not attach persistent particles to every common zombie unless tested.

## Fixed-map optimization strategy

EFZ has a fixed map, which is a major performance advantage:

- Use coordinate boxes for zones instead of dynamic detection scans.
- Predefine radiation/safe-zone boxes in data files.
- Manually place loot/crates where possible instead of procedural scanning.
- Use static map knowledge for trader/NPC design.
- Avoid allowing building/destruction if the gameplay does not require it; this reduces system complexity.

## Data and persistence performance

- Scoreboards are good for simple numeric stats.
- Entity tags are useful for small persisted markers, but avoid storing huge data in many tags.
- Dynamic properties can be useful for per-player state when available and appropriate.
- In-memory `Map` is fastest but not persistent; use only for temporary/session state.
- Avoid serializing large inventories too often; for corpses, serialize once on death and rewrite only when loot changes.

## Future weapon/combat performance rules

When EFZ adds guns:

- Avoid per-tick raycasts for every player if no one is shooting.
- Run hit detection only on shot events.
- Cap fire rates server-side.
- Keep recoil/spread math simple.
- Avoid spawning many projectile entities if hitscan can work reliably.
- Throttle muzzle sounds/particles.
- Track ammo/reload state per player with simple maps/properties.
- Test automatic weapons on mobile with multiple players.

## Performance instrumentation ideas

Add admin-only tools later:

- `!efz perf players`: online count and tracked state sizes.
- `!efz perf maps`: sizes of major runtime maps.
- `!efz perf zones <player>`: zone check state for a player.
- `!efz perf entities`: rough counts around admin/player for corpses/NPCs/zombies if feasible.
- `!efz perf hud`: actionbar interval and last update info.

Keep instrumentation disabled or admin-only in production.

## Mobile QA scenarios

Before calling a feature mobile-safe, test:

1. Fresh mobile import after deleting old packs.
2. World load with all EFZ packs active.
3. `!efz` menu open/close/reopen.
4. HUD visible for 5+ minutes without flicker/spam.
5. Radiation zone entry/exit and actionbar status.
6. Safe-zone PvP test with two players if possible.
7. Corpse loot UI with many item stacks.
8. NPC trade menu with several offers.
9. Spawn multiple zombies/husks and watch movement/animations.
10. Leave/rejoin while systems are active.
11. Test low battery/thermal conditions if possible for long sessions.

## Performance red flags

- Actionbar flickers or alternates between systems.
- Chat fills with repeated warnings.
- Titles repeat constantly.
- Form opens slowly or fails after chat command.
- Zombies animate poorly in groups.
- Mobile heats up quickly near one feature area.
- Pack import takes too long or crashes.
- World load errors appear only after adding textures/sounds.
- Script watchdog warnings or random system shutdowns.

## Optimization workflow

1. Reproduce the issue on mobile or closest available device.
2. Identify surface: script loop, entity count, RP asset, UI spam, sound/particle spam, pack cache, or network/multiplayer.
3. Disable/toggle suspected systems one at a time if possible.
4. Reduce interval frequency or work per interval.
5. Add caps/cleanup for entities/effects/sounds.
6. Simplify textures/materials/animations for common mobs.
7. Re-test the exact scenario.
8. Document the tested device/scenario and remaining risks.

## Validator expansion ideas

Add checks for:

- Unusually large PNG dimensions in common entity texture folders.
- Missing `pack_icon.png` or wrong icon dimensions.
- Too many active interval registrations in scripts.
- Multiple direct `setActionBar` call sites.
- Resource pack texture count by category.
- Sound file count/size by category.
- Zone count and coordinate sanity.
- Grave/corpse lifetime constants.

## Release rule

A feature is not mobile-ready until it is tested on mobile or clearly marked untested. Static validators prove structure, not performance.
