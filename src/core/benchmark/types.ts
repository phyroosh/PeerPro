export type BenchmarkCategory =
  | 'character'
  | 'environment'
  | 'parallax'
  | 'style'
  | 'rigging'
  | 'animation'
  | 'cinematography'
  | 'agent'
  | 'audio';

export type BenchmarkStatus = 'PASS' | 'FAIL' | 'NEW';
export type LatencyStatus = 'PASS' | 'WARN' | 'FAIL';

export interface BenchmarkEntry {
  id: string;
  name: string;
  compositionId: string;
  frame: number;
  category: BenchmarkCategory;
  description: string;
  maxRenderTimeMs: number;
  goldenSha256?: string;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  compositionId: string;
  frame: number;
  category: BenchmarkCategory;
  durationMs: number;
  generatedHash: string;
  goldenHash?: string;
  status: BenchmarkStatus;
  latencyStatus: LatencyStatus;
  maxRenderTimeMs: number;
  outputPath?: string;
  error?: string;
}

export interface BenchmarkSuiteOptions {
  updateBaselines?: boolean;
  outDir?: string;
  silent?: boolean;
  benchmarks?: string[];
}

export interface BenchmarkReport {
  timestamp: string;
  nodeVersion: string;
  totalBenchmarks: number;
  passedCount: number;
  failedCount: number;
  warnCount: number;
  totalDurationMs: number;
  averageRenderTimeMs: number;
  results: BenchmarkResult[];
}

export interface ReleaseGateCheck {
  id: string;
  name: string;
  command: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  output?: string;
  error?: string;
}

export interface ReleaseGateReport {
  timestamp: string;
  passed: boolean;
  totalDurationMs: number;
  passedCount: number;
  totalCount: number;
  gates: ReleaseGateCheck[];
}
