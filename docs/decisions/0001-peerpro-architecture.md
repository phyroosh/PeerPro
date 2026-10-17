# 0001. PeerPro Architecture & Interface Boundaries

## Context & Purpose

PeerPro is a local, modular, code-first 2.5D animation toolkit built on Remotion, React, and TypeScript. It is designed to empower an AI coding agent to compose characters, build environments, manipulate layers with anchors/pivots, apply deterministic camera movements and parallax, and render video scenes without requiring a rigid graphical user interface or a restrictive production DSL.

This Architecture Decision Record (ADR) establishes the system boundaries, data contracts, coordinate conventions, and validation strategy for PeerPro v1.

---

## 1. Core Architectural Boundaries

PeerPro is structured into four distinct layers with unidirectional data and dependency flow:

```
+-------------------------------------------------------------------+
| 1. PeerPro Skill (Agent Guidance)                                 |
|    - SKILL.md, references/*.md                                    |
|    - Rules, capability discovery index, usage patterns, QA checks |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 2. PeerPro Runtime (Core Capabilities)                            |
|    - Character assembler, environment compositor                  |
|    - Coordinate & transform math, attachment socket solver        |
|    - Deterministic camera presets, 2.5D parallax engine           |
|    - Runtime schemas & validators                                 |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 3. Asset Packs (Standardized Building Blocks)                     |
|    - Asset manifest (JSON) with IDs, anchors, attachment sockets   |
|    - Visual files (SVG, transparent PNG/WebP, React components)   |
|    - Style families, dimensions, license/provenance metadata      |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 4. Remotion Project (Rendering & Preview Environment)             |
|    - Remotion Root, compositions, sequences                      |
|    - Deterministic frame loop (`useCurrentFrame()`)               |
|    - Remotion Studio preview & CLI video/still rendering          |
+-------------------------------------------------------------------+
```

### Boundary Rules
1. **The Skill Teaches, Does Not Execute:** The skill layer (`SKILL.md`) documents available tools, IDs, conventions, and examples. It never invents unimplemented APIs.
2. **The Runtime Enables, Does Not Dictate:** The runtime provides reusable components (`<Character />`, `<Environment />`, `<Camera25D />`), but custom React composition is always a first-class citizen.
3. **Assets Are Self-Describing & Portable:** Asset packs declare their bounding box, anchors, attachment sockets, and provenance in an asset manifest. No asset relies on magical hardcoded offsets in renderer components.
4. **Remotion Is The Pure Execution Target:** All animations are frame-deterministic functions of `(frame, fps, props)`. Timers, CSS transitions, and unseeded randomness are strictly prohibited in the render pipeline.

---

## 2. Supported Asset Representations (v1)

PeerPro v1 supports three asset representations:

| Representation | Format / MIME | Use Cases | Ingestion / Rendering Mechanism |
|---|---|---|---|
| **Vector Assets** | `.svg` (`image/svg+xml`) | Character parts (hair, eyes, face, clothes), modular street props, signage, clean flat-style buildings. Scalable without pixelation. | Remotion `<Img src={staticFile(...)} />` or inline SVG parsing. |
| **Transparent Raster** | `.png`, `.webp` (`image/png`, `image/webp`) | Textured backgrounds, matte plates, hand-painted art assets with alpha transparency. | Remotion `<Img src={staticFile(...)} />` with alpha channel preserved. |
| **Procedural React** | `.tsx` component | Atmospheric effects (rain particles, drifting fog, dust motes, light glares). | Direct React component rendering driven by `useCurrentFrame()`. |

### Out of Scope for v1
- 3D polygon meshes (`.gltf`, `.glb`, `.obj`).
- Skeletal bone deformation / mesh skinning (Spine / Live2D runtime).
- Runtime AI image/video generation calls during the render loop.
- Audio synthesis or automated lip-sync engines.

---

## 3. Asset Manifest Contract

Every asset pack includes a `manifest.json` conforming to `schemas/asset-manifest.schema.json`.

### Asset Definition Schema
```typescript
export type AssetKind = 'character_part' | 'environment_layer' | 'prop' | 'effect';

export type AssetFormat = 'svg' | 'png' | 'webp' | 'component';

export interface AttachmentSocket {
  /** Socket coordinate relative to asset top-left (0,0) in asset design pixels */
  x: number;
  y: number;
  /** Optional rotation in degrees for child attachment orientation */
  rotation?: number;
}

export interface AssetManifestEntry {
  /** Stable unique identifier (e.g., "starter-char-head-01") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Primary role */
  kind: AssetKind;
  /** Specific sub-category */
  category: 
    | 'base_body' | 'head' | 'hair' | 'eyes' | 'mouth' | 'expression'
    | 'clothing' | 'arms' | 'accessory'
    | 'building' | 'facade' | 'road' | 'sidewalk' | 'sign' | 'foliage'
    | 'prop' | 'sky' | 'atmosphere';
  /** Path relative to asset root directory (e.g. "public/peerpro-assets/...") */
  path: string;
  /** File format */
  format: AssetFormat;
  /** Native dimensions in design pixels */
  dimensions: {
    width: number;
    height: number;
  };
  /** Whether the asset has alpha transparency */
  hasAlpha: boolean;
  /** Style family tag for visual compatibility checking */
  style: {
    family: string; // e.g. "anime-clean-v1", "urban-tokyo-v1"
    variant?: string;
  };
  /** Normalized pivot/anchor point [0.0 - 1.0], default is center (0.5, 0.5) */
  anchor: {
    x: number; // 0.0 = left, 0.5 = center, 1.0 = right
    y: number; // 0.0 = top, 0.5 = center, 1.0 = bottom
  };
  /** Sockets exposed by this asset for children to attach to */
  attachmentSockets?: Record<string, AttachmentSocket>;
  /** Sockets required by this asset on its parent to mount properly */
  requiredSockets?: string[];
  /** Capabilities supported by this asset */
  capabilities?: Array<'scalable' | 'tintable' | 'flip_x' | 'flip_y'>;
  /** Tags for fast discovery and filtering */
  tags: string[];
  /** Provenance and legal licensing metadata */
  provenance: {
    source: 'original' | 'licensed' | 'public-domain' | 'third-party';
    license: string; // e.g. "MIT", "CC-BY-4.0", "Custom"
    author: string;
    notes?: string;
  };
}
```

---

## 4. Character Definition Contract

A character is composed of modular parts assembled through attachment sockets and explicit layering.

```typescript
export interface CharacterPartSelection {
  assetId: string;
  /** Optional local transform override */
  offset?: { x?: number; y?: number };
  scale?: number;
  rotation?: number;
  opacity?: number;
}

export interface CharacterVariant {
  /** Variant name, e.g. "tired", "surprised", "smiling" */
  name: string;
  /** Part replacements for this variant */
  overrides: {
    eyes?: string;   // assetId
    mouth?: string;  // assetId
    hair?: string;   // assetId
    clothing?: string;
    arms?: string;
  };
}

export interface CharacterDefinition {
  id: string;
  name: string;
  styleFamily: string;
  /** Base root part (usually "base_body") */
  rootPart: CharacterPartSelection;
  /** Attached parts mapped by slot */
  slots: {
    head?: CharacterPartSelection;
    hairBack?: CharacterPartSelection;
    hairFront?: CharacterPartSelection;
    eyes?: CharacterPartSelection;
    mouth?: CharacterPartSelection;
    clothing?: CharacterPartSelection;
    armsLeft?: CharacterPartSelection;
    armsRight?: CharacterPartSelection;
    accessory?: CharacterPartSelection[];
  };
  /** Explicit render order back-to-front */
  layerOrder: string[]; // e.g. ["hairBack", "base_body", "clothing", "head", "eyes", "mouth", "hairFront", "accessory"]
  /** Named expression or pose variants */
  variants?: Record<string, CharacterVariant>;
  /** Default scale factor relative to scene units */
  defaultScale?: number;
}
```

---

## 5. Environment & Scene Layer Contract

An environment scene is composed of depth planes with explicit 2.5D coordinates, grouping, and optional deterministic motion presets.

```typescript
export interface LayerTransform {
  /** Canvas X coordinate (pixels) */
  x: number;
  /** Canvas Y coordinate (pixels) */
  y: number;
  /** Scale multiplier (default: 1.0) or [scaleX, scaleY] */
  scale?: number | [number, number];
  /** Rotation in degrees (default: 0) */
  rotation?: number;
  /** Opacity [0.0 - 1.0] (default: 1.0) */
  opacity?: number;
  /** Custom anchor override [0..1] */
  anchor?: { x: number; y: number };
}

export interface EnvironmentLayer {
  id: string;
  name?: string;
  /** References an asset in the manifest, or null if this is a group container */
  assetId?: string;
  /**
   * Depth value determining parallax reaction to camera moves:
   * depth < 1.0 : background (moves slower than camera, e.g. 0.2 = distant sky, 0.5 = distant buildings)
   * depth = 1.0 : midground focal plane (moves 1:1 with camera target)
   * depth > 1.0 : foreground (moves faster than camera, e.g. 1.5 = street lamps, 2.0 = framing foliage)
   */
  depth: number;
  /** Z-index within the depth plane (lower rendered behind higher) */
  order: number;
  /** Position and transformation */
  transform: LayerTransform;
  /** Optional deterministic animation preset */
  animationPreset?: 'gentle-sway' | 'drift-slow' | 'flicker-subtle';
  /** Child layers inheriting parent transform */
  children?: EnvironmentLayer[];
}

export interface EnvironmentScene {
  id: string;
  name: string;
  layers: EnvironmentLayer[];
}
```

---

## 6. Shared Coordinate Conventions

| Axis / Concept | Convention | Details |
|---|---|---|
| **Canvas Resolution** | 1920 x 1080 (16:9 standard) | Baseline design space. Remotion compositions default to 1920x1080 at 30 fps. |
| **Origin (0,0)** | Top-Left | `(0, 0)` is top-left of the canvas. `+X` extends rightward, `+Y` extends downward. |
| **Unit Convention** | Pixels (Primary) | Position vectors use pixel space `[0..1920, 0..1080]`. Utility functions provide `fromNormalized(nx, ny)` conversions. |
| **Anchor / Pivot** | Normalized `[0.0, 1.0]` | `(0, 0)` = top-left, `(0.5, 0.5)` = center, `(0.5, 1.0)` = bottom-center (standard for standing characters & ground props). |
| **Attachment Alignment** | Socket to Plug Math | `Child_Pos = Parent_Pos + Parent_Socket - Child_Socket_Origin`. |
| **2.5D Parallax Formula** | Relative to Focal Plane | For camera displacement `ΔC = (C_x, C_y)`: <br/> `Layer_Screen_Pos = Layer_Base_Pos - ΔC * (depth / focalDepth)`. |
| **Overscan Bleed** | 15% Minimum Bleed | Parallax layers must extend at least 15% beyond viewport bounds to prevent edge gaps during camera movement. |

---

## 7. Validation Strategy

1. **Schema Authority**: The canonical schemas reside in `/schemas/`:
   - `schemas/asset-manifest.schema.json`
   - `schemas/character-definition.schema.json`
   - `schemas/scene-definition.schema.json`
2. **Runtime Validation**:
   - In TypeScript runtime (`src/core/validation/`), validation is performed with actionable diagnostics returning:
     ```typescript
     export interface ValidationResult {
       valid: boolean;
       errors: Array<{
         path: string;
         code: 'MISSING_FILE' | 'DUPLICATE_ID' | 'INVALID_SOCKET' | 'STYLE_MISMATCH' | 'OUT_OF_BOUNDS';
         message: string;
       }>;
     }
     ```
   - An invalid asset or missing socket stops the build with specific file paths and IDs instead of silently failing or misaligning graphics.

---

## 8. MVP Scope Matrix

### In Scope for MVP (v1)
- Structured asset manifests with validation of IDs, dimensions, anchors, sockets, and licenses.
- Modular character assembly using SVG parts, socket attachment, and expression variants.
- Modular 2.5D environment builder with grouped layers and explicit depth planes.
- Camera25D presets: static, slow push-in, slow pull-out, lateral pan, subtle tracking.
- Parallax engine with bounded displacement and overscan safety.
- Single Japanese street benchmark scene demonstrating full integration.
- Full frame-determinism test suite and Remotion render CLI workflow.

### Deferred to v2
- Cutout skeletal rig integration with inverse kinematics.
- Multi-scene timeline transitions and audio synchronization.
- Dynamic color-palette theming across asset packs.
- Automated contact-sheet HTML preview.

### Explicitly Out of Scope
- True 3D mesh rendering or WebGL shaders.
- Generative AI asset generation during scene rendering.
- Lip-sync phoneme mapping.
- Graphical timeline/node UI editor.
