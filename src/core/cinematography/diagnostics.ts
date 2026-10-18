import {
  CompositionDiagnosticReport,
  CompositionIssue,
  FramingSolution,
  ShotIntentSpec,
} from './types';

/**
 * Validates measurable composition criteria: headroom, lead room (nose room),
 * subject scale appropriateness, and broadcast safe zone adherence.
 */
export function validateShotComposition(
  solution: FramingSolution,
  spec: ShotIntentSpec,
  canvasWidth = 1920,
  canvasHeight = 1080
): CompositionDiagnosticReport {
  const issues: CompositionIssue[] = [];
  const subject = solution.subject;
  const scale = subject.scale;

  // 1. Character Bounding Estimates
  const charWidth = 300 * scale;
  const charHeight = 600 * scale;

  const charLeft = subject.position.x - charWidth * 0.5;
  const charRight = subject.position.x + charWidth * 0.5;
  const charTop = subject.position.y - charHeight;
  const charBottom = subject.position.y;

  const headroomPx = charTop;
  const headroomRatio = headroomPx / canvasHeight;
  const subjectHeightRatio = charHeight / canvasHeight;

  // Broadcast Safe Margins
  // Action Safe: 93% (3.5% inset)
  const actionSafeMinX = canvasWidth * 0.035;
  const actionSafeMaxX = canvasWidth * 0.965;
  const actionSafeMinY = canvasHeight * 0.035;
  const actionSafeMaxY = canvasHeight * 0.965;

  // Title Safe: 90% (5.0% inset)
  const titleSafeMinX = canvasWidth * 0.05;
  const titleSafeMaxX = canvasWidth * 0.95;
  const titleSafeMinY = canvasHeight * 0.05;
  const titleSafeMaxY = canvasHeight * 0.95;

  // 2. Headroom Validation
  if (charTop < 0) {
    issues.push({
      type: 'headroom_violation',
      severity: 'error',
      field: 'subject.position.y',
      message: `Subject top of head is clipped above top frame edge (${Math.round(charTop)}px).`,
      suggestedRemedy: `Lower subject position.y or reduce subject scale (current scale: ${scale.toFixed(2)}).`,
    });
  } else if (
    (solution.intent === 'close_up' || solution.intent === 'medium') &&
    headroomRatio > 0.32
  ) {
    issues.push({
      type: 'headroom_violation',
      severity: 'warning',
      field: 'subject.position.y',
      message: `Excessive headroom (${(headroomRatio * 100).toFixed(1)}%) for ${solution.intent} shot intent.`,
      suggestedRemedy: `Raise subject position.y closer to upper third line (~360px).`,
    });
  }

  // 3. Lead Room (Nose Room) Validation
  const lookDir = spec.subject.lookDirection ?? (subject.flipX ? 'screen_left' : 'screen_right');
  const normalizedX = subject.position.x / canvasWidth;
  let leadRoomRatio = 0.5;

  if (lookDir === 'screen_right') {
    // Subject looks right, so lead room is space to the right
    leadRoomRatio = (canvasWidth - subject.position.x) / canvasWidth;
    if (normalizedX > 0.65) {
      issues.push({
        type: 'leadroom_violation',
        severity: 'warning',
        field: 'subject.position.x',
        message: `Subject looks right but is positioned on screen right (${(normalizedX * 100).toFixed(1)}%), crowding the right frame edge.`,
        suggestedRemedy: `Shift subject to Rule of Thirds Left (x ~ 640px) or center to provide proper lead room.`,
      });
    }
  } else if (lookDir === 'screen_left') {
    // Subject looks left, so lead room is space to the left
    leadRoomRatio = subject.position.x / canvasWidth;
    if (normalizedX < 0.35) {
      issues.push({
        type: 'leadroom_violation',
        severity: 'warning',
        field: 'subject.position.x',
        message: `Subject looks left but is positioned on screen left (${(normalizedX * 100).toFixed(1)}%), crowding the left frame edge.`,
        suggestedRemedy: `Shift subject to Rule of Thirds Right (x ~ 1280px) or center to provide proper lead room.`,
      });
    }
  }

  // 4. Subject Scale vs Intent Mismatch
  if (solution.intent === 'close_up' && subjectHeightRatio < 0.55) {
    issues.push({
      type: 'scale_mismatch',
      severity: 'warning',
      field: 'subject.scale',
      message: `Close-up intent requested, but subject occupies only ${(subjectHeightRatio * 100).toFixed(1)}% of frame height.`,
      suggestedRemedy: `Increase subject scale to at least 1.30 or increase camera zoom.`,
    });
  } else if (solution.intent === 'establishing' && subjectHeightRatio > 0.5) {
    issues.push({
      type: 'scale_mismatch',
      severity: 'warning',
      field: 'subject.scale',
      message: `Establishing shot requested, but subject occupies ${(subjectHeightRatio * 100).toFixed(1)}% of frame height, dominating environmental context.`,
      suggestedRemedy: `Decrease subject scale to <= 0.65 or push character further into depth.`,
    });
  }

  // 5. Broadcast Safe Margin Adherence
  const actionSafeCompliant =
    charLeft >= actionSafeMinX &&
    charRight <= actionSafeMaxX &&
    charTop >= actionSafeMinY &&
    charBottom <= canvasHeight; // feet may contact bottom ground

  const titleSafeCompliant =
    charLeft >= titleSafeMinX &&
    charRight <= titleSafeMaxX &&
    charTop >= titleSafeMinY &&
    charBottom <= canvasHeight;

  if (!actionSafeCompliant && solution.intent !== 'insert_detail') {
    issues.push({
      type: 'action_safe_clipped',
      severity: 'warning',
      field: 'subject.position',
      message: `Subject bounds cross Action Safe area (93% boundary).`,
      suggestedRemedy: `Nudge subject position inward from frame edges.`,
    });
  }

  // 6. Compute Quality Score
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'error') {
      score -= 25;
    } else if (issue.severity === 'warning') {
      score -= 10;
    }
  }
  score = Math.max(0, Math.min(100, score));

  const valid = !issues.some((i) => i.severity === 'error');

  return {
    valid,
    intentId: spec.id,
    score,
    issues,
    metrics: {
      headroomRatio,
      leadRoomRatio,
      subjectHeightRatio,
      actionSafeCompliant,
      titleSafeCompliant,
    },
  };
}

/**
 * Formats a CompositionDiagnosticReport into an ASCII summary for terminal inspection.
 */
export function formatCompositionReport(
  report: CompositionDiagnosticReport
): string {
  const lines: string[] = [];
  const statusBadge = report.valid ? '✅ VALID COMPOSITION' : '❌ COMPOSITION DEFECTS';

  lines.push('================================================================================');
  lines.push(` CINEMATIC SHOT COMPOSITION DIAGNOSTICS: ${report.intentId}`);
  lines.push(` Status: ${statusBadge} | Composition Score: ${report.score} / 100`);
  lines.push('================================================================================');
  lines.push('');

  lines.push('--- MEASURABLE COMPOSITION METRICS ---');
  lines.push(`  * Headroom Ratio:       ${(report.metrics.headroomRatio * 100).toFixed(1)}%`);
  lines.push(`  * Lead Room Ratio:      ${(report.metrics.leadRoomRatio * 100).toFixed(1)}%`);
  lines.push(`  * Subject Height Ratio: ${(report.metrics.subjectHeightRatio * 100).toFixed(1)}%`);
  lines.push(`  * Action Safe (93%):    ${report.metrics.actionSafeCompliant ? 'Compliant' : 'Edge Clipped'}`);
  lines.push(`  * Title Safe (90%):     ${report.metrics.titleSafeCompliant ? 'Compliant' : 'Edge Clipped'}`);
  lines.push('');

  lines.push('--- ISSUES & SUGGESTED REMEDIES ---');
  if (report.issues.length === 0) {
    lines.push('  No composition defects detected. Framing complies with cinematic best practices.');
  } else {
    for (const issue of report.issues) {
      const tag = issue.severity.toUpperCase();
      lines.push(`  [${tag}] ${issue.type} (${issue.field}):`);
      lines.push(`      ${issue.message}`);
      lines.push(`      👉 Remedy: ${issue.suggestedRemedy}`);
    }
  }

  lines.push('================================================================================');
  return lines.join('\n');
}
