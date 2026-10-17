import {
  AssetCategory,
  AssetFilter,
  AssetManifestEntry,
  AssetPackManifest,
} from './types';
import { validateAssetPackManifest } from './validator';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * In-memory registry and query engine for all registered asset packs and parts.
 */
export class AssetRegistry {
  private assetsById = new Map<string, AssetManifestEntry>();
  private packManifests = new Map<string, AssetPackManifest>();

  /**
   * Register an asset pack into the registry.
   */
  public registerPack(
    manifest: AssetPackManifest,
    options: { validate?: boolean; assetRoot?: string } = {}
  ): void {
    if (options.validate !== false) {
      const result = validateAssetPackManifest(manifest, {
        assetRootDirectory: options.assetRoot,
      });
      if (!result.valid) {
        const errorMessages = result.errors
          .map((e) => `[${e.code}] ${e.path}: ${e.message}`)
          .join('\n');
        throw new Error(
          `Failed to register asset pack "${manifest.packId}" due to validation errors:\n${errorMessages}`
        );
      }
    }

    this.packManifests.set(manifest.packId, manifest);
    for (const asset of manifest.assets) {
      if (this.assetsById.has(asset.id)) {
        throw new Error(
          `Cannot register asset "${asset.id}": ID already registered in another pack.`
        );
      }
      this.assetsById.set(asset.id, asset);
    }
  }

  /**
   * Retrieve an asset entry by its stable ID.
   * Throws a descriptive error with closest suggestions if not found.
   */
  public get(id: string): AssetManifestEntry {
    const asset = this.assetsById.get(id);
    if (!asset) {
      const allIds = Array.from(this.assetsById.keys());
      const suggestions = allIds
        .map((candidate) => ({
          id: candidate,
          distance: levenshteinDistance(id, candidate),
        }))
        .filter((item) => item.distance <= 4 || item.id.includes(id))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map((item) => `"${item.id}"`);

      const hint =
        suggestions.length > 0
          ? ` Did you mean: ${suggestions.join(', ')}?`
          : ` Available assets: ${allIds.slice(0, 5).join(', ')}${allIds.length > 5 ? '...' : ''}`;

      throw new Error(`Asset with ID "${id}" was not found in the registry.${hint}`);
    }
    return asset;
  }

  /**
   * Check whether an asset exists in the registry.
   */
  public has(id: string): boolean {
    return this.assetsById.has(id);
  }

  /**
   * Resolve an asset's path for Remotion staticFile().
   */
  public resolvePath(id: string): string {
    const asset = this.get(id);
    return asset.path;
  }

  /**
   * Filter assets by kind, category, tag, or styleFamily.
   */
  public filter(filter: AssetFilter): AssetManifestEntry[] {
    let results = Array.from(this.assetsById.values());

    if (filter.kind) {
      results = results.filter((a) => a.kind === filter.kind);
    }
    if (filter.category) {
      results = results.filter((a) => a.category === filter.category);
    }
    if (filter.styleFamily) {
      results = results.filter((a) => a.style.family === filter.styleFamily);
    }
    if (filter.tag) {
      const tagLower = filter.tag.toLowerCase();
      results = results.filter((a) =>
        a.tags.some((t) => t.toLowerCase() === tagLower)
      );
    }

    return results;
  }

  /**
   * Get all registered assets.
   */
  public getAll(): AssetManifestEntry[] {
    return Array.from(this.assetsById.values());
  }

  /**
   * Get all unique categories present in the registry.
   */
  public getCategories(): AssetCategory[] {
    const categories = new Set<AssetCategory>();
    for (const asset of this.assetsById.values()) {
      categories.add(asset.category);
    }
    return Array.from(categories);
  }

  /**
   * Get all unique tags present across assets.
   */
  public getTags(): string[] {
    const tags = new Set<string>();
    for (const asset of this.assetsById.values()) {
      for (const t of asset.tags) {
        tags.add(t);
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * Clear all registered assets.
   */
  public clear(): void {
    this.assetsById.clear();
    this.packManifests.clear();
  }
}

/** Global default registry singleton instance */
export const defaultAssetRegistry = new AssetRegistry();
