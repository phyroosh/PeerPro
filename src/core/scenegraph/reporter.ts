import { SceneGraphReport } from './types';

/**
 * Formats a SceneGraphReport into a human- and agent-readable diagnostic report.
 */
export function formatSceneGraphReport(report: SceneGraphReport): string {
  const lines: string[] = [];

  lines.push('===============================================================');
  lines.push('        PeerPro Scene Graph Spatial Diagnostics Report         ');
  lines.push('===============================================================');
  lines.push(`Status:             ${report.valid ? '✅ VALID (All Constraints Solved)' : '❌ CONFLICTS DETECTED'}`);
  lines.push(`Total Entities:     ${report.totalNodes}`);
  lines.push(`Resolution Order:   ${report.resolutionOrder.join(' -> ')}`);

  if (report.cyclesDetected.length > 0) {
    lines.push('\n🚨 CYCLIC DEPENDENCIES DETECTED:');
    for (const cycle of report.cyclesDetected) {
      lines.push(`  - ${cycle.join(' -> ')}`);
    }
  }

  if (report.conflicts.length > 0) {
    lines.push('\n⚠️ SPATIAL CONFLICTS:');
    for (const c of report.conflicts) {
      lines.push(`  - [${c.nodeIds.join(', ')}]: ${c.message}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('\n🔍 WARNINGS:');
    for (const w of report.warnings) {
      lines.push(`  - ${w}`);
    }
  }

  // Hierarchy Tree Visualization
  lines.push('\n--- Entity Hierarchy Tree ---');
  const rootNodes = report.hierarchyTree.filter((n) => !n.parentId);

  function printNode(nodeId: string, indent: string) {
    const nodeInfo = report.hierarchyTree.find((n) => n.id === nodeId);
    const resolved = report.resolvedNodes[nodeId];
    const details = resolved
      ? `pos=(${resolved.worldTransform.x}, ${resolved.worldTransform.y}) depth=${resolved.effectiveDepth} order=${resolved.effectiveOrder}`
      : 'unresolved';
    lines.push(`${indent}└── [${nodeId}] (${nodeInfo?.kind || 'node'}) - ${details}`);

    if (nodeInfo && nodeInfo.children.length > 0) {
      for (const childId of nodeInfo.children) {
        printNode(childId, indent + '    ');
      }
    }
  }

  for (const root of rootNodes) {
    printNode(root.id, '  ');
  }

  // Entity Resolution Table
  lines.push('\n--- Resolved Spatial Placements ---');
  lines.push('| ID | Kind | Depth | Order | World Pos (x, y) | Bounds (w x h) | Facing | Applied Constraints |');
  lines.push('|---|---|---|---|---|---|---|---|');

  for (const nodeId of report.resolutionOrder) {
    const node = report.resolvedNodes[nodeId];
    if (!node) continue;

    const pos = `(${node.worldTransform.x}, ${node.worldTransform.y})`;
    const bounds = `${node.worldBounds.width}x${node.worldBounds.height} @ (${node.worldBounds.x}, ${node.worldBounds.y})`;
    const facing = node.worldTransform.flipX ? 'left (flipX)' : 'right';
    const constraints = node.appliedConstraints.length > 0 ? node.appliedConstraints.join(', ') : 'none';

    lines.push(`| \`${node.id}\` | ${node.kind} | ${node.effectiveDepth} | ${node.effectiveOrder} | ${pos} | ${bounds} | ${facing} | ${constraints} |`);
  }

  // Unresolved constraints
  const allUnresolved = Object.values(report.resolvedNodes).flatMap((n) =>
    n.unresolvedConstraints.map((u) => ({ nodeId: n.id, ...u }))
  );

  if (allUnresolved.length > 0) {
    lines.push('\n⚠️ UNRESOLVED CONSTRAINTS:');
    for (const u of allUnresolved) {
      lines.push(`  - [${u.nodeId}] Constraint "${u.constraint.type}": ${u.reason}`);
    }
  }

  lines.push('===============================================================');
  return lines.join('\n');
}
