import { system } from "@minecraft/server";
import { INFECTION_DISEASES, INFECTION_TAGS } from "../data/constants.js";

function getActiveInfectionDisease(player) {
  return INFECTION_DISEASES.find((disease) => player.hasTag(`efz_infection_${disease.id}`));
}

function clearInfectionTags(player) {
  for (const tag of INFECTION_TAGS) {
    player.removeTag(tag);
  }
}

function removeEffectSafely(player, effectId) {
  try {
    player.removeEffect(effectId);
  } catch {
    // Some runtime versions accept unprefixed IDs only; the caller tries both.
  }
}

function hasEffectSafely(player, effectId) {
  try {
    return Boolean(player.getEffect(effectId));
  } catch {
    return false;
  }
}

function clearInfectionEffects(player) {
  const effectIds = [
    "nausea",
    "minecraft:nausea",
    "poison",
    "minecraft:poison",
    "wither",
    "minecraft:wither",
    "fatal_poison",
    "minecraft:fatal_poison"
  ];

  const hadEffect = effectIds.some((effectId) => hasEffectSafely(player, effectId));

  for (const effectId of effectIds) {
    removeEffectSafely(player, effectId);
  }

  return hadEffect;
}

export function registerSyringeSystem() {
  system.beforeEvents.startup.subscribe((event) => {
    event.itemComponentRegistry.registerCustomComponent("efz:syringe", {
      onConsume: ({ source }) => {
        const disease = source ? getActiveInfectionDisease(source) : null;

        if (!source) {
          return;
        }

        const hadEffect = clearInfectionEffects(source);

        if (!disease && !hadEffect) {
          source?.sendMessage?.("You do not have an EFZ infection.");
          return;
        }

        clearInfectionTags(source);
        source.sendMessage("Your infection has been treated.");
      }
    });
  });
}
