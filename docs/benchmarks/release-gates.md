# PeerPro Release Gates & Benchmark Architecture

PeerPro is built on a non-negotiable engineering foundation: **100% mathematical frame-determinism**.
Because animations in PeerPro are generated code-first for AI-driven pipelines, visual drift or silent layout regressions degrade agent predictability. To safeguard quality, PeerPro employs a two-tier verification architecture:
1. **The 10 Standard Benchmarks Suite (`npm run benchmark`)**: Validates visual regression via pixel-exact SHA-256 checksums and enforces render latency ceilings across all creative subsystems.
2. **The Pre-Release Gatekeeper (`npm run release:gate`)**: An automated 7-stage release pipeline that must achieve 100% PASS before any version or feature is deemed release-ready.

---

## 1. The 10 Standard PeerPro Benchmarks

The benchmark suite covers the full vertical stack of PeerPro animation capabilities. Each benchmark targets a canonical composition at a designated frame:

| Benchmark ID | Composition | Frame | Category | Latency Budget | Creative Capabilities Tested |
|:---|:---|:---:|:---|:---:|:---|
| **`B1_CHARACTER`** | `CharacterShowcase` | 30 | `character` | $<5000\text{ms}$ | Modular character presets (Ren, Aoi, Kenji, Sakura), 5-level socket hierarchies, 2-tier cel-shading, eye blink cycles, and depth-order z-indexing. |
| **`B2_ENVIRONMENT`** | `EnvironmentShowcase` | 40 | `environment` | $<5000\text{ms}$ | Multi-plane Tokyo street corner environment grammar, procedural gradient sky, background buildings, midground street elements, and foreground props. |
| **`B3_PARALLAX`** | `ParallaxTest` | 60 | `parallax` | $<5000\text{ms}$ | 2.5D camera projection matrices, depth-based lateral displacement, HUD camera telemetry overlay, and floating wind-drift sakura particles. |
| **`B4_STYLE`** | `StyleShowcase` | 60 | `style` | $<5000\text{ms}$ | High-fidelity vector lines, 2-tier cel-shade highlights and shadows, eye specular catchlights, and multi-angle 3/4 perspective alignment. |
| **`B5_CUTOUT`** | `CutoutRigShowcase` | 60 | `rigging` | $<5000\text{ms}$ | Articulated cutout rig forward kinematics (FK), hierarchical bone transforms, torso/head/limb rotation pivots, and secondary motion overlap. |
| **`B6_CLASSROOM`** | `ClassroomShowcase` | 60 | `environment` | $<5000\text{ms}$ | Indoor room grammar, blackboard and window natural lighting, wooden floor perspective horizon, and depth-sorted student desks. |
| **`B7_ACTION`** | `ActionShowcase` | 52 | `animation` | $<5000\text{ms}$ | 11-action vocabulary, Japanese polite bow (`bow-formal`), anticipation squash-and-stretch, Hermite cubic easing curves, and settling physics. |
| **`B8_CINEMATOGRAPHY`** | `CinematicSequenceShowcase` | 105 | `cinematography` | $<6000\text{ms}$ | Multi-shot cinematic sequence orchestration, 2.39:1 Cinemascope letterbox bars, circle of confusion (CoC) depth-of-field bokeh, and handheld camera drift. |
| **`B9_AGENT`** | `AgentScene` | 45 | `agent` | $<5000\text{ms}$ | Declarative JSON scene manifest execution (`agent-dialog-scene.json`), dialog speech overlays, and auto-correct visual composition grounding. |
| **`B10_AUDIO`** | `AudioNarrativeShowcase` | 45 | `audio` | $<5000\text{ms}$ | Speech cadence viseme mouth switching, multi-track audio mixing, live audio meters, and automated background music (BGM) ducking indicators. |

---

## 2. Visual Regression Hashing Protocol

### Golden SHA-256 Checksums
Unlike approximate image comparison algorithms (e.g. perceptual hash or SSIM) which allow subtle rendering drift, PeerPro enforces exact SHA-256 cryptographic matching of still frame buffers:
$$\text{Checksum} = \text{SHA-256}(\text{PNG Output Buffer})$$

All golden baselines are recorded in [`src/core/benchmark/baselines.json`](../../src/core/benchmark/baselines.json).

### Running Benchmarks
Execute the full benchmark suite:
```bash
npm run benchmark
```

To run a specific subset of benchmarks:
```bash
npx tsx scripts/run-benchmarks.ts --benchmarks=B1_CHARACTER,B10_AUDIO
```

To update golden baselines when intentional artistic or geometric asset changes are introduced:
```bash
npm run benchmark -- --update-baselines
```

The runner automatically updates [`docs/benchmarks/benchmark-report.md`](./benchmark-report.md) with full latency metrics and pass/fail scorecards.

---

## 3. The 7 Pre-Release Gates

Before tagging a release, merging a PR, or cutting a build, all 7 gates must pass sequentially:

```
[Gate 1] TypeScript Zero-Error Compilation
         └── Command: npm run build (tsc --noEmit)
         └── Criteria: 0 type errors across all src/ and scripts/

[Gate 2] Full Unit Test Suite
         └── Command: npx tsx --test tests/unit/**/*.test.ts
         └── Criteria: 100% of unit tests pass across all subsystems

[Gate 3] Asset Catalog & Geometry Contracts
         └── Command: npm run assets:validate
         └── Criteria: All 44 vector assets comply with viewBox, sockets, and schema

[Gate 4] Visual Asset Contact Sheet Generation
         └── Command: npm run assets:contact-sheet
         └── Criteria: Generates out/contact-sheet.svg without errors

[Gate 5] AI Agent Introspection & Capabilities
         └── Command: npx tsx scripts/agent-discover.ts
         └── Criteria: Validates discovery graph for autonomous agent tool use

[Gate 6] AI Composition Analysis & Quality Metrics
         └── Command: npx tsx scripts/analyze-scene.ts scenes/agent-dialog-scene.json
         └── Criteria: Evaluates headroom, grounding, framing, and depth score >= 90/100

[Gate 7] 10-Benchmark Suite & Visual Regression
         └── Command: npm run benchmark
         └── Criteria: All 10 benchmarks match golden SHA-256 baselines within latency budgets
```

### Running the Release Gatekeeper
Execute the unified release gatekeeper command:
```bash
npm run release:gate
```

If any gate fails, execution immediately halts, outputs diagnostic logs, and exits with code `1`. When all 7 gates pass, the CLI outputs a green confirmation banner and exits with code `0`.
