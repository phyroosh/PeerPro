# PeerPro Character–Object Interaction Toolkit Guide

## Overview

The **PeerPro Character–Object Interaction Subsystem** (`src/core/interactions/`) solves a fundamental challenge in 2D animation: **meaningful physical relationships between characters and environment objects/props**.

Rather than introducing non-deterministic rigid-body physics engines or requiring tedious frame-by-frame coordinate guessing, PeerPro uses **pure mathematical Forward-Kinematic (FK) affine transform propagation**:

$$\mathbf{T}_{\text{prop}}(t) = \mathbf{T}_{\text{char}}(t) \times \mathbf{T}_{\text{part}}(t) \times \mathbf{T}_{\text{handSocket}} \times \mathbf{T}_{\text{propGrip}}^{-1}$$

This guarantees **zero drift ($0.00\text{px}$)** across arbitrary arm gestures, breathing oscillations, camera scales, and frame rates.

---

## 1. Supported Interaction Types

PeerPro formalizes seven bounded interaction primitives:

| Interaction Type | Primary Purpose | Character Anchor | Target / Prop Anchor | Layering Default |
|:---|:---|:---|:---|:---|
| **`hold_prop`** | Continuous hand locking during arm waving or locomotion | `hand_right` / `hand_left` | `grip` / custom socket | `in_front_of` (z:125) or `behind` (z:40) |
| **`pick_up`** | Smooth transition from surface resting transform into hand grip | `hand_right` / `hand_left` | `grip` | Dynamic: transitions to character carrier |
| **`set_down`** | Smooth release from hand grip back to surface resting transform | `hand_right` / `hand_left` | `grip` | Dynamic: transitions to ground/table |
| **`sit_at_seat`** | Hip alignment to furniture seat surface with sandwich occlusion | `seat_base` | `seat_surface` | Chair (z:40) < Character (z:60) < Desk (z:90) |
| **`look_at`** | Gaze and head-tilt orientation tracking towards target | `gaze_target` / `eye_level` | Object center / face | N/A (angular transform) |
| **`point_toward`** | Arm pointing vector calculation aimed at interest point | `hand_right` / `hand_left` | Object center | Character layer order |
| **`pass_object`** | Seamless transfer of object between two interacting characters | `hand_right` (Passer) | `grip` | Dynamic handoff at transition midpoint |

---

## 2. Dynamic Anchor Resolution & Forward Kinematics

Anchors in PeerPro are not static pixel coordinates—they respond dynamically to active joint rotations and bodily oscillations:

### Character Sockets
- **`hand_right` / `hand_left`**: Calculated relative to shoulder socket $(x_{\text{shoulder}}, y_{\text{shoulder}})$, rotated by the active arm joint angle $\theta_{\text{arm}}$, and translated by torso breathing displacement $\Delta y_{\text{breath}}$.
- **`seat_base`**: Hip baseline anchor aligned with seating surfaces.
- **`eye_level` / `gaze_target`**: Elevated face socket responding to neck position and head tilt.

### Prop & Furniture Sockets (`KNOWN_PROP_ANCHORS`)
```typescript
export const KNOWN_PROP_ANCHORS: Record<string, Record<string, { x: number; y: number }>> = {
  'starter-prop-umbrella': {
    grip: { x: 160, y: 280 }, // Handle socket
    tip: { x: 160, y: 20 },   // Canopy tip
  },
  'starter-env-classroom-chair': {
    seat_surface: { x: 80, y: 140 }, // Flat seating cushion
    backrest: { x: 80, y: 40 },
  },
  'starter-env-classroom-desk': {
    surface: { x: 160, y: 80 },  // Desk writing surface
    shelf: { x: 160, y: 180 },
  },
};
```

---

## 3. Rig Capability & Compatibility Validation

Before solving interactions, `validateInteractionCompatibility` checks whether the character's rig profile supports the requested action:

```typescript
import { validateInteractionCompatibility } from './validator';

const report = validateInteractionCompatibility(interaction, characterDef, propDef);
if (!report.compatible) {
  console.warn(`Fallback triggered: ${report.fallbackStrategy}`);
}
```

### Safety Rules:
1. **`face_only` Rigs**: Cannot perform `hold_prop`, `pick_up`, `set_down`, `sit_at_seat`, or `point_toward`. Returns `compatible: false` and triggers `pose_swap` fallback.
2. **Missing Prop Sockets**: Automatically falls back to `snap_to_anchor` using the prop's bounding anchor origin without crashing.
3. **Multi-Character Interactions (`pass_object`)**: Validates both the passer and receiver rig definitions simultaneously.

---

## 4. Diagnostic CLI Tool

PeerPro includes a dedicated verification script to validate interaction tracking across continuous frame ranges:

```bash
npm run interaction:inspect
```

### Verified Output:
```
🔍 PeerPro Character–Object Interaction Inspector
   Evaluating FK propagation & socket locking across 60 frames...

   Interaction: inter-hold-umbrella (hold_prop)
   Character:   student-articulated | Prop: starter-prop-umbrella
--------------------------------------------------------------------------------
   Frame  0: Char Hand=(430.3, 330.4) | Prop Grip=(430.3, 330.4) | Drift=⚡ 0.00px (PERFECT)
   Frame 10: Char Hand=(427.6, 329.8) | Prop Grip=(427.6, 329.8) | Drift=⚡ 0.00px (PERFECT)
   Frame 20: Char Hand=(425.1, 327.9) | Prop Grip=(425.1, 327.9) | Drift=⚡ 0.00px (PERFECT)
   Frame 30: Char Hand=(430.3, 330.4) | Prop Grip=(430.3, 330.4) | Drift=⚡ 0.00px (PERFECT)
   Frame 40: Char Hand=(435.5, 332.9) | Prop Grip=(435.5, 332.9) | Drift=⚡ 0.00px (PERFECT)
   Frame 50: Char Hand=(433.0, 331.0) | Prop Grip=(433.0, 331.0) | Drift=⚡ 0.00px (PERFECT)
--------------------------------------------------------------------------------
   Maximum Interaction Drift: 0.00px across all evaluated frames.
   Result: ✅ ZERO-DRIFT INTERACTION SOLVER VERIFIED.
```

---

## 5. Visual Showcase Composition

The `InteractionShowcase` composition (`src/compositions/InteractionShowcase.tsx`) renders all three primary interaction scenarios:

1. **Left (Holding)**: Ren waving his arm while holding an umbrella, demonstrating zero-drift FK socket locking under active joint motion.
2. **Center (Sitting)**: Ren seated behind a classroom desk, demonstrating furniture seat snapping and sandwich occlusion (`chair < character < desk`).
3. **Right (Passing)**: Ren transferring the umbrella to a 3/4 perspective classmate across an 80-frame window with smooth trajectory interpolation.

### Render Showcase Proof:
```bash
npx remotion still InteractionShowcase out/interaction-showcase.png --frame=45
```
