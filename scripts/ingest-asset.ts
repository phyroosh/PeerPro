import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ingestAsset } from '../src/core/foundry/pipeline';
import { AssetIngestionCandidate } from '../src/core/foundry/types';

function parseArgs(): {
  configPath?: string;
  dryRun: boolean;
  reindex: boolean;
  manualCandidate?: Partial<AssetIngestionCandidate>;
} {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let dryRun = false;
  let reindex = true;
  const manual: Partial<AssetIngestionCandidate> = {};

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--no-reindex') {
      reindex = false;
    } else if (arg.startsWith('--config=')) {
      configPath = arg.split('=')[1];
    } else if (arg.startsWith('--id=')) {
      manual.targetId = arg.split('=')[1];
    } else if (arg.startsWith('--name=')) {
      manual.name = arg.split('=')[1];
    } else if (arg.startsWith('--kind=')) {
      manual.kind = arg.split('=')[1] as any;
    } else if (arg.startsWith('--category=')) {
      manual.category = arg.split('=')[1] as any;
    } else if (arg.startsWith('--pack=')) {
      manual.targetPackId = arg.split('=')[1];
    } else if (arg.startsWith('--tags=')) {
      manual.tags = arg.split('=')[1].split(',').map((t) => t.trim());
    } else if (arg.startsWith('--author=')) {
      manual.provenance = {
        source: 'original',
        license: 'MIT',
        author: arg.split('=')[1],
      };
    } else if (!arg.startsWith('--') && !manual.sourcePath) {
      manual.sourcePath = arg;
    }
  }

  return { configPath, dryRun, reindex, manualCandidate: manual };
}

function main() {
  console.log('================================================================');
  console.log('  PeerPro Asset Foundry — Automated Pack Ingestion Pipeline    ');
  console.log('================================================================');

  const { configPath, dryRun, reindex, manualCandidate } = parseArgs();

  let candidate: AssetIngestionCandidate;

  if (configPath) {
    const resolvedConfig = path.resolve(process.cwd(), configPath);
    if (!fs.existsSync(resolvedConfig)) {
      console.error(`[ERROR] Candidate configuration not found: ${resolvedConfig}`);
      process.exit(1);
    }
    console.log(`Loading candidate config: ${resolvedConfig}`);
    const raw = JSON.parse(fs.readFileSync(resolvedConfig, 'utf8'));

    // Resolve sourcePath relative to config directory or cwd
    let sourcePath = raw.sourcePath;
    if (!path.isAbsolute(sourcePath)) {
      const configDir = path.dirname(resolvedConfig);
      const relativeToConfig = path.resolve(configDir, sourcePath);
      const relativeToCwd = path.resolve(process.cwd(), sourcePath);
      sourcePath = fs.existsSync(relativeToConfig) ? relativeToConfig : relativeToCwd;
    }

    candidate = {
      ...raw,
      sourcePath,
    };
  } else if (manualCandidate && manualCandidate.sourcePath && manualCandidate.targetId) {
    candidate = {
      sourcePath: path.resolve(process.cwd(), manualCandidate.sourcePath),
      targetId: manualCandidate.targetId,
      name: manualCandidate.name || manualCandidate.targetId,
      kind: manualCandidate.kind || 'prop',
      category: manualCandidate.category || 'prop',
      tags: manualCandidate.tags || ['prop'],
      provenance: manualCandidate.provenance || {
        source: 'original',
        license: 'MIT',
        author: 'PeerPro Team',
      },
      targetPackId: manualCandidate.targetPackId || 'starter-kit',
    };
  } else {
    console.error('Usage:');
    console.error('  npx tsx scripts/ingest-asset.ts --config=<path-to-candidate.json> [--dry-run] [--no-reindex]');
    console.error('  npx tsx scripts/ingest-asset.ts <source-path> --id=<assetId> --name="Name" --kind=prop --category=prop');
    process.exit(1);
  }

  console.log(`\nCandidate:`);
  console.log(`  Target ID:   ${candidate.targetId}`);
  console.log(`  Name:        ${candidate.name}`);
  console.log(`  Source:      ${candidate.sourcePath}`);
  console.log(`  Pack:        ${candidate.targetPackId || 'starter-kit'}`);
  console.log(`  Kind/Cat:    ${candidate.kind} / ${candidate.category}`);
  console.log(`  Mode:        ${dryRun ? 'DRY RUN (no files modified)' : 'LIVE INGESTION'}`);
  console.log('----------------------------------------------------------------');

  const result = ingestAsset(candidate, { dryRun });

  if (!result.success) {
    console.error('\n❌ Ingestion FAILED:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    if (result.warnings.length > 0) {
      console.warn('\nWarnings:');
      for (const w of result.warnings) {
        console.warn(`  - ${w}`);
      }
    }
    process.exit(1);
  }

  console.log('\n✓ 6-Stage Lifecycle Completed Successfully:');
  console.log('  1. candidate:            Validated format & configuration');
  console.log('  2. inspected:            File readable, viewBox extracted, alpha confirmed, sanitized');
  console.log('  3. normalized:           Namespace standardized, DOCTYPE/comments stripped');
  console.log('  4. metadata_complete:    Sockets, anchors, capabilities, and provenance assembled');
  console.log('  5. compatibility_tested: Manifest schema and coordinate bounds validated');
  console.log(`  6. approved:             ${dryRun ? 'Simulated approval' : 'Committed to pack & public storage'}`);

  if (result.warnings.length > 0) {
    console.log('\nPipeline Warnings:');
    for (const w of result.warnings) {
      console.log(`  ⚠ ${w}`);
    }
  }

  const receipt = result.receipt!;
  console.log('\nIngestion Receipt Summary:');
  console.log(`  Asset ID:     ${receipt.assetId}`);
  console.log(`  Pack ID:      ${receipt.packId}`);
  console.log(`  Public Path:  ${receipt.publicRelativePath}`);
  console.log(`  Target File:  ${receipt.targetPath}`);
  console.log(`  Dimensions:   ${receipt.manifestEntry.dimensions.width}x${receipt.manifestEntry.dimensions.height}`);
  console.log(`  Timestamp:    ${receipt.timestamp}`);

  if (!dryRun && reindex) {
    console.log('\n----------------------------------------------------------------');
    console.log('Rebuilding asset index and contact sheet...');
    try {
      execSync('npx tsx scripts/build-asset-index.ts', { stdio: 'inherit' });
      execSync('npx tsx scripts/build-contact-sheet.ts', { stdio: 'inherit' });
    } catch (err: any) {
      console.warn(`Warning: failed to rebuild index: ${err.message}`);
    }
  }

  console.log('================================================================');
  console.log('  Ingestion Process Complete! ✨                                ');
  console.log('================================================================');
}

main();
