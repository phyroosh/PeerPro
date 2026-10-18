export type CoordinateSpace = 'world' | 'parent' | 'character' | 'screen';

export interface Transform2D {
  x: number;
  y: number;
  scale?: number | [number, number];
  rotation?: number; // degrees clockwise
  flipX?: boolean;
  opacity?: number;
  anchor?: {
    x: number;
    y: number;
  };
}

export interface BoundingBox2D {
  x: number; // top-left X in world coords
  y: number; // top-left Y in world coords
  width: number;
  height: number;
}

export type SpatialConstraintType =
  | 'attach_socket'
  | 'place_on_surface'
  | 'align'
  | 'relative_offset'
  | 'safe_region'
  | 'layer_relative'
  | 'look_toward';

export interface SpatialConstraint {
  type: SpatialConstraintType;
  targetId?: string; // target entity ID
  targetSocket?: string; // socket name on target entity (for attach_socket)
  offset?: {
    x?: number;
    y?: number;
  };
  alignment?: 'left' | 'center' | 'right' | 'top' | 'bottom';
  region?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  relation?: 'front_of' | 'behind';
  priority?: number; // default: 10 (higher overrides lower)
  description?: string;
}

export interface SceneGraphNode {
  id: string;
  name?: string;
  kind: 'group' | 'asset' | 'character' | 'prop' | 'camera';
  parentId?: string;
  assetId?: string;
  characterId?: string;
  characterVariant?: string;
  depth?: number; // simulated depth plane z for parallax (default: 1.0)
  order?: number; // explicit base render order
  localTransform?: Partial<Transform2D>;
  visualBounds?: {
    width: number;
    height: number;
  };
  constraints?: SpatialConstraint[];
  visible?: boolean;
  customData?: Record<string, any>;
}

export interface ResolvedSceneGraphNode extends SceneGraphNode {
  worldTransform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    flipX: boolean;
    opacity: number;
    anchor: {
      x: number;
      y: number;
    };
  };
  worldBounds: BoundingBox2D;
  effectiveDepth: number;
  effectiveOrder: number;
  appliedConstraints: string[];
  unresolvedConstraints: Array<{
    constraint: SpatialConstraint;
    reason: string;
  }>;
}

export interface SceneGraphDefinition {
  $schema?: string;
  id: string;
  name: string;
  description?: string;
  canvas?: {
    width?: number;
    height?: number;
    fps?: number;
    durationInFrames?: number;
    backgroundColor?: string;
  };
  camera?: any;
  environmentPreset?: string;
  groundY?: number; // default ground horizon / surface line (e.g. 880 or 940)
  nodes: SceneGraphNode[];
}

export interface SceneGraphReport {
  valid: boolean;
  totalNodes: number;
  resolvedNodes: Record<string, ResolvedSceneGraphNode>;
  hierarchyTree: Array<{
    id: string;
    name?: string;
    kind: string;
    parentId?: string;
    children: string[];
  }>;
  resolutionOrder: string[];
  cyclesDetected: string[][];
  conflicts: Array<{
    nodeIds: string[];
    message: string;
  }>;
  warnings: string[];
}
