# EFZ Hardcore Survival Gameplay Design Reference

Use this reference when designing EFZ gameplay systems: death, loot, radiation, safe zones, infection, injuries, economy, NPC traders, loot crates, world events, progression, PvP, future guns/armor, bleeding, quests, and balance changes.

EFZ is a fixed-map DayZ-style Minecraft Bedrock project. The design target is hardcore survival tension on mobile, not casual convenience.

## Core design pillars

1. Death must matter.
2. Travel must feel risky.
3. Loot must create routes and conflict.
4. Preparation must beat luck.
5. UI should inform, not handhold.
6. Safe zones should protect trade/social flow, not remove danger from the world.
7. High-tier areas should require gear, time, and risk.
8. Systems should be simple enough for mobile and Bedrock stability.

## Hardcore fairness rules

Hardcore does not mean unfair. Good EFZ difficulty should be:

- understandable,
- learnable,
- avoidable through preparation,
- punishing when ignored,
- consistent enough that players trust the game.

Avoid:
- random instant death with no warning,
- hidden mechanics with no feedback,
- overpowered safe protections,
- UI that confirms long-range kills,
- mechanics that only work for experienced admins to explain.

## Death and corpse design

Current EFZ direction: instant public loot, no owner protection.

Rules:
- Player death should create immediate tension.
- Anyone can loot a corpse immediately.
- Corpse UI should help players choose quickly, not auto-protect loot.
- Death should preserve the world story: body location matters.
- If inventory is full, overflow should drop rather than disappear.
- Corpse despawn timer should balance server performance and retrieval gameplay.

Good additions later:
- corpse decay stages,
- corpse sound/noise risk,
- infected attraction near recent corpses,
- blood/death marker visuals if performance allows.

Avoid:
- owner-only timers if the user wants pure hardcore,
- guaranteed safe recovery routes,
- instant all-loot teleport to owner.

## Loot economy loop

EFZ needs a loop like:

1. Spawn/return with low supplies.
2. Loot low-risk areas.
3. Sell/trade/prepare.
4. Push into higher-risk zones.
5. Gain high-value loot.
6. Escape alive or lose everything.

Loot should be placed/tuned by map zone:

- Civilian: food, basic meds, low-value trade items.
- Medical: splints, syringes, bandages later.
- Industrial: utility, repair, crafting-like items if used.
- Military: weapons/armor/ammo later.
- Radiation military/base: best loot, requires gas mask/preparation.
- Black market: rare item exchange, expensive/high-risk economy sink.

Since the map is fixed and players cannot build/destroy, manual loot placement is strong and acceptable.

## Risk/reward zone rules

Every high-reward zone needs at least one cost:

- longer travel,
- radiation exposure,
- stronger infected density,
- PvP visibility,
- limited escape routes,
- expensive required gear,
- scarce medical resources,
- sound/noise risk.

Do not put top loot in low-risk areas unless it is event-limited or extremely rare.

## Safe-zone design

Safe zones exist to support trading, social flow, and server structure.

Rules:
- No player damage if attacker or victim is protected.
- Exit immunity should be short and explicit; current 5 seconds is good.
- Safe zone should not reveal map/help too much if hardcore navigation is desired.
- Safe zone should not become a permanent farming exploit.
- Trader access should be useful but not invalidate looting.

Potential future restrictions:
- no combat tagging abuse near boundary,
- no projectile baiting across border,
- cooldown before re-enter benefits if abused,
- clear boundary feedback without showing full map.

## Radiation design

Radiation is one of EFZ's strongest systems because it creates preparation-based risk.

Current direction:
- fixed coordinate zones,
- turtle helmet as gas mask,
- gas mask reduces exposure by 80%,
- stages: L1/L2/L3,
- actionbar shows radiation state.

Rules:
- Radiation should ramp over time, not instantly kill.
- Gas mask should matter but not trivialize the zone if it has no filter system.
- Warning feedback should be clear on entry/exit.
- Best loot can be inside radiation zones, but loot placement is map-side.
- Avoid anti-rad medicine until core system is stable if user wants simplicity.

Future additions:
- filter durability/charge only if reliable,
- Geiger sound ticks with throttling,
- stronger infected or environmental storytelling in radiation zones,
- visual signage and atmosphere in RP/map.

## Infection and disease design

Current EFZ infection is a good baseline but can become deeper later.

Rules:
- Infection should make zombie hits scary.
- Cure item should matter and be scarce enough.
- Infection effects should be readable in HUD/status.
- Avoid stacking so many effects that players cannot understand cause/effect.

Future staged model:
- Stage 1: nausea/weak warning.
- Stage 2: hunger/slowness/light damage pressure.
- Stage 3: poison/wither/critical danger.
- Cure timing could be more effective earlier if desired.

Do not overcomplicate until current systems pass mobile testing.

## Injury and bleeding design

Current broken-leg system already supports hardcore movement consequences.

Rules:
- Broken leg is good because it changes survival decisions immediately.
- Splints should be valuable but not impossible to find.
- Bleeding should wait for custom guns/combat if the user wants it tied to bullet/melee damage.

Future bleeding model:
- chance based on damage type,
- periodic damage or health pressure,
- bandage stops bleeding,
- HUD status: `BLEEDING`,
- no live attacker intel.

Avoid adding bleeding before combat pipeline is ready if it creates random frustration.

## Economy and NPC trader design

Economy should support survival, not replace looting.

Rules:
- Traders should create routes and decisions.
- Buying should be expensive enough that looting matters.
- Selling should reward risk, not common junk farming too much.
- Black market should handle rare/high-tier items.
- Safe-zone traders should cover basics and recovery.
- Data-driven trade config is preferred for balancing.

Good future fields:
- category,
- stock,
- restock time,
- reputation requirement,
- zone/trader role,
- buy/sell limits,
- dynamic event price modifier.

Avoid:
- infinite cheap medicine,
- infinite cheap high-tier armor/weapons,
- sell loops where players buy and sell for profit.

## PvP design

EFZ PvP should be scary and information-poor.

Rules:
- No live kill count in actionbar.
- No automatic kill confirmation at range.
- Death loot is public immediately.
- Safe-zone protection should not allow shooting out or baiting in.
- Future weapon balance should favor positioning, preparation, recoil control, and ammo scarcity.

Future PvP systems:
- combat logging penalties only if needed,
- bounty system if it creates good conflict,
- server events that pull players into contested zones,
- leaderboard/stat menus that do not reveal live combat intel.

## World events design

Events should create conflict and movement.

Good EFZ events later:
- airdrop/supply drop,
- infected horde migration,
- temporary radiation leak/intensity spike,
- military convoy wreck loot,
- black market limited-time trade,
- server-wide distress beacon.

Rules:
- Events should be rare enough to matter.
- Event location should not be too precise if hardcore navigation matters.
- Rewards must justify risk.
- Events must be capped and cleaned up for mobile performance.

## Progression and retention

EFZ can retain players without softening hardcore gameplay.

Good progression:
- statistics menu,
- reputation with traders,
- seasonal leaderboards,
- contracts/missions,
- rare cosmetics if feasible,
- patch notes and server identity.

Avoid progression that gives permanent unfair PvP power after death unless that is intentionally part of the server design.

## Fixed-map design advantages

Because the map is fixed and building/destruction are disabled:

- balance can be location-specific,
- loot can be manually curated,
- zones can be coordinate boxes,
- trader routes can be designed intentionally,
- safe/radiation boundaries can be tested exactly,
- server identity can be stronger than procedural worlds.

Use this advantage instead of overbuilding procedural systems.

## Mobile gameplay design rules

- Avoid systems requiring fast typing.
- Keep menus short.
- Use clear actionbar statuses.
- Avoid effects that cause excessive visual discomfort for long periods.
- Avoid combat mechanics that require PC-level precision only.
- Keep performance budgets in mind for hordes, particles, sounds, and high-res assets.

## Balance worksheet for new systems

Before adding a gameplay system, answer:

1. What fear/tension does it create?
2. What preparation counters it?
3. What resource does it consume?
4. What UI feedback tells the player what happened?
5. What exploit could players use?
6. What mobile performance cost does it add?
7. What validator or admin test command should support it?
8. How does it interact with death/corpse loot?
9. Does it reveal unfair PvP information?
10. Does it fit fixed-map DayZ-style EFZ?

If these answers are weak, redesign before coding.

## Feature priority guidance

Recommended gameplay order after core stability:

1. Mobile/runtime bug fixes.
2. Admin QA tools.
3. Loot economy/crate tuning.
4. Radiation polish and sound throttling.
5. Infection/injury depth.
6. First world event.
7. Weapon/armor pipeline.
8. Bleeding tied to weapons.
9. Reputation/contracts.
10. Discord bridge/release operations.

## Bad idea warning signs

Be professionally honest if a feature:

- removes fear of death,
- gives free combat intel,
- requires fragile JSON UI for critical gameplay,
- adds heavy scripts/entities for small value,
- makes safe zones exploitable,
- creates infinite money/loot loops,
- depends on exact mobile UI behavior that cannot be guaranteed,
- adds complexity before current features are tested.

When rejecting or warning, propose a safer EFZ-compatible alternative.

## Release rule

A gameplay feature is not ready until:

1. Its risk/reward purpose is clear.
2. It has counterplay or preparation.
3. It has concise player feedback.
4. It does not break hardcore PvP information rules.
5. It has validation/admin testing support when practical.
6. It has been tested in-game, ideally on mobile, or clearly marked untested.
