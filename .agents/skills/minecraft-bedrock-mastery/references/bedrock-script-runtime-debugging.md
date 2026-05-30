# Bedrock Script API Runtime Debugging Reference

Use this reference when EFZ script code passes static checks but fails in Minecraft, especially for menus, admin commands, scoreboards, radiation/safe-zone logic, grave looting, NPC trading, or multiplayer/mobile behavior.

## Official source anchors

Verify details against current docs when the target Bedrock version changes:

- Introduction to Scripting: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/introduction
- Script Error Handling Best Practices: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/error-handling
- Developer Tools for Minecraft: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/developer-tools
- `/script` command: https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/script
- Multiplayer-aware scripts: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/multiplayer-scripts
- Troubleshooting Add-On bugs: https://learn.microsoft.com/en-us/minecraft/creator/documents/troubleshootingaddons
- Custom Commands: https://learn.microsoft.com/en-us/minecraft/creator/documents/customcommands

## Runtime mental model

1. Scripts run server-side, not client-side. UI is shown to a player, but script state is server-owned.
2. One import/module error can prevent the whole entrypoint from registering systems.
3. Bedrock runtime restrictions are stricter than plain Node.js:
   - Some APIs can only be called in certain phases.
   - Before-event handlers may be read-only/restricted.
   - Form `.show()` should be scheduled after chat cancellation via `system.run`.
   - Players/entities can become invalid between opening a form and receiving a result.
4. Static checks catch syntax, not API availability, module version mismatch, pack load order, stale imports, or world/runtime restrictions.
5. Multiplayer is always the default assumption for EFZ, even when testing alone.

## First-response checklist when scripts do not work

1. Confirm the script pack is active in the world and at the top/expected order.
2. Confirm `EFZ_Scripts_BP/manifest.json` has:
   - a script module with `entry: "scripts/main.js"`,
   - `@minecraft/server` dependency,
   - `@minecraft/server-ui` dependency when forms are imported.
3. Enable and inspect Minecraft Content Log / script error output.
4. Add a boot marker if needed: `console.warn("[EFZ Scripts] boot marker ...")`.
5. If no boot marker appears, debug manifest, entry path, module version, or pack activation first.
6. If boot marker appears but a feature fails, debug system registration and event subscription next.
7. If a chat command fails, test exact chat text, lowercase/uppercase handling, event cancellation, and `system.run` scheduling.
8. If a form does not open, catch `.show()` errors and send a player-facing fallback message.
9. If a feature uses scoreboards, verify objectives exist and player scores are initialized.
10. If a failure only happens on mobile, check form length, pack cache, resource pressure, and actionbar/title spam.

## Error handling pattern

Use small guarded boundaries around independent runtime loops and async UI operations. Do not wrap imports.

```js
function safeRun(context, fn) {
  try {
    return fn();
  } catch (error) {
    console.warn(`[EFZ ${context}] ${error}`);
    if (error?.stack) console.warn(error.stack);
    return undefined;
  }
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    safeRun(`HUD:${player.name}`, () => updateHud(player));
  }
}, 40);
```

For forms:

```js
system.run(() => {
  void openMenu(player).catch((error) => {
    console.warn(`[EFZ Menu] ${error}`);
    player.sendMessage("§c[EFZ] Menu failed to open. Close chat and try again.");
  });
});
```

## Form/UI runtime rules

- Always handle `result.canceled` and `selection === undefined`.
- Re-resolve target players/entities after the form returns; do not trust stale object references.
- Re-check money, inventory space, entity validity, and permissions after the form returns.
- Use `system.run` after canceling chat before showing forms.
- Avoid opening a second form before the first resolves.
- Avoid long body text on mobile; split details into deeper pages.
- Log form failures with enough context: player name, menu id, target id, and selection.

## Scoreboard runtime rules

- Use helper functions for get-or-create objectives.
- `getScore` can throw if a participant has no score; always catch or default.
- Clamp money to `>= 0`.
- Avoid using live kill counters in actionbar for hardcore PvP; put them in stats menus.
- For money transfers, re-check balance after the payment form returns.
- For admin commands, support reliable `efz_admin` tags because OP field behavior may vary by environment.

## Entity/player lifetime rules

- Player/entity objects can become invalid after delays, form awaits, dimension changes, death, or logout.
- Store stable ids/names in long flows, then re-find the live object before applying effects.
- For death/grave flows, clone item stacks before clearing inventory.
- For corpse entity tags, validate encoded tag format before decoding.
- Always handle full inventory with fallback item drop behavior.

## Event design rules

- Prefer `afterEvents` for gameplay reactions that mutate state.
- Use `beforeEvents` only when canceling or intercepting is required, then defer mutation with `system.run`.
- Keep event handlers short; call dedicated functions with clear context labels.
- Never assume event fields are present. Check `event.damageSource`, `damagingEntity`, `deadEntity`, etc.
- For PvP protection, check both attacker and victim state because projectiles or delayed damage can cross boundaries.

## Interval/performance rules

- Avoid per-tick loops unless required. Prefer 20, 40, or 60 tick intervals for EFZ HUD/status systems.
- Split heavy work across ticks if scanning many entities/players.
- Cache only safe state; clear maps on `playerLeave`.
- Beware memory-only maps for hardcore persistent systems. Use scoreboards/dynamic properties/entity tags when state must survive restart.
- Profile if a loop touches every player and every entity, or if mobile stutter appears.

## Debug command toolkit to add/maintain

Admin-only test commands should exist for systems that are hard to reproduce manually:

- `!efz debug status <player>`: money, tags, radiation, infection, broken leg.
- `!efz debug objectives`: list expected scoreboard objectives and whether they exist.
- `!efz debug radiation <player>`: show exposure, zone id, gas mask status.
- `!efz debug safezone <player>`: show inside/exit-immunity state.
- `!efz debug grave`: spawn test corpse from current inventory or at player location.
- `!efz debug ui`: open every public/admin menu in a test sequence.

Keep debug tools admin-only and short; never expose private moderation data to normal players.

## EFZ runtime test matrix

Run this before calling a script feature stable:

### Boot/load
- Fresh world load.
- `/reload` if supported by environment.
- Remove/reimport packs to avoid stale cache.
- Confirm boot marker and no script errors.

### Menus/admin
- `!efz`, `!EFZ`, cancel, reopen.
- Payment invalid amount, too much money, target logout, successful transfer.
- Admin command without tag, with `efz_admin`, and if possible OP-only.
- `!efz stats <user>` with exact and missing user.

### HUD/status
- Money only.
- Infection only.
- Broken leg only.
- Radiation zone no stage.
- Radiation L1/L2/L3.
- Multiple statuses together.

### Grave/corpse
- Death with empty inventory.
- Death with full inventory + armor + offhand.
- Loot one stack, take all, full looter inventory overflow.
- Body despawn timer and relog/reload behavior.

### Safe zone/radiation
- Inside→inside PvP damage.
- Inside→outside damage.
- Outside→inside damage.
- Exit immunity for 5 seconds.
- Radiation entry/exit messages.
- Turtle helmet gas-mask mitigation.

## Common failure signatures

- Nothing works: script pack not active, manifest entry/dependency issue, import error in `main.js` chain.
- One system works but another does not: registration order or caught registration error.
- Chat command prints in chat: `beforeEvents.chatSend` did not register or did not cancel.
- Chat command disappears but no menu: form `.show()` failure, missing server-ui dependency, called in wrong phase, player chat UI still active.
- Money/admin command denies OP: permission field mismatch; use `/tag <player> add efz_admin`.
- HUD missing radiation: radiation system not registered, zone coords/dimension mismatch, exposure stage is 0 and HUD only shows staged values.
- State resets after restart: state is stored only in `Map`; convert to scoreboard/dynamic property/entity tags if persistence is required.

## Release rule

Do not ship a script-heavy feature based only on `node --check`. It needs at least one targeted in-game test pass and a short list of tested scenarios in the PR/final response.
