import { InputPermissionCategory, ItemStack, system, world } from "@minecraft/server";
import {
  BROKEN_LEG_EFFECTS,
  BROKEN_LEG_TAG,
  DEAD_BODY_ENTITY_ID,
  INFECTION_DISEASES,
  INFECTION_TAGS
} from "../data/constants.js";
import { spawnDeadBodyForPlayer } from "./survivorSkins.js";

const GRAVE_LIFETIME_TICKS = 15 * 60 * 20;
const graveInventoryByEntityId = new Map();
const pendingRespawnClear = new Set();

function getInventory(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function cloneItem(item) {
  if (!item) {
    return undefined;
  }

  if (typeof item.clone === "function") {
    return item.clone();
  }

  return new ItemStack(item.typeId, item.amount);
}

function captureAndClearInventory(player) {
  const inventory = getInventory(player);
  if (!inventory) {
    return [];
  }

  const items = [];
  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i);
    if (!item) {
      continue;
    }

    items.push(cloneItem(item));
    inventory.setItem(i, undefined);
  }

  return items.filter(Boolean);
}

function giveItems(player, items) {
  const inventory = getInventory(player);
  if (!inventory) {
    return false;
  }

  for (const item of items) {
    const leftover = inventory.addItem(cloneItem(item));
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
    }
  }

  return true;
}

function removeEffect(player, effectId) {
  try {
    player.removeEffect(effectId);
  } catch {
    try {
      player.removeEffect(`minecraft:${effectId}`);
    } catch {
      // Missing effects are fine.
    }
  }
}

function enableJump(player) {
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
    return;
  } catch {
    // Fall back to command for runtimes where input permissions are restricted.
  }

  player.runCommandAsync("inputpermission set @s jump enabled").catch(() => {});
}

function clearEfzStatusEffects(player) {
  player.removeTag(BROKEN_LEG_TAG);
  removeEffect(player, BROKEN_LEG_EFFECTS.slowness.identifier);
  enableJump(player);

  for (const tag of INFECTION_TAGS) {
    player.removeTag(tag);
  }

  for (const disease of INFECTION_DISEASES) {
    removeEffect(player, disease.effect);
  }
}

function despawnBody(body) {
  graveInventoryByEntityId.delete(body.id);

  try {
    body.remove();
  } catch {
    // Body may already have been looted or unloaded.
  }
}

function spawnLootBody(player, items) {
  const body = spawnDeadBodyForPlayer(player);
  graveInventoryByEntityId.set(body.id, items);

  system.runTimeout(() => {
    despawnBody(body);
  }, GRAVE_LIFETIME_TICKS);
}

function lootBody(player, body) {
  const items = graveInventoryByEntityId.get(body.id);
  if (!items) {
    player.sendMessage("This body has no loot.");
    return;
  }

  if (!giveItems(player, items)) {
    player.sendMessage("Could not open this body.");
    return;
  }

  player.sendMessage("You looted the body.");
  despawnBody(body);
}

export function registerGraveSystem() {
  system.run(() => {
    world.getDimension("overworld").runCommandAsync("gamerule keepinventory true").catch(() => {});
  });

  world.afterEvents.entityDie.subscribe((event) => {
    const player = event.deadEntity;
    if (player?.typeId !== "minecraft:player") {
      return;
    }

    const items = captureAndClearInventory(player);
    pendingRespawnClear.add(player.id);
    clearEfzStatusEffects(player);

    if (items.length > 0) {
      spawnLootBody(player, items);
    }
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (pendingRespawnClear.delete(player.id)) {
      system.runTimeout(() => {
        clearEfzStatusEffects(player);
        captureAndClearInventory(player);
      }, 1);
    }
  });

  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const body = event.target;
    if (body?.typeId !== DEAD_BODY_ENTITY_ID) {
      return;
    }

    lootBody(event.player, body);
  });
}
