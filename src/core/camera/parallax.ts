import { CameraState } from './types';

export interface ParallaxResult {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * Calculates 2.5D parallax screen displacement for a given depth plane.
 * - depth < focalDepth: background moves slower than camera
 * - depth = focalDepth: midground moves 1:1 with camera
 * - depth > focalDepth: foreground moves faster than camera
 */
export function computeParallax(
  camera: CameraState,
  depth: number
): ParallaxResult {
  const focalDepth = Math.max(camera.focalDepth, 0.01);
  const depthRatio = depth / focalDepth;

  const offsetX = -camera.x * depthRatio;
  const offsetY = -camera.y * depthRatio;
  const scale = 1.0 + (camera.zoom - 1.0) * depthRatio;

  return {
    offsetX,
    offsetY,
    scale,
  };
}
