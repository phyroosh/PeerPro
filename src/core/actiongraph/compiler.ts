import {
  ActionGraph,
  ActionNode,
  PropertyTrackSegment,
  ResolvedActionNode,
  ResolvedTimeline,
  TimelineConflict,
} from './types';

/**
 * Compiles a declarative ActionGraph into a concrete ResolvedTimeline.
 * Resolves relative dependencies, converts timing units, builds property tracks,
 * detects circular references, and applies conflict resolution policies.
 */
export function compileActionGraph(graph: ActionGraph): ResolvedTimeline {
  const fps = graph.fps ?? 30;
  const nodes = graph.nodes;

  // 1. Validate Node IDs
  const rawNodeMap = new Map<string, ActionNode>();
  for (const node of nodes) {
    if (rawNodeMap.has(node.id)) {
      throw new Error(`Duplicate action node ID "${node.id}" in ActionGraph "${graph.id}".`);
    }
    rawNodeMap.set(node.id, node);
  }

  // 2. Topological Dependency Resolution & Timing Conversion
  const resolvedNodesById: Record<string, ResolvedActionNode> = {};
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function resolveNode(nodeId: string, stack: string[]): ResolvedActionNode {
    if (resolvedNodesById[nodeId]) {
      return resolvedNodesById[nodeId];
    }

    if (visiting.has(nodeId)) {
      const cyclePath = [...stack, nodeId].join(' -> ');
      throw new Error(`Circular dependency detected in ActionGraph "${graph.id}": ${cyclePath}`);
    }

    const rawNode = rawNodeMap.get(nodeId);
    if (!rawNode) {
      throw new Error(
        `Missing dependency: Action node "${nodeId}" referenced in timing dependency does not exist.`
      );
    }

    visiting.add(nodeId);
    stack.push(nodeId);

    const timing = rawNode.timing;

    // Resolve Duration
    let durationInFrames = 30;
    if (timing.durationInFrames !== undefined) {
      durationInFrames = Math.max(1, timing.durationInFrames);
    } else if (timing.durationSeconds !== undefined) {
      durationInFrames = Math.max(1, Math.round(timing.durationSeconds * fps));
    }

    // Resolve Absolute Start Frame
    let startFrame = 0;
    const delay =
      (timing.delayFrames ?? 0) +
      Math.round((timing.delaySeconds ?? 0) * fps);

    if (timing.startAfter) {
      const prerequisite = resolveNode(timing.startAfter, stack);
      startFrame = prerequisite.absoluteEndFrame + delay;
    } else if (timing.startWith) {
      const peer = resolveNode(timing.startWith, stack);
      startFrame = peer.absoluteStartFrame + delay;
    } else if (timing.startFrame !== undefined) {
      startFrame = timing.startFrame;
    } else if (timing.startSeconds !== undefined) {
      startFrame = Math.round(timing.startSeconds * fps);
    }

    const endFrame = startFrame + durationInFrames;

    const resolved: ResolvedActionNode = {
      ...rawNode,
      absoluteStartFrame: startFrame,
      absoluteEndFrame: endFrame,
      effectiveDurationInFrames: durationInFrames,
    };

    visiting.delete(nodeId);
    stack.pop();
    visited.add(nodeId);

    resolvedNodesById[nodeId] = resolved;
    return resolved;
  }

  // Resolve all nodes
  for (const node of nodes) {
    resolveNode(node.id, []);
  }

  const resolvedNodeList = nodes.map((n) => resolvedNodesById[n.id]);

  // Sort nodes chronologically by startFrame, then by priority
  resolvedNodeList.sort(
    (a, b) =>
      a.absoluteStartFrame - b.absoluteStartFrame ||
      (b.priority ?? 10) - (a.priority ?? 10)
  );

  // 3. Property Tracks & Conflict Resolution
  const propertyTracks: Record<string, PropertyTrackSegment[]> = {};
  const conflicts: TimelineConflict[] = [];
  let hasErrors = false;

  for (const node of resolvedNodeList) {
    const priority = node.priority ?? 10;
    const policy = node.conflictPolicy ?? 'override';

    for (const prop of node.controlledProperties) {
      const trackKey = `${node.targetId}.${prop}`;
      if (!propertyTracks[trackKey]) {
        propertyTracks[trackKey] = [];
      }

      const existingSegments = propertyTracks[trackKey];

      // Check for overlap with already tracked segments
      for (const seg of existingSegments) {
        const overlapStart = Math.max(seg.startFrame, node.absoluteStartFrame);
        const overlapEnd = Math.min(seg.endFrame, node.absoluteEndFrame);

        if (overlapStart < overlapEnd) {
          // Overlap detected!
          if (policy === 'error') {
            hasErrors = true;
            conflicts.push({
              property: prop,
              targetId: node.targetId,
              nodeA: seg.nodeId,
              nodeB: node.id,
              overlapRange: [overlapStart, overlapEnd],
              policyApplied: 'error',
              message: `Forbidden concurrent ownership of property "${trackKey}" between "${seg.nodeId}" and "${node.id}".`,
            });
          } else if (policy === 'override') {
            const winnerId =
              priority > seg.priority
                ? node.id
                : priority < seg.priority
                ? seg.nodeId
                : node.absoluteStartFrame >= seg.startFrame
                ? node.id
                : seg.nodeId;

            conflicts.push({
              property: prop,
              targetId: node.targetId,
              nodeA: seg.nodeId,
              nodeB: node.id,
              overlapRange: [overlapStart, overlapEnd],
              policyApplied: 'override',
              winnerNodeId: winnerId,
              message: `Overlapping write on "${trackKey}". Resolved by priority (${winnerId} selected).`,
            });
          } else if (policy === 'blend') {
            conflicts.push({
              property: prop,
              targetId: node.targetId,
              nodeA: seg.nodeId,
              nodeB: node.id,
              overlapRange: [overlapStart, overlapEnd],
              policyApplied: 'blend',
              message: `Overlapping write on "${trackKey}". Crossfading values between "${seg.nodeId}" and "${node.id}".`,
            });
          }
        }
      }

      existingSegments.push({
        nodeId: node.id,
        startFrame: node.absoluteStartFrame,
        endFrame: node.absoluteEndFrame,
        priority,
      });
    }
  }

  // 4. Compute Total Duration
  const maxEndFrame = Math.max(
    0,
    ...resolvedNodeList.map((n) => n.absoluteEndFrame)
  );
  const totalDurationInFrames = Math.max(
    maxEndFrame,
    graph.durationInFrames ?? maxEndFrame
  );

  return {
    graphId: graph.id,
    fps,
    totalDurationInFrames,
    nodes: resolvedNodeList,
    nodesById: resolvedNodesById,
    propertyTracks,
    conflicts,
    hasErrors,
  };
}
