import test from 'node:test';
import assert from 'node:assert';
import {
  CLOSE_UP_INTIMATE_PRESET,
  formatCompositionReport,
  MEDIUM_DIALOGUE_PRESET,
  resolveCinematicIntent,
  ShotIntentSpec,
  validateShotComposition,
  WIDE_ESTABLISHING_PRESET,
} from '../../src/core/cinematography';

test('CinematicIntent: differentiates establishing, wide, medium, and close-up framing', () => {
  const est = resolveCinematicIntent(WIDE_ESTABLISHING_PRESET);
  const med = resolveCinematicIntent(MEDIUM_DIALOGUE_PRESET);
  const cu = resolveCinematicIntent(CLOSE_UP_INTIMATE_PRESET);

  // Subject scale should scale up monotonically from establishing to close-up
  assert.ok(est.subject.scale < med.subject.scale, 'Establishing scale must be smaller than medium');
  assert.ok(med.subject.scale < cu.subject.scale, 'Medium scale must be smaller than close-up');

  // Camera zoom should reflect shot tightness
  assert.ok(est.debugTelemetry.computedZoom < cu.debugTelemetry.computedZoom);

  // Optics: close-up should enable shallow DoF, establishing should not
  assert.strictEqual(cu.camera.depthOfField?.enabled, true);
  assert.strictEqual(est.camera.depthOfField?.enabled, false);
});

test('CinematicIntent: aligns subject horizontally to screen regions including Rule of Thirds', () => {
  const leftSpec: ShotIntentSpec = {
    id: 'test-left',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      screenRegion: 'rule_of_thirds_left',
    },
  };
  const centerSpec: ShotIntentSpec = {
    id: 'test-center',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      screenRegion: 'center',
    },
  };
  const rightSpec: ShotIntentSpec = {
    id: 'test-right',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      screenRegion: 'rule_of_thirds_right',
    },
  };

  const leftSol = resolveCinematicIntent(leftSpec);
  const centerSol = resolveCinematicIntent(centerSpec);
  const rightSol = resolveCinematicIntent(rightSpec);

  assert.strictEqual(leftSol.subject.position.x, 640);
  assert.strictEqual(centerSol.subject.position.x, 960);
  assert.strictEqual(rightSol.subject.position.x, 1280);
});

test('CinematicIntent: determines proper lead room vector from character gaze direction', () => {
  const lookRightSpec: ShotIntentSpec = {
    id: 'look-right',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      lookDirection: 'screen_right',
    },
  };
  const lookLeftSpec: ShotIntentSpec = {
    id: 'look-left',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      lookDirection: 'screen_left',
    },
  };

  const solRight = resolveCinematicIntent(lookRightSpec);
  const solLeft = resolveCinematicIntent(lookLeftSpec);

  assert.strictEqual(solRight.subject.flipX, false);
  assert.strictEqual(solRight.debugTelemetry.leadRoomDirection, 'right');

  assert.strictEqual(solLeft.subject.flipX, true);
  assert.strictEqual(solLeft.debugTelemetry.leadRoomDirection, 'left');
});

test('CinematicIntent: enforces director overrides strictly over calculated defaults', () => {
  const overriddenSpec: ShotIntentSpec = {
    id: 'director-custom',
    intent: 'wide',
    durationInFrames: 45,
    subject: {
      characterId: 'student-articulated',
      screenRegion: 'center',
    },
    overrides: {
      cameraPreset: 'tracking',
      zoom: 1.45,
      cameraPosition: { x: 50, y: -20 },
      subjectPosition: { x: 800, y: 920 },
      subjectScale: 2.1,
      shake: { enabled: true, frequency: 1.2 },
    },
  };

  const sol = resolveCinematicIntent(overriddenSpec);

  assert.strictEqual(sol.camera.preset, 'tracking');
  assert.strictEqual(sol.debugTelemetry.computedZoom, 1.45);
  assert.strictEqual(sol.subject.position.x, 800);
  assert.strictEqual(sol.subject.position.y, 920);
  assert.strictEqual(sol.subject.scale, 2.1);
  assert.strictEqual(sol.camera.shake?.enabled, true);
  assert.strictEqual(sol.camera.shake?.frequency, 1.2);
});

test('CinematicIntent: validates composition and flags headroom clipping error', () => {
  const clippedSpec: ShotIntentSpec = {
    id: 'clipped-shot',
    intent: 'close_up',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
    },
    overrides: {
      // Force character way up off top edge of screen
      subjectPosition: { x: 960, y: 400 },
      subjectScale: 1.5,
    },
  };

  const sol = resolveCinematicIntent(clippedSpec);
  const report = validateShotComposition(sol, clippedSpec);

  assert.strictEqual(report.valid, false, 'Clipped head must mark composition invalid');
  const headroomIssue = report.issues.find((i) => i.type === 'headroom_violation');
  assert.ok(headroomIssue, 'Must include headroom_violation issue');
  assert.strictEqual(headroomIssue?.severity, 'error');
  assert.ok(report.score <= 75, 'Score must reflect error penalty');
});

test('CinematicIntent: validates composition and flags lead room crowding warning', () => {
  const crowdedSpec: ShotIntentSpec = {
    id: 'crowded-leadroom',
    intent: 'medium',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
      screenRegion: 'edge_right', // X ~ 1575px
      lookDirection: 'screen_right', // Looking directly into right edge!
    },
  };

  const sol = resolveCinematicIntent(crowdedSpec);
  const report = validateShotComposition(sol, crowdedSpec);

  const leadIssue = report.issues.find((i) => i.type === 'leadroom_violation');
  assert.ok(leadIssue, 'Must flag lead room crowding');
  assert.strictEqual(leadIssue?.severity, 'warning');
  assert.ok(leadIssue?.message.includes('crowding the right frame edge'));
});

test('CinematicIntent: validates composition and flags scale mismatch for undersized close-up', () => {
  const tinySpec: ShotIntentSpec = {
    id: 'tiny-close-up',
    intent: 'close_up',
    durationInFrames: 30,
    subject: {
      characterId: 'student-articulated',
    },
    overrides: {
      subjectScale: 0.4, // Extremely small for a close-up
    },
  };

  const sol = resolveCinematicIntent(tinySpec);
  const report = validateShotComposition(sol, tinySpec);

  const scaleIssue = report.issues.find((i) => i.type === 'scale_mismatch');
  assert.ok(scaleIssue, 'Must flag scale mismatch');
  assert.strictEqual(scaleIssue?.severity, 'warning');
});

test('CinematicIntent: generates readable ASCII composition diagnostic report', () => {
  const sol = resolveCinematicIntent(WIDE_ESTABLISHING_PRESET);
  const report = validateShotComposition(sol, WIDE_ESTABLISHING_PRESET);
  const output = formatCompositionReport(report);

  assert.ok(output.includes('CINEMATIC SHOT COMPOSITION DIAGNOSTICS'));
  assert.ok(output.includes('VALID COMPOSITION'));
  assert.ok(output.includes('Headroom Ratio:'));
  assert.ok(output.includes('Lead Room Ratio:'));
  assert.ok(output.includes('Subject Height Ratio:'));
});
