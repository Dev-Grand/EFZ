import { EquipmentSlot, system, world } from "@minecraft/server";
import { RADIATION_CONFIG } from "../data/constants.js";
import { RADIATION_ZONES } from "../data/radiationZones.js";

const exposureByPlayerId = new Map();
const insideZoneByPlayerId = new Map();

const EFFECT_REFRESH_TICKS = 60;

function isInZone(location, zone) {
  return location.x >= zone.min.x && location.x <= zone.max.x
    && location.y >= zone.min.y && location.y <= zone.max.y
    && location.z >= zone.min.z && location.z <= zone.max.z;
}

function getCurrentZone(player) {
  const dimensionId = player.dimension.id;
  return RADIATION_ZONES.find((zone) => zone.dimensionId === dimensionId && isInZone(player.location, zone));
}

function hasGasMask(player) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return false;

  try {
    const headItem = equippable.getEquipment(EquipmentSlot.Head);
    return headItem?.typeId === RADIATION_CONFIG.gasMaskItemId;
  } catch {
    return false;
  }
}

function getStage(exposureSeconds) {
  const { level1, level2, level3 } = RADIATION_CONFIG.levelThresholdsSeconds;
  if (exposureSeconds >= level3) return 3;
  if (exposureSeconds >= level2) return 2;
  if (exposureSeconds >= level1) return 1;
  return 0;
}

function applyStageEffects(player, stage) {
  if (stage <= 0) return;

  const key = `level${stage}`;
  const effects = RADIATION_CONFIG.levelEffects[key] ?? [];
  for (const effect of effects) {
    player.addEffect(effect.id, EFFECT_REFRESH_TICKS, {
      amplifier: effect.amplifier,
      showParticles: true
    });
  }
}

function updatePlayerRadiation(player) {
  const zone = getCurrentZone(player);
  const inZone = Boolean(zone);
  const prevInZone = insideZoneByPlayerId.get(player.id) ?? false;

  if (inZone && !prevInZone) {
    player.onScreenDisplay.setTitle("§cRADIATION ZONE");
    player.sendMessage("§c[EFZ] Radiation exposure active. Equip a gas mask to reduce exposure by 80%.");
  }

  if (!inZone && prevInZone) {
    player.onScreenDisplay.setTitle("§aLEFT RADIATION ZONE");
    player.sendMessage("§a[EFZ] Radiation exposure is fading while you stay outside the zone.");
  }

  insideZoneByPlayerId.set(player.id, inZone);

  let exposure = exposureByPlayerId.get(player.id) ?? 0;

  if (inZone) {
    const multiplier = hasGasMask(player) ? RADIATION_CONFIG.gasMaskProtectionMultiplier : 1;
    exposure += RADIATION_CONFIG.exposurePerSecondNoMask * multiplier;
  } else {
    exposure = Math.max(0, exposure - RADIATION_CONFIG.exposureDecayPerSecondOutsideZone);
  }

  exposureByPlayerId.set(player.id, exposure);
  applyStageEffects(player, getStage(exposure));
}

export function registerRadiationSystem() {
  world.afterEvents.playerLeave.subscribe((event) => {
    exposureByPlayerId.delete(event.playerId);
    insideZoneByPlayerId.delete(event.playerId);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        updatePlayerRadiation(player);
      } catch (error) {
        console.warn(`[EFZ Radiation] Failed for ${player.name}: ${error}`);
      }
    }
  }, 20);
}


export function getRadiationStageForPlayer(playerId) {
  const exposure = exposureByPlayerId.get(playerId) ?? 0;
  return getStage(exposure);
}
