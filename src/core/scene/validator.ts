import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { defaultCharacterPresets } from '../characters/presets';
import { CharacterDefinition } from '../characters/types';
import { defaultEnvironmentPresets } from '../environments/presets';
import { EnvironmentDefinition } from '../environments/types';
import { SceneManifestSchema } from './schema';
import { SceneManifest } from './types';

export interface SceneValidationError {
  code: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface SceneValidationResult {
  valid: boolean;
  errors: SceneValidationError[];
  warnings: string[];
}

export interface SceneValidatorOptions {
  registry?: AssetRegistry;
  characterPresets?: Record<string, CharacterDefinition>;
  environmentPresets?: Record<string, EnvironmentDefinition>;
}

/**
 * Validates a declarative SceneManifest against schema rules and referenced assets/presets.
 */
export function validateSceneManifest(
  manifest: unknown,
  options: SceneValidatorOptions = {}
): SceneValidationResult {
  const errors: SceneValidationError[] = [];
  const warnings: string[] = [];

  const registry = options.registry ?? defaultAssetRegistry;
  const characterPresets = options.characterPresets ?? defaultCharacterPresets;
  const environmentPresets = options.environmentPresets ?? defaultEnvironmentPresets;

  // 1. Zod Schema Validation
  const parseResult = SceneManifestSchema.safeParse(manifest);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push({
        code: 'SCHEMA_ERROR',
        field: issue.path.join('.'),
        message: issue.message,
      });
    }
    return { valid: false, errors, warnings };
  }

  const scene = parseResult.data as SceneManifest;
  const duration = scene.canvas?.durationInFrames ?? 150;

  // 2. Validate Environment
  if (scene.environment) {
    if (scene.environment.preset) {
      const presetName = scene.environment.preset;
      if (!environmentPresets[presetName]) {
        const available = Object.keys(environmentPresets).join(', ');
        errors.push({
          code: 'UNKNOWN_ENV_PRESET',
          field: 'environment.preset',
          message: `Unknown environment preset "${presetName}".`,
          suggestion: `Available presets: ${available}`,
        });
      }
    } else if (scene.environment.custom) {
      for (const layer of scene.environment.custom.layers) {
        if (layer.assetId && !registry.has(layer.assetId)) {
          errors.push({
            code: 'MISSING_ASSET',
            field: `environment.custom.layers.${layer.id}`,
            message: `Custom layer "${layer.id}" references unknown asset "${layer.assetId}".`,
          });
        }
      }
    }
  }

  // 3. Validate Characters
  if (scene.characters) {
    const seenCharIds = new Set<string>();

    for (const char of scene.characters) {
      if (seenCharIds.has(char.id)) {
        errors.push({
          code: 'DUPLICATE_CHARACTER_ID',
          field: `characters.${char.id}`,
          message: `Duplicate character instance ID "${char.id}".`,
          suggestion: 'Ensure each character instance in the scene has a unique id.',
        });
      }
      seenCharIds.add(char.id);

      let charDef: CharacterDefinition | undefined;
      if (char.characterId) {
        charDef = characterPresets[char.characterId];
        if (!charDef) {
          const available = Object.keys(characterPresets).join(', ');
          errors.push({
            code: 'UNKNOWN_CHARACTER_PRESET',
            field: `characters.${char.id}.characterId`,
            message: `Unknown character preset "${char.characterId}".`,
            suggestion: `Available character presets: ${available}`,
          });
        }
      } else if (char.customDefinition) {
        charDef = char.customDefinition;
      }

      if (charDef) {
        // Variant verification
        if (char.variant && char.variant !== 'default') {
          if (!charDef.variants || !charDef.variants[char.variant]) {
            const availableVariants = charDef.variants
              ? Object.keys(charDef.variants).join(', ')
              : 'none';
            errors.push({
              code: 'UNKNOWN_VARIANT',
              field: `characters.${char.id}.variant`,
              message: `Variant "${char.variant}" does not exist on character "${charDef.id}".`,
              suggestion: `Available variants: default, ${availableVariants}`,
            });
          }
        }

        // Part overrides check
        if (char.partOverrides) {
          for (const [slot, assetId] of Object.entries(char.partOverrides)) {
            if (!registry.has(assetId)) {
              errors.push({
                code: 'MISSING_ASSET',
                field: `characters.${char.id}.partOverrides.${slot}`,
                message: `Part override for slot "${slot}" references unknown asset "${assetId}".`,
              });
            }
          }
        }

        // Expression schedule assets check
        if (char.animation?.expressionSchedule) {
          for (const keyframe of char.animation.expressionSchedule) {
            if (keyframe.eyes && !registry.has(keyframe.eyes)) {
              errors.push({
                code: 'MISSING_ASSET',
                field: `characters.${char.id}.animation.expressionSchedule`,
                message: `Expression schedule references unknown eyes asset "${keyframe.eyes}".`,
              });
            }
            if (keyframe.mouth && !registry.has(keyframe.mouth)) {
              errors.push({
                code: 'MISSING_ASSET',
                field: `characters.${char.id}.animation.expressionSchedule`,
                message: `Expression schedule references unknown mouth asset "${keyframe.mouth}".`,
              });
            }
            if (keyframe.startFrame >= duration) {
              warnings.push(
                `Expression keyframe at frame ${keyframe.startFrame} is at or beyond scene duration (${duration} frames).`
              );
            }
          }
        }

        // Action clips check
        if (char.animation?.actions) {
          for (const clip of char.animation.actions) {
            if (clip.startFrame < 0) {
              errors.push({
                code: 'INVALID_ACTION_CLIP',
                field: `characters.${char.id}.animation.actions`,
                message: `Action clip "${clip.action}" has negative startFrame (${clip.startFrame}).`,
              });
            }
            if (clip.durationInFrames <= 0) {
              errors.push({
                code: 'INVALID_ACTION_CLIP',
                field: `characters.${char.id}.animation.actions`,
                message: `Action clip "${clip.action}" has non-positive durationInFrames (${clip.durationInFrames}).`,
              });
            }
            if (clip.startFrame >= duration) {
              warnings.push(
                `Action clip "${clip.action}" starts at frame ${clip.startFrame}, at or beyond scene duration (${duration} frames).`
              );
            }
          }
        }
      }
    }
  }

  // 4. Validate Dialog
  if (scene.dialog) {
    const charIds = new Set((scene.characters || []).map((c) => c.id));

    for (const line of scene.dialog) {
      if (line.characterId && !charIds.has(line.characterId)) {
        warnings.push(
          `Dialog "${line.id}" references character "${line.characterId}" which is not in the characters list.`
        );
      }
      if (line.startFrame >= duration) {
        warnings.push(
          `Dialog "${line.id}" starts at frame ${line.startFrame}, exceeding duration ${duration}.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
