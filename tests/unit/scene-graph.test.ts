import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { defaultAssetRegistry } from '../../src/core/assets/registry';
import { AssetPackManifest } from '../../src/core/assets/types';
import {
  solveSceneGraph,
  compileSceneGraphToManifest,
  SceneGraphDefinition,
} from '../../src/core/scenegraph';
import { validateSceneManifest } from '../../src/core/scene/validator';

const projectRoot = path.resolve(__dirname, '../..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');

// Ensure starter pack is loaded
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

test('SceneGraph: parent-child transform propagation moves children automatically', () => {
  const sceneGraph1: SceneGraphDefinition = {
    id: 'test-fk-1',
    name: 'Forward Kinematics 1',
    nodes: [
      {
        id: 'desk',
        kind: 'asset',
        assetId: 'starter-env-classroom-desk',
        localTransform: { x: 800, y: 890 },
      },
      {
        id: 'book',
        kind: 'prop',
        parentId: 'desk',
        localTransform: { x: 20, y: -40 },
        visualBounds: { width: 60, height: 40 },
      },
    ],
  };

  const report1 = solveSceneGraph(sceneGraph1, { registry: defaultAssetRegistry });
  assert.strictEqual(report1.valid, true);
  const desk1 = report1.resolvedNodes['desk'];
  const book1 = report1.resolvedNodes['book'];
  assert.strictEqual(desk1.worldTransform.x, 800);
  assert.strictEqual(desk1.worldTransform.y, 890);
  assert.strictEqual(book1.worldTransform.x, 820);
  assert.strictEqual(book1.worldTransform.y, 850);

  // When desk is moved to x: 1200, child book follows automatically!
  const sceneGraph2: SceneGraphDefinition = {
    ...sceneGraph1,
    nodes: [
      {
        id: 'desk',
        kind: 'asset',
        assetId: 'starter-env-classroom-desk',
        localTransform: { x: 1200, y: 890 },
      },
      sceneGraph1.nodes[1],
    ],
  };

  const report2 = solveSceneGraph(sceneGraph2, { registry: defaultAssetRegistry });
  const book2 = report2.resolvedNodes['book'];
  assert.strictEqual(book2.worldTransform.x, 1220);
  assert.strictEqual(book2.worldTransform.y, 850);
});

test('SceneGraph: place_on_surface locks prop bottom to target surface top', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-surface',
    name: 'Surface Constraint Test',
    nodes: [
      {
        id: 'table',
        kind: 'group',
        visualBounds: { width: 300, height: 100 },
        localTransform: { x: 960, y: 800, anchor: { x: 0.5, y: 1.0 } },
      },
      {
        id: 'cup',
        kind: 'prop',
        visualBounds: { width: 40, height: 50 },
        localTransform: { x: 960, anchor: { x: 0.5, y: 1.0 } },
        constraints: [
          {
            type: 'place_on_surface',
            targetId: 'table',
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph);
  assert.strictEqual(report.valid, true);

  const table = report.resolvedNodes['table'];
  const cup = report.resolvedNodes['cup'];

  // Table top surface is at y = 800 - 100 = 700
  assert.strictEqual(table.worldBounds.y, 700);
  // Cup bottom (anchor y=1.0) must sit precisely at table top surface (y = 700)
  assert.strictEqual(cup.worldTransform.y, 700);
  assert.strictEqual(cup.worldBounds.y + cup.worldBounds.height, 700);
});

test('SceneGraph: align centers prop horizontally relative to target', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-align',
    name: 'Alignment Constraint Test',
    nodes: [
      {
        id: 'blackboard',
        kind: 'asset',
        visualBounds: { width: 600, height: 300 },
        localTransform: { x: 960, y: 500, anchor: { x: 0.5, y: 0.5 } },
      },
      {
        id: 'banner',
        kind: 'prop',
        visualBounds: { width: 200, height: 50 },
        localTransform: { anchor: { x: 0.5, y: 0.5 } },
        constraints: [
          {
            type: 'align',
            targetId: 'blackboard',
            alignment: 'center',
          },
          {
            type: 'align',
            targetId: 'blackboard',
            alignment: 'top',
            offset: { y: 20 },
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph);
  assert.strictEqual(report.valid, true);

  const bb = report.resolvedNodes['blackboard'];
  const banner = report.resolvedNodes['banner'];

  const bbCenterX = bb.worldBounds.x + bb.worldBounds.width / 2;
  const bannerCenterX = banner.worldBounds.x + banner.worldBounds.width / 2;
  assert.strictEqual(bannerCenterX, bbCenterX);
  assert.strictEqual(banner.worldBounds.y, bb.worldBounds.y + 20);
});

test('SceneGraph: look_toward automatically sets flipX toward target position', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-look',
    name: 'Look Toward Test',
    nodes: [
      {
        id: 'teacher',
        kind: 'character',
        characterId: 'student-ren-v2',
        localTransform: { x: 1400, y: 910 },
      },
      {
        id: 'student-left',
        kind: 'character',
        characterId: 'student-ren-v2',
        localTransform: { x: 500, y: 910 },
        constraints: [
          {
            type: 'look_toward',
            targetId: 'teacher',
          },
        ],
      },
      {
        id: 'student-right',
        kind: 'character',
        characterId: 'student-ren-v2',
        localTransform: { x: 1600, y: 910 },
        constraints: [
          {
            type: 'look_toward',
            targetId: 'teacher',
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph);
  assert.strictEqual(report.valid, true);

  const studentLeft = report.resolvedNodes['student-left'];
  const studentRight = report.resolvedNodes['student-right'];

  // student-left is at x=500 looking right toward x=1400 => flipX should be false
  assert.strictEqual(studentLeft.worldTransform.flipX, false);
  // student-right is at x=1600 looking left toward x=1400 => flipX should be true
  assert.strictEqual(studentRight.worldTransform.flipX, true);
});

test('SceneGraph: attach_socket aligns child to parent asset attachment socket', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-socket',
    name: 'Attach Socket Test',
    nodes: [
      {
        id: 'desk',
        kind: 'asset',
        assetId: 'starter-env-classroom-desk',
        localTransform: { x: 800, y: 890 },
        customData: {
          sockets: {
            desk_lamp_socket: { x: 300, y: 20 },
          },
        },
      },
      {
        id: 'lamp',
        kind: 'prop',
        visualBounds: { width: 50, height: 80 },
        localTransform: { anchor: { x: 0.5, y: 1.0 } },
        constraints: [
          {
            type: 'attach_socket',
            targetId: 'desk',
            targetSocket: 'desk_lamp_socket',
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph, { registry: defaultAssetRegistry });
  assert.strictEqual(report.valid, true);

  const lamp = report.resolvedNodes['lamp'];
  assert.ok(lamp.appliedConstraints.includes('attach_socket:desk_lamp_socket'));
});

test('SceneGraph: safe_region clamps out-of-bounds nodes', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-safe-region',
    name: 'Safe Region Test',
    nodes: [
      {
        id: 'clipped-sign',
        kind: 'prop',
        visualBounds: { width: 100, height: 100 },
        localTransform: { x: -30, y: 500, anchor: { x: 0.0, y: 0.0 } },
        constraints: [
          {
            type: 'safe_region',
            region: { minX: 40, minY: 40, maxX: 1880, maxY: 1040 },
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph);
  assert.strictEqual(report.valid, true);

  const sign = report.resolvedNodes['clipped-sign'];
  assert.strictEqual(sign.worldBounds.x, 40);
  assert.strictEqual(sign.worldTransform.x, 40);
});

test('SceneGraph: layer_relative enforces foreground or background order', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-layer-order',
    name: 'Layer Order Test',
    nodes: [
      {
        id: 'character',
        kind: 'character',
        order: 50,
      },
      {
        id: 'foreground-prop',
        kind: 'prop',
        order: 10,
        constraints: [
          {
            type: 'layer_relative',
            targetId: 'character',
            relation: 'front_of',
          },
        ],
      },
      {
        id: 'background-plate',
        kind: 'asset',
        order: 60,
        constraints: [
          {
            type: 'layer_relative',
            targetId: 'character',
            relation: 'behind',
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraph);
  assert.strictEqual(report.valid, true);

  const character = report.resolvedNodes['character'];
  const fgProp = report.resolvedNodes['foreground-prop'];
  const bgPlate = report.resolvedNodes['background-plate'];

  assert.ok(fgProp.effectiveOrder > character.effectiveOrder);
  assert.ok(bgPlate.effectiveOrder < character.effectiveOrder);
});

test('SceneGraph: detects circular dependencies and reports conflict', () => {
  const sceneGraphWithCycle: SceneGraphDefinition = {
    id: 'test-cycle',
    name: 'Cycle Detection Test',
    nodes: [
      {
        id: 'nodeA',
        kind: 'prop',
        constraints: [
          {
            type: 'relative_offset',
            targetId: 'nodeB',
            offset: { x: 10, y: 0 },
          },
        ],
      },
      {
        id: 'nodeB',
        kind: 'prop',
        constraints: [
          {
            type: 'relative_offset',
            targetId: 'nodeA',
            offset: { x: -10, y: 0 },
          },
        ],
      },
    ],
  };

  const report = solveSceneGraph(sceneGraphWithCycle);
  assert.strictEqual(report.valid, false);
  assert.ok(report.cyclesDetected.length > 0);
  assert.ok(report.conflicts.some((c) => c.message.includes('Circular spatial dependency')));
});

test('SceneGraph: compiles scene graph into validated SceneManifest', () => {
  const sceneGraph: SceneGraphDefinition = {
    id: 'test-compile',
    name: 'Compilation Test',
    canvas: { width: 1920, height: 1080, fps: 30, durationInFrames: 90 },
    nodes: [
      {
        id: 'bg-wall',
        kind: 'asset',
        assetId: 'starter-env-classroom-wall',
        depth: 0.3,
        localTransform: { x: 960, y: 0, anchor: { x: 0.5, y: 0.0 } },
      },
      {
        id: 'desk',
        kind: 'asset',
        assetId: 'starter-env-classroom-desk',
        depth: 1.0,
        localTransform: { x: 960, y: 910 },
      },
      {
        id: 'student',
        kind: 'character',
        characterId: 'student-ren-v2',
        depth: 1.0,
        constraints: [
          {
            type: 'relative_offset',
            targetId: 'desk',
            offset: { x: -80, y: 0 },
          },
        ],
      },
    ],
  };

  const manifest = compileSceneGraphToManifest(sceneGraph, { registry: defaultAssetRegistry });
  assert.strictEqual(manifest.id, 'test-compile');
  assert.strictEqual(manifest.characters?.length, 1);
  assert.strictEqual(manifest.characters[0].position.x, 880);
  assert.strictEqual(manifest.characters[0].position.y, 910);
  assert.ok(manifest.environment?.custom?.layers.length === 2);

  const validation = validateSceneManifest(manifest, { registry: defaultAssetRegistry });
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.errors.length, 0);
});
