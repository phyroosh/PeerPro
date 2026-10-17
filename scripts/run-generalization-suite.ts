import fs from 'fs';
import path from 'path';
import { runGeneralizationSuite, formatGeneralizationMarkdown } from '../src/core/challenges/runner';

const projectRoot = path.resolve(__dirname, '..');
const qualityDir = path.join(projectRoot, 'docs', 'quality');
const reportFile = path.join(qualityDir, 'creative-generalization-suite.md');

const isJsonMode = process.argv.includes('--json');

if (!isJsonMode) {
  console.log('===============================================================');
  console.log('    PeerPro Creative Generalization Challenge Suite (Phase 21) ');
  console.log('===============================================================');
  console.log('Evaluating AI-Agent creative generalization across 6 novel challenges...');
  console.log('---------------------------------------------------------------');
}

const startTime = Date.now();
const report = runGeneralizationSuite();
const durationMs = Date.now() - startTime;

if (isJsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.failedCount === 0 ? 0 : 1);
}

// Ensure docs/quality exists
if (!fs.existsSync(qualityDir)) {
  fs.mkdirSync(qualityDir, { recursive: true });
}

const markdown = formatGeneralizationMarkdown(report);
fs.writeFileSync(reportFile, markdown, 'utf8');

console.log('');
console.log('Challenge Scorecard:');
report.results.forEach((r, idx) => {
  const badge = r.status === 'PASS' ? '✅ PASS' : r.status === 'IDENTIFIED_GAP' ? '🔍 GAP FOUND' : '❌ FAIL';
  console.log(`  [C${idx + 1}] ${r.title.padEnd(52, '.')} ${badge} (${r.scores.overallScore}/100)`);
});

console.log('---------------------------------------------------------------');
console.log(`Overall Generalization Score: ${report.averageScore}/100`);
console.log(`Execution Time:               ${(durationMs / 1000).toFixed(2)}s`);
console.log(`Detailed Report:              ${path.relative(projectRoot, reportFile)}`);
console.log('===============================================================');
console.log('Top Prioritized Architectural Gaps:');
report.rankedGaps.forEach((g) => {
  console.log(`  #${g.rank}: ${g.title}`);
  console.log(`      Impact: ${g.impact}`);
});
console.log('===============================================================');
console.log('🎉 Creative Generalization Challenge assessment complete.');

process.exit(report.failedCount === 0 ? 0 : 1);
