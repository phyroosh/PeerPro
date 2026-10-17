# PeerPro — AI-Agent 2.5D Animation Playground

> **Code-first, frame-deterministic 2.5D animation toolkit built on Remotion, React, and TypeScript.**

PeerPro empowers autonomous AI coding agents and creative technologists to assemble expressive characters, compose modular multi-plane environments, apply virtual camera movements and depth parallax, and render frame-accurate videos directly on the local machine.

---

## Key Highlights

- **Pure Frame Determinism**: All animations, character breathing, stance sway, particle physics, and camera trajectories are pure mathematical functions of Remotion's `(frame, fps)` parameters. Zero clock drift, zero unseeded timers, 100% bit-for-bit SHA-256 reproducibility.
- **2.5D Multi-Plane Parallax**: Virtual camera motion (`pan-left-to-right`, `slow-push-in`, `tilt`, etc.) dynamically scales travel displacement and zoom relative to continuous depth planes ($z \in [0.1, 2.0]$).
- **Socket-Based Character Assembly**: Compose interchangeable anime characters from modular vector SVGs (body, head, hair, eyes, mouth) aligned deterministically using explicit socket-to-plug geometric attachment math.
- **Declarative JSON Scene Manifests**: Compose full narrative scenes in clean JSON manifests specifying camera trajectories, environment layouts, character placements, timed facial expression schedules, atmospheric effects, and subtitle cards.
- **Agent-First Introspection**: Autonomous AI directors can query system capabilities and schema definitions programmatically via `npm run agent:discover -- --json`.
- **Zero Heavy SaaS / 3D Engine Dependencies**: Runs locally in headless Chromium with Remotion; no Three.js, WebGL shaders, or paid cloud rendering APIs required.

---

## Directory Architecture

```
PeerPro/
├── asset-packs/
│   └── starter-kit/                  # Foundational anime & city vector asset pack
│       └── manifest.json             # Asset pack manifest adhering to JSON schema
├── docs/
│   ├── developer-guide.md            # Technical architecture, coordinate math & parallax physics
│   ├── agent-cookbook.md             # AI Agent recipes, JSON templates & prompting guide
│   ├── asset-contribution-guide.md   # SVG standards, anchor conventions & socket specs
│   ├── asset-index.md                # Generated markdown index of all assets
│   └── implementation-status.md      # Phase-by-phase implementation log
├── public/
│   └── peerpro-assets/               # Static vector SVGs served to Remotion compositions
├── scenes/
│   ├── agent-dialog-scene.json       # Golden master: Tokyo street encounter with dialog
│   └── rainy-street-encounter.json   # Golden master: Rainy neighborhood evening with slow push-in
├── schemas/                          # Draft 2020-12 JSON Schema specifications
│   ├── asset-manifest.schema.json
│   ├── character-definition.schema.json
│   └── scene-definition.schema.json
├── scripts/                          # Agent & developer CLI toolchain
│   ├── agent-discover.ts             # Capability introspection CLI (human & JSON output)
│   ├── inspect-scene.ts              # Scene manifest validation & timeline diagnostics
│   ├── render-scene.ts               # Standalone programmatic scene renderer
│   ├── verify-all.ts                 # Master 9-stage verification & regression suite
│   ├── build-asset-index.ts          # Catalog index generator
│   └── build-contact-sheet.ts        # Visual SVG contact sheet generator
├── src/
│   ├── compositions/                 # Remotion benchmark compositions
│   │   ├── PeerProSandbox.tsx        # Phase 2 runtime scaffold
│   │   ├── CharacterShowcase.tsx     # Phase 4 character assembly benchmark
│   │   ├── EnvironmentShowcase.tsx   # Phase 5 environment layout benchmark
│   │   └── ParallaxTest.tsx          # Phase 6 camera & multi-plane parallax benchmark
│   ├── core/                         # Core modular animation engine
│   │   ├── animation/                # Pure mathematical motion primitives & timers
│   │   ├── assets/                   # In-memory registry, resolver & validator
│   │   ├── camera/                   # Virtual 2.5D camera, presets & parallax solvers
│   │   ├── characters/               # Socket solver, presets & character component
│   │   ├── effects/                  # Mulberry32 deterministic particles (sakura, rain)
│   │   ├── environments/             # Layered depth environments & presets
│   │   └── scene/                    # Declarative SceneRenderer & canvas viewport
│   ├── Root.tsx                      # Remotion Root composition registrations
│   └── index.ts                      # Remotion CLI entrypoint
└── tests/
    ├── unit/                         # Unit tests (assets, characters, environments, camera, scene)
    └── e2e/                          # End-to-end smoke & render determinism tests
```

---

## Quickstart

### Prerequisites
- **Node.js**: v22.x or later
- **npm**: v10.x or later
- **FFmpeg**: Available on system PATH (for Remotion video encoding)
- **Google Chrome / Chromium**: Installed for headless rendering

### Installation
```bash
git clone https://github.com/phyroosh/PeerPro.git
cd PeerPro
npm install
```

### Full System Verification
Run the 9-stage verification suite to ensure all TypeScript compilation, unit tests, E2E tests, and asset validations pass cleanly:
```bash
npm run verify:all
```

### Interactive Preview in Remotion Studio
```bash
npm run dev
```
Opens Remotion Studio at `http://localhost:3000` to preview and scrub compositions frame-by-frame with real-time hot reloading.

---

## CLI Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launch interactive Remotion Studio web UI (`http://localhost:3000`). |
| `npm run build` | Perform TypeScript type-checking without emitting files (`tsc --noEmit`). |
| `npm test` | Execute complete test suite (40 unit and E2E integration tests). |
| `npm run verify:all` | Run the master 9-stage full system verification and regression runner. |
| `npm run agent:discover` | Introspect loaded assets, character presets, environments, and camera presets. |
| `npm run agent:discover -- --json` | Output machine-readable JSON capabilities payload for AI agents. |
| `npm run scene:inspect <path>` | Validate a declarative scene JSON file and print timeline statistics. |
| `npm run scene:render <file> <out>` | Programmatically render any scene manifest JSON directly to PNG or MP4. |
| `npm run render:scene:still` | Render golden master still frame (`out/scene-agent-test.png`). |
| `npm run render:scene:video` | Render golden master MP4 video (`out/scene-agent-test.mp4`). |
| `npm run assets:validate` | Validate asset manifests, paths, anchors, and directory safety. |
| `npm run assets:index` | Regenerate `schemas/asset-index.json` and `docs/asset-index.md`. |
| `npm run assets:contact-sheet` | Generate visual SVG contact sheet grid (`out/contact-sheet.svg`). |

---

## Autonomous AI Agent Workflow

Autonomous coding agents (or creative scripts) can direct animated scenes with a streamlined 4-step loop:

1. **Introspect Capabilities**:
   ```bash
   npm run agent:discover -- --json
   ```
2. **Author Scene Manifest**: Write a compliant JSON file under `scenes/` (refer to [`docs/agent-cookbook.md`](docs/agent-cookbook.md) for templates).
3. **Validate Scene**:
   ```bash
   npm run scene:inspect scenes/my-scene.json
   ```
4. **Render Output**:
   ```bash
   npm run scene:render scenes/my-scene.json out/my-scene.mp4
   ```

---

## Documentation

- **[Developer Guide](docs/developer-guide.md)**: Mathematical coordinate philosophy, socket solver equations, and 2.5D parallax physics.
- **[Agent Cookbook](docs/agent-cookbook.md)**: Prompting recipes, JSON templates, and dialogue timing recommendations for AI agents.
- **[Asset Contribution Guide](docs/asset-contribution-guide.md)**: SVG standards, anchor conventions, socket placement, and packaging rules.
- **[Asset Index](docs/asset-index.md)**: Complete catalog of all 18 starter vector assets.
- **[Implementation Status](docs/implementation-status.md)**: Detailed phase-by-phase execution log and acceptance records.

---

## License

MIT © 2026 PeerPro Team
