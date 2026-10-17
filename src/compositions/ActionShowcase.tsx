import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneRenderer } from '../core/scene/SceneRenderer';
import { SceneManifest } from '../core/scene/types';
import { defaultAssetRegistry } from '../core/assets/registry';
import { evaluateCharacterActions } from '../core/animation/actions';
import { CharacterActionClip } from '../core/animation/types';

const showcaseActions: CharacterActionClip[] = [
  {
    id: 'act-idle-start',
    action: 'idle',
    startFrame: 0,
    durationInFrames: 30,
    blendInFrames: 0,
    blendOutFrames: 8,
  },
  {
    id: 'act-bow',
    action: 'bow',
    startFrame: 30,
    durationInFrames: 45,
    blendInFrames: 8,
    blendOutFrames: 8,
    intensity: 1.0,
    options: { bowAngle: 22 },
  },
  {
    id: 'act-wave',
    action: 'wave',
    startFrame: 75,
    durationInFrames: 45,
    blendInFrames: 8,
    blendOutFrames: 8,
    intensity: 1.0,
    options: { waveFrequency: 2.4 },
  },
  {
    id: 'act-talk',
    action: 'talk',
    startFrame: 120,
    durationInFrames: 45,
    blendInFrames: 8,
    blendOutFrames: 8,
    intensity: 1.0,
  },
  {
    id: 'act-think',
    action: 'think',
    startFrame: 165,
    durationInFrames: 15,
    blendInFrames: 6,
    blendOutFrames: 0,
    intensity: 1.0,
  },
];

const actionShowcaseManifest: SceneManifest = {
  id: 'action-showcase-scene',
  name: 'Character Action & Timeline Showcase',
  description: 'Choreographed character performance demonstrating seamless blending across idle, bow, wave, talk, and think.',
  canvas: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 180,
  },
  camera: {
    preset: 'slow-push-in',
    intensity: 0.5,
    focalDepth: 1.0,
  },
  environment: {
    preset: 'japanese-classroom',
  },
  characters: [
    {
      id: 'actor-ren',
      characterId: 'student-articulated',
      depth: 1.0,
      position: { x: 960, y: 890 },
      scale: 0.95,
      animation: {
        breathing: { frequency: 0.5, amplitude: 2.5 },
        headTilt: { frequency: 0.25, maxAngle: 1.5 },
        actions: showcaseActions,
      },
    },
  ],
  dialog: [
    {
      id: 'd1',
      speaker: 'Ren',
      text: 'Good afternoon, everyone! Welcome back to class.',
      startFrame: 30,
      endFrame: 110,
    },
    {
      id: 'd2',
      speaker: 'Ren',
      text: 'Today we explore dynamic animation actions and timeline composition.',
      startFrame: 120,
      endFrame: 175,
    },
  ],
};

export const ActionShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const actionState = evaluateCharacterActions(frame, fps, showcaseActions, 'idle');

  return (
    <div style={{ position: 'relative', width: 1920, height: 1080, overflow: 'hidden' }}>
      <SceneRenderer
        manifest={actionShowcaseManifest}
        registry={defaultAssetRegistry}
      />

      {/* Action Telemetry HUD Overlay */}
      <div
        data-testid="action-telemetry-hud"
        style={{
          position: 'absolute',
          top: 36,
          left: 44,
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 12,
          color: '#f8fafc',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 1500,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>
          PEERPRO MOTION TIMELINE
        </div>
        <div>Frame: {frame} / 180 ({(frame / fps).toFixed(2)}s)</div>
        <div>
          Active Action:{' '}
          <span style={{ color: '#facc15', fontWeight: 600 }}>
            {actionState.activeActionName.toUpperCase()}
          </span>
        </div>
        <div>Action Progress: {(actionState.actionProgress * 100).toFixed(1)}%</div>
        <div>Blend Weight: {actionState.blendWeight.toFixed(2)}</div>
        <div>Active Pose: {actionState.pose}</div>
        <div>
          Joint Rotations: ArmL {actionState.jointRotations.armLeft?.toFixed(1)}° | ArmR{' '}
          {actionState.jointRotations.armRight?.toFixed(1)}° | Head{' '}
          {actionState.jointRotations.headTilt?.toFixed(1)}°
        </div>
        <div>
          Root Offset: Y {actionState.rootOffset.y.toFixed(1)}px | Pitch{' '}
          {actionState.rootOffset.rotation.toFixed(1)}° | ScaleY{' '}
          {actionState.rootOffset.scaleY.toFixed(3)}
        </div>
      </div>
    </div>
  );
};
