import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { AssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import { solveCharacterParts } from '../../src/core/characters/solver';
import {
  studentArticulatedDefinition,
  studentCharacterDefinition,
} from '../../src/core/characters/presets';
import {
  resolveCharacterPose,
  computeArmWave,
} from '../../src/core/characters/poses';
import {
  CharacterContinuityRegistry,
  createShotCharacterConfig,
} from '../../src/core/characters/continuity';
import { CharacterIdentity } from '../../src/core/characters/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

function createTestRegistry(): AssetRegistry {
  const registry = new AssetRegistry();
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  registry.registerPack(manifest, { validate: false });
  return registry;
}

test('CutoutRig: calculates exact shoulder socket attachment coordinates and pivots', () => {
  const registry = createTestRegistry();
  const parts = solveCharacterParts(studentArticulatedDefinition, registry);

  const body = parts.find((p) => p.slot === 'rootPart');
  const armLeft = parts.find((p) => p.slot === 'armsLeft');
  const armRight = parts.find((p) => p.slot === 'armsRight');
  const head = parts.find((p) => p.slot === 'head');

  assert.ok(body && armLeft && armRight && head);

  // Body is 300x600, anchor (0.5, 1.0) -> rootLocalX = -150, rootLocalY = -600
  assert.strictEqual(body.x, -150);
  assert.strictEqual(body.y, -600);

  // Left shoulder socket on torso is (72, 128); arm plug is (40, 20)
  // armX = -150 + 72 - 40 = -118
  // armY = -600 + 128 - 20 = -492
  assert.strictEqual(armLeft.x, -118);
  assert.strictEqual(armLeft.y, -492);
  assert.deepStrictEqual(armLeft.pivot, { x: 40, y: 20 });

  // Right shoulder socket on torso is (228, 128); arm plug is (40, 20)
  // armX = -150 + 228 - 40 = 38
  // armY = -600 + 128 - 20 = -492
  assert.strictEqual(armRight.x, 38);
  assert.strictEqual(armRight.y, -492);
  assert.deepStrictEqual(armRight.pivot, { x: 40, y: 20 });

  // Head neck socket on head-01-v2 is (120, 240); torso neck is (150, 95)
  // headX = -150 + 150 - 120 = -120
  // headY = -600 + 95 - 240 = -745
  assert.strictEqual(head.x, -120);
  assert.strictEqual(head.y, -745);
  assert.deepStrictEqual(head.pivot, { x: 120, y: 240 });
});

test('CutoutRig: layer ordering places arms, torso, and head accurately', () => {
  const registry = createTestRegistry();
  const parts = solveCharacterParts(studentArticulatedDefinition, registry);

  const slotOrder = parts.map((p) => p.slot);
  // Layer order: armsLeft (behind body), rootPart, armsRight (in front of body), head, eyes, mouth, hairFront
  assert.strictEqual(slotOrder[0], 'armsLeft');
  assert.strictEqual(slotOrder[1], 'rootPart');
  assert.strictEqual(slotOrder[2], 'armsRight');
  assert.strictEqual(slotOrder[3], 'head');
  assert.ok(slotOrder.indexOf('head') < slotOrder.indexOf('eyes'));
});

test('CutoutRig: pose resolver outputs valid slot overrides across standard vocabulary', () => {
  const poses = ['idle', 'wave', 'point', 'talk_gesture', 'thinking'] as const;

  for (const pose of poses) {
    const res = resolveCharacterPose(pose);
    assert.ok(res.description, `Pose ${pose} must have description`);
    assert.ok(res.overrides.armsLeft, `Pose ${pose} must have left arm override`);
    assert.ok(res.overrides.armsRight, `Pose ${pose} must have right arm override`);
    assert.strictEqual(typeof res.baseJointRotations.headTilt, 'number');
  }
});

test('CutoutRig: applying pose changes modular arm assets and maintains correct socket alignment', () => {
  const registry = createTestRegistry();

  // Test wave pose
  const waveParts = solveCharacterParts(studentArticulatedDefinition, registry, {
    pose: 'wave',
  });
  const waveArmRight = waveParts.find((p) => p.slot === 'armsRight');
  assert.ok(waveArmRight);
  assert.strictEqual(waveArmRight.asset.id, 'starter-char-arm-01-right-wave');
  // Waving arm has shoulder_socket at (30, 175)
  // armX = -150 + 228 - 30 = 48
  // armY = -600 + 128 - 175 = -647
  assert.strictEqual(waveArmRight.x, 48);
  assert.strictEqual(waveArmRight.y, -647);
  assert.deepStrictEqual(waveArmRight.pivot, { x: 30, y: 175 });

  // Test point pose
  const pointParts = solveCharacterParts(studentArticulatedDefinition, registry, {
    pose: 'point',
  });
  const pointArmRight = pointParts.find((p) => p.slot === 'armsRight');
  assert.ok(pointArmRight);
  assert.strictEqual(pointArmRight.asset.id, 'starter-char-arm-01-right-point');
  // Pointing arm has shoulder_socket at (25, 60)
  // armX = -150 + 228 - 25 = 53
  // armY = -600 + 128 - 60 = -532
  assert.strictEqual(pointArmRight.x, 53);
  assert.strictEqual(pointArmRight.y, -532);
  assert.deepStrictEqual(pointArmRight.pivot, { x: 25, y: 60 });
});

test('CutoutRig: jointRotations inject additive forward-kinematic rotation', () => {
  const registry = createTestRegistry();
  const parts = solveCharacterParts(studentArticulatedDefinition, registry, {
    jointRotations: {
      armLeft: -15.5,
      armRight: 32.0,
      headTilt: 4.2,
    },
  });

  const armLeft = parts.find((p) => p.slot === 'armsLeft');
  const armRight = parts.find((p) => p.slot === 'armsRight');
  const head = parts.find((p) => p.slot === 'head');

  assert.strictEqual(armLeft?.rotation, -15.5);
  assert.strictEqual(armRight?.rotation, 32.0);
  assert.strictEqual(head?.rotation, 4.2);
});

test('CutoutRig: sinusoidal computeArmWave is frame-deterministic and bounded', () => {
  const fps = 30;
  const frame0 = computeArmWave(0, fps, { frequency: 2.0, amplitude: 15.0 });
  const frame15 = computeArmWave(15, fps, { frequency: 2.0, amplitude: 15.0 });
  const frame30 = computeArmWave(30, fps, { frequency: 2.0, amplitude: 15.0 });

  assert.strictEqual(frame0, 0);
  // After 1 second (frame 30 at 30fps), a full 2Hz cycle ends back at ~0
  assert.ok(Math.abs(frame30) < 1e-10);

  // Peak amplitude check
  for (let f = 0; f < 60; f++) {
    const val = computeArmWave(f, fps, { frequency: 2.0, amplitude: 15.0 });
    assert.ok(val >= -15.0 && val <= 15.0, `Arm wave value ${val} out of bounds`);
  }
});

test('Continuity: CharacterContinuityRegistry stores and retrieves identities', () => {
  const registry = new CharacterContinuityRegistry();
  const identity: CharacterIdentity = {
    id: 'char-ren-hero',
    name: 'Ren Protagonist',
    styleFamily: 'anime-clean-v1',
    baseDefinitionId: 'student-articulated',
    defaultVariant: 'happy',
    defaultPose: 'idle',
    traits: {
      heightScale: 1.05,
    },
  };

  registry.register(identity);
  assert.strictEqual(registry.has('char-ren-hero'), true);
  assert.strictEqual(registry.get('char-ren-hero')?.name, 'Ren Protagonist');
  assert.strictEqual(registry.list().length, 1);

  registry.clear();
  assert.strictEqual(registry.list().length, 0);
});

test('Continuity: createShotCharacterConfig computes consistent shot framing parameters', () => {
  const identity: CharacterIdentity = {
    id: 'char-ren-hero',
    name: 'Ren Protagonist',
    styleFamily: 'anime-clean-v1',
    baseDefinitionId: 'student-articulated',
    defaultVariant: 'default',
    defaultPose: 'idle',
    traits: {
      heightScale: 1.0,
    },
  };

  // Wide shot facing right
  const wideConfig = createShotCharacterConfig(identity, {
    shotType: 'wide',
    facingDirection: 'right',
  });
  assert.strictEqual(wideConfig.definitionId, 'student-articulated');
  assert.strictEqual(wideConfig.scale, 0.85);
  assert.strictEqual(wideConfig.flipX, false);
  assert.strictEqual(wideConfig.pose, 'idle');

  // Close up shot facing left with pose override
  const closeConfig = createShotCharacterConfig(identity, {
    shotType: 'close_up',
    facingDirection: 'left',
    pose: 'talk_gesture',
    expressionVariant: 'happy',
  });
  assert.strictEqual(closeConfig.scale, 1.6);
  assert.strictEqual(closeConfig.flipX, true);
  assert.strictEqual(closeConfig.pose, 'talk_gesture');
  assert.strictEqual(closeConfig.variant, 'happy');
});
