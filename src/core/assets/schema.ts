import { z } from 'zod';

const KEBAB_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const AttachmentSocketSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
});

export const AssetProvenanceSchema = z.object({
  source: z.enum(['original', 'licensed', 'public-domain', 'third-party']),
  license: z.string().min(1, 'License must be specified (e.g. MIT, CC-BY-4.0)'),
  author: z.string().min(1, 'Author must be specified'),
  notes: z.string().optional(),
});

export const AssetManifestEntrySchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(KEBAB_REGEX, 'Asset ID must be lowercase kebab-case (e.g. starter-char-body-01)'),
  name: z.string().min(1),
  kind: z.enum(['character_part', 'environment_layer', 'prop', 'effect']),
  category: z.enum([
    'base_body',
    'head',
    'hair',
    'eyes',
    'mouth',
    'expression',
    'clothing',
    'arms',
    'accessory',
    'building',
    'facade',
    'road',
    'sidewalk',
    'sign',
    'foliage',
    'prop',
    'sky',
    'atmosphere',
  ]),
  path: z
    .string()
    .min(1)
    .refine((p) => !p.startsWith('/') && !p.includes('..'), {
      message: 'Asset path must be relative to asset root without directory traversal (..) or leading /',
    }),
  format: z.enum(['svg', 'png', 'webp', 'component']),
  dimensions: z.object({
    width: z.number().positive('Width must be greater than 0'),
    height: z.number().positive('Height must be greater than 0'),
  }),
  hasAlpha: z.boolean(),
  style: z.object({
    family: z.string().min(1),
    variant: z.string().optional(),
    angle: z.enum(['front', 'three_quarter', 'profile', 'back']).optional(),
    lighting: z.enum(['neutral', 'daylight', 'sunset', 'night']).optional(),
    paletteId: z.string().optional(),
  }),
  anchor: z.object({
    x: z.number().min(0, 'Anchor X must be >= 0').max(1, 'Anchor X must be <= 1'),
    y: z.number().min(0, 'Anchor Y must be >= 0').max(1, 'Anchor Y must be <= 1'),
  }),
  attachmentSockets: z.record(z.string(), AttachmentSocketSchema).optional(),
  requiredSockets: z.array(z.string()).optional(),
  capabilities: z.array(z.enum(['scalable', 'tintable', 'flip_x', 'flip_y'])).optional(),
  tags: z.array(z.string()).default([]),
  provenance: AssetProvenanceSchema,
});

export const AssetPackManifestSchema = z.object({
  packId: z
    .string()
    .min(1)
    .regex(KEBAB_REGEX, 'packId must be lowercase kebab-case'),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (x.y.z)'),
  styleFamily: z.string().min(1),
  description: z.string().optional(),
  assets: z.array(AssetManifestEntrySchema),
});
