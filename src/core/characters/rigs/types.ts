/**
 * Character Performance System — Type Contracts
 * Defines formal rig profiles, joint limits, animation clips, and compatibility diagnostic reporting.
 */

export type RigProfile =
  | 'face_only'
  | 'upper_body_cutout'
  | 'full_body_cutout'
  | 'pose_swapped';

export type RigCapability =
  | 'gaze_direction'
  | 'micro_blink'
  | 'head_tilt'
  | 'speech_visemes'
  | 'expression_variant'
  | 'breathing'
  | 'arm_rotation'
  | 'arm_gesture'
  | 'leg_stride'
  | 'walk_cycle'
  | 'pose_swap'
  | 'root_motion';

export interface JointLimit {
  min: number;
  max: number;
  rest: number;
  unit: 'degrees' | 'pixels';
}

export interface RigProfileDefinition {
  profile: RigProfile;
  name: string;
  description: string;
  requiredSlots: string[];
  optionalSlots?: string[];
  supportedJoints: string[];
  jointLimits: Record<string, JointLimit>;
  capabilities: RigCapability[];
}

export type JointCurveFunction = (progress: number, intensity: number) => number;

export interface AnimationClip {
  id: string;
  name: string;
  description: string;
  supportedRigProfiles: RigProfile[];
  requiredCapabilities?: RigCapability[];
  durationInFrames: number;
  loop?: boolean;
  jointCurves?: Record<string, JointCurveFunction>;
  partOverrides?: Record<string, string>;
  expressionCue?: {
    eyes?: string;
    mouth?: string;
  };
  rootMotion?: {
    x?: (progress: number, intensity: number) => number;
    y?: (progress: number, intensity: number) => number;
    scaleX?: (progress: number, intensity: number) => number;
    scaleY?: (progress: number, intensity: number) => number;
    rotation?: (progress: number, intensity: number) => number;
  };
  poseName?: string;
}

export interface EvaluatedJointClamping {
  raw: number;
  clamped: number;
  min: number;
  max: number;
}

export interface EvaluatedPerformanceState {
  jointRotations: Record<string, number>;
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
  pose?: string;
  activeClipId: string;
  clipProgress: number;
  isClamped: boolean;
  clampedJoints: Record<string, EvaluatedJointClamping>;
}

export interface ActivePerformanceClip {
  clip: AnimationClip;
  startFrame: number;
  durationInFrames?: number;
  blendInFrames?: number;
  blendOutFrames?: number;
  intensity?: number;
  loop?: boolean;
}

export interface RigCompatibilityReport {
  compatible: boolean;
  characterId: string;
  rigProfile: RigProfile;
  clipId: string;
  missingSlots: string[];
  missingCapabilities: string[];
  unsupportedMovements: string[];
  warnings: string[];
  errors: string[];
}
