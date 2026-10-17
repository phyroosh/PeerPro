import { z } from 'zod';

export const CharacterActionNameSchema = z.enum([
  'idle',
  'bow',
  'wave',
  'talk',
  'point',
  'nod',
  'shake_head',
  'shrug',
  'think',
  'surprise',
  'walk_cycle',
]);

export const ActionClipOptionsSchema = z.object({
  nodCount: z.number().int().positive().optional(),
  bowAngle: z.number().optional(),
  waveFrequency: z.number().positive().optional(),
  pointDirection: z.enum(['high', 'mid', 'low']).optional(),
  shrugHeight: z.number().optional(),
  walkCadence: z.number().positive().optional(),
  intensity: z.number().min(0).max(3).optional(),
}).passthrough();

export const CharacterActionClipSchema = z.object({
  id: z.string().optional(),
  action: CharacterActionNameSchema,
  startFrame: z.number().int().min(0, 'startFrame must be non-negative'),
  durationInFrames: z.number().int().positive('durationInFrames must be greater than zero'),
  blendInFrames: z.number().int().min(0).default(8).optional(),
  blendOutFrames: z.number().int().min(0).default(8).optional(),
  intensity: z.number().min(0).max(3).default(1.0).optional(),
  speed: z.number().positive().default(1.0).optional(),
  options: ActionClipOptionsSchema.optional(),
});
