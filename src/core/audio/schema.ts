import { z } from 'zod';

export const AudioTrackTypeSchema = z.enum(['bgm', 'ambient', 'sfx', 'voiceover']);

export const SceneAudioTrackSchema = z.object({
  id: z.string().min(1, 'Audio track id must not be empty'),
  type: AudioTrackTypeSchema,
  src: z.string().optional(),
  assetId: z.string().optional(),
  startFrame: z.number().int().min(0, 'startFrame must be non-negative'),
  durationInFrames: z.number().int().positive('durationInFrames must be positive').optional(),
  volume: z.number().min(0).max(1.0).default(1.0).optional(),
  fadeInFrames: z.number().int().min(0).default(0).optional(),
  fadeOutFrames: z.number().int().min(0).default(0).optional(),
  duckUnderDialog: z.boolean().optional(),
  duckFactor: z.number().min(0).max(1.0).default(0.35).optional(),
  loop: z.boolean().default(false).optional(),
  playbackRate: z.number().positive().default(1.0).optional(),
});

export const SceneAudioSchema = z.array(SceneAudioTrackSchema);
