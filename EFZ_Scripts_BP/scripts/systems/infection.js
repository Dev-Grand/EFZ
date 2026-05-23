import { world } from "@minecraft/server";
import {
  INFECTION_ATTACKER_PREFIXES,
  INFECTION_ATTACKER_TYPES,
  INFECTION_CHANCE,
  INFECTION_DISEASES,
  INFECTION_TAGS
} from "../data/constants.js";

function isPlayer(entity) {
  return entity?.typeId === "minecraft:player";
}

function isInfectiousAttacker(entity) {
  if (!entity?.typeId) {
    return false;
  }

  return INFECTION_ATTACKER_TYPES.includes(entity.typeId)
    || INFECTION_ATTACKER_PREFIXES.some((prefix) => entity.typeId.startsWith(prefix));
}

function pickDisease() {
  return INFECTION_DISEASES[Math.floor(Math.random() * INFECTION_DISEASES.length)];
}

function applyDisease(player, disease) {
  for (const tag of INFECTION_TAGS) {
    player.removeTag(tag);
  }

  player.addTag(`efz_infection_${disease.id}`);

  player.addEffect(disease.effect, disease.durationTicks, {
    amplifier: disease.amplifier,
    showParticles: true
  });

  player.sendMessage(`You have been infected: ${disease.name}.`);
}

export function registerInfectionSystem() {
  world.afterEvents.entityHurt.subscribe((event) => {
    const player = event.hurtEntity;
    const attacker = event.damageSource?.damagingEntity;

    if (!isPlayer(player) || !isInfectiousAttacker(attacker)) {
      return;
    }

    if (Math.random() > INFECTION_CHANCE) {
      return;
    }

    applyDisease(player, pickDisease());
  }, {
    entityTypes: ["minecraft:player"]
  });
}
