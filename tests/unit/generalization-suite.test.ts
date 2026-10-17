import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  CREATIVE_CHALLENGES,
  getChallengeCatalog,
  findChallengeById,
} from '../../src/core/challenges/catalog';
import {
  formatGeneralizationMarkdown,
  RANKED_ARCHITECTURAL_GAPS,
} from '../../src/core/challenges/runner';
import { GeneralizationSuiteReport, ChallengeResult } from '../../src/core/challenges/types';
import { validateSceneManifest } from '../../src/core/scene/validator';

const projectRoot = path.resolve(__dirname, '../..');

test('Generalization Catalog: contains all 6 creative challenges', () => {
  const catalog = getChallengeCatalog();
  assert.strictEqual(catalog.length, 6, 'Expected exactly 6 creative challenges');

  const expectedIds = [
    'C1_NEW_LOCATION',
    'C2_MULTI_SHOT_IDENTITY',
    'C3_SPATIAL_PROP',
    'C4_TARGETED_INTERACTION',
    'C5_MULTI_DEPTH_CINEMATOGRAPHY',
    'C6_MISSING_ASSET_HONESTY',
  ];

  const actualIds = catalog.map((c) => c.id);
  assert.deepStrictEqual(actualIds, expectedIds);
});

test('Generalization Catalog: every challenge has comprehensive prompt and metadata', () => {
  const catalog = getChallengeCatalog();

  for (const c of catalog) {
    assert.ok(c.id.startsWith('C'), `ID must start with C: ${c.id}`);
    assert.ok(c.title && c.title.length > 5, `Title must be descriptive: ${c.title}`);
    assert.ok(c.category, `Category must be set: ${c.category}`);
    assert.ok(c.prompt && c.prompt.length > 20, `Prompt must be comprehensive: ${c.prompt}`);
    assert.ok(c.expectedOutcome && c.expectedOutcome.length > 20, `Expected outcome must be defined: ${c.expectedOutcome}`);
  }
});

test('findChallengeById: retrieves challenge or returns undefined', () => {
  const c1 = findChallengeById('C1_NEW_LOCATION');
  assert.ok(c1);
  assert.strictEqual(c1.category, 'location');

  const c6 = findChallengeById('C6_MISSING_ASSET_HONESTY');
  assert.ok(c6);
  assert.strictEqual(c6.category, 'limitation');

  const unknown = findChallengeById('C99_NONEXISTENT');
  assert.strictEqual(unknown, undefined);
});

test('Challenge C6: semantic validation honestly rejects missing bicycle asset', () => {
  const c6Path = path.join(projectRoot, 'scenes/challenges/c6-missing-asset-request.json');
  assert.ok(fs.existsSync(c6Path), 'c6 scene fixture must exist');

  const rawJson = JSON.parse(fs.readFileSync(c6Path, 'utf8'));
  const result = validateSceneManifest(rawJson);

  // Must fail validation honestly
  assert.strictEqual(result.valid, false, 'Expected scene with missing assets to be invalid');
  assert.ok(result.errors.length > 0, 'Expected validation error messages');
});

test('Ranked Gaps: list contains prioritized architectural gaps grounded in challenges', () => {
  assert.ok(RANKED_ARCHITECTURAL_GAPS.length >= 4, 'Expected at least 4 ranked gaps');

  for (const gap of RANKED_ARCHITECTURAL_GAPS) {
    assert.ok(gap.rank >= 1 && gap.rank <= 10, 'Rank must be positive integer');
    assert.ok(gap.title.length > 5, 'Title must be descriptive');
    assert.ok(gap.impact.length > 10, 'Impact must be detailed');
    assert.ok(gap.affectedChallenges.length > 0, 'Must link to affected challenges');
    assert.ok(gap.recommendation.length > 10, 'Must provide concrete recommendation');
  }
});

test('formatGeneralizationMarkdown: formats complete challenge report with matrix and gaps', () => {
  const mockResult: ChallengeResult = {
    id: 'C1_NEW_LOCATION',
    title: 'Novel Environment Layout',
    category: 'location',
    status: 'PASS',
    scores: {
      toolDiscovery: 95,
      apiCorrectness: 95,
      visualQuality: 90,
      determinism: 100,
      repairBehavior: 90,
      honestLimitation: 100,
      overallScore: 95,
    },
    outputStills: ['out/challenges/c1_new_location.png'],
    compositionScore: 92,
    diagnosticLogs: ['Rendered frame 50 -> SHA-256: 123456...'],
    observedGaps: ['Manual coordinate placement required'],
  };

  const mockReport: GeneralizationSuiteReport = {
    timestamp: '2026-10-17T20:20:00.000Z',
    nodeVersion: 'v22.23.1',
    totalChallenges: 1,
    passedCount: 1,
    gapCount: 0,
    failedCount: 0,
    averageScore: 95,
    results: [mockResult],
    rankedGaps: RANKED_ARCHITECTURAL_GAPS,
  };

  const md = formatGeneralizationMarkdown(mockReport);
  assert.ok(md.includes('# PeerPro Creative Generalization Challenge Report'));
  assert.ok(md.includes('C1_NEW_LOCATION'));
  assert.ok(md.includes('95/100'));
  assert.ok(md.includes('Priority 1:'));
});
