import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDepthOfField,
  computeAtmosphericHaze,
  computeCameraDrift,
} from '../../src/core/camera/dof';
import { resolveActiveShot } from '../../src/core/sequence/resolver';
import { SequenceManifestSchema } from '../../src/core/sequence/schema';
import { SequenceShot, SequenceManifest } from '../../src/core/sequence/types';

describe('Cinematography, Depth, Occlusion & Sequence System', () => {
  describe('Optical Depth-of-Field (DoF)', () => {
    it('maintains pin-sharp focus at focal plane', () => {
      assert.equal(computeDepthOfField(1.0, 1.0), 0);
      assert.equal(computeDepthOfField(0.98, 1.0), 0, 'Should maintain sharp focal zone within 0.04');
    });

    it('computes optical blur for background and foreground layers diverging from focal plane', () => {
      const bgBlur = computeDepthOfField(0.35, 1.0, 1.5, 8.0);
      assert.ok(bgBlur > 0, `Background depth 0.35 should have blur, got ${bgBlur}`);
      assert.ok(bgBlur <= 8.0, 'Blur must not exceed maxBlur');

      const fgBlur = computeDepthOfField(1.4, 1.0, 1.5, 8.0);
      assert.ok(fgBlur > 0, `Foreground depth 1.4 should have blur, got ${fgBlur}`);
    });

    it('exhibits monotonic blur growth with increasing optical distance', () => {
      const nearBgBlur = computeDepthOfField(0.7, 1.0, 1.0);
      const farBgBlur = computeDepthOfField(0.3, 1.0, 1.0);

      assert.ok(farBgBlur > nearBgBlur, 'Farther layer must have larger blur radius');
    });

    it('clamps blur strictly to maxBlur ceiling', () => {
      const extremeBlur = computeDepthOfField(0.01, 2.5, 3.0, 5.0);
      assert.equal(extremeBlur, 5.0);
    });

    it('returns zero blur when aperture or maxBlur is zero', () => {
      assert.equal(computeDepthOfField(0.2, 1.0, 0), 0);
      assert.equal(computeDepthOfField(0.2, 1.0, 1.0, 0), 0);
    });
  });

  describe('Atmospheric Perspective & Aerial Haze', () => {
    it('produces zero haze for layers at or in front of minDepth', () => {
      assert.equal(computeAtmosphericHaze(1.0, 0.6), 0);
      assert.equal(computeAtmosphericHaze(0.6, 0.6), 0);
    });

    it('produces non-linear haze for distant background layers', () => {
      const midHaze = computeAtmosphericHaze(0.3, 0.6, 0.4);
      const deepHaze = computeAtmosphericHaze(0.1, 0.6, 0.4);

      assert.ok(midHaze > 0, 'Distant layer should have haze');
      assert.ok(deepHaze > midHaze, 'Deeper background should have greater atmospheric haze');
      assert.ok(deepHaze <= 0.4, 'Haze must not exceed configured density');
    });
  });

  describe('Camera Organic Drift & Shake', () => {
    it('returns zero displacement when shake is disabled', () => {
      const drift = computeCameraDrift(45, 30, { enabled: false });
      assert.equal(drift.driftX, 0);
      assert.equal(drift.driftY, 0);
      assert.equal(drift.driftRoll, 0);
    });

    it('produces smooth bounded handheld motion when enabled', () => {
      const config = {
        enabled: true,
        frequency: 0.5,
        amplitudeX: 3.0,
        amplitudeY: 2.0,
        rotational: 0.3,
      };

      const drift1 = computeCameraDrift(30, 30, config);
      assert.ok(Math.abs(drift1.driftX) <= 4.5);
      assert.ok(Math.abs(drift1.driftY) <= 3.0);
      assert.ok(Math.abs(drift1.driftRoll) <= 0.5);

      // Determinism
      const drift2 = computeCameraDrift(30, 30, config);
      assert.deepEqual(drift1, drift2);
    });
  });

  describe('Multi-Shot Sequence Resolver', () => {
    const mockShots: SequenceShot[] = [
      {
        id: 'shot-1',
        name: 'Establishing Wide',
        durationInFrames: 60,
        manifest: { id: 's1', name: 'Scene 1' },
      },
      {
        id: 'shot-2',
        name: 'Medium Close-up',
        durationInFrames: 80,
        transition: { type: 'fade_to_black', durationInFrames: 10 },
        manifest: { id: 's2', name: 'Scene 2' },
      },
      {
        id: 'shot-3',
        name: 'Reverse Reaction',
        durationInFrames: 70,
        transition: { type: 'dissolve', durationInFrames: 12 },
        manifest: { id: 's3', name: 'Scene 3' },
      },
    ];

    it('computes total duration and maps global frames to active shot local frames', () => {
      // Shot 1: [0, 60)
      const res0 = resolveActiveShot(0, mockShots);
      assert.equal(res0.shotIndex, 0);
      assert.equal(res0.localFrame, 0);
      assert.equal(res0.totalDurationInFrames, 210);

      const res40 = resolveActiveShot(40, mockShots);
      assert.equal(res40.shotIndex, 0);
      assert.equal(res40.localFrame, 40);

      // Shot 2: [60, 140)
      const res60 = resolveActiveShot(60, mockShots);
      assert.equal(res60.shotIndex, 1);
      assert.equal(res60.localFrame, 0);

      const res100 = resolveActiveShot(100, mockShots);
      assert.equal(res100.shotIndex, 1);
      assert.equal(res100.localFrame, 40);

      // Shot 3: [140, 210)
      const res140 = resolveActiveShot(140, mockShots);
      assert.equal(res140.shotIndex, 2);
      assert.equal(res140.localFrame, 0);

      const res209 = resolveActiveShot(209, mockShots);
      assert.equal(res209.shotIndex, 2);
      assert.equal(res209.localFrame, 69);
    });

    it('resolves transition progression accurately across shot boundaries', () => {
      // Frame 60 is localFrame 0 of Shot 2 (fade_to_black, 10 frames)
      const transStart = resolveActiveShot(60, mockShots);
      assert.ok(transStart.transition);
      assert.equal(transStart.transition?.type, 'fade_to_black');
      assert.equal(transStart.transition?.progress, 0);

      // Frame 65 is midpoint (5 frames in) -> peak fade overlay
      const transMid = resolveActiveShot(65, mockShots);
      assert.ok(transMid.transition);
      assert.equal(transMid.transition?.progress, 0.5);
      assert.equal(transMid.transition?.overlayOpacity, 1.0);

      // Frame 75 is after transition window (15 frames in > 10 frames)
      const transEnd = resolveActiveShot(75, mockShots);
      assert.equal(transEnd.transition, undefined);
    });

    it('safely clamps frames beyond total duration', () => {
      const overflow = resolveActiveShot(300, mockShots);
      assert.equal(overflow.shotIndex, 2);
      assert.equal(overflow.localFrame, 69);
    });
  });

  describe('Sequence Schema Validation', () => {
    it('validates a well-formed SequenceManifest', () => {
      const valid: SequenceManifest = {
        id: 'test-sequence',
        name: 'Test Narrative Sequence',
        shots: [
          {
            id: 'shot-a',
            durationInFrames: 60,
            manifest: { id: 'scene-a', name: 'Scene A' },
          },
        ],
        compositing: {
          vignette: true,
          letterbox: 'cinemascope',
          colorGrade: 'anime-warm',
        },
      };

      const parsed = SequenceManifestSchema.parse(valid);
      assert.equal(parsed.id, 'test-sequence');
      assert.equal(parsed.shots.length, 1);
      assert.equal(parsed.compositing?.letterbox, 'cinemascope');
    });

    it('rejects sequence with empty shots array', () => {
      assert.throws(() => {
        SequenceManifestSchema.parse({
          id: 'empty-seq',
          name: 'Empty',
          shots: [],
        });
      }, /Sequence must define at least one shot/);
    });

    it('rejects non-kebab sequence ID', () => {
      assert.throws(() => {
        SequenceManifestSchema.parse({
          id: 'Bad Sequence ID',
          name: 'Invalid',
          shots: [{ id: 's1', durationInFrames: 30, manifest: { id: 's', name: 'S' } }],
        });
      }, /Sequence ID must be kebab-case/);
    });
  });
});
