# PeerPro Implementation Status

## Current Status Overview
- **Active Phase**: Phase 14 — Environment Kits and World-Building Grammar (Completed)
- **Overall Status**: **PHASE 14 DELIVERED & FULLY VERIFIED (58/58 TESTS PASSING)**
- **Last Updated**: 2026-10-17

---

## Phase Log

### Phase 0 — Repository Reconnaissance and Technical Audit
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Scope & Constraints Verified**: Target directory `/home/phyroosh/PeerPro` inspected; clean toolchain and git origin established.

---

### Phase 1 — Architecture and Interface Contracts
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**: ADR 0001, JSON Schemas (`asset-manifest`, `character-definition`, `scene-definition`), coordinate conventions reference, and sample fixtures.

---

### Phase 2 — Remotion Runtime Scaffold and First Deterministic Scene
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**: Remotion runtime, `SceneCanvas.tsx`, `PeerProSandbox.tsx` composition, still and video renders verified with bit-for-bit SHA256 determinism.

---

### Phase 3 — Asset Registry, Manifest, and Validation Tools
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**: Asset manifest types, Zod schemas, pure read-only validator, `AssetRegistry`, 10 starter vector assets, CLI scripts, and 11 unit tests.

---

### Phase 4 — Composable Character Builder
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**: Character types, Zod schemas, attachment socket solver (`neck`, `eyes`, `mouth`, `hair`), `Character.tsx` component, student presets, starter kit expansion (13 assets), `CharacterShowcase.tsx` composition, and 4 unit tests.

---

### Phase 5 — Modular Environment Builder
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**:
  - `src/core/environments/types.ts`: TypeScript interfaces for `EnvironmentDefinition`, `EnvironmentLayer`, `LayerTransform`, and depth plane metadata.
  - `src/core/environments/schema.ts`: Runtime Zod schemas validating layer transforms, depth factors, and hierarchical grouping.
  - `src/core/environments/Environment.tsx`: React/Remotion component with pre-render asset validation, hierarchical group rendering, anchor-to-pixel offset calculation, and depth-based ordering.
  - `src/core/environments/presets.ts`: Two distinct environment layouts composed from the same asset kit:
    - `japaneseStreetCornerPreset`: Busy commercial corner with 24H conbini, neon sign, vending machine, apartment, framing cherry tree, and streetlight.
    - `japaneseQuietStreetPreset`: Peaceful residential street with central courtyard sakura tree, streetlight, apartment facade, and close-up foreground vending machine.
  - Japanese Street Kit Expansion: 5 new original vector SVGs (`sky-dusk.svg`, `building-facade-02.svg`, `conbini-sign.svg`, `tree-cherry.svg`, `vending-machine.svg`), bringing the starter pack to 18 verified assets.
  - `src/compositions/EnvironmentShowcase.tsx`: Remotion composition sequencing and transitioning between both environment layouts with character integration.
  - `tests/unit/environment-builder.test.ts`: 5 unit tests verifying preset validation, missing asset detection (including in nested children), and structural differentiation.
- **Commands Run & Verified**:
  - `npm test`: 20/20 unit tests passed in 619ms.
  - `npm run build`: 0 TypeScript compiler errors.
  - `npm run assets:validate`: 18/18 assets verified across starter kit.
  - `npm run render:env:corner`: Rendered `out/env-corner.png` (frame 40) in 362ms.
  - `npm run render:env:quiet`: Rendered `out/env-quiet.png` (frame 120) in 340ms.
  - `npm run render:env:video`: Rendered `out/environment-showcase.mp4` (160 frames, 5.33s, 357 kB) in 5.77s.
  - SHA256 checksum comparison: Confirmed identical hash `9f087405465befdedd4cb959b61bc64453e460c70986f8205490a41f6497b20a` across separate renders of frame 40.
- **Known Limitations**:
  - Reusable camera motion presets and 2.5D parallax displacement are scheduled for implementation in Phase 6.

---

### Phase 6 — Animation, Camera, and Parallax Toolkit
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**:
  - `src/core/animation/types.ts`: TypeScript contracts for `BreathingOptions`, `HeadAngleOptions`, `ExpressionKeyframe`, `EasingType`, and `KeyframePoint`.
  - `src/core/animation/primitives.ts`: Pure, deterministic mathematical functions (`computeOscillation`, `computeBreathing`, `computeHeadTilt`, `resolveExpressionSchedule`, `lerp`, `clamp`).
  - `src/core/animation/index.ts`: Barrel export for animation primitives and types.
  - `src/core/camera/types.ts`: TypeScript contracts for `CameraConfig`, `CameraState`, `CameraBounds`, and `CameraPresetName` (`static`, `slow-push-in`, `slow-pull-out`, `pan-left-to-right`, `pan-right-to-left`, `tilt-up`, `tilt-down`, `tracking`, `custom`).
  - `src/core/camera/presets.ts`: Frame-deterministic camera solver with smoothstep easing, intensity scaling, and strict displacement/zoom bounding safety.
  - `src/core/camera/parallax.ts`: Pure mathematical multi-plane 2.5D parallax calculator (`computeParallax`) scaling displacement and zoom relative to focal depth ($z = 1.0$).
  - `src/core/camera/Camera25D.tsx`: React Context provider supplying frame-deterministic virtual camera state to descendant layers and effects.
  - `src/core/camera/index.ts`: Barrel export for camera modules.
  - `src/core/effects/DriftingPetals.tsx`: Deterministic sakura particle system powered by Mulberry32 PRNG and dynamic 2.5D camera parallax tracking with safe toroidal wrapping.
  - `src/core/effects/RainEffect.tsx`: Deterministic directional rain streak system with 2.5D camera parallax responsiveness.
  - `src/core/effects/index.ts`: Barrel export for atmospheric visual effects.
  - `src/core/environments/Environment.tsx`: Enhanced layer rendering to calculate depth-scaled parallax against active `Camera25D` context.
  - `src/compositions/ParallaxTest.tsx`: Full-featured benchmark composition (1920x1080 @ 30fps, 120 frames) integrating virtual camera motion, 6-plane depth environment, hero character breathing/sway/expression scheduling, drifting petals, and real-time telemetry HUD.
  - `tests/unit/animation-and-camera.test.ts`: 9 unit tests verifying camera presets, intensity suppression, monotonic progression, safety bounding, parallax depth scaling, breathing oscillation, head tilt limits, and expression scheduling.
- **Commands Run & Verified**:
  - `npm test`: 29/29 unit tests passed in 812ms.
  - `npm run build`: 0 TypeScript compiler errors (`tsc --noEmit`).
  - `npm run render:parallax:start`: Rendered `out/parallax-start.png` (frame 0) in 357ms.
  - `npm run render:parallax:mid`: Rendered `out/parallax-mid.png` (frame 60) in 345ms.
  - `npm run render:parallax:end`: Rendered `out/parallax-end.png` (frame 119) in 336ms.
  - `npm run render:parallax:video`: Rendered `out/parallax-test.mp4` (120 frames, 4.0s, 1.2 MB) in 6.67s.
  - SHA-256 Bit-for-bit Determinism: Confirmed identical hash `e3175b11886e15e6d09f1ae452ed065547d3e4dec83c3d6cb517a8babc140ee5` across independent renders of frame 60.
- **Known Limitations**:
  - High-level declarative JSON Scene Manifest format and agent discovery/introspection CLI tools will be established in Phase 7.

---

### Phase 7 — Agent-Facing Scene APIs and Discoverability
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**:
  - `src/core/scene/types.ts`: TypeScript contracts for declarative `SceneManifest`, `SceneCanvasConfig`, `SceneCameraConfig`, `SceneEnvironmentConfig`, `SceneCharacterInstance`, `SceneEffectConfig`, and `SceneDialogLine`.
  - `src/core/scene/schema.ts`: Robust runtime Zod validation schemas with cross-field refinements (`SceneManifestSchema`).
  - `src/core/scene/validator.ts`: Comprehensive semantic validator verifying schema conformance, environment presets, character presets, variant availability, expression asset presence in registry, and timeline bounds.
  - `src/core/scene/SceneRenderer.tsx`: Core agent scene interpreter rendering declarative JSON scenes into Remotion compositions, complete with camera parallax, multi-plane depth layering, character placement, breathing bobbing, stance sway, expression scheduling, atmospheric particle effects, and high-contrast subtitle/dialog overlays.
  - `src/core/scene/index.ts`: Barrel export for scene engine.
  - `scenes/agent-dialog-scene.json`: Agent-composed sample scene featuring two characters (Ren & Kai) exchanging dialogue, dynamic camera pan, breathing, expressions, and drifting cherry blossoms.
  - `scripts/agent-discover.ts`: CLI introspection tool (`--json` and formatted mode) exposing all assets, categories, tags, character presets, environment presets, camera presets, and schema templates for AI agent consumption.
  - `scripts/inspect-scene.ts`: CLI diagnostics tool validating scene manifests and printing structured timeline stats.
  - `scripts/render-scene.ts`: Standalone CLI rendering tool enabling programmatic still and video generation directly from scene JSON files.
  - `tests/unit/scene-manifest.test.ts`: 7 unit tests verifying valid scene manifest validation, detection of unknown environment presets, unknown character presets, invalid variants, duplicate character IDs, missing expression assets, and timeline timeline contradictions.
- **Commands Run & Verified**:
  - `npm test`: 36/36 unit tests passed in 718ms.
  - `npm run build`: 0 TypeScript compiler errors (`tsc --noEmit`).
  - `npm run agent:discover`: Verified human-readable registry capabilities summary.
  - `npm run agent:discover -- --json`: Verified structured JSON output with 18 assets, 11 categories, 2 characters/variants, and 9 camera presets.
  - `npm run scene:inspect scenes/agent-dialog-scene.json`: Successfully validated and inspected agent dialogue scene.
  - `npm run render:scene:still`: Rendered `out/scene-agent-test.png` (frame 45) in 356ms.
  - `npm run render:scene:video`: Rendered `out/scene-agent-test.mp4` (120 frames, 4.0s, 1.3 MB) in 6.50s.
  - `npm run scene:render scenes/agent-dialog-scene.json out/scene-cli-test.png -- --frame 45`: Verified CLI programmatic renderer.
  - SHA-256 Bit-for-bit Determinism: Confirmed identical hash `e0b0cf26354e2d78a2042614cfd32f996ffba02d97812a116f68b1081b26435f` across independent renders of frame 45.
- **Known Limitations**:
  - End-to-end integration test suite and golden master benchmark videos covering all character variants and layouts are scheduled for Phase 8.

---

### Phase 8 — End-to-End Integration and Smoke Scenes
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**:
  - `tests/e2e/render-smoke.test.ts`: Automated integration test runner querying all Remotion compositions (`PeerProSandbox`, `CharacterShowcase`, `EnvironmentShowcase`, `ParallaxTest`, `AgentScene`), validating non-empty file generation, verifying PNG magic bytes (`89 50 4E 47 0D 0A 1A 0A`), and asserting bit-for-bit SHA-256 frame determinism.
  - `scripts/verify-all.ts`: Master 9-stage verification and regression CLI runner (`npm run verify:all`) checking TypeScript build, unit tests, E2E smoke tests, asset catalog validation, asset index documentation, contact sheet generation, and multi-scene inspection.
  - `scenes/rainy-street-encounter.json`: Golden master scene fixture demonstrating `RainEffect` (75 streaks), `slow-push-in` camera, `japanese-quiet-street` preset, Kai in streetwear hoodie, and timed dialogue.
  - `out/rainy-scene-test.png` & `out/rainy-scene-test.mp4`: Verified golden master outputs rendered via `scene:render`.
  - `schemas/asset-index.json` & `docs/asset-index.md`: Refreshed catalog metadata covering all 18 vector assets across 11 categories.
  - `out/contact-sheet.svg`: Visual contact sheet artifact illustrating all 18 starter kit assets.
- **Commands Run & Verified**:
  - `npm test`: 40/40 tests passed in 26.24s (36 unit tests + 4 end-to-end smoke & determinism tests).
  - `npm run verify:all`: All 9/9 verification stages passed in 34.95s.
  - `npm run scene:render scenes/rainy-street-encounter.json out/rainy-scene-test.png -- --frame 45`: Rendered still frame in 330ms.
  - `npm run scene:render scenes/rainy-street-encounter.json out/rainy-scene-test.mp4`: Rendered 120-frame (4.0s) video in 5.22s (1.6 MB).
  - Multi-Composition Determinism: Confirmed identical SHA-256 hashes on successive renders across `AgentScene` frame 50 and frame 45.
- **Known Limitations**:
  - Developer documentation, agent prompting cookbooks, and asset contribution guides are scheduled for Phase 9.

---

### Phase 9 — Developer Documentation, Cookbooks, and Agent Guides
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created**:
  - `docs/developer-guide.md`: Comprehensive engineering architecture document detailing:
    - Pure frame-deterministic mathematical philosophy.
    - Full Cartesian screen coordinate space ($1920 \times 1080$) and depth space ($z \in [0.1, 2.0]$).
    - Exact socket-to-plug geometric alignment equations.
    - Multi-plane 2.5D parallax physics equations ($\Delta X(z)$, $\Delta Y(z)$, $\text{Scale}(z)$) and focal plane dynamics ($z_{\text{focal}} = 1.0$).
    - Camera smoothstep easing, intensity scaling, and safety overscan bleed strategies.
    - Pure mathematical animation primitives (`computeBreathing`, `computeHeadTilt`, `resolveExpressionSchedule`).
    - Deterministic particle systems via seeded Mulberry32 PRNG and toroidal wrapping.
  - `docs/agent-cookbook.md`: Dedicated guide for autonomous AI agents and coding assistants:
    - The 4-step autonomous director loop (Discover $\to$ Compose $\to$ Inspect $\to$ Render).
    - Quick reference for character presets, variant names, facial expression IDs, environment presets, and camera presets.
    - Two production-tested JSON recipes (Conversational Street Encounter, Atmospheric Rainy Solo Walk).
    - Rules of thumb for ground alignment ($y \approx 920$), character facing (`flipX`), subtitle timing, and depth staging.
  - `docs/asset-contribution-guide.md`: Asset packaging and contribution guide for artists and agents:
    - SVG vector design standards (XML `viewBox`, transparent alpha, no raster embeds, no font dependencies).
    - Normalized anchor conventions ($([0..1], [0..1])$) across body, head, face, facade, and sky categories.
    - Formal socket/plug naming taxonomy (`neck`, `neck_socket`, `eyes`, `mouth`, `hair`).
    - Asset pack manifest authoring and automated validation/indexing toolchain.
  - `README.md`: Polished, production-ready front page with architecture tree, feature highlights, quickstart instructions, full CLI reference table, agent workflow, and documentation links.
- **Commands Run & Verified**:
  - `npm run verify:all`: 9/9 verification stages passed cleanly.
  - `npm test`: 40/40 tests passed cleanly.
  - `npm run build`: 0 TypeScript compiler errors (`tsc --noEmit`).
- **Known Limitations**:
  - None. All phase objectives achieved.

---

### Phase 10 — Release Readiness, Packaging, and Final Sign-Off
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts & Actions**:
  - `package.json`: Hardened release metadata including repository origin (`https://github.com/phyroosh/PeerPro.git`), MIT license, descriptive keywords, and verified dependency tree (pinned exact `zod: 4.5.4` matching Remotion runtime requirements).
  - Clean Repository Audit: Checked `.gitignore` (`node_modules/`, `out/`, `.remotion/`, `dist/`, `.DS_Store`, `*.log`); verified zero extraneous scratch scripts or untracked artifacts.
  - Package Integrity: Ran `npm pack --dry-run` confirming 93 files, clean tarball size of 75.9 kB (unpacked 319.7 kB) without any leakage of node_modules, logs, or intermediate renders.
  - Full System Regression: Executed master 9-stage verification runner `npm run verify:all` passing 100% across TypeScript compilation, 40 unit and integration tests, asset validator, index docs, visual contact sheet, and multi-scene inspections.
  - Bit-for-Bit Determinism: Cryptographic SHA-256 verification confirmed frame-exact reproducibility across independent renders.
- **Constraints & Compliance Audit**:
  - [x] Local, code-first architecture: Remotion + React + TypeScript in Node v22.
  - [x] No 3D engines (Three.js) or external SaaS: 100% pure 2.5D layered vector geometry.
  - [x] Pure mathematical frame-determinism: All motion functions of `frame`, `fps`, and seeded Mulberry32 PRNG.
  - [x] Modular characters: Socket-to-plug geometric attachment math with variant overrides.
  - [x] Modular environments: Multi-plane depth parallax scaling with overscan bleed safety.
  - [x] Declarative scene manifests: Agent-facing JSON manifest system, Zod validator, and CLI suite.
  - [x] Remote tracking: Active GitHub repository synchronized with `origin/main`.
- **Known Limitations**:
  - None. System is fully operational, verified, and release-ready.

---

### Phase 11 — Reality Check, Visual Audit, and Baseline Benchmark
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts & Actions**:
  - `docs/roadmap/next-moves-roadmap.md`: Formally integrated the next-moves roadmap guiding post-V1 improvements across Phases 11–18.
  - `scripts/audit-adversarial.ts`: Authored and executed an adversarial edge-case audit testing missing asset IDs, socket incompatibilities, unknown environment presets, and camera boundary overscan clamping.
  - `docs/quality/peerpro-v1-audit.md`: Published comprehensive reality check separating Toolkit Quality (Grade A - robust, deterministic, tested) from Art Quality (Grade C+ - flat vector geometry, frontal only, prototype assets).
  - Evaluated against 6 Target Use Cases: Character assembly/continuity (PASS), modular environments (PASS), cinematic parallax (PASS), interior bedroom scene (PARTIAL - asset gap), multi-shot sequences (PARTIAL - usability gap), and error diagnostics (PASS).
  - Evaluated performance and reproducibility: 100% SHA-256 frame-exact reproducibility, 40/40 tests passing, 33s master verification suite, 75.9 kB package footprint.
- **Identified Focus for Phase 12**:
  - High-appeal character asset pack with richer line work, subtle gradients, and consistent anime aesthetic.
  - Multi-angle character perspective foundations (3/4 view, side profiles).
  - Ground plane contact shadows and depth occlusion enhancements.
- **Known Limitations**:
  - None. Baseline audit successfully completed.

---

### Phase 12 — Asset Quality, Compatibility, and Style System
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created & Upgrades**:
  - `src/core/assets/types.ts` & `src/core/assets/schema.ts`: Added `AssetViewAngle = 'front' | 'three_quarter' | 'profile' | 'back'`, `AssetLighting = 'neutral' | 'daylight' | 'sunset' | 'night'`, and updated `AssetStyle` interface with angle/lighting validation.
  - `schemas/asset-manifest.schema.json`: Formal JSON Schema updated with new view angle and lighting properties.
  - `src/core/characters/solver.ts`: Enhanced solver with `verifyAngleCompatibility` and `strictAngle` flag in `SolverOptions`. Detects and throws actionable errors on angle mismatches (e.g. connecting a front head to a 3/4 turned body).
  - `src/core/characters/Character.tsx`: Integrated ground contact shadow (`showShadow = true`, default) rendered directly beneath character feet via radial gradient, anchoring characters firmly to the pavement without floating.
  - Production Anime Asset Kit (12 new assets, 30 total):
    - `public/peerpro-assets/starter/shadow-contact-oval.svg`: Radial gradient ground shadow.
    - `public/peerpro-assets/starter/head-01-v2.svg`: Refined anime head with tapered chin, soft cheek blush, ear helix details, and jawline cel-shadow.
    - `public/peerpro-assets/starter/body-01-v2.svg`: Refined blazer uniform with 2-tier cel-shading, lapels, tie clip, cuff accents, and articulated hand anatomy.
    - `public/peerpro-assets/starter/eyes-neutral-v2.svg` & `eyes-wink-v2.svg`: High-appeal multi-layer anime eyes with iris luminescence, specular highlights, and eyelid fold.
    - `public/peerpro-assets/starter/mouth-smile-v2.svg`: Refined anime smile with dimples and lower lip shadow.
    - `public/peerpro-assets/starter/hair-short-v2.svg`: Layered bangs with specular angel ring halo sheen.
    - `public/peerpro-assets/starter/body-01-three-quarter.svg`: 3/4 perspective school blazer with turned torso.
    - `public/peerpro-assets/starter/head-01-three-quarter.svg`: 3/4 perspective head contour with turned jawline.
    - `public/peerpro-assets/starter/eyes-three-quarter.svg`: Stereoscopic foreshortened 3/4 anime eyes.
    - `public/peerpro-assets/starter/hair-three-quarter.svg`: Swept 3/4 anime hair.
    - `public/peerpro-assets/starter/mouth-three-quarter.svg`: 3/4 perspective mouth.
  - `src/core/characters/presets.ts`: Added `studentCharacterDefinitionV2` (V2 cel-shaded) and `studentThreeQuarterDefinition` (3/4 perspective).
  - `src/compositions/StyleShowcase.tsx`: Remotion benchmark composition side-by-side comparing V1 flat prototype vs V2 cel-shaded production vs V2 3/4 perspective staging.
  - `tests/unit/asset-style-and-angle.test.ts`: 5 comprehensive unit tests verifying 30 asset loading, 3/4 filtering, V2 character solving, 3/4 character solving, angle mismatch detection, and non-strict override.
  - `out/style-showcase.png` & `out/style-showcase.mp4`: Verified rendered outputs.
- **Commands Run & Verified**:
  - `npm test`: 45/45 tests passed (100%).
  - `npm run verify:all`: All 9/9 verification stages passed in 50.12s.
  - `npm run render:style:still`: Rendered `out/style-showcase.png` (frame 60) in 547ms.
  - `npm run render:style:video`: Rendered `out/style-showcase.mp4` (120 frames, 4.0s, 916 kB) in 5.90s.
  - `npm run assets:validate`: 30/30 assets verified across starter kit.
- **Known Limitations**:
  - Full jointed limb cutout rigging (arm articulation, walking gestures) is scheduled for Phase 13.

---

### Phase 13 — Character Continuity and Cutout-Rig Foundation
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created & Upgrades**:
  - `src/core/characters/types.ts`:
    - Added `pivot?: { x: number; y: number }` to `ResolvedCharacterPart` for forward-kinematic socket pivoting.
    - Defined `CharacterPoseName = 'idle' | 'talk_gesture' | 'wave' | 'point' | 'thinking' | 'crossed'`.
    - Defined `CharacterJointRotations` (`armLeft`, `armRight`, `headTilt`).
    - Defined `CharacterIdentity` contract for multi-shot cross-scene persistence.
    - Extended `CharacterProps` to accept declarative `pose` and `jointRotations`.
  - Articulated Cutout Vector Assets (6 new original assets, expanding starter kit from 30 to 36 assets):
    - `public/peerpro-assets/starter/body-01-torso-v2.svg`: Torso blazer with rounded shoulder joints (`shoulder_left: { x: 72, y: 128 }`, `shoulder_right: { x: 228, y: 128 }`).
    - `public/peerpro-assets/starter/arm-01-left-idle.svg`: Left resting arm with white cuff & anime hand (`shoulder_socket: { x: 40, y: 20 }`).
    - `public/peerpro-assets/starter/arm-01-right-idle.svg`: Right resting arm (`shoulder_socket: { x: 40, y: 20 }`).
    - `public/peerpro-assets/starter/arm-01-right-wave.svg`: Raised forearm waving gesture (`shoulder_socket: { x: 30, y: 175 }`).
    - `public/peerpro-assets/starter/arm-01-right-point.svg`: Extended pointing arm (`shoulder_socket: { x: 25, y: 60 }`).
    - `public/peerpro-assets/starter/arm-01-left-bent-talk.svg`: Conversational gesturing arm (`shoulder_socket: { x: 75, y: 25 }`).
  - `src/core/characters/poses.ts`:
    - `resolveCharacterPose(pose, styleFamily)`: Maps poses to slot overrides and base joint angles.
    - `computeArmWave(frame, fps, options)`: Frame-deterministic sinusoidal FK arm oscillation.
  - `src/core/characters/solver.ts`:
    - Solves `armsLeft` and `armsRight` using `rootAsset.attachmentSockets` and `armAsset.attachmentSockets.shoulder_socket`.
    - Pinned pivot calculation: `pivot = { x: childPlug.x, y: childPlug.y }` guarantees zero socket detachment during rotation.
    - Head tilt rotation with neck socket pivot linking facial features.
    - Additive forward-kinematic rotation layering (`partRef.rotation + poseRotation + options.jointRotations`).
  - `src/core/characters/Character.tsx`:
    - Pinned transform origin: `transformOrigin: part.pivot ? \`${part.pivot.x}px ${part.pivot.y}px\` : 'center center'`.
    - Accepts declarative `pose` and `jointRotations`.
  - `src/core/characters/continuity.ts`:
    - `CharacterContinuityRegistry`: Stores persistent character identities.
    - `createShotCharacterConfig(identity, context)`: Resolves shot framing multipliers, facing directions, and expression/pose continuity across multi-shot sequences.
  - `src/core/characters/presets.ts`:
    - Added `studentArticulatedDefinition` (`student-articulated`) preset with modular cutout rig layers (`['armsLeft', 'rootPart', 'armsRight', 'head', 'eyes', 'mouth', 'hairFront']`).
  - `src/compositions/CutoutRigShowcase.tsx`:
    - Registered in Remotion root (`CutoutRigShowcase`).
    - Visualizes 3 acting states: Conversational Acting (`talk_gesture`), Real-time Harmonic Waving (`wave` with sinusoidal `computeArmWave` FK oscillator), and Directive Pointing (`point`).
  - `tests/unit/cutout-rig.test.ts`:
    - 8 comprehensive unit tests covering shoulder socket math, layer ordering, pose resolvers, asset switching, FK rotations, wave oscillator determinism, continuity registry, and shot config generator.
  - `out/cutout-showcase.png` & `out/cutout-showcase.mp4`:
    - Verified still frame and video renders with pixel-perfect socket connections.
- **Commands Run & Verified**:
  - `npm test`: 53/53 tests passed (100%).
  - `npm run verify:all`: All 9/9 verification stages passed in 36.59s.
  - `npm run render:cutout:still`: Rendered `out/cutout-showcase.png` in 477ms.
  - `npm run render:cutout:video`: Rendered `out/cutout-showcase.mp4` in 6.03s.
  - `npm run assets:validate`: 36/36 assets verified across starter kit.
- **Known Limitations**:
  - Enclosed indoor environments and room grammar are addressed in Phase 14.

---

### Phase 14 — Environment Kits and World-Building Grammar
- **Status**: COMPLETED
- **Date**: 2026-10-17
- **Key Artifacts Created & Upgrades**:
  - `src/core/environments/types.ts`:
    - Added `EnvironmentDomain = 'outdoor' | 'indoor' | 'hybrid'`.
    - Added `EnvironmentLayerPlane = 'background' | 'mid_back' | 'character_occluder' | 'foreground'`.
    - Defined `RoomGrammar` interface (`wallDepth`, `floorBaselineY`, `ceilingTrimY`, `perspectiveVanishingPoint`).
    - Extended `EnvironmentDefinition` with optional `domain` and `grammar`.
    - Extended `EnvironmentLayer` with optional `plane`.
  - `src/core/environments/schema.ts`:
    - Added runtime Zod validation for `EnvironmentDomain`, `RoomGrammarSchema`, and `plane`.
  - `src/core/environments/Environment.tsx`:
    - Updated z-index resolution to boost `character_occluder` plane layers (`zIndex >= 55`), guaranteeing natural occlusion of characters behind foreground furniture (e.g. desks, podiums).
  - High-Appeal Indoor Classroom Vector Asset Kit (8 new original vector assets, expanding starter kit from 36 to 44 assets):
    - `public/peerpro-assets/starter/env-classroom-wall.svg`: $1920 \times 1080$ classroom wall with wood wainscoting paneling, upper cream plaster, and ceiling molding.
    - `public/peerpro-assets/starter/env-classroom-floor.svg`: $1920 \times 380$ perspective wood plank flooring ($Y = 700 \to 1080$).
    - `public/peerpro-assets/starter/env-classroom-blackboard.svg`: $720 \times 320$ green chalkboard with wood frame, chalk tray, erased marks, and geometry diagrams.
    - `public/peerpro-assets/starter/env-classroom-window.svg`: $480 \times 500$ multi-pane window with sunny sky, fluffy clouds, and blooming cherry tree branch.
    - `public/peerpro-assets/starter/env-classroom-desk.svg`: $240 \times 300$ Japanese student desk with oak laminate surface, tubular metal legs, and book basket.
    - `public/peerpro-assets/starter/env-classroom-chair.svg`: $160 \times 260$ matching student chair with contoured plywood seat and backrest.
    - `public/peerpro-assets/starter/env-classroom-lectern.svg`: $200 \times 360$ wooden teacher presentation podium with document rest.
    - `public/peerpro-assets/starter/env-classroom-clock.svg`: $120 \times 120$ school wall clock showing 3:15 PM with metallic bezel.
  - `asset-packs/starter-kit/manifest.json`:
    - Registered all 8 indoor assets with categories, anchors, tags (`indoor`, `classroom`), and anime style metadata (Pack v1.5.0, 44 assets).
    - Regenerated `schemas/asset-index.json`, `docs/asset-index.md`, and `out/contact-sheet.svg`.
  - `src/core/environments/presets.ts`:
    - Added `japaneseClassroomPreset` with room grammar (`floorBaselineY: 890`, `wallDepth: 0.35`, `ceilingTrimY: 42`), perspective floor, wall fixtures, teacher podium, student chair, and occluding foreground desk.
  - `src/compositions/ClassroomShowcase.tsx`:
    - Remotion benchmark composition registered in `src/Root.tsx`.
    - Demonstrates indoor scene staging: Teacher Ren lecturing at podium (left) and Student Ren answering question behind student desk (right) with natural waist occlusion.
  - `tests/unit/environment-kits.test.ts`:
    - 5 comprehensive unit tests verifying schema validation, room grammar boundaries, layer plane segregation, occlusion ordering, asset existence, and multi-domain compatibility.
  - `out/classroom-showcase.png` & `out/classroom-showcase.mp4`:
    - Verified still frame and video renders with authentic Japanese classroom atmosphere and flawless layer occlusion.
- **Commands Run & Verified**:
  - `npm test`: 58/58 tests passed (100%).
  - `npm run verify:all`: All 9/9 verification stages passed in 49.74s.
  - `npm run render:classroom:still`: Rendered `out/classroom-showcase.png` in 453ms.
  - `npm run render:classroom:video`: Rendered `out/classroom-showcase.mp4` in 9.38s.
  - `npm run assets:validate`: 44/44 assets verified across starter kit.
- **Known Limitations**:
  - Reusable character animation actions, timeline action sequencing, and transitions are scheduled for Phase 15.






