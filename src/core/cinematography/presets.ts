import { ShotIntentSpec } from './types';

/**
 * Standard Canonical Shot Intent Presets for PeerPro
 */

export const WIDE_ESTABLISHING_PRESET: ShotIntentSpec = {
  id: 'preset-wide-establishing',
  name: 'Wide Establishing Shot',
  intent: 'establishing',
  durationInFrames: 60,
  subject: {
    characterId: 'student-articulated',
    prominence: 'environmental',
    screenRegion: 'rule_of_thirds_left',
    lookDirection: 'screen_right',
  },
  depthEmphasis: 'deep_focus',
  emotionalTone: 'calm',
  cameraMotion: 'slow_push_in',
};

export const MEDIUM_DIALOGUE_PRESET: ShotIntentSpec = {
  id: 'preset-medium-dialogue',
  name: 'Medium Dialogue Shot',
  intent: 'medium',
  durationInFrames: 60,
  subject: {
    characterId: 'student-articulated',
    prominence: 'balanced',
    screenRegion: 'rule_of_thirds_left',
    lookDirection: 'screen_right',
  },
  negativeSpace: 'right',
  depthEmphasis: 'shallow_focus',
  emotionalTone: 'calm',
  cameraMotion: 'handheld_drift',
};

export const CLOSE_UP_INTIMATE_PRESET: ShotIntentSpec = {
  id: 'preset-close-up-intimate',
  name: 'Intimate Close-Up',
  intent: 'close_up',
  durationInFrames: 60,
  subject: {
    characterId: 'student-articulated',
    prominence: 'dominant',
    screenRegion: 'center',
    lookDirection: 'direct_camera',
  },
  depthEmphasis: 'shallow_focus',
  emotionalTone: 'intimate',
  cameraMotion: 'slow_push_in',
};

export const OVER_THE_SHOULDER_PRESET: ShotIntentSpec = {
  id: 'preset-over-the-shoulder',
  name: 'Over the Shoulder Two-Shot',
  intent: 'over_the_shoulder',
  durationInFrames: 60,
  subject: {
    characterId: 'student-articulated',
    prominence: 'dominant',
    screenRegion: 'rule_of_thirds_right',
    lookDirection: 'screen_left',
  },
  secondarySubject: {
    characterId: 'student-ren-v2',
    prominence: 'secondary',
    screenRegion: 'edge_left',
    lookDirection: 'screen_right',
  },
  depthEmphasis: 'foreground_silhouette',
  emotionalTone: 'calm',
  cameraMotion: 'static_hold',
};

export const REVEAL_PUSH_PRESET: ShotIntentSpec = {
  id: 'preset-reveal-push',
  name: 'Cinematic Reveal Push',
  intent: 'reveal',
  durationInFrames: 75,
  subject: {
    characterId: 'student-articulated',
    prominence: 'dominant',
    screenRegion: 'center',
    lookDirection: 'direct_camera',
  },
  depthEmphasis: 'shallow_focus',
  emotionalTone: 'heroic',
  cameraMotion: 'pan_reveal',
};

export const defaultShotIntentPresets: Record<string, ShotIntentSpec> = {
  'wide-establishing': WIDE_ESTABLISHING_PRESET,
  'medium-dialogue': MEDIUM_DIALOGUE_PRESET,
  'close-up-intimate': CLOSE_UP_INTIMATE_PRESET,
  'over-the-shoulder': OVER_THE_SHOULDER_PRESET,
  'reveal-push': REVEAL_PUSH_PRESET,
};
