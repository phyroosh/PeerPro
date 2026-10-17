import { clamp } from '../animation/primitives';
import { SequenceShot, ActiveShotResolution } from './types';

/**
 * Deterministically resolves the active shot, local shot frame, and transition progress
 * for a sequence at a given absolute frame.
 */
export function resolveActiveShot(
  frame: number,
  shots: SequenceShot[]
): ActiveShotResolution {
  if (shots.length === 0) {
    throw new Error('Cannot resolve active shot from empty shots array.');
  }

  let totalDurationInFrames = 0;
  for (const s of shots) {
    totalDurationInFrames += s.durationInFrames;
  }

  const clampedFrame = clamp(frame, 0, Math.max(totalDurationInFrames - 1, 0));

  let accumulated = 0;
  let activeIndex = 0;
  let localFrame = 0;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const shotEnd = accumulated + shot.durationInFrames;

    if (clampedFrame < shotEnd || i === shots.length - 1) {
      activeIndex = i;
      localFrame = clampedFrame - accumulated;
      break;
    }

    accumulated = shotEnd;
  }

  const activeShot = shots[activeIndex];
  const previousShot = activeIndex > 0 ? shots[activeIndex - 1] : undefined;

  let transitionResult: ActiveShotResolution['transition'];

  if (activeShot.transition && activeIndex > 0) {
    const transDur = Math.max(activeShot.transition.durationInFrames, 1);
    if (localFrame < transDur) {
      const p = clamp(localFrame / transDur, 0, 1.0);
      let overlayOpacity = 0;

      if (activeShot.transition.type === 'fade_to_black' || activeShot.transition.type === 'dip_to_white') {
        // Dip peaks at 50% transition progress
        overlayOpacity = p < 0.5 ? 1.0 - (p / 0.5) : (p - 0.5) / 0.5;
        // Invert so at peak p=0.5, overlayOpacity is 1.0
        overlayOpacity = p < 0.5 ? p * 2.0 : (1.0 - p) * 2.0;
      }

      transitionResult = {
        type: activeShot.transition.type,
        progress: p,
        overlayOpacity,
      };
    }
  }

  return {
    shotIndex: activeIndex,
    shot: activeShot,
    localFrame,
    totalDurationInFrames,
    previousShot,
    transition: transitionResult,
  };
}
