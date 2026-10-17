import fs from 'fs';
import path from 'path';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';
import { defaultCharacterPresets } from '../src/core/characters/presets';
import { defaultEnvironmentPresets } from '../src/core/environments/presets';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

const isJsonMode = process.argv.includes('--json');

const discoveryData = {
  version: '1.0.0',
  description: 'PeerPro AI-Agent Scene Composition Capabilities & Registry Introspection',
  assets: {
    total: defaultAssetRegistry.getAll().length,
    categories: defaultAssetRegistry.getCategories(),
    tags: defaultAssetRegistry.getTags(),
    list: defaultAssetRegistry.getAll().map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      category: a.category,
      angle: a.style.angle || 'front',
      styleFamily: a.style.family,
      dimensions: a.dimensions,
      attachmentSockets: a.attachmentSockets ? Object.keys(a.attachmentSockets) : [],
      requiredSockets: a.requiredSockets || [],
      capabilities: a.capabilities || [],
    })),
  },
  characters: {
    presets: Object.entries(defaultCharacterPresets).map(([key, def]) => {
      const rootAsset = defaultAssetRegistry.has(def.rootPart.assetId)
        ? defaultAssetRegistry.get(def.rootPart.assetId)
        : null;
      return {
        id: key,
        name: def.name,
        styleFamily: def.styleFamily,
        angle: rootAsset?.style.angle || 'front',
        slots: Object.keys(def.slots),
        variants: def.variants ? ['default', ...Object.keys(def.variants)] : ['default'],
      };
    }),
  },
  environments: {
    presets: Object.entries(defaultEnvironmentPresets).map(([key, def]) => ({
      id: key,
      name: def.name,
      description: def.description,
      layers: def.layers.map((l) => ({
        id: l.id,
        name: l.name,
        depth: l.depth,
        order: l.order,
        assetId: l.assetId,
        hasChildren: !!(l.children && l.children.length > 0),
      })),
    })),
  },
  camera: {
    presets: [
      { name: 'static', description: 'Fixed stationary viewport' },
      { name: 'slow-push-in', description: 'Gentle smooth zoom in' },
      { name: 'slow-pull-out', description: 'Gentle smooth zoom out' },
      { name: 'pan-left-to-right', description: 'Cinematic horizontal pan left to right' },
      { name: 'pan-right-to-left', description: 'Cinematic horizontal pan right to left' },
      { name: 'tilt-up', description: 'Vertical tilt from ground upward' },
      { name: 'tilt-down', description: 'Vertical tilt from sky downward' },
      { name: 'tracking', description: 'Dynamic compound camera tracking' },
      { name: 'custom', description: 'Custom frame-by-frame procedural movement' },
    ],
    defaultFocalDepth: 1.0,
    safetyLimits: {
      maxDisplacementX: 150,
      maxDisplacementY: 80,
      minZoom: 0.9,
      maxZoom: 1.25,
    },
  },
  effects: {
    types: [
      {
        type: 'petals',
        description: 'Deterministic floating sakura cherry blossom petals with 2.5D parallax tracking',
        parameters: ['count (number)', 'depth (number)', 'color (hex)', 'seed (number)', 'opacity (number)'],
      },
      {
        type: 'rain',
        description: 'Directional falling rain streaks with parallax tracking',
        parameters: ['count (number)', 'speed (number)', 'angle (degrees)', 'depth (number)', 'opacity (number)'],
      },
    ],
  },
  sceneManifestTemplate: {
    $schema: '../schemas/scene-definition.schema.json',
    id: 'custom-scene-id',
    name: 'Descriptive Scene Name',
    canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 120 },
    camera: { preset: 'pan-left-to-right', intensity: 1.0 },
    environment: { preset: 'japanese-street-corner' },
    characters: [
      {
        id: 'hero',
        characterId: 'student-ren',
        variant: 'default',
        position: { x: 960, y: 920 },
        animation: {
          breathing: { frequency: 0.5, amplitude: 3.5 },
          expressionSchedule: [
            { startFrame: 0, eyes: 'starter-char-eyes-neutral', mouth: 'starter-char-mouth-closed' },
            { startFrame: 45, eyes: 'starter-char-eyes-wink', mouth: 'starter-char-mouth-smile' },
          ],
        },
      },
    ],
    effects: [{ type: 'petals', count: 30, depth: 1.3 }],
    dialog: [
      { id: 'd1', speaker: 'Ren', text: 'Hello, world!', startFrame: 15, endFrame: 75 },
    ],
  },
};

if (isJsonMode) {
  console.log(JSON.stringify(discoveryData, null, 2));
} else {
  console.log('===============================================================');
  console.log('  PeerPro AI-Agent Scene Capabilities & Registry Introspection');
  console.log('===============================================================');
  console.log(`Assets Total:        ${discoveryData.assets.total} vector assets`);
  console.log(`Asset Categories:    ${discoveryData.assets.categories.join(', ')}`);
  console.log(`Character Presets:   ${discoveryData.characters.presets.map((c) => `${c.id} (${c.variants.join('/')})`).join(', ')}`);
  console.log(`Environment Presets: ${discoveryData.environments.presets.map((e) => e.id).join(', ')}`);
  console.log(`Camera Presets:      ${discoveryData.camera.presets.map((c) => c.name).join(', ')}`);
  console.log(`Atmospheric Effects: ${discoveryData.effects.types.map((e) => e.type).join(', ')}`);
  console.log('---------------------------------------------------------------');
  console.log('Run with --json to get full machine-readable schema & metadata.');
  console.log('===============================================================');
}
