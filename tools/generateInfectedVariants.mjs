import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const families = [
  {
    key: "zombies",
    singular: "zombie",
    entityPrefix: "efz:infected_zombie_",
    filePrefix: "infected_zombie_",
    textureDir: "EFZ_Entities_RP/textures/entity/efz/zombies",
    textureBase: "textures/entity/efz/zombies",
    vanillaFallbackPath: "EFZ_Entities_RP/entity/zombie.entity.json",
    vanillaFallbackIdentifier: "minecraft:zombie",
    vanillaFallbackController: "controller.render.zombie",
    geometry: "geometry.zombie",
    spawnEggIndex: 12,
    bpHealth: 20,
    bpAttack: 3,
    bpMovement: 0.23,
    burnsInDaylight: true
  },
  {
    key: "husks",
    singular: "husk",
    entityPrefix: "efz:infected_husk_",
    filePrefix: "infected_husk_",
    textureDir: "EFZ_Entities_RP/textures/entity/efz/husks",
    textureBase: "textures/entity/efz/husks",
    vanillaFallbackPath: "EFZ_Entities_RP/entity/husk.entity.json",
    vanillaFallbackIdentifier: "minecraft:husk",
    vanillaFallbackController: "controller.render.husk",
    geometry: "geometry.zombie.husk.v1.8",
    spawnEggIndex: 28,
    bpHealth: 22,
    bpAttack: 3,
    bpMovement: 0.23,
    burnsInDaylight: false
  }
];

const bpOutDir = "EFZ_Entities_BP/entities/infected";
const rpOutDir = "EFZ_Entities_RP/entity/infected";
const generatedVariantsPath = "EFZ_Scripts_BP/scripts/data/zombieVariants.generated.json";

function rel(...parts) {
  return path.join(repoRoot, ...parts);
}

function readTextureNames(textureDir) {
  return fs.readdirSync(rel(textureDir))
    .filter((name) => name.endsWith(".png"))
    .map((name) => name.slice(0, -4))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+$/)?.[0] ?? 0);
      const bNum = Number(b.match(/\d+$/)?.[0] ?? 0);
      return aNum - bNum || a.localeCompare(b);
    });
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(rel(relativePath)), { recursive: true });
  fs.writeFileSync(rel(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function clearGeneratedFiles(relativeDir, prefix) {
  fs.mkdirSync(rel(relativeDir), { recursive: true });
  for (const name of fs.readdirSync(rel(relativeDir))) {
    if (name.startsWith(prefix) && name.endsWith(".json")) {
      fs.rmSync(rel(relativeDir, name));
    }
  }
}

function makeBpEntity(identifier, family) {
  const components = {
    "minecraft:type_family": {
      family: ["efz_infected", "infected", family.singular, "undead", "monster", "mob"]
    },
    "minecraft:collision_box": {
      width: 0.6,
      height: 1.9
    },
    "minecraft:health": {
      value: family.bpHealth,
      max: family.bpHealth
    },
    "minecraft:attack": {
      damage: family.bpAttack
    },
    "minecraft:movement": {
      value: family.bpMovement
    },
    "minecraft:follow_range": {
      value: 40
    },
    "minecraft:despawn": {
      despawn_from_distance: {}
    },
    "minecraft:navigation.walk": {
      can_path_over_water: true,
      can_pass_doors: true,
      can_break_doors: true,
      avoid_water: false
    },
    "minecraft:movement.basic": {},
    "minecraft:jump.static": {},
    "minecraft:can_climb": {},
    "minecraft:nameable": {},
    "minecraft:physics": {},
    "minecraft:pushable": {
      is_pushable: true,
      is_pushable_by_piston: true
    },
    "minecraft:behavior.float": {
      priority: 0
    },
    "minecraft:behavior.hurt_by_target": {
      priority: 1
    },
    "minecraft:behavior.nearest_attackable_target": {
      priority: 2,
      must_see: false,
      reselect_targets: true,
      entity_types: [
        {
          filters: {
            test: "is_family",
            subject: "other",
            value: "player"
          },
          max_dist: 40
        },
        {
          filters: {
            test: "is_family",
            subject: "other",
            value: "villager"
          },
          max_dist: 24
        },
        {
          filters: {
            test: "is_family",
            subject: "other",
            value: "iron_golem"
          },
          max_dist: 24
        }
      ]
    },
    "minecraft:behavior.melee_attack": {
      priority: 3,
      speed_multiplier: 1,
      track_target: true
    },
    "minecraft:behavior.random_stroll": {
      priority: 6,
      speed_multiplier: 1
    },
    "minecraft:behavior.look_at_player": {
      priority: 7,
      look_distance: 8
    },
    "minecraft:behavior.random_look_around": {
      priority: 8
    },
    "minecraft:conditional_bandwidth_optimization": {}
  };

  if (family.burnsInDaylight) {
    components["minecraft:burns_in_daylight"] = {};
  }

  return {
    format_version: "1.21.50",
    "minecraft:entity": {
      description: {
        identifier,
        is_spawnable: false,
        is_summonable: true,
        is_experimental: false
      },
      components
    }
  };
}

function makeRpEntity(identifier, textureName, family) {
  return {
    format_version: "1.8.0",
    "minecraft:client_entity": {
      description: {
        identifier,
        materials: {
          default: "spider"
        },
        textures: {
          default: `${family.textureBase}/${textureName}`
        },
        geometry: {
          default: family.geometry
        },
        scripts: {
          pre_animation: [
            "variable.tcos0 = (Math.cos(query.modified_distance_moved * 38.17) * query.modified_move_speed / variable.gliding_speed_value) * 57.3;"
          ]
        },
        animations: {
          humanoid_big_head: "animation.humanoid.big_head",
          humanoid_base_pose: "animation.humanoid.base_pose.v1.0",
          look_at_target_default: "animation.humanoid.look_at_target.default.v1.0",
          look_at_target_gliding: "animation.humanoid.look_at_target.gliding.v1.0",
          look_at_target_swimming: "animation.humanoid.look_at_target.swimming.v1.0",
          move: "animation.humanoid.move.v1.0",
          "riding.arms": "animation.humanoid.riding.arms.v1.0",
          "riding.legs": "animation.humanoid.riding.legs.v1.0",
          holding: "animation.humanoid.holding.v1.0",
          brandish_spear: "animation.humanoid.brandish_spear.v1.0",
          charging: "animation.humanoid.charging.v1.0",
          "attack.rotations": "animation.humanoid.attack.rotations.v1.0",
          sneaking: "animation.humanoid.sneaking.v1.0",
          bob: "animation.humanoid.bob.v1.0",
          damage_nearby_mobs: "animation.humanoid.damage_nearby_mobs.v1.0",
          bow_and_arrow: "animation.humanoid.bow_and_arrow.v1.0",
          swimming: "animation.humanoid.swimming.v1.0",
          use_item_progress: "animation.humanoid.use_item_progress.v1.0",
          zombie_attack_bare_hand: "animation.zombie.attack_bare_hand",
          zombie_swimming: "animation.zombie.swimming"
        },
        animation_controllers: [
          { humanoid_baby_big_head: "controller.animation.humanoid.baby_big_head" },
          { humanoid_base_pose: "controller.animation.humanoid.base_pose" },
          { look_at_target: "controller.animation.humanoid.look_at_target" },
          { move: "controller.animation.humanoid.move" },
          { riding: "controller.animation.humanoid.riding" },
          { holding: "controller.animation.humanoid.holding" },
          { brandish_spear: "controller.animation.humanoid.brandish_spear" },
          { charging: "controller.animation.humanoid.charging" },
          { attack: "controller.animation.humanoid.attack" },
          { sneaking: "controller.animation.humanoid.sneaking" },
          { bob: "controller.animation.humanoid.bob" },
          { damage_nearby_mobs: "controller.animation.humanoid.damage_nearby_mobs" },
          { bow_and_arrow: "controller.animation.humanoid.bow_and_arrow" },
          { swimming: "controller.animation.humanoid.swimming" },
          { use_item_progress: "controller.animation.humanoid.use_item_progress" },
          { zombie_attack_bare_hand: "controller.animation.zombie.attack_bare_hand" },
          { zombie_swimming: "controller.animation.zombie.swimming" }
        ],
        render_controllers: ["controller.render.efz_infected"],
        enable_attachables: true,
        spawn_egg: {
          texture: "spawn_egg",
          texture_index: family.spawnEggIndex
        }
      }
    }
  };
}

function main() {
  const generated = {};

  for (const family of families) {
    const textureNames = readTextureNames(family.textureDir);
    generated[family.key] = textureNames;
    generated[`${family.key}Entities`] = [];

    clearGeneratedFiles(bpOutDir, family.filePrefix);
    clearGeneratedFiles(rpOutDir, family.filePrefix);

    textureNames.forEach((textureName, index) => {
      const suffix = String(index).padStart(3, "0");
      const identifier = `${family.entityPrefix}${suffix}`;
      const fileName = `${family.filePrefix}${suffix}.json`;
      generated[`${family.key}Entities`].push(identifier);

      writeJson(path.join(bpOutDir, fileName), makeBpEntity(identifier, family));
      writeJson(path.join(rpOutDir, fileName), makeRpEntity(identifier, textureName, family));
    });

    const fallback = makeRpEntity(family.vanillaFallbackIdentifier, textureNames[0], family);
    fallback["minecraft:client_entity"].description.render_controllers = [family.vanillaFallbackController];
    writeJson(family.vanillaFallbackPath, fallback);
  }

  writeJson(generatedVariantsPath, generated);
  console.log(`Generated ${generated.zombiesEntities.length} zombie and ${generated.husksEntities.length} husk infected variants.`);
}

main();
