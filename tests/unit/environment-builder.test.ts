import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import {
  japaneseStreetCornerPreset,
  japaneseQuietStreetPreset,
} from '../../src/core/environments/presets';
import { validateEnvironmentAssets } from '../../src/core/environments/Environment';
import { EnvironmentDefinition } from '../../src/core/environments/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

function createRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('EnvironmentBuilder: validates japaneseStreetCornerPreset successfully', () => {
  const registry = createRegistry();
  assert.doesNotThrow(() => {
    validateEnvironmentAssets(japaneseStreetCornerPreset, registry);
  });
});

test('EnvironmentBuilder: validates japaneseQuietStreetPreset successfully', () => {
  const registry = createRegistry();
  assert.doesNotThrow(() => {
    validateEnvironmentAssets(japaneseQuietStreetPreset, registry);
  });
});

test('EnvironmentBuilder: throws actionable error when environment references missing asset', () => {
  const registry = createRegistry();
  const brokenEnv: EnvironmentDefinition = {
    id: 'broken-env',
    name: 'Broken Environment',
    layers: [
      {
        id: 'layer-with-missing-asset',
        assetId: 'non-existent-building-asset',
        depth: 1.0,
        order: 1,
        transform: { x: 100, y: 100 },
      },
    ],
  };

  assert.throws(
    () => {
      validateEnvironmentAssets(brokenEnv, registry);
    },
    (err: Error) => {
      assert.ok(err.message.includes('broken-env'));
      assert.ok(err.message.includes('non-existent-building-asset'));
      assert.ok(err.message.includes('layer-with-missing-asset'));
      return true;
    }
  );
});

test('EnvironmentBuilder: detects missing asset in deeply nested child layers', () => {
  const registry = createRegistry();
  const brokenNestedEnv: EnvironmentDefinition = {
    id: 'broken-nested-env',
    name: 'Broken Nested Environment',
    layers: [
      {
        id: 'parent-group',
        depth: 1.0,
        order: 1,
        transform: { x: 500, y: 500 },
        children: [
          {
            id: 'child-with-bad-asset',
            assetId: 'missing-nested-prop',
            depth: 1.0,
            order: 2,
            transform: { x: 10, y: 10 },
          },
        ],
      },
    ],
  };

  assert.throws(
    () => {
      validateEnvironmentAssets(brokenNestedEnv, registry);
    },
    (err: Error) => {
      assert.ok(err.message.includes('missing-nested-prop'));
      assert.ok(err.message.includes('child-with-bad-asset'));
      return true;
    }
  );
});

test('EnvironmentBuilder: proves two distinct layouts exist from the same starter kit', () => {
  const registry = createRegistry();

  // Street corner has 6 top-level layers plus 2 children in storefront group
  assert.strictEqual(japaneseStreetCornerPreset.layers.length, 6);
  const storefrontGroup = japaneseStreetCornerPreset.layers.find((l) => l.id === 'storefront-group');
  assert.strictEqual(storefrontGroup?.children?.length, 2);

  // Quiet street has 7 top-level layers with different arrangement and central tree
  assert.strictEqual(japaneseQuietStreetPreset.layers.length, 7);
  assert.notStrictEqual(
    japaneseStreetCornerPreset.layers[1].transform.x,
    japaneseQuietStreetPreset.layers[1].transform.x
  );
});
