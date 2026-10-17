import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import { solveCharacterParts } from '../../src/core/characters/solver';
import {
  studentCharacterDefinition,
  studentCharacterDefinitionV2,
  studentThreeQuarterDefinition,
} from '../../src/core/characters/presets';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

function createRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('Style & Angle System: registry contains 30 assets with valid angle metadata', () => {
  const registry = createRegistry();
  const allAssets = registry.getAll();

  assert.strictEqual(allAssets.length, 30);

  // Check 3/4 assets
  const threeQuarterAssets = registry.filter({ angle: 'three_quarter' });
  assert.strictEqual(threeQuarterAssets.length, 5);

  const expected3QIds = [
    'starter-char-body-01-three-quarter',
    'starter-char-head-01-three-quarter',
    'starter-char-eyes-three-quarter',
    'starter-char-hair-three-quarter',
    'starter-char-mouth-three-quarter',
  ];
  for (const id of expected3QIds) {
    assert.ok(
      threeQuarterAssets.some((a) => a.id === id),
      `Expected ${id} to be present in 3/4 assets`
    );
  }

  // Check contact shadow asset
  const shadowAsset = registry.get('starter-prop-contact-shadow');
  assert.strictEqual(shadowAsset.category, 'prop');
  assert.strictEqual(shadowAsset.dimensions.width, 240);
  assert.strictEqual(shadowAsset.dimensions.height, 50);
});

test('Style & Angle System: solves V2 refined character parts with 2-tier cel-shading assets', () => {
  const registry = createRegistry();
  const parts = solveCharacterParts(studentCharacterDefinitionV2, registry);

  assert.strictEqual(parts.length, 5);
  assert.strictEqual(parts[0].slot, 'rootPart');
  assert.strictEqual(parts[0].asset.id, 'starter-char-body-01-v2');

  const head = parts.find((p) => p.slot === 'head');
  const eyes = parts.find((p) => p.slot === 'eyes');
  const mouth = parts.find((p) => p.slot === 'mouth');
  const hair = parts.find((p) => p.slot === 'hairFront');

  assert.strictEqual(head?.asset.id, 'starter-char-head-01-v2');
  assert.strictEqual(eyes?.asset.id, 'starter-char-eyes-neutral-v2');
  assert.strictEqual(mouth?.asset.id, 'starter-char-mouth-smile-v2');
  assert.strictEqual(hair?.asset.id, 'starter-char-hair-short-v2');

  // Verify alignment coordinates
  assert.strictEqual(parts[0].x, -150);
  assert.strictEqual(parts[0].y, -600);
  assert.strictEqual(head?.x, -120);
  assert.strictEqual(head?.y, -745);
});

test('Style & Angle System: solves 3/4 perspective character parts with foreshortened sockets', () => {
  const registry = createRegistry();
  const parts = solveCharacterParts(studentThreeQuarterDefinition, registry);

  assert.strictEqual(parts.length, 5);
  const root = parts.find((p) => p.slot === 'rootPart');
  const head = parts.find((p) => p.slot === 'head');
  const eyes = parts.find((p) => p.slot === 'eyes');
  const mouth = parts.find((p) => p.slot === 'mouth');
  const hair = parts.find((p) => p.slot === 'hairFront');

  assert.strictEqual(root?.asset.id, 'starter-char-body-01-three-quarter');
  assert.strictEqual(head?.asset.id, 'starter-char-head-01-three-quarter');
  assert.strictEqual(eyes?.asset.id, 'starter-char-eyes-three-quarter');
  assert.strictEqual(hair?.asset.id, 'starter-char-hair-three-quarter');
  assert.strictEqual(mouth?.asset.id, 'starter-char-mouth-three-quarter');

  // Neck socket on 3/4 body is at (140, 95)
  // Neck socket on 3/4 head is at (110, 240)
  // rootLocalX = -150, rootLocalY = -600
  // headLocalX = -150 + 140 - 110 = -120
  // headLocalY = -600 + 95 - 240 = -745
  assert.strictEqual(head?.x, -120);
  assert.strictEqual(head?.y, -745);
});

test('Style & Angle System: detects angle mismatch between 3/4 body and front-facing head', () => {
  const registry = createRegistry();

  // Create mismatched character with 3/4 body but front head
  const mismatchedChar = {
    ...studentThreeQuarterDefinition,
    id: 'mismatched-angles',
    slots: {
      ...studentThreeQuarterDefinition.slots,
      head: { assetId: 'starter-char-head-01-v2' }, // angle: 'front'
    },
  };

  assert.throws(
    () => {
      solveCharacterParts(mismatchedChar, registry, { strictAngle: true });
    },
    (err: Error) => {
      assert.ok(err.message.includes('Angle mismatch'));
      assert.ok(err.message.includes('has view angle "front"'));
      assert.ok(err.message.includes('has view angle "three_quarter"'));
      return true;
    }
  );
});

test('Style & Angle System: permits angle mismatch when strictAngle is disabled', () => {
  const registry = createRegistry();

  const mismatchedChar = {
    ...studentThreeQuarterDefinition,
    id: 'mismatched-angles-allowed',
    slots: {
      ...studentThreeQuarterDefinition.slots,
      head: { assetId: 'starter-char-head-01-v2' },
    },
  };

  const parts = solveCharacterParts(mismatchedChar, registry, { strictAngle: false });
  assert.strictEqual(parts.length, 5);
  const head = parts.find((p) => p.slot === 'head');
  assert.strictEqual(head?.asset.id, 'starter-char-head-01-v2');
});
