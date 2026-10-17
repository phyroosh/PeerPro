export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';

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
