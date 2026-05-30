import { system, world } from "@minecraft/server";
import { SAFE_ZONES } from "../data/safeZones.js";

const EXIT_IMMUNITY_TICKS = 5 * 20;
const exitImmunityUntilByPlayerId = new Map();
const inZoneByPlayerId = new Map();

function isInZone(location, zone) {
  return location.x >= zone.min.x && location.x <= zone.max.x
    && location.y >= zone.min.y && location.y <= zone.max.y
    && location.z >= zone.min.z && location.z <= zone.max.z;
}

function isInsideSafeZone(player) {
  const dimensionId = player.dimension.id;
  return SAFE_ZONES.some((zone) => zone.dimensionId === dimensionId && isInZone(player.location, zone));
}

function isProtected(player) {
  if (!player) return false;
  if (isInsideSafeZone(player)) return true;

  const now = system.currentTick;
  const until = exitImmunityUntilByPlayerId.get(player.id) ?? 0;
  return now <= until;
}

export function registerSafeZonePvPSystem() {
  system.runInterval(() => {
    const now = system.currentTick;
    for (const player of world.getAllPlayers()) {
      const currentlyInside = isInsideSafeZone(player);
      const wasInside = inZoneByPlayerId.get(player.id) ?? false;

      if (wasInside && !currentlyInside) {
        exitImmunityUntilByPlayerId.set(player.id, now + EXIT_IMMUNITY_TICKS);
        player.onScreenDisplay.setTitle("§eSAFE ZONE EXIT");
        player.sendMessage("§e[EFZ] You left the safe zone. PvP immunity remains for 5 seconds.");
      }

      if (!wasInside && currentlyInside) {
        player.onScreenDisplay.setTitle("§aSAFE ZONE");
        player.sendMessage("§a[EFZ] You entered the safe zone. Player damage is disabled here.");
      }

      inZoneByPlayerId.set(player.id, currentlyInside);
    }
  }, 10);

  world.beforeEvents.entityHurt.subscribe((event) => {
    const hurt = event.hurtEntity;
    const attacker = event.damageSource?.damagingEntity;

    if (hurt?.typeId !== "minecraft:player") return;
    if (attacker?.typeId !== "minecraft:player") return;

    if (isProtected(hurt) || isProtected(attacker)) {
      event.cancel = true;
    }
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    inZoneByPlayerId.delete(event.playerId);
    exitImmunityUntilByPlayerId.delete(event.playerId);
  });
}
