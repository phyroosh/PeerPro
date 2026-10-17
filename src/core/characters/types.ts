import { AssetManifestEntry } from '../assets/types';

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
}

export interface CharacterProps {
  definition: CharacterDefinition;
  variant?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  flipX?: boolean;
  style?: React.CSSProperties;
}
