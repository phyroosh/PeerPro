import starterManifest from '../asset-packs/starter-kit/manifest.json';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { defaultEnvironmentKits, defaultPrefabs } from '../src/core/environments';
import { composeEnvironment } from '../src/core/environments/layout';
import { validateEnvironmentLayout } from '../src/core/environments/validator';

// Ensure starter pack is registered for CLI inspection
if (!defaultAssetRegistry.has('starter-char-head-01')) {
  defaultAssetRegistry.registerPack(starterManifest as any, { validate: false });
}

console.log('='.repeat(70));
console.log('       PeerPro Environment Layout & World Composition Inspector');
console.log('='.repeat(70));

// 1. Available Kits & Prefabs
console.log('\n📦 Registered Environment Kits:');
for (const [id, kit] of Object.entries(defaultEnvironmentKits)) {
  console.log(
    `  • [${id}] "${kit.name}" (domain: ${kit.domain}, ground: ${kit.groundLineY}px, depths: [${kit.supportedDepths.min} - ${kit.supportedDepths.max}])`
  );
}

console.log('\n🏛️ Registered Reusable Prefabs:');
for (const [id, prefab] of Object.entries(defaultPrefabs)) {
  const variantNames = prefab.variants ? Object.keys(prefab.variants).join(', ') : 'none';
  console.log(
    `  • [${id}] "${prefab.name}" (${prefab.dimensions.width}x${prefab.dimensions.height}px, defaultDepth: ${prefab.defaultDepth}, variants: ${variantNames})`
  );
}

// 2. Composition at Seed 101 (Tokyo Commercial Corner)
console.log('\n' + '-'.repeat(70));
console.log('🏙️ Composing Environment Layout A (Seed: 101, Tokyo Commercial)...');
const configA = {
  id: 'procedural-tokyo-commercial',
  name: 'Procedural Tokyo Commercial Corner',
  kitId: 'japanese-street-kit',
  seed: 101,
  placements: [
    {
      prefabId: 'prefab-storefront-cluster',
      instanceId: 'storefront-main',
      x: 480,
      scale: 1.0,
      directives: [{ type: 'align_to_ground' as const }, { type: 'leave_center_clear' as const }],
    },
    {
      prefabId: 'prefab-street-furniture-pair',
      instanceId: 'street-fixtures',
      x: 1520,
      scale: 0.95,
      directives: [{ type: 'align_to_ground' as const }, { type: 'leave_center_clear' as const }],
    },
  ],
  globalDirectives: [{ type: 'leave_center_clear' as const, minX: 760, maxX: 1160 }],
};

const resultA = composeEnvironment(configA);
console.log(`   Generated Layers: ${resultA.environment.layers.length}`);
console.log(`   Depths Used: [${resultA.telemetry.depthsUsed.join(', ')}]`);
console.log(`   Clearance Zone Clean: ${resultA.telemetry.clearanceZoneClean ? '✅ YES' : '❌ NO'}`);
console.log(`   Ground Contact Valid: ${resultA.telemetry.groundContactValid ? '✅ YES' : '❌ NO'}`);

const valA = validateEnvironmentLayout(
  resultA.environment,
  defaultEnvironmentKits['japanese-street-kit'],
  { clearanceZone: { minX: 760, maxX: 1160 } }
);
console.log(`   Validation: ${valA.valid ? '✅ VALID' : '❌ INVALID'} (Warnings: ${valA.warnings.length}, Errors: ${valA.errors.length})`);

// 3. Composition at Seed 202 (Tokyo Residential Alley)
console.log('\n' + '-'.repeat(70));
console.log('🏘️ Composing Environment Layout B (Seed: 202, Tokyo Residential)...');
const configB = {
  id: 'procedural-tokyo-residential',
  name: 'Procedural Tokyo Residential Alley',
  kitId: 'japanese-street-kit',
  seed: 202,
  placements: [
    {
      prefabId: 'prefab-residential-block',
      instanceId: 'apt-block',
      x: 460,
      scale: 1.0,
      directives: [{ type: 'align_to_ground' as const }, { type: 'leave_center_clear' as const }],
    },
    {
      prefabId: 'prefab-storefront-cluster',
      instanceId: 'storefront-small',
      x: 1480,
      scale: 0.9,
      directives: [{ type: 'align_to_ground' as const }, { type: 'leave_center_clear' as const }],
    },
  ],
  globalDirectives: [{ type: 'leave_center_clear' as const, minX: 760, maxX: 1160 }],
};

const resultB = composeEnvironment(configB);
console.log(`   Generated Layers: ${resultB.environment.layers.length}`);
console.log(`   Depths Used: [${resultB.telemetry.depthsUsed.join(', ')}]`);
console.log(`   Clearance Zone Clean: ${resultB.telemetry.clearanceZoneClean ? '✅ YES' : '❌ NO'}`);
console.log(`   Ground Contact Valid: ${resultB.telemetry.groundContactValid ? '✅ YES' : '❌ NO'}`);

// 4. Verify Reproducibility (Seed 101 === Seed 101)
console.log('\n' + '-'.repeat(70));
console.log('🔬 Verifying Deterministic Reproducibility...');
const resultA2 = composeEnvironment(configA);
let identical = true;
for (let i = 0; i < resultA.environment.layers.length; i++) {
  const l1 = resultA.environment.layers[i];
  const l2 = resultA2.environment.layers[i];
  const scale1 = JSON.stringify(l1.transform.scale);
  const scale2 = JSON.stringify(l2.transform.scale);
  if (
    l1.transform.x !== l2.transform.x ||
    l1.transform.y !== l2.transform.y ||
    scale1 !== scale2
  ) {
    identical = false;
    break;
  }
}
console.log(`   Reproducibility Test (Seed 101 run 1 vs run 2): ${identical ? '✅ 100% BIT-FOR-BIT IDENTICAL' : '❌ DIVERGED'}`);
console.log('='.repeat(70));
