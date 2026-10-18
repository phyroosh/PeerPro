/**
 * Character–Object Interaction Toolkit — Type Contracts
 * Formalizes interaction types, dynamic anchors, transform coordination,
 * and compatibility diagnostics.
 */

export type InteractionType =
  | 'hold_prop'
  | 'pick_up'
  | 'set_down'
  | 'sit_at_seat'
  | 'look_at'
  | 'point_toward'
  | 'pass_object';

export interface InteractionAnchor {
  name: string;
  x: number;
  y: number;
  rotation?: number;
  space?: 'local' | 'world';
}

export interface Transform2D {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipX?: boolean;
  opacity?: number;
}

export interface InteractionDefinition {
  id: string;
  type: InteractionType;
  characterId: string;
  targetId: string;
  secondaryCharacterId?: string;
  startFrame: number;
  durationInFrames: number;
  characterAnchor?: string; // e.g. 'hand_right', 'hand_left', 'seat_base'
  targetAnchor?: string;    // e.g. 'grip', 'tip', 'seat_surface', 'surface'
  secondaryAnchor?: string; // e.g. 'hand_left' for receiver
  transitionFrames?: number; // duration of pickup, setdown, or pass transfer
  holdLayer?: 'in_front_of' | 'behind';
  surfaceY?: number; // ground or table surface level for pickup/setdown
  options?: Record<string, any>;
}

export interface ResolvedInteraction {
  frame: number;
  interactionId: string;
  type: InteractionType;
  characterTransform: Transform2D;
  targetTransform: Transform2D;
  secondaryCharacterTransform?: Transform2D;
  isAttached: boolean;
  carrierId: string;
  effectiveLayerOrder: number;
  transitionProgress: number;
  diagnostics: string[];
}

export type InteractionFallbackStrategy = 'none' | 'pose_swap' | 'snap_to_anchor';

export interface InteractionCompatibilityReport {
  compatible: boolean;
  interactionId: string;
  characterId: string;
  targetId: string;
  missingAnchors: string[];
  unsupportedReasons: string[];
  fallbackStrategy: InteractionFallbackStrategy;
  warnings: string[];
  errors: string[];
}
