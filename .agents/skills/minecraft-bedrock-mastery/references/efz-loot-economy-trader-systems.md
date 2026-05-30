# EFZ Loot, Economy & Trader Systems Reference

Use this reference when designing or implementing EFZ loot boxes, loot tables, container restocks, scavenging, item rarity, money flow, trader menus, NPC vendor offers, player payments, sell/buy prices, stock/restock, scarcity tuning, admin economy tools, or economy validators.

EFZ goal: loot and economy should create DayZ-style survival tension. Players should risk travel for valuable supplies, care about scarcity, use traders without trivializing exploration, and never get free money/item duplication through UI, death, reload, or server restart edge cases.

## Official source anchors

Verify current behavior when target Bedrock version changes:

- Introduction to Loot and Trade Tables: https://learn.microsoft.com/minecraft/creator/documents/introductiontoloottables
- Creating a Loot Table: https://learn.microsoft.com/en-us/minecraft/creator/documents/createloottable
- Loot table definition list: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/loottablereference/examples/loottabledefinitionlist
- Loot functions: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/loottablereference/examples/loottablecomponents/loot_function
- Loot overloads: https://learn.microsoft.com/en-us/minecraft/creator/documents/lootoverloads
- Trade table list: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/tradetablereference/examples/tradetablelist
- Creating a Trade Table: https://learn.microsoft.com/en-us/minecraft/creator/documents/createtradetable
- Trade tier: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/tradetablereference/examples/tradetablecomponents/tradetier
- Trade item: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/tradetablereference/examples/tradetablecomponents/tradeitem
- Trade group: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/tradetablereference/examples/tradetablecomponents/tradegroup

## Bedrock loot/economy reality

EFZ can use three different layers:

### Vanilla-style loot tables
- Best for entity drops, block/container loot, and simple random rewards.
- Loot tables live in behavior-pack `loot_tables` folders and are referenced by path.
- Good for static/vanilla-like loot generation.
- Less flexible for custom restock timers, player-specific lockouts, or economy-aware scarcity.

### Scripted loot containers
- Best for fixed-map DayZ loot boxes, server restock timers, tiered zones, and anti-duplication rules.
- Can use data tables for zone/tier/item weights.
- Must persist or regenerate state carefully to avoid restart exploits.
- Needs mobile-friendly loot UI and overflow handling.

### Scripted traders/forms
- Best for EFZ NPCs because current project already uses ActionForm menus and scoreboard money.
- Easier to balance with data files.
- Can support stock/restock, role-specific vendors, sell/buy flows, reputation later, and admin tooling.
- Must handle form cancellation, target/player disconnects, inventory full, and scoreboard race conditions.

## EFZ loot/economy philosophy

- Loot should be scarce enough that death matters.
- Traders should help survival but not replace looting.
- High-value items belong in high-risk routes.
- Safe zones should not become infinite money farms.
- Military/radiation loot should justify preparation and risk.
- Money should be useful but not more important than supplies.
- Prices should punish convenience; buying should usually cost more than selling rewards.
- No feature should duplicate items or money through forms, restarts, deaths, or full inventories.

## Pack and system ownership

- `EFZ_Scripts_BP/scripts/data/trades.js`: scripted NPC trade offers.
- `EFZ_Scripts_BP/scripts/systems/npcTrades.js`: trade UI, transaction validation, inventory/money changes.
- `EFZ_Scripts_BP/scripts/systems/playerMenus.js`: player payments and admin money/stat commands.
- `EFZ_Scripts_BP/scripts/systems/playerStats.js`: money earned/spent and playtime tracking.
- `EFZ_Scripts_BP/scripts/data/*loot*.js` later: scripted loot tier tables if/when added.
- Behavior-pack `loot_tables/` later: vanilla-style loot tables if used for entity/container drops.
- `tools/validateAddonIntegrity.mjs`: should validate economy/trade/loot config drift.

## Recommended fixed-map loot model

Because EFZ has one fixed map and players cannot build/destroy, use hand-placed loot containers plus data-driven tiers.

Suggested tier categories:

### Civilian
- Food, water, basic meds, low-tier melee, common clothes.
- Low danger.
- Low resale value.

### Industrial
- Tools, repair materials, vehicle/future utility parts, basic armor pieces.
- Medium travel value.
- Useful but not best PvP loot.

### Medical
- Bandages, syringes, cures, splints, future anti-bleed/anti-infection items.
- Medium-high value.
- Should be scarce enough to create trade and travel.

### Police/security
- Low-mid weapons, ammo, light armor.
- PvP route starter.
- Higher risk than civilian.

### Military
- Strong weapons, ammo, armor, rare attachments.
- High risk.
- Should not be abundant enough to flood economy.

### Radiation/military special
- Endgame supplies, rare weapons/armor, CBRN gear, high-value barter items.
- Requires gas mask/radiation preparation.
- Strongest rewards, but not guaranteed every run.

## Loot table design rules

If using vanilla-style JSON loot tables:
- keep tables under clear folders like `loot_tables/chests`, `loot_tables/entities`, or `loot_tables/efz`,
- use weighted pools for rarity,
- use empty entries or low roll counts for scarcity,
- use `set_count`-style functions carefully for stack sizes,
- avoid huge single tables that are hard to balance,
- validate every item id referenced by the table.

If using scripted tables:
- keep one data table per major category or zone,
- use readable weights,
- keep min/max counts explicit,
- support empty/no-loot outcomes,
- do not generate loot every UI open unless intended,
- persist container state or use clear restock windows.

## Suggested scripted loot data model

Example future shape:

```js
export const LOOT_TIERS = {
  civilian: {
    restockMinutes: 45,
    rolls: { min: 1, max: 3 },
    entries: [
      { itemId: "minecraft:bread", min: 1, max: 2, weight: 25 },
      { itemId: "efz:bandage", min: 1, max: 1, weight: 8 },
      { itemId: null, min: 0, max: 0, weight: 20 }
    ]
  },
  military: {
    restockMinutes: 90,
    rolls: { min: 1, max: 2 },
    entries: [
      { itemId: "efz:rifle_ammo", min: 4, max: 12, weight: 12 },
      { itemId: "efz:military_helmet", min: 1, max: 1, weight: 2 },
      { itemId: null, min: 0, max: 0, weight: 35 }
    ]
  }
};
```

Rules:
- `itemId: null` means no loot for that roll.
- Weight should be relative, not percentage.
- Rare items should stay rare even after many containers.
- Validate every non-null item id.
- Keep restock timers long enough to prevent farming.

## Loot container state rules

For fixed-map containers:
- each container needs a stable id or coordinate key,
- generated loot should remain stable until looted/restocked,
- restock should not happen while a player is actively looting,
- full inventory overflow should drop near the player only when appropriate,
- container contents must not regenerate repeatedly through menu cancel/open spam,
- server restart behavior must be defined.

Persistence options:
- scoreboard/dynamic property state for simple restock timestamps,
- entity/block tags if containers are represented by entities,
- regenerated state by deterministic time windows if full persistence is too heavy,
- external storage only if running a dedicated server bridge later.

## Trader economy model

EFZ traders should be role-specific:
- medical trader buys/sells meds,
- weapons trader sells limited ammo/weapons later,
- scavenger buys junk/barter items,
- survival trader sells food/basic supplies,
- black-market trader sells rare items at high cost if added.

Rules:
- trade menus must validate money/inventory at click time, not only when form opens,
- buying should fail cleanly if inventory is full,
- selling should remove items before adding money or rollback safely,
- prices should live in data files,
- no automatic infinite high-value sell loops,
- avoid real-money-like inflation from easy zombie farming unless intentionally balanced.

## Trade stock and restock

Stock can make traders feel more DayZ-like, but it adds state complexity.

Recommended rollout:
1. Keep current simple unlimited stock for early testing.
2. Add per-server stock for rare items only.
3. Add restock timer per NPC role.
4. Add admin reset/restock tools.
5. Add validator for stock fields.

Rules:
- do not add stock to every item at once,
- stock must update after transaction succeeds,
- stock must survive restart if it affects balance,
- UI should show `Out of stock` cleanly,
- restock should not spam chat.

## Player payments

Player-to-player payments should be strict:
- sender must have enough money at submit time,
- recipient must still be online if paying online players only,
- amount must be positive integer,
- optionally cap maximum transfer per action,
- log large transfers for admin review later,
- update money-earned/spent stats consistently.

Avoid:
- allowing negative amounts,
- parsing decimal/NaN values,
- paying stale player names,
- duplicate submit paths from double-click/form resend.

## Money and scoreboard rules

Scoreboard economy is practical for EFZ.

Rules:
- ensure money objective exists before use,
- never allow negative balances unless intentionally supporting debt,
- all money changes should go through shared helpers,
- admin commands should log changes,
- stats tracking should distinguish earned/spent from current balance,
- transactions should be atomic: either complete all item/money steps or fail safely.

If a transaction has multiple steps:
1. validate player and target still valid,
2. validate amount and inventory/currency,
3. remove cost/item,
4. add reward/item,
5. update stats/logs,
6. send short feedback.

## Anti-farming and scarcity rules

Watch for:
- safe-zone buy/sell loops,
- loot container reset by relog/restart,
- alt-account money transfer abuse,
- easy mob farm money sources,
- trader selling item cheaper than another trader buys it,
- admin test commands left accessible to non-admins,
- high-tier loot in low-risk areas.

Solutions:
- separate buy/sell prices,
- add transaction logging for rare/high-value items,
- add cooldowns/restocks for high-tier loot,
- validate cross-vendor arbitrage,
- keep admin commands tag/OP protected,
- keep high-tier loot tied to risk zones.

## Mobile UI rules

Loot/trade UI must be fast:
- short item labels,
- show price/reward clearly,
- show stock only when relevant,
- keep `Take All` or `Buy` actions obvious,
- avoid deeply nested menus for common actions,
- handle cancel without side effects,
- use page sizes that fit mobile screens.

Avoid:
- long lore paragraphs in buttons,
- too many tiny choices,
- chat spam for every loot roll,
- live combat intel from economy UI.

## Admin and QA tools

Useful admin tools:
- set/add/remove/view money,
- inspect player stats,
- reset/restock trader stock,
- reset/restock loot containers,
- give test loot tier item bundle,
- teleport to loot-zone test coordinates,
- dump recent high-value transactions,
- validate economy config in-game if possible.

## Economy validator ideas

Validate:
- every trade item id exists or is allowed vanilla/custom,
- every loot item id exists,
- all weights are positive numbers unless `empty`/null entry is explicit,
- min/max counts are valid and sane,
- buy prices are positive,
- sell rewards are non-negative and lower than convenience buy price when applicable,
- no cross-vendor infinite arbitrage,
- stock/restock fields are valid if present,
- menu labels do not exceed mobile-friendly length,
- admin commands remain protected.

## Loot/economy QA checklist

Before shipping a loot/economy feature:
- Player can loot with empty inventory.
- Player can loot with full inventory without item loss.
- Canceling UI does not duplicate or delete items.
- Server restart behavior is known and acceptable.
- Trader buy flow removes money and gives item exactly once.
- Trader sell flow removes item and gives money exactly once.
- Payment flow rejects invalid/negative/too-large values.
- Admin commands are admin-only.
- Money earned/spent stats update correctly.
- Mobile UI is readable and quick.
- High-tier loot requires real risk.

## Bad idea warning signs

Warn or redesign if:
- loot regenerates every time a form opens,
- high-tier loot is easy and safe to farm,
- traders create infinite money loops,
- money can go negative by mistake,
- reports/admin tools expose economy commands to everyone,
- restock state is stored only in memory but balance depends on persistence,
- UI requires too many taps under pressure,
- scripts use expensive per-tick scans for every loot container.

## Release rule

A loot/economy/trader feature is not ready until item ids, prices, stock/restock, money transactions, persistence behavior, mobile UI, admin protections, and anti-duplication cases have been validated in static checks and targeted in-game QA.
