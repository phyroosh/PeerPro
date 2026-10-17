import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence, interpolate } from 'remotion';
import { SceneCanvas } from '../../core/scene/SceneCanvas';
import { Character } from '../../core/characters/Character';
import { studentCharacterDefinition } from '../../core/characters/presets';

export const MultiShotIdentityChallenge: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Shot 1 is frames 0..60, Shot 2 is frames 61..120
  const isShot1 = frame <= 60;
  const shotLocalFrame = isShot1 ? frame : frame - 60;

  // Breathing motion
  const breathing = Math.sin((shotLocalFrame / fps) * Math.PI * 1.5) * 3;

  return (
    <SceneCanvas width={width} height={height} backgroundColor="#090d16">
      {/* Background Gradient & Room Tone */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, #1e293b 0%, #090d16 85%)',
        }}
      />

      {/* Shot 1: Medium Staging (Frames 0 to 60) */}
      <Sequence from={0} durationInFrames={60} name="Shot1-Medium">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `translateY(${breathing}px)`,
          }}
        >
          <div style={{ position: 'absolute', left: 960, top: 880, transform: 'translate(-50%, -100%) scale(1.0)' }}>
            <Character
              definition={studentCharacterDefinition}
              variant="default"
              scale={1.0}
            />
          </div>
        </div>
      </Sequence>

      {/* Shot 2: Close-up Staging (Frames 60 to 120) */}
      <Sequence from={60} durationInFrames={60} name="Shot2-CloseUp">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `translateY(${breathing * 1.2}px)`,
          }}
        >
          <div style={{ position: 'absolute', left: 960, top: 1200, transform: 'translate(-50%, -100%) scale(1.75)' }}>
            <Character
              definition={studentCharacterDefinition}
              variant="happy"
              scale={1.75}
            />
          </div>
        </div>
      </Sequence>

      {/* Cinematic Letterbox Bars (2.39:1 Cinemascope) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 90,
          backgroundColor: '#000000',
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 90,
          backgroundColor: '#000000',
          zIndex: 100,
        }}
      />

      {/* Creative Generalization HUD Telemetry */}
      <div
        style={{
          position: 'absolute',
          top: 105,
          left: 48,
          zIndex: 120,
          fontFamily: 'monospace',
          color: '#38bdf8',
          fontSize: 14,
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 8,
          padding: '10px 16px',
          display: 'flex',
          gap: 20,
        }}
      >
        <div>
          <span style={{ color: '#94a3b8' }}>CHALLENGE: </span>
          <strong style={{ color: '#ffffff' }}>C2 — Multi-Shot Character Identity Retention</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>ACTIVE SHOT: </span>
          <strong style={{ color: isShot1 ? '#f59e0b' : '#10b981' }}>
            {isShot1 ? 'Shot 1/2 [Medium Framing @ 1.0x]' : 'Shot 2/2 [Intimate Close-Up @ 1.75x]'}
          </strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>SUBJECT IDENTITY: </span>
          <strong style={{ color: '#38bdf8' }}>Ren (student-ren) [HAIR: OK | UNIFORM: OK | PALETTE: 100%]</strong>
        </div>
      </div>
    </SceneCanvas>
  );
};
