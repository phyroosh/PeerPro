import fs from 'fs';
import path from 'path';
import { AssetIngestionCandidate, InspectionCheckResult, InspectionReport } from './types';
import { defaultAssetRegistry } from '../assets/registry';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DANGEROUS_PATTERNS = [/<script/i, /onload=/i, /onerror=/i, /javascript:/i];

export function inspectCandidate(
  candidate: AssetIngestionCandidate,
  options?: { publicDir?: string; assetPacksDir?: string }
): InspectionReport {
  const checks: InspectionCheckResult[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  let fileSizeBytes = 0;
  let dimensions = { width: 0, height: 0 };
  let viewBox: string | undefined;
  let hasAlpha = true;

  // 1. File Readability & Existence
  if (!fs.existsSync(candidate.sourcePath)) {
    errors.push(`Candidate source file not found: ${candidate.sourcePath}`);
    checks.push({
      check: 'file_exists',
      passed: false,
      details: `File does not exist: ${candidate.sourcePath}`,
    });
  } else {
    try {
      const stats = fs.statSync(candidate.sourcePath);
      fileSizeBytes = stats.size;

      if (fileSizeBytes < 50) {
        errors.push(`Candidate file is empty or near-empty (${fileSizeBytes} bytes).`);
        checks.push({
          check: 'file_not_empty',
          passed: false,
          details: `Size ${fileSizeBytes} bytes is below 50-byte threshold.`,
        });
      } else {
        checks.push({
          check: 'file_readable',
          passed: true,
          details: `Readable file (${fileSizeBytes} bytes).`,
        });
      }
    } catch (err: any) {
      errors.push(`Error accessing file ${candidate.sourcePath}: ${err.message}`);
    }
  }

  // 2. Format Verification
  const ext = path.extname(candidate.sourcePath).toLowerCase();
  let format: 'svg' | 'png' | 'webp' = 'svg';
  if (ext === '.svg') {
    format = 'svg';
  } else if (ext === '.png') {
    format = 'png';
  } else if (ext === '.webp') {
    format = 'webp';
  } else {
    errors.push(`Unsupported asset file extension: "${ext}". Supported formats are .svg, .png, .webp.`);
    checks.push({
      check: 'supported_format',
      passed: false,
      details: `Invalid extension ${ext}`,
    });
  }

  // 3. SVG-Specific Structural & Security Analysis
  if (format === 'svg' && errors.length === 0) {
    try {
      const content = fs.readFileSync(candidate.sourcePath, 'utf8');

      // Check root tag
      if (!content.includes('<svg') || !content.includes('</svg>')) {
        errors.push('File is not a valid SVG: missing root <svg> tags.');
        checks.push({
          check: 'svg_root_tag',
          passed: false,
          details: 'Root <svg> tag missing',
        });
      }

      // Security Check: detect inline scripts and dangerous handlers
      let isSecure = true;
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(content)) {
          errors.push(`Security violation: dangerous script or event handler detected matching ${pattern}`);
          isSecure = false;
        }
      }
      checks.push({
        check: 'security_sanitization',
        passed: isSecure,
        details: isSecure ? 'No malicious scripts or event handlers detected.' : 'Dangerous code detected.',
      });

      // Parse viewBox attribute
      const viewBoxMatch = content.match(/viewBox\s*=\s*["']([^"']+)["']/i);
      if (viewBoxMatch) {
        viewBox = viewBoxMatch[1].trim();
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          dimensions = { width: Math.round(parts[2]), height: Math.round(parts[3]) };
          checks.push({
            check: 'svg_viewbox_valid',
            passed: true,
            details: `viewBox="${viewBox}" (width=${dimensions.width}, height=${dimensions.height})`,
          });
        } else {
          errors.push(`Malformed viewBox in SVG: "${viewBox}". Expected 4 positive numbers.`);
        }
      } else {
        // Fallback to width / height attributes
        const widthMatch = content.match(/width\s*=\s*["']([0-9.]+)["']/i);
        const heightMatch = content.match(/height\s*=\s*["']([0-9.]+)["']/i);
        if (widthMatch && heightMatch) {
          dimensions = { width: Math.round(Number(widthMatch[1])), height: Math.round(Number(heightMatch[1])) };
          viewBox = `0 0 ${dimensions.width} ${dimensions.height}`;
          warnings.push(`SVG lacks explicit viewBox attribute; inferred from width/height: "${viewBox}"`);
        } else {
          errors.push('SVG lacks viewBox and explicit width/height attributes.');
        }
      }
    } catch (err: any) {
      errors.push(`Failed to read/parse SVG: ${err.message}`);
    }
  }

  // 4. ID Format & Naming Collision Check
  if (!KEBAB_CASE_REGEX.test(candidate.targetId)) {
    errors.push(`Target ID "${candidate.targetId}" must be kebab-case (lowercase alphanumeric with hyphens).`);
    checks.push({
      check: 'id_kebab_case',
      passed: false,
      details: 'ID does not match kebab-case regex.',
    });
  } else {
    checks.push({
      check: 'id_kebab_case',
      passed: true,
      details: `Valid kebab-case ID: ${candidate.targetId}`,
    });

    // Check collision in existing registry or on-disk manifests
    let isCollision = defaultAssetRegistry.has(candidate.targetId);
    const assetPacksDir = options?.assetPacksDir || path.resolve(process.cwd(), 'asset-packs');

    if (!isCollision && fs.existsSync(assetPacksDir)) {
      try {
        const packDirs = fs
          .readdirSync(assetPacksDir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        for (const dir of packDirs) {
          const manifestPath = path.join(assetPacksDir, dir, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (
              manifest.assets &&
              manifest.assets.some((a: any) => a.id === candidate.targetId)
            ) {
              isCollision = true;
              break;
            }
          }
        }
      } catch {
        // Ignore read errors during collision check fallback
      }
    }

    if (isCollision) {
      errors.push(`Asset ID collision: an asset with ID "${candidate.targetId}" is already registered.`);
      checks.push({
        check: 'id_collision_check',
        passed: false,
        details: `ID already registered: ${candidate.targetId}`,
      });
    } else {
      checks.push({
        check: 'id_collision_check',
        passed: true,
        details: 'ID is unique.',
      });
    }
  }

  // 5. Anchor Bounds Verification
  if (candidate.anchor) {
    const { x, y } = candidate.anchor;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      warnings.push(`Anchor coordinates (${x}, ${y}) exceed normalized unit range [0, 1].`);
    }
    checks.push({
      check: 'anchor_coordinates',
      passed: x >= 0 && x <= 1 && y >= 0 && y <= 1,
      details: `Anchor at (${x}, ${y})`,
    });
  }

  // 6. Socket Coordinates Validation
  if (candidate.attachmentSockets && dimensions.width > 0 && dimensions.height > 0) {
    for (const [name, socket] of Object.entries(candidate.attachmentSockets)) {
      if (socket.x < 0 || socket.x > dimensions.width || socket.y < 0 || socket.y > dimensions.height) {
        warnings.push(
          `Socket "${name}" coordinates (${socket.x}, ${socket.y}) exceed asset dimensions (${dimensions.width}x${dimensions.height}).`
        );
      }
    }
  }

  // 7. Provenance Completeness
  if (!candidate.provenance || !candidate.provenance.license || !candidate.provenance.author) {
    errors.push('Incomplete provenance metadata: license and author are mandatory.');
    checks.push({
      check: 'provenance_metadata',
      passed: false,
      details: 'Missing license or author.',
    });
  } else {
    checks.push({
      check: 'provenance_metadata',
      passed: true,
      details: `License: ${candidate.provenance.license}, Author: ${candidate.provenance.author}`,
    });
  }

  return {
    valid: errors.length === 0,
    format,
    dimensions,
    viewBox,
    hasAlpha,
    fileSizeBytes,
    checks,
    warnings,
    errors,
  };
}
