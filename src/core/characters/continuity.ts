import {
  CharacterIdentity,
  CharacterPoseName,
  CharacterJointRotations,
} from './types';

export interface ShotCharacterContext {
  shotId?: string;
  shotType?: 'wide' | 'medium' | 'close_up' | 'extreme_close_up';
  facingDirection?: 'left' | 'right';
  pose?: CharacterPoseName;
  jointRotations?: CharacterJointRotations;
  expressionVariant?: string;
}

export interface ShotCharacterConfig {
  definitionId: string;
  variant: string;
  pose: CharacterPoseName;
  scale: number;
  flipX: boolean;
  jointRotations?: CharacterJointRotations;
  identity: CharacterIdentity;
}

/**
 * Registry to maintain persistent character identities across multi-shot sequences.
 */
export class CharacterContinuityRegistry {
  private identities = new Map<string, CharacterIdentity>();

  register(identity: CharacterIdentity): void {
    this.identities.set(identity.id, identity);
  }

  get(id: string): CharacterIdentity | undefined {
    return this.identities.get(id);
  }

  has(id: string): boolean {
    return this.identities.has(id);
  }

  list(): CharacterIdentity[] {
    return Array.from(this.identities.values());
  }

  clear(): void {
    this.identities.clear();
  }
}

export const defaultContinuityRegistry = new CharacterContinuityRegistry();

/**
 * Framing scale multipliers for cinematic shot framing.
 */
const SHOT_SCALE_MAP: Record<NonNullable<ShotCharacterContext['shotType']>, number> = {
  wide: 0.85,
  medium: 1.0,
  close_up: 1.6,
  extreme_close_up: 2.2,
};

/**
 * Resolves consistent character presentation parameters for a specific shot
 * while preserving visual identity and physical proportions.
 */
export function createShotCharacterConfig(
  identity: CharacterIdentity,
  context: ShotCharacterContext = {}
): ShotCharacterConfig {
  const baseScale = identity.traits?.heightScale ?? 1.0;
  const framingMultiplier = context.shotType ? SHOT_SCALE_MAP[context.shotType] ?? 1.0 : 1.0;
  const finalScale = baseScale * framingMultiplier;

  return {
    definitionId: identity.baseDefinitionId,
    variant: context.expressionVariant || identity.defaultVariant || 'default',
    pose: context.pose || identity.defaultPose || 'idle',
    scale: finalScale,
    flipX: context.facingDirection === 'left',
    jointRotations: context.jointRotations,
    identity,
  };
}
