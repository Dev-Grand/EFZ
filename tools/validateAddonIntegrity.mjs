import fs from 'node:fs';
import path from 'node:path';
import { BUYER_TRADES, SELLER_TRADES } from '../EFZ_Scripts_BP/scripts/data/trades.js';
import { EFZ_LINKS } from '../EFZ_Scripts_BP/scripts/data/links.js';
import { PATCH_NOTES } from '../EFZ_Scripts_BP/scripts/data/patchNotes.js';
import { RADIATION_ZONES } from '../EFZ_Scripts_BP/scripts/data/radiationZones.js';
import { SAFE_ZONES } from '../EFZ_Scripts_BP/scripts/data/safeZones.js';

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
    assert(zone.min[axis] <= zone.max[axis], `${label}.${zone.id} min.${axis} must be <= max.${axis}`);
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

function main() {
  validateTradeTables();
  validateDeadBodyEntity();
  validateScriptManifestDeps();
  validateZoneTables();
  validatePlayerMenuData();
  console.log('Addon integrity validation passed.');
}

main();
