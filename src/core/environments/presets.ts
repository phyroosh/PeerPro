import { EnvironmentDefinition } from './types';

/**
 * Layout 1: Bustling Tokyo Commercial Street Corner.
 * Features a convenience store with mounted neon sign, adjacent vending machine,
 * background apartment, framing cherry tree, and foreground streetlight.
 */
export const japaneseStreetCornerPreset: EnvironmentDefinition = {
  id: 'japanese-street-corner',
  name: 'Tokyo Street Corner (Dusk)',
  description: 'Commercial street corner with 24H conbini, vending machine, and framing tree.',
  backgroundColor: '#090d16',
  layers: [
    // 1. Background Sky Plate (Depth: 0.2)
    {
      id: 'bg-sky-dusk',
      name: 'Dusk Sky Plate',
      assetId: 'starter-env-sky-dusk',
      depth: 0.2,
      order: 1,
      transform: {
        x: 960,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.0 },
      },
    },

    // 2. Midground Apartment Building (Depth: 0.9)
    {
      id: 'mid-apt-building',
      name: 'Residential Apartment',
      assetId: 'starter-env-building-facade-02',
      depth: 0.9,
      order: 8,
      transform: {
        x: 1300,
        y: 880,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 3. Storefront Group with Mounted Sign & Vending Machine (Depth: 1.0)
    {
      id: 'storefront-group',
      name: 'Conbini Storefront Group',
      assetId: 'starter-env-building-facade-01',
      depth: 1.0,
      order: 10,
      transform: {
        x: 520,
        y: 880,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
      children: [
        // Child: Neon Conbini Sign mounted on building awning
        {
          id: 'conbini-sign-child',
          name: 'Mounted Conbini Sign',
          assetId: 'starter-env-conbini-sign',
          depth: 1.0,
          order: 2,
          transform: {
            x: 0,
            y: -240,
            scale: 0.85,
            anchor: { x: 0.5, y: 0.5 },
          },
        },
        // Child: Vending Machine beside the entrance
        {
          id: 'vending-machine-child',
          name: 'Entrance Vending Machine',
          assetId: 'starter-env-vending-machine',
          depth: 1.0,
          order: 3,
          transform: {
            x: 230,
            y: 0,
            scale: 0.95,
            anchor: { x: 0.5, y: 1.0 },
          },
        },
      ],
    },

    // 4. Ground Asphalt Road & Sidewalk (Depth: 1.0)
    {
      id: 'ground-road',
      name: 'Roadway & Sidewalk',
      assetId: 'starter-env-road-segment',
      depth: 1.0,
      order: 20,
      transform: {
        x: 960,
        y: 1080,
        scale: [1.15, 1.0],
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 5. Foreground Framing Tree (Depth: 1.5)
    {
      id: 'fg-cherry-tree',
      name: 'Framing Sakura Tree',
      assetId: 'starter-env-tree-cherry',
      depth: 1.5,
      order: 30,
      transform: {
        x: 100,
        y: 1080,
        scale: 1.15,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 6. Foreground Streetlight (Depth: 1.4)
    {
      id: 'fg-streetlight',
      name: 'Streetlight Post',
      assetId: 'starter-env-streetlight',
      depth: 1.4,
      order: 35,
      transform: {
        x: 1720,
        y: 1080,
        scale: 1.1,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
};

/**
 * Layout 2: Quiet Japanese Residential Street.
 * Features an open street with a prominent central cherry tree and streetlight,
 * apartment facade, and a close-up foreground vending machine.
 */
export const japaneseQuietStreetPreset: EnvironmentDefinition = {
  id: 'japanese-quiet-street',
  name: 'Quiet Residential Street (Dusk)',
  description: 'Peaceful neighborhood street with central sakura tree and close-up vending machine.',
  backgroundColor: '#090d16',
  layers: [
    // 1. Background Sky Plate (Depth: 0.2)
    {
      id: 'quiet-sky',
      name: 'Dusk Sky Plate',
      assetId: 'starter-env-sky-dusk',
      depth: 0.2,
      order: 1,
      transform: {
        x: 960,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.0 },
      },
    },

    // 2. Far Shop Building (Depth: 0.85)
    {
      id: 'quiet-back-shop',
      name: 'Distant Shop Facade',
      assetId: 'starter-env-building-facade-01',
      depth: 0.85,
      order: 5,
      transform: {
        x: 1540,
        y: 880,
        scale: 0.9,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 3. Apartment Building (Depth: 0.95)
    {
      id: 'quiet-apt-building',
      name: 'Apartment Building',
      assetId: 'starter-env-building-facade-02',
      depth: 0.95,
      order: 8,
      transform: {
        x: 520,
        y: 880,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 4. Central Courtyard Tree (Depth: 1.0)
    {
      id: 'quiet-mid-tree',
      name: 'Courtyard Sakura Tree',
      assetId: 'starter-env-tree-cherry',
      depth: 1.0,
      order: 12,
      transform: {
        x: 960,
        y: 880,
        scale: 0.9,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 5. Streetlight Illuminating Tree (Depth: 1.0)
    {
      id: 'quiet-mid-streetlight',
      name: 'Courtyard Streetlight',
      assetId: 'starter-env-streetlight',
      depth: 1.0,
      order: 14,
      transform: {
        x: 1140,
        y: 880,
        scale: 0.9,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 6. Ground Asphalt Road & Sidewalk (Depth: 1.0)
    {
      id: 'quiet-road',
      name: 'Roadway & Sidewalk',
      assetId: 'starter-env-road-segment',
      depth: 1.0,
      order: 20,
      transform: {
        x: 960,
        y: 1080,
        scale: [1.15, 1.0],
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 7. Foreground Vending Machine Close-up (Depth: 1.6)
    {
      id: 'quiet-fg-vending',
      name: 'Foreground Vending Machine',
      assetId: 'starter-env-vending-machine',
      depth: 1.6,
      order: 30,
      transform: {
        x: 220,
        y: 1080,
        scale: 1.35,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
};

/**
 * Layout 3: High School Japanese Classroom (Daylight).
 * Features an enclosed indoor room with wainscot wood wall, perspective plank floor,
 * blackboard with geometry notes, window overlooking sunny sakura, student desks/chairs,
 * teacher podium, and school clock.
 */
export const japaneseClassroomPreset: EnvironmentDefinition = {
  id: 'japanese-classroom',
  name: 'Japanese High School Classroom (Daylight)',
  domain: 'indoor',
  description: 'Enclosed daytime Japanese classroom with wainscot wall, wood floor, blackboard, window with cherry tree view, student desks, chairs, teacher lectern, and school clock.',
  backgroundColor: '#f1f5f9',
  grammar: {
    wallDepth: 0.35,
    floorBaselineY: 890,
    ceilingTrimY: 42,
    perspectiveVanishingPoint: { x: 960, y: 540 },
  },
  layers: [
    // 1. Back Wall Plane (Depth: 0.35)
    {
      id: 'classroom-wall',
      name: 'Classroom Wainscot Wall',
      assetId: 'starter-env-classroom-wall',
      depth: 0.35,
      order: 2,
      plane: 'background',
      transform: {
        x: 960,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.0 },
      },
    },

    // 2. Multi-pane Window with Outdoor Sakura View (Depth: 0.38)
    {
      id: 'classroom-window',
      name: 'Classroom Window',
      assetId: 'starter-env-classroom-window',
      depth: 0.38,
      order: 5,
      plane: 'mid_back',
      transform: {
        x: 340,
        y: 360,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.5 },
      },
    },

    // 3. Green Magnetic Blackboard (Depth: 0.38)
    {
      id: 'classroom-blackboard',
      name: 'Chalkboard',
      assetId: 'starter-env-classroom-blackboard',
      depth: 0.38,
      order: 8,
      plane: 'mid_back',
      transform: {
        x: 1100,
        y: 350,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.5 },
      },
    },

    // 4. Wall Clock (Depth: 0.38)
    {
      id: 'classroom-clock',
      name: 'School Wall Clock',
      assetId: 'starter-env-classroom-clock',
      depth: 0.38,
      order: 10,
      plane: 'mid_back',
      transform: {
        x: 1560,
        y: 150,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.5 },
      },
    },

    // 5. Hardwood Perspective Floor (Depth: 1.0)
    {
      id: 'classroom-floor',
      name: 'Perspective Wood Floor',
      assetId: 'starter-env-classroom-floor',
      depth: 1.0,
      order: 15,
      plane: 'background',
      transform: {
        x: 960,
        y: 1080,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 6. Student Chair Behind Desk (Depth: 0.96)
    {
      id: 'classroom-student-chair-1',
      name: 'Student Chair',
      assetId: 'starter-env-classroom-chair',
      depth: 0.96,
      order: 24,
      plane: 'mid_back',
      transform: {
        x: 1400,
        y: 890,
        scale: 0.95,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 7. Teacher Presentation Lectern (Depth: 1.02)
    {
      id: 'classroom-teacher-lectern',
      name: 'Teacher Lectern',
      assetId: 'starter-env-classroom-lectern',
      depth: 1.02,
      order: 28,
      plane: 'mid_back',
      transform: {
        x: 500,
        y: 900,
        scale: 0.95,
        anchor: { x: 0.5, y: 1.0 },
      },
    },

    // 8. Foreground Student Desk (Depth: 1.15, Occludes character legs)
    {
      id: 'classroom-student-desk-1',
      name: 'Foreground Student Desk',
      assetId: 'starter-env-classroom-desk',
      depth: 1.15,
      order: 65,
      plane: 'character_occluder',
      transform: {
        x: 1400,
        y: 920,
        scale: 1.0,
        anchor: { x: 0.5, y: 1.0 },
      },
    },
  ],
};

export const defaultEnvironmentPresets: Record<string, EnvironmentDefinition> = {
  'japanese-street-corner': japaneseStreetCornerPreset,
  'japanese-quiet-street': japaneseQuietStreetPreset,
  'japanese-classroom': japaneseClassroomPreset,
};
