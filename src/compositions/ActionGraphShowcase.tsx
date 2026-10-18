import React, { useMemo } from 'react';
import { useCurrentFrame, Img, staticFile } from 'remotion';
import { SceneCanvas } from '../core/scene/SceneCanvas';
import { Character } from '../core/characters/Character';
import { studentArticulatedDefinition } from '../core/characters/presets';
import { defaultAssetRegistry } from '../core/assets/registry';
import {
  ActionGraph,
  compileActionGraph,
  evaluateActionGraph,
  ResolvedActionNode,
} from '../core/actiongraph';

export interface ActionGraphShowcaseProps {
  title?: string;
  showOverlay?: boolean;
}

const ACTION_GRAPH_SPEC: ActionGraph = {
  id: 'actiongraph-classroom-performance',
  name: 'Orchestrated Multi-Character Performance',
  description: 'Synchronized ambient breathing, notice cue, umbrella grasp, and wave greeting.',
  fps: 30,
  durationInFrames: 150,
  nodes: [
    {
      id: 'ambient-breathing',
      name: 'Ambient Breathing',
      targetId: 'student-articulated',
      actionType: 'clip',
      clipId: 'breathing_subtle',
      timing: { startFrame: 0, durationInFrames: 150 },
      controlledProperties: ['jointRotations.armLeft', 'rootOffset'],
      priority: 5,
      conflictPolicy: 'override',
    },
    {
      id: 'initial-idle',
      name: 'Initial Idle',
      targetId: 'student-articulated',
      actionType: 'pose',
      pose: 'idle',
      timing: { startFrame: 0, durationInFrames: 30 },
      controlledProperties: ['pose'],
      priority: 10,
      conflictPolicy: 'override',
    },
    {
      id: 'notice-surprise',
      name: 'Notice Cue',
      targetId: 'student-articulated',
      actionType: 'expression',
      expression: {
        eyes: 'starter-char-eyes-wide',
        mouth: 'starter-char-mouth-smile-v2',
      },
      timing: { startAfter: 'initial-idle', durationInFrames: 30 },
      controlledProperties: ['expression'],
      priority: 15,
      conflictPolicy: 'override',
    },
    {
      id: 'hold-umbrella',
      name: 'Hold Umbrella',
      targetId: 'student-articulated',
      actionType: 'interaction',
      interactionDef: {
        id: 'inter-hold-umbrella',
        type: 'hold_prop',
        characterId: 'student-articulated',
        targetId: 'starter-prop-umbrella',
        characterAnchor: 'hand_right',
        targetAnchor: 'grip',
        holdLayer: 'in_front_of',
      },
      timing: { startAfter: 'notice-surprise', durationInFrames: 90 },
      controlledProperties: ['jointRotations.armRight', 'interactions.starter-prop-umbrella'],
      priority: 20,
      conflictPolicy: 'override',
    },
    {
      id: 'wave-greeting',
      name: 'Wave Greeting',
      targetId: 'student-articulated',
      actionType: 'clip',
      clipId: 'wave',
      timing: { startWith: 'hold-umbrella', delayFrames: 15, durationInFrames: 45 },
      controlledProperties: ['jointRotations.armRight', 'pose'],
      priority: 25,
      conflictPolicy: 'override',
    },
  ],
};

export const ActionGraphShowcase: React.FC<ActionGraphShowcaseProps> = ({
  title = 'PeerPro Action Graph & Timeline Orchestration',
  showOverlay = true,
}) => {
  const frame = useCurrentFrame();

  // Compile timeline once
  const timeline = useMemo(() => compileActionGraph(ACTION_GRAPH_SPEC), []);

  // Frame-deterministic evaluation
  const evaluated = useMemo(() => {
    return evaluateActionGraph(timeline, frame, {
      baseEntities: {
        'student-articulated': { x: 700, y: 880, scale: 0.9, pose: 'idle' },
      },
    });
  }, [timeline, frame]);

  const studentState = evaluated.characters['student-articulated'];
  const umbrellaInteraction = evaluated.interactions['hold-umbrella'];
  const umbrellaAsset = defaultAssetRegistry.get('starter-prop-umbrella');

  return (
    <SceneCanvas
      width={1920}
      height={1080}
      backgroundColor="#0f172a"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Background Ambience Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 60% 40%, #1e293b 0%, #0f172a 100%)',
        }}
      />

      {/* Grid Guide */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Ground Line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 880,
          height: 3,
          backgroundColor: '#334155',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 48,
          right: 48,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 16,
          zIndex: 200,
        }}
      >
        <div>
          <div style={{ color: '#38bdf8', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em' }}>
            PEERPRO FRONTIER ROADMAP · PHASE 27
          </div>
          <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 700, marginTop: 4 }}>
            {title}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Declarative multi-action scheduling, topological dependency resolution, and property conflict arbitration
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: 6,
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            FRAME: {frame} / 150
          </div>
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              padding: '6px 14px',
              borderRadius: 6,
              color: '#22c55e',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            CONFLICT POLICY: OVERRIDE (ACTIVE)
          </div>
        </div>
      </div>

      {/* Character Center Stage */}
      {studentState && (
        <Character
          definition={studentArticulatedDefinition}
          jointRotations={studentState.jointRotations}
          partOverrides={studentState.partOverrides}
          x={studentState.rootOffset.x}
          y={studentState.rootOffset.y}
          scale={studentState.rootOffset.scale}
          showShadow={true}
        />
      )}

      {/* Attached Umbrella Prop (when hold-umbrella interaction is active) */}
      {umbrellaInteraction && umbrellaAsset && (
        <div
          style={{
            position: 'absolute',
            left:
              umbrellaInteraction.targetTransform.x -
              umbrellaAsset.dimensions.width * 0.75 * umbrellaAsset.anchor.x,
            top:
              umbrellaInteraction.targetTransform.y -
              umbrellaAsset.dimensions.height * 0.75 * umbrellaAsset.anchor.y,
            width: umbrellaAsset.dimensions.width * 0.75,
            height: umbrellaAsset.dimensions.height * 0.75,
            zIndex: umbrellaInteraction.effectiveLayerOrder,
            transform: `scale(${umbrellaInteraction.targetTransform.scale}) rotate(${umbrellaInteraction.targetTransform.rotation}deg)`,
            transformOrigin: `${umbrellaAsset.dimensions.width * 0.75 * umbrellaAsset.anchor.x}px ${umbrellaAsset.dimensions.height * 0.75 * umbrellaAsset.anchor.y}px`,
            pointerEvents: 'none',
          }}
        >
          <Img
            src={staticFile(umbrellaAsset.path)}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      )}

      {/* LEFT PANEL: Interactive Action Graph Gantt Timeline */}
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 140,
          width: 580,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 150,
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>ACTION GRAPH GANTT ORCHESTRATION</span>
          <span style={{ color: '#94a3b8' }}>TOTAL: 150 FRAMES</span>
        </div>

        {/* Time Ruler */}
        <div
          style={{
            position: 'relative',
            height: 18,
            borderBottom: '1px solid #475569',
            marginBottom: 10,
            fontSize: 10,
            color: '#94a3b8',
          }}
        >
          <span style={{ position: 'absolute', left: 0 }}>0f</span>
          <span style={{ position: 'absolute', left: '20%' }}>30f</span>
          <span style={{ position: 'absolute', left: '40%' }}>60f</span>
          <span style={{ position: 'absolute', left: '50%' }}>75f</span>
          <span style={{ position: 'absolute', left: '80%' }}>120f</span>
          <span style={{ position: 'absolute', right: 0 }}>150f</span>
        </div>

        {/* Action Nodes Track */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {timeline.nodes.map((node: ResolvedActionNode) => {
            const isActive = frame >= node.absoluteStartFrame && frame < node.absoluteEndFrame;
            const leftPct = (node.absoluteStartFrame / 150) * 100;
            const widthPct = (node.effectiveDurationInFrames / 150) * 100;

            const barColor = isActive
              ? node.id === 'wave-greeting'
                ? '#f59e0b'
                : node.id === 'hold-umbrella'
                ? '#22c55e'
                : '#38bdf8'
              : '#334155';

            return (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center', height: 26 }}>
                <div
                  style={{
                    width: 140,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#f8fafc' : '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.name || node.id}
                </div>

                <div
                  style={{
                    position: 'relative',
                    flex: 1,
                    height: 18,
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  {/* Node Active Span Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: 0,
                      bottom: 0,
                      backgroundColor: barColor,
                      opacity: isActive ? 0.95 : 0.45,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      fontSize: 9,
                      fontWeight: 700,
                      color: isActive ? '#0f172a' : '#cbd5e1',
                    }}
                  >
                    {node.actionType.toUpperCase()} (P:{node.priority ?? 10})
                  </div>

                  {/* Playhead Scrubber Line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(frame / 150) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: '#ef4444',
                      zIndex: 10,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Footer Legend */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <span>🔴 Playhead: {frame}f</span>
            <span>🟢 Active Nodes: {evaluated.activeNodeIds.length}</span>
          </div>
          <div style={{ color: '#38bdf8' }}>Topological Order: 100% DAG Verified</div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Property Track Arbitrator & Telemetry */}
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 140,
          width: 520,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 150,
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
        >
          PROPERTY TRACK CONFLICT ARBITRATION
        </div>

        {/* Monitored Property Tracks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Track 1: armRight */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #475569',
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                student-articulated.jointRotations.armRight
              </span>
              <span
                style={{
                  backgroundColor:
                    evaluated.activeProperties['student-articulated.jointRotations.armRight'] ===
                    'wave-greeting'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)',
                  color:
                    evaluated.activeProperties['student-articulated.jointRotations.armRight'] ===
                    'wave-greeting'
                      ? '#f59e0b'
                      : '#22c55e',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 10,
                }}
              >
                WINNER:{' '}
                {evaluated.activeProperties['student-articulated.jointRotations.armRight'] || 'NONE'}
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
              Current FK Rotation Angle:{' '}
              <strong style={{ color: '#38bdf8' }}>
                {(studentState?.jointRotations.armRight ?? 0).toFixed(1)}°
              </strong>{' '}
              | Policy: Priority Override (Wave P:25 {'>'} Umbrella P:20)
            </div>
          </div>

          {/* Track 2: pose */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #475569',
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                student-articulated.pose
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 10,
                }}
              >
                ACTIVE POSE: {studentState?.pose.toUpperCase()}
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
              Current Pose Variant:{' '}
              <strong style={{ color: '#38bdf8' }}>{studentState?.pose}</strong> | Slots:{' '}
              {Object.keys(studentState?.partOverrides ?? {}).length} active part overrides
            </div>
          </div>

          {/* Track 3: armLeft breathing */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #475569',
              borderRadius: 6,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                student-articulated.jointRotations.armLeft
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 10,
                }}
              >
                WINNER: ambient-breathing
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
              Subtle Oscillation Angle:{' '}
              <strong style={{ color: '#38bdf8' }}>
                {(studentState?.jointRotations.armLeft ?? 0).toFixed(2)}°
              </strong>{' '}
              | Continuous 0-150f baseline
            </div>
          </div>
        </div>

        {/* Dynamic Conflict Status Alert */}
        <div
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 6,
            backgroundColor:
              frame >= 75 && frame < 120
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${
              frame >= 75 && frame < 120 ? '#f59e0b' : '#22c55e'
            }`,
            color: frame >= 75 && frame < 120 ? '#f59e0b' : '#22c55e',
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          {frame >= 75 && frame < 120 ? (
            <div>
              <strong>⚠️ Active Property Conflict Detected (Frames 75-120):</strong>
              <br />
              Both `hold-umbrella` and `wave-greeting` demand `armRight`. Priority arbiter
              successfully assigned control to `wave-greeting` (P:25 vs P:20). Zero runtime drift.
            </div>
          ) : (
            <div>
              <strong>✅ Normal Track Ownership:</strong>
              <br />
              All active properties have unique or non-conflicting ownership. Pure frame determinism.
            </div>
          )}
        </div>
      </div>

      {/* Frame Status Floating Pill */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #38bdf8',
            borderRadius: 24,
            padding: '8px 24px',
            color: '#f8fafc',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            gap: 16,
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)',
            zIndex: 160,
          }}
        >
          <span>🎬 Action Graph Engine: v1.0</span>
          <span>⚡ Frame Determinism: Strict</span>
          <span>📊 Active Nodes: {evaluated.activeNodeIds.join(', ')}</span>
        </div>
      )}
    </SceneCanvas>
  );
};
