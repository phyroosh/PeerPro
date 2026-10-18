import { EnvironmentDefinition, EnvironmentLayer, LayerTransform } from './types';
import { EnvironmentKitDefinition, getKitDefinition } from './kits';
import { EnvironmentPrefab, getPrefab } from './prefabs';

/**
 * High-performance 32-bit seeded pseudo-random number generator (Mulberry32).
 * Guarantees exact frame-deterministic outputs across runtimes.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DirectiveType =
  | 'leave_center_clear'
  | 'align_to_ground'
  | 'linear_spacing'
  | 'grid_spacing'
  | 'foreground_frame';

export interface SemanticLayoutDirective {
  type: DirectiveType;
  /** Clearance zone for hero actor staging (default: [760, 1160]) */
  minX?: number;
  maxX?: number;
  /** Ground line offset in pixels (default: 0) */
  groundOffset?: number;
  /** Linear spacing range */
  startX?: number;
  endX?: number;
  count?: number;
  jitter?: number;
  /** Grid spacing parameters */
  rows?: number;
  cols?: number;
  colSpacing?: number;
  rowSpacing?: number;
  aisleGap?: number;
  /** Foreground framing */
  side?: 'left' | 'right' | 'both';
  edgeMargin?: number;
  depth?: number;
}

export interface PrefabPlacement {
  prefabId: string;
  instanceId?: string;
  x?: number;
  y?: number;
  depth?: number;
  order?: number;
  scale?: number;
  flipX?: boolean;
  variant?: string;
  layerOverrides?: Record<string, Partial<LayerTransform>>;
  directives?: SemanticLayoutDirective[];
}

export interface WorldCompositionConfig {
  id: string;
  name: string;
  description?: string;
  kitId: string;
  seed?: number;
  placements: PrefabPlacement[];
  globalDirectives?: SemanticLayoutDirective[];
  backdropOverrides?: {
    skyAssetId?: string;
    groundAssetId?: string;
    wallAssetId?: string;
    backgroundColor?: string;
  };
  customLayers?: EnvironmentLayer[];
}

export interface LayoutTelemetry {
  prefabCount: number;
  layerCount: number;
  depthsUsed: number[];
  clearanceZoneClean: boolean;
  groundContactValid: boolean;
  seedUsed: number;
}

/**
 * Evaluates semantic directives and compiles prefabs into a fully validated EnvironmentDefinition.
 */
export function composeEnvironment(config: WorldCompositionConfig): {
  environment: EnvironmentDefinition;
  telemetry: LayoutTelemetry;
} {
  const kit = getKitDefinition(config.kitId);
  const seed = config.seed ?? 12345;
  const rng = createSeededRandom(seed);

  const layers: EnvironmentLayer[] = [];
  const depthsSet = new Set<number>();
  let layerOrderCounter = 1;

  // 1. Backing Canvas & Kit Backdrop
  const skyAssetId = config.backdropOverrides?.skyAssetId ?? kit.backdrop.skyAssetId;
  const groundAssetId = config.backdropOverrides?.groundAssetId ?? kit.backdrop.groundAssetId;
  const wallAssetId = config.backdropOverrides?.wallAssetId ?? kit.backdrop.wallAssetId;

  // Outdoor Sky Plate
  if (skyAssetId) {
    layers.push({
      id: `${config.id}-bg-sky`,
      name: 'Sky Backdrop Plate',
      assetId: skyAssetId,
      depth: kit.supportedDepths.min,
      order: layerOrderCounter++,
      plane: 'background',
      transform: {
        x: 960,
        y: 0,
        scale: 1.0,
        anchor: { x: 0.5, y: 0.0 },
      },
    });
    depthsSet.add(kit.supportedDepths.min);
  }

  // Indoor Wall Plate
  if (wallAssetId) {
    layers.push({
      id: `${config.id}-bg-wall`,
      name: 'Room Wall Backdrop Plate',
      assetId: wallAssetId,
      depth: kit.supportedDepths.min,
      order: layerOrderCounter++,
      plane: 'background',
      transform: {
        x: 960,
        y: kit.groundLineY - 320,
        scale: 1.05,
        anchor: { x: 0.5, y: 0.5 },
      },
    });
    depthsSet.add(kit.supportedDepths.min);
  }

  // Resolve Global Directives
  const globalClearance = config.globalDirectives?.find(
    (d) => d.type === 'leave_center_clear'
  );
  const clearMinX = globalClearance?.minX ?? 760;
  const clearMaxX = globalClearance?.maxX ?? 1160;

  let clearanceZoneClean = true;
  let groundContactValid = true;

  // 2. Instantiate Prefab Placements
  config.placements.forEach((placement, idx) => {
    const prefab = getPrefab(placement.prefabId);
    const instanceId = placement.instanceId || `${prefab.id}-${idx + 1}`;

    // Compute Base Position
    let posX = placement.x ?? (idx === 0 ? 520 : 1400);
    let posY = placement.y ?? kit.groundLineY;

    // Check align_to_ground directive
    const hasGroundDirective =
      placement.directives?.some((d) => d.type === 'align_to_ground') ?? true;
    if (hasGroundDirective && prefab.anchor.y === 1.0) {
      posY = kit.groundLineY;
    }

    // Check leave_center_clear directive
    const enforcesClearance =
      placement.directives?.some((d) => d.type === 'leave_center_clear') ||
      globalClearance !== undefined;
    if (enforcesClearance) {
      const halfWidth = (prefab.dimensions.width * (placement.scale ?? 1.0)) / 2;
      const leftEdge = posX - halfWidth;
      const rightEdge = posX + halfWidth;

      // If overlapping center clearance zone
      if (leftEdge < clearMaxX && rightEdge > clearMinX) {
        // Shift left or right deterministically using PRNG
        const shiftRight = rng() > 0.5;
        if (shiftRight) {
          posX = clearMaxX + halfWidth + 40;
        } else {
          posX = clearMinX - halfWidth - 40;
        }
      }

      // Re-verify clearance
      const finalLeft = posX - halfWidth;
      const finalRight = posX + halfWidth;
      if (finalLeft < clearMaxX && finalRight > clearMinX) {
        clearanceZoneClean = false;
      }
    }

    // Check Ground Line Contact
    if (Math.abs(posY - kit.groundLineY) > 20 && prefab.anchor.y === 1.0) {
      groundContactValid = false;
    }

    // Resolve Variant: Explicit or Picked by Seed PRNG
    let activeVariant = placement.variant;
    if (!activeVariant && prefab.variants) {
      const variantKeys = Object.keys(prefab.variants);
      const pickedIndex = Math.floor(rng() * variantKeys.length);
      activeVariant = variantKeys[pickedIndex];
    }

    const variantConfig = activeVariant ? prefab.variants?.[activeVariant] : undefined;
    const baseDepth = placement.depth ?? prefab.defaultDepth;
    const baseOrder = placement.order ?? prefab.defaultOrder;
    const baseScale = placement.scale ?? 1.0;
    const baseFlipX = placement.flipX ?? false;

    depthsSet.add(baseDepth);

    // Unroll SubLayers
    prefab.subLayers.forEach((subLayer) => {
      // Skip if excluded by variant
      if (variantConfig?.excludedSubIds?.includes(subLayer.subId)) {
        return;
      }

      const variantTransformOverride = variantConfig?.layerOverrides?.[subLayer.subId];
      const customTransformOverride = placement.layerOverrides?.[subLayer.subId];

      const mergedTransform: LayerTransform = {
        x: customTransformOverride?.x ?? variantTransformOverride?.x ?? subLayer.transform.x,
        y: customTransformOverride?.y ?? variantTransformOverride?.y ?? subLayer.transform.y,
        scale:
          customTransformOverride?.scale ??
          variantTransformOverride?.scale ??
          subLayer.transform.scale ??
          1.0,
        rotation:
          customTransformOverride?.rotation ??
          variantTransformOverride?.rotation ??
          subLayer.transform.rotation ??
          0,
        flipX:
          customTransformOverride?.flipX ??
          variantTransformOverride?.flipX ??
          subLayer.transform.flipX ??
          false,
        anchor: subLayer.transform.anchor,
      };

      const flipMultiplier = baseFlipX ? -1 : 1;
      const subLayerWorldX = posX + mergedTransform.x * baseScale * flipMultiplier;
      const subLayerWorldY = posY + mergedTransform.y * baseScale;
      const subLayerDepth = baseDepth + (subLayer.depthOffset ?? 0);
      const subLayerOrder = baseOrder + (subLayer.orderOffset ?? 0);

      depthsSet.add(subLayerDepth);

      layers.push({
        id: `${instanceId}-${subLayer.subId}`,
        name: subLayer.name ? `${prefab.name} (${subLayer.name})` : subLayer.subId,
        assetId: subLayer.assetId,
        depth: Number(subLayerDepth.toFixed(3)),
        order: subLayerOrder,
        plane: subLayer.plane ?? prefab.plane,
        transform: {
          x: Number(subLayerWorldX.toFixed(2)),
          y: Number(subLayerWorldY.toFixed(2)),
          scale: Number(
            (
              (typeof mergedTransform.scale === 'number' ? mergedTransform.scale : 1.0) *
              baseScale
            ).toFixed(3)
          ),
          rotation: (mergedTransform.rotation ?? 0) * flipMultiplier,
          flipX: baseFlipX ? !mergedTransform.flipX : mergedTransform.flipX,
          anchor: mergedTransform.anchor,
        },
        animationPreset: subLayer.animationPreset,
      });
    });
  });

  // 3. Ground Surface Layer (Road / Floor)
  if (groundAssetId) {
    layers.push({
      id: `${config.id}-ground-surface`,
      name: 'Ground Surface Plane',
      assetId: groundAssetId,
      depth: 1.0,
      order: 30,
      plane: 'mid_back',
      transform: {
        x: 960,
        y: 1080,
        scale: [1.15, 1.0],
        anchor: { x: 0.5, y: 1.0 },
      },
    });
    depthsSet.add(1.0);
  }

  // 4. Custom Additional Layers
  if (config.customLayers && config.customLayers.length > 0) {
    layers.push(...config.customLayers);
  }

  // Sort layers primarily by order, secondarily by depth
  layers.sort((a, b) => a.order - b.order || a.depth - b.depth);

  const environment: EnvironmentDefinition = {
    id: config.id,
    name: config.name,
    domain: kit.domain,
    description: config.description ?? `Procedurally composed from kit ${kit.name}`,
    backgroundColor: config.backdropOverrides?.backgroundColor ?? kit.backdrop.defaultBgColor,
    grammar: {
      floorBaselineY: kit.groundLineY,
      wallDepth: kit.supportedDepths.min,
    },
    layers,
  };

  const telemetry: LayoutTelemetry = {
    prefabCount: config.placements.length,
    layerCount: layers.length,
    depthsUsed: Array.from(depthsSet).sort((a, b) => a - b),
    clearanceZoneClean,
    groundContactValid,
    seedUsed: seed,
  };

  return { environment, telemetry };
}
