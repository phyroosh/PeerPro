import test from 'node:test';
import assert from 'node:assert';
import {
  ActionGraph,
  compileActionGraph,
  evaluateActionGraph,
  formatTimelineDiagnostics,
} from '../../src/core/actiongraph';

test('ActionGraph: compiles basic sequential dependencies via startAfter', () => {
  const graph: ActionGraph = {
    id: 'test-sequential',
    name: 'Sequential Test',
    fps: 30,
    nodes: [
      {
        id: 'step-1',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'idle',
        timing: { startFrame: 0, durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
      {
        id: 'step-2',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'wave',
        timing: { startAfter: 'step-1', durationInFrames: 45 },
        controlledProperties: ['pose', 'jointRotations.armRight'],
      },
      {
        id: 'step-3',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'thinking',
        timing: { startAfter: 'step-2', delayFrames: 10, durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  assert.strictEqual(timeline.hasErrors, false);
  assert.strictEqual(timeline.nodes.length, 3);

  const step1 = timeline.nodesById['step-1'];
  const step2 = timeline.nodesById['step-2'];
  const step3 = timeline.nodesById['step-3'];

  assert.strictEqual(step1.absoluteStartFrame, 0);
  assert.strictEqual(step1.absoluteEndFrame, 30);

  assert.strictEqual(step2.absoluteStartFrame, 30);
  assert.strictEqual(step2.absoluteEndFrame, 75);

  assert.strictEqual(step3.absoluteStartFrame, 85); // 75 + 10 delay
  assert.strictEqual(step3.absoluteEndFrame, 115);
  assert.strictEqual(timeline.totalDurationInFrames, 115);
});

test('ActionGraph: compiles concurrent actions with startWith and relative offsets', () => {
  const graph: ActionGraph = {
    id: 'test-concurrent',
    name: 'Concurrent Test',
    fps: 30,
    nodes: [
      {
        id: 'ambient-walk',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'walk',
        timing: { startFrame: 10, durationInFrames: 60 },
        controlledProperties: ['jointRotations.armLeft'],
      },
      {
        id: 'concurrent-talk',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'talk',
        timing: { startWith: 'ambient-walk', delayFrames: 5, durationInFrames: 30 },
        controlledProperties: ['expression'],
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  assert.strictEqual(timeline.hasErrors, false);

  const walk = timeline.nodesById['ambient-walk'];
  const talk = timeline.nodesById['concurrent-talk'];

  assert.strictEqual(walk.absoluteStartFrame, 10);
  assert.strictEqual(walk.absoluteEndFrame, 70);

  assert.strictEqual(talk.absoluteStartFrame, 15); // 10 + 5
  assert.strictEqual(talk.absoluteEndFrame, 45);
  assert.strictEqual(timeline.totalDurationInFrames, 70);
});

test('ActionGraph: converts seconds timing to frames accurately based on fps', () => {
  const graph: ActionGraph = {
    id: 'test-seconds-conversion',
    name: 'Seconds Conversion Test',
    fps: 24,
    nodes: [
      {
        id: 'sec-node-1',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'idle',
        timing: { startSeconds: 1.5, durationSeconds: 2.0 },
        controlledProperties: ['pose'],
      },
      {
        id: 'sec-node-2',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'bow',
        timing: { startAfter: 'sec-node-1', delaySeconds: 0.5, durationSeconds: 1.0 },
        controlledProperties: ['pose'],
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  const n1 = timeline.nodesById['sec-node-1'];
  const n2 = timeline.nodesById['sec-node-2'];

  assert.strictEqual(n1.absoluteStartFrame, 36); // 1.5 * 24
  assert.strictEqual(n1.effectiveDurationInFrames, 48); // 2.0 * 24
  assert.strictEqual(n1.absoluteEndFrame, 84);

  assert.strictEqual(n2.absoluteStartFrame, 96); // 84 + (0.5 * 24 = 12)
  assert.strictEqual(n2.effectiveDurationInFrames, 24); // 1.0 * 24
  assert.strictEqual(n2.absoluteEndFrame, 120);
});

test('ActionGraph: detects and throws on circular dependencies', () => {
  const graph: ActionGraph = {
    id: 'test-cycle',
    name: 'Circular Dependency Test',
    nodes: [
      {
        id: 'node-A',
        targetId: 'char-1',
        actionType: 'pose',
        timing: { startAfter: 'node-C', durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
      {
        id: 'node-B',
        targetId: 'char-1',
        actionType: 'pose',
        timing: { startAfter: 'node-A', durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
      {
        id: 'node-C',
        targetId: 'char-1',
        actionType: 'pose',
        timing: { startAfter: 'node-B', durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
    ],
  };

  assert.throws(
    () => {
      compileActionGraph(graph);
    },
    /Circular dependency detected/
  );
});

test('ActionGraph: detects missing dependency node IDs', () => {
  const graph: ActionGraph = {
    id: 'test-missing',
    name: 'Missing Dependency Test',
    nodes: [
      {
        id: 'node-valid',
        targetId: 'char-1',
        actionType: 'pose',
        timing: { startAfter: 'non-existent-node', durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
    ],
  };

  assert.throws(
    () => {
      compileActionGraph(graph);
    },
    /Missing dependency: Action node "non-existent-node"/
  );
});

test('ActionGraph: resolves property conflicts via override policy with priority and startFrame', () => {
  const graph: ActionGraph = {
    id: 'test-conflict-override',
    name: 'Conflict Override Test',
    nodes: [
      {
        id: 'low-prio-wave',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'wave',
        timing: { startFrame: 20, durationInFrames: 50 },
        controlledProperties: ['jointRotations.armRight'],
        priority: 10,
        conflictPolicy: 'override',
      },
      {
        id: 'high-prio-umbrella',
        targetId: 'student-articulated',
        actionType: 'interaction',
        interactionDef: {
          id: 'hold-umb',
          type: 'hold_prop',
          characterId: 'student-articulated',
          targetId: 'starter-prop-umbrella',
        },
        timing: { startFrame: 30, durationInFrames: 30 },
        controlledProperties: ['jointRotations.armRight'],
        priority: 25,
        conflictPolicy: 'override',
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  assert.strictEqual(timeline.hasErrors, false);
  assert.strictEqual(timeline.conflicts.length, 1);

  const conflict = timeline.conflicts[0];
  assert.strictEqual(conflict.policyApplied, 'override');
  assert.strictEqual(conflict.winnerNodeId, 'high-prio-umbrella');
  assert.deepStrictEqual(conflict.overlapRange, [30, 60]);

  // Evaluate at frame 40 (inside overlap)
  const evalState = evaluateActionGraph(timeline, 40);
  assert.strictEqual(
    evalState.activeProperties['student-articulated.jointRotations.armRight'],
    'high-prio-umbrella'
  );
});

test('ActionGraph: reports errors and sets hasErrors on forbidden concurrent writes with error policy', () => {
  const graph: ActionGraph = {
    id: 'test-conflict-error',
    name: 'Conflict Error Test',
    nodes: [
      {
        id: 'node-exclusive-1',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'wave',
        timing: { startFrame: 10, durationInFrames: 30 },
        controlledProperties: ['pose'],
        conflictPolicy: 'error',
      },
      {
        id: 'node-exclusive-2',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'bow',
        timing: { startFrame: 20, durationInFrames: 30 },
        controlledProperties: ['pose'],
        conflictPolicy: 'error',
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  assert.strictEqual(timeline.hasErrors, true);
  assert.strictEqual(timeline.conflicts.length, 1);
  assert.strictEqual(timeline.conflicts[0].policyApplied, 'error');
  assert.ok(timeline.conflicts[0].message.includes('Forbidden concurrent ownership'));
});

test('ActionGraph: guarantees mathematical frame determinism', () => {
  const graph: ActionGraph = {
    id: 'test-determinism',
    name: 'Determinism Test',
    nodes: [
      {
        id: 'walk',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'walk',
        timing: { startFrame: 0, durationInFrames: 60 },
        controlledProperties: ['jointRotations.armLeft', 'jointRotations.armRight'],
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  const eval1 = evaluateActionGraph(timeline, 25);
  const eval2 = evaluateActionGraph(timeline, 25);

  assert.deepStrictEqual(eval1, eval2, 'Multiple evaluations at frame 25 must return identical output');
});

test('ActionGraph: generates readable ASCII timeline diagnostics and Gantt chart', () => {
  const graph: ActionGraph = {
    id: 'test-diagnostics-output',
    name: 'Diagnostics Test',
    fps: 30,
    nodes: [
      {
        id: 'node-a',
        targetId: 'student-articulated',
        actionType: 'pose',
        pose: 'idle',
        timing: { startFrame: 0, durationInFrames: 30 },
        controlledProperties: ['pose'],
      },
      {
        id: 'node-b',
        targetId: 'student-articulated',
        actionType: 'clip',
        clipId: 'wave',
        timing: { startAfter: 'node-a', durationInFrames: 30 },
        controlledProperties: ['jointRotations.armRight'],
      },
    ],
  };

  const timeline = compileActionGraph(graph);
  const diag = formatTimelineDiagnostics(timeline);

  assert.ok(diag.includes('ACTION GRAPH TIMELINE: test-diagnostics-output'));
  assert.ok(diag.includes('--- TIMELINE GANTT CHART ---'));
  assert.ok(diag.includes('node-a (pose)'));
  assert.ok(diag.includes('node-b (clip)'));
  assert.ok(diag.includes('--- PROPERTY TRACK ALLOCATIONS ---'));
});
