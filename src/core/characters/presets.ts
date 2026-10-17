import { CharacterDefinition } from './types';

/**
 * Standard starter character definition: Ren (High School Student).
 * Demonstrates modular part assembly with multiple expression & clothing variants.
 */
export const studentCharacterDefinition: CharacterDefinition = {
  id: 'student-ren',
  name: 'Ren - Student',
  styleFamily: 'anime-clean-v1',
  defaultScale: 1.0,
  rootPart: {
    assetId: 'starter-char-body-01',
  },
  slots: {
    head: { assetId: 'starter-char-head-01' },
    hairFront: { assetId: 'starter-char-hair-short' },
    eyes: { assetId: 'starter-char-eyes-neutral' },
    mouth: { assetId: 'starter-char-mouth-closed' },
  },
  layerOrder: ['rootPart', 'head', 'eyes', 'mouth', 'hairFront'],
  variants: {
    happy: {
      name: 'Happy / Playful',
      overrides: {
        eyes: 'starter-char-eyes-wink',
        mouth: 'starter-char-mouth-smile',
      },
    },
    surprised: {
      name: 'Surprised / Wide-eyed',
      overrides: {
        eyes: 'starter-char-eyes-wide',
        mouth: 'starter-char-mouth-closed',
      },
    },
    casual: {
      name: 'Casual Streetwear',
      overrides: {
        rootPart: 'starter-char-body-02-hoodie',
        hairFront: 'starter-char-hair-spiky',
        eyes: 'starter-char-eyes-wink',
        mouth: 'starter-char-mouth-smile',
      },
    },
  },
};

export const studentCharacterDefinitionV2: CharacterDefinition = {
  id: 'student-ren-v2',
  name: 'Ren - Student (V2 Refined)',
  styleFamily: 'anime-clean-v1',
  defaultScale: 1.0,
  rootPart: {
    assetId: 'starter-char-body-01-v2',
  },
  slots: {
    head: { assetId: 'starter-char-head-01-v2' },
    hairFront: { assetId: 'starter-char-hair-short-v2' },
    eyes: { assetId: 'starter-char-eyes-neutral-v2' },
    mouth: { assetId: 'starter-char-mouth-smile-v2' },
  },
  layerOrder: ['rootPart', 'head', 'eyes', 'mouth', 'hairFront'],
  variants: {
    happy: {
      name: 'Happy / Playful',
      overrides: {
        eyes: 'starter-char-eyes-wink-v2',
        mouth: 'starter-char-mouth-smile-v2',
      },
    },
  },
};

/**
 * 3/4 Perspective character definition for cinematic multi-character staging.
 */
export const studentThreeQuarterDefinition: CharacterDefinition = {
  id: 'student-three-quarter',
  name: 'Ren - Student (3/4 Perspective)',
  styleFamily: 'anime-clean-v1',
  defaultScale: 1.0,
  rootPart: {
    assetId: 'starter-char-body-01-three-quarter',
  },
  slots: {
    head: { assetId: 'starter-char-head-01-three-quarter' },
    hairFront: { assetId: 'starter-char-hair-three-quarter' },
    eyes: { assetId: 'starter-char-eyes-three-quarter' },
    mouth: { assetId: 'starter-char-mouth-three-quarter' },
  },
  layerOrder: ['rootPart', 'head', 'eyes', 'mouth', 'hairFront'],
};

export const defaultCharacterPresets: Record<string, CharacterDefinition> = {
  'student-ren': studentCharacterDefinition,
  'student-ren-v2': studentCharacterDefinitionV2,
  'student-three-quarter': studentThreeQuarterDefinition,
};

