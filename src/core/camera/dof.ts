import { clamp } from '../animation/primitives';
import { CameraShakeConfig } from './types';

/**
 * Computes optical circle-of-confusion Gaussian blur radius in pixels.
 *
 * @param depth Layer depth factor (< 1.0 background, 1.0 focal/midground, > 1.0 foreground)
 * @param focalDepth Target focal depth plane (default: 1.0)
 * @param aperture Lens aperture multiplier (default: 1.0, higher = shallower DoF)
 * @param maxBlur Maximum blur radius ceiling in pixels (default: 8.0)
 */
export function computeDepthOfField(
  depth: number,
  focalDepth = 1.0,
  aperture = 1.0,
  maxBlur = 8.0
): number {
  if (aperture <= 0 || maxBlur <= 0) return 0;

  const delta = Math.abs(depth - focalDepth);
  // Within tight focal threshold, maintain optical sharpness
  if (delta < 0.04) return 0;

  const rawBlur = (delta - 0.04) * aperture * 10.0;
  return clamp(rawBlur, 0, maxBlur);
}

/**
 * Computes atmospheric sky haze opacity for distant background layers.
 * Farther background layers take on ambient sky tone due to aerial perspective.
 *
 * @param depth Layer depth factor
 * @param minDepth Depth threshold below which haze begins (default: 0.6)
 * @param density Maximum haze opacity at horizon/far-distance (default: 0.35)
 */
export function computeAtmosphericHaze(
  depth: number,
  minDepth = 0.6,
  density = 0.35
): number {
  if (depth >= minDepth || density <= 0) return 0;

  const safeMin = Math.max(minDepth, 0.01);
  const normalizedDistance = clamp((safeMin - depth) / safeMin, 0, 1.0);
  // Smooth non-linear aerial extinction curve
  return normalizedDistance * normalizedDistance * clamp(density, 0, 1.0);
}

/**
 * Computes organic camera micro-drift / handheld breathing as a deterministic multi-octave harmonic.
 */
export function computeCameraDrift(
  frame: number,
  fps: number,
  config?: CameraShakeConfig
): { driftX: number; driftY: number; driftRoll: number } {
  if (!config || !config.enabled) {
    return { driftX: 0, driftY: 0, driftRoll: 0 };
  }

  const freq = config.frequency ?? 0.4; // Hz
  const ampX = config.amplitudeX ?? 2.5; // px
  const ampY = config.amplitudeY ?? 1.8; // px
  const ampRot = config.rotational ?? 0.25; // deg

  const t = frame / fps;

  // 2-octave harmonic synthesis for organic non-repetitive micro-drift
  const driftX =
    Math.sin(t * Math.PI * 2 * freq) * ampX +
    Math.sin(t * Math.PI * 2 * (freq * 1.7) + 0.8) * (ampX * 0.4);

  const driftY =
    Math.cos(t * Math.PI * 2 * (freq * 1.3) + 1.2) * ampY +
    Math.sin(t * Math.PI * 2 * (freq * 2.1) + 2.4) * (ampY * 0.35);

  const driftRoll =
    Math.sin(t * Math.PI * 2 * (freq * 0.85) + 3.1) * ampRot;

  return { driftX, driftY, driftRoll };
}
