import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeLipSyncSchedule, evaluateLipSyncAtFrame } from '../../src/core/audio/lipsync';
import { computeTrackVolume, evaluateAllTrackVolumes } from '../../src/core/audio/mixing';
import { SceneAudioTrackSchema } from '../../src/core/audio/schema';
import { SceneAudioTrack } from '../../src/core/audio/types';
import { SceneDialogLine } from '../../src/core/scene/types';

describe('Voiceover, Sound & Shot Timing System', () => {
  describe('Speech Lip-Sync & Viseme Scheduler', () => {
    const dialog: SceneDialogLine = {
      id: 'd1',
      characterId: 'ren',
      speaker: 'Ren',
      text: 'Hello world! Welcome to anime animation.',
      startFrame: 30,
      endFrame: 90,
    };

    it('generates rhythmic mouth viseme keyframes across speech duration', () => {
      const schedule = computeLipSyncSchedule(dialog, 30);

      assert.ok(schedule.length > 5, `Expected multiple keyframes, got ${schedule.length}`);
      assert.strictEqual(schedule[0].frame, 29); // Pre-speech closed
      assert.strictEqual(schedule[0].viseme, 'closed');

      const visemes = schedule.map((k) => k.viseme);
      assert.ok(visemes.includes('open'), 'Schedule must include open mouth');
      assert.ok(visemes.includes('smile'), 'Schedule must include smile viseme');
      assert.ok(visemes.includes('closed'), 'Schedule must include closed mouth');
    });

    it('evaluates active viseme and mouth asset ID at arbitrary frames', () => {
      const schedule = computeLipSyncSchedule(dialog, 30);

      // Before speech starts
      const preSpeech = evaluateLipSyncAtFrame(10, schedule);
      assert.strictEqual(preSpeech.viseme, 'closed');
      assert.strictEqual(preSpeech.mouthAssetId, 'starter-char-mouth-closed');

      // During speech (frame 30 = start)
      const duringSpeech = evaluateLipSyncAtFrame(30, schedule);
      assert.ok(['open', 'smile'].includes(duringSpeech.viseme));

      // After speech ends (frame 95)
      const postSpeech = evaluateLipSyncAtFrame(95, schedule);
      assert.ok(['closed', 'smile'].includes(postSpeech.viseme));
    });

    it('handles single-word dialogue cleanly without NaN frames', () => {
      const shortDialog: SceneDialogLine = {
        id: 'd2',
        speaker: 'Ren',
        text: 'Hi!',
        startFrame: 10,
        endFrame: 25,
      };

      const schedule = computeLipSyncSchedule(shortDialog, 30);
      assert.ok(schedule.length >= 2);
      schedule.forEach((kf) => {
        assert.ok(!Number.isNaN(kf.frame));
        assert.ok(kf.mouthAssetId.length > 0);
      });
    });
  });

  describe('Audio Mixing & Automated Ducking', () => {
    const bgmTrack: SceneAudioTrack = {
      id: 'bgm-test',
      type: 'bgm',
      startFrame: 0,
      durationInFrames: 120,
      volume: 0.8,
      fadeInFrames: 20,
      fadeOutFrames: 20,
      duckUnderDialog: true,
      duckFactor: 0.35,
    };

    const dialogLines: SceneDialogLine[] = [
      {
        id: 'speech',
        speaker: 'Ren',
        text: 'Speaking line',
        startFrame: 40,
        endFrame: 70,
      },
    ];

    it('returns 0 volume outside track active timeline', () => {
      const beforeStart = computeTrackVolume(-5, bgmTrack);
      assert.strictEqual(beforeStart, 0.0);

      const afterEnd = computeTrackVolume(130, bgmTrack);
      assert.strictEqual(afterEnd, 0.0);
    });

    it('ramps up volume monotonically during fade-in', () => {
      const v0 = computeTrackVolume(0, bgmTrack);
      const v10 = computeTrackVolume(10, bgmTrack);
      const v20 = computeTrackVolume(20, bgmTrack);

      assert.strictEqual(v0, 0.0);
      assert.ok(v10 > v0, 'Volume at frame 10 should exceed frame 0');
      assert.ok(v20 >= v10, 'Volume at frame 20 should reach or exceed frame 10');
      assert.strictEqual(v20, 0.8);
    });

    it('ramps down volume monotonically during fade-out', () => {
      const v100 = computeTrackVolume(100, bgmTrack);
      const v110 = computeTrackVolume(110, bgmTrack);
      const v120 = computeTrackVolume(120, bgmTrack);

      assert.strictEqual(v100, 0.8);
      assert.ok(v110 < v100, 'Volume at frame 110 should be less than frame 100');
      assert.strictEqual(v120, 0.0);
    });

    it('automatically ducks BGM volume when character dialogue is active', () => {
      const vUnducked = computeTrackVolume(30, bgmTrack, dialogLines);
      const vDucked = computeTrackVolume(50, bgmTrack, dialogLines);

      assert.strictEqual(vUnducked, 0.8);
      // Ducked volume: 0.8 * 0.35 = 0.28
      assert.strictEqual(vDucked, 0.28);
      assert.ok(vDucked < vUnducked, 'Ducked volume must be lower than unducked volume');
    });

    it('evaluates multi-track volume states and reports ducked telemetry status', () => {
      const ambientTrack: SceneAudioTrack = {
        id: 'ambient-test',
        type: 'ambient',
        startFrame: 0,
        durationInFrames: 120,
        volume: 0.5,
        duckUnderDialog: false, // does not duck
      };

      const statesDuringSpeech = evaluateAllTrackVolumes(50, [bgmTrack, ambientTrack], dialogLines);

      assert.strictEqual(statesDuringSpeech.length, 2);
      const bgmState = statesDuringSpeech.find((s) => s.trackId === 'bgm-test');
      const ambientState = statesDuringSpeech.find((s) => s.trackId === 'ambient-test');

      assert.strictEqual(bgmState?.isDucked, true);
      assert.strictEqual(bgmState?.volume, 0.28);

      assert.strictEqual(ambientState?.isDucked, false);
      assert.strictEqual(ambientState?.volume, 0.5);
    });
  });

  describe('Audio Schema Validation', () => {
    it('validates a compliant SceneAudioTrack cleanly', () => {
      const validTrack: SceneAudioTrack = {
        id: 'track-01',
        type: 'bgm',
        startFrame: 10,
        durationInFrames: 100,
        volume: 0.75,
        fadeInFrames: 15,
        fadeOutFrames: 15,
        duckUnderDialog: true,
      };

      const result = SceneAudioTrackSchema.safeParse(validTrack);
      assert.strictEqual(result.success, true);
    });

    it('rejects negative startFrame', () => {
      const invalid = { id: 'bad', type: 'bgm', startFrame: -5 };
      const result = SceneAudioTrackSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects volume greater than 1.0', () => {
      const invalid = { id: 'loud', type: 'sfx', startFrame: 0, volume: 1.5 };
      const result = SceneAudioTrackSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });
  });
});
