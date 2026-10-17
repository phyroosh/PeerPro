import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import { validateSceneManifest } from '../src/core/scene/validator';
import { autoCorrectScene } from '../src/core/agent/corrector';
import { SceneManifest } from '../src/core/scene/types';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

const args = process.argv.slice(2);
const positionalArgs = args.filter((a) => !a.startsWith('--'));
const isJsonMode = args.includes('--json');
const letterboxIdx = args.indexOf('--letterbox');
const letterbox = letterboxIdx !== -1 && args[letterboxIdx + 1] ? (args[letterboxIdx + 1] as any) : undefined;

if (positionalArgs.length < 2) {
  console.error('Usage: npx tsx scripts/correct-scene.ts <input-scene.json> <output-scene.json> [--letterbox cinemascope] [--json]');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), positionalArgs[0]);
const outputPath = path.resolve(process.cwd(), positionalArgs[1]);

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input scene file not found: ${inputPath}`);
  process.exit(1);
}

let rawJson: any;
try {
  rawJson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e: any) {
  console.error(`Error parsing JSON in ${inputPath}: ${e.message}`);
  process.exit(1);
}

const validation = validateSceneManifest(rawJson);
if (!validation.valid) {
  console.error('===============================================================');
  console.error(`  Scene Manifest Schema Validation FAILED: ${path.basename(inputPath)}`);
  console.error('===============================================================');
  validation.errors.forEach((err, idx) => {
    console.error(`[${idx + 1}] [${err.code}] ${err.field}: ${err.message}`);
  });
  process.exit(1);
}

const manifest = rawJson as SceneManifest;
const result = autoCorrectScene(manifest, undefined, {
  registry: defaultAssetRegistry,
  letterbox: letterbox ?? (manifest.camera as any)?.letterbox ?? 'none',
});

// Write corrected manifest to target output path
fs.writeFileSync(outputPath, JSON.stringify(result.manifest, null, 2) + '\n', 'utf8');

if (isJsonMode) {
  console.log(
    JSON.stringify(
      {
        inputPath,
        outputPath,
        originalScore: result.originalScore,
        improvedScore: result.improvedScore,
        appliedRecipesCount: result.appliedRecipes.length,
        appliedRecipes: result.appliedRecipes,
        changeLog: result.changeLog,
      },
      null,
      2
    )
  );
  process.exit(0);
}

console.log('===============================================================');
console.log(`  PeerPro AI Scene Self-Correction Engine`);
console.log('===============================================================');
console.log(`Input Scene:  ${path.basename(inputPath)} (Score: ${result.originalScore}/100)`);
console.log(`Output Scene: ${path.basename(outputPath)} (Score: ${result.improvedScore}/100)`);
console.log(`Score Delta:  ${result.improvedScore >= result.originalScore ? '+' : ''}${result.improvedScore - result.originalScore} points`);
console.log('---------------------------------------------------------------');

if (result.changeLog.length === 0) {
  console.log('No modifications needed. Scene already satisfies composition constraints.');
} else {
  console.log(`Applied Self-Correction Recipes (${result.appliedRecipes.length}):`);
  result.changeLog.forEach((entry, idx) => {
    console.log(`  [${idx + 1}] ${entry}`);
  });
}

console.log('---------------------------------------------------------------');
console.log(`Saved corrected manifest to: ${outputPath}`);
console.log('===============================================================');
