import {
  SpeechParameters,
  VoiceoverPresetConfig,
  VoiceoverPresetName,
} from './types';

export const DEFAULT_NEURAL_VOICE = 'en-US-JennyNeural';

export const VOICEOVER_PRESETS: Record<VoiceoverPresetName, VoiceoverPresetConfig> = {
  'natural-narration': {
    name: 'natural-narration',
    displayName: 'Natural Narration',
    description: 'Balanced, standard conversational pace and natural pitch inflection.',
    defaultVoice: DEFAULT_NEURAL_VOICE,
    parameters: {
      rate: '+0%',
      pitch: '+0Hz',
      volume: '+0%',
    },
  },
  'calm-storytelling': {
    name: 'calm-storytelling',
    displayName: 'Calm Storytelling',
    description: 'Slightly slower cadence with gentle lower pitch for serene or reflective scenes.',
    defaultVoice: DEFAULT_NEURAL_VOICE,
    parameters: {
      rate: '-5%',
      pitch: '-2Hz',
      volume: '+0%',
    },
  },
  'energetic-narration': {
    name: 'energetic-narration',
    displayName: 'Energetic Narration',
    description: 'Brisk, upbeat speech with bright higher pitch for fast-paced tutorials or action.',
    defaultVoice: 'en-US-GuyNeural',
    parameters: {
      rate: '+10%',
      pitch: '+4Hz',
      volume: '+5%',
    },
  },
  'reflective-narration': {
    name: 'reflective-narration',
    displayName: 'Reflective Narration',
    description: 'Measured, contemplative delivery with relaxed volume and lowered pitch.',
    defaultVoice: DEFAULT_NEURAL_VOICE,
    parameters: {
      rate: '-10%',
      pitch: '-4Hz',
      volume: '-5%',
    },
  },
};

/**
 * Validates speech rate parameter (e.g. '+0%', '-10%', '+20%').
 */
export function isValidRate(rate?: string): boolean {
  if (!rate) return true;
  return /^[+-]?\d+%{1}$/.test(rate.trim());
}

/**
 * Validates speech pitch parameter (e.g. '+0Hz', '-5Hz', '+12Hz').
 */
export function isValidPitch(pitch?: string): boolean {
  if (!pitch) return true;
  return /^[+-]?\d+Hz$/i.test(pitch.trim());
}

/**
 * Validates speech volume parameter (e.g. '+0%', '-10%', '+10%').
 */
export function isValidVolume(volume?: string): boolean {
  if (!volume) return true;
  return /^[+-]?\d+%{1}$/.test(volume.trim());
}

/**
 * Validates and normalizes speech parameters, applying conservative defaults.
 */
export function validateAndNormalizeParameters(
  params?: SpeechParameters,
  preset?: VoiceoverPresetName
): Required<SpeechParameters> {
  const basePreset = preset && VOICEOVER_PRESETS[preset]
    ? VOICEOVER_PRESETS[preset].parameters
    : VOICEOVER_PRESETS['natural-narration'].parameters;

  const rawRate = params?.rate?.trim() ?? basePreset.rate;
  const rawPitch = params?.pitch?.trim() ?? basePreset.pitch;
  const rawVolume = params?.volume?.trim() ?? basePreset.volume;

  if (!isValidRate(rawRate)) {
    throw new Error(
      `Invalid speech rate "${params?.rate}". Expected format like "+10%", "-5%", or "+0%".`
    );
  }

  if (!isValidPitch(rawPitch)) {
    throw new Error(
      `Invalid speech pitch "${params?.pitch}". Expected format like "+4Hz", "-2Hz", or "+0Hz".`
    );
  }

  if (!isValidVolume(rawVolume)) {
    throw new Error(
      `Invalid speech volume "${params?.volume}". Expected format like "+5%", "-10%", or "+0%".`
    );
  }

  // Ensure leading plus sign if positive number without sign
  const normalize = (val: string, suffix: string) => {
    let clean = val;
    if (!clean.startsWith('+') && !clean.startsWith('-')) {
      clean = `+${clean}`;
    }
    return clean;
  };

  return {
    rate: normalize(rawRate, '%'),
    pitch: normalize(rawPitch, 'Hz'),
    volume: normalize(rawVolume, '%'),
  };
}

/**
 * Retrieves a preset by name or returns the default natural preset.
 */
export function getVoiceoverPreset(name?: VoiceoverPresetName): VoiceoverPresetConfig {
  if (name && VOICEOVER_PRESETS[name]) {
    return VOICEOVER_PRESETS[name];
  }
  return VOICEOVER_PRESETS['natural-narration'];
}
