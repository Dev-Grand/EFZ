import { ItemStack, system, world } from "@minecraft/server";
import { SCOREBOARD_OBJECTIVES } from "../data/constants.js";

const SELLER_NPCS = new Set([
  "efz:monolith",
  "efz:meudaz",
  "efz:maverick"
]);

const BUYER_NPCS = new Set([
  "efz:fantom",
  "efz:razon"
]);

const DIAMOND_ID = "minecraft:diamond";
const SELL_PRICE = 20;
const BUY_PRICE = 35;
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

function isCoolingDown(player, npc) {
  const key = `${player.id}:${npc.id}`;
  const now = system.currentTick;
  const until = tradeCooldown.get(key) ?? 0;

  if (now < until) {
    return true;
  }

  tradeCooldown.set(key, now + TRADE_COOLDOWN_TICKS);
  return false;
}

function buyDiamond(player) {
  const money = getMoney(player);
  if (money < SELL_PRICE) {
    player.sendMessage(`You need $${SELL_PRICE} to buy 1 diamond.`);
    return;
  }

  setMoney(player, money - SELL_PRICE);
  giveItem(player, DIAMOND_ID, 1);
  player.sendMessage(`Bought 1 diamond for $${SELL_PRICE}.`);
}

function sellDiamond(player) {
  if (countItem(player, DIAMOND_ID) < 1) {
    player.sendMessage("You need 1 diamond to sell.");
    return;
  }

  if (!removeItems(player, DIAMOND_ID, 1)) {
    player.sendMessage("Could not remove the diamond from your inventory.");
    return;
  }

  setMoney(player, getMoney(player) + BUY_PRICE);
  player.sendMessage(`Sold 1 diamond for $${BUY_PRICE}.`);
}

export function registerNpcTradeSystem() {
  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const npc = event.target;

    if (!player || !npc || isCoolingDown(player, npc)) {
      return;
    }

    if (SELLER_NPCS.has(npc.typeId)) {
      buyDiamond(player);
      return;
    }

    if (BUYER_NPCS.has(npc.typeId)) {
      sellDiamond(player);
    }
  });
}
