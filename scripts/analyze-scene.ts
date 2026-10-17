import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import { validateSceneManifest } from '../src/core/scene/validator';
import { analyzeSceneComposition } from '../src/core/agent/analyzer';
import { SceneManifest } from '../src/core/scene/types';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

const args = process.argv.slice(2);
const sceneArg = args.find((a) => !a.startsWith('--'));
const isJsonMode = args.includes('--json');
const letterboxIdx = args.indexOf('--letterbox');
const letterbox = letterboxIdx !== -1 && args[letterboxIdx + 1] ? (args[letterboxIdx + 1] as any) : undefined;

if (!sceneArg) {
  console.error('Usage: npx tsx scripts/analyze-scene.ts <path-to-scene.json> [--json] [--letterbox cinemascope]');
  process.exit(1);
}

const scenePath = path.resolve(process.cwd(), sceneArg);
if (!fs.existsSync(scenePath)) {
  console.error(`Error: Scene file not found: ${scenePath}`);
  process.exit(1);
}

let rawJson: any;
try {
  rawJson = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
} catch (e: any) {
  console.error(`Error parsing JSON in ${scenePath}: ${e.message}`);
  process.exit(1);
}

const validation = validateSceneManifest(rawJson);
if (!validation.valid) {
  console.error('===============================================================');
  console.error(`  Scene Manifest Schema Validation FAILED: ${path.basename(scenePath)}`);
  console.error('===============================================================');
  validation.errors.forEach((err, idx) => {
    console.error(`[${idx + 1}] [${err.code}] ${err.field}: ${err.message}`);
  });
  process.exit(1);
}

const manifest = rawJson as SceneManifest;
const report = analyzeSceneComposition(manifest, {
  registry: defaultAssetRegistry,
  letterbox: letterbox ?? (manifest.camera as any)?.letterbox ?? 'none',
});

if (isJsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

console.log('===============================================================');
console.log(`  PeerPro AI Visual Feedback & Composition Analyzer`);
console.log('===============================================================');
console.log(`Scene:        ${manifest.name} (${manifest.id})`);
const badge = report.passed ? '✅ PASSED' : '❌ FAILED / NEEDS REVISION';
console.log(`Score:        [${report.overallScore} / 100] ${badge}`);
console.log('---------------------------------------------------------------');
console.log('Composition Category Breakdown:');
console.log(`  - Headroom:      ${report.scoreBreakdown.headroom.toString().padStart(3)} / 100`);
console.log(`  - Grounding:     ${report.scoreBreakdown.grounding.toString().padStart(3)} / 100`);
console.log(`  - Depth & Focus: ${report.scoreBreakdown.depthFocus.toString().padStart(3)} / 100`);
console.log(`  - Framing:       ${report.scoreBreakdown.framing.toString().padStart(3)} / 100`);
console.log(`  - Safe Zones:    ${report.scoreBreakdown.safeZones.toString().padStart(3)} / 100`);
console.log('---------------------------------------------------------------');
console.log('Character Viewport Bounds:');
report.characterBounds.forEach((b) => {
  console.log(`  - [${b.characterId}] pos=(${b.x}, ${b.y}) headY=${Math.round(b.headY)} feetY=${Math.round(b.feetY)} headroom=${(b.headroomRatio * 100).toFixed(1)}%`);
});

if (report.issues.length > 0) {
  console.log('---------------------------------------------------------------');
  console.log(`Detected Composition Issues (${report.issues.length}):`);
  report.issues.forEach((issue, idx) => {
    const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
    console.log(`  [${idx + 1}] ${icon} [${issue.code}] (${issue.category}): ${issue.message}`);
    if (issue.remediation) {
      console.log(`      💡 Recommended Action: ${issue.remediation.description}`);
    }
  });
}

if (report.recommendations.length > 0) {
  console.log('---------------------------------------------------------------');
  console.log('Actionable Recommendations:');
  report.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec}`);
  });
}
console.log('===============================================================');

process.exit(report.passed ? 0 : 1);
