import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { SpeechParameters, VoiceoverProviderId } from './types';
import { normalizeNarrationText } from './text';

export interface CacheKeyParams {
  text: string;
  voice: string;
  providerId: VoiceoverProviderId;
  parameters: Required<SpeechParameters>;
  format: 'wav' | 'mp3';
}

/**
 * Computes a deterministic SHA-256 cache key from narration inputs.
 */
export function computeVoiceoverCacheKey(params: CacheKeyParams): string {
  const normalized = normalizeNarrationText(params.text);
  const rawKey = [
    params.providerId,
    params.voice,
    params.parameters.rate,
    params.parameters.pitch,
    params.parameters.volume,
    params.format,
    normalized,
  ].join(':::');

  return crypto.createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

/**
 * Ensures cache directories exist and returns absolute paths.
 */
export function getVoiceoverStoragePaths(projectRoot: string) {
  const publicVoiceoversDir = path.resolve(projectRoot, 'public', 'audio', 'voiceovers');
  const cacheMetaDir = path.resolve(projectRoot, '.cache', 'voiceover');
  const previewsDir = path.resolve(projectRoot, 'out', 'previews');

  [publicVoiceoversDir, cacheMetaDir, previewsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return {
    publicVoiceoversDir,
    cacheMetaDir,
    previewsDir,
  };
}

/**
 * Checks if a cached voiceover file exists and is valid (non-empty).
 */
export function getCachedVoiceoverPath(
  cacheKey: string,
  format: 'wav' | 'mp3',
  publicVoiceoversDir: string
): string | null {
  const filename = `${cacheKey}.${format}`;
  const filePath = path.join(publicVoiceoversDir, filename);

  if (fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        return filePath;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Atomically writes data or moves a temporary file to its final destination.
 */
export function atomicMove(srcTempPath: string, destPath: string): void {
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    fs.renameSync(srcTempPath, destPath);
  } catch (err: any) {
    // If cross-device link error, copy and unlink
    if (err.code === 'EXDEV') {
      fs.copyFileSync(srcTempPath, destPath);
      fs.unlinkSync(srcTempPath);
    } else {
      throw err;
    }
  }
}
