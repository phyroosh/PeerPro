import { CharacterPoseName, CharacterJointRotations } from '../characters/types';
import { resolveCharacterPose } from '../characters/poses';
import {
  CharacterActionName,
  CharacterActionClip,
  EvaluatedCharacterActionState,
  ActionClipOptions,
} from './types';
import {
  clamp,
  lerp,
  easeInOutQuad,
  easeOutBack,
  easeInQuad,
  easeOutQuad,
  easeInOutCubic,
  computeOscillation,
  computeHeadTilt,
} from './primitives';

export interface RawActionState {
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
}

/**
 * 1. IDLE: Natural breathing, resting arm posture, subtle head tilt, and periodic micro-blink.
 */
export function generateIdleAction(
  frame: number,
  fps: number,
  intensity = 1.0
): RawActionState {
  const armLeftRot = computeOscillation(frame, fps, 0.4, 0.8 * intensity);
  const armRightRot = computeOscillation(frame, fps, 0.4, -0.8 * intensity);
  const headTiltRot = computeHeadTilt(frame, fps, { frequency: 0.3, maxAngle: 2.0 * intensity });

  const breathSin = Math.sin((frame / fps) * Math.PI * 2 * 0.5);
  const offsetY = breathSin * 2.2 * intensity;
  const scaleY = 1.0 + breathSin * 0.006 * intensity;

  // Periodic natural eye blink every ~3.5 seconds (frames 95-98)
  const cycleFrame = frame % 105;
  const isBlinking = cycleFrame >= 98 && cycleFrame <= 101;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: armLeftRot,
      armRight: armRightRot,
      headTilt: headTiltRot,
    },
    rootOffset: {
      x: 0,
      y: offsetY,
      rotation: 0,
      scaleX: 1.0,
      scaleY,
    },
    partOverrides: poseRes.overrides,
    expressionCue: isBlinking ? { eyes: 'starter-char-eyes-wink-v2' } : undefined,
  };
}

/**
 * 2. BOW: Polite Japanese greeting bow with ease-in anticipation, respectful hold, and recovery.
 */
export function generateBowAction(
  progress: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const p = clamp(progress, 0, 1);

  let angleFactor = 0;
  let dipFactor = 0;
  let squashFactor = 1.0;

  // Tri-phase bow: descend (0 -> 0.35), hold at apex (0.35 -> 0.65), recover (0.65 -> 1.0)
  if (p < 0.35) {
    const t = p / 0.35;
    angleFactor = easeInOutQuad(t);
    dipFactor = easeInOutQuad(t);
    squashFactor = 1.0 - 0.06 * easeInOutQuad(t);
  } else if (p <= 0.65) {
    angleFactor = 1.0;
    dipFactor = 1.0;
    squashFactor = 0.94;
  } else {
    const t = (p - 0.65) / 0.35;
    angleFactor = 1.0 - easeInOutCubic(t);
    dipFactor = 1.0 - easeInOutCubic(t);
    squashFactor = 0.94 + 0.06 * easeInOutCubic(t);
  }

  const dipY = dipFactor * 18.0 * intensity;
  const headPitch = angleFactor * 10.0 * intensity;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: angleFactor * 2.5 * intensity,
      armRight: angleFactor * 2.5 * intensity,
      headTilt: headPitch,
    },
    rootOffset: {
      x: 0,
      y: dipY,
      rotation: 0,
      scaleX: 1.0 + (1.0 - squashFactor) * 0.5,
      scaleY: squashFactor,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      eyes: 'starter-char-eyes-neutral-v2',
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 3. WAVE: Cheerful hand wave with anticipation arm raise, rapid forearm oscillation, and friendly head tilt.
 */
export function generateWaveAction(
  progress: number,
  frame: number,
  fps: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const p = clamp(progress, 0, 1);
  const freq = options.waveFrequency ?? 2.5;

  let waveEnvelope = 0;
  if (p < 0.2) {
    waveEnvelope = easeOutBack(p / 0.2, 1.2);
  } else if (p <= 0.8) {
    waveEnvelope = 1.0;
  } else {
    waveEnvelope = 1.0 - easeInOutQuad((p - 0.8) / 0.2);
  }

  const waveOsc = Math.sin((frame / fps) * Math.PI * 2 * freq) * 14.0 * intensity * waveEnvelope;
  const headTilt = -2.2 * intensity * waveEnvelope + computeOscillation(frame, fps, 1.2, 1.2);
  const cheerfulBounce = Math.abs(Math.sin((frame / fps) * Math.PI * freq)) * 2.0 * intensity * waveEnvelope;

  const poseRes = resolveCharacterPose('wave');

  return {
    pose: 'wave',
    jointRotations: {
      armLeft: 0,
      armRight: waveOsc,
      headTilt,
    },
    rootOffset: {
      x: 0,
      y: -cheerfulBounce,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-smile-v2',
    },
  };
}

/**
 * 4. TALK: Conversational speech rhythms, chest gestures, and cadence-matched micro-nods.
 */
export function generateTalkAction(
  frame: number,
  fps: number,
  intensity = 1.0
): RawActionState {
  const armLeftMotion = computeOscillation(frame, fps, 1.3, 5.0 * intensity);
  const armRightMotion = computeOscillation(frame, fps, 0.9, 2.5 * intensity);
  const speechNod = computeOscillation(frame, fps, 1.1, 2.6 * intensity) + computeOscillation(frame, fps, 2.2, 1.0);
  const speechBob = computeOscillation(frame, fps, 1.1, 1.4 * intensity);

  // Viseme mouth flap (mouth opens and smiles cadence)
  const isMouthOpen = (frame % 8) < 4;

  const poseRes = resolveCharacterPose('talk_gesture');

  return {
    pose: 'talk_gesture',
    jointRotations: {
      armLeft: armLeftMotion,
      armRight: armRightMotion,
      headTilt: speechNod,
    },
    rootOffset: {
      x: 0,
      y: speechBob,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: isMouthOpen ? 'starter-char-mouth-smile-v2' : 'starter-char-mouth-closed',
    },
  };
}

/**
 * 5. POINT: Directive pointing gesture with arm raise anticipation and directional hold.
 */
export function generatePointAction(
  progress: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const p = clamp(progress, 0, 1);
  const dir = options.pointDirection ?? 'mid';
  const dirAngle = dir === 'high' ? -8.0 : dir === 'low' ? 8.0 : 0;

  let pointEnvelope = 0;
  if (p < 0.25) {
    pointEnvelope = easeOutBack(p / 0.25, 1.3);
  } else if (p <= 0.75) {
    pointEnvelope = 1.0;
  } else {
    pointEnvelope = 1.0 - easeInOutQuad((p - 0.75) / 0.25);
  }

  const armRightAngle = (dirAngle + 2.0) * intensity * pointEnvelope;
  const headTilt = 2.4 * intensity * pointEnvelope;

  const poseRes = resolveCharacterPose('point');

  return {
    pose: 'point',
    jointRotations: {
      armLeft: 0,
      armRight: armRightAngle,
      headTilt,
    },
    rootOffset: {
      x: 2.0 * intensity * pointEnvelope,
      y: 0,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      eyes: 'starter-char-eyes-neutral-v2',
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 6. NOD: Affirmative single or double head nod.
 */
export function generateNodAction(
  progress: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const p = clamp(progress, 0, 1);
  const count = options.nodCount ?? 2;

  // Sine pitch oscillation windowed by bell envelope
  const envelope = Math.sin(p * Math.PI);
  const nodWave = Math.sin(p * Math.PI * 2 * count);
  const headPitch = Math.max(0, nodWave) * 10.0 * intensity * envelope;
  const nodDip = Math.max(0, nodWave) * 2.5 * intensity * envelope;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: 0,
      armRight: 0,
      headTilt: headPitch,
    },
    rootOffset: {
      x: 0,
      y: nodDip,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-smile-v2',
    },
  };
}

/**
 * 7. SHAKE_HEAD: Horizontal head turning oscillation indicating disapproval or disbelief.
 */
export function generateShakeHeadAction(
  progress: number,
  intensity = 1.0
): RawActionState {
  const p = clamp(progress, 0, 1);
  const envelope = Math.sin(p * Math.PI);
  const shakeWave = Math.sin(p * Math.PI * 2 * 2.5) * 7.0 * intensity * envelope;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: 0,
      armRight: 0,
      headTilt: shakeWave,
    },
    rootOffset: {
      x: shakeWave * 0.4,
      y: 0,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 8. SHRUG: Shoulder and chest lift with slightly flared arms and puzzled hold.
 */
export function generateShrugAction(
  progress: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const p = clamp(progress, 0, 1);
  const liftHeight = options.shrugHeight ?? 8.0;

  let envelope = 0;
  if (p < 0.25) {
    envelope = easeOutQuad(p / 0.25);
  } else if (p <= 0.7) {
    envelope = 1.0;
  } else {
    envelope = 1.0 - easeInOutQuad((p - 0.7) / 0.3);
  }

  const armL = 7.0 * intensity * envelope;
  const armR = -7.0 * intensity * envelope;
  const headTilt = -2.8 * intensity * envelope;
  const dipY = -liftHeight * intensity * envelope;

  const poseRes = resolveCharacterPose('talk_gesture');

  return {
    pose: 'talk_gesture',
    jointRotations: {
      armLeft: armL,
      armRight: armR,
      headTilt,
    },
    rootOffset: {
      x: 0,
      y: dipY,
      rotation: 0,
      scaleX: 1.0 - 0.01 * envelope,
      scaleY: 1.0 + 0.015 * envelope,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 9. THINK: Contemplative chin-touching posture with inquisitive head tilt.
 */
export function generateThinkAction(
  progress: number,
  frame: number,
  fps: number,
  intensity = 1.0
): RawActionState {
  const p = clamp(progress, 0, 1);

  let envelope = 0;
  if (p < 0.25) {
    envelope = easeInOutQuad(p / 0.25);
  } else if (p <= 0.8) {
    envelope = 1.0;
  } else {
    envelope = 1.0 - easeInOutQuad((p - 0.8) / 0.2);
  }

  const armLeftRot = -4.0 * intensity * envelope;
  const headTiltRot = (-3.0 * intensity * envelope) + computeOscillation(frame, fps, 0.3, 0.8);

  const poseRes = resolveCharacterPose('thinking');

  return {
    pose: 'thinking',
    jointRotations: {
      armLeft: armLeftRot,
      armRight: 0,
      headTilt: headTiltRot,
    },
    rootOffset: {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 10. SURPRISE: Sudden recoil hop with vertical stretch and wide eyes.
 */
export function generateSurpriseAction(
  progress: number,
  intensity = 1.0
): RawActionState {
  const p = clamp(progress, 0, 1);

  // Quick recoil impulse with bounce settle
  let recoil = 0;
  let stretch = 1.0;
  if (p < 0.2) {
    const t = p / 0.2;
    recoil = easeOutBack(t, 1.8);
    stretch = 1.0 + 0.04 * easeOutQuad(t);
  } else if (p < 0.5) {
    const t = (p - 0.2) / 0.3;
    recoil = 1.0 - 0.3 * easeInOutQuad(t);
    stretch = 1.04 - 0.04 * easeInOutQuad(t);
  } else {
    const t = (p - 0.5) / 0.5;
    recoil = 0.7 * (1.0 - easeInOutQuad(t));
    stretch = 1.0;
  }

  const recoilY = -12.0 * intensity * recoil;
  const armL = 6.0 * intensity * recoil;
  const armR = -6.0 * intensity * recoil;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: armL,
      armRight: armR,
      headTilt: -2.0 * intensity * recoil,
    },
    rootOffset: {
      x: 0,
      y: recoilY,
      rotation: 0,
      scaleX: 1.0 - 0.02 * recoil,
      scaleY: stretch,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      eyes: 'starter-char-eyes-wide',
      mouth: 'starter-char-mouth-closed',
    },
  };
}

/**
 * 11. WALK_CYCLE: In-place walk stride with alternating arm pendulum swings and rhythmic bobbing.
 */
export function generateWalkCycleAction(
  frame: number,
  fps: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  const cadence = options.walkCadence ?? 1.4; // steps per second
  const time = frame / fps;

  // Alternate arm swings
  const armSwing = Math.sin(time * Math.PI * 2 * cadence) * 16.0 * intensity;
  // Bobbing occurs at 2x cadence (one dip per step)
  const bobY = Math.abs(Math.sin(time * Math.PI * 2 * cadence)) * 5.0 * intensity;
  // Subtle torso counter-rotation
  const torsoRoll = Math.sin(time * Math.PI * 2 * cadence) * 1.5 * intensity;

  const poseRes = resolveCharacterPose('idle');

  return {
    pose: 'idle',
    jointRotations: {
      armLeft: armSwing,
      armRight: -armSwing,
      headTilt: -torsoRoll * 0.8,
    },
    rootOffset: {
      x: 0,
      y: bobY,
      rotation: torsoRoll,
      scaleX: 1.0,
      scaleY: 1.0,
    },
    partOverrides: poseRes.overrides,
    expressionCue: {
      mouth: 'starter-char-mouth-smile-v2',
    },
  };
}

/**
 * Evaluates raw action state for a specific action name and progress parameters.
 */
export function evaluateSingleAction(
  action: CharacterActionName,
  progress: number,
  frame: number,
  fps: number,
  intensity = 1.0,
  options: ActionClipOptions = {}
): RawActionState {
  switch (action) {
    case 'bow':
      return generateBowAction(progress, intensity, options);
    case 'wave':
      return generateWaveAction(progress, frame, fps, intensity, options);
    case 'talk':
      return generateTalkAction(frame, fps, intensity);
    case 'point':
      return generatePointAction(progress, intensity, options);
    case 'nod':
      return generateNodAction(progress, intensity, options);
    case 'shake_head':
      return generateShakeHeadAction(progress, intensity);
    case 'shrug':
      return generateShrugAction(progress, intensity, options);
    case 'think':
      return generateThinkAction(progress, frame, fps, intensity);
    case 'surprise':
      return generateSurpriseAction(progress, intensity);
    case 'walk_cycle':
      return generateWalkCycleAction(frame, fps, intensity, options);
    case 'idle':
    default:
      return generateIdleAction(frame, fps, intensity);
  }
}

/**
 * Master Timeline Evaluator:
 * Resolves active character actions at a specific frame, applying smooth ease-in/ease-out
 * blending across overlapping clips and returning a cohesive EvaluatedCharacterActionState.
 */
export function evaluateCharacterActions(
  frame: number,
  fps: number,
  actions?: CharacterActionClip[],
  basePose: CharacterPoseName = 'idle'
): EvaluatedCharacterActionState {
  const baseIdleState = generateIdleAction(frame, fps, 1.0);
  baseIdleState.pose = basePose;

  if (!actions || actions.length === 0) {
    return {
      pose: baseIdleState.pose,
      jointRotations: baseIdleState.jointRotations,
      rootOffset: baseIdleState.rootOffset,
      partOverrides: baseIdleState.partOverrides,
      expressionCue: baseIdleState.expressionCue,
      activeActionName: 'idle',
      actionProgress: 0,
      blendWeight: 1.0,
    };
  }

  // Find active clips at current frame
  interface ActiveEvaluatedClip {
    clip: CharacterActionClip;
    raw: RawActionState;
    progress: number;
    weight: number;
  }

  const activeClips: ActiveEvaluatedClip[] = [];

  for (const clip of actions) {
    const localFrame = frame - clip.startFrame;
    const dur = clip.durationInFrames;

    if (dur <= 0) continue;

    // Check if within clip time boundaries
    if (localFrame >= 0 && localFrame < dur) {
      const speed = clip.speed ?? 1.0;
      const progress = clamp((localFrame / dur) * speed, 0, 1);

      // Compute blend envelope
      const blendIn = clip.blendInFrames ?? 8;
      const blendOut = clip.blendOutFrames ?? 8;

      let wIn = 1.0;
      if (blendIn > 0 && localFrame < blendIn) {
        wIn = easeInOutQuad(localFrame / blendIn);
      }

      let wOut = 1.0;
      const remainingFrames = dur - localFrame;
      if (blendOut > 0 && remainingFrames < blendOut) {
        wOut = easeInOutQuad(remainingFrames / blendOut);
      }

      const weight = Math.min(wIn, wOut);
      const intensity = clip.intensity ?? 1.0;

      const raw = evaluateSingleAction(
        clip.action,
        progress,
        frame,
        fps,
        intensity,
        clip.options
      );

      activeClips.push({ clip, raw, progress, weight });
    }
  }

  if (activeClips.length === 0) {
    return {
      pose: baseIdleState.pose,
      jointRotations: baseIdleState.jointRotations,
      rootOffset: baseIdleState.rootOffset,
      partOverrides: baseIdleState.partOverrides,
      expressionCue: baseIdleState.expressionCue,
      activeActionName: 'idle',
      actionProgress: 0,
      blendWeight: 1.0,
    };
  }

  // Multi-clip normalization & blending
  let totalClipWeight = 0;
  for (const item of activeClips) {
    totalClipWeight += item.weight;
  }

  // If total weight is less than 1.0, remainder blends with base idle
  const idleWeight = clamp(1.0 - totalClipWeight, 0, 1.0);
  const totalWeight = totalClipWeight + idleWeight;

  // Normalized blend coefficients
  const normIdleWeight = idleWeight / totalWeight;

  let blendedArmL = (baseIdleState.jointRotations.armLeft ?? 0) * normIdleWeight;
  let blendedArmR = (baseIdleState.jointRotations.armRight ?? 0) * normIdleWeight;
  let blendedHeadTilt = (baseIdleState.jointRotations.headTilt ?? 0) * normIdleWeight;

  let blendedRootX = baseIdleState.rootOffset.x * normIdleWeight;
  let blendedRootY = baseIdleState.rootOffset.y * normIdleWeight;
  let blendedRot = baseIdleState.rootOffset.rotation * normIdleWeight;
  let blendedScaleX = baseIdleState.rootOffset.scaleX * normIdleWeight;
  let blendedScaleY = baseIdleState.rootOffset.scaleY * normIdleWeight;

  // Find dominant clip for discrete properties (pose, partOverrides, expression)
  let dominantClip = activeClips[0];
  let maxWeight = -1;

  for (const item of activeClips) {
    const normW = item.weight / totalWeight;

    blendedArmL += (item.raw.jointRotations.armLeft ?? 0) * normW;
    blendedArmR += (item.raw.jointRotations.armRight ?? 0) * normW;
    blendedHeadTilt += (item.raw.jointRotations.headTilt ?? 0) * normW;

    blendedRootX += item.raw.rootOffset.x * normW;
    blendedRootY += item.raw.rootOffset.y * normW;
    blendedRot += item.raw.rootOffset.rotation * normW;
    blendedScaleX += item.raw.rootOffset.scaleX * normW;
    blendedScaleY += item.raw.rootOffset.scaleY * normW;

    if (item.weight > maxWeight) {
      maxWeight = item.weight;
      dominantClip = item;
    }
  }

  // If idle dominates (> 0.5 and higher than any clip), use idle pose
  const useIdleDiscrete = normIdleWeight > 0.5 && normIdleWeight > maxWeight;
  const finalPose = useIdleDiscrete ? baseIdleState.pose : dominantClip.raw.pose;
  const finalOverrides = useIdleDiscrete ? baseIdleState.partOverrides : dominantClip.raw.partOverrides;
  const finalExpression = useIdleDiscrete ? baseIdleState.expressionCue : dominantClip.raw.expressionCue;
  const activeName = useIdleDiscrete ? 'idle' : dominantClip.clip.action;
  const activeProgress = useIdleDiscrete ? 0 : dominantClip.progress;

  return {
    pose: finalPose,
    jointRotations: {
      armLeft: blendedArmL,
      armRight: blendedArmR,
      headTilt: blendedHeadTilt,
    },
    rootOffset: {
      x: blendedRootX,
      y: blendedRootY,
      rotation: blendedRot,
      scaleX: blendedScaleX,
      scaleY: blendedScaleY,
    },
    partOverrides: finalOverrides,
    expressionCue: finalExpression,
    activeActionName: activeName,
    actionProgress: activeProgress,
    blendWeight: maxWeight,
  };
}
