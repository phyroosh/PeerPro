import { AudioTrackType, SceneAudioTrack } from '../audio/types';
import { SceneDialogLine, SceneManifest } from '../scene/types';

export type VoiceoverProviderId = 'edge-tts' | 'espeak';

export type VoiceoverGender = 'Male' | 'Female' | 'Unknown';

export interface VoiceMetadata {
  id: string; // e.g. 'en-US-JennyNeural'
  displayName: string; // e.g. 'Microsoft Jenny Online (Natural) - English (United States)'
  locale: string; // e.g. 'en-US'
  localeName: string; // e.g. 'English (United States)'
  gender: VoiceoverGender;
  provider: VoiceoverProviderId;
  suggestedCodec?: string;
  categories?: string[];
  personalities?: string[];
}

export interface SpeechParameters {
  rate?: string; // e.g. '+0%', '-10%', '+15%'
  pitch?: string; // e.g. '+0Hz', '-5Hz', '+10Hz'
  volume?: string; // e.g. '+0%', '-10%', '+5%'
}

export type VoiceoverPresetName =
  | 'natural-narration'
  | 'calm-storytelling'
  | 'energetic-narration'
  | 'reflective-narration';

export interface VoiceoverPresetConfig {
  name: VoiceoverPresetName;
  displayName: string;
  description: string;
  defaultVoice: string;
  parameters: Required<SpeechParameters>;
}

export interface VoiceoverSynthesisRequest {
  text: string;
  voice?: string;
  providerId?: VoiceoverProviderId;
  parameters?: SpeechParameters;
  preset?: VoiceoverPresetName;
  outputPath?: string;
  format?: 'wav' | 'mp3';
  useCache?: boolean;
}

export interface VoiceoverSynthesisResult {
  audioFilePath: string; // Absolute path to generated audio file
  relativePublicPath: string; // Path relative to public directory for Remotion staticFile()
  durationSeconds: number; // Exact audio duration in seconds
  durationInFrames: number; // Audio duration in frames at target fps
  fps: number;
  sampleRate: number; // e.g. 48000
  channels: number; // e.g. 2
  format: 'wav' | 'mp3';
  provider: VoiceoverProviderId;
  voice: string;
  parameters: Required<SpeechParameters>;
  cacheHit: boolean;
  fileSizeBytes: number;
}

export interface VoiceoverPreviewRequest {
  voice?: string;
  providerId?: VoiceoverProviderId;
  text?: string;
  preset?: VoiceoverPresetName;
  parameters?: SpeechParameters;
  format?: 'wav' | 'mp3';
}

export interface VoiceoverPreviewResult {
  previewFilePath: string;
  durationSeconds: number;
  voice: string;
  provider: VoiceoverProviderId;
  parameters: Required<SpeechParameters>;
  sampleText: string;
  cacheHit: boolean;
}

export interface VoiceoverProvider {
  readonly id: VoiceoverProviderId;
  readonly name: string;
  listVoices(options?: { refresh?: boolean }): Promise<VoiceMetadata[]>;
  synthesize(request: VoiceoverSynthesisRequest): Promise<VoiceoverSynthesisResult>;
  isAvailable(): Promise<boolean>;
}

export interface VoiceFilterOptions {
  locale?: string;
  gender?: VoiceoverGender;
  search?: string;
  providerId?: VoiceoverProviderId;
  refresh?: boolean;
}

export interface SceneVoiceoverSyncOptions {
  defaultVoice?: string;
  defaultPreset?: VoiceoverPresetName;
  providerId?: VoiceoverProviderId;
  targetFps?: number;
  pauseBetweenLinesFrames?: number;
  expandCanvasDurationIfNeeded?: boolean;
}

export interface SceneVoiceoverSyncResult {
  manifest: SceneManifest;
  generatedTracks: SceneAudioTrack[];
  totalVoiceoverDurationSeconds: number;
  totalVoiceoverDurationFrames: number;
  canvasDurationExpanded: boolean;
  lineResults: Array<{
    dialogId: string;
    text: string;
    voice: string;
    audioTrackId: string;
    audioPath: string;
    startFrame: number;
    endFrame: number;
    durationInFrames: number;
    cacheHit: boolean;
  }>;
}
