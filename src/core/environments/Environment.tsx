import React, { useMemo } from 'react';
import { Img, staticFile } from 'remotion';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { AssetManifestEntry } from '../assets/types';
import { useCamera25D } from '../camera/Camera25D';
import {
  EnvironmentDefinition,
  EnvironmentLayer,
} from './types';
import { EnvironmentDefinitionSchema } from './schema';

export interface EnvironmentProps {
  definition: EnvironmentDefinition;
  registry?: AssetRegistry;
  cameraOffset?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  style?: React.CSSProperties;
}

/**
 * Pre-validates environment definition and verifies all referenced assets exist in registry.
 */
export function validateEnvironmentAssets(
  definition: EnvironmentDefinition,
  registry: AssetRegistry
): void {
  const parseResult = EnvironmentDefinitionSchema.safeParse(definition);
  if (!parseResult.success) {
    const errs = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid EnvironmentDefinition "${definition.id}": ${errs}`);
  }

  function checkLayer(layer: EnvironmentLayer): void {
    if (layer.assetId && !registry.has(layer.assetId)) {
      const allAssets = registry.getAll().map((a) => a.id);
      const suggestions = allAssets.slice(0, 5).join(', ');
      throw new Error(
        `Environment "${definition.id}" references unknown asset "${layer.assetId}" in layer "${layer.id}". Available assets: ${suggestions}...`
      );
    }
    if (layer.children) {
      for (const child of layer.children) {
        checkLayer(child);
      }
    }
  }

  for (const layer of definition.layers) {
    checkLayer(layer);
  }
}

/**
 * Environment Component renders a modular 2.5D scene from layered assets.
 * Supports depth planes, hierarchical grouping, anchor-based placement,
 * and 2.5D parallax response to Camera25D context or explicit props.
 */
export const Environment: React.FC<EnvironmentProps> = ({
  definition,
  registry = defaultAssetRegistry,
  cameraOffset,
  style,
}) => {
  // Validate assets prior to rendering
  useMemo(() => {
    validateEnvironmentAssets(definition, registry);
  }, [definition, registry]);

  const cameraContext = useCamera25D();

  const camX = cameraOffset?.x ?? cameraContext.camera.x ?? 0;
  const camY = cameraOffset?.y ?? cameraContext.camera.y ?? 0;
  const camZoom = cameraOffset?.zoom ?? cameraContext.camera.zoom ?? 1.0;
  const focalDepth = cameraContext.camera.focalDepth ?? 1.0;

  const renderLayer = (layer: EnvironmentLayer, parentZ = 0): React.ReactNode => {
    const asset: AssetManifestEntry | undefined = layer.assetId
      ? registry.get(layer.assetId)
      : undefined;

    // Anchor determination
    const anchor = layer.transform.anchor || asset?.anchor || { x: 0.5, y: 0.5 };
    const width = asset?.dimensions.width || 0;
    const height = asset?.dimensions.height || 0;

    // Pivot offset in pixels
    const pivotOffsetX = anchor.x * width;
    const pivotOffsetY = anchor.y * height;

    // Parallax displacement based on depth relative to focal plane
    const depthRatio = layer.depth / Math.max(focalDepth, 0.01);
    const parallaxX = -camX * depthRatio;
    const parallaxY = -camY * depthRatio;
    const parallaxScale = 1.0 + (camZoom - 1.0) * depthRatio;

    const posX = layer.transform.x - pivotOffsetX + parallaxX;
    const posY = layer.transform.y - pivotOffsetY + parallaxY;

    // Scaling
    const rawScale = layer.transform.scale ?? 1.0;
    const baseScaleX = Array.isArray(rawScale) ? rawScale[0] : rawScale;
    const baseScaleY = Array.isArray(rawScale) ? rawScale[1] : rawScale;

    const scaleX = baseScaleX * parallaxScale * (layer.transform.flipX ? -1 : 1);
    const scaleY = baseScaleY * parallaxScale;
    const rotation = layer.transform.rotation ?? 0;
    const opacity = layer.transform.opacity ?? 1.0;

    let zIndex = parentZ * 100 + layer.order;
    if (layer.plane === 'character_occluder' && zIndex < 55) {
      zIndex += 50;
    }

    return (
      <div
        key={layer.id}
        id={`layer-${layer.id}`}
        style={{
          position: 'absolute',
          left: posX,
          top: posY,
          width: width > 0 ? width : 'auto',
          height: height > 0 ? height : 'auto',
          transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
          transformOrigin: `${anchor.x * 100}% ${anchor.y * 100}%`,
          opacity,
          zIndex,
          pointerEvents: 'none',
        }}
      >
        {asset && asset.format !== 'component' && (
          <Img
            src={staticFile(asset.path)}
            style={{
              width: width > 0 ? width : '100%',
              height: height > 0 ? height : '100%',
              display: 'block',
            }}
            alt={layer.name || asset.name}
          />
        )}

        {layer.customContent}

        {/* Hierarchical Child Layers */}
        {layer.children && layer.children.map((child) => renderLayer(child, zIndex))}
      </div>
    );
  };

  // Sort top-level layers by order
  const sortedLayers = useMemo(() => {
    return [...definition.layers].sort((a, b) => a.order - b.order);
  }, [definition.layers]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: definition.backgroundColor || 'transparent',
        overflow: 'hidden',
        ...style,
      }}
    >
      {sortedLayers.map((layer) => renderLayer(layer))}
    </div>
  );
};
