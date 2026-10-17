# PeerPro AI Agent Cookbook & Prompting Guide

## Overview

This guide is designed for **Autonomous AI Agents**, **LLM Directors**, and **Coding Assistants** interacting with PeerPro. It provides step-by-step recipes, full JSON scene manifest templates, and best practices to generate cinematic 2.5D animation clips with zero hallucinations.

---

## The 4-Step Agent Workflow

```
┌───────────────────────────┐
│ 1. Introspect Catalog     │  npm run agent:discover -- --json
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 2. Compose Scene JSON     │  Write to scenes/<scene-name>.json
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 3. Validate Manifest      │  npm run scene:inspect scenes/<scene-name>.json
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 4. Render Video / Still   │  npm run scene:render scenes/<scene-name>.json out/<output>.mp4
└───────────────────────────┘
```

### Step 1: Discover Available Capabilities
Always inspect what assets and presets are loaded before authoring a scene:
```bash
npm run agent:discover -- --json
```
The returned JSON payload specifies available character presets, variant names, socket names, and camera trajectories.

### Step 2: Write Scene Manifest
Create a file under `scenes/` (e.g. `scenes/my-scene.json`).

### Step 3: Inspect & Validate
Run diagnostics to verify schema conformance and timeline boundaries:
```bash
npm run scene:inspect scenes/my-scene.json
```
If errors are detected, the validator returns precise machine-readable issue codes and suggestions.

### Step 4: Render
Render directly via CLI:
- **Render Preview Still Frame (frame 45):**
  ```bash
  npm run scene:render scenes/my-scene.json out/preview.png -- --frame 45
  ```
- **Render MP4 Video:**
  ```bash
  npm run scene:render scenes/my-scene.json out/clip.mp4
  ```

---

## Agent Registry Quick Reference

### Character Presets
- Preset ID: `student-ren`
  - Base Body: Blazer Uniform (`starter-char-body-01`)
  - Available Variants:
    - `"default"`: Standard high school blazer, blue bangs, neutral eyes, closed mouth.
    - `"happy"`: Winking eyes, smiling mouth.
    - `"surprised"`: Wide shocked eyes, closed mouth.
    - `"casual"`: Teal hoodie streetwear (`starter-char-body-02-hoodie`), spiky orange hair (`starter-char-hair-spiky`), winking eyes, smiling mouth.

### Facial Feature Asset IDs for Dynamic Schedules
- **Eyes**:
  - `starter-char-eyes-neutral`
  - `starter-char-eyes-wide`
  - `starter-char-eyes-wink`
- **Mouth**:
  - `starter-char-mouth-closed`
  - `starter-char-mouth-smile`

### Environment Presets
- `japanese-street-corner`: Commercial Tokyo street corner with 24H convenience store, neon awning sign, vending machine, apartment backdrop, streetlight, and cherry tree.
- `japanese-quiet-street`: Peaceful residential neighborhood with prominent central sakura tree, apartment facade, streetlight, and close-up foreground vending machine.

### Camera Presets
- `static`: Completely stationary.
- `slow-push-in`: Smooth cinematic zoom in (ideal for dramatic reveals or serious dialogue).
- `slow-pull-out`: Smooth cinematic zoom out (ideal for scene transitions).
- `pan-left-to-right`: Smooth horizontal pan from left to right.
- `pan-right-to-left`: Smooth horizontal pan from right to left.
- `tilt-up` / `tilt-down`: Vertical camera tilt.
- `tracking`: Compound tracking shot.

---

## Production Recipes

### Recipe 1: Two-Character Conversational Encounter
Two characters talking on a street corner, with horizontal camera pan, facial expression transitions, floating sakura petals, and timed subtitles.

```json
{
  "$schema": "../schemas/scene-definition.schema.json",
  "id": "recipe-dialog-encounter",
  "name": "Street Corner Encounter",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 120,
    "backgroundColor": "#090d16"
  },
  "camera": {
    "preset": "pan-left-to-right",
    "intensity": 0.85,
    "focalDepth": 1.0
  },
  "environment": {
    "preset": "japanese-street-corner"
  },
  "characters": [
    {
      "id": "ren",
      "characterId": "student-ren",
      "variant": "default",
      "depth": 1.0,
      "position": { "x": 820, "y": 920 },
      "scale": 0.95,
      "animation": {
        "breathing": { "frequency": 0.5, "amplitude": 3.5 },
        "headTilt": { "frequency": 0.35, "maxAngle": 1.8 },
        "expressionSchedule": [
          { "startFrame": 0, "eyes": "starter-char-eyes-neutral", "mouth": "starter-char-mouth-closed" },
          { "startFrame": 40, "eyes": "starter-char-eyes-wink", "mouth": "starter-char-mouth-smile" }
        ]
      }
    },
    {
      "id": "kai",
      "characterId": "student-ren",
      "variant": "casual",
      "depth": 1.05,
      "position": { "x": 1260, "y": 930 },
      "scale": 0.92,
      "flipX": true,
      "animation": {
        "breathing": { "frequency": 0.55, "amplitude": 3.0 }
      }
    }
  ],
  "effects": [
    {
      "id": "sakura",
      "type": "petals",
      "count": 30,
      "depth": 1.3,
      "opacity": 0.85
    }
  ],
  "dialog": [
    {
      "id": "line-1",
      "speaker": "Ren",
      "text": "Did you finish the assignment for tomorrow?",
      "startFrame": 15,
      "endFrame": 65
    },
    {
      "id": "line-2",
      "speaker": "Kai",
      "text": "Almost! Just need to check the last problem.",
      "startFrame": 70,
      "endFrame": 115
    }
  ]
}
```

---

### Recipe 2: Atmospheric Rainy Evening Solo
Solo character in a hoodie standing in a quiet neighborhood street with directional rain streaks and slow push-in camera.

```json
{
  "$schema": "../schemas/scene-definition.schema.json",
  "id": "recipe-rainy-solo",
  "name": "Rainy Solo Walk",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 120,
    "backgroundColor": "#050811"
  },
  "camera": {
    "preset": "slow-push-in",
    "intensity": 1.0,
    "focalDepth": 1.0
  },
  "environment": {
    "preset": "japanese-quiet-street"
  },
  "characters": [
    {
      "id": "kai-rain",
      "characterId": "student-ren",
      "variant": "casual",
      "depth": 1.0,
      "position": { "x": 960, "y": 920 },
      "scale": 0.95,
      "animation": {
        "breathing": { "frequency": 0.45, "amplitude": 3.0 },
        "headTilt": { "frequency": 0.3, "maxAngle": 1.5 },
        "expressionSchedule": [
          { "startFrame": 0, "eyes": "starter-char-eyes-neutral", "mouth": "starter-char-mouth-closed" },
          { "startFrame": 60, "eyes": "starter-char-eyes-wide", "mouth": "starter-char-mouth-smile" }
        ]
      }
    }
  ],
  "effects": [
    {
      "id": "rain",
      "type": "rain",
      "count": 70,
      "speed": 36,
      "angle": -14,
      "opacity": 0.45,
      "depth": 1.4
    }
  ],
  "dialog": [
    {
      "id": "d1",
      "speaker": "Kai",
      "text": "There is something serene about Tokyo in the evening rain.",
      "startFrame": 20,
      "endFrame": 100
    }
  ]
}
```

---

## Agent Rules of Thumb & Best Practices

1. **Character Ground Alignment**:
   - Because character bodies are anchored at bottom-center $(0.5, 1.0)$, placing character instances at $y = 920$ to $930$ grounds their feet accurately on the sidewalk.
2. **Character Facing**:
   - To have characters face each other in conversation, set `flipX: true` on the character located on the right ($x > 960$).
3. **Dialogue Pacing**:
   - Allow at least **40–50 frames** per dialogue line (1.5–2 seconds) at 30 fps so viewers can comfortably read subtitle text.
   - Leave a **5–10 frame pause** between consecutive dialogue lines.
4. **Depth Staging**:
   - Focal plane characters should always be set to `depth: 1.0` or slightly staggered (`1.05`, `0.98`) to avoid overlapping depth clipping.
   - Foreground props and trees should be staged at `depth: 1.4` to `1.6`.
   - Distant sky plates should be placed at `depth: 0.2`.
