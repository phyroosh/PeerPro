# PeerPro Environment Layout & World Composition Guide

## Overview

The **PeerPro World Composition Subsystem** (`src/core/environments/`) expands environment construction from hand-authored, static backdrop layer arrays into **reusable, spatially coherent worlds**.

Rather than requiring agents or developers to manually calculate and guess absolute pixel coordinates for every building, sign, tree, desk, and prop, Phase 26 introduces:
1. **Kit Specifications**: Formal contracts declaring view conventions, ground lines, scale conventions, and allowed camera motion.
2. **Reusable Prefabs**: Self-contained architectural modules (storefront clusters, residential blocks, street furniture rows, classroom desk grids).
3. **Procedural Layout Engine**: Rule-guided placement engine powered by a deterministic 32-bit PRNG (`mulberry32`) for reproducible variation from numeric seeds.
4. **Semantic Layout Directives**: High-level spatial rules (`leave_center_clear`, `align_to_ground`, `linear_spacing`, `foreground_frame`).
5. **Layout Validation Suite**: Strict verification of perspective compatibility, ground contact alignment, canvas coverage, and actor clearance.

---

## 1. Kit Specifications (`kits.ts`)

Each environment kit formalizes the spatial grammar of an indoor or outdoor world domain:

```typescript
export interface EnvironmentKitDefinition {
  id: string;
  name: string;
  domain: 'outdoor' | 'indoor' | 'hybrid';
  description: string;
  viewConvention: 'front_orthographic' | '2.5d_stage' | 'cinematic_three_quarter';
  perspectiveFamily: string;
  groundLineY: number;
  supportedDepths: { min: number; max: number; focalPlane: number };
  scaleConvention: number;
  allowedCameraDirections: ('pan_x' | 'truck_z' | 'pedestal_y')[];
  backdrop: { skyAssetId?: string; groundAssetId?: string; wallAssetId?: string; defaultBgColor: string };
  tags: string[];
}
```

### Canonical Starter Kits
| Kit ID | Domain | Ground Line ($Y$) | Depth Range | Camera Motion | Purpose |
|:---|:---:|:---:|:---:|:---:|:---|
| **`japanese-street-kit`** | Outdoor | $880\text{px}$ | $[0.2, 1.6]$ | `pan_x`, `truck_z`, `pedestal_y` | 2.5D Japanese street, commercial corner, residential alley. |
| **`classroom-kit`** | Indoor | $890\text{px}$ | $[0.3, 1.4]$ | `pan_x`, `pedestal_y` | High school classroom, teacher podium, student desk grids. |

---

## 2. Reusable Prefab Library (`prefabs.ts`)

Prefabs bundle related assets, relative transforms, depth offsets, and variants into cohesive architectural units:

| Prefab ID | Associated Kit | Dimensions | Default Depth | Description & Included Assets |
|:---|:---|:---:|:---:|:---|
| **`prefab-storefront-cluster`** | `japanese-street-kit` | $560 \times 540\text{px}$ | $1.0$ | Building facade (`building-facade-01`) + overhead conbini sign (`conbini-sign`) + entrance vending machine (`vending-machine`). |
| **`prefab-residential-block`** | `japanese-street-kit` | $620 \times 620\text{px}$ | $0.95$ | Apartment building facade (`building-facade-02`) + blooming cherry tree (`tree-cherry`) + sidewalk streetlight (`streetlight`). |
| **`prefab-street-furniture-pair`** | `japanese-street-kit` | $340 \times 420\text{px}$ | $1.05$ | Sidewalk cherry blossom tree + streetlamp fixture pair for rhythmic repetition. |
| **`prefab-classroom-desk-cluster`** | `classroom-kit` | $320 \times 320\text{px}$ | $1.0$ | Student desk (`classroom-desk`) + student chair (`classroom-chair`) with sandwich occlusion (`chair < desk`). |
| **`prefab-classroom-podium`** | `classroom-kit` | $800 \times 600\text{px}$ | $0.5$ | Front chalkboard (`classroom-blackboard`) + teacher lectern (`classroom-lectern`) + wall clock (`classroom-clock`). |

---

## 3. Procedural Layout Engine & Seeded Variation (`layout.ts`)

The layout engine compiles a `WorldCompositionConfig` into a standard `EnvironmentDefinition` using a seeded PRNG (`mulberry32`):

```typescript
import { composeEnvironment } from './layout';

const { environment, telemetry } = composeEnvironment({
  id: 'tokyo-commercial-hub',
  name: 'Tokyo Commercial Corner',
  kitId: 'japanese-street-kit',
  seed: 101, // Reproducible seed
  placements: [
    {
      prefabId: 'prefab-storefront-cluster',
      x: 480,
      directives: [{ type: 'align_to_ground' }, { type: 'leave_center_clear' }],
    },
    {
      prefabId: 'prefab-street-furniture-pair',
      x: 1480,
      directives: [{ type: 'align_to_ground' }, { type: 'leave_center_clear' }],
    },
  ],
  globalDirectives: [{ type: 'leave_center_clear', minX: 760, maxX: 1160 }],
});
```

### Semantic Layout Directives
1. **`leave_center_clear`**: Automatically shifts occluding buildings, trees, or furniture away from the hero character corridor ($X \in [760, 1160]$).
2. **`align_to_ground`**: Snaps entities' ground contact baselines directly to `kit.groundLineY` ($880\text{px}$ or $890\text{px}$).
3. **`linear_spacing`**: Spaces repeated assets along an axis with optional deterministic jitter.
4. **`grid_spacing`**: Arranges multi-row furniture (e.g. classroom desks) with aisle gaps.
5. **`foreground_frame`**: Positions framing silhouettes (branches, lamp posts) at the outer margins of the frame.

---

## 4. Layout Validation Suite (`validator.ts`)

```typescript
import { validateEnvironmentLayout } from './validator';

const report = validateEnvironmentLayout(environment, kit, {
  clearanceZone: { minX: 760, maxX: 1160 },
  strictGroundCheck: true,
});

if (!report.valid) {
  console.error('Layout validation failed:', report.errors);
}
```

### Validation Checks:
- **Perspective & Style Compatibility**: Detects and reports mismatched art style families or incompatible projection angles.
- **Ground Baseline Consistency**: Verifies that grounded objects touch within $\pm 25\text{px}$ of the kit ground line.
- **Canvas Coverage**: Ensures backdrop layers fully span the $1920 \times 1080$ viewport without empty border voids.
- **Actor Clearance Zone**: Validates that no foreground or occluding layer intrudes into the hero staging corridor.

---

## 5. Diagnostic CLI Inspection Tool

Run the environment layout inspector:

```bash
npm run env:inspect
```

### Verified Output:
```
======================================================================
       PeerPro Environment Layout & World Composition Inspector
======================================================================

📦 Registered Environment Kits:
  • [japanese-street-kit] "Japanese Street & City Kit" (domain: outdoor, ground: 880px, depths: [0.2 - 1.6])
  • [classroom-kit] "Japanese High School Classroom Kit" (domain: indoor, ground: 890px, depths: [0.3 - 1.4])

🏛️ Registered Reusable Prefabs:
  • [prefab-storefront-cluster] "Convenience Storefront Cluster" (560x540px, defaultDepth: 1, variants: vending-left, vending-right, no-vending)
  • [prefab-residential-block] "Residential Apartment Block" (620x620px, defaultDepth: 0.95, variants: tree-left)
  • [prefab-street-furniture-pair] "Street Furniture Fixture Pair" (340x420px, defaultDepth: 1.05, variants: none)
  • [prefab-classroom-desk-cluster] "Classroom Desk & Chair Unit" (320x320px, defaultDepth: 1, variants: none)
  • [prefab-classroom-podium] "Teaching Podium & Blackboard Zone" (800x600px, defaultDepth: 0.5, variants: none)

----------------------------------------------------------------------
🏙️ Composing Environment Layout A (Seed: 101, Tokyo Commercial)...
   Generated Layers: 7
   Depths Used: [0.2, 1, 1.05]
   Clearance Zone Clean: ✅ YES
   Ground Contact Valid: ✅ YES
   Validation: ✅ VALID (Warnings: 0, Errors: 0)

----------------------------------------------------------------------
🏘️ Composing Environment Layout B (Seed: 202, Tokyo Residential)...
   Generated Layers: 8
   Depths Used: [0.2, 0.95, 1, 1.10]
   Clearance Zone Clean: ✅ YES
   Ground Contact Valid: ✅ YES

----------------------------------------------------------------------
🔬 Verifying Deterministic Reproducibility...
   Reproducibility Test (Seed 101 run 1 vs run 2): ✅ 100% BIT-FOR-BIT IDENTICAL
======================================================================
```

---

## 6. Visual Showcase Composition

The `WorldCompositionShowcase` composition (`src/compositions/WorldCompositionShowcase.tsx`) renders two distinct, coherent locations from the shared `japanese-street-kit`:
- **Left (Location A, Seed 101)**: Commercial Hub with convenience store, neon sign, vending machine, cherry tree, and streetlamp.
- **Right (Location B, Seed 202)**: Residential Courtyard with multi-story apartment, courtyard cherry tree, streetlight, and left-aligned vending machine.

Both viewports feature hero character placement in the verified clearance corridor ($X = 960$, $Y = 910$).

Render proof still:
```bash
npx remotion still WorldCompositionShowcase out/world-composition-showcase.png --frame=30
```
