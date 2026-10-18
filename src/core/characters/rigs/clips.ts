import { AnimationClip } from './types';

/**
 * Pure mathematical easing utilities for deterministic keyframe curve generation.
 */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function easeInOutSine(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

/**
 * Canonical Starter Action Clip Library.
 * 10 Reusable, frame-deterministic clips declaring explicit duration,
 * mathematical curves, and supported rig profiles.
 */
export const STARTER_ACTION_LIBRARY: Record<string, AnimationClip> = {
  // 1. NEUTRAL IDLE (Universal across all 4 rig profiles)
  neutral_idle: {
    id: 'neutral_idle',
    name: 'Neutral Idle',
    description: 'Subtle resting cadence with gentle chest breathing and micro-head tilt.',
    supportedRigProfiles: ['face_only', 'upper_body_cutout', 'full_body_cutout', 'pose_swapped'],
    requiredCapabilities: ['micro_blink'],
    durationInFrames: 60,
    loop: true,
    jointCurves: {
      headTilt: (progress, intensity) => {
        return Math.sin(progress * Math.PI * 2) * 0.8 * intensity;
      },
      armLeft: () => 0,
      armRight: () => 0,
    },
    rootMotion: {
      y: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 1.5 * intensity,
      scaleY: (progress, intensity) => 1.0 + Math.sin(progress * Math.PI * 2) * 0.004 * intensity,
    },
  },

  // 2. LOOK LEFT / RIGHT
  look_left_right: {
    id: 'look_left_right',
    name: 'Look Left and Right',
    description: 'Horizontal gaze shift with natural head tilt and pupil displacement.',
    supportedRigProfiles: ['face_only', 'upper_body_cutout', 'full_body_cutout', 'pose_swapped'],
    requiredCapabilities: ['gaze_direction', 'head_tilt'],
    durationInFrames: 45,
    loop: false,
    jointCurves: {
      headTilt: (progress, intensity) => {
        // Turns to left (-4 deg), holds, eases to right (+4 deg), returns to center
        if (progress < 0.3) {
          return -4 * smoothstep(progress / 0.3) * intensity;
        } else if (progress < 0.7) {
          const t = (progress - 0.3) / 0.4;
          return (-4 + 8 * smoothstep(t)) * intensity;
        } else {
          const t = (progress - 0.7) / 0.3;
          return (4 - 4 * smoothstep(t)) * intensity;
        }
      },
    },
  },

  // 3. LOOK UP / DOWN
  look_up_down: {
    id: 'look_up_down',
    name: 'Look Up and Down',
    description: 'Vertical gaze and head elevation shift.',
    supportedRigProfiles: ['face_only', 'upper_body_cutout', 'full_body_cutout', 'pose_swapped'],
    requiredCapabilities: ['gaze_direction', 'head_tilt'],
    durationInFrames: 45,
    loop: false,
    jointCurves: {
      headTilt: (progress, intensity) => {
        if (progress < 0.4) {
          return 5 * easeInOutSine(progress / 0.4) * intensity; // Look up
        } else if (progress < 0.8) {
          const t = (progress - 0.4) / 0.4;
          return (5 - 8 * easeInOutSine(t)) * intensity; // Look down
        } else {
          const t = (progress - 0.8) / 0.2;
          return (-3 + 3 * easeInOutSine(t)) * intensity; // Return
        }
      },
    },
  },

  // 4. MICRO BLINK
  micro_blink: {
    id: 'micro_blink',
    name: 'Micro Blink',
    description: 'Rapid 4-frame physiological eyelid closure and recovery.',
    supportedRigProfiles: ['face_only', 'upper_body_cutout', 'full_body_cutout', 'pose_swapped'],
    requiredCapabilities: ['micro_blink'],
    durationInFrames: 30,
    loop: false,
    expressionCue: {
      eyes: 'starter-char-eyes-wink-v2',
    },
  },

  // 5. BREATHING SUBTLE
  breathing_subtle: {
    id: 'breathing_subtle',
    name: 'Subtle Torso Breathing',
    description: 'Rhythmic diaphragm breathing with vertical displacement and scale squash/stretch.',
    supportedRigProfiles: ['upper_body_cutout', 'full_body_cutout'],
    requiredCapabilities: ['breathing'],
    durationInFrames: 60,
    loop: true,
    jointCurves: {
      headTilt: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 1.2 * intensity,
      torsoTilt: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 0.8 * intensity,
    },
    rootMotion: {
      y: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 2.2 * intensity,
      scaleY: (progress, intensity) => 1.0 + Math.sin(progress * Math.PI * 2) * 0.006 * intensity,
    },
  },

  // 6. HEAD TURN SMALL
  head_turn_small: {
    id: 'head_turn_small',
    name: 'Small Conversational Head Turn',
    description: 'Gentle attentive head rotation toward an interlocutor.',
    supportedRigProfiles: ['face_only', 'upper_body_cutout', 'full_body_cutout'],
    requiredCapabilities: ['head_tilt'],
    durationInFrames: 45,
    loop: false,
    jointCurves: {
      headTilt: (progress, intensity) => {
        // Anticipation, rotate to 7.5 deg, ease settle
        const p = smoothstep(progress);
        return 7.5 * p * intensity;
      },
    },
  },

  // 7. ARM GESTURE WAVE
  arm_gesture_wave: {
    id: 'arm_gesture_wave',
    name: 'Friendly Arm Wave',
    description: 'Raised right forearm with harmonic sinusoidal oscillation.',
    supportedRigProfiles: ['upper_body_cutout', 'full_body_cutout'],
    requiredCapabilities: ['arm_rotation', 'arm_gesture'],
    durationInFrames: 60,
    loop: true,
    partOverrides: {
      armsRight: 'starter-char-arm-01-right-wave',
    },
    jointCurves: {
      headTilt: (progress, intensity) => -1.5 * intensity,
      armRight: (progress, intensity) => {
        const oscillation = Math.sin(progress * Math.PI * 2 * 3.0) * 16.0;
        return (14.0 + oscillation) * intensity;
      },
      armLeft: () => 0,
    },
  },

  // 8. ARM GESTURE PRESENT
  arm_gesture_present: {
    id: 'arm_gesture_present',
    name: 'Explanatory Presentation Gesture',
    description: 'Left arm forward angle presenting a concept or subject.',
    supportedRigProfiles: ['upper_body_cutout', 'full_body_cutout'],
    requiredCapabilities: ['arm_rotation', 'arm_gesture'],
    durationInFrames: 60,
    loop: false,
    partOverrides: {
      armsLeft: 'starter-char-arm-01-left-bent-talk',
    },
    jointCurves: {
      headTilt: (progress, intensity) => 1.8 * intensity,
      armLeft: (progress, intensity) => {
        if (progress < 0.4) {
          return 22.0 * smoothstep(progress / 0.4) * intensity;
        } else if (progress < 0.8) {
          return 22.0 * intensity;
        } else {
          const t = (progress - 0.8) / 0.2;
          return (22.0 - 22.0 * smoothstep(t)) * intensity;
        }
      },
      armRight: () => 0,
    },
  },

  // 9. SIT / STAND POSE SWAP
  sit_stand_swap: {
    id: 'sit_stand_swap',
    name: 'Sit/Stand Pose Swap',
    description: 'Discrete posture swap between sitting and standing states with vertical baseline offset.',
    supportedRigProfiles: ['pose_swapped', 'full_body_cutout'],
    requiredCapabilities: ['pose_swap', 'root_motion'],
    durationInFrames: 30,
    loop: false,
    poseName: 'sit',
    rootMotion: {
      y: (progress, intensity) => {
        // Vertical translation from standing (0) down to sitting (-60px)
        return -60.0 * smoothstep(progress) * intensity;
      },
    },
  },

  // 10. WALK CYCLE SIMPLE (Exclusive to full_body_cutout!)
  walk_cycle_simple: {
    id: 'walk_cycle_simple',
    name: 'Simple Cutout Walk Cycle',
    description: 'Cyclical bipedal walk locomotion with leg counter-strides, arm counter-swings, and pelvic bounce.',
    supportedRigProfiles: ['full_body_cutout'],
    requiredCapabilities: ['walk_cycle', 'leg_stride'],
    durationInFrames: 30,
    loop: true,
    jointCurves: {
      legLeft: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 26.0 * intensity,
      legRight: (progress, intensity) => -Math.sin(progress * Math.PI * 2) * 26.0 * intensity,
      armLeft: (progress, intensity) => -Math.sin(progress * Math.PI * 2) * 18.0 * intensity,
      armRight: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 18.0 * intensity,
      headTilt: (progress, intensity) => Math.sin(progress * Math.PI * 4) * 0.8 * intensity,
      torsoTilt: (progress, intensity) => Math.sin(progress * Math.PI * 2) * 2.0 * intensity,
    },
    rootMotion: {
      y: (progress, intensity) => Math.abs(Math.sin(progress * Math.PI * 2)) * -4.5 * intensity,
    },
  },
};

/**
 * Retrieves a clip by ID from the canonical starter library.
 */
export function getActionClip(id: string): AnimationClip {
  const clip = STARTER_ACTION_LIBRARY[id];
  if (!clip) {
    const available = Object.keys(STARTER_ACTION_LIBRARY).join(', ');
    throw new Error(`Animation clip "${id}" not found in starter library. Available: ${available}`);
  }
  return clip;
}
