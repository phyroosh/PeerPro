import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EdgeTTSVoiceoverProvider } from '../../src/core/voiceover/providers/edge-tts.provider';
import { defaultVoiceoverService } from '../../src/core/voiceover/service';

describe('Microsoft Edge Neural TTS Live Integration & Smoke Test', () => {
  const provider = new EdgeTTSVoiceoverProvider();

  it('checks provider availability on local system', async () => {
    const available = await provider.isAvailable();
    assert.strictEqual(available, true, 'Edge TTS provider must be available on system');
  });

  it('discovers live neural voices from Edge TTS service with metadata', async () => {
    const voices = await provider.listVoices();
    assert.ok(voices.length > 50, `Expected at least 50 voices, got ${voices.length}`);

    const jenny = voices.find((v) => v.id === 'en-US-JennyNeural');
    assert.ok(jenny, 'Voice list must include en-US-JennyNeural');
    assert.strictEqual(jenny?.locale, 'en-US');
    assert.strictEqual(jenny?.gender, 'Female');
    assert.strictEqual(jenny?.provider, 'edge-tts');

    const guy = voices.find((v) => v.id === 'en-US-GuyNeural');
    assert.ok(guy, 'Voice list must include en-US-GuyNeural');
    assert.strictEqual(guy?.locale, 'en-US');
    assert.strictEqual(guy?.gender, 'Male');
  });

  it('synthesizes natural speech, formats to 48kHz WAV, and verifies cache', async () => {
    const testText = 'Hello! This is a real Microsoft Edge neural text to speech test for PeerPro.';
    const tempOut = path.resolve(
      __dirname,
      '..',
      '..',
      'out',
      'test-live-edge-synthesis.wav'
    );

    if (fs.existsSync(tempOut)) {
      fs.unlinkSync(tempOut);
    }

    const firstResult = await provider.synthesize({
      text: testText,
      voice: 'en-US-JennyNeural',
      outputPath: tempOut,
      parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
      format: 'wav',
      useCache: false,
    });

    assert.strictEqual(fs.existsSync(firstResult.audioFilePath), true);
    assert.ok(firstResult.durationSeconds > 1.5, `Expected duration > 1.5s, got ${firstResult.durationSeconds}`);
    assert.ok(firstResult.durationInFrames > 45, `Expected frames > 45, got ${firstResult.durationInFrames}`);
    assert.strictEqual(firstResult.sampleRate, 48000);
    assert.strictEqual(firstResult.channels, 2);
    assert.strictEqual(firstResult.cacheHit, false);

    // Second call with caching enabled
    const cachedResult = await provider.synthesize({
      text: testText,
      voice: 'en-US-JennyNeural',
      outputPath: tempOut,
      parameters: { rate: '+0%', pitch: '+0Hz', volume: '+0%' },
      format: 'wav',
      useCache: true,
    });

    assert.strictEqual(cachedResult.cacheHit, true);
    assert.strictEqual(cachedResult.durationSeconds, firstResult.durationSeconds);
  });
});
