export type AssetKind =
  | 'character_part'
  | 'environment_layer'
  | 'prop'
  | 'effect';

export type AssetCategory =
  | 'base_body'
  | 'head'
  | 'hair'
  | 'eyes'
  | 'mouth'
  | 'expression'
  | 'clothing'
  | 'arms'
  | 'accessory'
  | 'building'
  | 'facade'
  | 'road'
  | 'sidewalk'
  | 'sign'
  | 'foliage'
  | 'prop'
  | 'sky'
  | 'atmosphere';

export type AssetFormat = 'svg' | 'png' | 'webp' | 'component';

export type AssetCapability = 'scalable' | 'tintable' | 'flip_x' | 'flip_y';

export interface AttachmentSocket {
  x: number;
  y: number;
  rotation?: number;
}

export interface AssetProvenance {
  source: 'original' | 'licensed' | 'public-domain' | 'third-party';
  license: string;
  author: string;
  notes?: string;
}

export interface AssetManifestEntry {
  id: string;
  name: string;
  kind: AssetKind;
  category: AssetCategory;
  path: string;
  format: AssetFormat;
  dimensions: {
    width: number;
    height: number;
  };
  hasAlpha: boolean;
  style: {
    family: string;
    variant?: string;
  };
  anchor: {
    x: number;
    y: number;
  };
  attachmentSockets?: Record<string, AttachmentSocket>;
  requiredSockets?: string[];
  capabilities?: AssetCapability[];
  tags: string[];
  provenance: AssetProvenance;
}

export interface AssetPackManifest {
  packId: string;
  name: string;
  version: string;
  styleFamily: string;
  description?: string;
  assets: AssetManifestEntry[];
}

export interface AssetFilter {
  kind?: AssetKind;
  category?: AssetCategory;
  tag?: string;
  styleFamily?: string;
}

export type ValidationErrorCode =
  | 'SCHEMA_ERROR'
  | 'MISSING_FILE'
  | 'DUPLICATE_ID'
  | 'UNSAFE_PATH'
  | 'INVALID_COORDINATES'
  | 'UNKNOWN_PROVENANCE'
  | 'STYLE_MISMATCH';

export interface ValidationError {
  path: string;
  code: ValidationErrorCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
