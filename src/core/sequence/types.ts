import { SceneManifest } from '../scene/types';

export type ShotTransitionType = 'cut' | 'dissolve' | 'fade_to_black' | 'dip_to_white';

export interface ShotTransition {
  type: ShotTransitionType;
  durationInFrames: number; // default: 12
}

export interface SequenceShot {
  id: string;
  name?: string;
  durationInFrames: number;
  transition?: ShotTransition; // transition entering into this shot from the previous shot
  manifest: SceneManifest;
}

export type LetterboxStyle = 'none' | 'cinemascope' | 'standard'; // cinemascope: 2.39:1 aspect ratio bars
export type ColorGradePreset = 'none' | 'anime-warm' | 'anime-cool' | 'golden-hour';

export interface SequenceCompositingConfig {
  vignette?: boolean;
  letterbox?: LetterboxStyle;
  colorGrade?: ColorGradePreset;
}

export interface SequenceManifest {
  $schema?: string;
  id: string;
  name: string;
  description?: string;
  fps?: number; // default: 30
  width?: number; // default: 1920
  height?: number; // default: 1080
  shots: SequenceShot[];
  compositing?: SequenceCompositingConfig;
}

export interface ActiveShotResolution {
  shotIndex: number;
  shot: SequenceShot;
  localFrame: number;
  totalDurationInFrames: number;
  previousShot?: SequenceShot;
  transition?: {
    type: ShotTransitionType;
    progress: number; // 0.0 to 1.0
    overlayOpacity: number;
  };
}
