import fs from "node:fs";

const paths = {
  zombieEntity: "EFZ_Entities_RP/entity/zombie.entity.json",
  huskEntity: "EFZ_Entities_RP/entity/husk.entity.json",
  renderControllers: "EFZ_Entities_RP/render_controllers/zombie_husk.render_controllers.json",
  generatedVariants: "EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json",
  zombieTexturesDir: "EFZ_Entities_RP/textures/entity/efz/zombies",
  huskTexturesDir: "EFZ_Entities_RP/textures/entity/efz/husks"
};

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function listTextureStems(dir) {
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".png"))
    .map((name) => name.slice(0, -4));
}

function texturePathStems(textures) {
  return Object.values(textures)
    .map((texturePath) => texturePath.split("/").pop());
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getObjectKeys(obj) {
  return Object.keys(obj ?? {});
}

function compareSet(label, a, b) {
  const aSet = new Set(a);
  const bSet = new Set(b);

  const missing = a.filter((value) => !bSet.has(value));
  const extra = b.filter((value) => !aSet.has(value));

  assert(missing.length === 0, `${label}: missing values in target -> ${missing.join(", ")}`);
  assert(extra.length === 0, `${label}: extra values in target -> ${extra.join(", ")}`);
}

function validateFamily({ family, entityPath, textureDir, rcArrayPath, expectedMaxIndex, generatedList }) {
  const entity = readJson(entityPath);
  const rcJson = readJson(paths.renderControllers);
  const textureObject = entity["minecraft:client_entity"].description.textures;
  const textures = getObjectKeys(textureObject);
  const textureFiles = texturePathStems(textureObject);
  const onDisk = listTextureStems(textureDir);

  const controller = rcJson.render_controllers[rcArrayPath.controller];
  const arrayValues = controller.arrays.textures[rcArrayPath.array].map((value) => value.replace("Texture.", ""));

  compareSet(`${family} entity texture paths vs files`, textureFiles, onDisk);
  compareSet(`${family} render array vs entity textures`, arrayValues, textures);
  compareSet(`${family} generated variants vs texture files`, generatedList, textureFiles);

  const preAnimation = entity["minecraft:client_entity"].description.scripts.pre_animation.join("\n");
  assert(
    preAnimation.includes(`math.die_roll_integer(1, 0, ${expectedMaxIndex})`) ||
      preAnimation.includes(`Math.random(0,${expectedMaxIndex})`) ||
      preAnimation.includes(`Math.random(0, ${expectedMaxIndex})`),
    `${family} pre_animation index range is not 0..${expectedMaxIndex}`
  );
}

function main() {
  const generated = readJson(paths.generatedVariants);

  validateFamily({
    family: "zombie",
    entityPath: paths.zombieEntity,
    textureDir: paths.zombieTexturesDir,
    rcArrayPath: { controller: "controller.render.zombie", array: "Array.skins" },
    expectedMaxIndex: 150,
    generatedList: generated.zombies
  });

  validateFamily({
    family: "husk",
    entityPath: paths.huskEntity,
    textureDir: paths.huskTexturesDir,
    rcArrayPath: { controller: "controller.render.husk", array: "Array.skins" },
    expectedMaxIndex: 24,
    generatedList: generated.husks
  });

  console.log("Zombie/Husk random skin selector validation passed.");
}

main();
