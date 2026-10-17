import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import { validateSceneManifest } from '../../src/core/scene/validator';
import { SceneManifest } from '../../src/core/scene/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');
const sampleScenePath = path.join(projectRoot, 'scenes', 'agent-dialog-scene.json');

function createRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('SceneValidator: valid sample scene passes validation cleanly', () => {
  const registry = createRegistry();
  const rawScene = JSON.parse(fs.readFileSync(sampleScenePath, 'utf8'));
  const result = validateSceneManifest(rawScene, { registry });

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('SceneValidator: flags unknown environment preset with available suggestions', () => {
  const registry = createRegistry();
  const invalidScene: SceneManifest = {
    id: 'test-invalid-env',
    name: 'Invalid Env Test',
    environment: {
      preset: 'cyberpunk-neon-alley',
    },
  };

  const result = validateSceneManifest(invalidScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'UNKNOWN_ENV_PRESET');
  assert.ok(err, 'Must return UNKNOWN_ENV_PRESET error');
  assert.ok(err.suggestion?.includes('japanese-street-corner'), 'Must suggest valid environment presets');
});

test('SceneValidator: flags unknown character preset with available suggestions', () => {
  const registry = createRegistry();
  const invalidScene: SceneManifest = {
    id: 'test-invalid-char',
    name: 'Invalid Char Test',
    characters: [
      {
        id: 'mysterious-stranger',
        characterId: 'unknown-preset-goku',
        position: { x: 500, y: 800 },
      },
    ],
  };

  const result = validateSceneManifest(invalidScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'UNKNOWN_CHARACTER_PRESET');
  assert.ok(err, 'Must return UNKNOWN_CHARACTER_PRESET error');
  assert.ok(err.suggestion?.includes('student-ren'), 'Must suggest valid character presets');
});

test('SceneValidator: detects non-existent variant on valid character preset', () => {
  const registry = createRegistry();
  const invalidScene: SceneManifest = {
    id: 'test-invalid-variant',
    name: 'Invalid Variant Test',
    characters: [
      {
        id: 'ren',
        characterId: 'student-ren',
        variant: 'cyber-samurai-ninja',
        position: { x: 500, y: 800 },
      },
    ],
  };

  const result = validateSceneManifest(invalidScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'UNKNOWN_VARIANT');
  assert.ok(err, 'Must return UNKNOWN_VARIANT error');
  assert.ok(err.suggestion?.includes('casual'), 'Must suggest existing variants');
});

test('SceneValidator: detects duplicate character instance IDs', () => {
  const registry = createRegistry();
  const duplicateScene: SceneManifest = {
    id: 'test-dup-char',
    name: 'Duplicate Char Test',
    characters: [
      { id: 'twin-1', characterId: 'student-ren', position: { x: 400, y: 800 } },
      { id: 'twin-1', characterId: 'student-ren', position: { x: 800, y: 800 } },
    ],
  };

  const result = validateSceneManifest(duplicateScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'DUPLICATE_CHARACTER_ID');
  assert.ok(err, 'Must return DUPLICATE_CHARACTER_ID error');
});

test('SceneValidator: detects missing asset in expression schedule', () => {
  const registry = createRegistry();
  const invalidScene: SceneManifest = {
    id: 'test-missing-expr-asset',
    name: 'Missing Expr Asset Test',
    characters: [
      {
        id: 'ren',
        characterId: 'student-ren',
        position: { x: 500, y: 800 },
        animation: {
          expressionSchedule: [
            { startFrame: 30, eyes: 'non-existent-laser-eyes' },
          ],
        },
      },
    ],
  };

  const result = validateSceneManifest(invalidScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'MISSING_ASSET');
  assert.ok(err, 'Must return MISSING_ASSET error for expression schedule');
});

test('SceneValidator: validates dialog line timeline constraints', () => {
  const registry = createRegistry();
  const invalidScene = {
    id: 'test-bad-dialog',
    name: 'Bad Dialog Test',
    dialog: [
      {
        id: 'd1',
        text: 'Time traveling dialog',
        startFrame: 60,
        endFrame: 40, // invalid: endFrame < startFrame
      },
    ],
  };

  const result = validateSceneManifest(invalidScene, { registry });
  assert.strictEqual(result.valid, false);
  const err = result.errors.find((e) => e.code === 'SCHEMA_ERROR');
  assert.ok(err, 'Must return SCHEMA_ERROR for endFrame < startFrame');
});
