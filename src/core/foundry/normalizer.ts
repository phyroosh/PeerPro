import { AssetFormat } from '../assets/types';
import { InspectionReport } from './types';

export interface NormalizedAsset {
  format: AssetFormat;
  content: string | Buffer;
  viewBox?: string;
  dimensions: {
    width: number;
    height: number;
  };
  warnings: string[];
}

export interface NormalizerOptions {
  stripComments?: boolean;
  stripXmlDeclaration?: boolean;
  ensureXmlns?: boolean;
  sanitizeDangerousContent?: boolean;
}

/**
 * Normalizes an SVG asset string by standardizing namespaces, viewBox,
 * stripping XML declarations, and removing dangerous elements/attributes.
 */
export function normalizeSvg(
  rawContent: string,
  options: NormalizerOptions = {}
): NormalizedAsset {
  const {
    stripComments = true,
    stripXmlDeclaration = true,
    ensureXmlns = true,
    sanitizeDangerousContent = true,
  } = options;

  const warnings: string[] = [];
  let content = rawContent.trim();

  // 1. Strip XML declarations and DOCTYPE declarations
  if (stripXmlDeclaration) {
    content = content.replace(/<\?xml[^>]*\?>/gi, '');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  }

  // 2. Strip HTML/XML comments
  if (stripComments) {
    content = content.replace(/<!--[\s\S]*?-->/g, '');
  }

  // 3. Security Sanitization: strip script tags and dangerous event handlers
  if (sanitizeDangerousContent) {
    if (/<script[\s\S]*?<\/script>/gi.test(content)) {
      warnings.push('Sanitized: removed embedded <script> tags.');
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    }
    // Remove inline event handlers (e.g. onload, onerror, onclick)
    if (/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi.test(content)) {
      warnings.push('Sanitized: removed inline event handlers (onload, onerror, etc.).');
      content = content.replace(/\s+on[a-z]+\s*=\s*["'][^"']*["']/gi, '');
    }
    // Remove javascript: URLs
    if (/href\s*=\s*["']javascript:[^"']*["']/gi.test(content)) {
      warnings.push('Sanitized: removed javascript: pseudo-protocol URIs.');
      content = content.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
    }
  }

  // 4. Locate <svg> open tag
  const svgOpenTagMatch = content.match(/<svg([^>]*)>/i);
  if (!svgOpenTagMatch) {
    throw new Error('Normalization failed: no <svg> root element found in content.');
  }

  let tagAttributes = svgOpenTagMatch[1];
  let viewBox: string | undefined;
  let dimensions = { width: 0, height: 0 };

  // Parse existing viewBox
  const viewBoxMatch = tagAttributes.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const rawVb = viewBoxMatch[1].trim();
    const parts = rawVb.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !parts.some(Number.isNaN)) {
      dimensions = { width: Math.round(parts[2]), height: Math.round(parts[3]) };
      viewBox = `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
      // Standardize viewBox string in attributes
      tagAttributes = tagAttributes.replace(
        /viewBox\s*=\s*["'][^"']+["']/i,
        `viewBox="${viewBox}"`
      );
    }
  }

  // Fallback to width / height if viewBox was missing or incomplete
  if (!viewBox) {
    const widthMatch = tagAttributes.match(/width\s*=\s*["']([0-9.]+)["']/i);
    const heightMatch = tagAttributes.match(/height\s*=\s*["']([0-9.]+)["']/i);
    if (widthMatch && heightMatch) {
      dimensions = {
        width: Math.round(Number(widthMatch[1])),
        height: Math.round(Number(heightMatch[1])),
      };
      viewBox = `0 0 ${dimensions.width} ${dimensions.height}`;
      tagAttributes += ` viewBox="${viewBox}"`;
      warnings.push(`Synthesized viewBox="${viewBox}" from width and height attributes.`);
    }
  }

  // Ensure xmlns is present
  if (ensureXmlns && !tagAttributes.includes('xmlns=')) {
    tagAttributes = ` xmlns="http://www.w3.org/2000/svg"${tagAttributes}`;
  }

  // Re-assemble content with standardized open tag
  content = content.replace(/<svg[^>]*>/i, `<svg${tagAttributes}>`).trim();

  return {
    format: 'svg',
    content,
    viewBox,
    dimensions,
    warnings,
  };
}

/**
 * Normalizes candidate file based on format and inspection report.
 */
export function normalizeCandidate(
  fileContent: string | Buffer,
  inspection: InspectionReport,
  options?: NormalizerOptions
): NormalizedAsset {
  if (inspection.format === 'svg') {
    const textContent = typeof fileContent === 'string' ? fileContent : fileContent.toString('utf8');
    return normalizeSvg(textContent, options);
  }

  // Raster asset (PNG, WebP)
  const bufferContent = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);
  return {
    format: inspection.format,
    content: bufferContent,
    dimensions: inspection.dimensions,
    warnings: [],
  };
}
