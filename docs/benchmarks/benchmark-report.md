# PeerPro Benchmark & Visual Regression Report

- **Generated At**: `2026-10-18T05:06:42.036Z`
- **Environment**: Node.js `v22.23.1` / Linux
- **Total Benchmarks**: `10`
- **Visual Regression Status**: `10/10 PASSED` (0 failures)
- **Average Render Latency**: `3981ms / still frame`
- **Total Suite Execution Time**: `39.82s`

## Standard Benchmark Scorecard

| Benchmark ID | Name | Composition | Frame | Render Time | Ceiling | Latency | Visual Status | Golden SHA-256 Baseline |
|:-------------|:-----|:------------|:-----:|:-----------:|:-------:|:-------:|:-------------:|:------------------------|
| **B1_CHARACTER** | Character Builder & Socket Hierarchy | `CharacterShowcase` | `30` | `3723ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `0fb9d7c38572...` |
| **B2_ENVIRONMENT** | Multi-Plane Environment Grammar | `EnvironmentShowcase` | `40` | `3685ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `61af6c54583c...` |
| **B3_PARALLAX** | 2.5D Parallax Camera & Particles | `ParallaxTest` | `60` | `4159ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `e3175b11886e...` |
| **B4_STYLE** | 2-Tier Cel-Shading & Perspective | `StyleShowcase` | `60` | `3816ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `72bd8a98e75d...` |
| **B5_CUTOUT** | Articulated Cutout Forward Kinematics | `CutoutRigShowcase` | `60` | `3709ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `710dd12c103f...` |
| **B6_CLASSROOM** | Indoor Classroom Grammar & Furniture | `ClassroomShowcase` | `60` | `3978ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `eb40fa3d8873...` |
| **B7_ACTION** | 11-Action Vocabulary & Blend Trees | `ActionShowcase` | `52` | `4601ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `2cf33c230dc3...` |
| **B8_CINEMATOGRAPHY** | Multi-Shot Sequence & Optical Bokeh | `CinematicSequenceShowcase` | `105` | `4100ms` | `<6000ms` | ⚡ PASS | ✅ PASS | `3ccdd06b47cc...` |
| **B9_AGENT** | AI Agent Scene Manifest & Composition | `AgentScene` | `45` | `3907ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `af549297de12...` |
| **B10_AUDIO** | Audio Narrative & Viseme Lip-Sync | `AudioNarrativeShowcase` | `45` | `4136ms` | `<5000ms` | ⚡ PASS | ✅ PASS | `d8f1e2778dbc...` |

## Benchmark Descriptions & Capabilities Tested

### `B1_CHARACTER`: Character Builder & Socket Hierarchy
- **Composition**: `CharacterShowcase` (Frame: `30`)
- **Category**: `character`
- **Scope**: Validates 4 modular character presets, socket alignment, depth-order, and blink cycles.
- **Latency Budget**: Max `5000ms`

### `B2_ENVIRONMENT`: Multi-Plane Environment Grammar
- **Composition**: `EnvironmentShowcase` (Frame: `40`)
- **Category**: `environment`
- **Scope**: Validates Tokyo street corner parallax planes, sky gradients, and building layer hierarchy.
- **Latency Budget**: Max `5000ms`

### `B3_PARALLAX`: 2.5D Parallax Camera & Particles
- **Composition**: `ParallaxTest` (Frame: `60`)
- **Category**: `parallax`
- **Scope**: Validates multi-plane camera projection math, HUD coordinate overlays, and floating sakura particles.
- **Latency Budget**: Max `5000ms`

### `B4_STYLE`: 2-Tier Cel-Shading & Perspective
- **Composition**: `StyleShowcase` (Frame: `60`)
- **Category**: `style`
- **Scope**: Validates high-fidelity line weights, cast shadows, eye catchlights, and 3/4 angle styling.
- **Latency Budget**: Max `5000ms`

### `B5_CUTOUT`: Articulated Cutout Forward Kinematics
- **Composition**: `CutoutRigShowcase` (Frame: `60`)
- **Category**: `rigging`
- **Scope**: Validates hierarchical bone transforms, torso/head/arm/leg rotations, and secondary overlap motion.
- **Latency Budget**: Max `5000ms`

### `B6_CLASSROOM`: Indoor Classroom Grammar & Furniture
- **Composition**: `ClassroomShowcase` (Frame: `60`)
- **Category**: `environment`
- **Scope**: Validates indoor blackboard, student desks, wooden floor perspective, and window natural lighting.
- **Latency Budget**: Max `5000ms`

### `B7_ACTION`: 11-Action Vocabulary & Blend Trees
- **Composition**: `ActionShowcase` (Frame: `52`)
- **Category**: `animation`
- **Scope**: Validates Japanese polite bow action, anticipation curves, Hermite easing, and settling physics.
- **Latency Budget**: Max `5000ms`

### `B8_CINEMATOGRAPHY`: Multi-Shot Sequence & Optical Bokeh
- **Composition**: `CinematicSequenceShowcase` (Frame: `105`)
- **Category**: `cinematography`
- **Scope**: Validates shot transitions, letterbox bars, circle of confusion depth-of-field, and handheld drift.
- **Latency Budget**: Max `6000ms`

### `B9_AGENT`: AI Agent Scene Manifest & Composition
- **Composition**: `AgentScene` (Frame: `45`)
- **Category**: `agent`
- **Scope**: Validates declarative JSON scene execution, dialogue overlays, and auto-correct visual composition.
- **Latency Budget**: Max `5000ms`

### `B10_AUDIO`: Audio Narrative & Viseme Lip-Sync
- **Composition**: `AudioNarrativeShowcase` (Frame: `45`)
- **Category**: `audio`
- **Scope**: Validates speech cadence viseme mouth switching, multi-track audio meters, and volume ducking indicators.
- **Latency Budget**: Max `5000ms`
