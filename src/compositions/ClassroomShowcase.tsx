import React from 'react';
import { useCurrentFrame } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Camera25D } from '../core/camera/Camera25D';
import { Environment } from '../core/environments/Environment';
import { japaneseClassroomPreset } from '../core/environments/presets';
import { Character } from '../core/characters/Character';
import { studentArticulatedDefinition } from '../core/characters/presets';
import { computeBreathing } from '../core/animation/primitives';
import { computeArmWave } from '../core/characters/poses';
import { DriftingPetals } from '../core/effects/DriftingPetals';

export interface ClassroomShowcaseProps {
  title?: string;
}

/**
 * ClassroomShowcase Composition
 * Demonstrates modular indoor world-building grammar and depth plane occlusion:
 * - Back Wall ($Z=0.35$): Wainscot wood paneling, cream plaster, ceiling trim
 * - Wall Fixtures ($Z=0.38$): Window with outdoor sakura view, green chalkboard, wall clock
 * - Hardwood Floor ($Z=1.0$): Converging perspective planks anchoring characters
 * - Teacher Area (Left): Character Ren lecturing at presentation podium (pose="talk_gesture")
 * - Student Area (Right): Character Ren behind desk (chair behind character, desk in front)
 */
export const ClassroomShowcase: React.FC<ClassroomShowcaseProps> = ({
  title = 'PeerPro Indoor Classroom Environment System',
}) => {
  const frame = useCurrentFrame();

  // Gentle breathing cadence
  const breath = computeBreathing(frame, 30, { frequency: 0.5, amplitude: 3.5 });

  // Harmonic waving gesture for student character
  const studentWaveAngle = computeArmWave(frame, 30, { frequency: 2.2, amplitude: 14.0 });

  return (
    <SceneCanvas width={1920} height={1080} backgroundColor="#090d16">
      <Camera25D config={{ preset: 'slow-push-in', focalDepth: 1.0, durationInFrames: 120 }}>
        {/* Enclosed Classroom Environment (Wall, Floor, Window, Chalkboard, Clock, Desk, Chair, Lectern) */}
        <Environment definition={japaneseClassroomPreset} />

        {/* Ambient Sakura Petals drifting gently from window */}
        <DriftingPetals count={15} depth={0.9} color="#fda4af" />

        {/* CHARACTER 1: Teacher Lecturing at Podium (Left) */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
          <Character
            definition={studentArticulatedDefinition}
            pose="talk_gesture"
            variant="happy"
            x={440}
            y={890 + breath.offsetY}
            scale={0.95}
            showShadow={true}
          />
          {/* Card Label */}
          <div
            style={{
              position: 'absolute',
              left: 320,
              top: 935,
              width: 240,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              TEACHER PODIUM
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Conversational Instruction
            </div>
          </div>
        </div>

        {/* CHARACTER 2: Student at Desk with Selective Occlusion (Right) */}
        {/* Rendered at zIndex: 50, sandwiched between background chair (zIndex: 24) and foreground desk (zIndex: 65) */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
          <Character
            definition={studentArticulatedDefinition}
            pose="wave"
            jointRotations={{
              armRight: studentWaveAngle,
            }}
            x={1400}
            y={890 + breath.offsetY}
            scale={0.95}
            showShadow={true}
          />
          {/* Card Label */}
          <div
            style={{
              position: 'absolute',
              left: 1280,
              top: 935,
              width: 240,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              borderRadius: 8,
              padding: '8px 12px',
              textAlign: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              STUDENT DESK
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Layered Foreground Occlusion
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
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12,
          padding: '16px 24px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Phase 14 • World-Building Grammar
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
          Enclosed architectural room grammar, perspective floor alignment, and multi-plane occlusion (chair behind character, desk in front).
        </div>
      </div>
    </SceneCanvas>
  );
};
