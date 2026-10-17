import { execSync } from 'child_process';
import path from 'path';
import { ReleaseGateCheck, ReleaseGateReport } from '../src/core/benchmark/types';

const projectRoot = path.resolve(__dirname, '..');

const gates: { id: string; name: string; command: string }[] = [
  {
    id: 'GATE_1_TYPECHECK',
    name: 'TypeScript Zero-Error Compilation',
    command: 'npm run build',
  },
  {
    id: 'GATE_2_UNIT_TESTS',
    name: 'Full Unit Test Suite',
    command: 'npx tsx --test tests/unit/**/*.test.ts',
  },
  {
    id: 'GATE_3_ASSET_INTEGRITY',
    name: 'Asset Catalog & Geometry Contracts',
    command: 'npm run assets:validate',
  },
  {
    id: 'GATE_4_CONTACT_SHEET',
    name: 'Visual Asset Contact Sheet Generation',
    command: 'npm run assets:contact-sheet',
  },
  {
    id: 'GATE_5_AGENT_DISCOVERY',
    name: 'AI Agent Introspection & Capabilities',
    command: 'npx tsx scripts/agent-discover.ts',
  },
  {
    id: 'GATE_6_SCENE_ANALYSIS',
    name: 'AI Composition Analysis & Quality Metrics',
    command: 'npx tsx scripts/analyze-scene.ts scenes/agent-dialog-scene.json',
  },
  {
    id: 'GATE_7_BENCHMARK_REGRESSION',
    name: '10-Benchmark Suite & Visual Regression',
    command: 'npm run benchmark',
  },
];

const isJsonMode = process.argv.includes('--json');

if (!isJsonMode) {
  console.log('===============================================================');
  console.log('              PeerPro Pre-Release Gatekeeper                   ');
  console.log('===============================================================');
  console.log('Enforcing 7 mandatory release gates for production readiness...');
  console.log('---------------------------------------------------------------');
}

const startTime = Date.now();
const results: ReleaseGateCheck[] = [];
let allPassed = true;

for (let i = 0; i < gates.length; i++) {
  const gate = gates[i];
  const gateStart = Date.now();

  if (!isJsonMode) {
    process.stdout.write(`[Gate ${i + 1}/${gates.length}] ${gate.name.padEnd(46, '.')} `);
  }

  try {
    const output = execSync(gate.command, {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    const durationMs = Date.now() - gateStart;

    results.push({
      id: gate.id,
      name: gate.name,
      command: gate.command,
      status: 'PASS',
      durationMs,
      output,
    });

    if (!isJsonMode) {
      console.log(`✅ PASS (${durationMs}ms)`);
    }
  } catch (err: any) {
    const durationMs = Date.now() - gateStart;
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const errorDetails = stderr || stdout || err.message;

    results.push({
      id: gate.id,
      name: gate.name,
      command: gate.command,
      status: 'FAIL',
      durationMs,
      error: errorDetails,
    });

    allPassed = false;

    if (!isJsonMode) {
      console.log(`❌ FAIL (${durationMs}ms)`);
      console.error(`\n🚨 Release Gate Failed: [${gate.id}] ${gate.name}`);
      console.error('Command executed:', gate.command);
      console.error('---------------------------------------------------------------');
      console.error(errorDetails);
      console.error('===============================================================');
      console.error('Release ABORTED. Fix the issue above before creating a release.');
      process.exit(1);
    }
    break;
  }
}

const totalDurationMs = Date.now() - startTime;
const passedCount = results.filter((r) => r.status === 'PASS').length;

const report: ReleaseGateReport = {
  timestamp: new Date().toISOString(),
  passed: allPassed,
  totalDurationMs,
  passedCount,
  totalCount: gates.length,
  gates: results,
};

if (isJsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(allPassed ? 0 : 1);
}

console.log('===============================================================');
console.log(`🎉 ALL ${passedCount}/${gates.length} PRE-RELEASE GATES PASSED in ${(totalDurationMs / 1000).toFixed(2)}s!`);
console.log('   PeerPro is verified frame-deterministic and release-ready.');
console.log('===============================================================');
process.exit(0);
