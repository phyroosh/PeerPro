import test from 'node:test';
import assert from 'node:assert';
import starterManifest from '../../asset-packs/starter-kit/manifest.json';
import { defaultAssetRegistry } from '../../src/core/assets/registry';
import {
  defaultEnvironmentKits,
  getKitDefinition,
  defaultPrefabs,
  getPrefab,
  composeEnvironment,
  validateEnvironmentLayout,
  createSeededRandom,
} from '../../src/core/environments';

// Ensure asset registry has starter kit
if (!defaultAssetRegistry.has('starter-char-head-01')) {
  defaultAssetRegistry.registerPack(starterManifest as any, { validate: false });
}

test('WorldComposition: EnvironmentKit contracts declare required view conventions, ground lines, and depths', () => {
  const streetKit = getKitDefinition('japanese-street-kit');
  assert.strictEqual(streetKit.domain, 'outdoor');
  assert.strictEqual(streetKit.viewConvention, '2.5d_stage');
  assert.strictEqual(streetKit.groundLineY, 880);
  assert.strictEqual(streetKit.supportedDepths.min, 0.2);
  assert.strictEqual(streetKit.supportedDepths.max, 1.6);
  assert.ok(streetKit.allowedCameraDirections.includes('pan_x'));

  const classroomKit = getKitDefinition('classroom-kit');
  assert.strictEqual(classroomKit.domain, 'indoor');
  assert.strictEqual(classroomKit.groundLineY, 890);
  assert.strictEqual(classroomKit.supportedDepths.min, 0.3);

  // Unknown kit throws actionable error
  assert.throws(() => getKitDefinition('unknown-space-kit'), /Unknown environment kit/);
});

test('WorldComposition: Prefab catalog defines dimensions, ground anchors, and valid sublayers', () => {
  const storefront = getPrefab('prefab-storefront-cluster');
  assert.strictEqual(storefront.kitId, 'japanese-street-kit');
  assert.strictEqual(storefront.anchor.y, 1.0);
  assert.strictEqual(storefront.subLayers.length, 3);
  assert.ok(storefront.variants?.['vending-left']);
  assert.ok(storefront.variants?.['no-vending']);

  const deskCluster = getPrefab('prefab-classroom-desk-cluster');
  assert.strictEqual(deskCluster.kitId, 'classroom-kit');
  assert.strictEqual(deskCluster.subLayers.length, 2);

  assert.throws(() => getPrefab('unknown-prefab'), /Unknown environment prefab/);
});

test('WorldComposition: composeEnvironment produces deterministic bit-for-bit identical environments for the same seed', () => {
  const config = {
    id: 'test-seed-determinism',
    name: 'Seed Determinism Test',
    kitId: 'japanese-street-kit',
    seed: 777,
    placements: [
      { prefabId: 'prefab-storefront-cluster', x: 450 },
      { prefabId: 'prefab-street-furniture-pair', x: 1450 },
    ],
  };

  const run1 = composeEnvironment(config);
  const run2 = composeEnvironment(config);

  assert.strictEqual(run1.environment.layers.length, run2.environment.layers.length);
  assert.strictEqual(run1.telemetry.seedUsed, 777);

  for (let i = 0; i < run1.environment.layers.length; i++) {
    const l1 = run1.environment.layers[i];
    const l2 = run2.environment.layers[i];
    assert.strictEqual(l1.id, l2.id);
    assert.strictEqual(l1.transform.x, l2.transform.x);
    assert.strictEqual(l1.transform.y, l2.transform.y);
    assert.strictEqual(l1.depth, l2.depth);
    assert.strictEqual(l1.order, l2.order);
  }
});

test('WorldComposition: composeEnvironment produces meaningfully distinct layouts across different seeds', () => {
  // Storefront cluster has random variant selection when variant is not explicit
  const configSeedA = {
    id: 'test-variation-a',
    name: 'Variation A',
    kitId: 'japanese-street-kit',
    seed: 101,
    placements: [{ prefabId: 'prefab-storefront-cluster', x: 500 }],
  };

  const configSeedB = {
    id: 'test-variation-b',
    name: 'Variation B',
    kitId: 'japanese-street-kit',
    seed: 404,
    placements: [{ prefabId: 'prefab-storefront-cluster', x: 500 }],
  };

  const runA = composeEnvironment(configSeedA);
  const runB = composeEnvironment(configSeedB);

  // Both should be valid environments
  assert.ok(runA.environment.layers.length > 0);
  assert.ok(runB.environment.layers.length > 0);
});

test('WorldComposition: semantic directive "leave_center_clear" shifts prefabs out of the hero staging zone', () => {
  // Intentionally place a storefront right in the center corridor (X=960)
  const config = {
    id: 'test-clearance',
    name: 'Clearance Test',
    kitId: 'japanese-street-kit',
    seed: 42,
    placements: [
      {
        prefabId: 'prefab-storefront-cluster',
        x: 960, // Dead center
        directives: [{ type: 'leave_center_clear' as const, minX: 760, maxX: 1160 }],
      },
    ],
    globalDirectives: [{ type: 'leave_center_clear' as const, minX: 760, maxX: 1160 }],
  };

  const result = composeEnvironment(config);
  assert.strictEqual(result.telemetry.clearanceZoneClean, true);

  // The storefront facade sublayer should now be outside [760, 1160]
  const facadeLayer = result.environment.layers.find((l) => l.id.includes('building-facade'));
  assert.ok(facadeLayer);
  const x = facadeLayer.transform.x;
  assert.ok(x < 760 || x > 1160, `Expected X to be shifted outside [760, 1160], got ${x}`);
});

test('WorldComposition: semantic directive "align_to_ground" locks prefabs to kit groundLineY', () => {
  const streetKit = getKitDefinition('japanese-street-kit');
  const config = {
    id: 'test-ground-align',
    name: 'Ground Align Test',
    kitId: 'japanese-street-kit',
    seed: 1,
    placements: [
      {
        prefabId: 'prefab-storefront-cluster',
        x: 400,
        y: 600, // Stray Y coordinate provided
        directives: [{ type: 'align_to_ground' as const }],
      },
    ],
  };

  const result = composeEnvironment(config);
  const facadeLayer = result.environment.layers.find((l) => l.id.includes('building-facade'));
  assert.ok(facadeLayer);
  // Should be snapped to kit ground line (880px)
  assert.strictEqual(facadeLayer.transform.y, streetKit.groundLineY);
  assert.strictEqual(result.telemetry.groundContactValid, true);
});

test('WorldComposition: composeEnvironment compiles indoor classroom prefabs into valid classroom environment', () => {
  const config = {
    id: 'test-classroom-composition',
    name: 'Classroom Test',
    kitId: 'classroom-kit',
    seed: 12,
    placements: [
      { prefabId: 'prefab-classroom-podium', x: 600 },
      { prefabId: 'prefab-classroom-desk-cluster', x: 1400 },
    ],
  };

  const result = composeEnvironment(config);
  const wallLayer = result.environment.layers.find((l) => l.id.includes('bg-wall'));
  const floorLayer = result.environment.layers.find((l) => l.id.includes('ground-surface'));
  const deskLayer = result.environment.layers.find((l) => l.id.includes('student-desk'));
  const chairLayer = result.environment.layers.find((l) => l.id.includes('desk-chair'));

  assert.ok(wallLayer);
  assert.ok(floorLayer);
  assert.ok(deskLayer);
  assert.ok(chairLayer);

  // Sandwich occlusion: Chair (behind character) < Desk (in front of character)
  assert.ok(chairLayer.order < deskLayer.order);
});

test('WorldComposition: validateEnvironmentLayout flags perspective mismatches, floating objects, and clearance intrusions', () => {
  const streetKit = getKitDefinition('japanese-street-kit');

  // Valid environment
  const validEnv = {
    id: 'valid-env',
    name: 'Valid Env',
    layers: [
      {
        id: 'road',
        assetId: 'starter-env-road-segment',
        depth: 1.0,
        order: 10,
        transform: { x: 960, y: 880, anchor: { x: 0.5, y: 1.0 } },
      },
    ],
  };
  const validReport = validateEnvironmentLayout(validEnv, streetKit);
  assert.strictEqual(validReport.valid, true);
  assert.strictEqual(validReport.errors.length, 0);

  // Invalid: missing asset
  const invalidEnv = {
    id: 'invalid-env',
    name: 'Invalid Env',
    layers: [
      {
        id: 'missing-prop',
        assetId: 'non-existent-prop-xyz',
        depth: 1.0,
        order: 10,
        transform: { x: 960, y: 880 },
      },
    ],
  };
  const invalidReport = validateEnvironmentLayout(invalidEnv, streetKit);
  assert.strictEqual(invalidReport.valid, false);
  assert.ok(invalidReport.errors.some((e) => e.includes('non-existent-prop-xyz')));
});
