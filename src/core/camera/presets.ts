import { clamp, lerp } from '../animation/primitives';
import { CameraBounds, CameraConfig, CameraState } from './types';

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

  // If intensity is 0 or preset is static, return unshifted state
  if (intensity <= 0 || config.preset === 'static') {
    return { x: 0, y: 0, zoom: 1.0, focalDepth };
  }

  const safeDuration = Math.max(duration - 1, 1);
  const t = clamp(frame / safeDuration, 0, 1);
  // Smooth cubic ease (smoothstep)
  const smoothT = t * t * (3 - 2 * t);

  let rawX = 0;
  let rawY = 0;
  let rawZoom = 1.0;

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
      }
      break;
  }

  // Enforce strict boundary safety limits to avoid canvas edge clipping
  const x = clamp(rawX, -bounds.maxDisplacementX, bounds.maxDisplacementX);
  const y = clamp(rawY, -bounds.maxDisplacementY, bounds.maxDisplacementY);
  const zoom = clamp(rawZoom, bounds.minZoom, bounds.maxZoom);

  return { x, y, zoom, focalDepth };
}
