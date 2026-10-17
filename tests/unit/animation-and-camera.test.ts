import test from 'node:test';
import assert from 'node:assert';
import {
  computeBreathing,
  computeHeadTilt,
  computeOscillation,
  resolveExpressionSchedule,
  clamp,
  lerp,
} from '../../src/core/animation/primitives';
import { computeCameraState } from '../../src/core/camera/presets';
import { computeParallax } from '../../src/core/camera/parallax';
import { CameraConfig } from '../../src/core/camera/types';

test('Camera25D: static preset returns unshifted coordinates across duration', () => {
  const config: CameraConfig = { preset: 'static' };
  const state0 = computeCameraState(0, 120, config);
  const state60 = computeCameraState(60, 120, config);
  const state120 = computeCameraState(120, 120, config);

  assert.deepStrictEqual(state0, { x: 0, y: 0, zoom: 1.0, focalDepth: 1.0 });
  assert.deepStrictEqual(state60, { x: 0, y: 0, zoom: 1.0, focalDepth: 1.0 });
  assert.deepStrictEqual(state120, { x: 0, y: 0, zoom: 1.0, focalDepth: 1.0 });
});

test('Camera25D: intensity 0 disables any movement regardless of preset', () => {
  const config: CameraConfig = { preset: 'pan-left-to-right', intensity: 0 };
  const state = computeCameraState(60, 120, config);
  assert.strictEqual(state.x, 0);
  assert.strictEqual(state.y, 0);
  assert.strictEqual(state.zoom, 1.0);
});

test('Camera25D: pan-left-to-right advances monotonically across duration', () => {
  const config: CameraConfig = { preset: 'pan-left-to-right', intensity: 1.0 };
  const start = computeCameraState(0, 120, config);
  const mid = computeCameraState(60, 120, config);
  const end = computeCameraState(119, 120, config);

  assert.ok(start.x < 0, `Expected start.x to be negative, got ${start.x}`);
  assert.ok(Math.abs(mid.x) < 2, `Expected mid.x to be near zero, got ${mid.x}`);
  assert.ok(end.x > 0, `Expected end.x to be positive, got ${end.x}`);
  assert.ok(start.x < mid.x && mid.x < end.x, 'Pan progression should be strictly monotonically increasing');
});

test('Camera25D: slow-push-in increases zoom factor monotonically', () => {
  const config: CameraConfig = { preset: 'slow-push-in', intensity: 1.0 };
  const start = computeCameraState(0, 120, config);
  const mid = computeCameraState(60, 120, config);
  const end = computeCameraState(119, 120, config);

  assert.strictEqual(start.zoom, 1.0);
  assert.ok(mid.zoom > start.zoom, 'Mid zoom should exceed start zoom');
  assert.ok(end.zoom > mid.zoom, 'End zoom should exceed mid zoom');
  assert.ok(end.zoom <= 1.25, 'Zoom should remain within default safety bounds');
});

test('Camera25D: clamps displacement and zoom to configured safety bounds', () => {
  const config: CameraConfig = {
    preset: 'custom',
    bounds: {
      maxDisplacementX: 50,
      maxDisplacementY: 30,
      minZoom: 0.95,
      maxZoom: 1.1,
    },
    customMove: () => ({ x: 500, y: -200, zoom: 3.5 }),
  };

  const state = computeCameraState(50, 100, config);
  assert.strictEqual(state.x, 50, 'Displacement X must clamp to maxDisplacementX');
  assert.strictEqual(state.y, -30, 'Displacement Y must clamp to -maxDisplacementY');
  assert.strictEqual(state.zoom, 1.1, 'Zoom must clamp to maxZoom');
});

test('Parallax: calculates multi-plane depth offsets relative to focal depth', () => {
  const camera = { x: 50, y: 20, zoom: 1.1, focalDepth: 1.0 };

  // Midground at focal plane (depth 1.0) moves 1:1
  const midground = computeParallax(camera, 1.0);
  assert.strictEqual(midground.offsetX, -50);
  assert.strictEqual(midground.offsetY, -20);
  assert.ok(Math.abs(midground.scale - 1.1) < 1e-6);

  // Background sky (depth 0.2) moves 5x slower
  const background = computeParallax(camera, 0.2);
  assert.strictEqual(background.offsetX, -10); // -50 * 0.2
  assert.strictEqual(background.offsetY, -4);  // -20 * 0.2
  assert.ok(Math.abs(background.scale - 1.02) < 1e-6); // 1.0 + 0.1 * 0.2

  // Foreground foliage (depth 1.5) moves 1.5x faster
  const foreground = computeParallax(camera, 1.5);
  assert.strictEqual(foreground.offsetX, -75); // -50 * 1.5
  assert.strictEqual(foreground.offsetY, -30); // -20 * 1.5
  assert.ok(Math.abs(foreground.scale - 1.15) < 1e-6); // 1.0 + 0.1 * 1.5
});

test('AnimationPrimitives: computeBreathing oscillates smoothly and deterministically', () => {
  const fps = 30;
  const options = { frequency: 0.5, amplitude: 4, scaleYAmount: 0.01 };

  const breath0 = computeBreathing(0, fps, options);
  const breath15 = computeBreathing(15, fps, options); // peak
  const breath30 = computeBreathing(30, fps, options); // center
  const breath45 = computeBreathing(45, fps, options); // trough

  // Frame 0: sin(0) = 0
  assert.strictEqual(breath0.offsetY, 0);
  assert.strictEqual(breath0.scaleY, 1.0);

  // Frame 15 (quarter cycle): sin(pi/2) = 1
  assert.ok(Math.abs(breath15.offsetY - 4) < 1e-5);
  assert.ok(Math.abs(breath15.scaleY - 1.01) < 1e-5);

  // Frame 30 (half cycle): sin(pi) ~ 0
  assert.ok(Math.abs(breath30.offsetY) < 1e-5);
  assert.ok(Math.abs(breath30.scaleY - 1.0) < 1e-5);

  // Frame 45 (three-quarter cycle): sin(3pi/2) = -1
  assert.ok(Math.abs(breath45.offsetY - (-4)) < 1e-5);
  assert.ok(Math.abs(breath45.scaleY - 0.99) < 1e-5);

  // Disabled check
  const disabled = computeBreathing(15, fps, { enabled: false });
  assert.strictEqual(disabled.offsetY, 0);
  assert.strictEqual(disabled.scaleY, 1.0);
});

test('AnimationPrimitives: computeHeadTilt oscillates within angle limits', () => {
  const fps = 30;
  const maxAngle = 2.5;

  for (let frame = 0; frame <= 120; frame += 10) {
    const angle = computeHeadTilt(frame, fps, { maxAngle, frequency: 0.4 });
    assert.ok(angle >= -maxAngle && angle <= maxAngle, `Angle ${angle} exceeded range [-${maxAngle}, +${maxAngle}]`);
  }

  const disabled = computeHeadTilt(30, fps, { enabled: false });
  assert.strictEqual(disabled, 0);
});

test('AnimationPrimitives: resolveExpressionSchedule switches expressions at keyframes', () => {
  const schedule = [
    { startFrame: 0, eyes: 'eyes-neutral', mouth: 'mouth-closed' },
    { startFrame: 40, eyes: 'eyes-wink', mouth: 'mouth-smile' },
    { startFrame: 80, eyes: 'eyes-wide' }, // leaves mouth unchanged
  ];

  // At frame 0
  const exp0 = resolveExpressionSchedule(0, schedule);
  assert.strictEqual(exp0.eyes, 'eyes-neutral');
  assert.strictEqual(exp0.mouth, 'mouth-closed');

  // At frame 39 (right before switch)
  const exp39 = resolveExpressionSchedule(39, schedule);
  assert.strictEqual(exp39.eyes, 'eyes-neutral');
  assert.strictEqual(exp39.mouth, 'mouth-closed');

  // At frame 40 (switch)
  const exp40 = resolveExpressionSchedule(40, schedule);
  assert.strictEqual(exp40.eyes, 'eyes-wink');
  assert.strictEqual(exp40.mouth, 'mouth-smile');

  // At frame 80 (eyes switch, mouth retained from previous keyframe)
  const exp80 = resolveExpressionSchedule(80, schedule);
  assert.strictEqual(exp80.eyes, 'eyes-wide');
  assert.strictEqual(exp80.mouth, 'mouth-smile');
});
