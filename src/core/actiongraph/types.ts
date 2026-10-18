import { CharacterPoseName } from '../characters/types';
import { InteractionDefinition, ResolvedInteraction } from '../interactions/types';

export type ActionNodeType =
  | 'clip'
  | 'pose'
  | 'interaction'
  | 'expression'
  | 'transform'
  | 'weather'
  | 'camera';

export type ConflictPolicy = 'override' | 'blend' | 'error';

export interface ActionTimingSpec {
  /** Absolute start frame */
  startFrame?: number;
  /** Absolute duration in frames */
  durationInFrames?: number;
  /** Absolute start time in seconds (converted to frames at boundary using fps) */
  startSeconds?: number;
  /** Absolute duration in seconds */
  durationSeconds?: number;
  /** Relative dependency: start immediately after this node finishes */
  startAfter?: string;
  /** Relative dependency: start concurrently with this node's start */
  startWith?: string;
  /** Additional frame delay added to relative dependency */
  delayFrames?: number;
  /** Additional second delay added to relative dependency */
  delaySeconds?: number;
}

export interface ActionNode {
  id: string;
  name?: string;
  /** ID of target entity (e.g. 'student-articulated', 'starter-prop-umbrella', 'camera', 'environment') */
  targetId: string;
  actionType: ActionNodeType;
  timing: ActionTimingSpec;

  /** Action Clip identifier if actionType is 'clip' (e.g. 'arm_gesture_wave', 'breathing_subtle') */
  clipId?: string;
  /** Interaction specification if actionType is 'interaction' */
  interactionDef?: Partial<InteractionDefinition>;
  /** Discrete pose if actionType is 'pose' */
  pose?: CharacterPoseName;
  /** Expression cues if actionType is 'expression' */
  expression?: {
    eyes?: string;
    mouth?: string;
  };
  /** Spatial transformation offsets if actionType is 'transform' */
  transform?: Partial<{
    x: number;
    y: number;
    rotation: number;
    scale: number;
    flipX: boolean;
  }>;

  /** Dot-path property keys controlled by this action node */
  controlledProperties: string[];
  /** Numeric priority for conflict resolution (default: 10, higher wins) */
  priority?: number;
  /** Policy when overlapping writes occur on the same property (default: 'override') */
  conflictPolicy?: ConflictPolicy;

  /** Hermite crossfade frames */
  blendInFrames?: number;
  blendOutFrames?: number;
  /** Loop continuously across its duration */
  loop?: boolean;
  /** Arbitrary action options */
  options?: Record<string, unknown>;
}

export interface ActionGraph {
  id: string;
  name: string;
  description?: string;
  /** Framerate (default: 30) */
  fps?: number;
  /** Explicit total canvas duration, or inferred from maximum node end frame */
  durationInFrames?: number;
  nodes: ActionNode[];
}

export interface ResolvedActionNode extends ActionNode {
  absoluteStartFrame: number;
  absoluteEndFrame: number;
  effectiveDurationInFrames: number;
}

export interface TimelineConflict {
  property: string;
  targetId: string;
  nodeA: string;
  nodeB: string;
  overlapRange: [number, number];
  policyApplied: ConflictPolicy;
  winnerNodeId?: string;
  message: string;
}

export interface PropertyTrackSegment {
  nodeId: string;
  startFrame: number;
  endFrame: number;
  priority: number;
}

export interface ResolvedTimeline {
  graphId: string;
  fps: number;
  totalDurationInFrames: number;
  nodes: ResolvedActionNode[];
  nodesById: Record<string, ResolvedActionNode>;
  propertyTracks: Record<string, PropertyTrackSegment[]>;
  conflicts: TimelineConflict[];
  hasErrors: boolean;
}

export interface EvaluatedCharacterState {
  characterId: string;
  pose: CharacterPoseName;
  jointRotations: Record<string, number>;
  rootOffset: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  };
  partOverrides: Record<string, string>;
  expression: {
    eyes?: string;
    mouth?: string;
  };
  activeNodeIds: string[];
}

export interface EvaluatedActionGraphState {
  frame: number;
  characters: Record<string, EvaluatedCharacterState>;
  interactions: Record<string, ResolvedInteraction>;
  activeNodeIds: string[];
  activeProperties: Record<string, string>; // propertyKey -> winningNodeId
}
