import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeOutBack,
  easeInOutSine,
  interpolateWithEasing,
  evaluateCharacterActions,
  evaluateSingleAction,
  CharacterActionClipSchema,
} from '../../src/core/animation';
import { CharacterActionClip } from '../../src/core/animation/types';

describe('Animation Actions & Motion Quality System', () => {
  describe('Easing Curves Mathematical Properties', () => {
    it('satisfies boundary conditions [f(0) = 0, f(1) = 1] across all easing curves', () => {
      const easings = [
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic,
        easeOutBack,
        easeInOutSine,
      ];

      for (const fn of easings) {
        assert.ok(Math.abs(fn(0)) < 1e-6, `${fn.name}(0) must be approx 0`);
        assert.ok(Math.abs(fn(1) - 1) < 1e-6, `${fn.name}(1) must be approx 1`);
      }
    });

    it('clamps inputs outside [0, 1] safely', () => {
      assert.equal(easeInQuad(-0.5), 0);
      assert.equal(easeInQuad(1.5), 1);
      assert.equal(easeInOutCubic(-10), 0);
      assert.equal(easeInOutCubic(10), 1);
    });

    it('verifies easeOutBack overshoot property for anticipation / organic settle', () => {
      // easeOutBack should exceed 1.0 during the middle of the transition before settling to 1.0
      const midVal = easeOutBack(0.65, 1.70158);
      assert.ok(midVal > 1.0, `easeOutBack(0.65) should overshoot (>1.0), got ${midVal}`);
      assert.ok(Math.abs(easeOutBack(1.0) - 1.0) < 1e-6);
    });

    it('interpolateWithEasing correctly blends between numbers with requested curve', () => {
      const midLinear = interpolateWithEasing(100, 200, 0.5, 'linear');
      assert.equal(midLinear, 150);

      const midInQuad = interpolateWithEasing(100, 200, 0.5, 'ease-in-quad');
      assert.equal(midInQuad, 125); // 100 + 100 * (0.5^2 = 0.25) = 125

      const midOutQuad = interpolateWithEasing(100, 200, 0.5, 'ease-out-quad');
      assert.equal(midOutQuad, 175); // 100 + 100 * (0.5 * 1.5 = 0.75) = 175
    });
  });

  describe('Individual Action Generators', () => {
    it('evaluates all 11 action vocabulary items producing valid, bounded states', () => {
      const actions = [
        'idle',
        'bow',
        'wave',
        'talk',
        'point',
        'nod',
        'shake_head',
        'shrug',
        'think',
        'surprise',
        'walk_cycle',
      ] as const;

      for (const action of actions) {
        const state = evaluateSingleAction(action, 0.5, 30, 30, 1.0);
        assert.ok(state, `Action "${action}" should produce a valid state`);
        assert.ok(typeof state.pose === 'string', `Action "${action}" should have a pose string`);
        assert.ok(typeof state.jointRotations.armLeft === 'number');
        assert.ok(typeof state.jointRotations.armRight === 'number');
        assert.ok(typeof state.jointRotations.headTilt === 'number');
        assert.ok(state.rootOffset.scaleY > 0.8 && state.rootOffset.scaleY < 1.3);
        assert.ok(Number.isFinite(state.rootOffset.y));
        assert.ok(Number.isFinite(state.rootOffset.rotation));
      }
    });

    it('bow action produces realistic tri-phase pitch down, apex hold, and recovery', () => {
      const start = evaluateSingleAction('bow', 0.0, 0, 30, 1.0);
      assert.equal(start.rootOffset.y, 0);

      const apex = evaluateSingleAction('bow', 0.5, 15, 30, 1.0);
      assert.equal(apex.rootOffset.rotation, 0);
      assert.ok(apex.jointRotations.headTilt >= 8, 'Bow apex should have downward head pitch');
      assert.ok(apex.rootOffset.y >= 15, 'Bow apex should have vertical knee dip');
      assert.ok(apex.rootOffset.scaleY <= 0.95, 'Bow apex should have vertical foreshortening compression');

      const recovery = evaluateSingleAction('bow', 1.0, 30, 30, 1.0);
      assert.ok(recovery.rootOffset.y < 0.1);
    });

    it('wave action produces active forearm oscillation and cheerful head tilt', () => {
      const waveState = evaluateSingleAction('wave', 0.5, 15, 30, 1.0);
      assert.equal(waveState.pose, 'wave');
      assert.ok(waveState.partOverrides.armsRight.includes('wave'));
      assert.ok(Number.isFinite(waveState.jointRotations.armRight));
      assert.equal(waveState.expressionCue?.mouth, 'starter-char-mouth-smile-v2');
    });
  });

  describe('Timeline Composition & Blending', () => {
    const testClips: CharacterActionClip[] = [
      {
        id: 'c1',
        action: 'bow',
        startFrame: 30,
        durationInFrames: 45, // frames 30 to 75
        blendInFrames: 10,
        blendOutFrames: 10,
      },
      {
        id: 'c2',
        action: 'wave',
        startFrame: 75,
        durationInFrames: 45, // frames 75 to 120
        blendInFrames: 10,
        blendOutFrames: 10,
      },
    ];

    it('falls back seamlessly to idle when no clips are active', () => {
      const stateBefore = evaluateCharacterActions(10, 30, testClips, 'idle');
      assert.equal(stateBefore.activeActionName, 'idle');
      assert.equal(stateBefore.pose, 'idle');
      assert.equal(stateBefore.rootOffset.rotation, 0);

      const stateAfter = evaluateCharacterActions(135, 30, testClips, 'idle');
      assert.equal(stateAfter.activeActionName, 'idle');
      assert.equal(stateAfter.pose, 'idle');
    });

    it('smoothly cross-fades during clip blend-in window', () => {
      // Clip starts at 30, blendIn is 10 frames.
      // At frame 30, blendWeight should be near 0
      const atStart = evaluateCharacterActions(30, 30, testClips);
      assert.ok(atStart.blendWeight <= 0.05);

      // At frame 35 (halfway into blend-in), weight should be approx 0.5
      const atHalf = evaluateCharacterActions(35, 30, testClips);
      assert.ok(atHalf.blendWeight > 0.4 && atHalf.blendWeight < 0.6);

      // At frame 40 (end of blend-in), weight should reach 1.0
      const atFull = evaluateCharacterActions(40, 30, testClips);
      assert.ok(atFull.blendWeight >= 0.99);
      assert.equal(atFull.activeActionName, 'bow');
    });

    it('reaches maximum action intensity at apex', () => {
      const atApex = evaluateCharacterActions(52, 30, testClips);
      assert.equal(atApex.activeActionName, 'bow');
      assert.ok(atApex.jointRotations.headTilt >= 8);
      assert.ok(atApex.rootOffset.y >= 15);
      assert.equal(atApex.blendWeight, 1.0);
    });

    it('guarantees frame-determinism: identical frames return identical results', () => {
      const run1 = evaluateCharacterActions(85, 30, testClips);
      const run2 = evaluateCharacterActions(85, 30, testClips);

      assert.deepEqual(run1, run2);
    });
  });

  describe('Zod Schema Validation', () => {
    it('validates compliant CharacterActionClip cleanly', () => {
      const valid = CharacterActionClipSchema.parse({
        action: 'wave',
        startFrame: 0,
        durationInFrames: 60,
        blendInFrames: 8,
        blendOutFrames: 8,
        intensity: 1.5,
        options: {
          waveFrequency: 2.2,
        },
      });

      assert.equal(valid.action, 'wave');
      assert.equal(valid.durationInFrames, 60);
      assert.equal(valid.intensity, 1.5);
    });

    it('rejects negative startFrame', () => {
      assert.throws(() => {
        CharacterActionClipSchema.parse({
          action: 'talk',
          startFrame: -5,
          durationInFrames: 30,
        });
      }, /startFrame must be non-negative/);
    });

    it('rejects zero or negative durationInFrames', () => {
      assert.throws(() => {
        CharacterActionClipSchema.parse({
          action: 'talk',
          startFrame: 0,
          durationInFrames: 0,
        });
      }, /durationInFrames must be greater than zero/);
    });

    it('rejects unknown action names', () => {
      assert.throws(() => {
        CharacterActionClipSchema.parse({
          action: 'flying_kick' as any,
          startFrame: 0,
          durationInFrames: 30,
        });
      });
    });
  });
});
