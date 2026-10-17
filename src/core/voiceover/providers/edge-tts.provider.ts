import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import {
  SpeechParameters,
  VoiceMetadata,
  VoiceoverProvider,
  VoiceoverProviderId,
  VoiceoverSynthesisRequest,
  VoiceoverSynthesisResult,
} from '../types';
import {
  atomicMove,
  computeVoiceoverCacheKey,
  getCachedVoiceoverPath,
  getVoiceoverStoragePaths,
} from '../cache';
import { DEFAULT_NEURAL_VOICE, validateAndNormalizeParameters } from '../presets';
import { normalizeNarrationText } from '../text';

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface EdgeTTSProviderOptions {
  projectRoot?: string;
  pythonPath?: string;
  maxRetries?: number;
}

/**
 * Extracts exact audio duration in seconds using ffprobe.
 */
export async function getAudioDurationSeconds(audioFilePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioFilePath,
    ]);
    const parsed = parseFloat(stdout.trim());
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid ffprobe duration output: "${stdout.trim()}"`);
    }
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to determine audio duration for "${audioFilePath}": ${err.message}`);
  }
}

/**
 * Converts input MP3 to frame-accurate 48kHz 16-bit stereo WAV for Remotion synchronization.
 */
export async function convertMp3ToWav(
  inputMp3Path: string,
  outputWavPath: string,
  sampleRate = 48000
): Promise<void> {
  const tempWav = `${outputWavPath}.tmp.${process.pid}.${Date.now()}.wav`;
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      inputMp3Path,
      '-ar',
      sampleRate.toString(),
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      tempWav,
    ]);
    atomicMove(tempWav, outputWavPath);
  } catch (err: any) {
    if (fs.existsSync(tempWav)) {
      try {
        fs.unlinkSync(tempWav);
      } catch {
        // ignore
      }
    }
    throw new Error(`FFmpeg audio conversion to WAV failed: ${err.message}`);
  }
}

export class EdgeTTSVoiceoverProvider implements VoiceoverProvider {
  readonly id: VoiceoverProviderId = 'edge-tts';
  readonly name = 'Microsoft Edge Neural TTS';

  private projectRoot: string;
  private pythonPath: string;
  private adapterScriptPath: string;
  private maxRetries: number;
  private inFlightSynthesis = new Map<string, Promise<VoiceoverSynthesisResult>>();

  constructor(options: EdgeTTSProviderOptions = {}) {
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..', '..', '..');
    this.pythonPath = options.pythonPath || process.env.PYTHON_PATH || 'python3';
    this.adapterScriptPath = path.resolve(
      __dirname,
      '..',
      'adapters',
      'edge-tts-adapter.py'
    );
    this.maxRetries = options.maxRetries ?? 3;
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.adapterScriptPath)) {
        return false;
      }
      await execFileAsync(this.pythonPath, [
        '-c',
        'import edge_tts; print("OK")',
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discovers available Edge TTS voices with local disk caching and graceful offline fallback.
   */
  async listVoices(options: { refresh?: boolean } = {}): Promise<VoiceMetadata[]> {
    const { cacheMetaDir } = getVoiceoverStoragePaths(this.projectRoot);
    const cacheFile = path.join(cacheMetaDir, 'voices_edge_tts.json');

    // 1. Check local cache if refresh not forced
    if (!options.refresh && fs.existsSync(cacheFile)) {
      try {
        const stats = fs.statSync(cacheFile);
        const ageMs = Date.now() - stats.mtimeMs;
        if (ageMs < CACHE_TTL_MS) {
          const content = fs.readFileSync(cacheFile, 'utf8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Cache read failed, proceed to fetch
      }
    }

    // 2. Fetch fresh voices via adapter bridge
    try {
      const { stdout } = await execFileAsync(
        this.pythonPath,
        [this.adapterScriptPath, 'list-voices'],
        { maxBuffer: 10 * 1024 * 1024 }
      );

      const voices: VoiceMetadata[] = JSON.parse(stdout);
      if (Array.isArray(voices) && voices.length > 0) {
        // Write to cache atomically
        const tempCache = `${cacheFile}.tmp.${process.pid}.${Date.now()}`;
        fs.writeFileSync(tempCache, JSON.stringify(voices, null, 2), 'utf8');
        atomicMove(tempCache, cacheFile);
        return voices;
      }
    } catch (err: any) {
      // If network fails but stale cache exists, serve stale cache with notice
      if (fs.existsSync(cacheFile)) {
        try {
          const content = fs.readFileSync(cacheFile, 'utf8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.warn(
              `[WARN] Failed to refresh Edge TTS voice list from online service (${err.message}). Using cached voice list.`
            );
            return parsed;
          }
        } catch {
          // ignore
        }
      }

      throw new Error(
        `Failed to discover Microsoft Edge TTS voices. Edge TTS relies on an active internet connection to Microsoft services. Error: ${err.message}`
      );
    }

    return [];
  }

  /**
   * Synthesizes narration text using Microsoft Edge Neural TTS.
   */
  async synthesize(request: VoiceoverSynthesisRequest): Promise<VoiceoverSynthesisResult> {
    const rawText = request.text;
    const normalizedText = normalizeNarrationText(rawText);

    if (!normalizedText) {
      throw new Error('Narration text must not be empty.');
    }

    const voice = request.voice || DEFAULT_NEURAL_VOICE;
    const parameters = validateAndNormalizeParameters(request.parameters, request.preset);
    const format = request.format || 'wav';
    const useCache = request.useCache !== false;

    // Compute deterministic cache key
    const cacheKey = computeVoiceoverCacheKey({
      text: normalizedText,
      voice,
      providerId: this.id,
      parameters,
      format,
    });

    const { publicVoiceoversDir } = getVoiceoverStoragePaths(this.projectRoot);
    const targetFileName = `${cacheKey}.${format}`;
    const finalFilePath = request.outputPath || path.join(publicVoiceoversDir, targetFileName);
    const relativePublicPath = `audio/voiceovers/${path.basename(finalFilePath)}`;

    // Return cached audio if present
    if (useCache && fs.existsSync(finalFilePath)) {
      try {
        const stats = fs.statSync(finalFilePath);
        if (stats.size > 0) {
          const durationSeconds = await getAudioDurationSeconds(finalFilePath);
          const fps = 30;
          return {
            audioFilePath: finalFilePath,
            relativePublicPath,
            durationSeconds,
            durationInFrames: Math.ceil(durationSeconds * fps),
            fps,
            sampleRate: 48000,
            channels: 2,
            format,
            provider: this.id,
            voice,
            parameters,
            cacheHit: true,
            fileSizeBytes: stats.size,
          };
        }
      } catch {
        // Cache entry corrupted, regenerate
      }
    }

    // In-flight deduplication to avoid redundant parallel network requests
    if (this.inFlightSynthesis.has(cacheKey)) {
      return this.inFlightSynthesis.get(cacheKey)!;
    }

    const synthesisPromise = (async () => {
      let lastError: Error | null = null;
      const tempMp3Path = path.join(
        publicVoiceoversDir,
        `${cacheKey}.tmp.${process.pid}.${Date.now()}.mp3`
      );

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // Safe invocation using execFile with argument array
          await execFileAsync(this.pythonPath, [
            this.adapterScriptPath,
            'synthesize',
            '--text',
            normalizedText,
            '--voice',
            voice,
            '--out',
            tempMp3Path,
            '--rate',
            parameters.rate,
            '--pitch',
            parameters.pitch,
            '--volume',
            parameters.volume,
          ]);

          if (!fs.existsSync(tempMp3Path) || fs.statSync(tempMp3Path).size === 0) {
            throw new Error('Synthesized audio file was empty or missing.');
          }

          // If format is wav, convert to 48kHz stereo WAV
          if (format === 'wav') {
            await convertMp3ToWav(tempMp3Path, finalFilePath);
            try {
              fs.unlinkSync(tempMp3Path);
            } catch {
              // ignore
            }
          } else {
            atomicMove(tempMp3Path, finalFilePath);
          }

          const durationSeconds = await getAudioDurationSeconds(finalFilePath);
          const stats = fs.statSync(finalFilePath);
          const fps = 30;

          return {
            audioFilePath: finalFilePath,
            relativePublicPath,
            durationSeconds,
            durationInFrames: Math.ceil(durationSeconds * fps),
            fps,
            sampleRate: 48000,
            channels: 2,
            format,
            provider: this.id,
            voice,
            parameters,
            cacheHit: false,
            fileSizeBytes: stats.size,
          };
        } catch (err: any) {
          lastError = err;
          // Clean up temp file on failure
          if (fs.existsSync(tempMp3Path)) {
            try {
              fs.unlinkSync(tempMp3Path);
            } catch {
              // ignore
            }
          }

          if (attempt < this.maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 500; // 1000ms, 2000ms...
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      }

      throw new Error(
        `Microsoft Edge Neural TTS synthesis failed after ${this.maxRetries} attempts for voice "${voice}": ${lastError?.message}. Edge TTS relies on an active internet connection to Microsoft services.`
      );
    })();

    this.inFlightSynthesis.set(cacheKey, synthesisPromise);
    try {
      return await synthesisPromise;
    } finally {
      this.inFlightSynthesis.delete(cacheKey);
    }
  }
}
