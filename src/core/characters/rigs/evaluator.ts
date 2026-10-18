import {
  ActivePerformanceClip,
  EvaluatedJointClamping,
  EvaluatedPerformanceState,
  JointLimit,
  RigProfile,
} from './types';
import { getRigProfileDefinition } from './profiles';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

export interface EvaluatorOptions {
  customJointLimits?: Record<string, JointLimit>;
}

/**
 * Evaluates performance clips deterministically at the specified frame,
 * applying joint limit constraints and multi-clip blending.
 */
export function evaluatePerformanceClips(
  rigProfile: RigProfile,
  frame: number,
  activeClips: ActivePerformanceClip[],
  options: EvaluatorOptions = {}
): EvaluatedPerformanceState {
  const rigDef = getRigProfileDefinition(rigProfile);
  const effectiveLimits = {
    ...rigDef.jointLimits,
    ...options.customJointLimits,
  };

  // If no clips provided, return rest state
  if (!activeClips || activeClips.length === 0) {
    const restingJoints: Record<string, number> = {};
    for (const joint of rigDef.supportedJoints) {
      restingJoints[joint] = effectiveLimits[joint]?.rest ?? 0;
    }

    return {
      jointRotations: restingJoints,
      rootOffset: { x: 0, y: 0, rotation: 0, scaleX: 1.0, scaleY: 1.0 },
      partOverrides: {},
      activeClipId: 'none',
      clipProgress: 0,
      isClamped: false,
      clampedJoints: {},
    };
  }

  // 1. Collect currently active clips and evaluate raw progress & weights
  interface EvaluatedClipInstance {
    clipInstance: ActivePerformanceClip;
    progress: number;
    weight: number;
    rawJoints: Record<string, number>;
    rootMotion: { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
    partOverrides: Record<string, string>;
    expressionCue?: { eyes?: string; mouth?: string };
    poseName?: string;
  }

  const liveInstances: EvaluatedClipInstance[] = [];

  for (const item of activeClips) {
    const duration = item.durationInFrames ?? item.clip.durationInFrames;
    const isLooping = item.loop ?? item.clip.loop ?? false;
    const blendIn = Math.max(0, item.blendInFrames ?? 0);
    const blendOut = Math.max(0, item.blendOutFrames ?? 0);
    const intensity = item.intensity ?? 1.0;

    let localFrame = frame - item.startFrame;
    if (localFrame < 0) {
      continue;
    }

    if (!isLooping && localFrame >= duration) {
      continue;
    }

    if (isLooping) {
      localFrame = localFrame % duration;
    }

    const progress = clamp(localFrame / Math.max(1, duration), 0, 1);

    // Compute blend weight based on in/out frames
    let weight = 1.0;
    if (blendIn > 0 && localFrame < blendIn) {
      weight = smoothstep(localFrame / blendIn);
    } else if (blendOut > 0 && !isLooping && localFrame > duration - blendOut) {
      const remaining = duration - localFrame;
      weight = smoothstep(remaining / blendOut);
    }
    weight *= intensity;

    if (weight <= 0.0001) {
      continue;
    }

    // Evaluate curves
    const rawJoints: Record<string, number> = {};
    if (item.clip.jointCurves) {
      for (const [joint, curveFn] of Object.entries(item.clip.jointCurves)) {
        rawJoints[joint] = curveFn(progress, intensity);
      }
    }

    const rootMotion = {
      x: item.clip.rootMotion?.x ? item.clip.rootMotion.x(progress, intensity) : 0,
      y: item.clip.rootMotion?.y ? item.clip.rootMotion.y(progress, intensity) : 0,
      rotation: item.clip.rootMotion?.rotation ? item.clip.rootMotion.rotation(progress, intensity) : 0,
      scaleX: item.clip.rootMotion?.scaleX ? item.clip.rootMotion.scaleX(progress, intensity) : 1.0,
      scaleY: item.clip.rootMotion?.scaleY ? item.clip.rootMotion.scaleY(progress, intensity) : 1.0,
    };

    liveInstances.push({
      clipInstance: item,
      progress,
      weight,
      rawJoints,
      rootMotion,
      partOverrides: item.clip.partOverrides || {},
      expressionCue: item.clip.expressionCue,
      poseName: item.clip.poseName,
    });
  }

  if (liveInstances.length === 0) {
    const restingJoints: Record<string, number> = {};
    for (const joint of rigDef.supportedJoints) {
      restingJoints[joint] = effectiveLimits[joint]?.rest ?? 0;
    }
    return {
      jointRotations: restingJoints,
      rootOffset: { x: 0, y: 0, rotation: 0, scaleX: 1.0, scaleY: 1.0 },
      partOverrides: {},
      activeClipId: 'idle',
      clipProgress: 0,
      isClamped: false,
      clampedJoints: {},
    };
  }

  // 2. Multi-clip normalization & blending
  let totalWeight = 0;
  for (const inst of liveInstances) {
    totalWeight += inst.weight;
  }
  const normDivisor = Math.max(1.0, totalWeight);

  const blendedJoints: Record<string, number> = {};
  for (const joint of rigDef.supportedJoints) {
    blendedJoints[joint] = 0;
  }

  let blendedRootX = 0;
  let blendedRootY = 0;
  let blendedRot = 0;
  let blendedScaleX = 0;
  let blendedScaleY = 0;

  let dominantInstance = liveInstances[0];
  let maxWeight = -1;

  for (const inst of liveInstances) {
    const normW = inst.weight / normDivisor;

    for (const [joint, val] of Object.entries(inst.rawJoints)) {
      blendedJoints[joint] = (blendedJoints[joint] || 0) + val * normW;
    }

    blendedRootX += inst.rootMotion.x * normW;
    blendedRootY += inst.rootMotion.y * normW;
    blendedRot += inst.rootMotion.rotation * normW;
    blendedScaleX += inst.rootMotion.scaleX * normW;
    blendedScaleY += inst.rootMotion.scaleY * normW;

    if (inst.weight > maxWeight) {
      maxWeight = inst.weight;
      dominantInstance = inst;
    }
  }

  // Fill in any remainder with resting joint values if total weight < 1.0
  if (totalWeight < 1.0) {
    const restWeight = (1.0 - totalWeight) / 1.0;
    for (const joint of rigDef.supportedJoints) {
      const restVal = effectiveLimits[joint]?.rest ?? 0;
      blendedJoints[joint] += restVal * restWeight;
    }
    blendedScaleX += 1.0 * restWeight;
    blendedScaleY += 1.0 * restWeight;
  }

  // 3. Enforce Joint Limits Clamping (Anti-Separation Guarantee)
  const clampedJoints: Record<string, EvaluatedJointClamping> = {};
  let isClamped = false;

  for (const [joint, value] of Object.entries(blendedJoints)) {
    const limit = effectiveLimits[joint];
    if (limit) {
      if (value < limit.min || value > limit.max) {
        const clampedVal = clamp(value, limit.min, limit.max);
        clampedJoints[joint] = {
          raw: value,
          clamped: clampedVal,
          min: limit.min,
          max: limit.max,
        };
        blendedJoints[joint] = clampedVal;
        isClamped = true;
      }
    }
  }

  return {
    jointRotations: blendedJoints,
    rootOffset: {
      x: blendedRootX,
      y: blendedRootY,
      rotation: blendedRot,
      scaleX: blendedScaleX,
      scaleY: blendedScaleY,
    },
    partOverrides: dominantInstance.partOverrides,
    expressionCue: dominantInstance.expressionCue,
    pose: dominantInstance.poseName,
    activeClipId: dominantInstance.clipInstance.clip.id,
    clipProgress: dominantInstance.progress,
    isClamped,
    clampedJoints,
  };
}
