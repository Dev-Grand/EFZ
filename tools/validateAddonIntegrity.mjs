import fs from 'node:fs';
import path from 'node:path';
import { BUYER_TRADES, SELLER_TRADES } from '../EFZ_Scripts_BP/scripts/data/trades.js';
import { EFZ_LINKS } from '../EFZ_Scripts_BP/scripts/data/links.js';
import { PATCH_NOTES } from '../EFZ_Scripts_BP/scripts/data/patchNotes.js';
import { RADIATION_ZONES } from '../EFZ_Scripts_BP/scripts/data/radiationZones.js';
import { SAFE_ZONES } from '../EFZ_Scripts_BP/scripts/data/safeZones.js';
import { EFZ_MENU_ITEM_ID } from '../EFZ_Scripts_BP/scripts/data/constants.js';

const repoRoot = process.cwd();

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectNpcEntityIds() {
  const dir = path.join(repoRoot, 'EFZ_Entities_BP/entities');
  const ids = new Set();

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const rel = path.join('EFZ_Entities_BP/entities', file);
    const data = readJson(rel);
    const id = data?.['minecraft:entity']?.description?.identifier;
    if (id?.startsWith('efz:')) ids.add(id);
  }

  return ids;
}

function validateTradeTables() {
  const npcIds = collectNpcEntityIds();
  const allTradeNpcs = new Set([...Object.keys(SELLER_TRADES), ...Object.keys(BUYER_TRADES)]);

  for (const npcId of allTradeNpcs) {
    assert(npcIds.has(npcId), `Trade table references missing NPC entity id: ${npcId}`);
  }

  const tradeGroups = [
    ['SELLER_TRADES', SELLER_TRADES, 'price'],
    ['BUYER_TRADES', BUYER_TRADES, 'reward']
  ];

  for (const [name, table, moneyKey] of tradeGroups) {
    for (const [npcId, trades] of Object.entries(table)) {
      assert(Array.isArray(trades) && trades.length > 0, `${name}.${npcId} must be a non-empty array`);

      for (const trade of trades) {
        assert(typeof trade.itemId === 'string' && trade.itemId.includes(':'), `${name}.${npcId} has invalid itemId`);
        assert(Number.isInteger(trade.amount) && trade.amount > 0, `${name}.${npcId} has invalid amount`);
        assert(Number.isInteger(trade[moneyKey]) && trade[moneyKey] >= 0, `${name}.${npcId} has invalid ${moneyKey}`);
      }
    }
  }
}

function validateDeadBodyEntity() {
  const deadBody = readJson('EFZ_Entities_BP/entities/dead_body.json');
  const prop = deadBody?.['minecraft:entity']?.description?.properties?.['efz:skin_type'];
  assert(prop?.type === 'int', 'dead_body efz:skin_type must be int');
  assert(Array.isArray(prop?.range) && prop.range[0] === 0 && prop.range[1] === 6, 'dead_body efz:skin_type range must stay [0,6]');
}

function validateScriptManifestDeps() {
  const manifest = readJson('EFZ_Scripts_BP/manifest.json');
  const deps = manifest?.dependencies ?? [];
  const depNames = new Set(deps.map((d) => d.module_name).filter(Boolean));

  const npcTradesSrc = fs.readFileSync(path.join(repoRoot, 'EFZ_Scripts_BP/scripts/systems/npcTrades.js'), 'utf8');
  const usesUi = npcTradesSrc.includes('@minecraft/server-ui');

  if (usesUi) {
    assert(depNames.has('@minecraft/server-ui'), 'manifest missing @minecraft/server-ui while npcTrades imports it');
  }
}

function validateZoneBox(zone, label) {
  assert(typeof zone.id === 'string' && zone.id.length > 0, `${label} has invalid id`);
  assert(typeof zone.dimensionId === 'string' && zone.dimensionId.includes(':'), `${label}.${zone.id} has invalid dimensionId`);
  assert(zone.min && zone.max, `${label}.${zone.id} must define min and max`);

  for (const axis of ['x', 'y', 'z']) {
    assert(Number.isFinite(zone.min[axis]) && Number.isFinite(zone.max[axis]), `${label}.${zone.id} has invalid ${axis} bounds`);
    if (!zone.inactive) {
      assert(zone.min[axis] <= zone.max[axis], `${label}.${zone.id} min.${axis} must be <= max.${axis}`);
    }
  }
}

function validateZoneTables() {
  assert(Array.isArray(RADIATION_ZONES) && RADIATION_ZONES.length === 4, 'RADIATION_ZONES must contain exactly 4 zones');
  assert(Array.isArray(SAFE_ZONES) && SAFE_ZONES.length === 1, 'SAFE_ZONES must contain exactly 1 zone');

  for (const zone of RADIATION_ZONES) validateZoneBox(zone, 'RADIATION_ZONES');
  for (const zone of SAFE_ZONES) validateZoneBox(zone, 'SAFE_ZONES');
}

function validatePlayerMenuData() {
  assert(Array.isArray(EFZ_LINKS) && EFZ_LINKS.length > 0, 'EFZ_LINKS must be a non-empty array');
  for (const link of EFZ_LINKS) {
    assert(typeof link.label === 'string' && link.label.length > 0, 'EFZ_LINKS entries need labels');
    assert(typeof link.value === 'string' && link.value.length > 0, `EFZ_LINKS.${link.label} needs a value`);
  }

  assert(Array.isArray(PATCH_NOTES) && PATCH_NOTES.length > 0, 'PATCH_NOTES must be a non-empty array');
  for (const note of PATCH_NOTES) {
    assert(typeof note.version === 'string' && note.version.length > 0, 'PATCH_NOTES entries need versions');
    assert(typeof note.title === 'string' && note.title.length > 0, `PATCH_NOTES.${note.version} needs a title`);
    assert(Array.isArray(note.items) && note.items.length > 0, `PATCH_NOTES.${note.version} must list at least one item`);
  }
}

function validateGearMenuItem() {
  assert(EFZ_MENU_ITEM_ID === 'efz:gear_menu', 'EFZ_MENU_ITEM_ID must stay efz:gear_menu');

  const item = readJson('EFZ_Arsenal_BP/items/gear_menu.json')?.['minecraft:item'];
  const components = item?.components ?? {};
  assert(item?.description?.identifier === EFZ_MENU_ITEM_ID, 'Gear menu item id must match EFZ_MENU_ITEM_ID');
  assert(components?.['minecraft:icon'] === 'efz_gear_menu', 'Gear menu item must use efz_gear_menu texture key');
  assert(components?.['minecraft:max_stack_size'] === 1, 'Gear menu item must be max stack 1');
  assert(components?.['minecraft:custom_components']?.includes('efz:gear_menu'), 'Gear menu custom component is missing');

  const textureAtlas = readJson('EFZ_Arsenal_RP/textures/item_texture.json')?.texture_data ?? {};
  assert(textureAtlas.efz_gear_menu?.textures === 'textures/items/efz/menu/gear', 'Gear menu texture atlas entry is invalid');
  assert(fs.existsSync(path.join(repoRoot, 'EFZ_Arsenal_RP/textures/items/efz/menu/gear.png')), 'Gear menu icon file is missing');

  const menuSrc = fs.readFileSync(path.join(repoRoot, 'EFZ_Scripts_BP/scripts/systems/playerMenus.js'), 'utf8');
  assert(menuSrc.includes('registerCustomComponent("efz:gear_menu"'), 'Gear menu custom component is not registered');
  assert(menuSrc.includes('ItemLockMode.slot'), 'Gear menu item must be slot-locked');
  assert(menuSrc.includes('keepOnDeath = true'), 'Gear menu item must be kept on death');
  assert(menuSrc.includes('world.afterEvents.itemUse'), 'Gear menu item needs itemUse fallback handling');
}

function validateGraveLootFlow() {
  const graveSrc = fs.readFileSync(path.join(repoRoot, 'EFZ_Scripts_BP/scripts/systems/graves.js'), 'utf8');
  assert(graveSrc.includes('gamerule keepInventory true'), 'Grave system must enforce keepInventory so loot moves to dead bodies instead of vanilla drops');
  assert(graveSrc.includes('captureAndClearInventory(player)'), 'Grave system must clear player inventory after corpse capture');
  assert(graveSrc.includes('spawnLootBody(player, deathLocation, deathDimension, items)'), 'Grave system must spawn a loot body on player death');
  assert(graveSrc.includes('absorbDeathDropsIntoBody(body, deathDimension, deathLocation)'), 'Grave system must absorb vanilla death drops into the body as a fallback');
}

function validateRadiationHudContract() {
  const playerStatsSrc = fs.readFileSync(path.join(repoRoot, 'EFZ_Scripts_BP/scripts/systems/playerStats.js'), 'utf8');
  assert(playerStatsSrc.includes('formatRadiationStatus'), 'HUD must format numeric radiation status');
  assert(playerStatsSrc.includes('radiation.exposureSeconds'), 'HUD must display radiation exposure seconds');
  assert(playerStatsSrc.includes('RAD FADING'), 'HUD must show decaying radiation exposure outside zones');
  assert(playerStatsSrc.includes('RADIATION_CONFIG.levelThresholdsSeconds'), 'HUD must show progress toward radiation level thresholds');
}

function validatePlayerHeroRenderContract() {
  const player = readJson('EFZ_Entities_RP/entity/player.json')?.['minecraft:client_entity']?.description;
  assert(player?.identifier === 'minecraft:player', 'Player client entity override must target minecraft:player');
  assert(player?.textures?.default === 'textures/entity/hero', 'Player default texture path must render EFZ hero');
  assert(player?.geometry?.default === 'geometry.hero', 'Player default geometry alias must render EFZ hero model');
  assert(player?.enable_attachables === true, 'Player attachables must stay enabled for held/equipped item rendering');
  assert(fs.existsSync(path.join(repoRoot, 'EFZ_Entities_RP/textures/entity/hero.png')), 'Player hero texture file is missing');
  assert(fs.existsSync(path.join(repoRoot, 'EFZ_Entities_RP/animation_controllers/player.animation_controllers.json')), 'Vanilla player animation controllers must be bundled');
  assert(fs.existsSync(path.join(repoRoot, 'EFZ_Entities_RP/animations/player.animation.json')), 'Vanilla player third-person animations must be bundled');
  assert(fs.existsSync(path.join(repoRoot, 'EFZ_Entities_RP/animations/player_firstperson.animation.json')), 'Vanilla player first-person animations must be bundled');

  const renderControllers = readJson('EFZ_Entities_RP/render_controllers/player.render_controllers.json')?.render_controllers ?? {};
  for (const id of [
    'controller.render.player.first_person',
    'controller.render.player.third_person',
    'controller.render.player.map'
  ]) {
    const controller = renderControllers[id];
    assert(controller?.geometry === 'Geometry.default', `${id} must keep vanilla Geometry.default wiring`);
    assert(controller?.textures?.includes('Texture.default'), `${id} must keep vanilla Texture.default wiring`);
  }
}

function validateDisabledVanillaParticles() {
  const particleDir = path.join(repoRoot, 'EFZ_Core_RP/particles');
  assert(fs.existsSync(particleDir), 'EFZ_Core_RP/particles must exist for vanilla particle suppression');

  const files = fs.readdirSync(particleDir).filter((file) => file.endsWith('.json'));
  assert(files.length >= 180, `Expected at least 180 disabled vanilla particle overrides, found ${files.length}`);

  const seen = new Set();
  for (const file of files) {
    const particle = readJson(path.join('EFZ_Core_RP/particles', file))?.particle_effect;
    const identifier = particle?.description?.identifier;
    assert(typeof identifier === 'string' && identifier.startsWith('minecraft:'), `${file} must override a minecraft particle identifier`);
    assert(!seen.has(identifier), `Duplicate disabled particle identifier: ${identifier}`);
    seen.add(identifier);

    const instantRate = particle?.components?.['minecraft:emitter_rate_instant'];
    assert(instantRate?.num_particles === 0, `${identifier} must emit zero particles`);
  }

  assert(seen.has('minecraft:basic_smoke_particle'), 'Missing disabled smoke particle override');
  assert(seen.has('minecraft:critical_hit_emitter'), 'Missing disabled critical hit particle override');
  assert(seen.has('minecraft:death_explosion_emitter'), 'Missing disabled death explosion particle override');
}

function walkJsonFiles(relDir) {
  const absDir = path.join(repoRoot, relDir);
  const files = [];

  function walk(currentAbs, currentRel) {
    for (const entry of fs.readdirSync(currentAbs, { withFileTypes: true })) {
      const childAbs = path.join(currentAbs, entry.name);
      const childRel = path.join(currentRel, entry.name);
      if (entry.isDirectory()) {
        walk(childAbs, childRel);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(childRel);
      }
    }
  }

  walk(absDir, relDir);
  return files;
}

function loadLangKeys(relPath) {
  const keys = new Set();
  const src = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    keys.add(trimmed.slice(0, trimmed.indexOf('=')));
  }
  return keys;
}

function textureFileExists(texturePath) {
  return ['.png', '.tga'].some((ext) => fs.existsSync(path.join(repoRoot, 'EFZ_Arsenal_RP', `${texturePath}${ext}`)));
}

function validateDeadZoneArmorImport() {
  const armorFiles = walkJsonFiles('EFZ_Arsenal_BP/items/armor');
  const clothesFiles = walkJsonFiles('EFZ_Arsenal_BP/items/clothes');
  assert(armorFiles.length >= 117, `Expected at least 117 imported armor item files, found ${armorFiles.length}`);
  assert(clothesFiles.length >= 108, `Expected at least 108 imported clothes item files, found ${clothesFiles.length}`);

  const textureAtlas = readJson('EFZ_Arsenal_RP/textures/item_texture.json')?.texture_data ?? {};
  const langKeys = loadLangKeys('EFZ_Arsenal_RP/texts/en_US.lang');
  const allowedWearableSlots = new Set(['slot.armor.head', 'slot.armor.chest', 'slot.armor.legs', 'slot.armor.feet']);
  const itemIds = new Set();

  for (const relFile of [...armorFiles, ...clothesFiles]) {
    const item = readJson(relFile)?.['minecraft:item'];
    const id = item?.description?.identifier;
    const components = item?.components ?? {};
    const wearable = components?.['minecraft:wearable'];
    const icon = components?.['minecraft:icon'];
    const iconKey = typeof icon === 'string' ? icon : icon?.textures?.default;

    assert(typeof id === 'string' && id.startsWith('mcpe:'), `${relFile} must preserve a mcpe:* item identifier`);
    assert(!itemIds.has(id), `Duplicate imported armor/clothes item id: ${id}`);
    itemIds.add(id);
    assert(wearable && allowedWearableSlots.has(wearable.slot), `${id} must be wearable in a supported armor slot`);
    assert(components?.['minecraft:max_stack_size'] === 1, `${id} must be max stack 1`);
    assert(typeof iconKey === 'string' && textureAtlas[iconKey], `${id} icon key is missing from item_texture.json: ${iconKey}`);

    const textureEntry = textureAtlas[iconKey]?.textures;
    const texturePath = Array.isArray(textureEntry) ? textureEntry[0] : textureEntry;
    assert(typeof texturePath === 'string' && textureFileExists(texturePath), `${id} icon texture file is missing: ${texturePath}`);
    assert(langKeys.has(`item.${id}.name`), `${id} display name is missing from en_US.lang`);
  }

  assert(itemIds.size >= 225, `Expected at least 225 imported DeadZone wearable ids, found ${itemIds.size}`);
  for (const sampleId of ['mcpe:ballistic_black', 'mcpe:press_vest', 'mcpe:hoodie_black', 'mcpe:jean_black']) {
    assert(itemIds.has(sampleId), `Missing imported sample wearable: ${sampleId}`);
  }

  const attachableBindings = new Map();
  for (const relFile of [...walkJsonFiles('EFZ_Arsenal_RP/attachables/armor'), ...walkJsonFiles('EFZ_Arsenal_RP/attachables/clothes')]) {
    const description = readJson(relFile)?.['minecraft:attachable']?.description;
    const id = description?.identifier;
    if (typeof id === 'string') attachableBindings.set(id, relFile);
    for (const boundItem of Object.keys(description?.item ?? {})) attachableBindings.set(boundItem, relFile);
  }

  for (const itemId of itemIds) {
    assert(attachableBindings.has(itemId), `${itemId} is missing a matching armor/clothes attachable`);
  }

  for (const file of [
    'empty_armor_slot_helmet.png',
    'empty_armor_slot_chestplate.png',
    'empty_armor_slot_leggings.png',
    'empty_armor_slot_boots.png',
    'empty_armor_slot_shield.png'
  ]) {
    assert(fs.existsSync(path.join(repoRoot, 'EFZ_Core_RP/textures/ui', file)), `Missing copied armor inventory UI texture: ${file}`);
  }
}

function main() {
  validateTradeTables();
  validateDeadBodyEntity();
  validateScriptManifestDeps();
  validateZoneTables();
  validatePlayerMenuData();
  validateGearMenuItem();
  validateGraveLootFlow();
  validateRadiationHudContract();
  validatePlayerHeroRenderContract();
  validateDisabledVanillaParticles();
  validateDeadZoneArmorImport();
  console.log('Addon integrity validation passed.');
}

main();
