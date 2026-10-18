import test from 'node:test';
import assert from 'node:assert';
import {
  RIG_PROFILES,
  inferRigProfile,
  getRigProfileDefinition,
} from '../../src/core/characters/rigs/profiles';
import {
  STARTER_ACTION_LIBRARY,
  getActionClip,
} from '../../src/core/characters/rigs/clips';
import {
  validateRigCompatibility,
  assertRigCompatibility,
} from '../../src/core/characters/rigs/validator';
import { evaluatePerformanceClips } from '../../src/core/characters/rigs/evaluator';
import {
  studentArticulatedDefinition,
  studentCharacterDefinition,
  studentCharacterDefinitionV2,
} from '../../src/core/characters/presets';
import {
  CharacterContinuityRegistry,
  createShotCharacterConfig,
} from '../../src/core/characters/continuity';
import { CharacterIdentity } from '../../src/core/characters/types';

test('CharacterPerformance: formal rig profile contracts define required slots and calibrated limits', () => {
  const profiles = ['face_only', 'upper_body_cutout', 'full_body_cutout', 'pose_swapped'] as const;

  for (const profile of profiles) {
    const def = getRigProfileDefinition(profile);
    assert.strictEqual(def.profile, profile);
    assert.ok(def.name.length > 0);
    assert.ok(def.requiredSlots.length > 0);
    assert.ok(def.capabilities.length > 0);

    for (const [joint, limit] of Object.entries(def.jointLimits)) {
      assert.ok(limit.min < limit.max, `Joint limit for ${joint} on ${profile} must have min < max`);
      assert.ok(limit.rest >= limit.min && limit.rest <= limit.max, `Rest angle must be within bounds for ${joint}`);
    }
  }
});

test('CharacterPerformance: inferRigProfile correctly categorizes character definitions', () => {
  assert.strictEqual(inferRigProfile(studentArticulatedDefinition), 'upper_body_cutout');
  assert.strictEqual(inferRigProfile(studentCharacterDefinition), 'pose_swapped');
  assert.strictEqual(inferRigProfile(studentCharacterDefinitionV2), 'pose_swapped');

  // Custom face-only definition without body
  const faceOnlyDef = {
    id: 'test-face',
    name: 'Face Portrait',
    styleFamily: 'anime-clean-v1',
    rootPart: undefined as any,
    slots: {
      head: { assetId: 'head-01' },
      eyes: { assetId: 'eyes-01' },
      mouth: { assetId: 'mouth-01' },
    },
    layerOrder: ['head', 'eyes', 'mouth'],
  };
  assert.strictEqual(inferRigProfile(faceOnlyDef), 'face_only');
});

test('CharacterPerformance: starter action library provides 10 validated deterministic clips', () => {
  const clipIds = Object.keys(STARTER_ACTION_LIBRARY);
  assert.strictEqual(clipIds.length, 10, 'Expected exactly 10 canonical starter action clips');

  for (const id of clipIds) {
    const clip = getActionClip(id);
    assert.strictEqual(clip.id, id);
    assert.ok(clip.durationInFrames > 0, `Clip ${id} must have duration > 0`);
    assert.ok(clip.supportedRigProfiles.length > 0, `Clip ${id} must declare supported rig profiles`);
  }
});

test('CharacterPerformance: compatibility validator passes valid clips and explicitly rejects unsupported movements', () => {
  // 1. Compatible: upper_body_cutout with arm_gesture_wave
  const waveClip = getActionClip('arm_gesture_wave');
  const validReport = validateRigCompatibility(studentArticulatedDefinition, waveClip);
  assert.strictEqual(validReport.compatible, true);
  assert.strictEqual(validReport.errors.length, 0);
  assert.doesNotThrow(() => assertRigCompatibility(studentArticulatedDefinition, waveClip));

  // 2. Incompatible: upper_body_cutout with walk_cycle_simple (requires full_body_cutout)
  const walkClip = getActionClip('walk_cycle_simple');
  const invalidReport = validateRigCompatibility(studentArticulatedDefinition, walkClip);
  assert.strictEqual(invalidReport.compatible, false);
  assert.ok(invalidReport.errors.length >= 1);
  assert.ok(invalidReport.unsupportedMovements.includes('walk_cycle'));
  assert.throws(() => assertRigCompatibility(studentArticulatedDefinition, walkClip), /Rig Incompatibility Error/);

  // 3. Incompatible: pose_swapped with arm_gesture_present (requires arm_rotation)
  const presentClip = getActionClip('arm_gesture_present');
  const poseSwappedReport = validateRigCompatibility(studentCharacterDefinitionV2, presentClip);
  assert.strictEqual(poseSwappedReport.compatible, false);
  assert.ok(poseSwappedReport.unsupportedMovements.includes('arm_rotation'));
});

test('CharacterPerformance: joint limit enforcement guarantees anti-separation bounds', () => {
  // Create an artificial clip that requests dangerous, hyper-extended joint rotations
  const dangerousClip = {
    id: 'dangerous_hyper_extension',
    name: 'Dangerous Clip',
    description: 'Attempts to rotate arms and head beyond physical joint limits',
    supportedRigProfiles: ['upper_body_cutout' as const],
    durationInFrames: 30,
    jointCurves: {
      armRight: () => 240.0, // Limit is [-45, 120]
      armLeft: () => -120.0, // Limit is [-45, 120]
      headTilt: () => 50.0,   // Limit is [-15, 15]
    },
  };

  const state = evaluatePerformanceClips('upper_body_cutout', 15, [
    {
      clip: dangerousClip,
      startFrame: 0,
      durationInFrames: 30,
      intensity: 1.0,
    },
  ]);

  assert.strictEqual(state.isClamped, true, 'Evaluator must flag isClamped = true');
  assert.strictEqual(state.jointRotations.armRight, 120.0, 'armRight must be clamped to max 120 deg');
  assert.strictEqual(state.jointRotations.armLeft, -45.0, 'armLeft must be clamped to min -45 deg');
  assert.strictEqual(state.jointRotations.headTilt, 15.0, 'headTilt must be clamped to max 15 deg');

  assert.ok(state.clampedJoints.armRight);
  assert.strictEqual(state.clampedJoints.armRight.raw, 240.0);
  assert.strictEqual(state.clampedJoints.armRight.clamped, 120.0);
});

test('CharacterPerformance: frame-deterministic clip evaluation produces identical outputs', () => {
  const waveClip = getActionClip('arm_gesture_wave');

  const evalA = evaluatePerformanceClips('upper_body_cutout', 25, [
    { clip: waveClip, startFrame: 0, durationInFrames: 60, intensity: 1.0 },
  ]);

  const evalB = evaluatePerformanceClips('upper_body_cutout', 25, [
    { clip: waveClip, startFrame: 0, durationInFrames: 60, intensity: 1.0 },
  ]);

  assert.deepStrictEqual(evalA, evalB, 'Repeated clip evaluation at the same frame must be 100% deterministic');
});

test('CharacterPerformance: multi-clip blending smoothly crossfades between overlapping clips', () => {
  const idleClip = getActionClip('neutral_idle');
  const presentClip = getActionClip('arm_gesture_present');

  // At frame 10, idle is blending out and present is blending in
  const blendedState = evaluatePerformanceClips('upper_body_cutout', 10, [
    {
      clip: idleClip,
      startFrame: 0,
      durationInFrames: 30,
      blendOutFrames: 10,
    },
    {
      clip: presentClip,
      startFrame: 5,
      durationInFrames: 45,
      blendInFrames: 10,
    },
  ]);

  assert.ok(blendedState.jointRotations.armLeft !== undefined);
  assert.ok(blendedState.jointRotations.headTilt !== undefined);
  assert.strictEqual(blendedState.isClamped, false);
});

test('CharacterPerformance: acceptance gate — same character executes >= 3 distinct actions across shots retaining identity', () => {
  const continuityRegistry = new CharacterContinuityRegistry();

  const heroIdentity: CharacterIdentity = {
    id: 'ren-hero',
    name: 'Ren (Hero Student)',
    styleFamily: 'anime-clean-v1',
    baseDefinitionId: 'student-articulated',
    defaultVariant: 'happy',
    rigProfile: 'upper_body_cutout',
    traits: {
      hairColor: 'dark_navy',
      heightScale: 1.0,
    },
  };
  continuityRegistry.register(heroIdentity);

  // Shot 1: Wide Shot — Neutral Idle
  const shot1Config = createShotCharacterConfig(heroIdentity, {
    shotId: 'shot-01-wide',
    shotType: 'wide',
    pose: 'idle',
  });
  const shot1Eval = evaluatePerformanceClips(heroIdentity.rigProfile!, 15, [
    { clip: getActionClip('neutral_idle'), startFrame: 0 },
  ]);

  // Shot 2: Medium Shot — Explanatory Gesture
  const shot2Config = createShotCharacterConfig(heroIdentity, {
    shotId: 'shot-02-medium',
    shotType: 'medium',
    pose: 'talk_gesture',
  });
  const shot2Eval = evaluatePerformanceClips(heroIdentity.rigProfile!, 20, [
    { clip: getActionClip('arm_gesture_present'), startFrame: 0 },
  ]);

  // Shot 3: Close-Up Shot — Friendly Wave
  const shot3Config = createShotCharacterConfig(heroIdentity, {
    shotId: 'shot-03-close-up',
    shotType: 'close_up',
    pose: 'wave',
  });
  const shot3Eval = evaluatePerformanceClips(heroIdentity.rigProfile!, 30, [
    { clip: getActionClip('arm_gesture_wave'), startFrame: 0 },
  ]);

  // Verify identity retention across all 3 shots
  assert.strictEqual(shot1Config.identity.id, heroIdentity.id);
  assert.strictEqual(shot2Config.identity.id, heroIdentity.id);
  assert.strictEqual(shot3Config.identity.id, heroIdentity.id);
  assert.strictEqual(shot1Config.definitionId, 'student-articulated');
  assert.strictEqual(shot2Config.definitionId, 'student-articulated');
  assert.strictEqual(shot3Config.definitionId, 'student-articulated');

  // Verify 3 distinct actions executed without joint separation
  assert.strictEqual(shot1Eval.activeClipId, 'neutral_idle');
  assert.strictEqual(shot2Eval.activeClipId, 'arm_gesture_present');
  assert.strictEqual(shot3Eval.activeClipId, 'arm_gesture_wave');

  assert.strictEqual(shot1Eval.isClamped, false);
  assert.strictEqual(shot2Eval.isClamped, false);
  assert.strictEqual(shot3Eval.isClamped, false);

  // Distinct joint postures
  assert.notStrictEqual(shot1Eval.jointRotations.armLeft, shot2Eval.jointRotations.armLeft);
  assert.notStrictEqual(shot1Eval.jointRotations.armRight, shot3Eval.jointRotations.armRight);
});
