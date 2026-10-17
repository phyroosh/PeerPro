import { clamp, lerp } from '../animation/primitives';
import { CameraBounds, CameraConfig, CameraState } from './types';
import { computeDepthOfField, computeAtmosphericHaze, computeCameraDrift } from './dof';

export const DEFAULT_CAMERA_BOUNDS: CameraBounds = {
  maxDisplacementX: 150,
  maxDisplacementY: 80,
  minZoom: 0.9,
  maxZoom: 1.25,
};

/**
 * Calculates camera state deterministically as a pure function of frame and config.
 */
export function computeCameraState(
  frame: number,
  duration: number,
  config: CameraConfig
): CameraState {
  const focalDepth = config.focalDepth ?? 1.0;
  const intensity = config.intensity ?? 1.0;

  const bounds: CameraBounds = {
    ...DEFAULT_CAMERA_BOUNDS,
    ...config.bounds,
  };

  // DoF and atmospheric haze closures
  let dofBlur: ((depth: number) => number) | undefined;
  if (config.depthOfField?.enabled) {
    const dofAperture = config.depthOfField.aperture ?? 1.0;
    const dofFocal = config.depthOfField.focalDepth ?? focalDepth;
    const dofMax = config.depthOfField.maxBlur ?? 8.0;
    dofBlur = (depth: number) => computeDepthOfField(depth, dofFocal, dofAperture, dofMax);
  }

  let hazeOpacity: ((depth: number) => number) | undefined;
  let hazeColor: string | undefined;
  if (config.atmosphericHaze?.enabled) {
    const minD = config.atmosphericHaze.minDepth ?? 0.6;
    const dens = config.atmosphericHaze.density ?? 0.35;
    hazeColor = config.atmosphericHaze.color ?? '#bae6fd';
    hazeOpacity = (depth: number) => computeAtmosphericHaze(depth, minD, dens);
  }

  // Camera drift
  const drift = computeCameraDrift(frame, 30, intensity > 0 ? config.shake : undefined);

  // If intensity is 0 or preset is static (and no shake), return unshifted state
  if (intensity <= 0 || (config.preset === 'static' && (!config.shake || !config.shake.enabled))) {
    const res: CameraState = { x: 0, y: 0, zoom: 1.0, focalDepth };
    if (dofBlur) res.dofBlur = dofBlur;
    if (hazeOpacity) res.hazeOpacity = hazeOpacity;
    if (hazeColor) res.hazeColor = hazeColor;
    return res;
  }

  const safeDuration = Math.max(duration - 1, 1);
  const t = clamp(frame / safeDuration, 0, 1);
  // Smooth cubic ease (smoothstep)
  const smoothT = t * t * (3 - 2 * t);

  let rawX = 0;
  let rawY = 0;
  let rawZoom = 1.0;
  let rawRoll = 0;

  switch (config.preset) {
    case 'slow-push-in':
      rawZoom = 1.0 + 0.12 * intensity * smoothT;
      break;

    case 'slow-pull-out':
      rawZoom = 1.0 + 0.12 * intensity * (1 - smoothT);
      break;

    case 'pan-left-to-right':
      rawX = lerp(-80 * intensity, 80 * intensity, smoothT);
      rawZoom = 1.0 + 0.03 * intensity * Math.sin(smoothT * Math.PI);
      break;

    case 'pan-right-to-left':
      rawX = lerp(80 * intensity, -80 * intensity, smoothT);
      rawZoom = 1.0 + 0.03 * intensity * Math.sin(smoothT * Math.PI);
      break;

    case 'tilt-up':
      rawY = lerp(40 * intensity, -40 * intensity, smoothT);
      break;

    case 'tilt-down':
      rawY = lerp(-40 * intensity, 40 * intensity, smoothT);
      break;

    case 'tracking':
      rawX = lerp(-60 * intensity, 60 * intensity, smoothT);
      rawY = Math.sin(smoothT * Math.PI * 2) * (8 * intensity);
      rawZoom = 1.0 + 0.05 * intensity * Math.sin(smoothT * Math.PI);
      break;

    case 'custom':
      if (config.customMove) {
        const custom = config.customMove(frame, duration);
        rawX = custom.x;
        rawY = custom.y;
        rawZoom = custom.zoom;
        if (custom.roll !== undefined) rawRoll = custom.roll;
      }
      break;
  }

  // Add handheld / organic drift
  rawX += drift.driftX * intensity;
  rawY += drift.driftY * intensity;
  rawRoll += drift.driftRoll * intensity;

  // Enforce strict boundary safety limits to avoid canvas edge clipping
  const x = clamp(rawX, -bounds.maxDisplacementX, bounds.maxDisplacementX);
  const y = clamp(rawY, -bounds.maxDisplacementY, bounds.maxDisplacementY);
  const zoom = clamp(rawZoom, bounds.minZoom, bounds.maxZoom);

  const res: CameraState = {
    x,
    y,
    zoom,
    focalDepth,
  };

  if (rawRoll !== 0) res.roll = rawRoll;
  if (dofBlur) res.dofBlur = dofBlur;
  if (hazeOpacity) res.hazeOpacity = hazeOpacity;
  if (hazeColor) res.hazeColor = hazeColor;

  return res;
}
