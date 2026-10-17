import React from 'react';
import { useCurrentFrame } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Camera25D } from '../core/camera/Camera25D';
import { Environment } from '../core/environments/Environment';
import { japaneseQuietStreetPreset } from '../core/environments/presets';
import { Character } from '../core/characters/Character';
import {
  studentCharacterDefinition,
  studentCharacterDefinitionV2,
  studentThreeQuarterDefinition,
} from '../core/characters/presets';
import { computeBreathing } from '../core/animation/primitives';
import { DriftingPetals } from '../core/effects/DriftingPetals';

export interface StyleShowcaseProps {
  title?: string;
}

/**
 * StyleShowcase Composition
 * Directly compares:
 * - Left: V1 Prototype Character (Flat geometric vector, no shading)
 * - Center: V2 Refined Character (2-tier cel-shading, tapered chin, facial blush, hand contour, contact shadow)
 * - Right: V2 3/4 Perspective Character (Turned torso, stereoscopic foreshortening, asymmetric hair, contact shadow)
 */
export const StyleShowcase: React.FC<StyleShowcaseProps> = ({
  title = 'PeerPro Style & Asset Quality System',
}) => {
  const frame = useCurrentFrame();

  // Subtle breathing motion for characters
  const breath = computeBreathing(frame, 30, { frequency: 0.5, amplitude: 4.0 });

  return (
    <SceneCanvas width={1920} height={1080} backgroundColor="#090d16">
      <Camera25D config={{ preset: 'slow-push-in', focalDepth: 1.0, durationInFrames: 120 }}>
        {/* Environment Backdrop */}
        <Environment definition={japaneseQuietStreetPreset} />

        {/* Floating Sakura Petals */}
        <DriftingPetals count={25} depth={0.9} color="#fda4af" />

        {/* CHARACTER 1: V1 Prototype (Left) */}
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <Character
            definition={studentCharacterDefinition}
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
              V1 PROTOTYPE
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Flat Geometric Vector
            </div>
          </div>
        </div>

        {/* CHARACTER 2: V2 Refined Cel-Shaded (Center) */}
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <Character
            definition={studentCharacterDefinitionV2}
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
              V2 CEL-SHADED
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Refined Anime Contours
            </div>
          </div>
        </div>

        {/* CHARACTER 3: V2 3/4 Perspective (Right) */}
        <div style={{ position: 'absolute', left: 0, top: 0 }}>
          <Character
            definition={studentThreeQuarterDefinition}
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
              V2 3/4 PERSPECTIVE
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Turned Cinematic Staging
            </div>
          </div>
        </div>
      </Camera25D>

      {/* Header HUD Banner */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 48,
          backgroundColor: 'rgba(11, 15, 25, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 12,
          padding: '14px 24px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.15em' }}>
          PHASE 12 • ASSET QUALITY &amp; STYLE SYSTEM
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, display: 'flex', gap: 16 }}>
          <span>• 2-Tier Cel-Shading</span>
          <span>• Ground Contact Shadows</span>
          <span>• 3/4 Angle Staging</span>
          <span>• Angle Compatibility Contracts</span>
        </div>
      </div>
    </SceneCanvas>
  );
};
