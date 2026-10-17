import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidPitch,
  isValidRate,
  isValidVolume,
  validateAndNormalizeParameters,
  VOICEOVER_PRESETS,
  getVoiceoverPreset,
} from '../../src/core/voiceover/presets';
import {
  chunkNarrationText,
  normalizeNarrationText,
  splitIntoSentences,
} from '../../src/core/voiceover/text';
import {
  computeVoiceoverCacheKey,
} from '../../src/core/voiceover/cache';
import {
  VoiceoverProviderRegistry,
} from '../../src/core/voiceover/registry';
import { VoiceoverService } from '../../src/core/voiceover/service';
import {
  VoiceMetadata,
  VoiceoverProvider,
  VoiceoverSynthesisRequest,
  VoiceoverSynthesisResult,
} from '../../src/core/voiceover/types';
import { SceneManifest } from '../../src/core/scene/types';

describe('Voiceover & Microsoft Edge Neural TTS Subsystem', () => {
  describe('Speech Parameters & Presets', () => {
    it('validates rate parameters accurately', () => {
      assert.strictEqual(isValidRate('+0%'), true);
      assert.strictEqual(isValidRate('-10%'), true);
      assert.strictEqual(isValidRate('+25%'), true);
      assert.strictEqual(isValidRate('0%'), true);
      assert.strictEqual(isValidRate('fast'), false);
      assert.strictEqual(isValidRate('100'), false);
    });

    it('validates pitch parameters accurately', () => {
      assert.strictEqual(isValidPitch('+0Hz'), true);
      assert.strictEqual(isValidPitch('-5Hz'), true);
      assert.strictEqual(isValidPitch('+12Hz'), true);
      assert.strictEqual(isValidPitch('high'), false);
      assert.strictEqual(isValidPitch('+10%'), false);
    });

    it('validates volume parameters accurately', () => {
      assert.strictEqual(isValidVolume('+0%'), true);
      assert.strictEqual(isValidVolume('-20%'), true);
      assert.strictEqual(isValidVolume('loud'), false);
    });

    it('resolves preset configurations with conservative defaults', () => {
      const natural = getVoiceoverPreset('natural-narration');
      assert.strictEqual(natural.parameters.rate, '+0%');
      assert.strictEqual(natural.parameters.pitch, '+0Hz');
      assert.strictEqual(natural.parameters.volume, '+0%');

      const storytelling = getVoiceoverPreset('calm-storytelling');
      assert.strictEqual(storytelling.parameters.rate, '-5%');
      assert.strictEqual(storytelling.parameters.pitch, '-2Hz');

      const energetic = getVoiceoverPreset('energetic-narration');
      assert.strictEqual(energetic.parameters.rate, '+10%');
      assert.strictEqual(energetic.parameters.pitch, '+4Hz');

      const reflective = getVoiceoverPreset('reflective-narration');
      assert.strictEqual(reflective.parameters.rate, '-10%');
      assert.strictEqual(reflective.parameters.pitch, '-4Hz');
    });

    it('normalizes parameters and merges overrides onto presets', () => {
      const params = validateAndNormalizeParameters({ pitch: '+6Hz' }, 'calm-storytelling');
      assert.strictEqual(params.rate, '-5%'); // From calm-storytelling
      assert.strictEqual(params.pitch, '+6Hz'); // Overridden
      assert.strictEqual(params.volume, '+0%');
    });

    it('throws actionable error when invalid parameters are supplied', () => {
      assert.throws(() => {
        validateAndNormalizeParameters({ rate: 'super-fast' });
      }, /Invalid speech rate/);

      assert.throws(() => {
        validateAndNormalizeParameters({ pitch: 'screech' });
      }, /Invalid speech pitch/);
    });
  });

  describe('Narration Text Preparation & Chunking', () => {
    it('normalizes typography while preserving exact script content', () => {
      const input = '  "Hello world"—this is\tan anime narration.  \n\nNext line.\x00 ';
      const normalized = normalizeNarrationText(input);
      assert.strictEqual(normalized, '"Hello world"—this is an anime narration.\n\nNext line.');
    });

    it('splits text into sentence boundaries cleanly', () => {
      const script =
        'Have you ever wondered how the internet works? It is truly amazing! Thousands of servers run day and night.';
      const sentences = splitIntoSentences(script);
      assert.strictEqual(sentences.length, 3);
      assert.strictEqual(sentences[0], 'Have you ever wondered how the internet works?');
      assert.strictEqual(sentences[1], 'It is truly amazing!');
      assert.strictEqual(sentences[2], 'Thousands of servers run day and night.');
    });

    it('chunks long narration scripts without cutting words or sentences', () => {
      const longScript = [
        'Sentence one is introducing the core concept of networks.',
        'Sentence two explains how packets travel under the ocean.',
        'Sentence three describes how routers direct high-speed light pulses.',
        'Sentence four finishes the complete educational narrative cleanly.',
      ].join(' ');

      const chunks = chunkNarrationText(longScript, 120);
      assert.ok(chunks.length >= 2);

      // Verify no text is dropped or repeated
      const reconstructed = chunks.map((c) => c.text).join(' ');
      assert.strictEqual(reconstructed, longScript);

      // Verify each chunk is bounded
      chunks.forEach((c) => {
        assert.ok(c.charCount <= 120);
      });
    });
  });

  describe('Deterministic Caching', () => {
    it('produces identical cache key for identical parameters and normalized text', () => {
      const key1 = computeVoiceoverCacheKey({
        text: '  Hello world!  ',
        voice: 'en-US-JennyNeural',
        providerId: 'edge-tts',
        parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
        format: 'wav',
      });

      const key2 = computeVoiceoverCacheKey({
        text: 'Hello world!',
        voice: 'en-US-JennyNeural',
        providerId: 'edge-tts',
        parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
        format: 'wav',
      });

      assert.strictEqual(key1, key2);
      assert.strictEqual(key1.length, 64);
    });

    it('produces distinct cache keys when voice or speech parameters change', () => {
      const baseParams = {
        text: 'Welcome to PeerPro',
        voice: 'en-US-JennyNeural',
        providerId: 'edge-tts' as const,
        parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
        format: 'wav' as const,
      };

      const keyBase = computeVoiceoverCacheKey(baseParams);
      const keyDiffVoice = computeVoiceoverCacheKey({ ...baseParams, voice: 'en-US-GuyNeural' });
      const keyDiffRate = computeVoiceoverCacheKey({
        ...baseParams,
        parameters: { rate: '+10%', pitch: '+0Hz', volume: '+0%' },
      });

      assert.notStrictEqual(keyBase, keyDiffVoice);
      assert.notStrictEqual(keyBase, keyDiffRate);
    });
  });

  describe('Voiceover Provider Registry & Discovery', () => {
    it('defaults to edge-tts provider', () => {
      const registry = new VoiceoverProviderRegistry();
      assert.strictEqual(registry.getDefaultProviderId(), 'edge-tts');
      const provider = registry.get();
      assert.strictEqual(provider.id, 'edge-tts');
    });

    it('retrieves registered espeak fallback provider when explicitly requested', () => {
      const registry = new VoiceoverProviderRegistry();
      const espeak = registry.get('espeak');
      assert.strictEqual(espeak.id, 'espeak');
    });

    it('throws error for unknown provider ID', () => {
      const registry = new VoiceoverProviderRegistry();
      assert.throws(() => {
        registry.get('nonexistent-tts' as any);
      }, /is not registered/);
    });
  });

  describe('Voiceover Service & Scene Synchronization', () => {
    class MockProvider implements VoiceoverProvider {
      readonly id = 'edge-tts' as const;
      readonly name = 'Mock Edge TTS';
      synthesizeCount = 0;

      async isAvailable(): Promise<boolean> {
        return true;
      }

      async listVoices(): Promise<VoiceMetadata[]> {
        return [
          {
            id: 'en-US-JennyNeural',
            displayName: 'Microsoft Jenny Online (Natural) - English (United States)',
            locale: 'en-US',
            localeName: 'English (United States)',
            gender: 'Female',
            provider: 'edge-tts',
          },
          {
            id: 'ja-JP-NanamiNeural',
            displayName: 'Microsoft Nanami Online (Natural) - Japanese (Japan)',
            locale: 'ja-JP',
            localeName: 'Japanese (Japan)',
            gender: 'Female',
            provider: 'edge-tts',
          },
        ];
      }

      async synthesize(req: VoiceoverSynthesisRequest): Promise<VoiceoverSynthesisResult> {
        this.synthesizeCount++;
        const durationSeconds = 3.5;
        const fps = 30;
        return {
          audioFilePath: req.outputPath || `/mock/audio/${req.voice}.wav`,
          relativePublicPath: `audio/voiceovers/${req.voice}.wav`,
          durationSeconds,
          durationInFrames: Math.ceil(durationSeconds * fps),
          fps,
          sampleRate: 48000,
          channels: 2,
          format: 'wav',
          provider: 'edge-tts',
          voice: req.voice || 'en-US-JennyNeural',
          parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
          cacheHit: false,
          fileSizeBytes: 336000,
        };
      }
    }

    it('filters discovered voices by locale and query', async () => {
      const registry = new VoiceoverProviderRegistry();
      const mock = new MockProvider();
      registry.register(mock);
      const service = new VoiceoverService({ registry });

      const enVoices = await service.discoverVoices({ locale: 'en-US' });
      assert.strictEqual(enVoices.length, 1);
      assert.strictEqual(enVoices[0].id, 'en-US-JennyNeural');

      const searchVoices = await service.discoverVoices({ search: 'Nanami' });
      assert.strictEqual(searchVoices.length, 1);
      assert.strictEqual(searchVoices[0].id, 'ja-JP-NanamiNeural');
    });

    it('synchronizes voiceovers onto scene manifest and expands canvas duration', async () => {
      const registry = new VoiceoverProviderRegistry();
      const mock = new MockProvider();
      registry.register(mock);
      const service = new VoiceoverService({ registry });

      const sampleScene: SceneManifest = {
        id: 'test-narrative',
        name: 'Test Narrative',
        canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 100 },
        dialog: [
          {
            id: 'd1',
            speaker: 'Ren',
            text: 'First line of anime dialogue.',
            startFrame: 10,
            endFrame: 40,
          },
          {
            id: 'd2',
            speaker: 'Kai',
            text: 'Second response line.',
            startFrame: 50,
            endFrame: 80,
          },
        ],
        audio: [
          {
            id: 'bgm',
            type: 'bgm',
            startFrame: 0,
            durationInFrames: 100,
            volume: 0.8,
          },
        ],
      };

      const result = await service.applyVoiceoverToScene(sampleScene, {
        defaultVoice: 'en-US-JennyNeural',
        pauseBetweenLinesFrames: 10,
      });

      assert.strictEqual(result.lineResults.length, 2);
      assert.strictEqual(result.generatedTracks.length, 2);
      assert.strictEqual(mock.synthesizeCount, 2);

      // Line 1: start at 10, duration 3.5s * 30fps = 105 frames -> end at 115
      const l1 = result.lineResults[0];
      assert.strictEqual(l1.startFrame, 10);
      assert.strictEqual(l1.durationInFrames, 105);
      assert.strictEqual(l1.endFrame, 115);

      // Line 2: start at 115 + 10 pause = 125, duration 105 -> end at 230
      const l2 = result.lineResults[1];
      assert.strictEqual(l2.startFrame, 125);
      assert.strictEqual(l2.durationInFrames, 105);
      assert.strictEqual(l2.endFrame, 230);

      // Canvas duration must be expanded beyond 230 + 15 = 245
      assert.strictEqual(result.canvasDurationExpanded, true);
      assert.strictEqual(result.manifest.canvas?.durationInFrames, 245);

      // Manifest audio must include BGM plus the two new voiceover tracks
      assert.strictEqual(result.manifest.audio?.length, 3);
      const voTracks = result.manifest.audio?.filter((t) => t.type === 'voiceover');
      assert.strictEqual(voTracks?.length, 2);
    });
  });
});
