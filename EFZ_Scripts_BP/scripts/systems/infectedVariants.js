import { system, world } from "@minecraft/server";

const VANILLA_TO_EFZ_VARIANTS = {
  "minecraft:zombie": {
    prefix: "efz:infected_zombie_",
    count: 151
  },
  "minecraft:husk": {
    prefix: "efz:infected_husk_",
    count: 25
  }
};

function pickVariant({ prefix, count }) {
  const index = Math.floor(Math.random() * count);
  return `${prefix}${String(index).padStart(3, "0")}`;
}

function isEntityUsable(entity) {
  try {
    return Boolean(entity && entity.typeId && entity.location && entity.dimension);
  } catch {
    return false;
  }
}

function copyRotation(source, target) {
  try {
    const rotation = source.getRotation();
    target.setRotation(rotation);
  } catch {
    // Rotation is visual polish; spawn replacement should not fail if unavailable.
  }
}

function replaceWithEfzInfected(entity, variantConfig) {
  if (!isEntityUsable(entity)) {
    return;
  }

  const { dimension, location } = entity;
  const variantId = pickVariant(variantConfig);

  try {
    const replacement = dimension.spawnEntity(variantId, location);
    replacement.addTag("efz_infected_variant");
    copyRotation(entity, replacement);
    entity.remove();
  } catch (error) {
    console.warn(`[EFZ Infected] Failed to replace ${entity.typeId} with ${variantId}: ${error}`);
  }
}

export function registerInfectedVariantSystem() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    const variantConfig = VANILLA_TO_EFZ_VARIANTS[entity?.typeId];

    if (!variantConfig) {
      return;
    }

    system.run(() => replaceWithEfzInfected(entity, variantConfig));
  });
}
