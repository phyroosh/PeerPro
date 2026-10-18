import { CharacterDefinition } from '../types';
import { AnimationClip, RigCompatibilityReport, RigProfile } from './types';
import { getRigProfileDefinition, inferRigProfile } from './profiles';

/**
 * Validates whether a character definition can physically and architecturally
 * execute a given animation clip without joint tearing or unsupported movements.
 */
export function validateRigCompatibility(
  character: CharacterDefinition,
  clip: AnimationClip
): RigCompatibilityReport {
  const rigProfile = inferRigProfile(character);
  const rigDef = getRigProfileDefinition(rigProfile);

  const missingSlots: string[] = [];
  const missingCapabilities: string[] = [];
  const unsupportedMovements: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Rig Profile Compatibility
  if (!clip.supportedRigProfiles.includes(rigProfile)) {
    const errorMsg = `Character "${character.id}" (rig: "${rigProfile}") cannot perform clip "${clip.id}". Supported profiles: ${clip.supportedRigProfiles.join(', ')}.`;
    errors.push(errorMsg);
    unsupportedMovements.push(clip.id);
  }

  // 2. Required Slots Check for the Rig Profile
  const availableSlots = new Set<string>();
  if (character.rootPart) availableSlots.add('rootPart');
  if (character.slots) {
    for (const slotKey of Object.keys(character.slots)) {
      availableSlots.add(slotKey);
    }
  }

  for (const reqSlot of rigDef.requiredSlots) {
    if (!availableSlots.has(reqSlot)) {
      missingSlots.push(reqSlot);
      errors.push(`Character "${character.id}" is missing required slot "${reqSlot}" for rig profile "${rigProfile}".`);
    }
  }

  // 3. Required Capabilities Check
  const rigCaps = new Set(rigDef.capabilities);
  if (clip.requiredCapabilities) {
    for (const cap of clip.requiredCapabilities) {
      if (!rigCaps.has(cap)) {
        missingCapabilities.push(cap);
        unsupportedMovements.push(cap);
        errors.push(
          `Clip "${clip.id}" requires capability "${cap}", which is not supported by rig profile "${rigProfile}".`
        );
      }
    }
  }

  // 4. Joint Support Check
  const supportedJoints = new Set(rigDef.supportedJoints);
  if (clip.jointCurves) {
    for (const joint of Object.keys(clip.jointCurves)) {
      if (!supportedJoints.has(joint)) {
        warnings.push(
          `Clip "${clip.id}" animates joint "${joint}", which is not present in rig profile "${rigProfile}" (motion will be ignored).`
        );
      }
    }
  }

  const compatible = errors.length === 0 && missingSlots.length === 0;

  return {
    compatible,
    characterId: character.id,
    rigProfile,
    clipId: clip.id,
    missingSlots,
    missingCapabilities,
    unsupportedMovements,
    warnings,
    errors,
  };
}

/**
 * Asserts compatibility and throws a descriptive error if incompatible.
 */
export function assertRigCompatibility(
  character: CharacterDefinition,
  clip: AnimationClip
): void {
  const report = validateRigCompatibility(character, clip);
  if (!report.compatible) {
    throw new Error(
      `Rig Incompatibility Error: ${report.errors.join(' | ')}`
    );
  }
}
