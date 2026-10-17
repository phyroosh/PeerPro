import fs from 'fs';
import path from 'path';
import { validateAssetPackManifest } from '../src/core/assets/validator';

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const assetPacksDir = path.join(projectRoot, 'asset-packs');
  const publicDir = path.join(projectRoot, 'public');

  console.log('=== PeerPro Asset Validator ===');
  console.log(`Scanning: ${assetPacksDir}`);
  console.log(`Asset Root: ${publicDir}\n`);

  if (!fs.existsSync(assetPacksDir)) {
    console.error(`Asset packs directory does not exist: ${assetPacksDir}`);
    process.exit(1);
  }

  const packDirs = fs.readdirSync(assetPacksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  let totalPacks = 0;
  let totalAssets = 0;
  let hasErrors = false;

  for (const packDir of packDirs) {
    const manifestPath = path.join(assetPacksDir, packDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`[WARN] No manifest.json found in ${packDir}`);
      continue;
    }

    totalPacks++;
    console.log(`Checking pack: ${packDir} (${manifestPath})`);

    let rawData: unknown;
    try {
      rawData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      console.error(`[ERROR] Failed to parse JSON in ${manifestPath}:`, err);
      hasErrors = true;
      continue;
    }

    const result = validateAssetPackManifest(rawData, {
      assetRootDirectory: publicDir,
      fileExists: (relPath) => fs.existsSync(path.resolve(publicDir, relPath)),
    });

    if (result.valid) {
      const assetCount = (rawData as { assets?: unknown[] }).assets?.length || 0;
      totalAssets += assetCount;
      console.log(`  ✓ PASS: ${assetCount} assets verified.`);
    } else {
      hasErrors = true;
      console.error(`  ✗ FAIL: ${result.errors.length} validation errors:`);
      for (const err of result.errors) {
        console.error(`    - [${err.code}] ${err.path}: ${err.message}`);
      }
    }

    if (result.warnings.length > 0) {
      console.warn(`  ! WARNINGS:`);
      for (const warn of result.warnings) {
        console.warn(`    - [${warn.code}] ${warn.path}: ${warn.message}`);
      }
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Summary: ${totalPacks} packs inspected, ${totalAssets} assets checked.`);

  if (hasErrors) {
    console.error('RESULT: VALIDATION FAILED.');
    process.exit(1);
  } else {
    console.log('RESULT: ALL ASSET PACKS VALID.');
    process.exit(0);
  }
}

main();
