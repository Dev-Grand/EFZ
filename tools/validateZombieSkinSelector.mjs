import fs from "node:fs";
import path from "node:path";

const paths = {
  renderControllers: "EFZ_Entities_RP/render_controllers/zombie_husk.render_controllers.json",
  generatedVariants: "EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json",
  zombieTexturesDir: "EFZ_Entities_RP/textures/entity/efz/zombies",
  huskTexturesDir: "EFZ_Entities_RP/textures/entity/efz/husks",
  zombieFallbackEntity: "EFZ_Entities_RP/entity/zombie.entity.json",
  huskFallbackEntity: "EFZ_Entities_RP/entity/husk.entity.json",
  bpVariantsDir: "EFZ_Entities_BP/entities/infected",
  rpVariantsDir: "EFZ_Entities_RP/entity/infected"
};

const families = [
  {
    family: "zombie",
    generatedKey: "zombies",
    generatedEntityKey: "zombiesEntities",
    filePrefix: "infected_zombie_",
    entityPrefix: "efz:infected_zombie_",
    fallbackEntityPath: paths.zombieFallbackEntity,
    fallbackIdentifier: "minecraft:zombie",
    fallbackController: "controller.render.zombie",
    textureDir: paths.zombieTexturesDir,
    textureBase: "textures/entity/efz/zombies"
  },
  {
    family: "husk",
    generatedKey: "husks",
    generatedEntityKey: "husksEntities",
    filePrefix: "infected_husk_",
    entityPrefix: "efz:infected_husk_",
    fallbackEntityPath: paths.huskFallbackEntity,
    fallbackIdentifier: "minecraft:husk",
    fallbackController: "controller.render.husk",
    textureDir: paths.huskTexturesDir,
    textureBase: "textures/entity/efz/husks"
  }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listTextureStems(dir) {
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".png"))
    .map((name) => name.slice(0, -4))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+$/)?.[0] ?? 0);
      const bNum = Number(b.match(/\d+$/)?.[0] ?? 0);
      return aNum - bNum || a.localeCompare(b);
    });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compareList(label, expected, actual) {
  assert(
    expected.length === actual.length && expected.every((value, index) => value === actual[index]),
    `${label}: expected ${expected.length} ordered values but found ${actual.length}`
  );
}

function validateFixedRenderController() {
  const renderControllers = readJson(paths.renderControllers).render_controllers;
  const controller = renderControllers["controller.render.efz_infected"];

  assert(controller, "Missing controller.render.efz_infected");
  assert(controller.geometry === "Geometry.default", "controller.render.efz_infected must use Geometry.default");
  assert(controller.textures?.[0] === "Texture.default", "controller.render.efz_infected must use fixed Texture.default");
}

function validateVariantFile({ familyConfig, index, textureName, entityId }) {
  const suffix = String(index).padStart(3, "0");
  const fileName = `${familyConfig.filePrefix}${suffix}.json`;
  const bpPath = path.join(paths.bpVariantsDir, fileName);
  const rpPath = path.join(paths.rpVariantsDir, fileName);

  assert(fs.existsSync(bpPath), `${familyConfig.family} missing BP variant file ${bpPath}`);
  assert(fs.existsSync(rpPath), `${familyConfig.family} missing RP variant file ${rpPath}`);

  const bp = readJson(bpPath);
  const rp = readJson(rpPath);
  const bpDescription = bp["minecraft:entity"]?.description;
  const rpDescription = rp["minecraft:client_entity"]?.description;

  assert(bpDescription?.identifier === entityId, `${bpPath} identifier must be ${entityId}`);
  assert(rpDescription?.identifier === entityId, `${rpPath} identifier must be ${entityId}`);
  assert(
    bp["minecraft:entity"]?.components?.["minecraft:type_family"]?.family?.includes("efz_infected"),
    `${bpPath} must include efz_infected type family`
  );
  assert(
    rpDescription.render_controllers?.includes("controller.render.efz_infected"),
    `${rpPath} must use controller.render.efz_infected`
  );
  assert(
    rpDescription.textures?.default === `${familyConfig.textureBase}/${textureName}`,
    `${rpPath} Texture.default must point to ${textureName}`
  );
}

function validateFamily(familyConfig, generated) {
  const textures = listTextureStems(familyConfig.textureDir);
  const generatedTextures = generated[familyConfig.generatedKey];
  const generatedEntities = generated[familyConfig.generatedEntityKey];

  compareList(`${familyConfig.family} generated textures`, textures, generatedTextures);
  assert(
    generatedEntities.length === textures.length,
    `${familyConfig.family} generated entity count must match texture count`
  );

  textures.forEach((textureName, index) => {
    const entityId = `${familyConfig.entityPrefix}${String(index).padStart(3, "0")}`;
    assert(generatedEntities[index] === entityId, `${familyConfig.family} generated entity ${index} must be ${entityId}`);
    validateVariantFile({ familyConfig, index, textureName, entityId });
  });

  const fallback = readJson(familyConfig.fallbackEntityPath);
  const fallbackDescription = fallback["minecraft:client_entity"]?.description;
  assert(
    fallbackDescription?.identifier === familyConfig.fallbackIdentifier,
    `${familyConfig.fallbackEntityPath} identifier must be ${familyConfig.fallbackIdentifier}`
  );
  assert(
    Object.keys(fallbackDescription.textures ?? {}).length === 1,
    `${familyConfig.fallbackEntityPath} must use one fixed fallback texture`
  );
  assert(
    fallbackDescription.render_controllers?.[0] === familyConfig.fallbackController,
    `${familyConfig.fallbackEntityPath} must use ${familyConfig.fallbackController}`
  );
  assert(
    !(fallbackDescription.scripts?.pre_animation ?? []).join("\n").includes("Xvar"),
    `${familyConfig.fallbackEntityPath} must not use random Xvar texture selection`
  );
}

function main() {
  validateFixedRenderController();

  const generated = readJson(paths.generatedVariants);
  for (const familyConfig of families) {
    validateFamily(familyConfig, generated);
  }

  console.log("EFZ infected variant validation passed.");
}

main();
