# PeerPro Shot Direction & Cinematic Intent Guide

## Overview

The **PeerPro Shot Direction and Cinematic Intent Subsystem** (`src/core/cinematography/`) allows animators and autonomous AI agents to express **why** a camera angle, framing, or movement is used—rather than forcing developers to guess and hardcode low-level pixel coordinates, zoom factors, and depth planes.

$$\text{ShotIntentSpec} \xrightarrow[\text{Automated Framing}]{\text{resolveCinematicIntent}} \text{FramingSolution} \xrightarrow[\text{Cinematic Rules}]{\text{validateShotComposition}} \text{DiagnosticReport}$$

---

## 1. Core Architecture

The subsystem consists of four core modules:

```
src/core/cinematography/
├── types.ts         # Shot intent contracts, screen regions, composition metrics
├── solver.ts        # Pure mathematical framing solver with director overrides
├── diagnostics.ts   # Headroom, lead room, safe areas, and scale validator
├── presets.ts       # Canonical shot intent presets (establishing, medium, close-up, OTS, reveal)
└── index.ts         # Unified barrel export
```

---

## 2. Shot Intent Taxonomy

PeerPro formalizes nine canonical cinematic shot intents:

| Shot Intent | Typical Scale | Focal Depth | Optics / DoF | Primary Creative Purpose |
|:---|:---|:---|:---|:---|
| **`establishing`** | $0.50\text{--}0.65$ | $1.10$ | Deep focus (DoF disabled) | Broad environmental staging, spatial context, location reveal. |
| **`wide`** | $0.80\text{--}0.95$ | $1.00$ | Deep focus or neutral | Full-body character in scene context; actor locomotion. |
| **`medium`** | $1.10\text{--}1.25$ | $0.95$ | Subtle DoF ($3.5\text{px}$) | Waist-up conversational dialogue; balancing character gestures with environment. |
| **`close_up`** | $1.45\text{--}1.65$ | $0.90$ | Shallow focus ($6.0\text{px}$) | Chest/head emotional intensity; facial expression nuances. |
| **`insert_detail`** | $1.75\text{--}2.00$ | $0.85$ | Shallow focus ($8.0\text{px}$) | Hand props, letters, phones, or fine interaction points. |
| **`over_the_shoulder`**| $1.10$ (primary), $1.35$ (sec) | $1.00$ (primary) | Foreground silhouette ($5.0\text{px}$) | Conversational depth balance between two staged characters. |
| **`reveal`** | $0.90$ | $1.00$ | Neutral / Dynamic | Panning camera movement unveiling a hidden subject. |
| **`follow`** | $0.95$ | $1.00$ | Tracking | Camera tracking keyed to character locomotion. |
| **`hold`** | $1.00$ | $1.00$ | Static | Static contemplation or dramatic pause. |

---

## 3. High-Level Intent Specification

An author or AI agent specifies a `ShotIntentSpec`:

```typescript
import { ShotIntentSpec, resolveCinematicIntent, validateShotComposition } from '../src/core/cinematography';

const intentSpec: ShotIntentSpec = {
  id: 'scene-01-dialogue',
  name: 'Medium Dialogue Shot',
  intent: 'medium',
  durationInFrames: 60,
  subject: {
    characterId: 'student-articulated',
    prominence: 'balanced',
    screenRegion: 'rule_of_thirds_left',
    lookDirection: 'screen_right',
  },
  negativeSpace: 'right',
  depthEmphasis: 'shallow_focus',
  emotionalTone: 'calm',
  cameraMotion: 'handheld_drift',
};

// Solve exact camera coordinates and subject staging
const solution = resolveCinematicIntent(intentSpec);
```

---

## 4. Director Overrides

Every parameter calculated by the framing solver can be overridden by explicit director choices without breaking the pipeline:

```typescript
const customSpec: ShotIntentSpec = {
  id: 'director-custom-shot',
  intent: 'medium',
  durationInFrames: 45,
  subject: {
    characterId: 'student-articulated',
  },
  overrides: {
    cameraPreset: 'tracking',
    zoom: 1.35,
    cameraPosition: { x: 40, y: -20 },
    subjectPosition: { x: 720, y: 890 },
    subjectScale: 1.25,
    depthOfField: { enabled: true, aperture: 2.2, maxBlur: 8.0 },
    shake: { enabled: true, frequency: 0.6, amplitudeX: 3.0 },
  },
};
```

---

## 5. Measurable Composition Diagnostics

PeerPro does not pretend to mathematically calculate subjective artistic emotion. Instead, `validateShotComposition` enforces **measurable, objective composition rules**:

1. **Headroom**:
   - Computes distance from the top of the subject's head to the canvas ceiling.
   - Flags an `error` if the head is clipped off the top edge ($Y < 0$).
   - Flags a `warning` if headroom exceeds $32\%$ in medium or close-up shots (excessive dead space).
2. **Lead Room (Nose Room)**:
   - When a character looks toward `screen_right`, verifies that the subject is positioned on the left side ($X < 65\%$), preserving negative space in front of their gaze.
   - Flags a `warning` if a character looks right while crowded against the right frame edge.
3. **Scale Mismatch**:
   - Flags a `warning` if a `close_up` is requested but the subject occupies $< 55\%$ of frame height.
   - Flags a `warning` if an `establishing` shot is requested but the subject dominates $> 50\%$ of frame height.
4. **Broadcast Safe Areas**:
   - Action Safe ($93\%$): Inset $3.5\%$ from canvas edges.
   - Title Safe ($90\%$): Inset $5.0\%$ from canvas edges.

---

## 6. CLI Inspection Tool

Validate and inspect shot intents directly from the command line:

```bash
# Inspect default wide establishing shot
npm run intent:inspect

# Inspect a specific preset
npx tsx scripts/inspect-cinematic-intent.ts --preset=medium-dialogue
npx tsx scripts/inspect-cinematic-intent.ts --preset=close-up-intimate

# Inspect custom JSON intent file
npx tsx scripts/inspect-cinematic-intent.ts path/to/intent.json --json
```

### Sample CLI Output:
```
================================================================================
 CINEMATIC SHOT COMPOSITION DIAGNOSTICS: preset-wide-establishing
 Status: ✅ VALID COMPOSITION | Composition Score: 100 / 100
================================================================================

--- MEASURABLE COMPOSITION METRICS ---
  * Headroom Ratio:       55.3%
  * Lead Room Ratio:      66.7%
  * Subject Height Ratio: 27.1%
  * Action Safe (93%):    Compliant
  * Title Safe (90%):     Compliant

--- ISSUES & SUGGESTED REMEDIES ---
  No composition defects detected. Framing complies with cinematic best practices.
================================================================================
--- SOLVED FRAMING PARAMETERS ---
  * Shot Intent:        ESTABLISHING
  * Camera Preset:      slow-push-in
  * Camera Zoom:        0.95x
  * Focal Depth:        1.1
  * DoF Enabled:        NO
  * Camera Shake:       NO
  * Primary Subject:    student-articulated
  * Subject Position:   (640px, 890px)
  * Subject Scale:      0.49
  * Target Headroom:    597.5px
  * Lead Room Vector:   RIGHT
================================================================================
```

---

## 7. Showcase Composition

The `CinematicIntentShowcase` (`src/compositions/CinematicIntentShowcase.tsx`) transitions across 3 distinct shots of the same character and classroom assets:
1. **Shot 1 (Frames 0–50)**: `wide_establishing` (deep focus, rule of thirds, environmental presence).
2. **Shot 2 (Frames 50–100)**: `medium_dialogue` (waist-up, handheld drift, balanced lead room).
3. **Shot 3 (Frames 100–150)**: `close_up_intimate` (shallow focus bokeh, upper-third eyeline alignment).

Render still proofs:
```bash
npm run render:intent:still
# Produces out/cinematic-intent-showcase.png
```
