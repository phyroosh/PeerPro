import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
const sceneArg = args[0];
const outArg = args[1];

if (!sceneArg || !outArg) {
  console.error('Usage: npx tsx scripts/render-scene.ts <path-to-scene.json> <output-path> [--still] [--frame <num>] [--video]');
  process.exit(1);
}

const scenePath = path.resolve(process.cwd(), sceneArg);
if (!fs.existsSync(scenePath)) {
  console.error(`Error: Scene file not found: ${scenePath}`);
  process.exit(1);
}

const outPath = path.resolve(process.cwd(), outArg);
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let rawJson: any;
try {
  rawJson = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
} catch (e: any) {
  console.error(`Error parsing JSON: ${e.message}`);
  process.exit(1);
}

const validation = validateSceneManifest(rawJson);
if (!validation.valid) {
  console.error('Validation failed for scene manifest:');
  validation.errors.forEach((err) => console.error(`- [${err.code}] ${err.field}: ${err.message}`));
  process.exit(1);
}

const scene = rawJson as SceneManifest;
const isVideo = args.includes('--video') || outPath.endsWith('.mp4');
const frameArgIdx = args.indexOf('--frame');
const frameNum = frameArgIdx !== -1 && args[frameArgIdx + 1] ? parseInt(args[frameArgIdx + 1], 10) : 45;

const cacheDir = path.join(projectRoot, '.cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
const tempPropsPath = path.join(cacheDir, `render-props-${scene.id}.json`);
fs.writeFileSync(tempPropsPath, JSON.stringify({ manifest: scene }, null, 2), 'utf8');

console.log(`Rendering scene "${scene.id}" -> ${outPath}`);
try {
  if (isVideo) {
    const cmd = `npx remotion render AgentScene "${outPath}" --props="${tempPropsPath}"`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
  } else {
    const cmd = `npx remotion still AgentScene "${outPath}" --frame=${frameNum} --props="${tempPropsPath}"`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
  }
  console.log(`✅ Render completed successfully: ${outPath}`);
} catch (e: any) {
  console.error(`Render failed: ${e.message}`);
  process.exit(1);
}
