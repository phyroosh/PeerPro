import React from 'react';
import { AssetManifestEntry } from '../assets/types';

export interface LayerTransform {
  /** Screen position X in pixels relative to parent or canvas (0,0) */
  x: number;
  /** Screen position Y in pixels relative to parent or canvas (0,0) */
  y: number;
  /** Uniform scale multiplier or [scaleX, scaleY] */
  scale?: number | [number, number];
  /** Rotation in degrees (clockwise) */
  rotation?: number;
  /** Opacity [0.0 - 1.0] */
  opacity?: number;
  /** Flip horizontally */
  flipX?: boolean;
  /** Custom anchor override [0.0 - 1.0]. If omitted, uses asset anchor from manifest. */
  anchor?: {
    x: number;
    y: number;
  };
}

export type EnvironmentDomain = 'outdoor' | 'indoor' | 'hybrid';

export type EnvironmentLayerPlane =
  | 'background'
  | 'mid_back'
  | 'character_occluder'
  | 'foreground';

export interface RoomGrammar {
  /** Depth factor for the back wall plane (typically 0.2 - 0.5) */
  wallDepth?: number;
  /** Y pixel coordinate where character feet anchor onto the floor (e.g. 890) */
  floorBaselineY?: number;
  /** Y pixel coordinate for ceiling molding / top trim boundary */
  ceilingTrimY?: number;
  /** Perspective vanishing point in canvas coordinates (e.g. { x: 960, y: 540 }) */
  perspectiveVanishingPoint?: {
    x: number;
    y: number;
  };
}

export interface EnvironmentLayer {
  id: string;
  name?: string;
  /** Asset ID in manifest. Omit if this layer is a grouping container or custom component. */
  assetId?: string;
  /**
   * Depth plane factor:
   * < 1.0 : background (e.g. 0.2 = sky, 0.5 = distant skyline)
   * 1.0   : midground focal plane (1:1 camera tracking)
   * > 1.0 : foreground (e.g. 1.4 = streetlights, 1.6 = framing foliage)
   */
  depth: number;
  /** Render sort order (lower rendered behind, higher in front) */
  order: number;
  /** Layer plane category for occlusion and character staging */
  plane?: EnvironmentLayerPlane;
  /** Position, scaling, and rotation */
  transform: LayerTransform;
  /** Optional motion preset */
  animationPreset?: 'gentle-sway' | 'drift-slow' | 'flicker-subtle' | string;
  /** Child layers inheriting parent transform */
  children?: EnvironmentLayer[];
  /** Optional custom React node for custom visual layers */
  customContent?: React.ReactNode;
}

export interface EnvironmentDefinition {
  id: string;
  name: string;
  domain?: EnvironmentDomain;
  description?: string;
  backgroundColor?: string;
  grammar?: RoomGrammar;
  layers: EnvironmentLayer[];
}

export interface ResolvedEnvironmentLayer {
  layer: EnvironmentLayer;
  asset?: AssetManifestEntry;
  worldX: number;
  worldY: number;
  worldScaleX: number;
  worldScaleY: number;
  worldRotation: number;
  worldOpacity: number;
  computedZIndex: number;
}
