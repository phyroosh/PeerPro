import fs from 'fs';
import path from 'path';
import {
  AssetCapability,
  AssetManifestEntry,
  AssetPackManifest,
} from '../assets/types';
import { validateAssetPackManifest } from '../assets/validator';
import { inspectCandidate } from './inspector';
import { normalizeCandidate } from './normalizer';
import {
  AssetIngestionCandidate,
  IngestionOptions,
  IngestionReceipt,
  IngestionResult,
} from './types';

/**
 * 6-stage lifecycle executor for ingesting candidate assets into PeerPro asset packs:
 * 1. candidate: Input candidate specification verified.
 * 2. inspected: Automated pre-flight inspection runs.
 * 3. normalized: Asset is sanitized and normalized.
 * 4. metadata_complete: AssetManifestEntry is assembled with sockets, anchors, and provenance.
 * 5. compatibility_tested: Schema & pack integrity validation runs against candidate.
 * 6. approved: Asset file is written to public assets, manifest updated, and audit receipt saved.
 */
export function ingestAsset(
  candidate: AssetIngestionCandidate,
  options: IngestionOptions = {}
): IngestionResult {
  const errors: string[] = [];
  const allWarnings: string[] = [];

  const projectRoot = process.cwd();
  const publicDir = options.publicDir || path.resolve(projectRoot, 'public');
  const assetPacksDir = options.assetPacksDir || path.resolve(projectRoot, 'asset-packs');
  const packId = candidate.targetPackId || 'starter-kit';

  // --- Stage 1 & 2: Candidate & Inspection ---
  const inspection = inspectCandidate(candidate, { publicDir, assetPacksDir });
  allWarnings.push(...inspection.warnings);

  if (!inspection.valid) {
    return {
      success: false,
      errors: inspection.errors,
      warnings: allWarnings,
    };
  }

  // Check manifest directly for duplicate ID
  const manifestPath = path.join(assetPacksDir, packId, 'manifest.json');
  let packManifest: AssetPackManifest;

  if (fs.existsSync(manifestPath)) {
    try {
      packManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err: any) {
      return {
        success: false,
        errors: [`Failed to parse pack manifest at ${manifestPath}: ${err.message}`],
        warnings: allWarnings,
      };
    }
  } else {
    // Generate starter skeleton manifest if new pack
    packManifest = {
      packId,
      name: `PeerPro Asset Pack - ${packId}`,
      version: '1.0.0',
      styleFamily: candidate.styleFamily || 'anime-clean-v1',
      description: `Ingested asset pack ${packId}`,
      assets: [],
    };
  }

  if (packManifest.assets.some((a) => a.id === candidate.targetId)) {
    return {
      success: false,
      errors: [`Duplicate asset ID in manifest "${packId}": "${candidate.targetId}" already exists.`],
      warnings: allWarnings,
    };
  }

  // --- Stage 3: Normalization ---
  let rawContent: Buffer | string;
  try {
    if (inspection.format === 'svg') {
      rawContent = fs.readFileSync(candidate.sourcePath, 'utf8');
    } else {
      rawContent = fs.readFileSync(candidate.sourcePath);
    }
  } catch (err: any) {
    return {
      success: false,
      errors: [`Failed to read source file at ${candidate.sourcePath}: ${err.message}`],
      warnings: allWarnings,
    };
  }

  let normalized;
  try {
    normalized = normalizeCandidate(rawContent, inspection);
    allWarnings.push(...normalized.warnings);
  } catch (err: any) {
    return {
      success: false,
      errors: [`Normalization failed: ${err.message}`],
      warnings: allWarnings,
    };
  }

  // --- Stage 4: Metadata Assembly ---
  const ext = normalized.format === 'svg' ? 'svg' : path.extname(candidate.sourcePath).replace('.', '');
  const targetSubdir =
    candidate.targetSubdir ||
    (packId === 'starter-kit' ? 'peerpro-assets/starter' : `peerpro-assets/${packId}`);
  const publicRelativePath = `${targetSubdir}/${candidate.targetId}.${ext}`;
  const targetPath = path.join(publicDir, publicRelativePath);

  const capabilities: AssetCapability[] =
    normalized.format === 'svg' ? ['scalable', 'flip_x'] : ['flip_x'];

  const manifestEntry: AssetManifestEntry = {
    id: candidate.targetId,
    name: candidate.name,
    kind: candidate.kind,
    category: candidate.category,
    path: publicRelativePath,
    format: normalized.format,
    dimensions: normalized.dimensions,
    hasAlpha: inspection.hasAlpha,
    style: {
      family: candidate.styleFamily || packManifest.styleFamily || 'anime-clean-v1',
      angle: candidate.viewAngle,
      variant: candidate.variant,
    },
    anchor: candidate.anchor || { x: 0.5, y: 1.0 },
    attachmentSockets: candidate.attachmentSockets,
    requiredSockets: candidate.requiredSockets,
    capabilities,
    tags: candidate.tags,
    provenance: candidate.provenance,
  };

  // --- Stage 5: Compatibility Testing ---
  const hypotheticalPack: AssetPackManifest = {
    ...packManifest,
    assets: [...packManifest.assets, manifestEntry],
  };

  const validationResult = validateAssetPackManifest(hypotheticalPack, {
    checkFilesExist: false,
  });

  if (!validationResult.valid) {
    const validationErrors = validationResult.errors.map((e) => `[${e.code}] ${e.message}`);
    return {
      success: false,
      errors: validationErrors,
      warnings: allWarnings,
    };
  }

  for (const warning of validationResult.warnings) {
    allWarnings.push(`[${warning.code}] ${warning.message}`);
  }

  // --- Stage 6: Approval & Persistence ---
  const receipt: IngestionReceipt = {
    assetId: candidate.targetId,
    packId,
    sourcePath: candidate.sourcePath,
    targetPath,
    publicRelativePath,
    lifecycleState: 'approved',
    timestamp: new Date().toISOString(),
    inspection,
    manifestEntry,
  };

  if (!options.dryRun) {
    // 1. Write asset file to public directory
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (typeof normalized.content === 'string') {
      fs.writeFileSync(targetPath, normalized.content, 'utf8');
    } else {
      fs.writeFileSync(targetPath, normalized.content);
    }

    // 2. Update pack manifest
    hypotheticalPack.assets.sort((a, b) => a.id.localeCompare(b.id));
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(hypotheticalPack, null, 2), 'utf8');

    // 3. Save receipt
    const receiptsDir = path.join(assetPacksDir, packId, 'receipts');
    fs.mkdirSync(receiptsDir, { recursive: true });
    const receiptPath = path.join(receiptsDir, `${candidate.targetId}.json`);
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
  }

  return {
    success: true,
    receipt,
    errors: [],
    warnings: allWarnings,
  };
}
