import { SceneAudioTrack, TrackVolumeState } from './types';
import { SceneDialogLine } from '../scene/types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Pure mathematical function computing the exact volume multiplier (0.0 to 1.0)
 * for an audio track at any given timeline frame, accounting for fade-ins, fade-outs, and audio ducking.
 */
export function computeTrackVolume(
  frame: number,
  track: SceneAudioTrack,
  dialogLines: SceneDialogLine[] = []
): number {
  const baseVolume = clamp(track.volume ?? 1.0, 0, 1.0);
  const startFrame = track.startFrame;

  // Inactive before start frame
  if (frame < startFrame) {
    return 0.0;
  }

  // Inactive after duration if duration is defined
  if (track.durationInFrames !== undefined) {
    const endFrame = startFrame + track.durationInFrames;
    if (frame >= endFrame) {
      return 0.0;
    }
  }

  let volume = baseVolume;

  // 1. Fade-in Ramp
  const fadeInFrames = track.fadeInFrames ?? 0;
  if (fadeInFrames > 0 && frame < startFrame + fadeInFrames) {
    const progress = (frame - startFrame) / fadeInFrames;
    volume *= clamp(progress, 0, 1.0);
  }

  // 2. Fade-out Ramp
  const fadeOutFrames = track.fadeOutFrames ?? 0;
  if (fadeOutFrames > 0 && track.durationInFrames !== undefined) {
    const endFrame = startFrame + track.durationInFrames;
    if (frame >= endFrame - fadeOutFrames) {
      const remaining = endFrame - frame;
      const progress = remaining / fadeOutFrames;
      volume *= clamp(progress, 0, 1.0);
    }
  }

  // 3. Audio Ducking under Dialogue
  const shouldDuck = track.duckUnderDialog ?? (track.type === 'bgm' || track.type === 'ambient');
  if (shouldDuck && dialogLines.length > 0) {
    const duckFactor = clamp(track.duckFactor ?? 0.35, 0, 1.0);
    const rampFrames = 6; // smooth duck transition

    // Check minimum distance to any active dialogue line
    let isSpeaking = false;
    let minDistanceToSpeech = Infinity;

    for (const dialog of dialogLines) {
      if (frame >= dialog.startFrame && frame <= dialog.endFrame) {
        isSpeaking = true;
        break;
      }

      if (frame < dialog.startFrame) {
        minDistanceToSpeech = Math.min(minDistanceToSpeech, dialog.startFrame - frame);
      } else if (frame > dialog.endFrame) {
        minDistanceToSpeech = Math.min(minDistanceToSpeech, frame - dialog.endFrame);
      }
    }

    if (isSpeaking) {
      volume *= duckFactor;
    } else if (minDistanceToSpeech < rampFrames) {
      // Smooth linear transition between full volume and ducked volume
      const t = minDistanceToSpeech / rampFrames;
      const currentDuck = duckFactor + (1.0 - duckFactor) * t;
      volume *= currentDuck;
    }
  }

  return Number(clamp(volume, 0, 1.0).toFixed(4));
}

/**
 * Evaluates volume states across all tracks in a scene for telemetry and mixing.
 */
export function evaluateAllTrackVolumes(
  frame: number,
  tracks: SceneAudioTrack[] = [],
  dialogLines: SceneDialogLine[] = []
): TrackVolumeState[] {
  return tracks.map((track) => {
    const volume = computeTrackVolume(frame, track, dialogLines);
    const start = track.startFrame;
    const end = track.durationInFrames ? start + track.durationInFrames : Infinity;
    const isActive = frame >= start && frame < end;
    const base = track.volume ?? 1.0;
    const isDucked = isActive && volume < base * 0.8 && dialogLines.some((d) => frame >= d.startFrame && frame <= d.endFrame);

    return {
      trackId: track.id,
      type: track.type,
      volume,
      isDucked,
      isActive,
    };
  });
}
