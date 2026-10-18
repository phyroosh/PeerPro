import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { EnvironmentDefinition, EnvironmentLayer } from '../environments/types';
import { SceneCharacterInstance, SceneManifest } from '../scene/types';
import { solveSceneGraph } from './solver';
import { SceneGraphDefinition, SceneGraphReport } from './types';

export interface SceneGraphCompileOptions {
  registry?: AssetRegistry;
}

/**
 * Compiles a declarative SceneGraphDefinition into a Remotion-ready SceneManifest.
 * Evaluates all parent-child transforms, spatial constraints, and layer ordering.
 */
export function compileSceneGraphToManifest(
  sceneGraph: SceneGraphDefinition,
  options: SceneGraphCompileOptions = {}
): SceneManifest {
  const registry = options.registry || defaultAssetRegistry;
  const report: SceneGraphReport = solveSceneGraph(sceneGraph, { registry });

  if (!report.valid) {
    const errorDetails = report.conflicts.map((c) => `[${c.nodeIds.join(', ')}] ${c.message}`).join('; ');
    throw new Error(`SceneGraph compilation failed due to unresolved conflicts: ${errorDetails}`);
  }

  const environmentLayers: EnvironmentLayer[] = [];
  const characterInstances: SceneCharacterInstance[] = [];

  for (const nodeId of report.resolutionOrder) {
    const node = report.resolvedNodes[nodeId];
    if (!node || node.visible === false) continue;

    if (node.kind === 'character') {
      characterInstances.push({
        id: node.id,
        characterId: node.characterId || 'student-ren-v2',
        variant: node.characterVariant || 'default',
        depth: node.effectiveDepth,
        position: {
          x: node.worldTransform.x,
          y: node.worldTransform.y,
        },
        scale: node.worldTransform.scaleX,
        flipX: node.worldTransform.flipX,
        rotation: node.worldTransform.rotation,
        opacity: node.worldTransform.opacity,
        animation: node.customData?.animation,
        partOverrides: node.customData?.partOverrides,
      });
    } else if (node.assetId || node.kind === 'asset' || node.kind === 'prop') {
      const plane =
        node.effectiveDepth > 1.1
          ? 'foreground'
          : node.effectiveOrder >= 100
            ? 'character_occluder'
            : node.effectiveDepth < 0.6
              ? 'background'
              : 'mid_back';

      environmentLayers.push({
        id: node.id,
        name: node.name || node.id,
        assetId: node.assetId,
        depth: node.effectiveDepth,
        order: node.effectiveOrder,
        plane,
        transform: {
          x: node.worldTransform.x,
          y: node.worldTransform.y,
          scale:
            node.worldTransform.scaleX !== node.worldTransform.scaleY
              ? [node.worldTransform.scaleX, node.worldTransform.scaleY]
              : node.worldTransform.scaleX,
          rotation: node.worldTransform.rotation,
          flipX: node.worldTransform.flipX,
          opacity: node.worldTransform.opacity,
          anchor: node.worldTransform.anchor,
        },
      });
    }
  }

  const customEnv: EnvironmentDefinition = {
    id: `env-${sceneGraph.id}`,
    name: `${sceneGraph.name} Environment`,
    domain: 'hybrid',
    backgroundColor: sceneGraph.canvas?.backgroundColor || '#090d16',
    layers: environmentLayers,
  };

  const manifest: SceneManifest = {
    id: sceneGraph.id,
    name: sceneGraph.name,
    description: sceneGraph.description,
    canvas: {
      width: sceneGraph.canvas?.width || 1920,
      height: sceneGraph.canvas?.height || 1080,
      fps: sceneGraph.canvas?.fps || 30,
      durationInFrames: sceneGraph.canvas?.durationInFrames || 120,
      backgroundColor: sceneGraph.canvas?.backgroundColor || '#090d16',
    },
    camera: sceneGraph.camera || {
      preset: 'static',
      intensity: 0.0,
      focalDepth: 1.0,
    },
    environment: {
      custom: customEnv,
    },
    characters: characterInstances,
    effects: (sceneGraph as any).effects,
    dialog: (sceneGraph as any).dialog,
    audio: (sceneGraph as any).audio,
  };

  return manifest;
}
