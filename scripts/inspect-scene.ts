import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import { validateSceneManifest } from '../src/core/scene/validator';
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

if (!sceneArg) {
  console.error('Usage: npx tsx scripts/inspect-scene.ts <path-to-scene.json> [--json]');
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

if (isJsonMode) {
  console.log(
    JSON.stringify(
      {
        path: scenePath,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        manifest: validation.valid ? rawJson : undefined,
      },
      null,
      2
    )
  );
  process.exit(validation.valid ? 0 : 1);
}

if (!validation.valid) {
  console.error('===============================================================');
  console.error(`  Scene Manifest Validation FAILED: ${path.basename(scenePath)}`);
  console.error('===============================================================');
  validation.errors.forEach((err, idx) => {
    console.error(`[${idx + 1}] [${err.code}] ${err.field}: ${err.message}`);
    if (err.suggestion) {
      console.error(`    💡 Suggestion: ${err.suggestion}`);
    }
  });
  console.error('===============================================================');
  process.exit(1);
}

const scene = rawJson as SceneManifest;
const fps = scene.canvas?.fps ?? 30;
const duration = scene.canvas?.durationInFrames ?? 150;
const durationSec = (duration / fps).toFixed(2);

console.log('===============================================================');
console.log(`  Scene Inspection: ${scene.name} (${scene.id})`);
console.log('===============================================================');
console.log(`Description:  ${scene.description || 'None'}`);
console.log(`Canvas:       ${scene.canvas?.width || 1920}x${scene.canvas?.height || 1080} @ ${fps}fps (${duration} frames / ${durationSec}s)`);
console.log(`Camera:       Preset "${scene.camera?.preset || 'static'}" (intensity: ${scene.camera?.intensity ?? 1.0})`);
console.log(`Environment:  ${scene.environment?.preset ? `Preset "${scene.environment.preset}"` : 'Custom Layer Definition'}`);

console.log('\n--- Placed Characters ---');
if (!scene.characters || scene.characters.length === 0) {
  console.log('None');
} else {
  scene.characters.forEach((char) => {
    const exprCount = char.animation?.expressionSchedule?.length || 0;
    console.log(
      `- [${char.id}] (${char.characterId || 'custom'}) variant="${char.variant || 'default'}" depth=${char.depth ?? 1.0} pos=(${char.position.x}, ${char.position.y}) scale=${char.scale ?? 1.0} exprKeyframes=${exprCount}`
    );
  });
}

console.log('\n--- Atmospheric Effects ---');
if (!scene.effects || scene.effects.length === 0) {
  console.log('None');
} else {
  scene.effects.forEach((eff) => {
    console.log(`- Type: ${eff.type} (count=${eff.count || 'default'}, depth=${eff.depth ?? 1.3}, opacity=${eff.opacity ?? 'default'})`);
  });
}

console.log('\n--- Dialog Timeline ---');
if (!scene.dialog || scene.dialog.length === 0) {
  console.log('None');
} else {
  scene.dialog.forEach((d) => {
    console.log(`- [Frames ${d.startFrame}-${d.endFrame}] ${d.speaker ? `${d.speaker}: ` : ''}"${d.text}"`);
  });
}

if (validation.warnings.length > 0) {
  console.log('\n--- Warnings ---');
  validation.warnings.forEach((w) => console.log(`⚠️  ${w}`));
}

console.log('===============================================================');
console.log('Status: Scene is valid and ready to render!');
console.log('===============================================================');
