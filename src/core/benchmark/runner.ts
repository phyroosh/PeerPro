import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import {
  BenchmarkEntry,
  BenchmarkResult,
  BenchmarkReport,
  BenchmarkSuiteOptions,
  BenchmarkStatus,
  LatencyStatus,
} from './types';
import { getBenchmarkCatalog, saveBaselines, loadBaselines } from './baselines';

const projectRoot = path.resolve(__dirname, '../../..');

export function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Runs a single benchmark render, measures exact latency, and checks SHA-256 hash against golden baseline.
 */
export function runSingleBenchmark(
  entry: BenchmarkEntry,
  targetDir: string,
  options?: { updateBaselines?: boolean }
): BenchmarkResult {
  const targetFile = path.join(targetDir, `${entry.id.toLowerCase()}.png`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }

  const startTime = Date.now();
  let generatedHash = '';
  let errorMsg: string | undefined;

  try {
    // Execute still render via Remotion CLI
    execSync(
      `npx remotion still ${entry.compositionId} "${targetFile}" --frame=${entry.frame}`,
      {
        cwd: projectRoot,
        stdio: 'pipe',
      }
    );

    if (!fs.existsSync(targetFile)) {
      throw new Error(`Expected output file not generated: ${targetFile}`);
    }

    generatedHash = computeSha256(targetFile);
  } catch (err: any) {
    errorMsg = err.message || String(err);
  }

  const durationMs = Date.now() - startTime;

  let status: BenchmarkStatus = 'FAIL';
  if (!errorMsg && generatedHash) {
    if (options?.updateBaselines) {
      status = 'PASS';
    } else if (!entry.goldenSha256) {
      status = 'NEW';
    } else if (generatedHash === entry.goldenSha256) {
      status = 'PASS';
    } else {
      status = 'FAIL';
    }
  }

  let latencyStatus: LatencyStatus = 'PASS';
  if (durationMs > entry.maxRenderTimeMs * 1.5) {
    latencyStatus = 'FAIL';
  } else if (durationMs > entry.maxRenderTimeMs) {
    latencyStatus = 'WARN';
  }

  return {
    id: entry.id,
    name: entry.name,
    compositionId: entry.compositionId,
    frame: entry.frame,
    category: entry.category,
    durationMs,
    generatedHash,
    goldenHash: options?.updateBaselines ? generatedHash : entry.goldenSha256,
    status,
    latencyStatus,
    maxRenderTimeMs: entry.maxRenderTimeMs,
    outputPath: targetFile,
    error: errorMsg,
  };
}

/**
 * Runs the full or filtered benchmark suite across PeerPro compositions.
 */
export function runBenchmarkSuite(options: BenchmarkSuiteOptions = {}): BenchmarkReport {
  const catalog = getBenchmarkCatalog();
  const filterIds = options.benchmarks ? new Set(options.benchmarks) : null;
  const entries = filterIds
    ? catalog.filter((e) => filterIds.has(e.id))
    : catalog;

  const outDir = options.outDir || path.join(projectRoot, 'out', 'benchmarks');
  const results: BenchmarkResult[] = [];
  const suiteStartTime = Date.now();

  for (const entry of entries) {
    if (!options.silent) {
      process.stdout.write(`  ▶ Running ${entry.id.padEnd(18)} (${entry.compositionId} @ ${entry.frame})... `);
    }
    const result = runSingleBenchmark(entry, outDir, {
      updateBaselines: options.updateBaselines,
    });
    results.push(result);

    if (!options.silent) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'NEW' ? '🆕' : '❌';
      const latencyIcon = result.latencyStatus === 'PASS' ? '' : ` [${result.latencyStatus}]`;
      console.log(`${statusIcon} ${result.status} (${result.durationMs}ms)${latencyIcon}`);
    }
  }

  // Handle updating golden baselines if requested
  if (options.updateBaselines) {
    const currentBaselines = loadBaselines();
    for (const res of results) {
      if (res.generatedHash) {
        currentBaselines[res.id] = res.generatedHash;
      }
    }
    saveBaselines(currentBaselines);
  }

  const totalDurationMs = Date.now() - suiteStartTime;
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  const warnCount = results.filter((r) => r.latencyStatus === 'WARN').length;
  const sumRenderTimes = results.reduce((acc, r) => acc + r.durationMs, 0);
  const averageRenderTimeMs = results.length > 0 ? Math.round(sumRenderTimes / results.length) : 0;

  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    totalBenchmarks: results.length,
    passedCount,
    failedCount,
    warnCount,
    totalDurationMs,
    averageRenderTimeMs,
    results,
  };
}

/**
 * Formats a BenchmarkReport into a GitHub-flavored Markdown report.
 */
export function formatBenchmarkMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];
  lines.push('# PeerPro Benchmark & Visual Regression Report');
  lines.push('');
  lines.push(`- **Generated At**: \`${report.timestamp}\``);
  lines.push(`- **Environment**: Node.js \`${report.nodeVersion}\` / Linux`);
  lines.push(`- **Total Benchmarks**: \`${report.totalBenchmarks}\``);
  lines.push(`- **Visual Regression Status**: \`${report.passedCount}/${report.totalBenchmarks} PASSED\` (${report.failedCount} failures)`);
  lines.push(`- **Average Render Latency**: \`${report.averageRenderTimeMs}ms / still frame\``);
  lines.push(`- **Total Suite Execution Time**: \`${(report.totalDurationMs / 1000).toFixed(2)}s\``);
  lines.push('');
  lines.push('## Standard Benchmark Scorecard');
  lines.push('');
  lines.push('| Benchmark ID | Name | Composition | Frame | Render Time | Ceiling | Latency | Visual Status | Golden SHA-256 Baseline |');
  lines.push('|:-------------|:-----|:------------|:-----:|:-----------:|:-------:|:-------:|:-------------:|:------------------------|');

  for (const r of report.results) {
    const latencyBadge = r.latencyStatus === 'PASS' ? '⚡ PASS' : r.latencyStatus === 'WARN' ? '⚠️ WARN' : '🚨 FAIL';
    const visualBadge = r.status === 'PASS' ? '✅ PASS' : r.status === 'NEW' ? '🆕 NEW' : '❌ FAIL';
    const shortHash = r.generatedHash ? `\`${r.generatedHash.substring(0, 12)}...\`` : '`NONE`';
    lines.push(
      `| **${r.id}** | ${r.name} | \`${r.compositionId}\` | \`${r.frame}\` | \`${r.durationMs}ms\` | \`<${r.maxRenderTimeMs}ms\` | ${latencyBadge} | ${visualBadge} | ${shortHash} |`
    );
  }

  lines.push('');
  lines.push('## Benchmark Descriptions & Capabilities Tested');
  lines.push('');
  const catalog = getBenchmarkCatalog();
  for (const item of catalog) {
    lines.push(`### \`${item.id}\`: ${item.name}`);
    lines.push(`- **Composition**: \`${item.compositionId}\` (Frame: \`${item.frame}\`)`);
    lines.push(`- **Category**: \`${item.category}\``);
    lines.push(`- **Scope**: ${item.description}`);
    lines.push(`- **Latency Budget**: Max \`${item.maxRenderTimeMs}ms\``);
    lines.push('');
  }

  return lines.join('\n');
}
