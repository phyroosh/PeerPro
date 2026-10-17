import { AssetPackManifestSchema } from './schema';
import {
  AssetPackManifest,
  ValidationError,
  ValidationResult,
} from './types';

export interface ValidatorOptions {
  assetRootDirectory?: string;
  checkFilesExist?: boolean;
  fileExists?: (relativePath: string) => boolean;
}

function isDisallowedPath(filePath: string): boolean {
  if (filePath.includes('..')) return true;
  if (filePath.startsWith('/') || filePath.startsWith('\\')) return true;
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) return true; // Windows drive root
  return false;
}

/**
 * Validates an asset pack manifest and verifies integrity, file existence (if checker provided),
 * path containment, and provenance without modifying or deleting files.
 * Browser-safe (no node fs/path imports).
 */
export function validateAssetPackManifest(
  rawManifest: unknown,
  options: ValidatorOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Zod structural & type validation
  const parseResult = AssetPackManifestSchema.safeParse(rawManifest);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push({
        path: issue.path.join('.'),
        code: 'SCHEMA_ERROR',
        message: issue.message,
      });
    }
    return { valid: false, errors, warnings };
  }

  const manifest: AssetPackManifest = parseResult.data;
  const seenIds = new Set<string>();

  for (let i = 0; i < manifest.assets.length; i++) {
    const asset = manifest.assets[i];
    const assetPathPrefix = `assets[${i}](${asset.id})`;

    // 2. Duplicate ID detection
    if (seenIds.has(asset.id)) {
      errors.push({
        path: `${assetPathPrefix}.id`,
        code: 'DUPLICATE_ID',
        message: `Duplicate asset ID detected: "${asset.id}". Asset IDs must be globally unique across packs.`,
      });
    } else {
      seenIds.add(asset.id);
    }

    // 3. Path safety & directory traversal prevention
    if (isDisallowedPath(asset.path)) {
      errors.push({
        path: `${assetPathPrefix}.path`,
        code: 'UNSAFE_PATH',
        message: `Unsafe asset path: "${asset.path}". Absolute paths and directory traversal (..) are forbidden.`,
      });
      continue;
    }

    // 4. File existence check (if fileExists callback provided)
    if (options.fileExists && asset.format !== 'component') {
      const exists = options.fileExists(asset.path);
      if (!exists) {
        errors.push({
          path: `${assetPathPrefix}.path`,
          code: 'MISSING_FILE',
          message: `Referenced asset file does not exist: "${asset.path}" (id: "${asset.id}").`,
        });
      }
    }

    // 5. Anchor coordinate verification
    if (
      asset.anchor.x < 0 ||
      asset.anchor.x > 1 ||
      asset.anchor.y < 0 ||
      asset.anchor.y > 1
    ) {
      errors.push({
        path: `${assetPathPrefix}.anchor`,
        code: 'INVALID_COORDINATES',
        message: `Anchor coordinates must be normalized within [0.0, 1.0]. Got x=${asset.anchor.x}, y=${asset.anchor.y}.`,
      });
    }

    // 6. Attachment socket coordinates verification
    if (asset.attachmentSockets) {
      for (const [socketName, socket] of Object.entries(asset.attachmentSockets)) {
        if (Number.isNaN(socket.x) || Number.isNaN(socket.y)) {
          errors.push({
            path: `${assetPathPrefix}.attachmentSockets.${socketName}`,
            code: 'INVALID_COORDINATES',
            message: `Socket "${socketName}" has NaN coordinates.`,
          });
        }
      }
    }

    // 7. Style family consistency
    if (asset.style.family !== manifest.styleFamily) {
      warnings.push({
        path: `${assetPathPrefix}.style.family`,
        code: 'STYLE_MISMATCH',
        message: `Asset style "${asset.style.family}" does not match pack styleFamily "${manifest.styleFamily}".`,
      });
    }

    // 8. Provenance verification
    if (
      asset.provenance.source === 'third-party' &&
      (!asset.provenance.notes || asset.provenance.license.toLowerCase() === 'unknown')
    ) {
      warnings.push({
        path: `${assetPathPrefix}.provenance`,
        code: 'UNKNOWN_PROVENANCE',
        message: `Third-party asset "${asset.id}" has unverified or unknown license/provenance notes.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
