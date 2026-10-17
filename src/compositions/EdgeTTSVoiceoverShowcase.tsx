import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneRenderer } from '../core/scene/SceneRenderer';
import { SceneManifest } from '../core/scene/types';
import { evaluateAllTrackVolumes } from '../core/audio/mixing';
import { computeLipSyncSchedule, evaluateLipSyncAtFrame } from '../core/audio/lipsync';

const edgeTTSVoiceoverManifest: SceneManifest = {
  id: 'edge-tts-voiceover-showcase',
  name: 'Microsoft Edge Neural TTS Voiceover Showcase',
  description: 'Natural neural voiceover synthesis integrated with 2.5D animation, Remotion audio mixing, and anime mouth viseme lip-syncing.',
  canvas: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 180,
    backgroundColor: '#070a13',
  },
  camera: {
    preset: 'slow-push-in',
    intensity: 0.65,
    focalDepth: 1.0,
    depthOfField: {
      enabled: true,
      aperture: 0.6,
      maxBlur: 8.0,
    },
  },
  environment: {
    preset: 'japanese-street-corner',
  },
  characters: [
    {
      id: 'ren',
      characterId: 'student-ren-v2',
      variant: 'default',
      depth: 1.0,
      position: { x: 960, y: 920 },
      scale: 1.0,
      animation: {
        breathing: { frequency: 0.5, amplitude: 3.5 },
        actions: [
          {
            action: 'talk',
            startFrame: 15,
            durationInFrames: 100,
            blendInFrames: 8,
            blendOutFrames: 8,
          },
          {
            action: 'wave',
            startFrame: 120,
            durationInFrames: 55,
            blendInFrames: 6,
            blendOutFrames: 8,
          },
        ],
      },
    },
  ],
  dialog: [
    {
      id: 'vo-line-1',
      characterId: 'ren',
      speaker: 'Ren',
      text: 'Hey, meet me by the vending machine before sunset!',
      startFrame: 15,
      endFrame: 133,
      position: 'bottom',
      voice: 'en-US-JennyNeural',
      preset: 'natural-narration',
    },
  ],
  audio: [
    {
      id: 'vo-jenny',
      type: 'voiceover',
      src: 'audio/voiceovers/d5dd9224aff5140afb4fae46edad70c3fa2eef46e57c1772e5c2e6a75815382f.wav',
      startFrame: 15,
      durationInFrames: 118,
      volume: 1.0,
    },
    {
      id: 'bgm-ambience',
      type: 'bgm',
      startFrame: 0,
      durationInFrames: 180,
      volume: 0.75,
      fadeInFrames: 15,
      fadeOutFrames: 15,
      duckUnderDialog: true,
      duckFactor: 0.35,
    },
  ],
};

/**
 * Showcase composition demonstrating Microsoft Edge Neural TTS voiceover integration.
 */
export const EdgeTTSVoiceoverShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const trackVolumes = useMemo(() => {
    return evaluateAllTrackVolumes(
      frame,
      edgeTTSVoiceoverManifest.audio,
      edgeTTSVoiceoverManifest.dialog
    );
  }, [frame]);

  const activeDialog = edgeTTSVoiceoverManifest.dialog?.find(
    (d) => frame >= d.startFrame && frame <= d.endFrame
  );

  const lipSyncKeyframe = useMemo(() => {
    if (!activeDialog) return { viseme: 'closed' as const, mouthAssetId: 'starter-char-mouth-closed' };
    const schedule = computeLipSyncSchedule(activeDialog, fps);
    return evaluateLipSyncAtFrame(frame, schedule);
  }, [activeDialog, frame, fps]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SceneRenderer manifest={edgeTTSVoiceoverManifest} />

      {/* Edge TTS Neural Voiceover Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          padding: '16px 22px',
          background: 'rgba(10, 16, 28, 0.90)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          zIndex: 1000,
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          minWidth: 380,
        }}
      >
        <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: 6, letterSpacing: 1.2 }}>
          MICROSOFT EDGE NEURAL TTS DIRECTOR
        </div>
        <div>
          Timeline Frame: <span style={{ color: '#facc15' }}>{frame} / 180</span> ({(frame / fps).toFixed(2)}s)
        </div>
        <div>
          Active Voice: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>en-US-JennyNeural</span>{' '}
          <span style={{ color: '#94a3b8', fontSize: 11 }}>(Natural Neural)</span>
        </div>
        <div>
          Preset / Cadence: <span style={{ color: '#a78bfa' }}>Natural Narration</span> (Rate: +0%, Pitch: +0Hz)
        </div>
        <div>
          Lip-Sync Viseme: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{lipSyncKeyframe.viseme.toUpperCase()}</span>{' '}
          <span style={{ color: '#94a3b8', fontSize: 11 }}>({lipSyncKeyframe.mouthAssetId})</span>
        </div>
        {activeDialog ? (
          <div style={{ color: '#f472b6', marginTop: 4 }}>
            Active Line: &ldquo;{activeDialog.text}&rdquo;
          </div>
        ) : (
          <div style={{ color: '#64748b', marginTop: 4 }}>Active Line: [Silent Pause]</div>
        )}

        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, letterSpacing: 0.8 }}>
            MULTI-CHANNEL AUDIO METERS:
          </div>
          {trackVolumes.map((tv) => {
            const barWidth = Math.round(tv.volume * 160);
            const barColor = tv.isDucked ? '#f59e0b' : tv.type === 'voiceover' ? '#4ade80' : '#38bdf8';

            return (
              <div key={tv.trackId} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ width: 110, fontSize: 11, color: '#cbd5e1' }}>
                  {tv.trackId}:
                </span>
                <div
                  style={{
                    width: 160,
                    height: 10,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginRight: 8,
                  }}
                >
                  <div
                    style={{
                      width: barWidth,
                      height: '100%',
                      background: barColor,
                      transition: 'width 0.1s linear',
                    }}
                  />
                </div>
                <span style={{ width: 45, fontSize: 11, color: barColor }}>
                  {Math.round(tv.volume * 100)}%
                </span>
                {tv.isDucked && (
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 'bold', marginLeft: 4 }}>
                    [DUCKED]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
