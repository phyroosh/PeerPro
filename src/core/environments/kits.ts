import { EnvironmentDomain } from './types';

export type KitViewConvention =
  | 'front_orthographic'
  | '2.5d_stage'
  | 'cinematic_three_quarter';

export type CameraMotionCapability = 'pan_x' | 'truck_z' | 'pedestal_y';

export interface DepthRange {
  min: number;
  max: number;
  focalPlane: number;
}

export interface KitBackdropSpec {
  skyAssetId?: string;
  groundAssetId?: string;
  wallAssetId?: string;
  defaultBgColor: string;
}

export interface EnvironmentKitDefinition {
  id: string;
  name: string;
  domain: EnvironmentDomain;
  description: string;
  viewConvention: KitViewConvention;
  perspectiveFamily: string;
  groundLineY: number;
  supportedDepths: DepthRange;
  scaleConvention: number;
  allowedCameraDirections: CameraMotionCapability[];
  backdrop: KitBackdropSpec;
  tags: string[];
}

/**
 * Japanese Street Kit Specification (Outdoor)
 * Calibrated for 2.5D Japanese street composition, storefronts, sidewalks, and residential alleys.
 */
export const japaneseStreetKit: EnvironmentKitDefinition = {
  id: 'japanese-street-kit',
  name: 'Japanese Street & City Kit',
  domain: 'outdoor',
  description:
    'Calibrated 2.5D Japanese street environment with storefront facades, apartments, streetlights, and cherry trees.',
  viewConvention: '2.5d_stage',
  perspectiveFamily: 'anime-clean-v1',
  groundLineY: 880,
  supportedDepths: {
    min: 0.2, // Distant sky plate
    max: 1.6, // Foreground framing foliage / streetlamps
    focalPlane: 1.0,
  },
  scaleConvention: 1.0,
  allowedCameraDirections: ['pan_x', 'truck_z', 'pedestal_y'],
  backdrop: {
    skyAssetId: 'starter-env-sky-dusk',
    groundAssetId: 'starter-env-road-segment',
    defaultBgColor: '#090d16',
  },
  tags: ['outdoor', 'street', 'city', 'tokyo', 'japan'],
};

/**
 * Japanese Classroom Kit Specification (Indoor)
 * Calibrated for indoor classroom staging with floorboards, chalkboard, desks, and windows.
 */
export const japaneseClassroomKit: EnvironmentKitDefinition = {
  id: 'classroom-kit',
  name: 'Japanese High School Classroom Kit',
  domain: 'indoor',
  description:
    'Calibrated indoor classroom environment with wall planes, wood floor, blackboard, lectern, and student desks.',
  viewConvention: '2.5d_stage',
  perspectiveFamily: 'anime-clean-v1',
  groundLineY: 890,
  supportedDepths: {
    min: 0.3, // Back wall & blackboard
    max: 1.4, // Foreground student desks / framing
    focalPlane: 1.0, // Midground character desk row
  },
  scaleConvention: 1.0,
  allowedCameraDirections: ['pan_x', 'pedestal_y'],
  backdrop: {
    wallAssetId: 'starter-env-classroom-wall',
    groundAssetId: 'starter-env-classroom-floor',
    defaultBgColor: '#0f172a',
  },
  tags: ['indoor', 'classroom', 'school', 'japan'],
};

export const defaultEnvironmentKits: Record<string, EnvironmentKitDefinition> = {
  'japanese-street-kit': japaneseStreetKit,
  'classroom-kit': japaneseClassroomKit,
};

export function getKitDefinition(kitId: string): EnvironmentKitDefinition {
  const kit = defaultEnvironmentKits[kitId];
  if (!kit) {
    throw new Error(
      `Unknown environment kit "${kitId}". Available kits: ${Object.keys(
        defaultEnvironmentKits
      ).join(', ')}`
    );
  }
  return kit;
}
