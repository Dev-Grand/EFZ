# Bedrock UI/UX Design Reference

Use this reference when designing or improving EFZ menus, actionbar HUD, title alerts, player/admin flows, shop/trade screens, corpse-loot UI, reports, payments, patch notes, links, and future premium UI polish.

EFZ goal: premium hardcore survival UX on mobile, with big-server polish, but without pretending Bedrock Script API supports arbitrary client widgets.

## Official source anchors

Verify current behavior and module versions before complex UI work:

- `@minecraft/server-ui` module: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui
- `ActionFormData`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata
- `MessageFormData`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/messageformdata
- `ModalFormData`/modal response docs: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformresponse
- `@minecraft/server-ui` changelog: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/changelog
- JSON UI overview: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuilist
- JSON UI screen definitions: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_screen
- JSON UI element definitions: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_element
- JSON UI defs: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_defs

## Bedrock UI surface reality

### Stable script UI surfaces
- `ActionFormData`: button list with optional resource-pack icon paths. Best for navigation, selections, shops, corpse loot, patch notes index, admin tools, and leaderboards.
- `ModalFormData`: questionnaire-style inputs. Best for payments, report details, admin set/add/remove money, dropdown target selection, sliders, toggles, filters, and amount entry.
- `MessageFormData`: two-button confirmation. Best for dangerous/admin actions, expensive purchases, destructive resets, and accept/decline choices.
- Actionbar: one short live status line. Use for money + active survival conditions only.
- Title/subtitle: momentary high-importance alerts. Use sparingly.
- Chat messages: fallback/debug/admin feedback. Avoid spam.

### Advanced / fragile UI surfaces
- JSON UI resource-pack customization can define screens/elements, but it is more fragile, harder to validate, and more likely to be affected by pack order, device UI scale, or version drift.
- Do not attempt CubeCraft-like permanent custom panels through Script API alone. If true custom UI is required, isolate it in a dedicated JSON UI prototype PR with mobile testing and a rollback plan.

## EFZ UI philosophy

EFZ is hardcore. UI should inform, not soften gameplay.

- No live kill confirmations in HUD.
- No map button if the design goal is hardcore navigation.
- No excessive location/zone handholding beyond important survival warnings.
- Death/loot UI should create tension: fast choices, not automatic safety.
- Admin/moderation tools should be hidden from normal players.
- Survival state should be visible only when useful: infection, broken leg, radiation.
- Economy state can be visible because money is core to trading.

## Premium UI principles

1. Clarity beats decoration.
2. Primary action first, risky action confirmed, secondary actions lower.
3. Every screen needs a clear title and one-sentence purpose.
4. Use progressive disclosure: main menu → category → action → confirmation/result.
5. Keep repeated flows consistent: same labels, same order, same colors.
6. Minimize taps for high-pressure gameplay.
7. Prefer icons only when they improve recognition and are guaranteed to load.
8. Never let visual polish reduce runtime reliability.

## EFZ visual language

### Naming
- Main menu labels should be short and mature: `Information`, `Payments`, `Statistics`, `Patch Notes`, `EFZ`.
- Admin labels should be explicit: `Add Money`, `Set Money`, `View Stats`, `Debug Radiation`.
- Corpse labels should be tactical: `Take Stack`, `Take All`, `Next Page`, `Back`.
- Trade labels should show value clearly: `Buy 3x Bandage — $50` / `Sell Diamond — $100`.

### Color semantics
Use color codes sparingly and consistently:

- `§a`: success / safe / completed.
- `§c`: danger / blocked / radiation / error.
- `§e`: warning / attention / instruction.
- `§6`: money / economy.
- `§7`: secondary detail.
- `§l`: one primary header or button emphasis only.

Do not rainbow menus. Over-coloring looks amateur and reduces readability on mobile.

### Text density
- Button text: 1–3 words when possible.
- Button subtitle: one short phrase if needed.
- Form body: short paragraphs or bullet lists.
- Error messages: one sentence, clear next step.
- Admin/debug messages: include context, but keep normal-player UI clean.

## Surface selection matrix

| Need | Best surface | Notes |
|---|---|---|
| Open main player hub | ActionFormData | 5–8 buttons max. |
| Choose target player | ModalFormData dropdown | Re-resolve target after submit. |
| Enter payment amount | ModalFormData textField or slider | Text supports arbitrary value; slider is faster but constrained. |
| Confirm expensive trade | MessageFormData | Yes/No; re-check money after confirm. |
| NPC trade catalog | ActionFormData | Categories/pages if long. |
| Corpse loot list | ActionFormData | Paginate; include Take All. |
| Patch notes | ActionFormData | Latest first; short bullets. |
| Leaderboard/stat details | ActionFormData | Menu, no real-time PvP info. |
| Admin tool selection | ActionFormData | Hidden behind admin permission. |
| Admin numeric editing | ModalFormData | Validate amount and target. |
| Important zone event | Title/subtitle | Entry/exit only, not every tick. |
| Live status | Actionbar | One owner system only. |
| Deep branded layout | JSON UI | Dedicated advanced PR only. |

## Menu architecture template

Every EFZ menu should follow this structure:

1. Title: clear screen name.
2. Body: one-sentence purpose or short bullet summary.
3. Primary button first.
4. Related buttons grouped.
5. Dangerous/destructive actions last and confirmed.
6. `Back` or `Close` where appropriate.
7. All `show()` calls handle cancel and errors.

Example structure:

```js
const form = new ActionFormData()
  .title("EFZ")
  .body("Choose an EFZ service.")
  .button("§lInformation\n§rGameplay, rules, help")
  .button("Payments")
  .button("Statistics")
  .button("Patch Notes")
  .button("EFZ");
```

## Form flow templates

### Safe ActionForm flow

```js
async function showMenu(player) {
  const result = await new ActionFormData()
    .title("Menu")
    .body("Choose an action.")
    .button("Action")
    .button("Back")
    .show(player);

  if (result.canceled || result.selection === undefined) return;

  switch (result.selection) {
    case 0: return showAction(player);
    case 1: return undefined;
    default: return undefined;
  }
}
```

### Safe ModalForm flow

```js
async function showPayment(player) {
  const targets = world.getAllPlayers().filter((p) => p.id !== player.id);
  if (!targets.length) {
    player.sendMessage("§e[EFZ] No online players to pay.");
    return;
  }

  const result = await new ModalFormData()
    .title("Payments")
    .dropdown("Player", targets.map((p) => p.name), 0)
    .textField("Amount", "Example: 50", "")
    .show(player);

  if (result.canceled || !result.formValues) return;

  const [targetIndex, rawAmount] = result.formValues;
  const targetName = targets[targetIndex]?.name;
  const target = world.getAllPlayers().find((p) => p.name === targetName);
  const amount = Number.parseInt(String(rawAmount), 10);

  if (!target || !Number.isInteger(amount) || amount <= 0) {
    player.sendMessage("§c[EFZ] Payment failed. Check player and amount.");
    return;
  }

  // Re-check sender balance here before transferring.
}
```

### Confirmation flow

```js
async function confirm(player, title, body) {
  const result = await new MessageFormData()
    .title(title)
    .body(body)
    .button1("Confirm")
    .button2("Cancel")
    .show(player);

  return !result.canceled && result.selection === 0;
}
```

## Icon button rules

- Use RP icon paths only after confirming the image exists and is included in the active resource pack.
- Icons should be simple, high contrast, and recognizable at small mobile sizes.
- Missing icons must not break gameplay. If unsure, ship text-only first.
- Keep icon path constants in one data file if many menus use them.
- Validate icon references with a tool when icon usage grows.

## Mobile UX rules

- Test with touch input, not only keyboard/mouse.
- Avoid long labels; mobile truncation makes menus feel broken.
- Avoid huge modal forms; split into steps.
- Avoid chat spam because mobile chat covers the screen.
- Make the most common action the first button.
- Prefer dropdowns over manually typing player names.
- Prefer sliders or preset amount buttons for common payment/admin values if typing is annoying.
- Add clear failure messages because mobile users may not see console logs.

## High-pressure UI patterns

### Corpse looting
Goal: fast decisions under danger.

- Page list: up to a safe number of stacks per page.
- Always show current page count.
- Buttons: `Take All`, stack entries, `Previous`, `Next`, `Back`.
- After taking one stack, refresh same page if loot remains.
- If inventory is full, drop overflow and message once.
- If corpse vanished, close cleanly with a short message.

### NPC trading
Goal: clear economy decisions.

- Show NPC role/title.
- Button labels should include item amount and price/reward.
- Disable impossible trades only if the API pattern supports it; otherwise show denial after tap.
- Re-check money/inventory after selection.
- Use data-driven category names later: Medicine, Food, Gear, Black Market, Sellables.

### Admin tools
Goal: speed and safety.

- Main admin menu categories: Economy, Player State, Reports, Zones, Debug.
- Dangerous actions require `MessageFormData` confirmation.
- Every action logs to admin/console with actor, target, before, after.
- Normal players must never see admin-only menu entries.

## HUD/actionbar design

EFZ actionbar should stay tactical and minimal:

- Money always: `§6$12345`.
- Active statuses only: `INFECTION`, `BROKEN LEG`, `RADIATION`, `RADIATION L1/L2/L3`.
- No `HEALTHY` label if the user wants minimal HUD.
- No kills/deaths/KD in real time.
- Compose all status segments in one owner system:
  - `$12345`
  - `$12345 | INFECTION`
  - `$12345 | INFECTION + BROKEN LEG + RADIATION L2`

## Title/subtitle design

Use for state changes, not status loops:

- `§cRADIATION ZONE` when entering.
- `§aLEFT RADIATION ZONE` when leaving.
- `§aSAFE ZONE` when entering.
- `§eLEAVING SAFE ZONE` / immunity message when exiting.
- Broken leg/infection can use a one-time warning when applied.

Avoid repeating titles every interval.

## JSON UI decision gate

Only use JSON UI if all are true:

1. The requested UI cannot be solved with forms/actionbar/title.
2. The feature is important enough to justify fragility.
3. A resource-pack UI prototype can be tested on mobile.
4. There is a rollback path.
5. The UI files are isolated and documented.
6. The user understands it may break with game updates or pack conflicts.

Good JSON UI candidates later:
- branded loading/title screens,
- custom menu backgrounds,
- specialized non-gameplay decorative screens.

Bad JSON UI candidates now:
- permanent right-side live status panel,
- complex inventory replacements,
- gameplay-critical flow that must never break.

## UI QA checklist

For every new or changed UI, test:

- Opens from intended trigger.
- Cancel/close path.
- Reopen after cancel.
- Invalid input.
- Missing/empty target lists.
- Player logs out while form is open.
- Target logs out while form is open.
- Money changes while form is open.
- Inventory full while action is confirmed.
- Entity/corpse disappears while form is open.
- Mobile readability and tap accuracy.
- No chat/actionbar/title spam.
- No script errors in content log.

## What “better than big servers” means for EFZ

Do not copy flashy UI blindly. Beat big servers by being more consistent, faster, cleaner, and more reliable for this specific hardcore game:

- Fewer taps.
- Less clutter.
- Better survival tension.
- Stronger failure handling.
- Mobile readability.
- Consistent style.
- No broken forms.
- No misleading buttons.
- No UI that gives unfair combat intel.

## Release rule

A UI is not complete until it has:

1. Stable script form implementation.
2. Cancel/error handling.
3. Mobile-length labels.
4. Validation of all player-entered data.
5. Re-checks for stale target/money/inventory/entity state.
6. In-game QA notes in the final/PR response.
