import { execSync } from 'child_process';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');

interface Step {
  name: string;
  command: string;
}

const steps: Step[] = [
  { name: 'TypeScript Compilation Check', command: 'npm run build' },
  { name: 'Unit Test Suite', command: 'npx tsx --test tests/unit/**/*.test.ts' },
  { name: 'End-to-End Smoke & Determinism Suite', command: 'npx tsx --test tests/e2e/**/*.test.ts' },
  { name: 'Asset Catalog Validation', command: 'npm run assets:validate' },
  { name: 'Asset Index & Markdown Documentation', command: 'npm run assets:index' },
  { name: 'Visual Asset Contact Sheet Generation', command: 'npm run assets:contact-sheet' },
  { name: 'Scene Inspection (Tokyo Encounter)', command: 'npx tsx scripts/inspect-scene.ts scenes/agent-dialog-scene.json' },
  { name: 'Scene Inspection (Rainy Evening)', command: 'npx tsx scripts/inspect-scene.ts scenes/rainy-street-encounter.json' },
  { name: 'Agent Introspection CLI Check', command: 'npx tsx scripts/agent-discover.ts' },
  { name: '10-Benchmark Visual Regression Suite', command: 'npm run benchmark' },
];

console.log('===============================================================');
console.log('       PeerPro Full System Verification & Regression Suite     ');
console.log('===============================================================');

let passedCount = 0;
const startTime = Date.now();

for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  const stepStart = Date.now();
  process.stdout.write(`[${i + 1}/${steps.length}] ${step.name.padEnd(46, '.')}`);

  try {
    execSync(step.command, {
      cwd: projectRoot,
      stdio: 'pipe',
    });
    const elapsed = Date.now() - stepStart;
    console.log(` PASS (${elapsed}ms)`);
    passedCount++;
  } catch (err: any) {
    const elapsed = Date.now() - stepStart;
    console.log(` FAIL (${elapsed}ms)`);
    console.error(`\nError in step "${step.name}":\n`);
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
  }
}

const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('===============================================================');
console.log(`✅ All ${passedCount}/${steps.length} verification stages passed in ${totalElapsed}s!`);
console.log('===============================================================');
