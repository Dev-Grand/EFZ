import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { SCOREBOARD_OBJECTIVES } from "../data/constants.js";

import { BUYER_TRADES, SELLER_TRADES } from "../data/trades.js";

const TRADE_COOLDOWN_TICKS = 10;
const tradeCooldown = new Map();

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
  getMoneyObjective().setScore(player, value);
}

function getInventory(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function countItem(player, typeId) {
  const inventory = getInventory(player);
  if (!inventory) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i);
    if (item?.typeId === typeId) {
      count += item.amount;
    }
  }

  return count;
}

function removeItems(player, typeId, amount) {
  const inventory = getInventory(player);
  if (!inventory) {
    return false;
  }

  let remaining = amount;
  for (let i = 0; i < inventory.size && remaining > 0; i++) {
    const item = inventory.getItem(i);
    if (item?.typeId !== typeId) {
      continue;
    }

    const removed = Math.min(item.amount, remaining);
    const nextAmount = item.amount - removed;
    remaining -= removed;

    if (nextAmount <= 0) {
      inventory.setItem(i, undefined);
    } else {
      item.amount = nextAmount;
      inventory.setItem(i, item);
    }
  }

  return remaining === 0;
}

function giveItem(player, typeId, amount) {
  const inventory = getInventory(player);
  if (!inventory) {
    return false;
  }

  const leftover = inventory.addItem(new ItemStack(typeId, amount));
  if (leftover) {
    player.dimension.spawnItem(leftover, player.location);
  }

  return true;
}

function getPairKey(player, npc) {
  return `${player.id}:${npc.id}`;
}

function isCoolingDown(player, npc) {
  const key = getPairKey(player, npc);
  const now = system.currentTick;
  const until = tradeCooldown.get(key) ?? 0;

  if (now < until) {
    return true;
  }

  tradeCooldown.set(key, now + TRADE_COOLDOWN_TICKS);
  return false;
}

function formatItem(itemId) {
  return itemId.replace(/^.+:/, "").replaceAll("_", " ");
}

function getNpcName(npc) {
  return npc.typeId.replace("efz:", "").replaceAll("_", " ");
}

function buildSellerLabel(trade) {
  return `Buy ${trade.amount} ${formatItem(trade.itemId)} - $${trade.price}`;
}

function buildBuyerLabel(trade) {
  return `Sell ${trade.amount} ${formatItem(trade.itemId)} - $${trade.reward}`;
}

function handleSellerTrade(player, trade) {
  const money = getMoney(player);
  if (money < trade.price) {
    player.sendMessage(`Need $${trade.price} for ${trade.amount} ${formatItem(trade.itemId)}.`);
    return;
  }

  setMoney(player, money - trade.price);
  giveItem(player, trade.itemId, trade.amount);
  player.sendMessage(`Bought ${trade.amount} ${formatItem(trade.itemId)} for $${trade.price}.`);
}

function handleBuyerTrade(player, trade) {
  if (countItem(player, trade.itemId) < trade.amount) {
    player.sendMessage(`Need ${trade.amount} ${formatItem(trade.itemId)} to sell here.`);
    return;
  }

  if (!removeItems(player, trade.itemId, trade.amount)) {
    player.sendMessage(`Could not remove ${formatItem(trade.itemId)} from inventory.`);
    return;
  }

  setMoney(player, getMoney(player) + trade.reward);
  player.sendMessage(`Sold ${trade.amount} ${formatItem(trade.itemId)} for $${trade.reward}.`);
}

async function showTradeMenu(player, npc, sellerTrades, buyerTrades) {
  const form = new ActionFormData()
    .title(`Trade: ${getNpcName(npc)}`)
    .body(`Balance: $${getMoney(player)}\nSelect one trade option:`);

  const options = [];

  for (const trade of sellerTrades) {
    form.button(buildSellerLabel(trade));
    options.push({ kind: "seller", trade });
  }

  for (const trade of buyerTrades) {
    form.button(buildBuyerLabel(trade));
    options.push({ kind: "buyer", trade });
  }

  if (!options.length) {
    return;
  }

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) {
    return;
  }

  const selected = options[result.selection];
  if (!selected) {
    return;
  }

  if (selected.kind === "seller") {
    handleSellerTrade(player, selected.trade);
    return;
  }

  handleBuyerTrade(player, selected.trade);
}

export function registerNpcTradeSystem() {
  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const npc = event.target;

    if (!player || !npc || isCoolingDown(player, npc)) {
      return;
    }

    const sellerTrades = SELLER_TRADES[npc.typeId] ?? [];
    const buyerTrades = BUYER_TRADES[npc.typeId] ?? [];

    if (!sellerTrades.length && !buyerTrades.length) {
      return;
    }

    void showTradeMenu(player, npc, sellerTrades, buyerTrades).catch((error) => {
      console.warn(`[EFZ NPC Trades] Failed to show trade menu: ${error}`);
    });
  });
}
