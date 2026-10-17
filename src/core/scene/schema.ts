import { z } from 'zod';
import { CharacterDefinitionSchema } from '../characters/schema';
import { EnvironmentDefinitionSchema } from '../environments/schema';
import { CharacterActionClipSchema } from '../animation/actions.schema';

export const SceneCanvasSchema = z.object({
  width: z.number().positive().default(1920).optional(),
  height: z.number().positive().default(1080).optional(),
  fps: z.number().positive().default(30).optional(),
  durationInFrames: z.number().positive().default(150).optional(),
  backgroundColor: z.string().optional(),
});

export const SceneCameraSchema = z.object({
  preset: z.enum([
    'static',
    'slow-push-in',
    'slow-pull-out',
    'pan-left-to-right',
    'pan-right-to-left',
    'tilt-up',
    'tilt-down',
    'tracking',
    'custom',
  ]),
  intensity: z.number().min(0).max(2).default(1.0).optional(),
  focalDepth: z.number().positive().default(1.0).optional(),
  bounds: z
    .object({
      maxDisplacementX: z.number().positive().optional(),
      maxDisplacementY: z.number().positive().optional(),
      minZoom: z.number().positive().optional(),
      maxZoom: z.number().positive().optional(),
    })
    .optional(),
  depthOfField: z
    .object({
      enabled: z.boolean(),
      aperture: z.number().positive().optional(),
      focalDepth: z.number().positive().optional(),
      maxBlur: z.number().positive().optional(),
    })
    .optional(),
  shake: z
    .object({
      enabled: z.boolean(),
      frequency: z.number().positive().optional(),
      amplitudeX: z.number().optional(),
      amplitudeY: z.number().optional(),
      rotational: z.number().optional(),
    })
    .optional(),
  atmosphericHaze: z
    .object({
      enabled: z.boolean(),
      color: z.string().optional(),
      density: z.number().min(0).max(1).optional(),
      minDepth: z.number().positive().optional(),
    })
    .optional(),
});

export const SceneEnvironmentSchema = z
  .object({
    preset: z.string().optional(),
    custom: EnvironmentDefinitionSchema.optional(),
  })
  .refine((data) => data.preset !== undefined || data.custom !== undefined, {
    message: 'Environment must define either a preset name or a custom environment definition.',
  });

export const SceneCharacterAnimationSchema = z.object({
  breathing: z
    .object({
      frequency: z.number().positive().optional(),
      amplitude: z.number().optional(),
      scaleYAmount: z.number().optional(),
      enabled: z.boolean().optional(),
    })
    .optional(),
  headTilt: z
    .object({
      frequency: z.number().positive().optional(),
      maxAngle: z.number().optional(),
      enabled: z.boolean().optional(),
    })
    .optional(),
  expressionSchedule: z
    .array(
      z.object({
        startFrame: z.number().min(0),
        eyes: z.string().optional(),
        mouth: z.string().optional(),
      })
    )
    .optional(),
  actions: z.array(CharacterActionClipSchema).optional(),
});

export const SceneCharacterInstanceSchema = z.object({
  id: z.string().min(1, 'Character instance ID must be non-empty'),
  characterId: z.string().optional(),
  customDefinition: CharacterDefinitionSchema.optional(),
  variant: z.string().optional(),
  depth: z.number().default(1.0).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  scale: z.number().positive().default(1.0).optional(),
  flipX: z.boolean().default(false).optional(),
  rotation: z.number().default(0).optional(),
  opacity: z.number().min(0).max(1).default(1.0).optional(),
  partOverrides: z.record(z.string(), z.string()).optional(),
  animation: SceneCharacterAnimationSchema.optional(),
}).refine((data) => data.characterId !== undefined || data.customDefinition !== undefined, {
  message: 'Character instance must specify either a characterId (preset) or a customDefinition.',
});

export const SceneEffectSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['petals', 'rain']),
  depth: z.number().default(1.3).optional(),
  count: z.number().positive().optional(),
  color: z.string().optional(),
  seed: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  speed: z.number().positive().optional(),
  angle: z.number().optional(),
});

export const SceneDialogLineSchema = z.object({
  id: z.string().min(1, 'Dialog ID must be non-empty'),
  characterId: z.string().optional(),
  speaker: z.string().optional(),
  text: z.string().min(1, 'Dialog text must be non-empty'),
  startFrame: z.number().min(0),
  endFrame: z.number().min(0),
  position: z.enum(['bottom', 'top']).default('bottom').optional(),
}).refine((data) => data.endFrame >= data.startFrame, {
  message: 'Dialog endFrame must be greater than or equal to startFrame.',
});

export const SceneManifestSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().min(1, 'Scene manifest ID must be non-empty'),
  name: z.string().min(1, 'Scene manifest name must be non-empty'),
  description: z.string().optional(),
  canvas: SceneCanvasSchema.optional(),
  camera: SceneCameraSchema.optional(),
  environment: SceneEnvironmentSchema.optional(),
  characters: z.array(SceneCharacterInstanceSchema).optional(),
  effects: z.array(SceneEffectSchema).optional(),
  dialog: z.array(SceneDialogLineSchema).optional(),
});
