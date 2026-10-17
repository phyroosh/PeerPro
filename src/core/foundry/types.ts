import {
  AssetCategory,
  AssetFormat,
  AssetKind,
  AssetManifestEntry,
  AssetProvenance,
  AssetStyle,
  AssetViewAngle,
  AttachmentSocket,
} from '../assets/types';

export type IngestionLifecycleState =
  | 'candidate'
  | 'inspected'
  | 'normalized'
  | 'metadata_complete'
  | 'compatibility_tested'
  | 'approved'
  | 'rejected';

export interface AssetIngestionCandidate {
  sourcePath: string;
  targetId: string;
  name: string;
  kind: AssetKind;
  category: AssetCategory;
  styleFamily?: string;
  viewAngle?: AssetViewAngle;
  variant?: string;
  anchor?: {
    x: number;
    y: number;
  };
  attachmentSockets?: Record<string, AttachmentSocket>;
  requiredSockets?: string[];
  tags: string[];
  provenance: AssetProvenance;
  targetPackId?: string;
  targetSubdir?: string; // relative to publicDir, e.g. 'peerpro-assets/starter'
}

export interface InspectionCheckResult {
  check: string;
  passed: boolean;
  details: string;
}

export interface InspectionReport {
  valid: boolean;
  format: AssetFormat;
  dimensions: {
    width: number;
    height: number;
  };
  viewBox?: string;
  hasAlpha: boolean;
  fileSizeBytes: number;
  checks: InspectionCheckResult[];
  warnings: string[];
  errors: string[];
}

export interface IngestionOptions {
  dryRun?: boolean;
  publicDir?: string;
  assetPacksDir?: string;
  updateIndex?: boolean;
}

export interface IngestionReceipt {
  assetId: string;
  packId: string;
  sourcePath: string;
  targetPath: string;
  publicRelativePath: string;
  lifecycleState: IngestionLifecycleState;
  timestamp: string;
  inspection: InspectionReport;
  manifestEntry: AssetManifestEntry;
}

export interface IngestionResult {
  success: boolean;
  receipt?: IngestionReceipt;
  errors: string[];
  warnings: string[];
}

