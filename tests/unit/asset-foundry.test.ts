import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import {
  inspectCandidate,
  normalizeSvg,
  normalizeCandidate,
  ingestAsset,
  AssetIngestionCandidate,
} from '../../src/core/foundry';

const projectRoot = path.resolve(__dirname, '../..');
const umbrellaSvgPath = path.join(projectRoot, 'candidates', 'props', 'starter-prop-umbrella.svg');

test('Foundry Inspector: validates a well-formed SVG candidate', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: umbrellaSvgPath,
    targetId: 'test-prop-umbrella-valid',
    name: 'Test Umbrella',
    kind: 'prop',
    category: 'prop',
    tags: ['umbrella', 'prop'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: 'Tester',
    },
    anchor: { x: 0.5, y: 0.9 },
    attachmentSockets: {
      grip: { x: 160, y: 280 },
    },
  };

  const report = inspectCandidate(candidate);
  assert.strictEqual(report.valid, true);
  assert.strictEqual(report.format, 'svg');
  assert.strictEqual(report.dimensions.width, 320);
  assert.strictEqual(report.dimensions.height, 320);
  assert.strictEqual(report.errors.length, 0);
  assert.ok(report.checks.every((c) => c.passed));
});

test('Foundry Inspector: rejects non-existent candidate file', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: '/path/does/not/exist.svg',
    targetId: 'test-nonexistent',
    name: 'Missing',
    kind: 'prop',
    category: 'prop',
    tags: ['prop'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: 'Tester',
    },
  };

  const report = inspectCandidate(candidate);
  assert.strictEqual(report.valid, false);
  assert.ok(report.errors.some((e) => e.includes('not found')));
});

test('Foundry Inspector: rejects non-kebab-case target IDs', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: umbrellaSvgPath,
    targetId: 'Bad_Target_ID!',
    name: 'Bad ID',
    kind: 'prop',
    category: 'prop',
    tags: ['prop'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: 'Tester',
    },
  };

  const report = inspectCandidate(candidate);
  assert.strictEqual(report.valid, false);
  assert.ok(report.errors.some((e) => e.includes('kebab-case')));
});

test('Foundry Inspector: rejects ID collision with existing registry asset', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: umbrellaSvgPath,
    targetId: 'starter-char-head-01', // Already in registry
    name: 'Colliding Head',
    kind: 'character_part',
    category: 'head',
    tags: ['head'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: 'Tester',
    },
  };

  const report = inspectCandidate(candidate);
  assert.strictEqual(report.valid, false);
  assert.ok(report.errors.some((e) => e.includes('collision')));
});

test('Foundry Inspector: enforces complete provenance metadata', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: umbrellaSvgPath,
    targetId: 'test-prop-no-author',
    name: 'No Author',
    kind: 'prop',
    category: 'prop',
    tags: ['prop'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: '', // Empty author
    },
  };

  const report = inspectCandidate(candidate);
  assert.strictEqual(report.valid, false);
  assert.ok(report.errors.some((e) => e.includes('provenance')));
});

test('Foundry Normalizer: standardizes namespaces, strips XML header and comments', () => {
  const dirtySvg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generator: Adobe Illustrator -->
<svg viewBox="0 0 100 100">
  <rect x="0" y="0" width="100" height="100" fill="red" />
</svg>`;

  const normalized = normalizeSvg(dirtySvg);
  assert.strictEqual(normalized.format, 'svg');
  assert.ok(normalized.content.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!normalized.content.includes('<?xml'));
  assert.ok(!normalized.content.includes('<!DOCTYPE'));
  assert.ok(!normalized.content.includes('<!-- Generator'));
  assert.strictEqual(normalized.dimensions.width, 100);
  assert.strictEqual(normalized.dimensions.height, 100);
});

test('Foundry Normalizer: sanitizes embedded <script> tags and event handlers', () => {
  const maliciousSvg = `<svg viewBox="0 0 100 100">
  <script>alert("xss")</script>
  <circle cx="50" cy="50" r="40" onload="doBadThing()" fill="blue" />
</svg>`;

  const normalized = normalizeSvg(maliciousSvg);
  assert.ok(!normalized.content.includes('<script>'));
  assert.ok(!normalized.content.includes('onload='));
  assert.ok(normalized.warnings.length >= 2);
});

test('Foundry Normalizer: synthesizes viewBox from width and height when missing', () => {
  const svgWithoutViewBox = `<svg width="240" height="180">
  <circle cx="120" cy="90" r="50" fill="green" />
</svg>`;

  const normalized = normalizeSvg(svgWithoutViewBox);
  assert.strictEqual(normalized.viewBox, '0 0 240 180');
  assert.strictEqual(normalized.dimensions.width, 240);
  assert.strictEqual(normalized.dimensions.height, 180);
  assert.ok(normalized.content.includes('viewBox="0 0 240 180"'));
});

test('Foundry Pipeline: dry-run ingestion completes full 6 stages without disk writes', () => {
  const candidate: AssetIngestionCandidate = {
    sourcePath: umbrellaSvgPath,
    targetId: 'test-dry-run-umbrella',
    name: 'Dry Run Umbrella',
    kind: 'prop',
    category: 'prop',
    tags: ['umbrella', 'dry-run'],
    provenance: {
      source: 'original',
      license: 'MIT',
      author: 'PeerPro Foundry Test',
    },
    anchor: { x: 0.5, y: 0.9 },
    attachmentSockets: {
      grip: { x: 160, y: 280 },
    },
    targetPackId: 'starter-kit',
  };

  const result = ingestAsset(candidate, { dryRun: true });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.errors.length, 0);
  assert.ok(result.receipt);
  assert.strictEqual(result.receipt.lifecycleState, 'approved');
  assert.strictEqual(result.receipt.assetId, 'test-dry-run-umbrella');
  assert.strictEqual(result.receipt.packId, 'starter-kit');
  assert.strictEqual(result.receipt.publicRelativePath, 'peerpro-assets/starter/test-dry-run-umbrella.svg');

  // Verify file was NOT actually written to public/ (since dryRun is true)
  const targetOnDisk = path.join(projectRoot, 'public', 'peerpro-assets', 'starter', 'test-dry-run-umbrella.svg');
  assert.strictEqual(fs.existsSync(targetOnDisk), false);
});
