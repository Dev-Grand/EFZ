import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { ItemLockMode, ItemStack, system, world } from "@minecraft/server";
import { EFZ_LINKS } from "../data/links.js";
import { PATCH_NOTES } from "../data/patchNotes.js";
import { EFZ_MENU_ITEM_ID, SCOREBOARD_OBJECTIVES } from "../data/constants.js";

const ADMIN_COMMANDS = [
  "!efz add money <amount> <user>",
  "!efz remove money <amount> <user>",
  "!efz set money <amount> <user>",
  "!efz view money <user>",
  "!efz stats <user>"
];

const STAT_LABELS = [
  [SCOREBOARD_OBJECTIVES.kills, "Kills"],
  [SCOREBOARD_OBJECTIVES.deaths, "Deaths"],
  [SCOREBOARD_OBJECTIVES.zombieKills, "Zombie Kills"],
  [SCOREBOARD_OBJECTIVES.moneyEarned, "Money Earned", "$"],
  [SCOREBOARD_OBJECTIVES.moneySpent, "Money Spent", "$"],
  [SCOREBOARD_OBJECTIVES.playtimeMinutes, "Playtime", "", " min"]
];

const COMMAND_THROTTLE_MS = 1000;
const MENU_ITEM_TARGET_SLOT = 8;
const lastCommandAtByPlayerId = new Map();

function normalizeCommandMessage(rawMessage) {
  return String(rawMessage ?? "").trim().toLowerCase();
}

function shouldThrottleCommand(player) {
  const now = Date.now();
  const previous = lastCommandAtByPlayerId.get(player.id) ?? 0;
  if (now - previous < COMMAND_THROTTLE_MS) return true;

  lastCommandAtByPlayerId.set(player.id, now);
  return false;
}

function getInventoryContainer(player) {
  try {
    return player.getComponent("minecraft:inventory")?.container;
  } catch {
    return undefined;
  }
}

function createMenuItem() {
  const item = new ItemStack(EFZ_MENU_ITEM_ID, 1);
  item.lockMode = ItemLockMode.slot;
  item.keepOnDeath = true;
  item.nameTag = "EFZ Gear";
  return item;
}

function isMenuItem(item) {
  return item?.typeId === EFZ_MENU_ITEM_ID;
}

function findMenuItemSlots(container) {
  const slots = [];
  for (let slot = 0; slot < container.size; slot++) {
    if (isMenuItem(container.getItem(slot))) slots.push(slot);
  }
  return slots;
}

function findFirstEmptySlot(container) {
  for (let slot = 0; slot < container.size; slot++) {
    if (!container.getItem(slot)) return slot;
  }
  return undefined;
}

function lockExistingMenuItem(container, slot) {
  const item = container.getItem(slot);
  if (!isMenuItem(item)) return;

  item.lockMode = ItemLockMode.slot;
  item.keepOnDeath = true;
  if (!item.nameTag) item.nameTag = "EFZ Gear";
  container.setItem(slot, item);
}

function ensureMenuItem(player) {
  const container = getInventoryContainer(player);
  if (!container) return;

  const menuSlots = findMenuItemSlots(container);
  if (menuSlots.length > 0) {
    lockExistingMenuItem(container, menuSlots[0]);
    for (const duplicateSlot of menuSlots.slice(1)) {
      container.setItem(duplicateSlot, undefined);
    }
    return;
  }

  const targetSlot = !container.getItem(MENU_ITEM_TARGET_SLOT)
    ? MENU_ITEM_TARGET_SLOT
    : findFirstEmptySlot(container);

  if (targetSlot === undefined) {
    player.sendMessage("§c[EFZ] Inventory full. Free one slot to receive the EFZ Gear menu item.");
    return;
  }

  container.setItem(targetSlot, createMenuItem());
}

function getMoneyObjective() {
  return world.scoreboard.getObjective(SCOREBOARD_OBJECTIVES.money)
    ?? world.scoreboard.addObjective(SCOREBOARD_OBJECTIVES.money, "EFZ Money");
}

function getMoney(player) {
  try {
    return getMoneyObjective().getScore(player) ?? 0;
  } catch {
    return 0;
  }
}

function setMoney(player, value) {
  getMoneyObjective().setScore(player, Math.max(0, Math.floor(value)));
}

function getScore(objectiveId, player, fallback = 0) {
  try {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (!objective) return fallback;
    return objective.getScore(player) ?? fallback;
  } catch {
    return fallback;
  }
}

function isAdmin(player) {
  if (player.hasTag("efz_admin")) return true;

  try {
    if (typeof player.isOp === "function" && player.isOp()) return true;
    if (typeof player.isOp === "boolean" && player.isOp) return true;
  } catch {
    // Continue through the more stable permission-level checks below.
  }

  try {
    if (typeof player.playerPermissionLevel === "number" && player.playerPermissionLevel >= 2) return true;
    if (typeof player.commandPermissionLevel === "number" && player.commandPermissionLevel >= 2) return true;
  } catch {
    // Some engine versions throw when reading permission fields from scripts.
  }

  return false;
}

function findOnlinePlayer(name) {
  const normalized = name.trim().toLowerCase();
  return world.getAllPlayers().find((player) => player.name.toLowerCase() === normalized);
}

function formatStatsBody(player) {
  const kills = getScore(SCOREBOARD_OBJECTIVES.kills, player);
  const deaths = getScore(SCOREBOARD_OBJECTIVES.deaths, player);
  const money = getScore(SCOREBOARD_OBJECTIVES.money, player);
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : String(kills);

  const lines = [
    `Player: ${player.name}`,
    `Money: $${money}`,
    `Kills: ${kills}`,
    `Deaths: ${deaths}`,
    `K/D: ${kd}`
  ];

  for (const [objectiveId, label, prefix = "", suffix = ""] of STAT_LABELS.slice(2)) {
    lines.push(`${label}: ${prefix}${getScore(objectiveId, player)}${suffix}`);
  }

  return lines.join("\n");
}

async function showInformation(player) {
  await new ActionFormData()
    .title("Information")
    .body("EFZ is a hardcore DayZ-style survival server.\n\nGameplay:\n- Dying is high-risk: loot can be taken instantly.\n- Use safe zones for trading and recovery.\n- Manage infection, injuries, and economy carefully.\n\nRules:\n1) No cheating/exploits.\n2) No hate speech.\n3) Respect admins decisions.\n4) Hardcore gameplay: death has consequences.\n\nQuick Help:\n- Keep meds and splints ready.\n- Use traders smartly.\n- Travel light in PvP zones.\n- Build money through loot + trading.")
    .button("Back")
    .show(player);
}

async function showEfzLinks(player) {
  const body = EFZ_LINKS.map((link) => `${link.label}: ${link.value}`).join("\n");
  await new ActionFormData()
    .title("EFZ")
    .body(body || "Soon.")
    .button("Back")
    .show(player);
}

async function showPaymentsMenu(player) {
  const targets = world.getAllPlayers().filter((p) => p.id !== player.id);
  if (!targets.length) {
    player.sendMessage("§e[EFZ] No other online players to pay.");
    return;
  }

  const targetNames = targets.map((p) => p.name);
  const form = new ModalFormData()
    .title("Payments")
    .dropdown("Choose player", targetNames, 0)
    .textField("Amount", "e.g. 50", "");

  const result = await form.show(player);
  if (result.canceled) return;

  const [targetIndex, amountText] = result.formValues;
  const amount = Number.parseInt(String(amountText), 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    player.sendMessage("§c[EFZ] Invalid amount.");
    return;
  }

  const target = targets[targetIndex];
  if (!target) {
    player.sendMessage("§e[EFZ] Selected player is no longer available.");
    return;
  }

  const senderMoney = getMoney(player);
  if (senderMoney < amount) {
    player.sendMessage(`§c[EFZ] Not enough money. Balance: $${senderMoney}.`);
    return;
  }

  setMoney(player, senderMoney - amount);
  setMoney(target, getMoney(target) + amount);
  player.sendMessage(`§a[EFZ] You sent $${amount} to ${target.name}.`);
  target.sendMessage(`§a[EFZ] ${player.name} sent you $${amount}.`);
}

async function showStats(player, target = player) {
  await new ActionFormData()
    .title(target.id === player.id ? "Statistics" : `Statistics: ${target.name}`)
    .body(formatStatsBody(target))
    .button("Back")
    .show(player);
}

async function showPatchNotes(player) {
  const body = PATCH_NOTES.map((note) => {
    const bullets = note.items.map((item) => `- ${item}`).join("\n");
    return `${note.version} — ${note.title}\n${bullets}`;
  }).join("\n\n");

  await new ActionFormData()
    .title("Patch Notes")
    .body(body)
    .button("Back")
    .show(player);
}

async function showPlayerMenu(player) {
  const form = new ActionFormData()
    .title("EFZ")
    .body("Information is the main hub. Use the quick buttons below for common actions.")
    .button("§lInformation\n§rGameplay, rules, and quick help")
    .button("Payments")
    .button("Statistics")
    .button("Patch Notes")
    .button("EFZ");

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;

  switch (result.selection) {
    case 0: return showInformation(player);
    case 1: return showPaymentsMenu(player);
    case 2: return showStats(player);
    case 3: return showPatchNotes(player);
    case 4: return showEfzLinks(player);
    default: return undefined;
  }
}

async function showAdminMenu(player) {
  await new ActionFormData()
    .title("EFZ Admin")
    .body(`Admin commands:\n${ADMIN_COMMANDS.join("\n")}`)
    .button("Close")
    .show(player);
}

function sendAdminHelp(player) {
  player.sendMessage(`§e[EFZ Admin] Commands:\n${ADMIN_COMMANDS.join("\n")}`);
}

function parseAmount(rawAmount) {
  const amount = Number.parseInt(rawAmount, 10);
  if (!Number.isInteger(amount) || amount < 0) return null;
  return amount;
}

function sendMoneyResult(admin, action, target, amount, before, after) {
  admin.sendMessage(`§a[EFZ Admin] ${action} money for ${target.name}: $${before} -> $${after}${amount !== null ? ` (amount: $${amount})` : ""}.`);
  target.sendMessage(`§e[EFZ] Your money was updated by an admin: $${before} -> $${after}.`);
}

function executeAdminCommand(player, rawMessage) {
  if (!isAdmin(player)) {
    player.sendMessage("§c[EFZ] Admin only command.");
    return;
  }

  const parts = rawMessage.trim().split(/\s+/);
  if (parts.length < 2 || parts[0].toLowerCase() !== "!efz") return;

  const action = parts[1]?.toLowerCase();
  const subject = parts[2]?.toLowerCase();

  if (action === "admin" || action === "help") {
    sendAdminHelp(player);
    return;
  }

  if (action === "stats") {
    const targetName = parts.slice(2).join(" ");
    const target = findOnlinePlayer(targetName);
    if (!target) {
      player.sendMessage(`§c[EFZ Admin] Online player not found: ${targetName || "<missing>"}.`);
      return;
    }

    player.sendMessage(`§e[EFZ Admin]\n${formatStatsBody(target)}`);
    return;
  }

  if (!["add", "remove", "set", "view"].includes(action) || subject !== "money") {
    sendAdminHelp(player);
    return;
  }

  if (action === "view") {
    const targetName = parts.slice(3).join(" ");
    const target = findOnlinePlayer(targetName);
    if (!target) {
      player.sendMessage(`§c[EFZ Admin] Online player not found: ${targetName || "<missing>"}.`);
      return;
    }

    player.sendMessage(`§e[EFZ Admin] ${target.name} has $${getMoney(target)}.`);
    return;
  }

  const amount = parseAmount(parts[3]);
  const targetName = parts.slice(4).join(" ");
  if (amount === null) {
    player.sendMessage("§c[EFZ Admin] Amount must be a whole number 0 or higher.");
    return;
  }

  const target = findOnlinePlayer(targetName);
  if (!target) {
    player.sendMessage(`§c[EFZ Admin] Online player not found: ${targetName || "<missing>"}.`);
    return;
  }

  const before = getMoney(target);
  let after = before;
  if (action === "add") after = before + amount;
  if (action === "remove") after = Math.max(0, before - amount);
  if (action === "set") after = amount;

  setMoney(target, after);
  sendMoneyResult(player, action, target, amount, before, after);
}

function openPlayerMenuFromTrigger(player, { throttle = true } = {}) {
  if (throttle && shouldThrottleCommand(player)) return;

  system.run(() => {
    ensureMenuItem(player);
    void showPlayerMenu(player).catch((error) => {
      console.warn(`[EFZ Menu] Failed: ${error}`);
      player.sendMessage("§c[EFZ] Menu failed to open. Please close chat/inventory and try the Gear item again.");
    });
  });
}

function handleEfzChatCommand(event, { canCancel }) {
  const rawMessage = String(event.message ?? "").trim();
  const message = normalizeCommandMessage(rawMessage);
  const player = event.sender;

  if (!player || !message.startsWith("!efz")) return false;
  if (message !== "!efz" && message !== "!efzadmin" && !message.startsWith("!efz ")) return false;
  if (shouldThrottleCommand(player)) return true;

  if (canCancel) event.cancel = true;

  if (!canCancel) {
    player.sendMessage("§7[EFZ] Opening menu. If you see your command in chat, your runtime is using fallback chat handling.");
  }

  if (message === "!efz") {
    openPlayerMenuFromTrigger(player, { throttle: false });
    return true;
  }

  if (message === "!efzadmin") {
    system.run(() => {
      if (!isAdmin(player)) {
        player.sendMessage("§c[EFZ] Admin only command.");
        return;
      }

      void showAdminMenu(player).catch((error) => {
        console.warn(`[EFZ Admin] Failed: ${error}`);
        player.sendMessage("§c[EFZ] Admin menu failed to open. Try the text commands instead.");
      });
    });
    return true;
  }

  system.run(() => executeAdminCommand(player, rawMessage));
  return true;
}

export function registerPlayerMenuSystem() {
  system.beforeEvents.startup.subscribe((event) => {
    event.itemComponentRegistry.registerCustomComponent("efz:gear_menu", {
      onUse: ({ source }) => {
        if (source) openPlayerMenuFromTrigger(source);
      }
    });
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    system.run(() => ensureMenuItem(event.player));
  });

  world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack?.typeId !== EFZ_MENU_ITEM_ID) return;
    openPlayerMenuFromTrigger(event.source);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      ensureMenuItem(player);
    }
  }, 100);

  const beforeChat = world.beforeEvents?.chatSend;
  const afterChat = world.afterEvents?.chatSend;

  if (beforeChat?.subscribe) {
    beforeChat.subscribe((event) => {
      handleEfzChatCommand(event, { canCancel: true });
    });
    console.warn("[EFZ Menu] Registered before-chat command handler.");
  } else {
    console.warn("[EFZ Menu] beforeEvents.chatSend unavailable; using fallback chat handler.");
  }

  if (afterChat?.subscribe) {
    afterChat.subscribe((event) => {
      handleEfzChatCommand(event, { canCancel: false });
    });
    console.warn("[EFZ Menu] Registered after-chat fallback command handler.");
  }

  world.afterEvents.playerLeave.subscribe((event) => {
    lastCommandAtByPlayerId.delete(event.playerId);
  });
}
