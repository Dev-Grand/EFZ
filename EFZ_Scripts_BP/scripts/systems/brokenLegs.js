import { InputPermissionCategory, system, world } from "@minecraft/server";
import {
  BROKEN_LEG_EFFECTS,
  BROKEN_LEG_TAG,
  FALL_BROKEN_LEG_CHANCES
} from "../data/constants.js";

const fallStateByPlayerId = new Map();

function disableJump(player) {
  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, false);
    return;
  } catch {
    // Fall back to the command for older or restricted runtime behavior.
  }

  player.runCommandAsync("inputpermission set @s jump disabled").catch(() => {});
}

function applyBrokenLeg(player) {
  if (!player.hasTag(BROKEN_LEG_TAG)) {
    player.addTag(BROKEN_LEG_TAG);
    player.sendMessage("You broke your leg. Use a Splint to treat it.");
  }

  player.addEffect(
    BROKEN_LEG_EFFECTS.slowness.identifier,
    BROKEN_LEG_EFFECTS.slowness.durationTicks,
    {
      amplifier: BROKEN_LEG_EFFECTS.slowness.amplifier,
      showParticles: true
    }
  );

  disableJump(player);
}

function getBreakChance(fallBlocks) {
  const rule = FALL_BROKEN_LEG_CHANCES.find((entry) => {
    const aboveMin = fallBlocks >= entry.minBlocks;
    const belowMax = entry.maxBlocks === null || fallBlocks <= entry.maxBlocks;
    return aboveMin && belowMax;
  });

  return rule?.chance ?? 0;
}

function shouldIgnoreFall(player) {
  try {
    return player.isInWater || player.isClimbing || player.isGliding || player.isFlying;
  } catch {
    return false;
  }
}

function updatePlayerFallState(player) {
  const state = fallStateByPlayerId.get(player.id) ?? {
    wasOnGround: true,
    highestY: player.location.y
  };

  if (shouldIgnoreFall(player)) {
    fallStateByPlayerId.set(player.id, {
      wasOnGround: player.isOnGround,
      highestY: player.location.y
    });
    return;
  }

  if (!player.isOnGround) {
    fallStateByPlayerId.set(player.id, {
      wasOnGround: false,
      highestY: Math.max(state.highestY, player.location.y)
    });
    return;
  }

  if (!state.wasOnGround) {
    const fallBlocks = state.highestY - player.location.y;
    const chance = getBreakChance(fallBlocks);

    if (chance > 0 && Math.random() <= chance) {
      applyBrokenLeg(player);
    }
  }

  fallStateByPlayerId.set(player.id, {
    wasOnGround: true,
    highestY: player.location.y
  });
}

function maintainBrokenLegEffects(player) {
  if (player.hasTag(BROKEN_LEG_TAG)) {
    applyBrokenLeg(player);
  }
}

export function registerBrokenLegSystem() {
  world.afterEvents.playerLeave.subscribe((event) => {
    fallStateByPlayerId.delete(event.playerId);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        updatePlayerFallState(player);
        maintainBrokenLegEffects(player);
      } catch (error) {
        console.warn(`[EFZ Broken Legs] Failed for ${player.name}: ${error}`);
      }
    }
  }, 2);
}
