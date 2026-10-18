import {
  CameraAtmosphericHazeConfig,
  CameraConfig,
  CameraDepthOfFieldConfig,
  CameraPresetName,
  CameraShakeConfig,
} from '../camera/types';

export type ShotIntentType =
  | 'establishing'
  | 'wide'
  | 'medium'
  | 'close_up'
  | 'insert_detail'
  | 'over_the_shoulder'
  | 'reveal'
  | 'follow'
  | 'hold';

export type ScreenRegion =
  | 'center'
  | 'rule_of_thirds_left'
  | 'rule_of_thirds_right'
  | 'edge_left'
  | 'edge_right';

export type SubjectProminence =
  | 'dominant'
  | 'balanced'
  | 'secondary'
  | 'environmental';

export type DepthEmphasis =
  | 'deep_focus'
  | 'shallow_focus'
  | 'foreground_silhouette'
  | 'neutral';

export type EmotionalTone =
  | 'calm'
  | 'intimate'
  | 'pensive'
  | 'heroic'
  | 'tense';

export type CompositionRule =
  | 'rule_of_thirds'
  | 'center_weighted'
  | 'golden_ratio'
  | 'lead_room_dominant';

export interface SubjectFramingSpec {
  characterId: string;
  prominence?: SubjectProminence;
  screenRegion?: ScreenRegion;
  lookDirection?: 'screen_left' | 'screen_right' | 'direct_camera';
  anchorOffset?: { x?: number; y?: number };
}

export interface DirectorOverrides {
  cameraPreset?: CameraPresetName;
  zoom?: number;
  cameraPosition?: { x?: number; y?: number };
  subjectPosition?: { x?: number; y?: number };
  subjectScale?: number;
  subjectDepth?: number;
  depthOfField?: Partial<CameraDepthOfFieldConfig>;
  shake?: Partial<CameraShakeConfig>;
  atmosphericHaze?: Partial<CameraAtmosphericHazeConfig>;
}

export interface ShotIntentSpec {
  id: string;
  name?: string;
  intent: ShotIntentType;
  durationInFrames: number;
  subject: SubjectFramingSpec;
  secondarySubject?: SubjectFramingSpec;
  compositionRule?: CompositionRule;
  negativeSpace?: 'left' | 'right' | 'top' | 'balanced';
  depthEmphasis?: DepthEmphasis;
  emotionalTone?: EmotionalTone;
  cameraMotion?:
    | 'static_hold'
    | 'slow_push_in'
    | 'slow_pull_out'
    | 'handheld_drift'
    | 'pan_reveal';
  overrides?: DirectorOverrides;
}

export interface FramingSolution {
  intentId: string;
  intent: ShotIntentType;
  camera: CameraConfig;
  subject: {
    characterId: string;
    position: { x: number; y: number };
    scale: number;
    depth: number;
    flipX: boolean;
  };
  secondarySubject?: {
    characterId: string;
    position: { x: number; y: number };
    scale: number;
    depth: number;
    flipX: boolean;
  };
  environmentDepth: number;
  debugTelemetry: {
    computedZoom: number;
    computedCameraX: number;
    computedCameraY: number;
    targetHeadroomPx: number;
    targetEyeLineY: number;
    leadRoomDirection: 'left' | 'right' | 'none';
    shotScaleFactor: number;
  };
}

export type CompositionIssueType =
  | 'headroom_violation'
  | 'leadroom_violation'
  | 'scale_mismatch'
  | 'action_safe_clipped'
  | 'title_safe_clipped'
  | 'obscuration_risk';

export interface CompositionIssue {
  type: CompositionIssueType;
  severity: 'warning' | 'error' | 'info';
  field: string;
  message: string;
  suggestedRemedy: string;
}

export interface CompositionDiagnosticReport {
  valid: boolean;
  intentId: string;
  score: number; // 0 to 100
  issues: CompositionIssue[];
  metrics: {
    headroomRatio: number;
    leadRoomRatio: number;
    subjectHeightRatio: number;
    actionSafeCompliant: boolean;
    titleSafeCompliant: boolean;
  };
}
