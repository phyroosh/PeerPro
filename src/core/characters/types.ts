import { AssetManifestEntry } from '../assets/types';
import { RigProfile, JointLimit } from './rigs/types';

export type CharacterSlotName =
  | 'rootPart'
  | 'head'
  | 'hairBack'
  | 'hairFront'
  | 'eyes'
  | 'mouth'
  | 'clothing'
  | 'armsLeft'
  | 'armsRight'
  | 'accessory';

export interface CharacterPartRef {
  assetId: string;
  offset?: {
    x?: number;
    y?: number;
  };
  scale?: number;
  rotation?: number;
  opacity?: number;
}

export interface CharacterVariant {
  name: string;
  overrides: Partial<Record<CharacterSlotName, string>>;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  styleFamily: string;
  defaultScale?: number;
  rootPart: CharacterPartRef;
  slots: Partial<Record<Exclude<CharacterSlotName, 'rootPart'>, CharacterPartRef>>;
  layerOrder: string[];
  variants?: Record<string, CharacterVariant>;
  rigProfile?: RigProfile;
  jointLimits?: Record<string, JointLimit>;
}

export type CharacterPoseName =
  | 'idle'
  | 'talk_gesture'
  | 'wave'
  | 'point'
  | 'thinking'
  | 'crossed';

export interface CharacterJointRotations {
  armLeft?: number;
  armRight?: number;
  headTilt?: number;
}

export interface CharacterIdentity {
  id: string;
  name: string;
  styleFamily: string;
  baseDefinitionId: string;
  defaultVariant?: string;
  defaultPose?: CharacterPoseName;
  rigProfile?: RigProfile;
  traits?: {
    hairColor?: string;
    eyeColor?: string;
    heightScale?: number;
  };
}

export interface ResolvedCharacterPart {
  slot: CharacterSlotName | string;
  asset: AssetManifestEntry;
  x: number; // local X offset relative to character anchor
  y: number; // local Y offset relative to character anchor
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  pivot?: {
    x: number;
    y: number;
  };
}

export interface CharacterProps {
  definition: CharacterDefinition;
  variant?: string;
  pose?: CharacterPoseName;
  jointRotations?: CharacterJointRotations;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  flipX?: boolean;
  style?: React.CSSProperties;
}
