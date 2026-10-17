import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';

export interface PeerProSandboxProps {
  title?: string;
  badgeColor?: string;
}

export const PeerProSandbox: React.FC<PeerProSandboxProps> = ({
  title = 'PeerPro 2.5D Animation Playground',
  badgeColor = '#38bdf8',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Deterministic spring animation for the star entrance (frame 0 -> 30)
  const starScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    },
  });

  // Deterministic horizontal drift for background element
  const bgDrift = interpolate(frame, [0, 150], [0, 40], {
    extrapolateRight: 'clamp',
  });

  // Deterministic vertical floating motion for midground star (sine wave)
  const floatY = Math.sin((frame / fps) * Math.PI * 2) * 15;

  // Foreground text fade-in and slide-up
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneCanvas width={width} height={height} backgroundColor="#090d16">
      {/* 1. Background Plane: Subtle dusk gradient & horizon line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: -50 + bgDrift,
          width: width + 100,
          height: height,
          background: 'radial-gradient(ellipse at 50% 80%, #1e1b4b 0%, #030712 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: 0,
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, #312e81 20%, #4338ca 50%, #312e81 80%, transparent)',
          opacity: 0.6,
        }}
      />

      {/* 2. Midground Plane: Scaled SVG loaded via staticFile */}
      <div
        style={{
          position: 'absolute',
          left: width / 2 - 80,
          top: height / 2 - 120 + floatY,
          transform: `scale(${starScale}) rotate(${frame * 0.5}deg)`,
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 0 25px rgba(250, 204, 21, 0.4))',
        }}
      >
        <Img
          src={staticFile('peerpro-assets/smoke/star.svg')}
          style={{ width: 160, height: 160 }}
          alt="PeerPro Star"
        />
      </div>

      {/* 3. Foreground Plane: UI Card & Frame counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: `translateX(-50%) translateY(${titleY}px)`,
          opacity: titleOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: badgeColor,
            marginBottom: 8,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            padding: '6px 16px',
            borderRadius: 9999,
            border: `1px solid rgba(56, 189, 248, 0.3)`,
          }}
        >
          Phase 2 Smoke Test
        </div>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 18,
            color: '#94a3b8',
            margin: 0,
          }}
        >
          Frame-Deterministic Remotion Execution • Frame #{frame} / 150
        </p>
      </div>
    </SceneCanvas>
  );
};
