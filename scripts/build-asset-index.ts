import fs from 'fs';
import path from 'path';
import { AssetPackManifest } from '../src/core/assets/types';

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const assetPacksDir = path.join(projectRoot, 'asset-packs');
  const outputJsonPath = path.join(projectRoot, 'schemas', 'asset-index.json');
  const outputMdPath = path.join(projectRoot, 'docs', 'asset-index.md');

  console.log('=== Building PeerPro Asset Index ===');

  const packDirs = fs.readdirSync(assetPacksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const allAssets: any[] = [];
  const categoriesMap: Record<string, string[]> = {};
  const tagsMap: Record<string, string[]> = {};

  for (const packDir of packDirs) {
    const manifestPath = path.join(assetPacksDir, packDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    const pack: AssetPackManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const asset of pack.assets) {
      allAssets.push({
        ...asset,
        packId: pack.packId,
      });

      if (!categoriesMap[asset.category]) {
        categoriesMap[asset.category] = [];
      }
      categoriesMap[asset.category].push(asset.id);

      for (const tag of asset.tags) {
        if (!tagsMap[tag]) {
          tagsMap[tag] = [];
        }
        tagsMap[tag].push(asset.id);
      }
    }
  }

  // 1. Output machine-readable JSON
  const indexData = {
    generatedAt: new Date().toISOString(),
    totalAssets: allAssets.length,
    categories: categoriesMap,
    tags: tagsMap,
    assets: allAssets,
  };
  fs.writeFileSync(outputJsonPath, JSON.stringify(indexData, null, 2), 'utf8');
  console.log(`Wrote JSON index: ${outputJsonPath}`);

  // 2. Output human- & agent-readable Markdown
  let md = `# PeerPro Asset Index\n\n`;
  md += `> Automatically generated index of all available modular assets in PeerPro.\n`;
  md += `> Total Assets: **${allAssets.length}** | Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

  md += `## Quick Category Navigation\n\n`;
  for (const [cat, ids] of Object.entries(categoriesMap)) {
    md += `- [${cat} (${ids.length})](#category-${cat.toLowerCase().replace(/_/g, '-')})\n`;
  }
  md += `\n---\n\n`;

  for (const [category, ids] of Object.entries(categoriesMap)) {
    md += `### Category: \`${category}\`\n\n`;
    md += `| ID | Name | Format | Dimensions | Anchor | Sockets | Tags | License |\n`;
    md += `|---|---|---|---|---|---|---|---|\n`;

    for (const id of ids) {
      const asset = allAssets.find((a) => a.id === id);
      const sockets = asset.attachmentSockets ? Object.keys(asset.attachmentSockets).join(', ') : 'none';
      const anchor = `(${asset.anchor.x}, ${asset.anchor.y})`;
      const dims = `${asset.dimensions.width}x${asset.dimensions.height}`;
      const tags = asset.tags.join(', ');
      md += `| \`${asset.id}\` | ${asset.name} | \`${asset.format}\` | ${dims} | ${anchor} | ${sockets} | ${tags} | ${asset.provenance.license} |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(outputMdPath, md, 'utf8');
  console.log(`Wrote Markdown index: ${outputMdPath}`);
  console.log('=== Index Build Complete ===');
}

main();
