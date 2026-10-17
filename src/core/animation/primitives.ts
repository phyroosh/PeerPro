import {
  BreathingOptions,
  ExpressionKeyframe,
  HeadAngleOptions,
} from './types';

/**
 * Clamps a numeric value within [min, max].
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Linear interpolation between a and b by factor t.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Deterministic harmonic oscillation (sine wave) as a pure function of frame & fps.
 */
export function computeOscillation(
  frame: number,
  fps: number,
  frequency: number,
  amplitude: number,
  phase = 0
): number {
  const time = frame / fps;
  return Math.sin(time * Math.PI * 2 * frequency + phase) * amplitude;
}

/**
 * Calculates subtle character breathing motion.
 * Returns vertical bobbing offset and vertical scale expansion.
 */
export function computeBreathing(
  frame: number,
  fps: number,
  options: BreathingOptions = {}
): { offsetY: number; scaleY: number } {
  if (options.enabled === false) {
    return { offsetY: 0, scaleY: 1.0 };
  }

  const freq = options.frequency ?? 0.5; // 2 seconds per breath
  const amp = options.amplitude ?? 3;
  const scaleAmount = options.scaleYAmount ?? 0.008;

  const sinVal = Math.sin((frame / fps) * Math.PI * 2 * freq);
  const offsetY = sinVal * amp;
  const scaleY = 1.0 + sinVal * scaleAmount;

  return { offsetY, scaleY };
}

/**
 * Calculates subtle character head tilt.
 */
export function computeHeadTilt(
  frame: number,
  fps: number,
  options: HeadAngleOptions = {}
): number {
  if (options.enabled === false) {
    return 0;
  }

  const freq = options.frequency ?? 0.3;
  const maxAngle = options.maxAngle ?? 2.5;

  return Math.sin((frame / fps) * Math.PI * 2 * freq + 0.5) * maxAngle;
}

/**
 * Resolves expression overrides from a timeline schedule based on current frame.
 */
export function resolveExpressionSchedule(
  frame: number,
  schedule: ExpressionKeyframe[]
): { eyes?: string; mouth?: string } {
  let activeEyes: string | undefined;
  let activeMouth: string | undefined;

  const sorted = [...schedule].sort((a, b) => a.startFrame - b.startFrame);
  for (const item of sorted) {
    if (frame >= item.startFrame) {
      if (item.eyes !== undefined) activeEyes = item.eyes;
      if (item.mouth !== undefined) activeMouth = item.mouth;
    }
  }

  return { eyes: activeEyes, mouth: activeMouth };
}
