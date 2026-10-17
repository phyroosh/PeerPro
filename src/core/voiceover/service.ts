import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  SceneVoiceoverSyncOptions,
  SceneVoiceoverSyncResult,
  VoiceFilterOptions,
  VoiceMetadata,
  VoiceoverPreviewRequest,
  VoiceoverPreviewResult,
  VoiceoverSynthesisRequest,
  VoiceoverSynthesisResult,
} from './types';
import { defaultVoiceoverRegistry, VoiceoverProviderRegistry } from './registry';
import { DEFAULT_NEURAL_VOICE, validateAndNormalizeParameters } from './presets';
import { chunkNarrationText, normalizeNarrationText } from './text';
import {
  atomicMove,
  computeVoiceoverCacheKey,
  getVoiceoverStoragePaths,
} from './cache';
import { SceneAudioTrack } from '../audio/types';
import { SceneDialogLine, SceneManifest } from '../scene/types';

const execFileAsync = promisify(execFile);

export class VoiceoverService {
  private registry: VoiceoverProviderRegistry;
  private projectRoot: string;
  private inFlightPreviews = new Map<string, Promise<VoiceoverPreviewResult>>();

  constructor(options: { registry?: VoiceoverProviderRegistry; projectRoot?: string } = {}) {
    this.registry = options.registry || defaultVoiceoverRegistry;
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..', '..');
  }

  /**
   * Discovers voices matching the filter criteria.
   */
  async discoverVoices(filter: VoiceFilterOptions = {}): Promise<VoiceMetadata[]> {
    const provider = this.registry.get(filter.providerId);
    const allVoices = await provider.listVoices({ refresh: filter.refresh });

    let filtered = allVoices;

    if (filter.locale) {
      const loc = filter.locale.toLowerCase().replace('_', '-');
      filtered = filtered.filter((v) =>
        v.locale.toLowerCase().startsWith(loc) || v.locale.toLowerCase().replace('_', '-') === loc
      );
    }

    if (filter.gender && filter.gender !== 'Unknown') {
      filtered = filtered.filter((v) => v.gender.toLowerCase() === filter.gender!.toLowerCase());
    }

    if (filter.search) {
      const query = filter.search.toLowerCase().trim();
      filtered = filtered.filter(
        (v) =>
          v.id.toLowerCase().includes(query) ||
          v.displayName.toLowerCase().includes(query) ||
          v.localeName.toLowerCase().includes(query) ||
          v.locale.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * Generates a short audio preview for a selected voice and parameter preset.
   */
  async previewVoice(request: VoiceoverPreviewRequest = {}): Promise<VoiceoverPreviewResult> {
    const voice = request.voice || DEFAULT_NEURAL_VOICE;
    const providerId = request.providerId || this.registry.getDefaultProviderId();
    const provider = this.registry.get(providerId);
    const parameters = validateAndNormalizeParameters(request.parameters, request.preset);
    const format = request.format || 'wav';

    const sampleText =
      request.text?.trim() ||
      `Hello! I am ${voice.split('-').pop()?.replace('Neural', '') || voice}, your voiceover narrator for PeerPro animations.`;

    const cacheKey = computeVoiceoverCacheKey({
      text: sampleText,
      voice,
      providerId,
      parameters,
      format,
    });

    const { previewsDir } = getVoiceoverStoragePaths(this.projectRoot);
    const previewFileName = `preview_${voice}_${cacheKey.slice(0, 12)}.${format}`;
    const previewFilePath = path.join(previewsDir, previewFileName);

    // Reuse cached preview if existing
    if (fs.existsSync(previewFilePath)) {
      try {
        const stats = fs.statSync(previewFilePath);
        if (stats.size > 0) {
          const { stdout } = await execFileAsync('ffprobe', [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            previewFilePath,
          ]);
          const durationSeconds = parseFloat(stdout.trim());
          return {
            previewFilePath,
            durationSeconds,
            voice,
            provider: providerId,
            parameters,
            sampleText,
            cacheHit: true,
          };
        }
      } catch {
        // Cache read failed, regenerate
      }
    }

    // Deduplicate in-flight preview requests
    if (this.inFlightPreviews.has(cacheKey)) {
      return this.inFlightPreviews.get(cacheKey)!;
    }

    const previewPromise = (async () => {
      const result = await provider.synthesize({
        text: sampleText,
        voice,
        parameters,
        outputPath: previewFilePath,
        format,
        useCache: false,
      });

      return {
        previewFilePath: result.audioFilePath,
        durationSeconds: result.durationSeconds,
        voice,
        provider: providerId,
        parameters,
        sampleText,
        cacheHit: false,
      };
    })();

    this.inFlightPreviews.set(cacheKey, previewPromise);
    try {
      return await previewPromise;
    } finally {
      this.inFlightPreviews.delete(cacheKey);
    }
  }

  /**
   * Synthesizes narration audio, automatically handling long-text chunking if needed.
   */
  async generateVoiceover(request: VoiceoverSynthesisRequest): Promise<VoiceoverSynthesisResult> {
    const provider = this.registry.get(request.providerId);
    const normalized = normalizeNarrationText(request.text);

    // If script is within standard length, synthesize directly
    if (normalized.length <= 1200) {
      return provider.synthesize(request);
    }

    // If script is extra long, chunk at sentence boundaries and concatenate
    const chunks = chunkNarrationText(normalized, 800);
    if (chunks.length <= 1) {
      return provider.synthesize(request);
    }

    const format = request.format || 'wav';
    const { publicVoiceoversDir } = getVoiceoverStoragePaths(this.projectRoot);
    const parameters = validateAndNormalizeParameters(request.parameters, request.preset);
    const voice = request.voice || DEFAULT_NEURAL_VOICE;

    const fullCacheKey = computeVoiceoverCacheKey({
      text: normalized,
      voice,
      providerId: provider.id,
      parameters,
      format,
    });

    const finalTarget = request.outputPath || path.join(publicVoiceoversDir, `${fullCacheKey}.${format}`);
    if (request.useCache !== false && fs.existsSync(finalTarget)) {
      return provider.synthesize({ ...request, text: normalized });
    }

    const chunkFiles: string[] = [];
    try {
      for (const chunk of chunks) {
        const chunkResult = await provider.synthesize({
          ...request,
          text: chunk.text,
          format: 'wav',
        });
        chunkFiles.push(chunkResult.audioFilePath);
      }

      // Concatenate WAV chunks safely using ffmpeg
      const concatListFile = path.join(
        publicVoiceoversDir,
        `concat_${fullCacheKey.slice(0, 10)}_${Date.now()}.txt`
      );
      const listContent = chunkFiles.map((f) => `file '${f}'`).join('\n');
      fs.writeFileSync(concatListFile, listContent, 'utf8');

      const tempCombined = `${finalTarget}.tmp.${process.pid}.${Date.now()}.${format}`;
      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListFile,
        '-c',
        'copy',
        tempCombined,
      ]);

      try {
        fs.unlinkSync(concatListFile);
      } catch {
        // ignore
      }

      atomicMove(tempCombined, finalTarget);

      const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        finalTarget,
      ]);
      const durationSeconds = parseFloat(stdout.trim());
      const stats = fs.statSync(finalTarget);
      const fps = 30;

      return {
        audioFilePath: finalTarget,
        relativePublicPath: `audio/voiceovers/${path.basename(finalTarget)}`,
        durationSeconds,
        durationInFrames: Math.ceil(durationSeconds * fps),
        fps,
        sampleRate: 48000,
        channels: 2,
        format,
        provider: provider.id,
        voice,
        parameters,
        cacheHit: false,
        fileSizeBytes: stats.size,
      };
    } catch (err: any) {
      throw new Error(`Failed to synthesize and assemble chunked voiceovers: ${err.message}`);
    }
  }

  /**
   * Automatically generates voiceovers for all dialogue lines in a scene manifest,
   * creates Remotion-compatible SceneAudioTrack entries, and aligns timing.
   */
  async applyVoiceoverToScene(
    manifest: SceneManifest,
    options: SceneVoiceoverSyncOptions = {}
  ): Promise<SceneVoiceoverSyncResult> {
    const updatedManifest: SceneManifest = JSON.parse(JSON.stringify(manifest));
    const fps = options.targetFps || updatedManifest.canvas?.fps || 30;
    const defaultVoice = options.defaultVoice || DEFAULT_NEURAL_VOICE;
    const defaultPreset = options.defaultPreset || 'natural-narration';
    const pauseFrames = options.pauseBetweenLinesFrames ?? 15; // 0.5s pause
    const expandCanvas = options.expandCanvasDurationIfNeeded !== false;

    if (!updatedManifest.dialog || updatedManifest.dialog.length === 0) {
      return {
        manifest: updatedManifest,
        generatedTracks: [],
        totalVoiceoverDurationSeconds: 0,
        totalVoiceoverDurationFrames: 0,
        canvasDurationExpanded: false,
        lineResults: [],
      };
    }

    const generatedTracks: SceneAudioTrack[] = [];
    const lineResults: SceneVoiceoverSyncResult['lineResults'] = [];
    let currentTimelineFrame = updatedManifest.dialog[0]?.startFrame ?? 15;
    let totalDurationSeconds = 0;

    for (let i = 0; i < updatedManifest.dialog.length; i++) {
      const line = updatedManifest.dialog[i];
      const selectedVoice = (line as any).voice || defaultVoice;
      const selectedPreset = (line as any).preset || defaultPreset;
      const speechParams = (line as any).speechParams;

      const synthResult = await this.generateVoiceover({
        text: line.text,
        voice: selectedVoice,
        preset: selectedPreset,
        parameters: speechParams,
        providerId: options.providerId,
        format: 'wav',
      });

      const lineDurationFrames = Math.ceil(synthResult.durationSeconds * fps);
      totalDurationSeconds += synthResult.durationSeconds;

      // Position line starting at current frame or specified startFrame if later
      const startFrame = Math.max(line.startFrame, currentTimelineFrame);
      const endFrame = startFrame + lineDurationFrames;

      line.startFrame = startFrame;
      line.endFrame = endFrame;

      const trackId = `vo-${line.id}`;
      const audioTrack: SceneAudioTrack = {
        id: trackId,
        type: 'voiceover',
        src: synthResult.relativePublicPath,
        startFrame,
        durationInFrames: lineDurationFrames,
        volume: 1.0,
      };

      generatedTracks.push(audioTrack);
      lineResults.push({
        dialogId: line.id,
        text: line.text,
        voice: selectedVoice,
        audioTrackId: trackId,
        audioPath: synthResult.audioFilePath,
        startFrame,
        endFrame,
        durationInFrames: lineDurationFrames,
        cacheHit: synthResult.cacheHit,
      });

      // Advance timeline frame for subsequent dialogue
      currentTimelineFrame = endFrame + pauseFrames;
    }

    // Merge generated audio tracks with existing BGM/SFX tracks
    const existingTracks = (updatedManifest.audio || []).filter(
      (t) => !generatedTracks.some((gt) => gt.id === t.id)
    );
    updatedManifest.audio = [...existingTracks, ...generatedTracks];

    // Check if canvas duration needs expansion
    let canvasDurationExpanded = false;
    const finalFrame = Math.max(...updatedManifest.dialog.map((d) => d.endFrame)) + 15;
    const currentCanvasDuration = updatedManifest.canvas?.durationInFrames ?? 150;

    if (expandCanvas && finalFrame > currentCanvasDuration) {
      if (!updatedManifest.canvas) {
        updatedManifest.canvas = { width: 1920, height: 1080, fps, durationInFrames: finalFrame };
      } else {
        updatedManifest.canvas.durationInFrames = finalFrame;
      }
      canvasDurationExpanded = true;
    }

    return {
      manifest: updatedManifest,
      generatedTracks,
      totalVoiceoverDurationSeconds: totalDurationSeconds,
      totalVoiceoverDurationFrames: Math.ceil(totalDurationSeconds * fps),
      canvasDurationExpanded,
      lineResults,
    };
  }
}

export const defaultVoiceoverService = new VoiceoverService();
