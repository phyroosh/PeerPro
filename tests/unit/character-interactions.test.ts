import test from 'node:test';
import assert from 'node:assert';
import {
  resolveCharacterAnchor,
  resolvePropSocketOffset,
} from '../../src/core/interactions/anchors';
import { solveInteraction } from '../../src/core/interactions/solver';
import {
  validateInteractionCompatibility,
  assertInteractionCompatibility,
} from '../../src/core/interactions/validator';
import {
  studentArticulatedDefinition,
  studentCharacterDefinitionV2,
  studentThreeQuarterDefinition,
} from '../../src/core/characters/presets';
import { InteractionDefinition } from '../../src/core/interactions/types';

test('CharacterInteractions: resolves dynamic hand anchors responding to FK joint rotations', () => {
  // Resting idle arm (armRight = 0 deg)
  const restContext = {
    x: 960,
    y: 890,
    scale: 1.0,
    flipX: false,
    jointRotations: { armRight: 0 },
  };
  const restHand = resolveCharacterAnchor(studentArticulatedDefinition, 'hand_right', restContext);

  // Torso right shoulder is at 960 + 78 = 1038, y = 890 - 472 = 418. Hand is at y = 418 + 180 = 598.
  assert.strictEqual(restHand.x, 1038);
  assert.strictEqual(restHand.y, 598);

  // Rotated arm (armRight = 90 deg clockwise)
  const rotatedContext = {
    x: 960,
    y: 890,
    scale: 1.0,
    flipX: false,
    jointRotations: { armRight: 90 },
  };
  const rotHand = resolveCharacterAnchor(studentArticulatedDefinition, 'hand_right', rotatedContext);

  // Hand swung outward horizontally
  assert.ok(rotHand.x < restHand.x, 'Right arm swinging clockwise swings forward/outward');
  assert.ok(Math.abs(rotHand.y - 418) < 1.0, 'At 90 deg arm rotation, hand Y aligns with shoulder Y');
});

test('CharacterInteractions: guarantees 0.00px zero-drift tracking for hand-held props during animation', () => {
  const interaction: InteractionDefinition = {
    id: 'test-zero-drift-hold',
    type: 'hold_prop',
    characterId: 'student-articulated',
    targetId: 'starter-prop-umbrella',
    startFrame: 0,
    durationInFrames: 60,
    characterAnchor: 'hand_right',
    targetAnchor: 'grip',
    holdLayer: 'in_front_of',
  };

  // Test across multiple animated frames with varying arm rotation angles and breathing offsets
  for (let f = 0; f <= 60; f += 10) {
    const waveAngle = Math.sin((f / 30) * Math.PI * 2) * 16.0;
    const breathY = Math.sin((f / 30) * Math.PI * 2) * 2.5;

    const context = {
      x: 960,
      y: 890,
      scale: 1.0,
      flipX: false,
      rootOffsetY: breathY,
      jointRotations: { armRight: waveAngle },
      activePartOverrides: { armsRight: 'starter-char-arm-01-right-wave' },
    };

    const resolved = solveInteraction(interaction, studentArticulatedDefinition, context, f);
    const hand = resolveCharacterAnchor(studentArticulatedDefinition, 'hand_right', context);

    // Umbrella anchor is at (160, 280), grip socket is at (160, 280) -> offset is (0, 0)
    const propOffset = resolvePropSocketOffset('starter-prop-umbrella', 'grip');
    const computedGripX = resolved.targetTransform.x + propOffset.x;
    const computedGripY = resolved.targetTransform.y + propOffset.y;

    const driftX = Math.abs(hand.x - computedGripX);
    const driftY = Math.abs(hand.y - computedGripY);

    assert.ok(driftX < 1e-4, `Frame ${f}: driftX was ${driftX}, must be < 0.0001px`);
    assert.ok(driftY < 1e-4, `Frame ${f}: driftY was ${driftY}, must be < 0.0001px`);
    assert.strictEqual(resolved.isAttached, true);
    assert.strictEqual(resolved.carrierId, 'student-articulated');
  }
});

test('CharacterInteractions: pick_up smoothly interpolates from resting surface to hand anchor', () => {
  const interaction: InteractionDefinition = {
    id: 'test-pickup',
    type: 'pick_up',
    characterId: 'student-articulated',
    targetId: 'starter-prop-umbrella',
    startFrame: 10,
    durationInFrames: 40,
    transitionFrames: 20,
    surfaceY: 890,
  };

  const context = { x: 960, y: 890, scale: 1.0, flipX: false };
  const restTransform = { x: 1100, y: 890, rotation: 0, scale: 1.0 };

  // Frame 10 (start of pickup): prop is at rest position on surface
  const startSolved = solveInteraction(interaction, studentArticulatedDefinition, context, 10, {
    targetRestTransform: restTransform,
  });
  assert.strictEqual(startSolved.targetTransform.x, 1100);
  assert.strictEqual(startSolved.targetTransform.y, 890);
  assert.strictEqual(startSolved.isAttached, false);

  // Frame 20 (halfway through transition): smoothstep interpolation
  const midSolved = solveInteraction(interaction, studentArticulatedDefinition, context, 20, {
    targetRestTransform: restTransform,
  });
  assert.ok(midSolved.targetTransform.x < 1100 && midSolved.targetTransform.x > 1038);
  assert.ok(midSolved.transitionProgress > 0 && midSolved.transitionProgress < 1);

  // Frame 30 (end of pickup): prop is at hand
  const endSolved = solveInteraction(interaction, studentArticulatedDefinition, context, 30, {
    targetRestTransform: restTransform,
  });
  assert.strictEqual(endSolved.isAttached, true);
  assert.strictEqual(endSolved.carrierId, 'student-articulated');
});

test('CharacterInteractions: set_down transitions prop from hand back to surface resting transform', () => {
  const interaction: InteractionDefinition = {
    id: 'test-setdown',
    type: 'set_down',
    characterId: 'student-articulated',
    targetId: 'starter-prop-umbrella',
    startFrame: 0,
    durationInFrames: 30,
    transitionFrames: 20,
    surfaceY: 890,
  };

  const context = { x: 960, y: 890, scale: 1.0, flipX: false };
  const restTransform = { x: 1100, y: 890, rotation: 0, scale: 1.0 };

  const startSolved = solveInteraction(interaction, studentArticulatedDefinition, context, 0, {
    targetRestTransform: restTransform,
  });
  assert.strictEqual(startSolved.isAttached, true);

  const endSolved = solveInteraction(interaction, studentArticulatedDefinition, context, 20, {
    targetRestTransform: restTransform,
  });
  assert.strictEqual(endSolved.isAttached, false);
  assert.strictEqual(endSolved.targetTransform.x, 1100);
  assert.strictEqual(endSolved.targetTransform.y, 890);
});

test('CharacterInteractions: sit_at_seat aligns character hip anchor with furniture seat surface', () => {
  const interaction: InteractionDefinition = {
    id: 'test-sit-chair',
    type: 'sit_at_seat',
    characterId: 'student-ren-v2',
    targetId: 'starter-env-classroom-chair',
    startFrame: 0,
    durationInFrames: 60,
    targetAnchor: 'seat_surface',
  };

  const chairRest = { x: 960, y: 890, rotation: 0, scale: 1.0 };
  const resolved = solveInteraction(
    interaction,
    studentCharacterDefinitionV2,
    { x: 960, y: 890, scale: 1.0 },
    15,
    { targetRestTransform: chairRest }
  );

  assert.strictEqual(resolved.isAttached, true);
  assert.strictEqual(resolved.carrierId, 'starter-env-classroom-chair');
  // Chair seat surface is at (80, 140) on 160x260 with anchor (0.5, 1.0) -> offset is (0, -120)
  // Character Y becomes chair Y + (-120) = 890 - 120 = 770
  assert.strictEqual(resolved.characterTransform.y, 770);
  assert.strictEqual(resolved.characterTransform.x, 960);
});

test('CharacterInteractions: pass_object transfers prop ownership and maintains continuous trajectory', () => {
  const interaction: InteractionDefinition = {
    id: 'test-pass-umbrella',
    type: 'pass_object',
    characterId: 'student-articulated',
    targetId: 'starter-prop-umbrella',
    secondaryCharacterId: 'student-three-quarter',
    startFrame: 10,
    durationInFrames: 50,
    transitionFrames: 20, // Transition from frame 10 to 30, handoff at frame 20
  };

  const charAContext = { x: 900, y: 890, scale: 1.0, flipX: false };
  const charBContext = { x: 1200, y: 890, scale: 1.0, flipX: true };

  // Before midpoint (frame 15): carrier is Character A
  const earlySolved = solveInteraction(interaction, studentArticulatedDefinition, charAContext, 15, {
    secondaryCharacterDef: studentThreeQuarterDefinition,
    secondaryCharacterContext: charBContext,
  });
  assert.strictEqual(earlySolved.carrierId, 'student-articulated');

  // After midpoint (frame 25): carrier transitions to Character B
  const lateSolved = solveInteraction(interaction, studentArticulatedDefinition, charAContext, 25, {
    secondaryCharacterDef: studentThreeQuarterDefinition,
    secondaryCharacterContext: charBContext,
  });
  assert.strictEqual(lateSolved.carrierId, 'student-three-quarter');

  // Verify smooth monotonic horizontal progression from Character A (around x=978) to Character B (around x=1122)
  assert.ok(lateSolved.targetTransform.x > earlySolved.targetTransform.x);
});

test('CharacterInteractions: compatibility validator catches missing anchors and flags fallbacks', () => {
  // Valid interaction
  const validInter: InteractionDefinition = {
    id: 'valid-hold',
    type: 'hold_prop',
    characterId: 'student-articulated',
    targetId: 'starter-prop-umbrella',
    startFrame: 0,
    durationInFrames: 30,
    targetAnchor: 'grip',
  };
  const validReport = validateInteractionCompatibility(validInter, studentArticulatedDefinition);
  assert.strictEqual(validReport.compatible, true);
  assert.strictEqual(validReport.errors.length, 0);

  // Incompatible: face_only character has no arms
  const faceOnlyDef = {
    id: 'ren-bust',
    name: 'Ren Bust',
    styleFamily: 'anime-clean-v1',
    rootPart: undefined as any,
    slots: { head: { assetId: 'head-01' } },
    layerOrder: ['head'],
  };
  const bustReport = validateInteractionCompatibility(validInter, faceOnlyDef as any);
  assert.strictEqual(bustReport.compatible, false);
  assert.ok(bustReport.errors.length >= 1);
  assert.ok(bustReport.unsupportedReasons.includes('no_hand_anchors'));
  assert.throws(() => assertInteractionCompatibility(validInter, faceOnlyDef as any), /Interaction Incompatibility Error/);

  // Missing socket on unknown prop activates snap_to_anchor fallback
  const unknownPropInter: InteractionDefinition = {
    id: 'unknown-prop-hold',
    type: 'hold_prop',
    characterId: 'student-articulated',
    targetId: 'mystery-box',
    startFrame: 0,
    durationInFrames: 30,
    targetAnchor: 'handle',
  };
  const unknownReport = validateInteractionCompatibility(unknownPropInter, studentArticulatedDefinition);
  assert.strictEqual(unknownReport.compatible, true); // Still compatible via fallback
  assert.strictEqual(unknownReport.fallbackStrategy, 'snap_to_anchor');
  assert.ok(unknownReport.warnings.length >= 1);
});

test('CharacterInteractions: look_at directs gaze and auto-computes horizontal flipX orientation', () => {
  const interaction: InteractionDefinition = {
    id: 'look-at-desk',
    type: 'look_at',
    characterId: 'student-articulated',
    targetId: 'desk-left',
    startFrame: 0,
    durationInFrames: 30,
  };

  // Target is to the left of the character (x = 500, char at x = 960)
  const leftTarget = { x: 500, y: 700, rotation: 0, scale: 1.0 };
  const leftLook = solveInteraction(
    interaction,
    studentArticulatedDefinition,
    { x: 960, y: 890, scale: 1.0, flipX: false },
    15,
    { targetRestTransform: leftTarget }
  );

  assert.strictEqual(leftLook.characterTransform.flipX, true, 'Character must flipX to face leftward target');
  assert.ok(Math.abs(leftLook.characterTransform.rotation) <= 15, 'Gaze head tilt must remain within ±15 deg limit');
});
