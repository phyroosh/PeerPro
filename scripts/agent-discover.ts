import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import { getAgentDiscoveryData } from '../src/core/agent/discovery';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

const isJsonMode = process.argv.includes('--json');
const discoveryData = getAgentDiscoveryData({ registry: defaultAssetRegistry });

if (isJsonMode) {
  console.log(JSON.stringify(discoveryData, null, 2));
} else {
  console.log('===============================================================');
  console.log('  PeerPro AI-Agent Scene Capabilities & Registry Introspection');
  console.log('===============================================================');
  console.log(`Version:             v${discoveryData.version}`);
  console.log(`Assets Total:        ${discoveryData.assets.total} vector assets`);
  console.log(`Asset Categories:    ${discoveryData.assets.categories.join(', ')}`);
  console.log(`Character Presets:   ${discoveryData.characters.presets.map((c) => `${c.id} (${c.variants.join('/')})`).join(', ')}`);
  console.log(`Cutout Poses:        ${discoveryData.characters.poses.join(', ')}`);
  console.log(`Environment Presets: ${discoveryData.environments.presets.map((e) => e.id).join(', ')}`);
  console.log(`Action Vocabulary:   ${discoveryData.animation.actions.map((a) => a.name).join(', ')}`);
  console.log(`Camera Presets:      ${discoveryData.camera.presets.map((c) => c.name).join(', ')}`);
  console.log(`Optical DoF Bokeh:   Aperture ${discoveryData.camera.cinematography.depthOfField.minAperture} - ${discoveryData.camera.cinematography.depthOfField.maxAperture}, MaxBlur ${discoveryData.camera.cinematography.depthOfField.maxBlurCeiling}px`);
  console.log(`Transitions:         ${discoveryData.sequence.transitions.join(', ')}`);
  console.log(`Letterbox Formats:   ${discoveryData.sequence.letterbox.join(', ')}`);
  console.log(`Color Grades:        ${discoveryData.sequence.colorGrades.join(', ')}`);
  if (discoveryData.audio) {
    console.log(`Audio Channels:      ${discoveryData.audio.trackTypes.join(', ')} (Automated Ducking + Anime Viseme Lip-Sync)`);
  }
  console.log('---------------------------------------------------------------');
  console.log('Run with --json to get full machine-readable schema & metadata.');
  console.log('===============================================================');
}
