import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneRenderer } from '../core/scene/SceneRenderer';
import { SceneManifest } from '../core/scene/types';
import { evaluateAllTrackVolumes } from '../core/audio/mixing';
import { computeLipSyncSchedule, evaluateLipSyncAtFrame } from '../core/audio/lipsync';

const audioNarrativeManifest: SceneManifest = {
  id: 'audio-narrative-showcase',
  name: 'Audio Narrative & Speech Lip-Sync Showcase',
  description: 'Synchronized anime speech viseme lip-syncing with automated background music ducking.',
  canvas: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 180,
    backgroundColor: '#070a13',
  },
  camera: {
    preset: 'slow-push-in',
    intensity: 0.6,
    focalDepth: 1.0,
    depthOfField: {
      enabled: true,
      aperture: 0.6,
      maxBlur: 8.0,
    },
  },
  environment: {
    preset: 'japanese-classroom',
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
            durationInFrames: 70,
            blendInFrames: 8,
            blendOutFrames: 8,
          },
          {
            action: 'point',
            startFrame: 90,
            durationInFrames: 75,
            blendInFrames: 8,
            blendOutFrames: 10,
          },
        ],
      },
    },
  ],
  dialog: [
    {
      id: 'd1',
      characterId: 'ren',
      speaker: 'Ren',
      text: 'Welcome to PeerPro! This is the audio and speech lip-sync showcase.',
      startFrame: 20,
      endFrame: 80,
      position: 'bottom',
    },
    {
      id: 'd2',
      characterId: 'ren',
      speaker: 'Ren',
      text: 'Notice how the background music ducks automatically while I speak!',
      startFrame: 95,
      endFrame: 165,
      position: 'bottom',
    },
  ],
  audio: [
    {
      id: 'ambient-room',
      type: 'ambient',
      startFrame: 0,
      durationInFrames: 180,
      volume: 0.45,
      fadeInFrames: 15,
      fadeOutFrames: 15,
      duckUnderDialog: true,
      duckFactor: 0.5,
    },
    {
      id: 'bgm-melody',
      type: 'bgm',
      startFrame: 0,
      durationInFrames: 180,
      volume: 0.85,
      fadeInFrames: 20,
      fadeOutFrames: 20,
      duckUnderDialog: true,
      duckFactor: 0.3,
    },
  ],
};

/**
 * Benchmark composition demonstrating Phase 18 Audio Mixing, Ducking, and Lip-Sync.
 */
export const AudioNarrativeShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Evaluate audio mixer telemetry
  const trackVolumes = useMemo(() => {
    return evaluateAllTrackVolumes(
      frame,
      audioNarrativeManifest.audio,
      audioNarrativeManifest.dialog
    );
  }, [frame]);

  // Evaluate active dialogue and current mouth viseme
  const activeDialog = audioNarrativeManifest.dialog?.find(
    (d) => frame >= d.startFrame && frame <= d.endFrame
  );

  const lipSyncKeyframe = useMemo(() => {
    if (!activeDialog) return { viseme: 'closed' as const, mouthAssetId: 'starter-char-mouth-closed' };
    const schedule = computeLipSyncSchedule(activeDialog, fps);
    return evaluateLipSyncAtFrame(frame, schedule);
  }, [activeDialog, frame, fps]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SceneRenderer manifest={audioNarrativeManifest} />

      {/* Audio & Lip-Sync Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          padding: '16px 22px',
          background: 'rgba(10, 16, 28, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          zIndex: 1000,
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          minWidth: 360,
        }}
      >
        <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1.2 }}>
          AUDIO NARRATIVE & LIP-SYNC DIRECTOR
        </div>
        <div>
          Timeline Frame: <span style={{ color: '#facc15' }}>{frame} / 180</span> ({(frame / fps).toFixed(2)}s)
        </div>
        <div>
          Speech Viseme: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{lipSyncKeyframe.viseme.toUpperCase()}</span>{' '}
          <span style={{ color: '#94a3b8', fontSize: 11 }}>({lipSyncKeyframe.mouthAssetId})</span>
        </div>
        {activeDialog ? (
          <div style={{ color: '#f472b6', marginTop: 4 }}>
            Active Line: &ldquo;{activeDialog.text.slice(0, 36)}...&rdquo;
          </div>
        ) : (
          <div style={{ color: '#64748b', marginTop: 4 }}>Active Line: [Silent / Idle Pause]</div>
        )}

        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, letterSpacing: 0.8 }}>
            MULTI-CHANNEL AUDIO METERS:
          </div>
          {trackVolumes.map((tv) => {
            const barWidth = Math.round(tv.volume * 160);
            const barColor = tv.isDucked ? '#f59e0b' : tv.type === 'bgm' ? '#38bdf8' : '#a78bfa';

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
