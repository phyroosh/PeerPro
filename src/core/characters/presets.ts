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

export const defaultCharacterPresets: Record<string, CharacterDefinition> = {
  'student-ren': studentCharacterDefinition,
};
