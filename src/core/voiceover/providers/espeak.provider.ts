import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import {
  VoiceMetadata,
  VoiceoverProvider,
  VoiceoverProviderId,
  VoiceoverSynthesisRequest,
  VoiceoverSynthesisResult,
} from '../types';
import {
  atomicMove,
  computeVoiceoverCacheKey,
  getVoiceoverStoragePaths,
} from '../cache';
import { validateAndNormalizeParameters } from '../presets';
import { normalizeNarrationText } from '../text';
import { getAudioDurationSeconds } from './edge-tts.provider';

const execFileAsync = promisify(execFile);

export class EspeakVoiceoverProvider implements VoiceoverProvider {
  readonly id: VoiceoverProviderId = 'espeak';
  readonly name = 'eSpeak-NG (Local Robotic TTS)';

  private projectRoot: string;

  constructor(options: { projectRoot?: string } = {}) {
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..', '..', '..');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync('espeak-ng', ['--version']);
      return true;
    } catch {
      try {
        await execFileAsync('espeak', ['--version']);
        return true;
      } catch {
        return false;
      }
    }
  }

  async listVoices(): Promise<VoiceMetadata[]> {
    return [
      {
        id: 'en-us',
        displayName: 'eSpeak-NG English (US) - Robotic',
        locale: 'en-US',
        localeName: 'English (US)',
        gender: 'Male',
        provider: 'espeak',
      },
      {
        id: 'en-gb',
        displayName: 'eSpeak-NG English (UK) - Robotic',
        locale: 'en-GB',
        localeName: 'English (UK)',
        gender: 'Male',
        provider: 'espeak',
      },
      {
        id: 'ja',
        displayName: 'eSpeak-NG Japanese - Robotic',
        locale: 'ja-JP',
        localeName: 'Japanese',
        gender: 'Male',
        provider: 'espeak',
      },
    ];
  }

  async synthesize(request: VoiceoverSynthesisRequest): Promise<VoiceoverSynthesisResult> {
    const rawText = request.text;
    const normalizedText = normalizeNarrationText(rawText);

    if (!normalizedText) {
      throw new Error('Narration text must not be empty.');
    }

    const voice = request.voice || 'en-us';
    const parameters = validateAndNormalizeParameters(request.parameters, request.preset);
    const format = request.format || 'wav';
    const useCache = request.useCache !== false;

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
        // Cache corrupted
      }
    }

    const tempWav = path.join(
      publicVoiceoversDir,
      `${cacheKey}.tmp.${process.pid}.${Date.now()}.wav`
    );

    try {
      // Find executable: espeak-ng or espeak
      const bin = (await this.isAvailable()) ? 'espeak-ng' : 'espeak';
      await execFileAsync(bin, ['-v', voice, '-w', tempWav, normalizedText]);

      // Normalize to 48kHz stereo WAV
      await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        tempWav,
        '-ar',
        '48000',
        '-ac',
        '2',
        '-c:a',
        'pcm_s16le',
        finalFilePath,
      ]);

      try {
        fs.unlinkSync(tempWav);
      } catch {
        // ignore
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
      if (fs.existsSync(tempWav)) {
        try {
          fs.unlinkSync(tempWav);
        } catch {
          // ignore
        }
      }
      throw new Error(`eSpeak synthesis failed: ${err.message}`);
    }
  }
}
