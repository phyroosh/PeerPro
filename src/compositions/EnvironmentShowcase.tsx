import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Environment } from '../core/environments/Environment';
import {
  japaneseStreetCornerPreset,
  japaneseQuietStreetPreset,
} from '../core/environments/presets';
import { Character } from '../core/characters/Character';
import { studentCharacterDefinition } from '../core/characters/presets';

export interface EnvironmentShowcaseProps {
  layoutMode?: 'corner' | 'quiet' | 'sequence';
}

export const EnvironmentShowcase: React.FC<EnvironmentShowcaseProps> = ({
  layoutMode = 'sequence',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Sequence crossfade between 0-80 (Corner) and 80-160 (Quiet)
  const isSequence = layoutMode === 'sequence';
  const showQuiet = layoutMode === 'quiet' || (isSequence && frame >= 80);

  const transitionOpacity = isSequence
    ? interpolate(frame, [75, 85], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1.0;

  // Subtle breathing bobbing for character
  const charBob = Math.sin((frame / fps) * Math.PI * 1.5) * 3;

  return (
    <SceneCanvas width={width} height={height} backgroundColor="#090d16">
      {/* Layout 1: Tokyo Commercial Street Corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: showQuiet ? (isSequence ? 1 - transitionOpacity : 0) : transitionOpacity,
          display: !showQuiet || isSequence ? 'block' : 'none',
        }}
      >
        <Environment definition={japaneseStreetCornerPreset} />
        {/* Place Hero Character in front of convenience store */}
        <Character
          definition={studentCharacterDefinition}
          x={980}
          y={930 + charBob}
          scale={0.95}
        />
      </div>

      {/* Layout 2: Quiet Residential Street */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: showQuiet ? (isSequence ? 1 - transitionOpacity : 1) : 0,
          display: showQuiet ? 'block' : 'none',
        }}
      >
        <Environment definition={japaneseQuietStreetPreset} />
        {/* Place Casual Character next to sakura tree */}
        <Character
          definition={studentCharacterDefinition}
          variant="casual"
          x={720}
          y={930 + charBob}
          scale={0.95}
          flipX={true}
        />
      </div>

      {/* Floating HUD Label */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 50,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 12,
          padding: '12px 20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#38bdf8',
            marginBottom: 4,
          }}
        >
          Phase 5 • Modular Environment Builder
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {showQuiet ? 'Layout B: Quiet Residential Street' : 'Layout A: Commercial Street Corner'}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
          {showQuiet
            ? 'Central courtyard sakura tree • Apartment • Foreground vending machine'
            : '24H Conbini with neon sign • Vending machine • Framing sakura tree'}
        </div>
      </div>
    </SceneCanvas>
  );
};
