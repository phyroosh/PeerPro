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

export interface CameraConfig {
  preset: CameraPresetName;
  focalDepth?: number; // depth plane that moves 1:1, default: 1.0
  durationInFrames?: number;
  intensity?: number; // travel multiplier [0.0 - 2.0], default: 1.0 (0 disables movement)
  bounds?: Partial<CameraBounds>;
  customMove?: (frame: number, duration: number) => { x: number; y: number; zoom: number };
}

export interface CameraState {
  x: number; // Camera displacement X in px
  y: number; // Camera displacement Y in px
  zoom: number; // Camera zoom level (1.0 = native)
  focalDepth: number;
}
