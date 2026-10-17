export type AudioTrackType = 'bgm' | 'ambient' | 'sfx' | 'voiceover';

export interface SceneAudioTrack {
  id: string;
  type: AudioTrackType;
  src?: string; // URL or staticFile path
  assetId?: string; // Optional AssetRegistry ID
  startFrame: number;
  durationInFrames?: number;
  volume?: number; // Base volume multiplier (0.0 to 1.0, default: 1.0)
  fadeInFrames?: number; // Linear fade in frames (default: 0)
  fadeOutFrames?: number; // Linear fade out frames (default: 0)
  duckUnderDialog?: boolean; // If true, volume ducks when dialogue lines are active (default: true for bgm/ambient)
  duckFactor?: number; // Multiplier when ducked (default: 0.35 = 35% of base volume)
  loop?: boolean; // Repeat track when shorter than duration
  playbackRate?: number; // Speed multiplier (default: 1.0)
}

export type LipSyncViseme = 'closed' | 'open' | 'half' | 'wide' | 'smile';

export interface LipSyncKeyframe {
  frame: number;
  viseme: LipSyncViseme;
  mouthAssetId: string;
}

export interface SpeechCadenceOptions {
  wordsPerMinute?: number; // default: 140 (natural anime dialog pace)
  flapFrequency?: number; // Hz, default: 3.5 Hz
  pauseBetweenSentencesFrames?: number; // default: 12 frames
  pauseBetweenWordsFrames?: number; // default: 4 frames
  smileRatio?: number; // probability of ending on or including a smile shape
  defaultClosedAsset?: string;
  defaultOpenAsset?: string;
  defaultSmileAsset?: string;
}

export interface TrackVolumeState {
  trackId: string;
  type: AudioTrackType;
  volume: number; // Current evaluated volume (0.0 to 1.0)
  isDucked: boolean;
  isActive: boolean;
}
