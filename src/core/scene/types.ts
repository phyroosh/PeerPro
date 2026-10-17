import {
  CameraBounds,
  CameraPresetName,
  CameraDepthOfFieldConfig,
  CameraShakeConfig,
  CameraAtmosphericHazeConfig,
} from '../camera/types';
import {
  BreathingOptions,
  ExpressionKeyframe,
  HeadAngleOptions,
  CharacterActionClip,
} from '../animation/types';
import { CharacterDefinition } from '../characters/types';
import { EnvironmentDefinition } from '../environments/types';

export interface SceneCanvasConfig {
  width?: number; // default: 1920
  height?: number; // default: 1080
  fps?: number; // default: 30
  durationInFrames?: number; // default: 150
  backgroundColor?: string; // default: '#090d16'
}

export interface SceneCameraConfig {
  preset: CameraPresetName;
  intensity?: number;
  focalDepth?: number;
  bounds?: Partial<CameraBounds>;
  depthOfField?: CameraDepthOfFieldConfig;
  shake?: CameraShakeConfig;
  atmosphericHaze?: CameraAtmosphericHazeConfig;
}

export interface SceneEnvironmentConfig {
  preset?: string; // e.g. 'japanese-street-corner', 'japanese-quiet-street'
  custom?: EnvironmentDefinition;
}

export interface SceneCharacterInstance {
  id: string;
  characterId?: string; // Preset ID e.g. 'student-ren'
  customDefinition?: CharacterDefinition;
  variant?: string; // e.g. 'default', 'happy', 'casual', 'surprised'
  depth?: number; // depth plane for parallax calculation (default: 1.0)
  position: {
    x: number;
    y: number;
  };
  scale?: number; // default: 1.0
  flipX?: boolean; // default: false
  rotation?: number; // default: 0
  opacity?: number; // default: 1.0
  partOverrides?: Record<string, string>;
  animation?: {
    breathing?: BreathingOptions;
    headTilt?: HeadAngleOptions;
    expressionSchedule?: ExpressionKeyframe[];
    actions?: CharacterActionClip[];
  };
}

export interface SceneEffectConfig {
  id?: string;
  type: 'petals' | 'rain';
  depth?: number; // default: 1.3
  count?: number;
  color?: string;
  seed?: number;
  opacity?: number;
  speed?: number;
  angle?: number;
}

export interface SceneDialogLine {
  id: string;
  characterId?: string;
  speaker?: string;
  text: string;
  startFrame: number;
  endFrame: number;
  position?: 'bottom' | 'top';
}

export interface SceneManifest {
  $schema?: string;
  id: string;
  name: string;
  description?: string;
  canvas?: SceneCanvasConfig;
  camera?: SceneCameraConfig;
  environment?: SceneEnvironmentConfig;
  characters?: SceneCharacterInstance[];
  effects?: SceneEffectConfig[];
  dialog?: SceneDialogLine[];
}
