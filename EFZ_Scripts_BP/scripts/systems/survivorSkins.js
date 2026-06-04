import { world } from "@minecraft/server";
import {
  DEAD_BODY_ENTITY_ID,
  SURVIVOR_SKIN_COUNT,
  SURVIVOR_SKIN_PROPERTY
} from "../data/constants.js";

function randomSkinType() {
  return Math.floor(Math.random() * SURVIVOR_SKIN_COUNT);
}

function normalizeSkinType(value) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return randomSkinType();
  }

  if (value < 0 || value >= SURVIVOR_SKIN_COUNT) {
    return randomSkinType();
  }

  return value;
}

function syncSkinTags(player, skinType) {
  for (let i = 0; i < SURVIVOR_SKIN_COUNT; i++) {
    player.removeTag(`efz_skin_type_${i}`);
  }

  player.addTag(`efz_skin_type_${skinType}`);
}

export function getSurvivorSkinType(player) {
  const current = player.getDynamicProperty(SURVIVOR_SKIN_PROPERTY);
  const skinType = normalizeSkinType(current);

  if (skinType !== current) {
    player.setDynamicProperty(SURVIVOR_SKIN_PROPERTY, skinType);
  }

  syncSkinTags(player, skinType);
  return skinType;
}

export function spawnDeadBodyForPlayer(player, location = player.location, dimension = player.dimension) {
  const body = dimension.spawnEntity(DEAD_BODY_ENTITY_ID, location);
  const skinType = getSurvivorSkinType(player);

  body.setProperty("efz:skin_type", skinType);
  body.nameTag = `${player.name}'s body`;

  return body;
}

export function registerSurvivorSkinSystem() {
  world.afterEvents.playerSpawn.subscribe((event) => {
    getSurvivorSkinType(event.player);
  });
}
