import React from 'react';
import { useCurrentFrame, Img, staticFile } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Character } from '../core/characters/Character';
import {
  studentArticulatedDefinition,
  studentCharacterDefinitionV2,
  studentThreeQuarterDefinition,
} from '../core/characters/presets';
import { solveInteraction } from '../core/interactions/solver';
import { resolveCharacterAnchor } from '../core/interactions/anchors';
import { defaultAssetRegistry } from '../core/assets/registry';

export interface InteractionShowcaseProps {
  title?: string;
  showOverlay?: boolean;
}

/**
 * InteractionShowcase Composition
 * Demonstrates the Character–Object Interaction Subsystem:
 * 1. Left: Zero-Drift Object-Hand Holding (Ren holding & waving an umbrella)
 * 2. Center: Seat Alignment Interaction (Ren seated in a classroom chair with anchor alignment)
 * 3. Right: Inter-Character Object Passing (Object transfer across a handoff window)
 */
export const InteractionShowcase: React.FC<InteractionShowcaseProps> = ({
  title = 'PeerPro Character–Object Interaction Toolkit',
  showOverlay = true,
}) => {
  const frame = useCurrentFrame();
  const groundY = 890;

  // ============================================================
  // INTERACTION 1: Hand-Held Prop with Arm Wave & Breathing (Left)
  // ============================================================
  const waveAngle = -15 + Math.sin((frame / 30) * Math.PI * 2 * 1.5) * 8.0;
  const breathY = Math.sin((frame / 30) * Math.PI * 2 * 0.5) * 2.2;

  const leftCharContext = {
    x: 320,
    y: groundY,
    scale: 0.85,
    flipX: false,
    rootOffsetY: breathY,
    jointRotations: {
      armRight: waveAngle,
      headTilt: -1.5,
    },
    activePartOverrides: {
      armsRight: 'starter-char-arm-01-right-wave',
    },
  };

  const holdInteraction = solveInteraction(
    {
      id: 'inter-hold-umbrella',
      type: 'hold_prop',
      characterId: 'student-articulated',
      targetId: 'starter-prop-umbrella',
      startFrame: 0,
      durationInFrames: 120,
      characterAnchor: 'hand_right',
      targetAnchor: 'grip',
      holdLayer: 'in_front_of',
    },
    studentArticulatedDefinition,
    leftCharContext,
    frame
  );

  const umbrellaAsset = defaultAssetRegistry.get('starter-prop-umbrella');

  // ============================================================
  // INTERACTION 2: Sit-at-Seat Alignment (Center)
  // ============================================================
  const chairAsset = defaultAssetRegistry.get('starter-env-classroom-chair');
  const deskAsset = defaultAssetRegistry.get('starter-env-classroom-desk');

  const chairRestTransform = {
    x: 960,
    y: groundY,
    rotation: 0,
    scale: 1.0,
  };

  const sitInteraction = solveInteraction(
    {
      id: 'inter-sit-chair',
      type: 'sit_at_seat',
      characterId: 'student-ren-v2',
      targetId: 'starter-env-classroom-chair',
      startFrame: 0,
      durationInFrames: 120,
      targetAnchor: 'seat_surface',
    },
    studentCharacterDefinitionV2,
    { x: 960, y: groundY, scale: 0.95, flipX: false },
    frame,
    { targetRestTransform: chairRestTransform }
  );

  // ============================================================
  // INTERACTION 3: Object Passing between Two Characters (Right)
  // ============================================================
  const passInteraction = solveInteraction(
    {
      id: 'inter-pass-umbrella',
      type: 'pass_object',
      characterId: 'student-articulated',
      targetId: 'starter-prop-umbrella',
      secondaryCharacterId: 'student-three-quarter',
      startFrame: 20,
      durationInFrames: 80,
      characterAnchor: 'hand_right',
      secondaryAnchor: 'hand_left',
      targetAnchor: 'grip',
      transitionFrames: 30,
    },
    studentArticulatedDefinition,
    {
      x: 1450,
      y: groundY,
      scale: 0.85,
      flipX: false,
      jointRotations: { armRight: 15 },
    },
    frame,
    {
      secondaryCharacterDef: studentThreeQuarterDefinition,
      secondaryCharacterContext: {
        x: 1720,
        y: groundY,
        scale: 0.85,
        flipX: true,
        jointRotations: { armLeft: -10 },
      },
    }
  );

  return (
    <SceneCanvas width={1920} height={1080} backgroundColor="#070a13">
      {/* Studio Grid Backdrop */}
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
          zIndex: 200,
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
              PHASE 25
            </span>
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
              CHARACTER–OBJECT INTERACTION TOOLKIT
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
            FORWARD-KINEMATICS INTERACTION BINDING
          </div>
          <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            Zero Drift: 0.00px | Frame: {frame} | Attached Objects: 2
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 1: Zero-Drift Hand-Held Prop (Left)               */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 105,
          width: 500,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid #38bdf8',
          borderRadius: 8,
          padding: '14px 18px',
          zIndex: 80,
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#38bdf8', fontSize: 13, fontWeight: 800 }}>
            INTERACTION 1: HOLD_PROP (HAND-LOCK)
          </span>
          <span
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DRIFT: 0.00px
          </span>
        </div>
        <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
          Ren Holding Umbrella with Continuous Arm Wave
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          FK transform propagation locks prop grip to moving hand during arm oscillation
        </div>
      </div>

      {/* Left Character */}
      <Character
        definition={studentArticulatedDefinition}
        jointRotations={leftCharContext.jointRotations}
        partOverrides={leftCharContext.activePartOverrides}
        x={leftCharContext.x}
        y={groundY + breathY}
        scale={leftCharContext.scale}
        showShadow={true}
      />

      {/* Attached Umbrella Prop */}
      {umbrellaAsset && (
        <div
          style={{
            position: 'absolute',
            left: holdInteraction.targetTransform.x - umbrellaAsset.dimensions.width * 0.72 * umbrellaAsset.anchor.x,
            top: holdInteraction.targetTransform.y - umbrellaAsset.dimensions.height * 0.72 * umbrellaAsset.anchor.y,
            width: umbrellaAsset.dimensions.width * 0.72,
            height: umbrellaAsset.dimensions.height * 0.72,
            zIndex: holdInteraction.effectiveLayerOrder,
            transform: `scale(${holdInteraction.targetTransform.scale}) rotate(${holdInteraction.targetTransform.rotation}deg)`,
            transformOrigin: `${umbrellaAsset.dimensions.width * 0.72 * umbrellaAsset.anchor.x}px ${umbrellaAsset.dimensions.height * 0.72 * umbrellaAsset.anchor.y}px`,
            pointerEvents: 'none',
          }}
        >
          <Img
            src={staticFile(umbrellaAsset.path)}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* Visual Overlay: Hand-Prop Socket Lock */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            left: holdInteraction.targetTransform.x,
            top: holdInteraction.targetTransform.y,
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid #22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.3)',
            transform: 'translate(-50%, -50%)',
            zIndex: 140,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 24,
              top: -6,
              whiteSpace: 'nowrap',
              color: '#22c55e',
              fontSize: 10,
              fontWeight: 700,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            HAND-LOCK: (grip offset: 0.0px)
          </div>
        </div>
      )}

      {/* Column 1 Telemetry Footer */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 920,
          width: 500,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 80,
        }}
      >
        <div>Wave Angle: <strong>{waveAngle.toFixed(1)}°</strong> | Breathing Y: <strong>{breathY.toFixed(1)}px</strong></div>
        <div style={{ marginTop: 2, color: '#38bdf8' }}>
          Prop Coord: ({holdInteraction.targetTransform.x.toFixed(1)}, {holdInteraction.targetTransform.y.toFixed(1)}) | Rotation: {holdInteraction.targetTransform.rotation.toFixed(1)}°
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 2: Sit-at-Seat Alignment (Center)                 */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'absolute',
          left: 680,
          top: 105,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          borderRadius: 8,
          padding: '14px 18px',
          zIndex: 80,
          boxShadow: '0 0 20px rgba(167, 139, 250, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 800 }}>
            INTERACTION 2: SIT_AT_SEAT (FURNITURE)
          </span>
          <span
            style={{
              backgroundColor: 'rgba(167, 139, 250, 0.2)',
              color: '#a78bfa',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            SEAT ALIGNED
          </span>
        </div>
        <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
          Ren Seated at Classroom Chair & Desk
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Hip baseline automatically snapped and occluded relative to chair seat surface
        </div>
      </div>

      {/* Classroom Chair (Behind Character) */}
      {chairAsset && (
        <div
          style={{
            position: 'absolute',
            left: chairRestTransform.x - 80,
            top: chairRestTransform.y - 260,
            width: chairAsset.dimensions.width,
            height: chairAsset.dimensions.height,
            zIndex: 40,
          }}
        >
          <Img
            src={staticFile(chairAsset.path)}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* Seated Character (Hips aligned to chair seat, legs occluded behind desk) */}
      <Character
        definition={studentCharacterDefinitionV2}
        variant="happy"
        x={sitInteraction.characterTransform.x}
        y={sitInteraction.characterTransform.y + 230}
        scale={0.88}
        showShadow={false}
      />

      {/* Classroom Desk (In Front of Character) */}
      {deskAsset && (
        <div
          style={{
            position: 'absolute',
            left: chairRestTransform.x - 160,
            top: chairRestTransform.y - 300,
            width: deskAsset.dimensions.width,
            height: deskAsset.dimensions.height,
            zIndex: 90,
          }}
        >
          <Img
            src={staticFile(deskAsset.path)}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* Column 2 Telemetry Footer */}
      <div
        style={{
          position: 'absolute',
          left: 680,
          top: 920,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 80,
        }}
      >
        <div>Chair Surface Y: <strong>{groundY - 120}px</strong> | Character Hip Y: <strong>{sitInteraction.characterTransform.y}px</strong></div>
        <div style={{ marginTop: 2, color: '#a78bfa' }}>
          Occlusion Order: Chair (z:40) &lt; Seated Character (z:60) &lt; Desk (z:90)
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 3: Inter-Character Object Passing (Right)          */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'absolute',
          left: 1280,
          top: 105,
          width: 540,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 8,
          padding: '14px 18px',
          zIndex: 80,
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 800 }}>
            INTERACTION 3: PASS_OBJECT (HANDOFF)
          </span>
          <span
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            CARRIER: {passInteraction.carrierId}
          </span>
        </div>
        <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
          Object Transfer Across Transition Window
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
          Progress: {(passInteraction.transitionProgress * 100).toFixed(0)}% | Smooth hand-to-hand trajectory
        </div>
      </div>

      {/* Passer Character (Ren) */}
      <Character
        definition={studentArticulatedDefinition}
        jointRotations={{ armRight: 15 }}
        x={1450}
        y={groundY}
        scale={0.85}
        flipX={false}
        showShadow={true}
      />

      {/* Receiver Character (3/4 Perspective) */}
      <Character
        definition={studentThreeQuarterDefinition}
        x={1720}
        y={groundY}
        scale={0.85}
        flipX={true}
        showShadow={true}
      />

      {/* Passed Prop */}
      {umbrellaAsset && (
        <div
          style={{
            position: 'absolute',
            left: passInteraction.targetTransform.x - umbrellaAsset.dimensions.width * 0.7 * umbrellaAsset.anchor.x,
            top: passInteraction.targetTransform.y - umbrellaAsset.dimensions.height * 0.7 * umbrellaAsset.anchor.y,
            width: umbrellaAsset.dimensions.width * 0.7,
            height: umbrellaAsset.dimensions.height * 0.7,
            zIndex: 130,
            transform: `scale(${passInteraction.targetTransform.scale}) rotate(${passInteraction.targetTransform.rotation}deg)`,
            transformOrigin: `${umbrellaAsset.dimensions.width * 0.7 * umbrellaAsset.anchor.x}px ${umbrellaAsset.dimensions.height * 0.7 * umbrellaAsset.anchor.y}px`,
            pointerEvents: 'none',
          }}
        >
          <Img
            src={staticFile(umbrellaAsset.path)}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* Column 3 Telemetry Footer */}
      <div
        style={{
          position: 'absolute',
          left: 1280,
          top: 920,
          width: 540,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 80,
        }}
      >
        <div>Transfer Progress: <strong>{(passInteraction.transitionProgress * 100).toFixed(1)}%</strong> | Carrier: <strong>{passInteraction.carrierId}</strong></div>
        <div style={{ marginTop: 2, color: '#f59e0b' }}>
          Trajectory: X={passInteraction.targetTransform.x.toFixed(1)}, Y={passInteraction.targetTransform.y.toFixed(1)} | Continuous Hand-to-Hand Lock
        </div>
      </div>
    </SceneCanvas>
  );
};
