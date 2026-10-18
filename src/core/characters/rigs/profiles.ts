import { CharacterDefinition } from '../types';
import { RigProfile, RigProfileDefinition } from './types';

export const RIG_PROFILES: Record<RigProfile, RigProfileDefinition> = {
  face_only: {
    profile: 'face_only',
    name: 'Face-Only Framing Rig',
    description: 'Portrait or close-up framing supporting facial acting, gaze shift, speech visemes, and subtle head tilts.',
    requiredSlots: ['head', 'eyes', 'mouth'],
    optionalSlots: ['hairFront', 'hairBack', 'rootPart'],
    supportedJoints: ['headTilt', 'eyeGazeX', 'eyeGazeY'],
    jointLimits: {
      headTilt: { min: -15, max: 15, rest: 0, unit: 'degrees' },
      eyeGazeX: { min: -8, max: 8, rest: 0, unit: 'pixels' },
      eyeGazeY: { min: -5, max: 5, rest: 0, unit: 'pixels' },
    },
    capabilities: [
      'gaze_direction',
      'micro_blink',
      'head_tilt',
      'speech_visemes',
      'expression_variant',
    ],
  },

  upper_body_cutout: {
    profile: 'upper_body_cutout',
    name: 'Upper-Body Articulated Cutout Rig',
    description: 'Medium-shot articulated puppet with rotating shoulder joints, chest breathing, head tilt, and modular arm postures.',
    requiredSlots: ['rootPart', 'head', 'eyes', 'mouth', 'armsLeft', 'armsRight'],
    optionalSlots: ['hairFront', 'hairBack', 'accessory'],
    supportedJoints: ['headTilt', 'armLeft', 'armRight', 'torsoTilt'],
    jointLimits: {
      headTilt: { min: -15, max: 15, rest: 0, unit: 'degrees' },
      armLeft: { min: -45, max: 120, rest: 0, unit: 'degrees' },
      armRight: { min: -45, max: 120, rest: 0, unit: 'degrees' },
      torsoTilt: { min: -10, max: 25, rest: 0, unit: 'degrees' },
    },
    capabilities: [
      'gaze_direction',
      'micro_blink',
      'head_tilt',
      'speech_visemes',
      'expression_variant',
      'breathing',
      'arm_rotation',
      'arm_gesture',
      'root_motion',
    ],
  },

  full_body_cutout: {
    profile: 'full_body_cutout',
    name: 'Full-Body Articulated Cutout Rig',
    description: 'Wide-shot full-body articulated rig with rotating limbs, capable of continuous walk cycles and body strides.',
    requiredSlots: ['rootPart', 'head', 'eyes', 'mouth', 'armsLeft', 'armsRight'],
    optionalSlots: ['hairFront', 'hairBack', 'accessory', 'legsLeft', 'legsRight', 'hips'],
    supportedJoints: ['headTilt', 'armLeft', 'armRight', 'torsoTilt', 'legLeft', 'legRight'],
    jointLimits: {
      headTilt: { min: -15, max: 15, rest: 0, unit: 'degrees' },
      armLeft: { min: -60, max: 150, rest: 0, unit: 'degrees' },
      armRight: { min: -60, max: 150, rest: 0, unit: 'degrees' },
      torsoTilt: { min: -15, max: 30, rest: 0, unit: 'degrees' },
      legLeft: { min: -45, max: 60, rest: 0, unit: 'degrees' },
      legRight: { min: -45, max: 60, rest: 0, unit: 'degrees' },
    },
    capabilities: [
      'gaze_direction',
      'micro_blink',
      'head_tilt',
      'speech_visemes',
      'expression_variant',
      'breathing',
      'arm_rotation',
      'arm_gesture',
      'leg_stride',
      'walk_cycle',
      'root_motion',
    ],
  },

  pose_swapped: {
    profile: 'pose_swapped',
    name: 'Pose-Swapped Illustration Rig',
    description: 'Fixed-part or monolithic character illustration switching between authored discrete pose assets and expressions.',
    requiredSlots: ['rootPart', 'head'],
    optionalSlots: ['hairFront', 'hairBack', 'eyes', 'mouth', 'accessory'],
    supportedJoints: ['headTilt'],
    jointLimits: {
      headTilt: { min: -5, max: 5, rest: 0, unit: 'degrees' },
    },
    capabilities: [
      'pose_swap',
      'expression_variant',
      'micro_blink',
      'root_motion',
      'speech_visemes',
    ],
  },
};

/**
 * Infers the most specific compatible rig profile for a given character definition.
 */
export function inferRigProfile(definition: CharacterDefinition): RigProfile {
  if (definition.rigProfile) {
    return definition.rigProfile;
  }

  const hasArms = Boolean(definition.slots?.armsLeft && definition.slots?.armsRight);
  const hasLegs = Boolean(
    (definition.slots as any)?.legsLeft && (definition.slots as any)?.legsRight
  );

  if (hasArms && hasLegs) {
    return 'full_body_cutout';
  }

  if (hasArms) {
    return 'upper_body_cutout';
  }

  if (!definition.rootPart || definition.id.includes('face') || definition.id.includes('close_up')) {
    return 'face_only';
  }

  return 'pose_swapped';
}

/**
 * Returns the formal definition and joint limits for a rig profile.
 */
export function getRigProfileDefinition(profile: RigProfile): RigProfileDefinition {
  const def = RIG_PROFILES[profile];
  if (!def) {
    throw new Error(`Unknown rig profile: "${profile}"`);
  }
  return def;
}
