import { z } from 'zod';

export const LayerTransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.union([z.number().positive(), z.tuple([z.number().positive(), z.number().positive()])]).optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  flipX: z.boolean().optional(),
  anchor: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
});

export type EnvironmentLayerZodType = z.infer<typeof BaseEnvironmentLayerSchema> & {
  children?: EnvironmentLayerZodType[];
};

const BaseEnvironmentLayerSchema = z.object({
  id: z.string().min(1, 'Layer ID must be non-empty'),
  name: z.string().optional(),
  assetId: z.string().optional(),
  depth: z.number(),
  order: z.number(),
  plane: z.enum(['background', 'mid_back', 'character_occluder', 'foreground']).optional(),
  transform: LayerTransformSchema,
  animationPreset: z.string().optional(),
});

export const EnvironmentLayerSchema: z.ZodType<any> = BaseEnvironmentLayerSchema.extend({
  children: z.lazy(() => z.array(EnvironmentLayerSchema)).optional(),
});

export const RoomGrammarSchema = z.object({
  wallDepth: z.number().optional(),
  floorBaselineY: z.number().optional(),
  ceilingTrimY: z.number().optional(),
  perspectiveVanishingPoint: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const EnvironmentDefinitionSchema = z.object({
  id: z.string().min(1, 'Environment ID must be non-empty'),
  name: z.string().min(1, 'Environment name must be non-empty'),
  domain: z.enum(['outdoor', 'indoor', 'hybrid']).optional(),
  description: z.string().optional(),
  backgroundColor: z.string().optional(),
  grammar: RoomGrammarSchema.optional(),
  layers: z.array(EnvironmentLayerSchema).min(1, 'Environment must define at least one layer'),
});
