import React from 'react';
import { useCurrentFrame } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Camera25D } from '../core/camera/Camera25D';
import { Environment } from '../core/environments/Environment';
import { japaneseQuietStreetPreset } from '../core/environments/presets';
import { Character } from '../core/characters/Character';
import { studentArticulatedDefinition } from '../core/characters/presets';
import { computeBreathing } from '../core/animation/primitives';
import { computeArmWave } from '../core/characters/poses';
import { DriftingPetals } from '../core/effects/DriftingPetals';

export interface CutoutRigShowcaseProps {
  title?: string;
}

/**
 * CutoutRigShowcase Composition
 * Demonstrates modular cutout rigging and forward-kinematic acting:
 * - Left: Conversational Acting (pose="talk_gesture", bent gesturing arm)
 * - Center: Real-Time Harmonic Waving (pose="wave", sinusoidal computeArmWave FK rotation)
 * - Right: Directive Pointing (pose="point", angled pointing gesture)
 */
export const CutoutRigShowcase: React.FC<CutoutRigShowcaseProps> = ({
  title = 'PeerPro Cutout-Rig & Articulated Acting System',
}) => {
  const frame = useCurrentFrame();

  // Natural breathing cadence
  const breath = computeBreathing(frame, 30, { frequency: 0.5, amplitude: 3.5 });

  // Frame-deterministic harmonic waving motion for center character
  const waveAngle = computeArmWave(frame, 30, { frequency: 2.2, amplitude: 16.0 });

  return (
    <SceneCanvas width={1920} height={1080} backgroundColor="#090d16">
      <Camera25D config={{ preset: 'slow-push-in', focalDepth: 1.0, durationInFrames: 120 }}>
        {/* Environment Backdrop */}
        <Environment definition={japaneseQuietStreetPreset} />

        {/* Floating Sakura Petals */}
        <DriftingPetals count={25} depth={0.9} color="#fda4af" />

        {/* CHARACTER 1: Conversational Acting (Left) */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
          <Character
            definition={studentArticulatedDefinition}
            pose="talk_gesture"
            variant="happy"
            x={480}
            y={890 + breath.offsetY}
            scale={0.95}
            showShadow={true}
          />
          {/* Card Label */}
          <div
            style={{
              position: 'absolute',
              left: 360,
              top: 920,
              width: 240,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              TALK GESTURE
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Conversational Acting
            </div>
          </div>
        </div>

        {/* CHARACTER 2: Real-time Waving Oscillation (Center) */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
          <Character
            definition={studentArticulatedDefinition}
            pose="wave"
            jointRotations={{
              armRight: waveAngle,
            }}
            x={960}
            y={890 + breath.offsetY}
            scale={0.95}
            showShadow={true}
          />
          {/* Card Label */}
          <div
            style={{
              position: 'absolute',
              left: 840,
              top: 920,
              width: 240,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.8)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              WAVE OSCILLATION
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Sinusoidal FK Oscillator
            </div>
          </div>
        </div>

        {/* CHARACTER 3: Directive Pointing (Right) */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
          <Character
            definition={studentArticulatedDefinition}
            pose="point"
            x={1440}
            y={890 + breath.offsetY}
            scale={0.95}
            showShadow={true}
          />
          {/* Card Label */}
          <div
            style={{
              position: 'absolute',
              left: 1320,
              top: 920,
              width: 240,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(168, 85, 247, 0.8)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
            }}
          >
            <div style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              DIRECTIVE POINT
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Targeted Articulation
            </div>
          </div>
        </div>
      </Camera25D>

      {/* Header Overlay HUD */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 48,
          zIndex: 100,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: '16px 24px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Phase 13 Architecture
        </div>
        <div
          style={{
            color: '#f8fafc',
            fontSize: 22,
            fontWeight: 700,
            marginTop: 4,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: '#94a3b8',
            fontSize: 13,
            marginTop: 4,
            maxWidth: 620,
            lineHeight: 1.4,
          }}
        >
          Forward-kinematic shoulder socket pivoting, modular arm gesture swapping, and frame-deterministic action oscillations.
        </div>
      </div>
    </SceneCanvas>
  );
};
