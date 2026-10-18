import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Character } from '../core/characters/Character';
import { studentArticulatedDefinition } from '../core/characters/presets';
import { Environment } from '../core/environments/Environment';
import { japaneseClassroomPreset } from '../core/environments/presets';
import { Camera25D } from '../core/camera/Camera25D';
import {
  CLOSE_UP_INTIMATE_PRESET,
  formatCompositionReport,
  FramingSolution,
  MEDIUM_DIALOGUE_PRESET,
  resolveCinematicIntent,
  ShotIntentSpec,
  validateShotComposition,
  WIDE_ESTABLISHING_PRESET,
} from '../core/cinematography';

export interface CinematicIntentShowcaseProps {
  title?: string;
  showOverlay?: boolean;
}

export const CinematicIntentShowcase: React.FC<CinematicIntentShowcaseProps> = ({
  title = 'PeerPro Shot Direction & Cinematic Intent',
  showOverlay = true,
}) => {
  const globalFrame = useCurrentFrame();

  // Multi-Shot Schedule: 3 Distinct Cinematic Shots (50 frames each, 150 total)
  // Shot 1: Wide Establishing (0-50f)
  // Shot 2: Medium Dialogue (50-100f)
  // Shot 3: Close-Up Intimate (100-150f)
  const currentShotIndex = globalFrame < 50 ? 0 : globalFrame < 100 ? 1 : 2;
  const shotLocalFrame = globalFrame % 50;

  const currentSpec: ShotIntentSpec = useMemo(() => {
    if (currentShotIndex === 0) {
      return {
        ...WIDE_ESTABLISHING_PRESET,
        durationInFrames: 50,
      };
    } else if (currentShotIndex === 1) {
      return {
        ...MEDIUM_DIALOGUE_PRESET,
        durationInFrames: 50,
      };
    } else {
      return {
        ...CLOSE_UP_INTIMATE_PRESET,
        durationInFrames: 50,
      };
    }
  }, [currentShotIndex]);

  // Solve framing & evaluate composition diagnostics
  const solution: FramingSolution = useMemo(() => {
    return resolveCinematicIntent(currentSpec, 1920, 1080);
  }, [currentSpec]);

  const report = useMemo(() => {
    return validateShotComposition(solution, currentSpec, 1920, 1080);
  }, [solution, currentSpec]);

  // Subtle breathing/acting motions
  const armWave =
    currentShotIndex === 0
      ? Math.sin((shotLocalFrame / 30) * Math.PI * 2 * 1.5) * 6.0
      : 0;
  const breathY = Math.sin((shotLocalFrame / 30) * Math.PI * 2 * 0.5) * 2.0;

  return (
    <SceneCanvas
      width={1920}
      height={1080}
      backgroundColor="#1e1e24"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <Camera25D config={solution.camera}>
        {/* Environment Backdrop (Japanese Classroom) */}
        <Environment definition={japaneseClassroomPreset} />

        {/* Primary Staged Character */}
        <Character
          definition={studentArticulatedDefinition}
          x={solution.subject.position.x}
          y={solution.subject.position.y + breathY}
          scale={solution.subject.scale}
          flipX={solution.subject.flipX}
          style={{ zIndex: 50 }}
          jointRotations={{
            armRight: armWave,
            headTilt: currentShotIndex === 2 ? -2.0 : 0,
          }}
          showShadow={currentShotIndex !== 2}
        />
      </Camera25D>

      {/* COMPOSITION GUIDES OVERLAY */}
      {showOverlay && (
        <>
          {/* Rule of Thirds Vertical Lines */}
          <div
            style={{
              position: 'absolute',
              left: 640,
              top: 0,
              bottom: 0,
              width: 1,
              borderLeft: '1px dashed rgba(56, 189, 248, 0.35)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1280,
              top: 0,
              bottom: 0,
              width: 1,
              borderLeft: '1px dashed rgba(56, 189, 248, 0.35)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          />

          {/* Rule of Thirds Horizontal Lines (Eyeline & Midline) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 360,
              height: 1,
              borderTop: '1px dashed rgba(245, 158, 11, 0.4)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: -16,
                fontSize: 10,
                fontWeight: 700,
                color: '#f59e0b',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              EYELINE GUIDE (UPPER THIRD: 360px)
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 720,
              height: 1,
              borderTop: '1px dashed rgba(56, 189, 248, 0.3)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          />

          {/* Broadcast Safe Area (Action Safe: 93%, Title Safe: 90%) */}
          <div
            style={{
              position: 'absolute',
              left: '3.5%',
              right: '3.5%',
              top: '3.5%',
              bottom: '3.5%',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: 8,
                bottom: 6,
                fontSize: 9,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              ACTION SAFE 93%
            </span>
          </div>
        </>
      )}

      {/* TOP HEADER */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 48,
          right: 48,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          paddingBottom: 16,
          zIndex: 200,
        }}
      >
        <div>
          <div style={{ color: '#38bdf8', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em' }}>
            PEERPRO FRONTIER ROADMAP · PHASE 28
          </div>
          <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            {title}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Declarative shot intent taxonomy, automated framing solver, and measurable composition diagnostics
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: 6,
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            SHOT {currentShotIndex + 1} / 3: {solution.intent.toUpperCase()} ({shotLocalFrame}/50f)
          </div>
          <div
            style={{
              backgroundColor: report.valid
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${report.valid ? '#22c55e' : '#ef4444'}`,
              padding: '6px 14px',
              borderRadius: 6,
              color: report.valid ? '#22c55e' : '#ef4444',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            SCORE: {report.score} / 100 {report.valid ? '(PASS)' : '(FAIL)'}
          </div>
        </div>
      </div>

      {/* SHOT DIRECTION & INTENT TELEMETRY PANEL (BOTTOM RIGHT) */}
      <div
        style={{
          position: 'absolute',
          right: 48,
          bottom: 40,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          zIndex: 200,
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>CINEMATIC INTENT SOLVER TELEMETRY</span>
          <span style={{ color: '#22c55e' }}>{currentSpec.name}</span>
        </div>

        {/* Telemetry Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          <div>
            Camera Preset:{' '}
            <strong style={{ color: '#f8fafc' }}>{solution.camera.preset}</strong>
          </div>
          <div>
            Camera Zoom:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {solution.debugTelemetry.computedZoom.toFixed(2)}x
            </strong>
          </div>
          <div>
            Subject Scale:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {solution.subject.scale.toFixed(2)}
            </strong>
          </div>
          <div>
            Subject Depth:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {solution.subject.depth.toFixed(2)}
            </strong>
          </div>
          <div>
            Headroom:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {(report.metrics.headroomRatio * 100).toFixed(1)}% (
              {solution.debugTelemetry.targetHeadroomPx.toFixed(0)}px)
            </strong>
          </div>
          <div>
            Lead Room:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {(report.metrics.leadRoomRatio * 100).toFixed(1)}% (
              {solution.debugTelemetry.leadRoomDirection.toUpperCase()})
            </strong>
          </div>
          <div>
            DoF Blur:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {solution.camera.depthOfField?.enabled
                ? `${solution.camera.depthOfField.maxBlur}px (Aperture: ${solution.camera.depthOfField.aperture})`
                : 'Disabled (Deep Focus)'}
            </strong>
          </div>
          <div>
            Camera Shake:{' '}
            <strong style={{ color: '#f8fafc' }}>
              {solution.camera.shake?.enabled ? 'Handheld Organic' : 'None'}
            </strong>
          </div>
        </div>

        {/* Composition Summary Footer */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: '1px solid #334155',
            fontSize: 11,
            color: '#cbd5e1',
            lineHeight: 1.4,
          }}
        >
          {currentShotIndex === 0 && (
            <span>
              <strong>Wide Establishing Intent:</strong> Environmental immersion with deep focus. Character placed on Rule of Thirds Left with generous rightward lead room.
            </span>
          )}
          {currentShotIndex === 1 && (
            <span>
              <strong>Medium Dialogue Intent:</strong> Balanced waist-up framing with subtle handheld drift. Gaze directed across negative space toward dialogue partner.
            </span>
          )}
          {currentShotIndex === 2 && (
            <span>
              <strong>Close-Up Intimate Intent:</strong> Emotional intimacy with shallow Depth of Field. Eyeline aligned to upper third (~360px), background softly blurred.
            </span>
          )}
        </div>
      </div>
    </SceneCanvas>
  );
};
