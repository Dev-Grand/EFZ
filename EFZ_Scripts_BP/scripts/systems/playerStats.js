import {
  DisplaySlotId,
  system,
  world
} from "@minecraft/server";
import {
  DEFAULT_PLAYER_MONEY,
  EFZ_UI_UPDATE_INTERVAL_TICKS,
  SCOREBOARD_OBJECTIVES
} from "../data/constants.js";

const OBJECTIVE_DISPLAY_NAMES = {
  [SCOREBOARD_OBJECTIVES.money]: "EFZ Money",
  [SCOREBOARD_OBJECTIVES.kills]: "EFZ Kills",
  [SCOREBOARD_OBJECTIVES.deaths]: "EFZ Deaths",
  [SCOREBOARD_OBJECTIVES.ui]: "EFZ"
};

const UI_LINES = {
  money: "$",
  kills: "K",
  deaths: "D"
};

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

function ensurePlayerStats(player) {
  const money = getObjective(SCOREBOARD_OBJECTIVES.money);
  const kills = getObjective(SCOREBOARD_OBJECTIVES.kills);
  const deaths = getObjective(SCOREBOARD_OBJECTIVES.deaths);

  if (getScore(money, player, null) === null) {
    setScore(money, player, DEFAULT_PLAYER_MONEY);
  }

  if (getScore(kills, player, null) === null) {
    setScore(kills, player, 0);
  }

  if (getScore(deaths, player, null) === null) {
    setScore(deaths, player, 0);
  }
}

function updateSinglePlayerSidebar(player) {
  ensurePlayerStats(player);

  const money = getScore(getObjective(SCOREBOARD_OBJECTIVES.money), player);
  const kills = getScore(getObjective(SCOREBOARD_OBJECTIVES.kills), player);
  const deaths = getScore(getObjective(SCOREBOARD_OBJECTIVES.deaths), player);
  const ui = getObjective(SCOREBOARD_OBJECTIVES.ui);

  ui.setScore(UI_LINES.money, money);
  ui.setScore(UI_LINES.kills, kills);
  ui.setScore(UI_LINES.deaths, deaths);

  world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
    objective: ui
  });
}

function updateSidebarDisplay() {
  const players = world.getAllPlayers();

  for (const player of players) {
    ensurePlayerStats(player);
  }

  if (players.length > 0) {
    updateSinglePlayerSidebar(players[0]);
  }
}

function registerDeathStats() {
  world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;

    if (deadEntity?.typeId !== "minecraft:player") {
      return;
    }

    const deaths = getObjective(SCOREBOARD_OBJECTIVES.deaths);
    addScore(deaths, deadEntity, 1);

    const killer = event.damageSource?.damagingEntity;
    if (killer?.typeId === "minecraft:player" && killer.id !== deadEntity.id) {
      const kills = getObjective(SCOREBOARD_OBJECTIVES.kills);
      addScore(kills, killer, 1);
    }
  });
}

export function registerPlayerStatsSystem() {
  world.afterEvents.playerSpawn.subscribe((event) => {
    ensurePlayerStats(event.player);
  });

  registerDeathStats();

  system.run(() => {
    world.getDimension("overworld").runCommandAsync(`scoreboard players reset * ${SCOREBOARD_OBJECTIVES.ui}`).catch(() => {});
    world.getDimension("overworld").runCommandAsync(`scoreboard objectives remove ${SCOREBOARD_OBJECTIVES.skin}`).catch(() => {});
    getObjective(SCOREBOARD_OBJECTIVES.money);
    getObjective(SCOREBOARD_OBJECTIVES.kills);
    getObjective(SCOREBOARD_OBJECTIVES.deaths);
    getObjective(SCOREBOARD_OBJECTIVES.ui);
    updateSidebarDisplay();
  });

  system.runInterval(() => {
    try {
      updateSidebarDisplay();
    } catch (error) {
      console.warn(`[EFZ UI] Failed to update sidebar: ${error}`);
    }
  }, EFZ_UI_UPDATE_INTERVAL_TICKS);
}
