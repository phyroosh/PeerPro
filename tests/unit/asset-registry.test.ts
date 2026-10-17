import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

test('AssetRegistry: registers starter pack and resolves assets by ID', () => {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));

  registry.registerPack(manifest, { validate: false });

  assert.strictEqual(registry.has('starter-char-head-01'), true);
  assert.strictEqual(registry.has('starter-char-body-01'), true);

  const head = registry.get('starter-char-head-01');
  assert.strictEqual(head.name, 'Anime Head Base');
  assert.strictEqual(head.category, 'head');
  assert.strictEqual(head.dimensions.width, 240);
  assert.strictEqual(head.anchor.x, 0.5);
  assert.strictEqual(head.anchor.y, 0.5);
  assert.ok(head.attachmentSockets?.neck_socket);
});

test('AssetRegistry: resolvePath returns the path for Remotion staticFile()', () => {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });

  const resolved = registry.resolvePath('starter-char-head-01');
  assert.strictEqual(resolved, 'peerpro-assets/starter/head-01.svg');
});

test('AssetRegistry: unknown asset ID throws informative error with suggestions', () => {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });

  assert.throws(
    () => {
      registry.get('starter-char-head'); // Missing "-01"
    },
    (err: Error) => {
      assert.ok(err.message.includes('starter-char-head'));
      assert.ok(err.message.includes('Did you mean'));
      assert.ok(err.message.includes('starter-char-head-01'));
      return true;
    }
  );
});

test('AssetRegistry: filter queries assets by category and tags', () => {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });

  const eyes = registry.filter({ category: 'eyes' });
  assert.strictEqual(eyes.length, 2);
  assert.ok(eyes.some((e) => e.id === 'starter-char-eyes-neutral'));
  assert.ok(eyes.some((e) => e.id === 'starter-char-eyes-wide'));

  const charParts = registry.filter({ kind: 'character_part' });
  assert.strictEqual(charParts.length, 7);

  const happyParts = registry.filter({ tag: 'happy' });
  assert.strictEqual(happyParts.length, 1);
  assert.strictEqual(happyParts[0].id, 'starter-char-mouth-smile');
});

test('AssetRegistry: getCategories and getTags return complete unique sets', () => {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });

  const categories = registry.getCategories();
  assert.ok(categories.includes('base_body'));
  assert.ok(categories.includes('head'));
  assert.ok(categories.includes('hair'));
  assert.ok(categories.includes('eyes'));
  assert.ok(categories.includes('mouth'));
  assert.ok(categories.includes('facade'));
  assert.ok(categories.includes('road'));
  assert.ok(categories.includes('prop'));

  const tags = registry.getTags();
  assert.ok(tags.includes('character'));
  assert.ok(tags.includes('environment'));
});
