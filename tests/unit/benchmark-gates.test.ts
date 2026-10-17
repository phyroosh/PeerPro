import test from 'node:test';
import assert from 'node:assert';
import {
  STANDARD_BENCHMARKS,
  getBenchmarkCatalog,
  findBenchmarkById,
  loadBaselines,
} from '../../src/core/benchmark/baselines';
import { formatBenchmarkMarkdown } from '../../src/core/benchmark/runner';
import { BenchmarkReport, BenchmarkResult } from '../../src/core/benchmark/types';

test('Benchmark Catalog: contains all 10 standard creative benchmarks', () => {
  const catalog = getBenchmarkCatalog();
  assert.strictEqual(catalog.length, 10, 'Expected exactly 10 standard benchmarks');

  const expectedIds = [
    'B1_CHARACTER',
    'B2_ENVIRONMENT',
    'B3_PARALLAX',
    'B4_STYLE',
    'B5_CUTOUT',
    'B6_CLASSROOM',
    'B7_ACTION',
    'B8_CINEMATOGRAPHY',
    'B9_AGENT',
    'B10_AUDIO',
  ];

  const actualIds = catalog.map((b) => b.id);
  assert.deepStrictEqual(actualIds, expectedIds);
});

test('Benchmark Catalog: every benchmark has complete metadata and valid parameters', () => {
  const catalog = getBenchmarkCatalog();

  for (const b of catalog) {
    assert.ok(b.id.startsWith('B'), `ID must start with B: ${b.id}`);
    assert.ok(b.name && b.name.length > 5, `Name must be descriptive: ${b.name}`);
    assert.ok(b.compositionId && b.compositionId.length > 3, `CompositionId must be set: ${b.compositionId}`);
    assert.ok(b.frame >= 0, `Frame must be non-negative: ${b.frame}`);
    assert.ok(b.category, `Category must be defined: ${b.category}`);
    assert.ok(b.maxRenderTimeMs >= 1000, `Max render time must be reasonable: ${b.maxRenderTimeMs}`);
    assert.ok(b.description && b.description.length > 10, `Description must be provided: ${b.description}`);
  }
});

test('Benchmark Baselines: all 10 benchmarks have 64-character hex SHA-256 baselines', () => {
  const baselines = loadBaselines();
  const hex64Regex = /^[a-f0-9]{64}$/;

  for (const b of STANDARD_BENCHMARKS) {
    const hash = baselines[b.id];
    assert.ok(hash, `Baseline hash must exist for ${b.id}`);
    assert.match(hash, hex64Regex, `Baseline hash must be 64-char hex string: ${hash}`);
  }
});

test('findBenchmarkById: retrieves benchmark by ID or returns undefined', () => {
  const b1 = findBenchmarkById('B1_CHARACTER');
  assert.ok(b1);
  assert.strictEqual(b1.compositionId, 'CharacterShowcase');
  assert.strictEqual(b1.frame, 30);

  const b10 = findBenchmarkById('B10_AUDIO');
  assert.ok(b10);
  assert.strictEqual(b10.compositionId, 'AudioNarrativeShowcase');
  assert.strictEqual(b10.frame, 45);

  const unknown = findBenchmarkById('B99_NONEXISTENT');
  assert.strictEqual(unknown, undefined);
});

test('formatBenchmarkMarkdown: formats complete scorecard table with metrics', () => {
  const mockResults: BenchmarkResult[] = [
    {
      id: 'B1_CHARACTER',
      name: 'Character Builder',
      compositionId: 'CharacterShowcase',
      frame: 30,
      category: 'character',
      durationMs: 750,
      generatedHash: '8545fadf86ebe71209cd92376022104b098d41b49dcd6c03abdcbf7da0ec2284',
      goldenHash: '8545fadf86ebe71209cd92376022104b098d41b49dcd6c03abdcbf7da0ec2284',
      status: 'PASS',
      latencyStatus: 'PASS',
      maxRenderTimeMs: 5000,
    },
    {
      id: 'B10_AUDIO',
      name: 'Audio Narrative',
      compositionId: 'AudioNarrativeShowcase',
      frame: 45,
      category: 'audio',
      durationMs: 5200,
      generatedHash: 'd8f1e2778dbc66e9a29c74643d3468143bbd62eb5ee203a386fb46d4c89d651a',
      goldenHash: 'd8f1e2778dbc66e9a29c74643d3468143bbd62eb5ee203a386fb46d4c89d651a',
      status: 'PASS',
      latencyStatus: 'WARN',
      maxRenderTimeMs: 5000,
    },
  ];

  const mockReport: BenchmarkReport = {
    timestamp: '2026-10-17T19:50:00.000Z',
    nodeVersion: 'v22.13.0',
    totalBenchmarks: 2,
    passedCount: 2,
    failedCount: 0,
    warnCount: 1,
    totalDurationMs: 5950,
    averageRenderTimeMs: 2975,
    results: mockResults,
  };

  const md = formatBenchmarkMarkdown(mockReport);
  assert.ok(md.includes('# PeerPro Benchmark & Visual Regression Report'));
  assert.ok(md.includes('`2/2 PASSED`'));
  assert.ok(md.includes('B1_CHARACTER'));
  assert.ok(md.includes('B10_AUDIO'));
  assert.ok(md.includes('⚡ PASS'));
  assert.ok(md.includes('⚠️ WARN'));
  assert.ok(md.includes('✅ PASS'));
  assert.ok(md.includes('8545fadf86eb'));
});
