import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Camera25D, useCamera25D } from '../core/camera/Camera25D';
import { CameraPresetName } from '../core/camera/types';
import { computeParallax } from '../core/camera/parallax';
import {
  computeBreathing,
  computeHeadTilt,
  resolveExpressionSchedule,
} from '../core/animation/primitives';
import { Environment } from '../core/environments/Environment';
import { japaneseStreetCornerPreset } from '../core/environments/presets';
import { Character } from '../core/characters/Character';
import { studentCharacterDefinition } from '../core/characters/presets';
import { DriftingPetals } from '../core/effects/DriftingPetals';

export interface ParallaxTestProps {
  cameraPreset?: CameraPresetName;
  cameraIntensity?: number;
  showHud?: boolean;
}

/**
 * Character rendered at depth 1.0 (the focal plane) with breathing bobbing,
 * subtle body sway/tilt, and dynamic expression schedule.
 */
const AnimatedHeroCharacter: React.FC<{
  depth?: number;
  baseX?: number;
  baseY?: number;
}> = ({ depth = 1.0, baseX = 980, baseY = 920 }) => {
  const { camera, frame } = useCamera25D();
  const { fps } = useVideoConfig();

  const parallax = computeParallax(camera, depth);
  const breathing = computeBreathing(frame, fps, {
    frequency: 0.5,
    amplitude: 3.5,
    scaleYAmount: 0.008,
  });
  const headTilt = computeHeadTilt(frame, fps, {
    frequency: 0.35,
    maxAngle: 1.8,
  });

  const expressions = resolveExpressionSchedule(frame, [
    {
      startFrame: 0,
      eyes: 'starter-char-eyes-neutral',
      mouth: 'starter-char-mouth-closed',
    },
    {
      startFrame: 35,
      eyes: 'starter-char-eyes-wink',
      mouth: 'starter-char-mouth-smile',
    },
    {
      startFrame: 80,
      eyes: 'starter-char-eyes-wide',
      mouth: 'starter-char-mouth-closed',
    },
  ]);

  const x = baseX + parallax.offsetX;
  const y = baseY + parallax.offsetY + breathing.offsetY;
  const scale = 0.95 * parallax.scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 15, // positioned above background/storefront, below foreground tree
        transform: `scale(1, ${breathing.scaleY}) rotate(${headTilt}deg)`,
        transformOrigin: '0 0',
      }}
    >
      <Character
        definition={studentCharacterDefinition}
        partOverrides={{
          ...(expressions.eyes ? { eyes: expressions.eyes } : {}),
          ...(expressions.mouth ? { mouth: expressions.mouth } : {}),
        }}
        scale={scale}
      />
    </div>
  );
};

/**
 * HUD telemetry overlay showing camera displacement, zoom, and character animation state.
 */
const ParallaxTelemetryHUD: React.FC = () => {
  const { camera, frame } = useCamera25D();
  const { durationInFrames, fps } = useVideoConfig();

  const breathing = computeBreathing(frame, fps);
  const headTilt = computeHeadTilt(frame, fps);

  return (
    <div
      style={{
        position: 'absolute',
        top: 36,
        left: 48,
        backgroundColor: 'rgba(11, 15, 25, 0.88)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 14,
        padding: '14px 22px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
        zIndex: 500,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: '#38bdf8',
          marginBottom: 4,
        }}
      >
        Phase 6 • 2.5D Camera & Parallax Toolkit
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
        Dynamic Multi-Plane Parallax Scene
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto auto auto',
          gap: '16px',
          marginTop: 10,
          fontSize: 12,
          color: '#cbd5e1',
          borderTop: '1px solid rgba(51, 65, 85, 0.6)',
          paddingTop: 8,
        }}
      >
        <div>
          <span style={{ color: '#94a3b8' }}>Frame: </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f8fafc' }}>
            {frame}/{durationInFrames}
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Cam X: </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
            {camera.x >= 0 ? `+${camera.x.toFixed(1)}` : camera.x.toFixed(1)}px
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Zoom: </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#a78bfa' }}>
            {camera.zoom.toFixed(3)}x
          </span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Breath / Tilt: </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f472b6' }}>
            {breathing.offsetY.toFixed(1)}px / {headTilt.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
};

export const ParallaxTest: React.FC<ParallaxTestProps> = ({
  cameraPreset = 'pan-left-to-right',
  cameraIntensity = 1.0,
  showHud = true,
}) => {
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <SceneCanvas width={width} height={height} backgroundColor="#090d16">
      <Camera25D
        config={{
          preset: cameraPreset,
          intensity: cameraIntensity,
          durationInFrames,
          focalDepth: 1.0,
        }}
      >
        {/* Layered Multi-Plane Environment */}
        <Environment definition={japaneseStreetCornerPreset} />

        {/* Character on Focal Plane */}
        <AnimatedHeroCharacter depth={1.0} baseX={980} baseY={920} />

        {/* Atmospheric Foreground Drifting Petals */}
        <DriftingPetals count={32} depth={1.3} color="#fbcfe8" opacity={0.82} />

        {/* Telemetry HUD Overlay */}
        {showHud && <ParallaxTelemetryHUD />}
      </Camera25D>
    </SceneCanvas>
  );
};
