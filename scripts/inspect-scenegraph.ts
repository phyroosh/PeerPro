import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import {
  compileSceneGraphToManifest,
  formatSceneGraphReport,
  solveSceneGraph,
  SceneGraphDefinition,
} from '../src/core/scenegraph';
import { validateSceneManifest } from '../src/core/scene/validator';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is registered
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

function parseArgs(): {
  inputPath?: string;
  compilePath?: string;
  isJson: boolean;
} {
  const args = process.argv.slice(2);
  let inputPath: string | undefined;
  let compilePath: string | undefined;
  let isJson = false;

  for (const arg of args) {
    if (arg === '--json') {
      isJson = true;
    } else if (arg.startsWith('--compile=')) {
      compilePath = arg.split('=')[1];
    } else if (!arg.startsWith('--') && !inputPath) {
      inputPath = arg;
    }
  }

  return { inputPath, compilePath, isJson };
}

function main() {
  const { inputPath, compilePath, isJson } = parseArgs();

  if (!inputPath) {
    console.error('Usage: npx tsx scripts/inspect-scenegraph.ts <path-to-scenegraph.json> [--compile=<output-scene.json>] [--json]');
    process.exit(1);
  }

  const resolvedInput = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`Error: Scene graph file not found: ${resolvedInput}`);
    process.exit(1);
  }

  let sceneGraph: SceneGraphDefinition;
  try {
    sceneGraph = JSON.parse(fs.readFileSync(resolvedInput, 'utf8'));
  } catch (err: any) {
    console.error(`Error parsing JSON in ${resolvedInput}: ${err.message}`);
    process.exit(1);
  }

  const report = solveSceneGraph(sceneGraph, { registry: defaultAssetRegistry });

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatSceneGraphReport(report));
  }

  if (compilePath) {
    if (!report.valid) {
      console.error('\n❌ Cannot compile scene graph: conflicts or cycles detected.');
      process.exit(1);
    }

    try {
      const manifest = compileSceneGraphToManifest(sceneGraph, { registry: defaultAssetRegistry });
      const validation = validateSceneManifest(manifest, { registry: defaultAssetRegistry });

      if (!validation.valid) {
        console.error('\n❌ Compiled scene manifest failed schema validation:');
        for (const err of validation.errors) {
          console.error(`  - [${err.code}] ${err.field}: ${err.message}`);
        }
        process.exit(1);
      }

      const resolvedCompilePath = path.resolve(process.cwd(), compilePath);
      fs.mkdirSync(path.dirname(resolvedCompilePath), { recursive: true });
      fs.writeFileSync(resolvedCompilePath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`\n✅ Successfully compiled SceneGraph to SceneManifest: ${resolvedCompilePath}`);
    } catch (err: any) {
      console.error(`\n❌ Compilation failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (!report.valid) {
    process.exit(1);
  }
}

main();
