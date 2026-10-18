import { EnvironmentDefinition } from './types';
import { EnvironmentKitDefinition } from './kits';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';

export interface LayoutValidationOptions {
  registry?: AssetRegistry;
  checkRegistry?: boolean;
  clearanceZone?: {
    minX: number;
    maxX: number;
  };
  strictGroundCheck?: boolean;
}

export interface EnvironmentValidationReport {
  valid: boolean;
  environmentId: string;
  kitId: string;
  errors: string[];
  warnings: string[];
  metrics: {
    totalLayers: number;
    groundAlignedCount: number;
    depthRange: [number, number];
    clearanceZoneSatisfied: boolean;
  };
}

/**
 * Validates an EnvironmentDefinition against a Kit Specification and layout constraints.
 */
export function validateEnvironmentLayout(
  environment: EnvironmentDefinition,
  kit: EnvironmentKitDefinition,
  options: LayoutValidationOptions = {}
): EnvironmentValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const registry = options.registry ?? defaultAssetRegistry;
  const checkRegistry = options.checkRegistry ?? true;
  const clearanceZone = options.clearanceZone;
  const strictGround = options.strictGroundCheck ?? false;

  let groundAlignedCount = 0;
  let clearanceZoneSatisfied = true;
  let minDepthFound = Infinity;
  let maxDepthFound = -Infinity;

  if (!environment.layers || environment.layers.length === 0) {
    errors.push(`Environment "${environment.id}" has no layers.`);
  }

  for (const layer of environment.layers) {
    const depth = layer.depth;
    if (depth < minDepthFound) minDepthFound = depth;
    if (depth > maxDepthFound) maxDepthFound = depth;

    // 1. Depth Range Verification
    if (
      depth < kit.supportedDepths.min - 0.05 ||
      depth > kit.supportedDepths.max + 0.05
    ) {
      warnings.push(
        `Layer "${layer.id}" has depth ${depth}, which exceeds kit "${kit.id}" supported range [${kit.supportedDepths.min}, ${kit.supportedDepths.max}].`
      );
    }

    // 2. Asset Registry & Perspective Check
    if (layer.assetId && checkRegistry) {
      if (!registry.has(layer.assetId)) {
        errors.push(
          `Layer "${layer.id}" references asset "${layer.assetId}" which is not registered in AssetRegistry.`
        );
      } else {
        const asset = registry.get(layer.assetId);
        // Perspective compatibility check
        if (
          asset.style.family &&
          asset.style.family !== kit.perspectiveFamily &&
          !asset.style.family.includes(kit.perspectiveFamily)
        ) {
          warnings.push(
            `Perspective/style mismatch: Layer "${layer.id}" uses asset "${asset.id}" with family "${asset.style.family}", expected "${kit.perspectiveFamily}".`
          );
        }
      }
    }

    // 3. Ground Plane Alignment Check
    // If layer anchor is bottom (y: 1.0) and it belongs to midground or foreground
    if (layer.transform.anchor?.y === 1.0 && layer.depth >= 0.8 && layer.depth <= 1.2) {
      const groundDelta = Math.abs(layer.transform.y - kit.groundLineY);
      if (groundDelta <= 25) {
        groundAlignedCount++;
      } else if (strictGround && groundDelta > 50) {
        errors.push(
          `Layer "${layer.id}" anchor indicates ground contact, but Y position (${layer.transform.y}px) deviates >50px from kit ground line (${kit.groundLineY}px).`
        );
      } else if (groundDelta > 50) {
        warnings.push(
          `Layer "${layer.id}" appears to float or sink relative to ground line (${layer.transform.y}px vs ${kit.groundLineY}px).`
        );
      }
    }

    // 4. Clearance Zone Verification (Hero Character Space)
    if (clearanceZone && (layer.plane === 'foreground' || layer.plane === 'character_occluder')) {
      const layerX = layer.transform.x;
      if (layerX >= clearanceZone.minX && layerX <= clearanceZone.maxX) {
        warnings.push(
          `Clearance obstruction: Layer "${layer.id}" at X=${layerX}px intrudes into reserved actor staging zone [${clearanceZone.minX}, ${clearanceZone.maxX}].`
        );
        clearanceZoneSatisfied = false;
      }
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    environmentId: environment.id,
    kitId: kit.id,
    errors,
    warnings,
    metrics: {
      totalLayers: environment.layers.length,
      groundAlignedCount,
      depthRange: [
        minDepthFound === Infinity ? 1.0 : minDepthFound,
        maxDepthFound === -Infinity ? 1.0 : maxDepthFound,
      ],
      clearanceZoneSatisfied,
    },
  };
}
