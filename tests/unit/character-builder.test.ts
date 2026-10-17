import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import { solveCharacterParts } from '../../src/core/characters/solver';
import { studentCharacterDefinition } from '../../src/core/characters/presets';
import { CharacterDefinition } from '../../src/core/characters/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

function createRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('CharacterBuilder: solves base character parts with socket alignment', () => {
  const registry = createRegistry();
  const parts = solveCharacterParts(studentCharacterDefinition, registry);

  assert.strictEqual(parts.length, 5); // rootPart, head, eyes, mouth, hairFront

  const rootPart = parts.find((p) => p.slot === 'rootPart');
  const head = parts.find((p) => p.slot === 'head');
  const eyes = parts.find((p) => p.slot === 'eyes');
  const mouth = parts.find((p) => p.slot === 'mouth');
  const hair = parts.find((p) => p.slot === 'hairFront');

  assert.ok(rootPart, 'Root part must be resolved');
  assert.ok(head, 'Head part must be resolved');
  assert.ok(eyes, 'Eyes part must be resolved');
  assert.ok(mouth, 'Mouth part must be resolved');
  assert.ok(hair, 'Hair part must be resolved');

  // Verify alignment math:
  // Root body anchor is (0.5, 1.0) on 300x600 px -> rootLocalX = -150, rootLocalY = -600
  assert.strictEqual(rootPart?.x, -150);
  assert.strictEqual(rootPart?.y, -600);

  // Neck socket on body is at (150, 95) -> neck position = (-150 + 150, -600 + 95) = (0, -505)
  // Neck socket on head is at (120, 240) -> head pos = (0 - 120, -505 - 240) = (-120, -745)
  assert.strictEqual(head?.x, -120);
  assert.strictEqual(head?.y, -745);

  // Layer ordering z-indexes
  assert.ok((rootPart?.zIndex ?? 0) < (head?.zIndex ?? 0));
  assert.ok((head?.zIndex ?? 0) < (eyes?.zIndex ?? 0));
  assert.ok((eyes?.zIndex ?? 0) < (hair?.zIndex ?? 0));
});

test('CharacterBuilder: switches expression and clothing variants correctly', () => {
  const registry = createRegistry();

  // Test happy variant
  const happyParts = solveCharacterParts(studentCharacterDefinition, registry, {
    variant: 'happy',
  });
  const happyEyes = happyParts.find((p) => p.slot === 'eyes');
  const happyMouth = happyParts.find((p) => p.slot === 'mouth');
  assert.strictEqual(happyEyes?.asset.id, 'starter-char-eyes-wink');
  assert.strictEqual(happyMouth?.asset.id, 'starter-char-mouth-smile');

  // Test casual streetwear variant
  const casualParts = solveCharacterParts(studentCharacterDefinition, registry, {
    variant: 'casual',
  });
  const casualBody = casualParts.find((p) => p.slot === 'rootPart');
  const casualHair = casualParts.find((p) => p.slot === 'hairFront');
  assert.strictEqual(casualBody?.asset.id, 'starter-char-body-02-hoodie');
  assert.strictEqual(casualHair?.asset.id, 'starter-char-hair-spiky');
});

test('CharacterBuilder: throws actionable error when requesting non-existent variant', () => {
  const registry = createRegistry();

  assert.throws(
    () => {
      solveCharacterParts(studentCharacterDefinition, registry, {
        variant: 'non_existent_variant',
      });
    },
    (err: Error) => {
      assert.ok(err.message.includes('non_existent_variant'));
      assert.ok(err.message.includes('Available variants: happy, surprised, casual'));
      return true;
    }
  );
});

test('CharacterBuilder: detects missing required sockets on parent part', () => {
  const registry = createRegistry();

  // Define a defective head that requires a non-existent socket 'antenna' on the body
  const brokenChar: CharacterDefinition = {
    id: 'broken-char',
    name: 'Broken Char',
    styleFamily: 'anime-clean-v1',
    rootPart: { assetId: 'starter-char-body-01' },
    slots: {
      head: { assetId: 'starter-char-head-01' },
    },
    layerOrder: ['rootPart', 'head'],
  };

  // Modify registry asset in place for test
  const headAsset = registry.get('starter-char-head-01');
  const origSockets = headAsset.requiredSockets;
  headAsset.requiredSockets = ['non_existent_antenna_socket'];

  try {
    assert.throws(
      () => {
        solveCharacterParts(brokenChar, registry);
      },
      (err: Error) => {
        assert.ok(err.message.includes('Incompatible part connection'));
        assert.ok(err.message.includes('non_existent_antenna_socket'));
        return true;
      }
    );
  } finally {
    headAsset.requiredSockets = origSockets;
  }
});
