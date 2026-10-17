import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Character } from '../core/characters/Character';
import { studentCharacterDefinition } from '../core/characters/presets';

export interface CharacterShowcaseProps {
  title?: string;
}

export const CharacterShowcase: React.FC<CharacterShowcaseProps> = ({
  title = 'PeerPro Character Builder Showcase',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Subtle breathing bobbing (deterministic sine)
  const breathingBob = Math.sin((frame / fps) * Math.PI * 1.5) * 4;

  const cardOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <SceneCanvas width={width} height={height} backgroundColor="#0b0f19">
      {/* Background Studio Grid & Lighting */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage:
            'radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 80%)',
        }}
      />
      {/* Floor Pedestal line */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 160,
          width: width - 320,
          height: 3,
          background: 'linear-gradient(90deg, transparent, #38bdf8 20%, #818cf8 50%, #38bdf8 80%, transparent)',
          opacity: 0.7,
        }}
      />

      {/* Header Banner */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          width: '100%',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          opacity: cardOpacity,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#38bdf8',
            marginBottom: 8,
          }}
        >
          Phase 4 • Socket-Based Character Recombination
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: 0 }}>
          {title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, marginTop: 6 }}>
          Side-by-side verification: Same base head & socket geometry, different variant parts & styling
        </p>
      </div>

      {/* Left Character: Standard Uniform (Neutral Expression) */}
      <div style={{ position: 'absolute', left: 560, bottom: 200 }}>
        <Character
          definition={studentCharacterDefinition}
          x={0}
          y={breathingBob}
          scale={1.1}
        />
        {/* Label Card */}
        <div
          style={{
            position: 'absolute',
            bottom: -90,
            left: -140,
            width: 280,
            textAlign: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid #334155',
            padding: '10px 14px',
            borderRadius: 10,
            fontFamily: 'system-ui, sans-serif',
            color: '#f8fafc',
            opacity: cardOpacity,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
            Variant: Default
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Blazer Uniform • Short Hair • Neutral
          </div>
        </div>
      </div>

      {/* Right Character: Streetwear (Casual / Winking / Spiky Hair) */}
      <div style={{ position: 'absolute', left: 1360, bottom: 200 }}>
        <Character
          definition={studentCharacterDefinition}
          variant="casual"
          x={0}
          y={-breathingBob}
          scale={1.1}
        />
        {/* Label Card */}
        <div
          style={{
            position: 'absolute',
            bottom: -90,
            left: -140,
            width: 280,
            textAlign: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid #334155',
            padding: '10px 14px',
            borderRadius: 10,
            fontFamily: 'system-ui, sans-serif',
            color: '#f8fafc',
            opacity: cardOpacity,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>
            Variant: Casual Streetwear
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Teal Hoodie • Spiky Hair • Winking
          </div>
        </div>
      </div>
    </SceneCanvas>
  );
};
