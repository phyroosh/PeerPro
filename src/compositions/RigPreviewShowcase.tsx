import React from 'react';
import { useCurrentFrame } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Character } from '../core/characters/Character';
import {
  studentArticulatedDefinition,
  studentCharacterDefinitionV2,
} from '../core/characters/presets';
import {
  evaluatePerformanceClips,
} from '../core/characters/rigs/evaluator';
import { STARTER_ACTION_LIBRARY } from '../core/characters/rigs/clips';

export interface RigPreviewShowcaseProps {
  title?: string;
  showOverlay?: boolean;
}

/**
 * RigPreviewShowcase Composition
 * Demonstrates the Character Performance System across three formal rig profiles:
 * - Left: Face-Only Rig (Gaze shift & micro-blinking)
 * - Center: Upper-Body Cutout Rig (Articulated arm waving, breathing, pivot crosshairs & joint limit arcs)
 * - Right: Pose-Swapped Illustration Rig (Discrete pose swapping & expression switching)
 */
export const RigPreviewShowcase: React.FC<RigPreviewShowcaseProps> = ({
  title = 'PeerPro Character Performance System & Rig Profiles',
  showOverlay = true,
}) => {
  const frame = useCurrentFrame();

  // 1. Evaluate Center Character: Upper-Body Cutout Rig (Wave + subtle breathing)
  const centerEval = evaluatePerformanceClips('upper_body_cutout', frame, [
    {
      clip: STARTER_ACTION_LIBRARY.breathing_subtle,
      startFrame: 0,
      loop: true,
      intensity: 1.0,
    },
    {
      clip: STARTER_ACTION_LIBRARY.arm_gesture_wave,
      startFrame: 0,
      loop: true,
      intensity: 1.0,
    },
  ]);

  // 2. Evaluate Left Character: Face-Only Rig (Look left/right + micro-blink)
  const leftEval = evaluatePerformanceClips('face_only', frame, [
    {
      clip: STARTER_ACTION_LIBRARY.look_left_right,
      startFrame: 0,
      loop: true,
      intensity: 1.0,
    },
    {
      clip: STARTER_ACTION_LIBRARY.micro_blink,
      startFrame: 25,
      durationInFrames: 30,
      loop: true,
      intensity: 1.0,
    },
  ]);

  // 3. Evaluate Right Character: Pose-Swapped Rig (Discrete pose swap + blink)
  const rightEval = evaluatePerformanceClips('pose_swapped', frame, [
    {
      clip: STARTER_ACTION_LIBRARY.neutral_idle,
      startFrame: 0,
      loop: true,
      intensity: 1.0,
    },
    {
      clip: STARTER_ACTION_LIBRARY.micro_blink,
      startFrame: 35,
      durationInFrames: 30,
      loop: true,
      intensity: 1.0,
    },
  ]);

  const groundY = 890;

  return (
    <SceneCanvas width={1920} height={1080} backgroundColor="#070a13">
      {/* Subtle Studio Backdrop Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.45) 0%, rgba(7, 10, 19, 0.95) 75%), linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Stage Horizon Floor Line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: groundY,
          height: 1,
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
        }}
      />

      {/* Header Banner */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                backgroundColor: '#38bdf8',
                color: '#090d16',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.12em',
              }}
            >
              PHASE 24
            </span>
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
              CHARACTER PERFORMANCE & RIG ARCHITECTURE
            </span>
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: 26, fontWeight: 700, margin: '8px 0 0 0' }}>
            {title}
          </h1>
        </div>

        {/* Global Telemetry Card */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 8,
            padding: '10px 18px',
            textAlign: 'right',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
            DETERMINISTIC RIG SOLVER
          </div>
          <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            Active Rigs: 3 | Frame: {frame} | Joint Detachment: 0 (SAFE)
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIG 1: Face-Only Rig (Left Column)                       */}
      {/* ======================================================== */}
      {/* Profile Card */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 140,
          width: 380,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          borderRadius: 8,
          padding: '12px 16px',
          zIndex: 80,
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em' }}>
          RIG PROFILE: FACE_ONLY
        </div>
        <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600, marginTop: 2 }}>
          Portrait / Close-Up Framing
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Supports: gaze direction, blinks, head tilt, speech visemes
        </div>
      </div>

      {/* Left Character Instance */}
      <Character
        definition={studentCharacterDefinitionV2}
        jointRotations={leftEval.jointRotations}
        partOverrides={leftEval.partOverrides}
        x={330}
        y={groundY + leftEval.rootOffset.y}
        scale={0.95}
        showShadow={true}
      />

      {/* Left Telemetry Card */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 920,
          width: 380,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 80,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Active Clip: <strong>{leftEval.activeClipId}</strong></span>
          <span style={{ color: '#a78bfa' }}>Rig: <strong>face_only</strong></span>
        </div>
        <div style={{ marginTop: 4, color: '#94a3b8' }}>
          Head Tilt: {leftEval.jointRotations.headTilt?.toFixed(1)}° (Limit: ±15°) | Blink: {leftEval.partOverrides.eyes ? 'Active' : 'Neutral'}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIG 2: Upper-Body Cutout Rig (Center Column - Hero)       */}
      {/* ======================================================== */}
      {/* Profile Card */}
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 130,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid #38bdf8',
          borderRadius: 8,
          padding: '14px 20px',
          zIndex: 80,
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#38bdf8', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em' }}>
            RIG PROFILE: UPPER_BODY_CUTOUT (HERO)
          </span>
          <span
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            FK JOINTS ACTIVE
          </span>
        </div>
        <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 600, marginTop: 4 }}>
          Modular Articulated Puppet (Ren Articulated)
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Rotating shoulder sockets, calibrated anti-separation limits [-45°, +120°]
        </div>
      </div>

      {/* Center Character Instance */}
      <Character
        definition={studentArticulatedDefinition}
        jointRotations={centerEval.jointRotations}
        partOverrides={centerEval.partOverrides}
        x={960}
        y={groundY + centerEval.rootOffset.y}
        scale={0.95}
        showShadow={true}
      />

      {/* Visual Pivot Crosshairs & Joint Limit Overlay */}
      {showOverlay && (
        <>
          {/* Right Shoulder Socket Pivot Indicator (waving arm) */}
          <div
            style={{
              position: 'absolute',
              left: 960 + (228 - 150) * 0.95,
              top: groundY - (600 - 128) * 0.95 + centerEval.rootOffset.y,
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '2px solid #22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              transform: 'translate(-50%, -50%)',
              zIndex: 90,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: -6,
                right: -6,
                height: 1,
                backgroundColor: '#22c55e',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: -6,
                bottom: -6,
                width: 1,
                backgroundColor: '#22c55e',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 30,
                top: -8,
                whiteSpace: 'nowrap',
                color: '#22c55e',
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              PIVOT: Right Shoulder ({centerEval.jointRotations.armRight?.toFixed(1)}°)
            </div>
          </div>

          {/* Left Shoulder Socket Pivot Indicator */}
          <div
            style={{
              position: 'absolute',
              left: 960 + (72 - 150) * 0.95,
              top: groundY - (600 - 128) * 0.95 + centerEval.rootOffset.y,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '2px solid #38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              transform: 'translate(-50%, -50%)',
              zIndex: 90,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 28,
                top: -8,
                whiteSpace: 'nowrap',
                color: '#38bdf8',
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Left Shoulder ({centerEval.jointRotations.armLeft?.toFixed(1)}°)
            </div>
          </div>
        </>
      )}

      {/* Center Telemetry Card */}
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 920,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 6,
          padding: '10px 16px',
          fontSize: 12,
          color: '#f8fafc',
          zIndex: 80,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Action: <strong>{centerEval.activeClipId}</strong></span>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>Joint Status: <strong>SAFE (No Separation)</strong></span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Arm Right: {centerEval.jointRotations.armRight?.toFixed(1)}° | Head: {centerEval.jointRotations.headTilt?.toFixed(1)}° | Diaphragm Y: {centerEval.rootOffset.y.toFixed(1)}px
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIG 3: Pose-Swapped Rig (Right Column)                    */}
      {/* ======================================================== */}
      {/* Profile Card */}
      <div
        style={{
          position: 'absolute',
          left: 1400,
          top: 140,
          width: 380,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 8,
          padding: '12px 16px',
          zIndex: 80,
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em' }}>
          RIG PROFILE: POSE_SWAPPED
        </div>
        <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600, marginTop: 2 }}>
          Authored Illustration Asset Swaps
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Discrete pose variants, expression keys, monolithic illustration
        </div>
      </div>

      {/* Right Character Instance */}
      <Character
        definition={studentCharacterDefinitionV2}
        variant="happy"
        jointRotations={rightEval.jointRotations}
        x={1590}
        y={groundY + rightEval.rootOffset.y}
        scale={0.95}
        showShadow={true}
      />

      {/* Right Telemetry Card */}
      <div
        style={{
          position: 'absolute',
          left: 1400,
          top: 920,
          width: 380,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 80,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Variant: <strong>happy</strong></span>
          <span style={{ color: '#f59e0b' }}>Rig: <strong>pose_swapped</strong></span>
        </div>
        <div style={{ marginTop: 4, color: '#94a3b8' }}>
          Unsupported: Arm FK & Walk cycles explicitly rejected by validator
        </div>
      </div>
    </SceneCanvas>
  );
};
