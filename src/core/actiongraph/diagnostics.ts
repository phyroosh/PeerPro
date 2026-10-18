import { ResolvedTimeline } from './types';

/**
 * Formats a ResolvedTimeline into an ASCII Gantt chart and diagnostic summary.
 * Ideal for CLI inspection, logging, and validation reports.
 */
export function formatTimelineDiagnostics(
  timeline: ResolvedTimeline,
  columns = 50
): string {
  const lines: string[] = [];
  const durationSec = (timeline.totalDurationInFrames / timeline.fps).toFixed(2);

  lines.push('================================================================================');
  lines.push(` ACTION GRAPH TIMELINE: ${timeline.graphId}`);
  lines.push(` FPS: ${timeline.fps} | Total Frames: ${timeline.totalDurationInFrames} (${durationSec}s)`);
  lines.push(` Nodes: ${timeline.nodes.length} | Conflicts: ${timeline.conflicts.length} | Errors: ${timeline.hasErrors ? 'YES (FAILED)' : 'NONE'}`);
  lines.push('================================================================================');
  lines.push('');

  // 1. ASCII Gantt Chart
  lines.push('--- TIMELINE GANTT CHART ---');
  const maxFrames = Math.max(1, timeline.totalDurationInFrames);

  // Time ruler header
  const stepFrames = Math.max(10, Math.floor(maxFrames / 5));
  let ruler = 'Node ID               | 0';
  for (let f = stepFrames; f <= maxFrames; f += stepFrames) {
    const mark = `...${f}f`;
    ruler += mark.padStart(Math.max(mark.length, Math.floor((f / maxFrames) * columns) - ruler.length + 24), ' ');
  }
  lines.push(ruler);
  lines.push('-'.repeat(Math.max(ruler.length, 75)));

  for (const node of timeline.nodes) {
    const nodeLabel = `${node.id} (${node.actionType})`.padEnd(21, ' ').slice(0, 21);

    const startCol = Math.min(
      columns - 1,
      Math.floor((node.absoluteStartFrame / maxFrames) * columns)
    );
    const endCol = Math.min(
      columns,
      Math.max(startCol + 1, Math.floor((node.absoluteEndFrame / maxFrames) * columns))
    );

    let bar = '';
    for (let c = 0; c < columns; c++) {
      if (c >= startCol && c < endCol) {
        bar += '=';
      } else {
        bar += '.';
      }
    }

    const timingInfo = `[${node.absoluteStartFrame}-${node.absoluteEndFrame}f] prio:${node.priority ?? 10}`;
    lines.push(`${nodeLabel} | ${bar}  ${timingInfo}`);
  }

  lines.push('');

  // 2. Property Track Allocations
  lines.push('--- PROPERTY TRACK ALLOCATIONS ---');
  const trackKeys = Object.keys(timeline.propertyTracks).sort();
  if (trackKeys.length === 0) {
    lines.push('  No property tracks registered.');
  } else {
    for (const track of trackKeys) {
      const segs = timeline.propertyTracks[track];
      const segSummary = segs
        .map((s) => `${s.nodeId} (${s.startFrame}-${s.endFrame}f, p:${s.priority})`)
        .join(', ');
      lines.push(`  * ${track}: ${segSummary}`);
    }
  }

  lines.push('');

  // 3. Conflicts and Resolution Summary
  lines.push('--- CONFLICT RESOLUTION SUMMARY ---');
  if (timeline.conflicts.length === 0) {
    lines.push('  All property tracks conflict-free.');
  } else {
    for (const conflict of timeline.conflicts) {
      const tag = conflict.policyApplied.toUpperCase();
      const range = `[${conflict.overlapRange[0]}-${conflict.overlapRange[1]}f]`;
      const winner = conflict.winnerNodeId ? ` (Winner: ${conflict.winnerNodeId})` : '';
      lines.push(`  [${tag}] ${conflict.targetId}.${conflict.property} ${range}: ${conflict.message}${winner}`);
    }
  }

  lines.push('================================================================================');
  return lines.join('\n');
}
