import { z } from 'zod';
import { SceneManifestSchema } from '../scene/schema';

export const ShotTransitionTypeSchema = z.enum([
  'cut',
  'dissolve',
  'fade_to_black',
  'dip_to_white',
]);

export const ShotTransitionSchema = z.object({
  type: ShotTransitionTypeSchema,
  durationInFrames: z.number().int().positive('Transition duration must be at least 1 frame'),
});

export const SequenceShotSchema = z.object({
  id: z.string().min(1, 'Shot id must be non-empty'),
  name: z.string().optional(),
  durationInFrames: z.number().int().positive('Shot duration must be at least 1 frame'),
  transition: ShotTransitionSchema.optional(),
  manifest: SceneManifestSchema,
});

export const SequenceCompositingSchema = z.object({
  vignette: z.boolean().optional(),
  letterbox: z.enum(['none', 'cinemascope', 'standard']).optional(),
  colorGrade: z.enum(['none', 'anime-warm', 'anime-cool', 'golden-hour']).optional(),
});

export const SequenceManifestSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Sequence ID must be kebab-case'),
  name: z.string().min(1, 'Sequence name must be non-empty'),
  description: z.string().optional(),
  fps: z.number().positive().default(30).optional(),
  width: z.number().positive().default(1920).optional(),
  height: z.number().positive().default(1080).optional(),
  shots: z.array(SequenceShotSchema).min(1, 'Sequence must define at least one shot'),
  compositing: SequenceCompositingSchema.optional(),
});
