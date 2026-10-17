import { CharacterPoseName, CharacterJointRotations } from './types';

export interface PoseResolution {
  overrides: Record<string, string>;
  baseJointRotations: CharacterJointRotations;
  description: string;
}

/**
 * Maps high-level declarative character poses to slot overrides and base joint angles.
 */
export function resolveCharacterPose(
  pose: CharacterPoseName = 'idle',
  styleFamily = 'anime-clean-v1'
): PoseResolution {
  switch (pose) {
    case 'wave':
      return {
        overrides: {
          armsLeft: 'starter-char-arm-01-left-idle',
          armsRight: 'starter-char-arm-01-right-wave',
        },
        baseJointRotations: {
          armLeft: 0,
          armRight: 0,
          headTilt: -1.2,
        },
        description: 'Friendly greeting with raised waving right forearm',
      };

    case 'point':
      return {
        overrides: {
          armsLeft: 'starter-char-arm-01-left-idle',
          armsRight: 'starter-char-arm-01-right-point',
        },
        baseJointRotations: {
          armLeft: 0,
          armRight: 0,
          headTilt: 1.5,
        },
        description: 'Directive forward/upward pointing gesture',
      };

    case 'talk_gesture':
      return {
        overrides: {
          armsLeft: 'starter-char-arm-01-left-bent-talk',
          armsRight: 'starter-char-arm-01-right-idle',
        },
        baseJointRotations: {
          armLeft: 0,
          armRight: 0,
          headTilt: 0.8,
        },
        description: 'Conversational gesturing with hand near lapel',
      };

    case 'thinking':
      return {
        overrides: {
          armsLeft: 'starter-char-arm-01-left-bent-talk',
          armsRight: 'starter-char-arm-01-right-idle',
        },
        baseJointRotations: {
          armLeft: -4,
          armRight: 0,
          headTilt: -2.2,
        },
        description: 'Reflective chin-touching contemplative posture',
      };

    case 'crossed':
    case 'idle':
    default:
      return {
        overrides: {
          armsLeft: 'starter-char-arm-01-left-idle',
          armsRight: 'starter-char-arm-01-right-idle',
        },
        baseJointRotations: {
          armLeft: 0,
          armRight: 0,
          headTilt: 0,
        },
        description: 'Natural resting posture with arms at sides',
      };
  }
}

export interface WaveOptions {
  frequency?: number; // cycles per second (Hz)
  amplitude?: number; // peak rotation angle in degrees
  phaseOffset?: number; // radians offset
}

/**
 * Computes a frame-deterministic sinusoidal arm waving oscillation angle in degrees.
 */
export function computeArmWave(
  frame: number,
  fps: number,
  options: WaveOptions = {}
): number {
  const { frequency = 2.0, amplitude = 14.0, phaseOffset = 0 } = options;
  const timeSec = frame / fps;
  return Math.sin(2 * Math.PI * frequency * timeSec + phaseOffset) * amplitude;
}
