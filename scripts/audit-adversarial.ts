import { defaultAssetRegistry } from '../src/core/assets/registry';
import { solveCharacterParts } from '../src/core/characters/solver';
import { studentCharacterDefinition } from '../src/core/characters/presets';
import { computeCameraState } from '../src/core/camera/presets';
import { validateSceneManifest } from '../src/core/scene/validator';
import { AssetManifestEntry } from '../src/core/assets/types';

import starterManifest from '../asset-packs/starter-kit/manifest.json';

// Initialize default asset registry with starter pack
if (!defaultAssetRegistry.has('starter-char-head-01')) {
  defaultAssetRegistry.registerPack(starterManifest as any, { validate: false });
}

console.log('=== Running Phase 11 Adversarial Edge-Case Tests ===\n');

// 1. Invalid Asset ID
try {
  process.stdout.write('Test 1: Unknown asset ID in CharacterBuilder... ');
  const badDef = {
    ...studentCharacterDefinition,
    slots: {
      ...studentCharacterDefinition.slots,
      head: { assetId: 'completely-nonexistent-asset-999' },
    },
  };
  solveCharacterParts(badDef as any, defaultAssetRegistry);
  console.log('FAIL (Expected error was not thrown)');
} catch (e: any) {
  console.log('PASS');
  console.log(`   Captured Error: "${e.message}"\n`);
}

// 2. Incompatible Socket Requirement
try {
  process.stdout.write('Test 2: Incompatible part connection (missing required socket)... ');
  const dummyParent: AssetManifestEntry = {
    id: 'dummy-body-no-neck',
    name: 'Dummy Body',
    kind: 'character_part',
    category: 'base_body',
    path: 'peerpro-assets/starter/body-01.svg',
    format: 'svg',
    dimensions: { width: 300, height: 600 },
    hasAlpha: true,
    style: { family: 'anime-clean-v1' },
    anchor: { x: 0.5, y: 1.0 },
    attachmentSockets: {
      // intentionally missing 'neck' socket!
    },
    tags: ['test'],
    provenance: { source: 'test', license: 'MIT' },
  };

  const testRegistry = new (defaultAssetRegistry.constructor as any)();
  testRegistry.registerPack(
    {
      packId: 'test-pack',
      packName: 'Test Pack',
      version: '1.0.0',
      author: 'Test',
      license: 'MIT',
      assets: [dummyParent, defaultAssetRegistry.get('starter-char-head-01')],
    },
    { validate: false }
  );

  const incompatibleDef = {
    ...studentCharacterDefinition,
    rootPart: { assetId: 'dummy-body-no-neck' },
  };
  solveCharacterParts(incompatibleDef as any, testRegistry);
  console.log('FAIL (Expected socket incompatibility error)');
} catch (e: any) {
  console.log('PASS');
  console.log(`   Captured Error: "${e.message}"\n`);
}

// 3. Unknown Environment Preset in SceneManifest
process.stdout.write('Test 3: Unknown environment preset in SceneValidator... ');
const badScene = {
  id: 'scene-unknown-env',
  name: 'Unknown Environment Test',
  environment: {
    preset: 'non-existent-tokyo-subway',
  },
};
const valResult = validateSceneManifest(badScene);
if (!valResult.valid && valResult.errors.some((e) => e.code === 'UNKNOWN_ENV_PRESET')) {
  console.log('PASS');
  const err = valResult.errors.find((e) => e.code === 'UNKNOWN_ENV_PRESET');
  console.log(`   Captured Issue: [${err?.code}] ${err?.message}`);
  console.log(`   Captured Suggestion: "${err?.suggestion}"\n`);
} else {
  console.log('FAIL (Expected UNKNOWN_ENV_PRESET error)');
}

// 4. Extreme Camera Movement Boundary Clamping
process.stdout.write('Test 4: Camera bounds enforcement under extreme displacement... ');
const extremeCam = computeCameraState(100, 100, {
  preset: 'custom',
  bounds: {
    maxDisplacementX: 150,
    maxDisplacementY: 80,
    minZoom: 0.9,
    maxZoom: 1.25,
  },
  customMove: () => ({ x: 9999, y: -9999, zoom: 10.0 }),
});

if (extremeCam.x === 150 && extremeCam.y === -80 && extremeCam.zoom === 1.25) {
  console.log('PASS');
  console.log(`   Clamped: x=${extremeCam.x} (max 150), y=${extremeCam.y} (min -80), zoom=${extremeCam.zoom} (max 1.25)\n`);
} else {
  console.log(`FAIL (Clamping mismatch: x=${extremeCam.x}, y=${extremeCam.y}, zoom=${extremeCam.zoom})`);
}

console.log('=== Adversarial Tests Completed ===');
