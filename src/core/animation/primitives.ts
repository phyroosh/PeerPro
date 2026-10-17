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

// ============================================================================
// Easing Functions (Pure mathematical, frame-deterministic, t in [0, 1])
// ============================================================================

export function easeInQuad(t: number): number {
  const ct = clamp(t, 0, 1);
  return ct * ct;
}

export function easeOutQuad(t: number): number {
  const ct = clamp(t, 0, 1);
  return ct * (2 - ct);
}

export function easeInOutQuad(t: number): number {
  const ct = clamp(t, 0, 1);
  return ct < 0.5 ? 2 * ct * ct : -1 + (4 - 2 * ct) * ct;
}

export function easeInCubic(t: number): number {
  const ct = clamp(t, 0, 1);
  return ct * ct * ct;
}

export function easeOutCubic(t: number): number {
  const ct = clamp(t, 0, 1);
  const t1 = ct - 1;
  return t1 * t1 * t1 + 1;
}

export function easeInOutCubic(t: number): number {
  const ct = clamp(t, 0, 1);
  return ct < 0.5 ? 4 * ct * ct * ct : (ct - 1) * (2 * ct - 2) * (2 * ct - 2) + 1;
}

export function easeOutBack(t: number, overshoot = 1.70158): number {
  const ct = clamp(t, 0, 1);
  if (ct === 0) return 0;
  if (ct === 1) return 1;
  const t1 = ct - 1;
  return t1 * t1 * ((overshoot + 1) * t1 + overshoot) + 1;
}

export function easeInOutSine(t: number): number {
  const ct = clamp(t, 0, 1);
  return -(Math.cos(Math.PI * ct) - 1) / 2;
}

/**
 * Interpolates between a and b applying specified easing curve to t in [0, 1].
 */
export function interpolateWithEasing(
  a: number,
  b: number,
  t: number,
  easing: import('./types').EasingType = 'linear'
): number {
  let factor = clamp(t, 0, 1);

  switch (easing) {
    case 'ease-in':
    case 'ease-in-quad':
      factor = easeInQuad(factor);
      break;
    case 'ease-out':
    case 'ease-out-quad':
      factor = easeOutQuad(factor);
      break;
    case 'ease-in-out':
    case 'ease-in-out-quad':
      factor = easeInOutQuad(factor);
      break;
    case 'ease-in-cubic':
      factor = easeInCubic(factor);
      break;
    case 'ease-out-cubic':
      factor = easeOutCubic(factor);
      break;
    case 'ease-in-out-cubic':
      factor = easeInOutCubic(factor);
      break;
    case 'ease-out-back':
      factor = easeOutBack(factor);
      break;
    case 'ease-in-out-sine':
      factor = easeInOutSine(factor);
      break;
    case 'linear':
    default:
      // Linear factor unchanged
      break;
  }

  return lerp(a, b, factor);
}

/**
 * Computes deterministic secondary motion lag (e.g. hair bounce or fabric drag)
 * given a driving oscillation or motion velocity.
 */
export function computeSecondaryLag(
  frame: number,
  fps: number,
  frequency: number,
  amplitude: number,
  phaseLag = Math.PI / 4
): number {
  const time = frame / fps;
  return Math.sin(time * Math.PI * 2 * frequency - phaseLag) * amplitude;
}
