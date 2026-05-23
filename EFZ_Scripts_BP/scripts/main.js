import { system } from "@minecraft/server";
import { EFZ_VERSION } from "./data/constants.js";
import { registerInfectionSystem } from "./systems/infection.js";
import { registerPlayerStatsSystem } from "./systems/playerStats.js";
import { registerBrokenLegSystem } from "./systems/brokenLegs.js";
import { registerSplintSystem } from "./systems/splint.js";
import { registerSyringeSystem } from "./systems/syringe.js";
import { registerSurvivorSkinSystem } from "./systems/survivorSkins.js";
import { registerNpcTradeSystem } from "./systems/npcTrades.js";
import { registerGraveSystem } from "./systems/graves.js";

const systems = [
  ["infection", registerInfectionSystem],
  ["playerStats", registerPlayerStatsSystem],
  ["brokenLegs", registerBrokenLegSystem],
  ["splint", registerSplintSystem],
  ["syringe", registerSyringeSystem],
  ["survivorSkins", registerSurvivorSkinSystem],
  ["npcTrades", registerNpcTradeSystem],
  ["graves", registerGraveSystem]
];

for (const [name, register] of systems) {
  try {
    register();
  } catch (error) {
    console.warn(`[EFZ Scripts] Failed to register ${name}: ${error}`);
  }
}

system.run(() => {
  console.warn(`[EFZ Scripts] Loaded EFZ gameplay scaffold v${EFZ_VERSION}`);
});
