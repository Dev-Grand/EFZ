import { InputPermissionCategory, ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  BROKEN_LEG_EFFECTS,
  BROKEN_LEG_TAG,
  DEAD_BODY_ENTITY_ID,
  INFECTION_DISEASES,
  INFECTION_TAGS
} from "../data/constants.js";
import { spawnDeadBodyForPlayer } from "./survivorSkins.js";

const GRAVE_LIFETIME_TICKS = 15 * 60 * 20;
const LOOT_TAG_PREFIX = "efz_loot|";
const LOOT_PAGE_SIZE = 45;
const KEEP_INVENTORY_REFRESH_TICKS = 20 * 30;
const DEATH_DROP_ABSORB_RADIUS = 4;
const pendingRespawnClear = new Set();

function enforceKeepInventory() {
  runCommand(world.getDimension("overworld"), "gamerule keepInventory true", "keepInventory");
}

function runCommand(target, command, context) {
  try {
    if (typeof target.runCommand === "function") {
      target.runCommand(command);
      return;
    }

    if (typeof target.runCommandAsync === "function") {
      target.runCommandAsync(command).catch((error) => {
        console.warn(`[EFZ Graves] Failed command ${context}: ${error}`);
      });
      return;
    }
  } catch (error) {
    console.warn(`[EFZ Graves] Failed command ${context}: ${error}`);
  }
}

function getInventory(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function cloneItem(item) {
  if (!item) return undefined;
  if (typeof item.clone === "function") return item.clone();
  return new ItemStack(item.typeId, item.amount);
}

function formatItemName(itemId) {
  return itemId.replace(/^.+:/, "").replaceAll("_", " ");
}

function captureAndClearInventory(player) {
  const inventory = getInventory(player);
  if (!inventory) return [];

  const items = [];
  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i);
    if (!item) continue;
    items.push(cloneItem(item));
    inventory.setItem(i, undefined);
  }

  return items.filter(Boolean);
}

function captureEquippedItems(player) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return [];

  const slotNames = ["Mainhand", "Offhand", "Head", "Chest", "Legs", "Feet"];
  const items = [];

  for (const slotName of slotNames) {
    try {
      const item = equippable.getEquipment(slotName);
      if (!item) continue;
      items.push(cloneItem(item));
      equippable.setEquipment(slotName, undefined);
    } catch {
      // Ignore unavailable slots across versions.
    }
  }

  return items.filter(Boolean);
}

function giveItems(player, items) {
  const inventory = getInventory(player);
  if (!inventory) return false;

  for (const item of items) {
    const leftover = inventory.addItem(cloneItem(item));
    if (leftover) {
      player.dimension.spawnItem(leftover, player.location);
    }
  }

  return true;
}

function removeEffect(player, effectId) {
  try { player.removeEffect(effectId); }
  catch {
    try { player.removeEffect(`minecraft:${effectId}`); }
    catch {}
  }
}

function enableJump(player) {
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, true);
    return;
  } catch {}

  player.runCommandAsync("inputpermission set @s jump enabled").catch(() => {});
}

function clearEfzStatusEffects(player) {
  player.removeTag(BROKEN_LEG_TAG);
  removeEffect(player, BROKEN_LEG_EFFECTS.slowness.identifier);
  enableJump(player);

  for (const tag of INFECTION_TAGS) player.removeTag(tag);
  for (const disease of INFECTION_DISEASES) removeEffect(player, disease.effect);
}

function encodeLootTag(typeId, amount) {
  return `${LOOT_TAG_PREFIX}${typeId}|${amount}`;
}

function decodeLootTag(tag) {
  if (!tag.startsWith(LOOT_TAG_PREFIX)) return undefined;
  const payload = tag.slice(LOOT_TAG_PREFIX.length);
  const splitAt = payload.lastIndexOf("|");
  if (splitAt <= 0) return undefined;

  const typeId = payload.slice(0, splitAt);
  const amount = Number.parseInt(payload.slice(splitAt + 1), 10);
  if (!typeId || !Number.isInteger(amount) || amount <= 0) return undefined;

  return { typeId, amount };
}

function writeLootToBody(body, items) {
  for (const item of items) {
    body.addTag(encodeLootTag(item.typeId, item.amount));
  }
}

function appendLootToBody(body, items) {
  if (!items.length) return;
  const loot = readLootFromBody(body);
  for (const item of items) {
    loot.push({ typeId: item.typeId, amount: item.amount });
  }
  overwriteBodyLoot(body, loot);
}

function readLootFromBody(body) {
  const loot = [];
  for (const tag of body.getTags()) {
    const decoded = decodeLootTag(tag);
    if (decoded) loot.push(decoded);
  }
  return loot;
}

function clearLootTags(body) {
  for (const tag of body.getTags()) {
    if (tag.startsWith(LOOT_TAG_PREFIX)) {
      body.removeTag(tag);
    }
  }
}

function overwriteBodyLoot(body, lootItems) {
  clearLootTags(body);
  if (lootItems.length > 0) {
    writeLootToBody(body, lootItems);
  }
}

function despawnBody(body) {
  try { body.remove(); }
  catch {}
}

function spawnLootBody(player, location, dimension, items) {
  const body = spawnDeadBodyForPlayer(player, location, dimension);
  writeLootToBody(body, items);

  system.runTimeout(() => {
    clearLootTags(body);
    despawnBody(body);
  }, GRAVE_LIFETIME_TICKS);

  return body;
}

function getDroppedItemStack(entity) {
  try {
    return entity.getComponent("minecraft:item")?.itemStack;
  } catch {
    return undefined;
  }
}

function absorbDeathDropsIntoBody(body, dimension, location) {
  const absorbed = [];
  const itemEntities = dimension.getEntities({
    type: "minecraft:item",
    location,
    maxDistance: DEATH_DROP_ABSORB_RADIUS
  });

  for (const entity of itemEntities) {
    const item = getDroppedItemStack(entity);
    if (!item) continue;

    absorbed.push(cloneItem(item));
    try { entity.remove(); }
    catch {}
  }

  appendLootToBody(body, absorbed.filter(Boolean));
  return absorbed.length;
}

async function showLootMenu(player, body, page = 0) {
  const allLoot = readLootFromBody(body);
  if (!allLoot.length) {
    player.sendMessage("This body has no loot.");
    return;
  }

  const maxPage = Math.max(0, Math.ceil(allLoot.length / LOOT_PAGE_SIZE) - 1);
  const safePage = Math.min(Math.max(page, 0), maxPage);
  const start = safePage * LOOT_PAGE_SIZE;
  const pageLoot = allLoot.slice(start, start + LOOT_PAGE_SIZE);

  const form = new ActionFormData()
    .title("Body Loot")
    .body(`Items: ${allLoot.length}\nPage ${safePage + 1}/${maxPage + 1}\nInstant public loot (hardcore).`);

  const actions = [];
  for (let i = 0; i < pageLoot.length; i++) {
    const item = pageLoot[i];
    form.button(`${item.amount}x ${formatItemName(item.typeId)}`);
    actions.push({ kind: "take_one", index: start + i });
  }

  form.button("Take All");
  actions.push({ kind: "take_all" });

  if (safePage > 0) {
    form.button("Previous Page");
    actions.push({ kind: "prev" });
  }

  if (safePage < maxPage) {
    form.button("Next Page");
    actions.push({ kind: "next" });
  }

  const result = await form.show(player);
  if (result.canceled || result.selection === undefined) return;

  const action = actions[result.selection];
  if (!action) return;

  if (action.kind === "prev") return showLootMenu(player, body, safePage - 1);
  if (action.kind === "next") return showLootMenu(player, body, safePage + 1);

  if (action.kind === "take_all") {
    if (!giveItems(player, allLoot)) {
      player.sendMessage("Could not loot this body.");
      return;
    }

    overwriteBodyLoot(body, []);
    player.sendMessage("You looted the body.");
    despawnBody(body);
    return;
  }

  const selected = allLoot[action.index];
  if (!selected) {
    player.sendMessage("That loot slot is no longer available.");
    return;
  }

  if (!giveItems(player, [selected])) {
    player.sendMessage("Could not take that item.");
    return;
  }

  allLoot.splice(action.index, 1);
  overwriteBodyLoot(body, allLoot);
  if (!allLoot.length) {
    player.sendMessage("You looted the body.");
    despawnBody(body);
    return;
  }

  return showLootMenu(player, body, safePage);
}

export function registerGraveSystem() {
  system.run(enforceKeepInventory);
  system.runInterval(enforceKeepInventory, KEEP_INVENTORY_REFRESH_TICKS);

  world.afterEvents.entityDie.subscribe((event) => {
    try {
      const player = event.deadEntity;
      if (player?.typeId !== "minecraft:player") return;

      const deathLocation = { ...player.location };
      const deathDimension = player.dimension;
      const items = [
        ...captureAndClearInventory(player),
        ...captureEquippedItems(player)
      ];
      pendingRespawnClear.add(player.id);
      clearEfzStatusEffects(player);

      const body = spawnLootBody(player, deathLocation, deathDimension, items);
      system.runTimeout(() => {
        try {
          const absorbed = absorbDeathDropsIntoBody(body, deathDimension, deathLocation);
          if (items.length > 0 || absorbed > 0) {
            player.sendMessage("[EFZ] Your loot was moved to your body.");
          } else {
            player.sendMessage("[EFZ] Your body was left at your death location.");
          }
        } catch (error) {
          console.warn(`[EFZ Graves] Failed to absorb death drops: ${error}`);
        }
      }, 2);
    } catch (error) {
      console.warn(`[EFZ Graves] Failed player death loot flow: ${error}`);
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
    if (body?.typeId !== DEAD_BODY_ENTITY_ID) return;

    void showLootMenu(event.player, body).catch((error) => {
      console.warn(`[EFZ Graves] Failed to show loot menu: ${error}`);
    });
  });
}
