import { z } from 'zod';

export const CharacterPartRefSchema = z.object({
  assetId: z.string().min(1, 'assetId must be non-empty'),
  offset: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .optional(),
  scale: z.number().positive().optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const CharacterVariantSchema = z.object({
  name: z.string().min(1),
  overrides: z.record(z.string(), z.string()),
});

export const CharacterDefinitionSchema = z.object({
  id: z.string().min(1, 'Character ID must be non-empty'),
  name: z.string().min(1, 'Character name must be non-empty'),
  styleFamily: z.string().min(1, 'styleFamily must be specified'),
  defaultScale: z.number().positive().optional().default(1.0),
  rootPart: CharacterPartRefSchema,
  slots: z.record(z.string(), CharacterPartRefSchema).optional().default({}),
  layerOrder: z.array(z.string()).min(1, 'layerOrder must contain at least one layer'),
  variants: z.record(z.string(), CharacterVariantSchema).optional(),
});
