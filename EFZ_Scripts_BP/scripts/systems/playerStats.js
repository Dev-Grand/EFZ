import { system, world } from "@minecraft/server";
import { getRadiationStatusForPlayer } from "./radiation.js";
import {
  DEFAULT_PLAYER_MONEY,
  EFZ_UI_UPDATE_INTERVAL_TICKS,
  INFECTION_ATTACKER_PREFIXES,
  INFECTION_ATTACKER_TYPES,
  SCOREBOARD_OBJECTIVES,
  INFECTION_TAGS,
  BROKEN_LEG_TAG
} from "../data/constants.js";

const EXTRA_OBJECTIVES = {
  zombieKills: SCOREBOARD_OBJECTIVES.zombieKills,
  moneyEarned: SCOREBOARD_OBJECTIVES.moneyEarned,
  moneySpent: SCOREBOARD_OBJECTIVES.moneySpent,
  playtimeMinutes: SCOREBOARD_OBJECTIVES.playtimeMinutes
};

const OBJECTIVE_DISPLAY_NAMES = {
  [SCOREBOARD_OBJECTIVES.money]: "EFZ Money",
  [SCOREBOARD_OBJECTIVES.kills]: "EFZ Kills",
  [SCOREBOARD_OBJECTIVES.deaths]: "EFZ Deaths",
  [SCOREBOARD_OBJECTIVES.ui]: "EFZ",
  [EXTRA_OBJECTIVES.zombieKills]: "EFZ Zombie Kills",
  [EXTRA_OBJECTIVES.moneyEarned]: "EFZ Money Earned",
  [EXTRA_OBJECTIVES.moneySpent]: "EFZ Money Spent",
  [EXTRA_OBJECTIVES.playtimeMinutes]: "EFZ Playtime (min)"
};

const lastKnownMoneyByPlayerId = new Map();

function getObjective(id) {
  let objective = world.scoreboard.getObjective(id);
  if (!objective) {
    objective = world.scoreboard.addObjective(id, OBJECTIVE_DISPLAY_NAMES[id] ?? id);
  }
  return objective;
}

function getScore(objective, player, fallback = 0) {
  try {
    return objective.getScore(player) ?? fallback;
  } catch {
    return fallback;
  }
}

function setScore(objective, player, value) {
  objective.setScore(player, value);
}

function addScore(objective, player, amount) {
  setScore(objective, player, getScore(objective, player) + amount);
}

function ensureObjectiveScore(id, player, defaultValue = 0) {
  const objective = getObjective(id);
  if (getScore(objective, player, null) === null) {
    setScore(objective, player, defaultValue);
  }
}

function ensurePlayerStats(player) {
  ensureObjectiveScore(SCOREBOARD_OBJECTIVES.money, player, DEFAULT_PLAYER_MONEY);
  ensureObjectiveScore(SCOREBOARD_OBJECTIVES.kills, player, 0);
  ensureObjectiveScore(SCOREBOARD_OBJECTIVES.deaths, player, 0);
  ensureObjectiveScore(EXTRA_OBJECTIVES.zombieKills, player, 0);
  ensureObjectiveScore(EXTRA_OBJECTIVES.moneyEarned, player, 0);
  ensureObjectiveScore(EXTRA_OBJECTIVES.moneySpent, player, 0);
  ensureObjectiveScore(EXTRA_OBJECTIVES.playtimeMinutes, player, 0);
}

function buildStatusSegments(player) {
  const statuses = [];

  if (INFECTION_TAGS.some((tag) => player.hasTag(tag))) statuses.push("INFECTION");
  if (player.hasTag(BROKEN_LEG_TAG)) statuses.push("BROKEN LEG");

  const radiation = getRadiationStatusForPlayer(player.id);
  if (radiation.stage > 0) {
    statuses.push(`RADIATION L${radiation.stage}`);
  } else if (radiation.inZone) {
    statuses.push("RADIATION");
  }

  return statuses;
}

function updatePersonalHud(player) {
  ensurePlayerStats(player);
  const money = getScore(getObjective(SCOREBOARD_OBJECTIVES.money), player);
  const statuses = buildStatusSegments(player);
  const suffix = statuses.length ? ` | ${statuses.join(" + ")}` : "";
  player.onScreenDisplay.setActionBar(`§6$${money}${suffix}`);
}

function isZombieLike(entity) {
  if (!entity?.typeId) return false;
  return INFECTION_ATTACKER_TYPES.includes(entity.typeId)
    || INFECTION_ATTACKER_PREFIXES.some((prefix) => entity.typeId.startsWith(prefix));
}

function registerDeathAndKillStats() {
  world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;

    if (deadEntity?.typeId === "minecraft:player") {
      addScore(getObjective(SCOREBOARD_OBJECTIVES.deaths), deadEntity, 1);
    }

    const killer = event.damageSource?.damagingEntity;
    if (killer?.typeId === "minecraft:player") {
      if (deadEntity?.typeId === "minecraft:player" && killer.id !== deadEntity.id) {
        addScore(getObjective(SCOREBOARD_OBJECTIVES.kills), killer, 1);
      }

      if (isZombieLike(deadEntity)) {
        addScore(getObjective(EXTRA_OBJECTIVES.zombieKills), killer, 1);
      }
    }
  });
}

function registerMoneyFlowTracker() {
  system.runInterval(() => {
    const moneyObjective = getObjective(SCOREBOARD_OBJECTIVES.money);
    const earnedObjective = getObjective(EXTRA_OBJECTIVES.moneyEarned);
    const spentObjective = getObjective(EXTRA_OBJECTIVES.moneySpent);

    for (const player of world.getAllPlayers()) {
      ensurePlayerStats(player);
      const current = getScore(moneyObjective, player);
      const previous = lastKnownMoneyByPlayerId.get(player.id);
      if (previous === undefined) {
        lastKnownMoneyByPlayerId.set(player.id, current);
        continue;
      }

      const delta = current - previous;
      if (delta > 0) addScore(earnedObjective, player, delta);
      if (delta < 0) addScore(spentObjective, player, Math.abs(delta));
      lastKnownMoneyByPlayerId.set(player.id, current);
    }
  }, 20);

  world.afterEvents.playerLeave.subscribe((event) => {
    lastKnownMoneyByPlayerId.delete(event.playerId);
  });
}

function registerPlaytimeTracker() {
  system.runInterval(() => {
    const playtimeObjective = getObjective(EXTRA_OBJECTIVES.playtimeMinutes);
    for (const player of world.getAllPlayers()) {
      ensurePlayerStats(player);
      addScore(playtimeObjective, player, 1);
    }
  }, 20 * 60);
}

export function registerPlayerStatsSystem() {
  world.afterEvents.playerSpawn.subscribe((event) => {
    ensurePlayerStats(event.player);
  });

  registerDeathAndKillStats();
  registerMoneyFlowTracker();
  registerPlaytimeTracker();

  system.run(() => {
    world.getDimension("overworld").runCommandAsync(`scoreboard objectives remove ${SCOREBOARD_OBJECTIVES.skin}`).catch(() => {});
    getObjective(SCOREBOARD_OBJECTIVES.money);
    getObjective(SCOREBOARD_OBJECTIVES.kills);
    getObjective(SCOREBOARD_OBJECTIVES.deaths);
    getObjective(EXTRA_OBJECTIVES.zombieKills);
    getObjective(EXTRA_OBJECTIVES.moneyEarned);
    getObjective(EXTRA_OBJECTIVES.moneySpent);
    getObjective(EXTRA_OBJECTIVES.playtimeMinutes);
  });

  system.runInterval(() => {
    try {
      for (const player of world.getAllPlayers()) updatePersonalHud(player);
    } catch (error) {
      console.warn(`[EFZ UI] Failed to update HUD: ${error}`);
    }
  }, EFZ_UI_UPDATE_INTERVAL_TICKS);
}
