# PeerPro Action Graph & Timeline Orchestration Guide

## Overview

The **PeerPro Action Graph Subsystem** (`src/core/actiongraph/`) provides a declarative, high-level orchestration model for sequencing complex multi-character performances, interactions, expressions, and environmental actions without manual frame-by-frame low-level coordinate management.

Animation authors and autonomous agents declare *what* entities should do, *when* actions occur relative to one another (e.g. `startAfter`, `startWith`), and *which* property tracks they control. The compiler and evaluator translate these high-level specifications into pure mathematical, frame-deterministic runtime states.

$$\text{ActionGraph} \xrightarrow[\text{Topological Sort}]{\text{compileActionGraph}} \text{ResolvedTimeline} \xrightarrow[\text{Pure FK Evaluation}]{\text{evaluateActionGraph}(t)} \text{EvaluatedActionGraphState}$$

---

## 1. Core Architecture

The subsystem consists of four core modules:

```
src/core/actiongraph/
├── types.ts         # Action nodes, timing specs, property tracks, conflict policies
├── compiler.ts      # Cycle detection (DFS), unit conversion, topological resolution
├── evaluator.ts     # Pure frame evaluation, pose resolution, property arbitration
├── diagnostics.ts   # ASCII Gantt chart and property track conflict reports
└── index.ts         # Unified barrel exports
```

---

## 2. Declarative Timing Primitives

Action nodes support both absolute and relative timing dependencies with automatic unit conversion based on the canvas framerate (`fps`, default: 30):

| Timing Property | Type | Description |
|:---|:---|:---|
| **`startFrame`** | `number` | Absolute starting frame. |
| **`durationInFrames`** | `number` | Absolute duration in integer frames. |
| **`startSeconds`** | `number` | Absolute starting time in seconds (converted via $\text{round}(s \times \text{fps})$). |
| **`durationSeconds`** | `number` | Absolute duration in seconds. |
| **`startAfter`** | `string` | Dependency: start immediately when the referenced prerequisite node finishes. |
| **`startWith`** | `string` | Concurrency: start simultaneously with the referenced peer node's start. |
| **`delayFrames`** | `number` | Additional positive or negative frame delay added to relative start. |
| **`delaySeconds`** | `number` | Additional delay in seconds added to relative start. |

### Example Action Node Definition:
```typescript
{
  id: 'wave-greeting',
  name: 'Wave Greeting',
  targetId: 'student-articulated',
  actionType: 'clip',
  clipId: 'wave',
  timing: {
    startWith: 'hold-umbrella',
    delayFrames: 15,
    durationInFrames: 45,
  },
  controlledProperties: ['jointRotations.armRight', 'pose'],
  priority: 25,
  conflictPolicy: 'override',
}
```

---

## 3. Topological Dependency Resolution & Cycle Detection

The compiler (`compileActionGraph`) evaluates dependencies using depth-first search (DFS) with node state tracking (`visiting` vs `visited`):
- **Cycle Prevention**: Circular references (e.g., $A \to B \to A$) throw descriptive errors detailing the exact cycle path.
- **Missing Dependency Handling**: References to non-existent node IDs fail early with actionable error diagnostics.
- **Chronological Sorting**: Evaluated nodes are sorted chronologically by start frame and priority for deterministic evaluation.

---

## 4. Property Track Conflict Arbitration

When multiple concurrent action nodes attempt to modify the same entity property (e.g., character right arm, facial expression, or root transform), PeerPro applies explicit conflict resolution policies:

### Conflict Policies:
1. **`override` (Default)**:
   - The node with the **higher priority value** wins ownership of the track.
   - If priority values are tied, the **later `startFrame`** wins (timestamp precedence).
2. **`blend`**:
   - For continuous numeric channels (such as FK joint rotations or root offsets), overlapping values are smoothly interpolated via Hermite crossfading across `blendInFrames` and `blendOutFrames`.
3. **`error`**:
   - Concurrent ownership of the property track is strictly forbidden. The compiler flags `hasErrors = true` and records the conflicting nodes and frame overlap range.

---

## 5. Pure Frame Evaluator

The evaluator (`evaluateActionGraph`) takes a compiled `ResolvedTimeline` and a specific `frame` number, producing a complete snapshot of all active character states, joint rotations, part overrides, and active interactions:

```typescript
import { compileActionGraph, evaluateActionGraph } from '../src/core/actiongraph';

const timeline = compileActionGraph(graphSpec);
const state = evaluateActionGraph(timeline, frame, {
  baseEntities: {
    'student-articulated': { x: 700, y: 880, scale: 0.9, pose: 'idle' },
  },
});

console.log(`Active Pose: ${state.characters['student-articulated'].pose}`);
console.log(`Arm Rotation: ${state.characters['student-articulated'].jointRotations.armRight}°`);
```

### Frame Determinism Guarantee
- Multiple invocations of `evaluateActionGraph(timeline, f)` at the exact same frame return bit-for-bit identical telemetry.
- No internal timeline caching or mutable runtime state leaks between frames.

---

## 6. Diagnostic CLI & ASCII Gantt Inspection

To inspect, validate, and debug Action Graphs from the command line, use the built-in inspector script:

```bash
# Run inspector on built-in showcase graph
npm run actiongraph:inspect

# Or inspect custom action graph JSON with specific evaluation frames
npx tsx scripts/inspect-actiongraph.ts path/to/graph.json --frames=0,30,60,75,120
```

### Sample CLI Gantt Output:
```
================================================================================
 ACTION GRAPH TIMELINE: sample-actiongraph-classroom-orchestration
 FPS: 30 | Total Frames: 150 (5.00s)
 Nodes: 5 | Conflicts: 1 | Errors: NONE
================================================================================

--- TIMELINE GANTT CHART ---
Node ID               | 0   ...30f    ...60f    ...90f   ...120f   ...150f
---------------------------------------------------------------------------
initial-idle (pose)   | ==========........................................  [0-30f] prio:10
ambient-breathing (cl | ==================================================  [0-150f] prio:5
notice-surprise (expr | ..........==========..............................  [30-60f] prio:15
hold-umbrella (intera | ....................==============================  [60-150f] prio:20
wave-greeting (clip)  | .........................===============..........  [75-120f] prio:25

--- PROPERTY TRACK ALLOCATIONS ---
  * student-articulated.expression: notice-surprise (30-60f, p:15)
  * student-articulated.interactions.starter-prop-umbrella: hold-umbrella (60-150f, p:20)
  * student-articulated.jointRotations.armLeft: ambient-breathing (0-150f, p:5)
  * student-articulated.jointRotations.armRight: hold-umbrella (60-150f, p:20), wave-greeting (75-120f, p:25)
  * student-articulated.pose: initial-idle (0-30f, p:10), wave-greeting (75-120f, p:25)
  * student-articulated.rootOffset: ambient-breathing (0-150f, p:5)

--- CONFLICT RESOLUTION SUMMARY ---
  [OVERRIDE] student-articulated.jointRotations.armRight [75-120f]: Overlapping write on "student-articulated.jointRotations.armRight". Resolved by priority (wave-greeting selected). (Winner: wave-greeting)
================================================================================
```

---

## 7. Showcase Composition

The showcase composition (`ActionGraphShowcase`) in `src/compositions/ActionGraphShowcase.tsx` visualizes:
1. **Interactive Gantt Timeline**: Displays all action nodes with color-coded active states and a real-time playhead scrubber.
2. **Property Conflict Monitor**: Shows active winning nodes, priority overrides, and rotation angles.
3. **Coordinated Performance**: Demonstrates Ren holding an umbrella while dynamically waving without limb drift or track corruption.

Still proof render:
```bash
npm run render:actiongraph:still
# Produces out/actiongraph-showcase.png
```
