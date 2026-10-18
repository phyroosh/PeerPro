import { CharacterDefinition } from '../characters/types';
import {
  InteractionDefinition,
  ResolvedInteraction,
  Transform2D,
} from './types';
import {
  CharacterAnchorContext,
  PropAnchorDefinition,
  resolveCharacterAnchor,
  resolvePropSocketOffset,
} from './anchors';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface SolveInteractionOptions {
  secondaryCharacterDef?: CharacterDefinition;
  secondaryCharacterContext?: CharacterAnchorContext;
  propDefinition?: PropAnchorDefinition;
  targetRestTransform?: Transform2D;
}

/**
 * Pure mathematical forward-kinematics interaction solver.
 * Calculates exact, zero-drift coordinates for characters and interacting props.
 */
export function solveInteraction(
  interaction: InteractionDefinition,
  characterDef: CharacterDefinition,
  characterContext: CharacterAnchorContext,
  frame: number,
  options: SolveInteractionOptions = {}
): ResolvedInteraction {
  const charX = characterContext.x ?? 0;
  const charY = characterContext.y ?? 0;
  const charScale = characterContext.scale ?? 1.0;
  const charFlipX = characterContext.flipX ?? false;

  const characterTransform: Transform2D = {
    x: charX,
    y: charY,
    rotation: 0,
    scale: charScale,
    flipX: charFlipX,
  };

  const diagnostics: string[] = [];

  // Default target resting transform if prop is unattached
  const defaultRest: Transform2D = options.targetRestTransform ?? {
    x: charX + (charFlipX ? -120 : 120),
    y: interaction.surfaceY ?? charY,
    rotation: 0,
    scale: charScale,
    flipX: charFlipX,
  };

  switch (interaction.type) {
    // ==========================================================
    // 1. HOLD PROP (Continuous Hand-Lock without Drift)
    // ==========================================================
    case 'hold_prop': {
      const charAnchorName = interaction.characterAnchor || 'hand_right';
      const targetAnchorName = interaction.targetAnchor || 'grip';

      const handAnchor = resolveCharacterAnchor(characterDef, charAnchorName, characterContext);
      const propOffset = resolvePropSocketOffset(
        interaction.targetId,
        targetAnchorName,
        options.propDefinition
      );

      const flipMultiplier = charFlipX ? -1 : 1;
      const propScale = charScale;

      const propX = handAnchor.x - propOffset.x * propScale * flipMultiplier;
      const propY = handAnchor.y - propOffset.y * propScale;

      const targetTransform: Transform2D = {
        x: propX,
        y: propY,
        rotation: (handAnchor.rotation ?? 0),
        scale: propScale,
        flipX: charFlipX,
      };

      const effectiveLayerOrder = interaction.holdLayer === 'behind' ? 40 : 125;

      return {
        frame,
        interactionId: interaction.id,
        type: 'hold_prop',
        characterTransform,
        targetTransform,
        isAttached: true,
        carrierId: characterDef.id,
        effectiveLayerOrder,
        transitionProgress: 1.0,
        diagnostics,
      };
    }

    // ==========================================================
    // 2. PICK UP (Transition from Ground/Table to Hand)
    // ==========================================================
    case 'pick_up': {
      const charAnchorName = interaction.characterAnchor || 'hand_right';
      const targetAnchorName = interaction.targetAnchor || 'grip';
      const transitionFrames = Math.max(1, interaction.transitionFrames ?? 20);

      const handAnchor = resolveCharacterAnchor(characterDef, charAnchorName, characterContext);
      const propOffset = resolvePropSocketOffset(
        interaction.targetId,
        targetAnchorName,
        options.propDefinition
      );

      const flipMultiplier = charFlipX ? -1 : 1;
      const heldX = handAnchor.x - propOffset.x * charScale * flipMultiplier;
      const heldY = handAnchor.y - propOffset.y * charScale;
      const heldRot = handAnchor.rotation ?? 0;

      const localFrame = frame - interaction.startFrame;
      const rawProgress = localFrame / transitionFrames;
      const t = smoothstep(rawProgress);

      const isAttached = rawProgress >= 1.0;
      const curX = lerp(defaultRest.x, heldX, t);
      const curY = lerp(defaultRest.y, heldY, t);
      const curRot = lerp(defaultRest.rotation, heldRot, t);

      return {
        frame,
        interactionId: interaction.id,
        type: 'pick_up',
        characterTransform,
        targetTransform: {
          x: curX,
          y: curY,
          rotation: curRot,
          scale: charScale,
          flipX: charFlipX,
        },
        isAttached,
        carrierId: isAttached ? characterDef.id : 'ground',
        effectiveLayerOrder: 125,
        transitionProgress: t,
        diagnostics,
      };
    }

    // ==========================================================
    // 3. SET DOWN (Transition from Hand to Ground/Table)
    // ==========================================================
    case 'set_down': {
      const charAnchorName = interaction.characterAnchor || 'hand_right';
      const targetAnchorName = interaction.targetAnchor || 'grip';
      const transitionFrames = Math.max(1, interaction.transitionFrames ?? 20);

      const handAnchor = resolveCharacterAnchor(characterDef, charAnchorName, characterContext);
      const propOffset = resolvePropSocketOffset(
        interaction.targetId,
        targetAnchorName,
        options.propDefinition
      );

      const flipMultiplier = charFlipX ? -1 : 1;
      const heldX = handAnchor.x - propOffset.x * charScale * flipMultiplier;
      const heldY = handAnchor.y - propOffset.y * charScale;
      const heldRot = handAnchor.rotation ?? 0;

      const localFrame = frame - interaction.startFrame;
      const rawProgress = localFrame / transitionFrames;
      const t = smoothstep(rawProgress);

      const isAttached = rawProgress < 1.0;
      const curX = lerp(heldX, defaultRest.x, t);
      const curY = lerp(heldY, defaultRest.y, t);
      const curRot = lerp(heldRot, defaultRest.rotation, t);

      return {
        frame,
        interactionId: interaction.id,
        type: 'set_down',
        characterTransform,
        targetTransform: {
          x: curX,
          y: curY,
          rotation: curRot,
          scale: charScale,
          flipX: charFlipX,
        },
        isAttached,
        carrierId: isAttached ? characterDef.id : 'ground',
        effectiveLayerOrder: isAttached ? 125 : 50,
        transitionProgress: t,
        diagnostics,
      };
    }

    // ==========================================================
    // 4. SIT AT SEAT (Align Character Hips to Chair Seat)
    // ==========================================================
    case 'sit_at_seat': {
      // Target is chair. Seat socket offset on chair:
      const seatOffset = resolvePropSocketOffset(
        interaction.targetId,
        interaction.targetAnchor || 'seat_surface',
        options.propDefinition
      );

      // Furniture resting transform
      const chairTransform = { ...defaultRest };
      // Character seat_base aligns to chair seat surface:
      // chair anchor is bottom center. seat is at chairTransform.y + seatOffset.y
      const targetSeatY = chairTransform.y + seatOffset.y;
      const targetSeatX = chairTransform.x + seatOffset.x;

      const seatedCharTransform: Transform2D = {
        ...characterTransform,
        x: targetSeatX,
        y: targetSeatY,
      };

      return {
        frame,
        interactionId: interaction.id,
        type: 'sit_at_seat',
        characterTransform: seatedCharTransform,
        targetTransform: chairTransform,
        isAttached: true,
        carrierId: interaction.targetId,
        effectiveLayerOrder: 60, // Character sits in chair
        transitionProgress: 1.0,
        diagnostics,
      };
    }

    // ==========================================================
    // 5. PASS OBJECT (Handoff between Character A & Character B)
    // ==========================================================
    case 'pass_object': {
      const charAnchorName = interaction.characterAnchor || 'hand_right';
      const secAnchorName = interaction.secondaryAnchor || 'hand_left';
      const targetAnchorName = interaction.targetAnchor || 'grip';
      const transitionFrames = Math.max(1, interaction.transitionFrames ?? 25);

      const secDef = options.secondaryCharacterDef ?? characterDef;
      const secContext = options.secondaryCharacterContext ?? {
        x: charX + (charFlipX ? -280 : 280),
        y: charY,
        scale: charScale,
        flipX: !charFlipX,
      };

      const handA = resolveCharacterAnchor(characterDef, charAnchorName, characterContext);
      const handB = resolveCharacterAnchor(secDef, secAnchorName, secContext);

      const propOffset = resolvePropSocketOffset(
        interaction.targetId,
        targetAnchorName,
        options.propDefinition
      );

      const flipA = charFlipX ? -1 : 1;
      const flipB = (secContext.flipX ?? false) ? -1 : 1;

      const heldAX = handA.x - propOffset.x * charScale * flipA;
      const heldAY = handA.y - propOffset.y * charScale;
      const heldARot = handA.rotation ?? 0;

      const heldBX = handB.x - propOffset.x * charScale * flipB;
      const heldBY = handB.y - propOffset.y * charScale;
      const heldBRot = handB.rotation ?? 0;

      const localFrame = frame - interaction.startFrame;
      const rawProgress = localFrame / transitionFrames;
      const t = smoothstep(rawProgress);

      const curX = lerp(heldAX, heldBX, t);
      const curY = lerp(heldAY, heldBY, t);
      const curRot = lerp(heldARot, heldBRot, t);

      const carrierId = rawProgress >= 0.5 ? (interaction.secondaryCharacterId || secDef.id) : characterDef.id;

      return {
        frame,
        interactionId: interaction.id,
        type: 'pass_object',
        characterTransform,
        targetTransform: {
          x: curX,
          y: curY,
          rotation: curRot,
          scale: charScale,
          flipX: rawProgress >= 0.5 ? secContext.flipX : charFlipX,
        },
        secondaryCharacterTransform: {
          x: secContext.x ?? 0,
          y: secContext.y ?? 0,
          rotation: 0,
          scale: secContext.scale ?? 1.0,
          flipX: secContext.flipX ?? false,
        },
        isAttached: true,
        carrierId,
        effectiveLayerOrder: 130,
        transitionProgress: t,
        diagnostics,
      };
    }

    // ==========================================================
    // 6. LOOK AT / POINT TOWARD
    // ==========================================================
    case 'look_at':
    case 'point_toward': {
      const targetPos = defaultRest;
      const deltaX = targetPos.x - charX;
      const deltaY = targetPos.y - (charY - 500); // Eye/torso level

      const shouldFlipX = deltaX < 0;
      const angleDeg = Math.atan2(deltaY, Math.abs(deltaX)) * (180 / Math.PI);
      const clampedTilt = clamp(angleDeg * 0.35, -15, 15);

      const updatedCharTransform: Transform2D = {
        ...characterTransform,
        flipX: shouldFlipX,
        rotation: clampedTilt,
      };

      return {
        frame,
        interactionId: interaction.id,
        type: interaction.type,
        characterTransform: updatedCharTransform,
        targetTransform: defaultRest,
        isAttached: false,
        carrierId: 'none',
        effectiveLayerOrder: 50,
        transitionProgress: 1.0,
        diagnostics,
      };
    }

    default:
      return {
        frame,
        interactionId: interaction.id,
        type: interaction.type,
        characterTransform,
        targetTransform: defaultRest,
        isAttached: false,
        carrierId: 'none',
        effectiveLayerOrder: 50,
        transitionProgress: 0,
        diagnostics: [`Unknown interaction type: ${(interaction as any).type}`],
      };
  }
}
