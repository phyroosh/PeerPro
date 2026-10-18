# PeerPro Character Performance & Rig Architecture Guide

## Overview

The **PeerPro Character Performance System** (`src/core/characters/rigs/`) transitions character authoring from static part assembly into **directed, cinematic performance**.

Rather than imposing an unrealistic universal skeleton across diverse 2D anime and cutout art styles, PeerPro formalizes **Rig Profiles**. Each character declares or infers an anatomy-aligned rig profile with strict **Joint Limits** and **Capability Flags**.

---

## 1. The Four Formal Rig Profiles

| Rig Profile | Typical Shot Framing | Required Part Slots | Primary Movable Joints | Supported Capabilities |
|:---|:---|:---|:---|:---|
| **`face_only`** | Close-Up / Portrait | `head`, `eyes`, `mouth` | `headTilt` (±15°), `eyeGazeX`, `eyeGazeY` | `gaze_direction`, `micro_blink`, `head_tilt`, `speech_visemes`, `expression_variant` |
| **`upper_body_cutout`** | Medium Shot / Conversational | `rootPart`, `head`, `eyes`, `mouth`, `armsLeft`, `armsRight` | `headTilt` (±15°), `armLeft` ([-45°, 120°]), `armRight` ([-45°, 120°]), `torsoTilt` ([-10°, 25°]) | All face capabilities + `breathing`, `arm_rotation`, `arm_gesture`, `root_motion` |
| **`full_body_cutout`** | Wide Shot / Action | `rootPart`, `head`, `eyes`, `mouth`, `armsLeft`, `armsRight`, `legsLeft`, `legsRight` | All upper-body joints + `legLeft` ([-45°, 60°]), `legRight` ([-45°, 60°]) | All upper-body capabilities + `leg_stride`, `walk_cycle` |
| **`pose_swapped`** | Monolithic / Fixed Illustration | `rootPart`, `head` | `headTilt` (±5°) | `pose_swap`, `expression_variant`, `micro_blink`, `root_motion`, `speech_visemes` |

---

## 2. Anti-Separation Joint Limits

To prevent physical detachment, tearing, or unnatural hyper-extension during animated performance, all rotational joints are clamped to calibrated physiological boundaries:

$$\theta_{\text{effective}} = \max\left(\theta_{\min}, \min\left(\theta_{\max}, \theta_{\text{raw}}\right)\right)$$

### Calibrated Safety Boundaries

```
• Head Tilt:        [-15°, +15°]  (rest: 0°)
• Shoulder Left:    [-45°, +120°] (rest: 0°)
• Shoulder Right:   [-45°, +120°] (rest: 0°)
• Torso Tilt:       [-10°, +25°]  (rest: 0°)
• Leg Left Stride:  [-45°, +60°]  (rest: 0°)
• Leg Right Stride: [-45°, +60°]  (rest: 0°)
```

If an animation clip or procedural generator requests an angle beyond these limits, the evaluator automatically clamps the angle, logs the incident in `clampedJoints`, and flags `isClamped = true` without breaking frame execution.

---

## 3. Starter Action Clip Library

The system bundles 10 reusable, deterministic animation clips in `STARTER_ACTION_LIBRARY`:

| Clip ID | Name | Duration | Supported Rig Profiles | Primary Motion / Curves |
|:---|:---|:---:|:---|:---|
| **`neutral_idle`** | Neutral Idle | 60f (2.0s) | All 4 profiles | Subtle breathing oscillation ($1.5\text{px}$) and micro-head tilt ($\pm 0.8^\circ$). |
| **`look_left_right`** | Look Left/Right | 45f (1.5s) | All 4 profiles | Smooth horizontal gaze shift ($-4^\circ \to +4^\circ$) with smoothstep easing. |
| **`look_up_down`** | Look Up/Down | 45f (1.5s) | All 4 profiles | Vertical gaze elevation shift ($+5^\circ \to -3^\circ \to 0^\circ$). |
| **`micro_blink`** | Micro Blink | 30f (1.0s) | All 4 profiles | 4-frame physiological eyelid closure (`starter-char-eyes-wink-v2`). |
| **`breathing_subtle`** | Subtle Breathing | 60f (2.0s) | `upper_body_cutout`, `full_body_cutout` | Harmonic chest translation ($2.2\text{px}$) and scale squash/stretch ($1.006$). |
| **`head_turn_small`** | Small Head Turn | 45f (1.5s) | `face_only`, `upper_body_cutout`, `full_body_cutout` | Conversational $+7.5^\circ$ head turn with smooth anticipation and settle. |
| **`arm_gesture_wave`** | Arm Wave | 60f (2.0s) | `upper_body_cutout`, `full_body_cutout` | Harmonic sinusoidal waving at $3.0\text{Hz}$ ($\approx 14^\circ \pm 16^\circ$). |
| **`arm_gesture_present`** | Present Gesture | 60f (2.0s) | `upper_body_cutout`, `full_body_cutout` | Forward explanatory presentation angle ($+22^\circ$) on left arm. |
| **`sit_stand_swap`** | Sit/Stand Swap | 30f (1.0s) | `pose_swapped`, `full_body_cutout` | Discrete pose transition with $-60\text{px}$ vertical baseline translation. |
| **`walk_cycle_simple`** | Walk Cycle | 30f (1.0s) | `full_body_cutout` (Exclusive) | Bipedal leg stride ($\pm 26^\circ$) and arm counter-swing ($\pm 18^\circ$). |

---

## 4. Multi-Clip Blending & Crossfading

When multiple performance clips overlap across a scene timeline, the evaluator calculates normalized blend weights:

$$w_i(t) = \text{smoothstep}\left(\frac{t - t_{\text{start}}}{\text{blendIn}}\right) \cdot \left[1 - \text{smoothstep}\left(\frac{t - (t_{\text{end}} - \text{blendOut})}{\text{blendOut}}\right)\right]$$

- **Continuous Properties** (joint angles, root $X/Y$, scale): Blended linearly via $\sum \frac{w_i}{W_{\text{total}}} \cdot V_i$.
- **Discrete Properties** (part overrides, eye expression cues, pose swaps): Selected from the dominant clip with $\max(w_i)$.

---

## 5. Explicit Incompatibility Reporting

In accordance with Phase 24 Task 7, **unsupported movements are reported explicitly**:
If an agent or composition attempts to play `walk_cycle_simple` on a character with `face_only` or `upper_body_cutout` rig profiles, `validateRigCompatibility()` returns `compatible: false` and emits structured error messages:

```
Character "student-articulated" (rig: "upper_body_cutout") cannot perform clip "walk_cycle_simple".
Supported profiles: full_body_cutout.
Missing capabilities: walk_cycle, leg_stride.
```

---

## 6. CLI Diagnostics & Inspection Tooling

Inspect any character rig and verify action compatibility via the CLI:

### 1. Directory of All Rigs
```bash
npm run rig:inspect
```

### 2. Inspect Character Presets
```bash
npm run rig:inspect -- student-articulated
```

### 3. Simulate and Evaluate Specific Action Clips
```bash
npm run rig:inspect -- student-articulated --clip=arm_gesture_wave
```

### 4. JSON Output for AI Agent Pipelines
```bash
npm run rig:inspect -- student-articulated --json
```

---

## 7. Visual Rig Inspection Showcase

The visual test composition `RigPreviewShowcase` displays all three active rig profiles side-by-side with live telemetry and visual overlays:
- **Green Crosshairs**: Shoulder socket pivots and live rotation readouts.
- **Blue Rings**: Opposing limb socket attachments.
- **HUD Telemetry Cards**: Active clips, joint limits, and zero-detachment safety checks.

Render a still preview at frame 45:
```bash
npx remotion still RigPreviewShowcase out/rig-preview-showcase.png --frame=45
```
