import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { defaultAssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import { getAgentDiscoveryData } from '../../src/core/agent/discovery';
import { analyzeSceneComposition } from '../../src/core/agent/analyzer';
import { autoCorrectScene } from '../../src/core/agent/corrector';
import { SceneManifest } from '../../src/core/scene/types';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

describe('Agent Discovery, Visual Feedback & Self-Correction System', () => {
  describe('Agent Discovery Capabilities', () => {
    it('returns complete capabilities, assets, and action vocabulary', () => {
      const data = getAgentDiscoveryData();

      assert.strictEqual(data.version, '1.0.0');
      assert.ok(data.assets.total >= 44, `Expected at least 44 assets, got ${data.assets.total}`);
      assert.ok(data.characters.presets.length >= 3);
      assert.strictEqual(data.characters.poses.length, 6);

      // Verify 11-action vocabulary
      assert.strictEqual(data.animation.actions.length, 11);
      const actionNames = data.animation.actions.map((a) => a.name);
      assert.ok(actionNames.includes('idle'));
      assert.ok(actionNames.includes('bow'));
      assert.ok(actionNames.includes('wave'));
      assert.ok(actionNames.includes('talk'));
      assert.ok(actionNames.includes('point'));
      assert.ok(actionNames.includes('nod'));
      assert.ok(actionNames.includes('shake_head'));
      assert.ok(actionNames.includes('shrug'));
      assert.ok(actionNames.includes('think'));
      assert.ok(actionNames.includes('surprise'));
      assert.ok(actionNames.includes('walk_cycle'));

      // Verify cinematography options
      assert.ok(data.camera.cinematography.depthOfField.maxBlurCeiling >= 20);
      assert.ok(data.sequence.transitions.includes('dissolve'));
      assert.ok(data.sequence.letterbox.includes('cinemascope'));
      assert.ok(data.sequence.colorGrades.includes('golden-hour'));
    });
  });

  describe('Automated Visual Feedback & Composition Analyzer', () => {
    const validScene: SceneManifest = {
      id: 'test-valid-scene',
      name: 'Well-Staged Scene',
      canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 150 },
      camera: { preset: 'static', focalDepth: 1.0 },
      environment: { preset: 'japanese-classroom' },
      characters: [
        {
          id: 'ren',
          characterId: 'student-ren-v2',
          depth: 1.0,
          position: { x: 960, y: 920 },
          scale: 1.0,
        },
      ],
    };

    it('evaluates a well-staged scene with high passing score', () => {
      const report = analyzeSceneComposition(validScene);

      assert.strictEqual(report.passed, true);
      assert.ok(report.overallScore >= 80, `Expected score >= 80, got ${report.overallScore}`);
      assert.strictEqual(report.scoreBreakdown.grounding, 100);
      assert.strictEqual(report.scoreBreakdown.depthFocus, 100);
      assert.strictEqual(report.scoreBreakdown.framing, 100);
      assert.strictEqual(report.issues.filter((i) => i.severity === 'error').length, 0);
    });

    it('detects floating character with exact grounding remediation', () => {
      const floatingScene: SceneManifest = {
        ...validScene,
        characters: [
          {
            id: 'ren',
            characterId: 'student-ren-v2',
            position: { x: 960, y: 780 }, // floating by 120px
          },
        ],
      };

      const report = analyzeSceneComposition(floatingScene);
      assert.strictEqual(report.passed, false);

      const floatingIssue = report.issues.find((i) => i.code === 'CHARACTER_FLOATING');
      assert.ok(floatingIssue, 'Should detect CHARACTER_FLOATING issue');
      assert.strictEqual(floatingIssue.severity, 'error');
      assert.strictEqual(floatingIssue.remediation?.recipeId, 'CORRECT_GROUNDING');
      assert.strictEqual(floatingIssue.remediation?.parameters.targetY, 900);
    });

    it('detects headroom clipping under cinemascope letterbox matte', () => {
      const tallScene: SceneManifest = {
        ...validScene,
        characters: [
          {
            id: 'ren',
            characterId: 'student-ren-v2',
            position: { x: 960, y: 600 }, // headY = 600 - 580 + 40 = 60px (clips under 138px cinemascope matte)
          },
        ],
      };

      const report = analyzeSceneComposition(tallScene, { letterbox: 'cinemascope' });
      assert.strictEqual(report.passed, false);

      const clipIssue = report.issues.find((i) => i.code === 'LETTERBOX_HEAD_CLIPPED');
      assert.ok(clipIssue, 'Should detect LETTERBOX_HEAD_CLIPPED');
      assert.strictEqual(clipIssue.severity, 'error');
      assert.strictEqual(clipIssue.remediation?.recipeId, 'CORRECT_LETTERBOX_CLIPPING');
    });

    it('detects hero character out of focus under shallow depth-of-field', () => {
      const blurryHeroScene: SceneManifest = {
        ...validScene,
        camera: {
          preset: 'static',
          focalDepth: 0.4,
          depthOfField: { aperture: 1.0, maxBlur: 10.0 },
        },
        characters: [
          {
            id: 'ren',
            characterId: 'student-ren-v2',
            depth: 1.0, // divergence = 0.6 -> blur = 6.0px
            position: { x: 960, y: 920 },
          },
        ],
        dialog: [
          {
            id: 'd1',
            characterId: 'ren',
            speaker: 'Ren',
            text: 'I am speaking!',
            startFrame: 10,
            endFrame: 50,
          },
        ],
      };

      const report = analyzeSceneComposition(blurryHeroScene);
      assert.strictEqual(report.passed, false);

      const focusIssue = report.issues.find((i) => i.code === 'SUBJECT_OUT_OF_FOCUS');
      assert.ok(focusIssue, 'Should detect SUBJECT_OUT_OF_FOCUS');
      assert.strictEqual(focusIssue.severity, 'error');
      assert.strictEqual(focusIssue.remediation?.recipeId, 'CORRECT_DOF_FOCUS');
      assert.strictEqual(focusIssue.remediation?.parameters.targetFocalDepth, 1.0);
    });

    it('detects action clips overflowing scene duration', () => {
      const overflowScene: SceneManifest = {
        ...validScene,
        canvas: { durationInFrames: 100 },
        characters: [
          {
            id: 'ren',
            characterId: 'student-ren-v2',
            position: { x: 960, y: 920 },
            animation: {
              actions: [{ action: 'talk', startFrame: 80, durationInFrames: 60 }], // ends at 140 > 100
            },
          },
        ],
      };

      const report = analyzeSceneComposition(overflowScene);
      const overflowIssue = report.issues.find((i) => i.code === 'ACTION_OVERFLOWS_SCENE');
      assert.ok(overflowIssue, 'Should detect ACTION_OVERFLOWS_SCENE');
      assert.strictEqual(overflowIssue.remediation?.recipeId, 'CORRECT_ACTION_TIMING');
      assert.strictEqual(overflowIssue.remediation?.parameters.targetDurationInFrames, 20);
    });

    it('guarantees pure mathematical frame-determinism: identical inputs return identical reports', () => {
      const report1 = analyzeSceneComposition(validScene);
      const report2 = analyzeSceneComposition(validScene);

      assert.strictEqual(report1.overallScore, report2.overallScore);
      assert.strictEqual(report1.passed, report2.passed);
      assert.deepStrictEqual(report1.scoreBreakdown, report2.scoreBreakdown);
      assert.deepStrictEqual(report1.issues, report2.issues);
    });
  });

  describe('Intelligent Self-Correction Engine', () => {
    it('applies deterministic remediation recipes and improves overall scene score', () => {
      const flawedScene: SceneManifest = {
        id: 'test-flawed',
        name: 'Flawed Test Scene',
        canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 150 },
        camera: {
          preset: 'static',
          focalDepth: 0.4,
          depthOfField: { aperture: 1.0, maxBlur: 10.0 },
        },
        environment: { preset: 'japanese-classroom' },
        characters: [
          {
            id: 'ren',
            characterId: 'student-ren-v2',
            depth: 1.0,
            position: { x: 960, y: 780 }, // floating
            animation: {
              actions: [
                { action: 'wave', startFrame: 120, durationInFrames: 50 }, // overflows
              ],
            },
          },
        ],
        dialog: [{ id: 'd1', characterId: 'ren', text: 'Hello', startFrame: 10, endFrame: 50 }],
      };

      const result = autoCorrectScene(flawedScene);

      assert.ok(result.appliedRecipes.length >= 3, `Expected at least 3 recipes applied, got ${result.appliedRecipes.length}`);
      assert.ok(result.improvedScore > result.originalScore, `Improved score (${result.improvedScore}) should exceed original (${result.originalScore})`);

      // Verify character is grounded
      const correctedChar = result.manifest.characters?.[0];
      assert.strictEqual(correctedChar?.position.y, 900);

      // Verify camera focalDepth is snapped
      assert.strictEqual(result.manifest.camera?.focalDepth, 1.0);

      // Verify action duration is clamped
      assert.strictEqual(correctedChar?.animation?.actions?.[0].durationInFrames, 30);

      // Verify original manifest was not mutated (pure function)
      assert.strictEqual(flawedScene.characters?.[0].position.y, 780);
      assert.strictEqual(flawedScene.camera?.focalDepth, 0.4);
      assert.strictEqual(flawedScene.characters?.[0].animation?.actions?.[0].durationInFrames, 50);
    });
  });
});
