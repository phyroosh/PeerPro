import { CharacterDefinition } from '../characters/types';
import { InteractionAnchor } from './types';

export interface CharacterAnchorContext {
  x?: number;
  y?: number;
  scale?: number;
  flipX?: boolean;
  rootOffsetY?: number;
  jointRotations?: {
    armLeft?: number;
    armRight?: number;
    headTilt?: number;
    torsoTilt?: number;
  };
  activePartOverrides?: Record<string, string>;
}

export interface PropAnchorDefinition {
  width: number;
  height: number;
  anchor: { x: number; y: number };
  sockets?: Record<string, { x: number; y: number }>;
}

/**
 * Standard known prop anchor specifications for starter assets.
 */
export const KNOWN_PROP_ANCHORS: Record<string, Record<string, { x: number; y: number }>> = {
  'starter-prop-umbrella': {
    grip: { x: 160, y: 280 },
    tip: { x: 160, y: 20 },
  },
  'starter-env-classroom-chair': {
    seat_surface: { x: 80, y: 140 },
    backrest: { x: 80, y: 40 },
  },
  'starter-env-classroom-desk': {
    surface: { x: 160, y: 80 },
    shelf: { x: 160, y: 180 },
  },
};

/**
 * Resolves character interaction anchors dynamically based on
 * current forward-kinematic limb rotations and breathing displacement.
 */
export function resolveCharacterAnchor(
  definition: CharacterDefinition,
  anchorName: string,
  context: CharacterAnchorContext = {}
): InteractionAnchor {
  const charX = context.x ?? 0;
  const charY = context.y ?? 0;
  const scale = (context.scale ?? 1.0) * (definition.defaultScale ?? 1.0);
  const flipMultiplier = context.flipX ? -1 : 1;
  const rootY = context.rootOffsetY ?? 0;

  const armLRot = (context.jointRotations?.armLeft ?? 0) * (Math.PI / 180);
  const armRRot = (context.jointRotations?.armRight ?? 0) * (Math.PI / 180);
  const headRot = (context.jointRotations?.headTilt ?? 0);

  // Standard Torso Geometry: 300x600, anchor (0.5, 1.0) -> rootLocal = (-150, -600)
  // Right shoulder socket on torso: (228, 128) -> localX = 78, localY = -472
  // Left shoulder socket on torso: (72, 128) -> localX = -78, localY = -472
  // Neck socket on torso: (150, 95) -> localX = 0, localY = -505
  // Seat base on hips: localX = 0, localY = 0

  switch (anchorName) {
    case 'hand_right': {
      // Determine if arm is currently in a waving, pointing, or idle posture
      const isWave = context.activePartOverrides?.armsRight?.includes('wave');
      const isPoint = context.activePartOverrides?.armsRight?.includes('point');

      let handRelX = 0;
      let handRelY = 180; // default idle arm length down from shoulder

      if (isWave) {
        // Raised waving forearm
        handRelX = 15;
        handRelY = -155;
      } else if (isPoint) {
        handRelX = 140;
        handRelY = -10;
      }

      // Rotate hand position around shoulder pivot by armRight angle
      const rotX = handRelX * Math.cos(armRRot) - handRelY * Math.sin(armRRot);
      const rotY = handRelX * Math.sin(armRRot) + handRelY * Math.cos(armRRot);

      const localX = 78 + rotX;
      const localY = -472 + rotY + rootY;

      return {
        name: 'hand_right',
        x: charX + localX * scale * flipMultiplier,
        y: charY + localY * scale,
        rotation: (context.jointRotations?.armRight ?? 0) * flipMultiplier,
        space: 'world',
      };
    }

    case 'hand_left': {
      const isTalk = context.activePartOverrides?.armsLeft?.includes('talk');
      let handRelX = 0;
      let handRelY = 180;

      if (isTalk) {
        // Bent arm near lapel
        handRelX = 35;
        handRelY = 110;
      }

      const rotX = handRelX * Math.cos(armLRot) - handRelY * Math.sin(armLRot);
      const rotY = handRelX * Math.sin(armLRot) + handRelY * Math.cos(armLRot);

      const localX = -78 + rotX;
      const localY = -472 + rotY + rootY;

      return {
        name: 'hand_left',
        x: charX + localX * scale * flipMultiplier,
        y: charY + localY * scale,
        rotation: (context.jointRotations?.armLeft ?? 0) * flipMultiplier,
        space: 'world',
      };
    }

    case 'seat_base': {
      return {
        name: 'seat_base',
        x: charX,
        y: charY + rootY * scale,
        rotation: 0,
        space: 'world',
      };
    }

    case 'eye_level':
    case 'gaze_target': {
      const localY = -505 - 120 + rootY; // Eyes socket above neck
      return {
        name: anchorName,
        x: charX,
        y: charY + localY * scale,
        rotation: headRot * flipMultiplier,
        space: 'world',
      };
    }

    default:
      // Fallback to character origin
      return {
        name: anchorName,
        x: charX,
        y: charY,
        rotation: 0,
        space: 'world',
      };
  }
}

/**
 * Resolves the offset of a named socket on a target prop relative to its anchor origin.
 */
export function resolvePropSocketOffset(
  propId: string,
  socketName: string,
  fallbackProp?: PropAnchorDefinition
): { x: number; y: number } {
  // Check known catalog
  const known = KNOWN_PROP_ANCHORS[propId];
  if (known && known[socketName]) {
    const pt = known[socketName];
    // Return relative to prop anchor
    if (propId === 'starter-prop-umbrella') {
      // 320x320, anchor (0.5, 0.88) -> anchor point is (160, 281.6)
      return { x: pt.x - 160, y: pt.y - 280 };
    }
    if (propId === 'starter-env-classroom-chair') {
      // 160x260, anchor (0.5, 1.0) -> anchor point is (80, 260)
      return { x: pt.x - 80, y: pt.y - 260 };
    }
    if (propId === 'starter-env-classroom-desk') {
      // 320x300, anchor (0.5, 1.0) -> anchor point is (160, 300)
      return { x: pt.x - 160, y: pt.y - 300 };
    }
  }

  // Check fallback definition
  if (fallbackProp?.sockets && fallbackProp.sockets[socketName]) {
    const pt = fallbackProp.sockets[socketName];
    const anchorX = fallbackProp.width * fallbackProp.anchor.x;
    const anchorY = fallbackProp.height * fallbackProp.anchor.y;
    return { x: pt.x - anchorX, y: pt.y - anchorY };
  }

  return { x: 0, y: 0 };
}
