#!/usr/bin/env tsx
/**
 * scripts/inspect-actiongraph.ts
 *
 * PeerPro Action Graph and Timeline Orchestration Inspector CLI
 * Compiles declarative action graphs, validates dependencies, resolves property track
 * conflicts, and prints ASCII Gantt timelines and evaluated frame telemetry.
 *
 * Usage:
 *   npx tsx scripts/inspect-actiongraph.ts [path-to-actiongraph.json] [--frames=0,30,60,75,120] [--json]
 */

import fs from 'fs';
import path from 'path';
import {
  ActionGraph,
  compileActionGraph,
  evaluateActionGraph,
  formatTimelineDiagnostics,
} from '../src/core/actiongraph';

function getSampleActionGraph(): ActionGraph {
  return {
    id: 'sample-actiongraph-classroom-orchestration',
    name: 'Classroom Multi-Action Orchestration',
    description: 'Sequenced idle breathing, notice gesture, umbrella grasp, and cheerful greeting wave.',
    fps: 30,
    durationInFrames: 150,
    nodes: [
      {
        id: 'ambient-breathing',
        name: 'Continuous Ambient Breathing',
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
        name: 'Attentive Resting Posture',
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
        name: 'Notice Inquisitive Pose',
        targetId: 'student-articulated',
        actionType: 'expression',
        expression: { eyes: 'starter-char-eyes-wide', mouth: 'starter-char-mouth-smile-v2' },
        timing: { startAfter: 'initial-idle', durationInFrames: 30 },
        controlledProperties: ['expression'],
        priority: 15,
        conflictPolicy: 'override',
      },
      {
        id: 'hold-umbrella',
        name: 'Grip Starter Umbrella',
        targetId: 'student-articulated',
        actionType: 'interaction',
        interactionDef: {
          id: 'umbrella-grip-interact',
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
        name: 'Friendly Wave Handshake',
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
}

function parseArgs(): {
  inputPath?: string;
  frames: number[];
  isJson: boolean;
} {
  const args = process.argv.slice(2);
  let inputPath: string | undefined;
  let frames: number[] = [0, 30, 45, 75, 120];
  let isJson = false;

  for (const arg of args) {
    if (arg === '--json') {
      isJson = true;
    } else if (arg.startsWith('--frames=')) {
      frames = arg
        .substring('--frames='.length)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    } else if (!arg.startsWith('--') && !inputPath) {
      inputPath = arg;
    }
  }

  return { inputPath, frames, isJson };
}

function main(): void {
  const { inputPath, frames, isJson } = parseArgs();

  let graph: ActionGraph;
  if (inputPath) {
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: Action graph file not found at ${resolvedPath}`);
      process.exit(1);
    }
    graph = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } else {
    graph = getSampleActionGraph();
  }

  const timeline = compileActionGraph(graph);

  const evaluatedTelemetry = frames.map((f) => {
    const state = evaluateActionGraph(timeline, f, {
      baseEntities: {
        'student-articulated': { x: 960, y: 890, scale: 1.0, pose: 'idle' },
      },
    });

    const student = state.characters['student-articulated'];
    return {
      frame: f,
      activeNodes: state.activeNodeIds,
      studentPose: student?.pose,
      armRightRotation: Number((student?.jointRotations.armRight ?? 0).toFixed(2)),
      armLeftRotation: Number((student?.jointRotations.armLeft ?? 0).toFixed(2)),
      hasInteractions: Object.keys(state.interactions).length > 0,
      activePropertiesCount: Object.keys(state.activeProperties).length,
    };
  });

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          timeline,
          telemetry: evaluatedTelemetry,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(formatTimelineDiagnostics(timeline));
  console.log('');
  console.log('--- SAMPLE FRAME EVALUATION TELEMETRY ---');
  for (const t of evaluatedTelemetry) {
    console.log(
      `  Frame ${t.frame.toString().padStart(3)}f | Active Nodes: [${t.activeNodes.join(', ')}] | Pose: ${t.studentPose?.padEnd(6)} | ArmR: ${t.armRightRotation.toFixed(1).padStart(5)}° | ArmL: ${t.armLeftRotation.toFixed(1).padStart(5)}°`
    );
  }
  console.log('================================================================================');

  if (timeline.hasErrors) {
    process.exit(1);
  }
}

main();
