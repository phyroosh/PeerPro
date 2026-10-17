import { CameraPresetName } from '../camera/types';
import { CharacterActionName, EasingType } from '../animation/types';
import { CharacterPoseName } from '../characters/types';
import { ShotTransitionType, LetterboxStyle, ColorGradePreset } from '../sequence/types';
import { SceneManifest } from '../scene/types';

export interface AgentAssetSummary {
  id: string;
  name: string;
  kind: string;
  category: string;
  angle: string;
  styleFamily: string;
  dimensions: { width: number; height: number };
  attachmentSockets: string[];
  requiredSockets: string[];
  capabilities: string[];
}

export interface AgentCharacterPresetSummary {
  id: string;
  name: string;
  styleFamily: string;
  angle: string;
  slots: string[];
  variants: string[];
  availablePoses: CharacterPoseName[];
}

export interface AgentEnvironmentPresetSummary {
  id: string;
  name: string;
  description?: string;
  roomGrammar?: {
    floorY: number;
    wallBounds?: { left: number; right: number };
    defaultDepth: number;
  };
  layers: Array<{
    id: string;
    name?: string;
    depth: number;
    order: number;
    assetId?: string;
  }>;
}

export interface AgentActionVocabularySummary {
  name: CharacterActionName;
  description: string;
  category: 'gesture' | 'posture' | 'greeting' | 'locomotion' | 'reaction';
  defaultDurationInFrames: number;
  supportsSecondaryLag: boolean;
  options: string[];
}

export interface AgentDiscoveryData {
  version: string;
  description: string;
  assets: {
    total: number;
    categories: string[];
    tags: string[];
    list: AgentAssetSummary[];
  };
  characters: {
    presets: AgentCharacterPresetSummary[];
    poses: CharacterPoseName[];
  };
  environments: {
    presets: AgentEnvironmentPresetSummary[];
  };
  animation: {
    actions: AgentActionVocabularySummary[];
    easingCurves: EasingType[];
  };
  camera: {
    presets: Array<{ name: CameraPresetName; description: string }>;
    defaultFocalDepth: number;
    safetyLimits: {
      maxDisplacementX: number;
      maxDisplacementY: number;
      minZoom: number;
      maxZoom: number;
    };
    cinematography: {
      depthOfField: {
        minAperture: number;
        maxAperture: number;
        maxBlurCeiling: number;
        description: string;
      };
      shake: {
        frequencies: string[];
        maxAmplitude: number;
        description: string;
      };
      atmosphericHaze: {
        densityRange: [number, number];
        description: string;
      };
    };
  };
  sequence: {
    transitions: ShotTransitionType[];
    letterbox: LetterboxStyle[];
    colorGrades: ColorGradePreset[];
  };
  sceneManifestTemplate: SceneManifest;
}

export type CompositionIssueSeverity = 'error' | 'warning' | 'info';

export type CompositionCategory =
  | 'framing'
  | 'headroom'
  | 'grounding'
  | 'depth_focus'
  | 'safe_zone'
  | 'angle_coherence'
  | 'timeline';

export interface RemediationRecipe {
  recipeId:
    | 'CORRECT_HEADROOM'
    | 'CORRECT_GROUNDING'
    | 'CORRECT_DOF_FOCUS'
    | 'CORRECT_LETTERBOX_CLIPPING'
    | 'CORRECT_ACTION_TIMING'
    | 'CORRECT_ANGLE_MISMATCH';
  description: string;
  parameters: Record<string, unknown>;
}

export interface CompositionIssue {
  code: string;
  category: CompositionCategory;
  severity: CompositionIssueSeverity;
  message: string;
  characterId?: string;
  details?: Record<string, unknown>;
  remediation?: RemediationRecipe;
}

export interface CompositionScoreBreakdown {
  framing: number;      // 0 - 100
  headroom: number;     // 0 - 100
  grounding: number;    // 0 - 100
  depthFocus: number;   // 0 - 100
  safeZones: number;    // 0 - 100
  coherence: number;    // 0 - 100
}

export interface CharacterBoundingBox {
  characterId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  headY: number;
  feetY: number;
  depth: number;
  headroomRatio: number; // percentage of visible frame above head
}

export interface CompositionReport {
  sceneId: string;
  overallScore: number; // 0 - 100 weighted
  passed: boolean;      // true if score >= 80 and 0 errors
  scoreBreakdown: CompositionScoreBreakdown;
  characterBounds: CharacterBoundingBox[];
  issues: CompositionIssue[];
  recommendations: string[];
}

export interface CorrectedSceneResult {
  sceneId: string;
  originalScore: number;
  improvedScore: number;
  appliedRecipes: RemediationRecipe[];
  manifest: SceneManifest;
  changeLog: string[];
}
