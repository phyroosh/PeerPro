# PeerPro Voiceover System: Microsoft Edge Neural TTS Guide

## Overview

PeerPro's voiceover generation system integrates natural-sounding **Microsoft Edge Neural Text-to-Speech (TTS)**. This replaces robotic synthesis with expressive, human-like narration tailored for animated characters, educational videos, and AI-directed scenes.

### Key Capabilities
- **Neural Naturalness**: Over 300 neural voices across 100+ locales, powered by Microsoft's Read Aloud service.
- **Provider Isolation**: Decoupled behind a TypeScript `VoiceoverProvider` interface with runtime registry.
- **Dynamic Discovery & Caching**: Live voice discovery with local 24-hour disk caching and `--refresh` capability.
- **Speech Controls & Presets**: Fine-grained `rate`, `pitch`, and `volume` parameters alongside 4 curated presets (`natural-narration`, `calm-storytelling`, `energetic-narration`, `reflective-narration`).
- **Remotion Timeline Synchronization**: Exact audio duration measurement (`ffprobe`), converting audio length into exact frames and synchronizing with Remotion `<Audio />` tracks, automatic BGM ducking, and mouth viseme lip-syncing.
- **Content-Addressable Caching**: SHA-256 caching of generated audio in `public/audio/voiceovers/` prevents redundant synthesis.

> [!IMPORTANT]
> **Online Service Notice**: Microsoft Edge Neural TTS relies on an unofficial integration with Microsoft's online Read Aloud service via the maintained `edge-tts` engine. Synthesis requires an active internet connection. If the service is unreachable, clear diagnostic errors are returned. The system does not silently substitute robotic voices; users may explicitly choose the `espeak` provider if offline operation is desired.

---

## Quick Start CLI Commands

### 1. Discover Available Voices
List neural voices filtered by locale, gender, or search keyword:
```bash
# List US English voices
npm run voiceover:list -- --lang en-US

# Search for Japanese voices
npm run voiceover:list -- --lang ja --limit 10

# Search by voice or personality keyword
npm run voiceover:list -- --search Jenny
```

### 2. Preview a Neural Voice
Generate and listen to a fast conversational sample without rendering a video:
```bash
# Preview default narrator (en-US-JennyNeural)
npm run voiceover:preview -- --voice en-US-JennyNeural

# Preview with a specific preset
npm run voiceover:preview -- --voice en-US-GuyNeural --preset energetic-narration

# Preview custom text with adjusted parameters
npm run voiceover:preview -- --voice en-US-JennyNeural --text "Welcome back to PeerPro!" --rate "+5%" --pitch "+2Hz"
```
Preview audio is saved to `out/previews/` and cached for instant replay.

### 3. Synchronize Voiceover to a Scene Manifest
Automatically generate neural voiceovers for every dialogue line in a scene JSON, align Remotion timeline frames, and attach synchronized audio tracks:
```bash
npm run voiceover:sync -- scenes/agent-dialog-scene.json --out scenes/agent-dialog-scene-audio.json --voice en-US-JennyNeural
```

### 4. Render Remotion Video with Synchronized Voiceover
Render the scene still or video using Remotion:
```bash
# Render preview still
npx remotion still EdgeTTSVoiceoverShowcase out/edge-tts-preview.png --frame=45

# Render full MP4 video with neural voiceover
npx remotion render EdgeTTSVoiceoverShowcase out/edge-tts-showcase.mp4
```

---

## Speech Presets & Parameter Configuration

| Preset Name | Description | Rate | Pitch | Volume | Best For |
|---|---|---|---|---|---|
| `natural-narration` *(Default)* | Balanced, conversational delivery | `+0%` | `+0Hz` | `+0%` | Standard tutorials, explanations |
| `calm-storytelling` | Relaxed, gentle tempo | `-5%` | `-2Hz` | `+0%` | Bedtime stories, scenic walks |
| `energetic-narration` | Brisk, lively cadence | `+10%` | `+4Hz` | `+5%` | Action scenes, quick tips |
| `reflective-narration` | Contemplative, measured pace | `-10%` | `-4Hz` | `-5%` | Dramatic pauses, internal monologue |

### Parameter Formats
- **`rate`**: Format `[+-]X%` (e.g. `+0%`, `-10%`, `+15%`).
- **`pitch`**: Format `[+-]XHz` (e.g. `+0Hz`, `-4Hz`, `+6Hz`).
- **`volume`**: Format `[+-]X%` (e.g. `+0%`, `-5%`, `+5%`).

---

## Remotion Timeline Synchronization

1. **Exact Duration Determination**:
   Audio is synthesized as MP3 and normalized into 48kHz 16-bit stereo WAV files stored under `public/audio/voiceovers/<hash>.wav`. Exact duration in seconds is extracted via `ffprobe`.

2. **Frame Alignment**:
   Duration in frames is computed:
   $$\text{durationInFrames} = \lceil \text{durationSeconds} \times \text{fps} \rceil$$
   The dialogue line's `endFrame` is updated:
   $$\text{endFrame} = \text{startFrame} + \text{durationInFrames}$$

3. **Audio Track Generation**:
   A `SceneAudioTrack` is attached to the scene manifest:
   ```json
   {
     "id": "vo-line-1",
     "type": "voiceover",
     "src": "audio/voiceovers/<hash>.wav",
     "startFrame": 15,
     "durationInFrames": 118,
     "volume": 1.0
   }
   ```

4. **Multi-Track Mixing & Automated Ducking**:
   When dialogue is active, background music (`bgm`) and room ambience (`ambient`) tracks automatically duck to $35\%$ of their base volume (`duckFactor: 0.35`). Character mouth visemes (`open`, `smile`, `closed`) switch synchronously during the dialogue window.

---

## Scene Manifest Authoring Example

```json
{
  "$schema": "../schemas/scene-definition.schema.json",
  "id": "my-neural-scene",
  "name": "Classroom Announcement",
  "canvas": { "width": 1920, "height": 1080, "fps": 30, "durationInFrames": 180 },
  "camera": { "preset": "slow-push-in", "intensity": 0.6 },
  "environment": { "preset": "japanese-classroom" },
  "characters": [
    {
      "id": "ren",
      "characterId": "student-ren-v2",
      "position": { "x": 960, "y": 920 },
      "animation": { "actions": [{ "action": "talk", "startFrame": 15, "durationInFrames": 120 }] }
    }
  ],
  "dialog": [
    {
      "id": "line-1",
      "speaker": "Ren",
      "text": "Welcome to class! Today we will learn how data packets travel across the world.",
      "startFrame": 15,
      "endFrame": 135,
      "voice": "en-US-JennyNeural",
      "preset": "natural-narration"
    }
  ],
  "audio": [
    {
      "id": "bgm-soft",
      "type": "bgm",
      "startFrame": 0,
      "durationInFrames": 180,
      "volume": 0.7,
      "duckUnderDialog": true,
      "duckFactor": 0.3
    }
  ]
}
```

---

## Troubleshooting & Diagnostics

- **Network 403 Forbidden Error**:
  Ensure `edge-tts` is updated to the latest version (`edge-tts >= 7.3.1`) which contains up-to-date `Sec-MS-GEC` token generation.
- **Audio Out of Sync**:
  Run `npm run voiceover:sync` to recalculate audio durations with `ffprobe` and re-align `endFrame` and canvas duration.
- **Clearing Cache**:
  Delete `.cache/voiceover/` to force fresh voice list discovery or `public/audio/voiceovers/` to force re-synthesis.
