import { EnvironmentLayer, EnvironmentLayerPlane, LayerTransform } from './types';

export interface PrefabSlot {
  x: number;
  y: number;
  description?: string;
  allowedAssetTypes?: string[];
}

export interface PrefabSubLayerTemplate {
  subId: string;
  name?: string;
  assetId?: string;
  depthOffset?: number; // Added to prefab root depth
  orderOffset?: number; // Added to prefab root order
  plane?: EnvironmentLayerPlane;
  transform: LayerTransform;
  animationPreset?: string;
}

export interface PrefabVariant {
  name: string;
  description?: string;
  layerOverrides?: Record<string, Partial<LayerTransform>>;
  excludedSubIds?: string[];
}

export interface EnvironmentPrefab {
  id: string;
  name: string;
  kitId: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
  anchor: {
    x: number;
    y: number;
  };
  defaultDepth: number;
  defaultOrder: number;
  plane?: EnvironmentLayerPlane;
  slots?: Record<string, PrefabSlot>;
  subLayers: PrefabSubLayerTemplate[];
  variants?: Record<string, PrefabVariant>;
  tags: string[];
}

/**
 * Prefab 1: Conbini Storefront Cluster
 * Self-contained commercial facade with mounted neon sign and entrance vending machine.
 */
export const storefrontClusterPrefab: EnvironmentPrefab = {
  id: 'prefab-storefront-cluster',
  name: 'Convenience Storefront Cluster',
  kitId: 'japanese-street-kit',
  description:
    '24H convenience store building facade with mounted overhead neon logo sign and entrance vending machine.',
  dimensions: { width: 560, height: 540 },
  anchor: { x: 0.5, y: 1.0 },
  defaultDepth: 1.0,
  defaultOrder: 10,
  plane: 'mid_back',
  slots: {
    facade_sign: { x: 0, y: -240, description: 'Overhead awning sign mount point' },
    entrance_side: { x: 230, y: 0, description: 'Sidewalk entrance equipment spot' },
  },
  subLayers: [
    {
      subId: 'building-facade',
      name: 'Store Building Facade',
      assetId: 'starter-env-building-facade-01',
      orderOffset: 0,
      transform: {
        x: 0,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
    {
      subId: 'mounted-sign',
      name: 'Overhead Conbini Sign',
      assetId: 'starter-env-conbini-sign',
      orderOffset: 2,
      transform: {
        x: 0,
        y: -240,
        scale: 0.85,
        anchor: { x: 0.5, y: 0.5 },
      },
    },
    {
      subId: 'entrance-vending',
      name: 'Entrance Vending Machine',
      assetId: 'starter-env-vending-machine',
      orderOffset: 4,
      transform: {
        x: 230,
        y: 0,
        scale: 0.95,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
  variants: {
    'vending-left': {
      name: 'Vending on Left Side',
      description: 'Places the vending machine on the left side of the entrance.',
      layerOverrides: {
        'entrance-vending': { x: -230, y: 0, flipX: true },
      },
    },
    'vending-right': {
      name: 'Vending on Right Side (Default)',
      description: 'Standard right-side sidewalk placement.',
    },
    'no-vending': {
      name: 'Clean Facade Without Vending',
      description: 'Suppresses vending machine for a minimalist storefront.',
      excludedSubIds: ['entrance-vending'],
    },
  },
  tags: ['street', 'commercial', 'conbini', 'storefront'],
};

/**
 * Prefab 2: Residential Apartment Block
 * Multi-story residential building facade with adjacent cherry tree and evening lantern light.
 */
export const residentialBlockPrefab: EnvironmentPrefab = {
  id: 'prefab-residential-block',
  name: 'Residential Apartment Block',
  kitId: 'japanese-street-kit',
  description:
    'Tokyo apartment building facade framed with a blooming cherry blossom tree and sidewalk streetlight.',
  dimensions: { width: 620, height: 620 },
  anchor: { x: 0.5, y: 1.0 },
  defaultDepth: 0.95,
  defaultOrder: 8,
  plane: 'mid_back',
  subLayers: [
    {
      subId: 'apt-building',
      name: 'Apartment Building Facade',
      assetId: 'starter-env-building-facade-02',
      orderOffset: 0,
      transform: {
        x: 0,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
    {
      subId: 'courtyard-tree',
      name: 'Courtyard Cherry Tree',
      assetId: 'starter-env-tree-cherry',
      depthOffset: 0.05,
      orderOffset: 2,
      transform: {
        x: 240,
        y: 0,
        scale: 0.9,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
    {
      subId: 'sidewalk-lamp',
      name: 'Streetlight',
      assetId: 'starter-env-streetlight',
      depthOffset: 0.15,
      orderOffset: 4,
      transform: {
        x: -220,
        y: 0,
        scale: 0.9,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
  variants: {
    'tree-left': {
      name: 'Tree Left, Lamp Right',
      layerOverrides: {
        'courtyard-tree': { x: -240, y: 0, flipX: true },
        'sidewalk-lamp': { x: 220, y: 0 },
      },
    },
  },
  tags: ['street', 'residential', 'apartment'],
};

/**
 * Prefab 3: Street Furniture Fixture Pair
 * A streetlight paired with a cherry blossom tree for rhythmic sidewalk repetition.
 */
export const streetFurnitureRowPrefab: EnvironmentPrefab = {
  id: 'prefab-street-furniture-pair',
  name: 'Street Furniture Fixture Pair',
  kitId: 'japanese-street-kit',
  description: 'Sidewalk fixture pairing a streetlight and blooming cherry blossom tree.',
  dimensions: { width: 340, height: 420 },
  anchor: { x: 0.5, y: 1.0 },
  defaultDepth: 1.05,
  defaultOrder: 18,
  plane: 'foreground',
  subLayers: [
    {
      subId: 'street-tree',
      name: 'Sidewalk Cherry Tree',
      assetId: 'starter-env-tree-cherry',
      orderOffset: 0,
      transform: {
        x: -90,
        y: 0,
        scale: 0.95,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
    {
      subId: 'street-lamp',
      name: 'Sidewalk Streetlight',
      assetId: 'starter-env-streetlight',
      orderOffset: 2,
      transform: {
        x: 90,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
  tags: ['street', 'furniture', 'lighting', 'foliage'],
};

/**
 * Prefab 4: Classroom Desk Pair Cluster
 * A student desk paired with a classroom chair, with correct occlusion ordering.
 */
export const classroomDeskClusterPrefab: EnvironmentPrefab = {
  id: 'prefab-classroom-desk-cluster',
  name: 'Classroom Desk & Chair Unit',
  kitId: 'classroom-kit',
  description:
    'Standard high school student desk and chair unit with sandwich occlusion (chair < desk).',
  dimensions: { width: 320, height: 320 },
  anchor: { x: 0.5, y: 1.0 },
  defaultDepth: 1.0,
  defaultOrder: 50,
  plane: 'character_occluder',
  subLayers: [
    {
      subId: 'desk-chair',
      name: 'Student Chair',
      assetId: 'starter-env-classroom-chair',
      orderOffset: 0, // Behind character
      transform: {
        x: 0,
        y: 40,
        scale: 0.95,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
    {
      subId: 'student-desk',
      name: 'Student Desk',
      assetId: 'starter-env-classroom-desk',
      orderOffset: 10, // In front of character
      transform: {
        x: 0,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
  tags: ['classroom', 'desk', 'chair', 'indoor'],
};

/**
 * Prefab 5: Classroom Teaching Podium & Blackboard
 * The teacher zone at the front of the classroom with wall blackboard, teacher lectern, and clock.
 */
export const classroomPodiumPrefab: EnvironmentPrefab = {
  id: 'prefab-classroom-podium',
  name: 'Teaching Podium & Blackboard Zone',
  kitId: 'classroom-kit',
  description:
    'Front-of-classroom teaching station with wide chalkboard, elevated teacher lectern, and school clock.',
  dimensions: { width: 800, height: 600 },
  anchor: { x: 0.5, y: 1.0 },
  defaultDepth: 0.5,
  defaultOrder: 15,
  plane: 'mid_back',
  subLayers: [
    {
      subId: 'chalkboard',
      name: 'Classroom Blackboard',
      assetId: 'starter-env-classroom-blackboard',
      depthOffset: -0.15, // Wall plane
      orderOffset: 0,
      transform: {
        x: 0,
        y: -180,
        scale: 1.05,
        anchor: { x: 0.5, y: 0.5 },
      },
    },
    {
      subId: 'wall-clock',
      name: 'Wall Clock',
      assetId: 'starter-env-classroom-clock',
      depthOffset: -0.15,
      orderOffset: 2,
      transform: {
        x: 260,
        y: -360,
        scale: 0.85,
        anchor: { x: 0.5, y: 0.5 },
      },
    },
    {
      subId: 'teacher-lectern',
      name: 'Teacher Lectern / Desk',
      assetId: 'starter-env-classroom-lectern',
      depthOffset: 0.2, // Midground staging
      orderOffset: 6,
      transform: {
        x: -120,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
  tags: ['classroom', 'teaching', 'blackboard', 'podium'],
};

export const defaultPrefabs: Record<string, EnvironmentPrefab> = {
  'prefab-storefront-cluster': storefrontClusterPrefab,
  'prefab-residential-block': residentialBlockPrefab,
  'prefab-street-furniture-pair': streetFurnitureRowPrefab,
  'prefab-classroom-desk-cluster': classroomDeskClusterPrefab,
  'prefab-classroom-podium': classroomPodiumPrefab,
};

export function getPrefab(prefabId: string): EnvironmentPrefab {
  const prefab = defaultPrefabs[prefabId];
  if (!prefab) {
    throw new Error(
      `Unknown environment prefab "${prefabId}". Available prefabs: ${Object.keys(
        defaultPrefabs
      ).join(', ')}`
    );
  }
  return prefab;
}
