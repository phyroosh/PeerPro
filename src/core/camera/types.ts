export type CameraPresetName =
  | 'static'
  | 'slow-push-in'
  | 'slow-pull-out'
  | 'pan-left-to-right'
  | 'pan-right-to-left'
  | 'tilt-up'
  | 'tilt-down'
  | 'tracking'
  | 'custom';

export interface CameraBounds {
  maxDisplacementX: number; // max horizontal travel in px (default: 150)
  maxDisplacementY: number; // max vertical travel in px (default: 80)
  minZoom: number; // min zoom multiplier (default: 0.9)
  maxZoom: number; // max zoom multiplier (default: 1.25)
}

export interface CameraDepthOfFieldConfig {
  enabled: boolean;
  aperture?: number; // default: 1.0 (higher = shallower depth of field, more blur)
  focalDepth?: number; // override focal depth plane for rack focus, default: camera.focalDepth
  maxBlur?: number; // max blur radius in pixels, default: 8.0
}

export interface CameraShakeConfig {
  enabled: boolean;
  frequency?: number; // Hz, default: 0.4
  amplitudeX?: number; // px, default: 2.5
  amplitudeY?: number; // px, default: 1.8
  rotational?: number; // degrees, default: 0.25
}

export interface CameraAtmosphericHazeConfig {
  enabled: boolean;
  color?: string; // sky haze color, default: '#bae6fd' (soft sky blue)
  density?: number; // haze max opacity, default: 0.35
  minDepth?: number; // depth threshold where haze begins, default: 0.6
}

export interface CameraConfig {
  preset: CameraPresetName;
  focalDepth?: number; // depth plane that moves 1:1, default: 1.0
  durationInFrames?: number;
  intensity?: number; // travel multiplier [0.0 - 2.0], default: 1.0 (0 disables movement)
  bounds?: Partial<CameraBounds>;
  depthOfField?: CameraDepthOfFieldConfig;
  shake?: CameraShakeConfig;
  atmosphericHaze?: CameraAtmosphericHazeConfig;
  customMove?: (frame: number, duration: number) => { x: number; y: number; zoom: number; roll?: number };
}

export interface CameraState {
  x: number; // Camera displacement X in px
  y: number; // Camera displacement Y in px
  zoom: number; // Camera zoom level (1.0 = native)
  focalDepth: number;
  roll?: number; // Camera rotation/tilt in degrees
  dofBlur?: (depth: number) => number;
  hazeOpacity?: (depth: number) => number;
  hazeColor?: string;
}
