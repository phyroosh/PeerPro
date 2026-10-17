import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import {
  japaneseClassroomPreset,
  japaneseStreetCornerPreset,
  japaneseQuietStreetPreset,
} from '../../src/core/environments/presets';
import {
  EnvironmentDefinitionSchema,
} from '../../src/core/environments/schema';
import {
  validateEnvironmentAssets,
} from '../../src/core/environments/Environment';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

function createRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('EnvironmentKits: japaneseClassroomPreset validates against EnvironmentDefinitionSchema', () => {
  const parseResult = EnvironmentDefinitionSchema.safeParse(japaneseClassroomPreset);
  assert.strictEqual(parseResult.success, true);
  if (!parseResult.success) {
    assert.fail(parseResult.error.message);
  }

  assert.strictEqual(japaneseClassroomPreset.id, 'japanese-classroom');
  assert.strictEqual(japaneseClassroomPreset.domain, 'indoor');
  assert.ok(japaneseClassroomPreset.layers.length >= 8);
});

test('EnvironmentKits: room grammar parameters establish floor and wall boundaries', () => {
  const grammar = japaneseClassroomPreset.grammar;
  assert.ok(grammar, 'japaneseClassroomPreset must define room grammar');
  assert.strictEqual(grammar.floorBaselineY, 890);
  assert.strictEqual(grammar.wallDepth, 0.35);
  assert.strictEqual(grammar.ceilingTrimY, 42);
  assert.deepStrictEqual(grammar.perspectiveVanishingPoint, { x: 960, y: 540 });
});

test('EnvironmentKits: layer planes and occlusion ordering support character staging', () => {
  const layers = japaneseClassroomPreset.layers;

  const wall = layers.find((l) => l.id === 'classroom-wall');
  const window = layers.find((l) => l.id === 'classroom-window');
  const blackboard = layers.find((l) => l.id === 'classroom-blackboard');
  const floor = layers.find((l) => l.id === 'classroom-floor');
  const chair = layers.find((l) => l.id === 'classroom-student-chair-1');
  const desk = layers.find((l) => l.id === 'classroom-student-desk-1');

  assert.ok(wall && window && blackboard && floor && chair && desk);

  // Plane classifications
  assert.strictEqual(wall.plane, 'background');
  assert.strictEqual(window.plane, 'mid_back');
  assert.strictEqual(blackboard.plane, 'mid_back');
  assert.strictEqual(floor.plane, 'background');
  assert.strictEqual(chair.plane, 'mid_back');
  assert.strictEqual(desk.plane, 'character_occluder');

  // Occlusion: Chair is behind character plane (order: 24 < 50), Desk is in front (order: 65 > 50)
  assert.ok(chair.order < 50, 'Chair must render behind character');
  assert.ok(desk.order > 50, 'Desk must render in front of character');
  assert.ok(wall.depth < floor.depth, 'Wall depth must be less than floor depth');
});

test('EnvironmentKits: starter kit contains all 8 indoor classroom assets', () => {
  const registry = createRegistry();

  const indoorAssetIds = [
    'starter-env-classroom-wall',
    'starter-env-classroom-floor',
    'starter-env-classroom-blackboard',
    'starter-env-classroom-window',
    'starter-env-classroom-desk',
    'starter-env-classroom-chair',
    'starter-env-classroom-lectern',
    'starter-env-classroom-clock',
  ];

  for (const id of indoorAssetIds) {
    assert.strictEqual(registry.has(id), true, `Asset ${id} must exist in registry`);
    const asset = registry.get(id);
    assert.ok(asset.tags.includes('indoor'), `Asset ${id} must have "indoor" tag`);
    assert.ok(asset.tags.includes('classroom'), `Asset ${id} must have "classroom" tag`);
    assert.strictEqual(asset.style.family, 'anime-clean-v1');
  }

  // Pre-render validation check
  assert.doesNotThrow(() => {
    validateEnvironmentAssets(japaneseClassroomPreset, registry);
  });
});

test('EnvironmentKits: supports both indoor and outdoor domains in the same system', () => {
  const presets = [
    japaneseStreetCornerPreset,
    japaneseQuietStreetPreset,
    japaneseClassroomPreset,
  ];

  for (const preset of presets) {
    const res = EnvironmentDefinitionSchema.safeParse(preset);
    assert.strictEqual(res.success, true);
  }

  assert.strictEqual(japaneseClassroomPreset.domain, 'indoor');
});
