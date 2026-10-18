import { CharacterDefinition } from '../characters/types';
import { inferRigProfile } from '../characters/rigs/profiles';
import {
  InteractionCompatibilityReport,
  InteractionDefinition,
  InteractionFallbackStrategy,
} from './types';
import { KNOWN_PROP_ANCHORS, PropAnchorDefinition } from './anchors';

/**
 * Validates whether a character and target prop can physically execute
 * the requested interaction, identifying missing anchors or unsupported capabilities.
 */
export function validateInteractionCompatibility(
  interaction: InteractionDefinition,
  character: CharacterDefinition,
  targetProp?: PropAnchorDefinition
): InteractionCompatibilityReport {
  const missingAnchors: string[] = [];
  const unsupportedReasons: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let fallbackStrategy: InteractionFallbackStrategy = 'none';

  const rigProfile = inferRigProfile(character);

  // 1. Hand-Based Interactions Check (hold_prop, pick_up, set_down, pass_object)
  if (['hold_prop', 'pick_up', 'set_down', 'pass_object'].includes(interaction.type)) {
    // Face-only characters have no limbs
    if (rigProfile === 'face_only') {
      errors.push(
        `Character "${character.id}" (rig: "face_only") lacks arms and hand anchors required for "${interaction.type}".`
      );
      unsupportedReasons.push('no_hand_anchors');
      fallbackStrategy = 'none';
    } else if (rigProfile === 'pose_swapped') {
      // Pose-swapped characters cannot continuously reach
      warnings.push(
        `Character "${character.id}" (rig: "pose_swapped") does not support continuous FK limb reach; falling back to discrete pose swap.`
      );
      fallbackStrategy = 'pose_swap';
    }

    // Verify Target Prop Socket
    const targetAnchorName = interaction.targetAnchor || 'grip';
    const knownSockets = KNOWN_PROP_ANCHORS[interaction.targetId];

    const hasKnownSocket = Boolean(knownSockets && knownSockets[targetAnchorName]);
    const hasDefSocket = Boolean(targetProp?.sockets && targetProp.sockets[targetAnchorName]);

    if (!hasKnownSocket && !hasDefSocket) {
      warnings.push(
        `Target prop "${interaction.targetId}" does not declare socket "${targetAnchorName}". Falling back to geometric center anchor.`
      );
      missingAnchors.push(targetAnchorName);
      if (fallbackStrategy === 'none') {
        fallbackStrategy = 'snap_to_anchor';
      }
    }
  }

  // 2. Sitting Interaction Check
  if (interaction.type === 'sit_at_seat') {
    if (rigProfile === 'face_only') {
      errors.push(`Character "${character.id}" (rig: "face_only") cannot sit at a seat.`);
      unsupportedReasons.push('cannot_sit');
    }

    const seatSocket = interaction.targetAnchor || 'seat_surface';
    const knownSockets = KNOWN_PROP_ANCHORS[interaction.targetId];
    if (knownSockets && !knownSockets[seatSocket]) {
      warnings.push(`Furniture "${interaction.targetId}" does not define seat socket "${seatSocket}".`);
      missingAnchors.push(seatSocket);
    }
  }

  const compatible = errors.length === 0;

  return {
    compatible,
    interactionId: interaction.id,
    characterId: character.id,
    targetId: interaction.targetId,
    missingAnchors,
    unsupportedReasons,
    fallbackStrategy,
    warnings,
    errors,
  };
}

/**
 * Asserts compatibility and throws if completely incompatible.
 */
export function assertInteractionCompatibility(
  interaction: InteractionDefinition,
  character: CharacterDefinition,
  targetProp?: PropAnchorDefinition
): void {
  const report = validateInteractionCompatibility(interaction, character, targetProp);
  if (!report.compatible) {
    throw new Error(
      `Interaction Incompatibility Error: ${report.errors.join(' | ')}`
    );
  }
}
