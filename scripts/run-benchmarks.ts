import fs from 'fs';
import path from 'path';
import { runBenchmarkSuite, formatBenchmarkMarkdown } from '../src/core/benchmark/runner';

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs', 'benchmarks');
const reportPath = path.join(docsDir, 'benchmark-report.md');

const args = process.argv.slice(2);
const isUpdateBaselines = args.includes('--update-baselines');
const isJsonMode = args.includes('--json');
const benchmarksArg = args.find((a) => a.startsWith('--benchmarks='));
const benchmarksFilter = benchmarksArg
  ? benchmarksArg.replace('--benchmarks=', '').split(',').map((s) => s.trim())
  : undefined;

if (!isJsonMode) {
  console.log('===============================================================');
  console.log('       PeerPro Standard Benchmark & Visual Regression Suite    ');
  console.log('===============================================================');
  if (isUpdateBaselines) {
    console.log('  Mode: UPDATE BASELINES (--update-baselines is active)');
  }
}

const report = runBenchmarkSuite({
  updateBaselines: isUpdateBaselines,
  silent: isJsonMode,
  benchmarks: benchmarksFilter,
});

if (isJsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.failedCount === 0 ? 0 : 1);
}

// Generate Markdown Documentation Report
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
const markdownContent = formatBenchmarkMarkdown(report);
fs.writeFileSync(reportPath, markdownContent, 'utf8');

console.log('---------------------------------------------------------------');
console.log(`Report generated: ${path.relative(projectRoot, reportPath)}`);
console.log('===============================================================');
console.log(
  `Benchmark Summary: ${report.passedCount}/${report.totalBenchmarks} PASSED | ${report.failedCount} FAILED | ${report.warnCount} LATENCY WARNINGS`
);
console.log(
  `Average Render Time: ${report.averageRenderTimeMs}ms/frame | Total: ${(report.totalDurationMs / 1000).toFixed(2)}s`
);
console.log('===============================================================');

if (report.failedCount > 0) {
  console.error('\n❌ Visual regression or execution failures detected! See report above.');
  process.exit(1);
} else {
  console.log('\n✅ All benchmarks passed visual regression & performance gates.');
  process.exit(0);
}
