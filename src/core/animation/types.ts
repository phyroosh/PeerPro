import { CharacterPoseName, CharacterJointRotations } from '../characters/types';

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-out-back'
  | 'ease-in-out-sine';

export interface KeyframePoint<T = number> {
  frame: number;
  value: T;
  easing?: EasingType;
}

export interface BreathingOptions {
  frequency?: number; // cycles per second, default: 0.5 (2 seconds per breath)
  amplitude?: number; // vertical pixel bob, default: 3
  scaleYAmount?: number; // chest expansion scale, default: 0.008
  enabled?: boolean;
}

export interface HeadAngleOptions {
  frequency?: number; // default: 0.3
  maxAngle?: number; // default: 2.5 degrees
  enabled?: boolean;
}

export interface ExpressionKeyframe {
  startFrame: number;
  eyes?: string;
  mouth?: string;
}

export interface MotionBounds {
  min: number;
  max: number;
}

export type CharacterActionName =
  | 'idle'
  | 'bow'
  | 'wave'
  | 'talk'
  | 'point'
  | 'nod'
  | 'shake_head'
  | 'shrug'
  | 'think'
  | 'surprise'
  | 'walk_cycle';

export interface ActionClipOptions {
  nodCount?: number;
  bowAngle?: number;
  waveFrequency?: number;
  pointDirection?: 'high' | 'mid' | 'low';
  shrugHeight?: number;
  walkCadence?: number;
  intensity?: number;
  [key: string]: unknown;
}

export interface CharacterActionClip {
  id?: string;
  action: CharacterActionName;
  startFrame: number;
  durationInFrames: number;
  blendInFrames?: number; // default: 8
  blendOutFrames?: number; // default: 8
  intensity?: number; // default: 1.0
  speed?: number; // default: 1.0
  options?: ActionClipOptions;
}

export interface EvaluatedCharacterActionState {
  pose: CharacterPoseName;
  jointRotations: CharacterJointRotations;
  rootOffset: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  partOverrides: Record<string, string>;
  expressionCue?: {
    eyes?: string;
    mouth?: string;
  };
  activeActionName: CharacterActionName;
  actionProgress: number;
  blendWeight: number;
}
