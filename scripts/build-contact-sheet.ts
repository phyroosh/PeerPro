import fs from 'fs';
import path from 'path';
import { AssetPackManifest } from '../src/core/assets/types';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const assetPacksDir = path.join(projectRoot, 'asset-packs');
  const publicDir = path.join(projectRoot, 'public');
  const outDir = path.join(projectRoot, 'out');
  const contactSheetPath = path.join(outDir, 'contact-sheet.svg');

  console.log('=== Building PeerPro Contact Sheet ===');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const manifestPath = path.join(assetPacksDir, 'starter-kit', 'manifest.json');
  const pack: AssetPackManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const cardWidth = 360;
  const cardHeight = 280;
  const cols = 3;
  const padding = 30;
  const rows = Math.ceil(pack.assets.length / cols);

  const totalWidth = cols * cardWidth + (cols + 1) * padding;
  const totalHeight = 120 + rows * cardHeight + (rows + 1) * padding;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">\n`;
  svg += `  <style>\n`;
  svg += `    .bg { fill: #090d16; }\n`;
  svg += `    .card { fill: #1e293b; stroke: #334155; stroke-width: 2; rx: 12; }\n`;
  svg += `    .title { fill: #f8fafc; font-family: system-ui, sans-serif; font-size: 32px; font-weight: 800; }\n`;
  svg += `    .subtitle { fill: #94a3b8; font-family: system-ui, sans-serif; font-size: 16px; }\n`;
  svg += `    .card-title { fill: #f1f5f9; font-family: system-ui, monospace; font-size: 13px; font-weight: 700; }\n`;
  svg += `    .badge { fill: #0284c7; rx: 4; }\n`;
  svg += `    .badge-text { fill: #ffffff; font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; }\n`;
  svg += `    .meta { fill: #64748b; font-family: system-ui, sans-serif; font-size: 11px; }\n`;
  svg += `    .thumb-box { fill: #0f172a; stroke: #1e293b; stroke-width: 1.5; rx: 8; }\n`;
  svg += `  </style>\n\n`;

  svg += `  <rect width="100%" height="100%" class="bg" />\n\n`;
  svg += `  <text x="${padding}" y="55" class="title">PeerPro Asset Contact Sheet</text>\n`;
  svg += `  <text x="${padding}" y="85" class="subtitle">Pack: ${escapeXml(pack.name)} (${pack.packId}) • ${pack.assets.length} assets</text>\n\n`;

  for (let i = 0; i < pack.assets.length; i++) {
    const asset = pack.assets[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = padding + col * (cardWidth + padding);
    const y = 110 + padding + row * (cardHeight + padding);

    svg += `  <!-- Card: ${asset.id} -->\n`;
    svg += `  <g transform="translate(${x}, ${y})">\n`;
    svg += `    <rect width="${cardWidth}" height="${cardHeight}" class="card" />\n`;

    // Category badge
    svg += `    <rect x="16" y="16" width="90" height="20" class="badge" />\n`;
    svg += `    <text x="61" y="30" text-anchor="middle" class="badge-text">${escapeXml(asset.category)}</text>\n`;

    // ID Text
    svg += `    <text x="16" y="56" class="card-title">${escapeXml(asset.id)}</text>\n`;

    // Dimensions & Format
    svg += `    <text x="16" y="74" class="meta">${asset.dimensions.width}x${asset.dimensions.height} px • ${asset.format.toUpperCase()} • Anchor (${asset.anchor.x}, ${asset.anchor.y})</text>\n`;

    // Thumbnail container box
    const thumbBoxX = 16;
    const thumbBoxY = 88;
    const thumbBoxW = cardWidth - 32;
    const thumbBoxH = 176;

    svg += `    <rect x="${thumbBoxX}" y="${thumbBoxY}" width="${thumbBoxW}" height="${thumbBoxH}" class="thumb-box" />\n`;

    // Embed SVG thumbnail
    const assetFullPath = path.join(publicDir, asset.path);
    if (fs.existsSync(assetFullPath) && asset.format === 'svg') {
      let rawSvg = fs.readFileSync(assetFullPath, 'utf8');
      // Strip XML declaration if present
      rawSvg = rawSvg.replace(/<\?xml.*?\?>/i, '').trim();

      // Fit SVG inside thumbnail box while maintaining aspect ratio
      const scaleX = (thumbBoxW - 20) / asset.dimensions.width;
      const scaleY = (thumbBoxH - 20) / asset.dimensions.height;
      const scale = Math.min(scaleX, scaleY);

      const renderW = asset.dimensions.width * scale;
      const renderH = asset.dimensions.height * scale;
      const offsetX = thumbBoxX + (thumbBoxW - renderW) / 2;
      const offsetY = thumbBoxY + (thumbBoxH - renderH) / 2;

      svg += `    <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">\n`;
      svg += `      ${rawSvg}\n`;
      svg += `    </g>\n`;
    }

    svg += `  </g>\n\n`;
  }

  svg += `</svg>\n`;

  fs.writeFileSync(contactSheetPath, svg, 'utf8');
  console.log(`Wrote contact sheet: ${contactSheetPath}`);
}

main();
