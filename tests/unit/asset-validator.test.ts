import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { validateAssetPackManifest } from '../../src/core/assets/validator';
import { AssetPackManifest } from '../../src/core/assets/types';

const projectRoot = path.resolve(__dirname, '../..');
const publicDir = path.join(projectRoot, 'public');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

test('AssetValidator: valid starter kit manifest passes with zero errors', () => {
  const raw = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  const result = validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    fileExists: (relPath) => fs.existsSync(path.resolve(publicDir, relPath)),
  });

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('AssetValidator: detects duplicate asset IDs and returns DUPLICATE_ID', () => {
  const raw: AssetPackManifest = {
    packId: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    styleFamily: 'anime-clean-v1',
    assets: [
      {
        id: 'dup-asset',
        name: 'Asset 1',
        kind: 'character_part',
        category: 'head',
        path: 'peerpro-assets/starter/head-01.svg',
        format: 'svg',
        dimensions: { width: 100, height: 100 },
        hasAlpha: true,
        style: { family: 'anime-clean-v1' },
        anchor: { x: 0.5, y: 0.5 },
        tags: [],
        provenance: { source: 'original', license: 'MIT', author: 'Test' },
      },
      {
        id: 'dup-asset',
        name: 'Asset 2',
        kind: 'character_part',
        category: 'head',
        path: 'peerpro-assets/starter/head-01.svg',
        format: 'svg',
        dimensions: { width: 100, height: 100 },
        hasAlpha: true,
        style: { family: 'anime-clean-v1' },
        anchor: { x: 0.5, y: 0.5 },
        tags: [],
        provenance: { source: 'original', license: 'MIT', author: 'Test' },
      },
    ],
  };

  const result = validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    checkFilesExist: false,
  });

  assert.strictEqual(result.valid, false);
  const dupError = result.errors.find((e) => e.code === 'DUPLICATE_ID');
  assert.ok(dupError, 'Expected DUPLICATE_ID error');
  assert.ok(dupError?.message.includes('dup-asset'));
});

test('AssetValidator: detects missing physical files and returns MISSING_FILE', () => {
  const raw: AssetPackManifest = {
    packId: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    styleFamily: 'anime-clean-v1',
    assets: [
      {
        id: 'ghost-asset',
        name: 'Ghost Asset',
        kind: 'character_part',
        category: 'head',
        path: 'peerpro-assets/nonexistent/fake-file.svg',
        format: 'svg',
        dimensions: { width: 100, height: 100 },
        hasAlpha: true,
        style: { family: 'anime-clean-v1' },
        anchor: { x: 0.5, y: 0.5 },
        tags: [],
        provenance: { source: 'original', license: 'MIT', author: 'Test' },
      },
    ],
  };

  const result = validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    fileExists: (relPath) => fs.existsSync(path.resolve(publicDir, relPath)),
  });

  assert.strictEqual(result.valid, false);
  const missingError = result.errors.find((e) => e.code === 'MISSING_FILE');
  assert.ok(missingError, 'Expected MISSING_FILE error');
  assert.ok(missingError?.message.includes('fake-file.svg'));
});

test('AssetValidator: blocks directory traversal and returns UNSAFE_PATH or schema error', () => {
  const raw: AssetPackManifest = {
    packId: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    styleFamily: 'anime-clean-v1',
    assets: [
      {
        id: 'traversal-asset',
        name: 'Traversal Asset',
        kind: 'character_part',
        category: 'head',
        path: '../../etc/passwd',
        format: 'svg',
        dimensions: { width: 100, height: 100 },
        hasAlpha: true,
        style: { family: 'anime-clean-v1' },
        anchor: { x: 0.5, y: 0.5 },
        tags: [],
        provenance: { source: 'original', license: 'MIT', author: 'Test' },
      },
    ],
  };

  const result = validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    checkFilesExist: false,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.length > 0);
  const isBlocked = result.errors.some((e) => e.code === 'UNSAFE_PATH' || e.code === 'SCHEMA_ERROR');
  assert.ok(isBlocked, 'Expected path traversal to be blocked');
});

test('AssetValidator: flags invalid anchor coordinates', () => {
  const raw = {
    packId: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    styleFamily: 'anime-clean-v1',
    assets: [
      {
        id: 'bad-anchor-asset',
        name: 'Bad Anchor',
        kind: 'character_part',
        category: 'head',
        path: 'peerpro-assets/starter/head-01.svg',
        format: 'svg',
        dimensions: { width: 100, height: 100 },
        hasAlpha: true,
        style: { family: 'anime-clean-v1' },
        anchor: { x: 1.5, y: -0.2 }, // Invalid: outside [0..1]
        tags: [],
        provenance: { source: 'original', license: 'MIT', author: 'Test' },
      },
    ],
  };

  const result = validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    checkFilesExist: false,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.code === 'SCHEMA_ERROR' || e.code === 'INVALID_COORDINATES'));
});

test('AssetValidator: does not modify or delete any asset files', () => {
  const headPath = path.join(publicDir, 'peerpro-assets', 'starter', 'head-01.svg');
  const mtimeBefore = fs.statSync(headPath).mtimeMs;
  const contentBefore = fs.readFileSync(headPath, 'utf8');

  const raw = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  validateAssetPackManifest(raw, {
    assetRootDirectory: publicDir,
    checkFilesExist: true,
  });

  const mtimeAfter = fs.statSync(headPath).mtimeMs;
  const contentAfter = fs.readFileSync(headPath, 'utf8');

  assert.strictEqual(mtimeBefore, mtimeAfter);
  assert.strictEqual(contentBefore, contentAfter);
});
