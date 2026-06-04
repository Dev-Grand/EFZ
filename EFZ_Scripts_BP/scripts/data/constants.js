export const EFZ_VERSION = "1.0.11";

export const EFZ_MENU_ITEM_ID = "efz:gear_menu";

export const BROKEN_LEG_TAG = "efz_broken_leg";

export const SURVIVOR_SKIN_PROPERTY = "efz:survivor_skin_type";

export const SURVIVOR_SKIN_COUNT = 7;

export const DEAD_BODY_ENTITY_ID = "efz:dead_body";

export const SCOREBOARD_OBJECTIVES = {
  money: "efz_money",
  kills: "efz_kills",
  deaths: "efz_deaths",
  ui: "efz_ui",
  skin: "efz_skin",
  zombieKills: "efz_zombie_kills",
  moneyEarned: "efz_money_earned",
  moneySpent: "efz_money_spent",
  playtimeMinutes: "efz_playtime_min"
};

export const DEFAULT_PLAYER_MONEY = 0;

export const EFZ_UI_UPDATE_INTERVAL_TICKS = 40;

export const BROKEN_LEG_EFFECTS = {
  slowness: {
    identifier: "minecraft:slowness",
    durationTicks: 120,
    amplifier: 2
  }
};

export const FALL_BROKEN_LEG_CHANCES = [
  {
    minBlocks: 4,
    maxBlocks: 5,
    chance: 0.3
  },
  {
    minBlocks: 6,
    maxBlocks: 7,
    chance: 0.5
  },
  {
    minBlocks: 8,
    maxBlocks: null,
    chance: 1
  }
];

export const INFECTION_CHANCE = 0.2;

export const INFECTION_ATTACKER_TYPES = [
  "minecraft:zombie",
  "minecraft:husk"
];

export const INFECTION_ATTACKER_PREFIXES = [
  "efz:zombie",
  "efz:husk",
  "efz:infected_"
];

export const INFECTION_DISEASES = [
  {
    id: "nausea",
    name: "Nausea",
    effect: "nausea",
    durationTicks: 90 * 20,
    amplifier: 0
  },
  {
    id: "poison_1",
    name: "Poison I",
    effect: "poison",
    durationTicks: 30 * 20,
    amplifier: 0
  },
  {
    id: "poison_2",
    name: "Poison II",
    effect: "poison",
    durationTicks: 30 * 20,
    amplifier: 1
  },
  {
    id: "harmful_poison",
    name: "Wither Infection",
    effect: "wither",
    durationTicks: 30 * 20,
    amplifier: 0
  }
];

export const INFECTION_TAG_PREFIX = "efz_infection_";

export const INFECTION_TAGS = INFECTION_DISEASES.map((disease) => `${INFECTION_TAG_PREFIX}${disease.id}`);


export const RADIATION_CONFIG = {
  gasMaskItemId: "minecraft:turtle_helmet",
  gasMaskProtectionMultiplier: 0.2,
  exposurePerSecondNoMask: 1,
  exposureDecayPerSecondOutsideZone: 0.5,
  levelThresholdsSeconds: {
    level1: 15 * 60,
    level2: 20 * 60,
    level3: 25 * 60
  },
  levelEffects: {
    level1: [
      { id: "nausea", amplifier: 0 }
    ],
    level2: [
      { id: "nausea", amplifier: 0 },
      { id: "slowness", amplifier: 1 }
    ],
    level3: [
      { id: "nausea", amplifier: 0 },
      { id: "slowness", amplifier: 2 },
      { id: "poison", amplifier: 0 }
    ]
  }
};
