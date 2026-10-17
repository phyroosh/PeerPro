# PeerPro Technical Developer Guide

## 1. Architectural Philosophy

PeerPro is a **local, code-first 2.5D animation playground** built upon **Remotion**, **React**, and **TypeScript**. It is designed specifically for autonomous AI agents and creative technologists who require frame-deterministic, high-fidelity visual storytelling without relying on external cloud rendering SaaS, heavy 3D game engines (such as Three.js), or unpredictable generative video models.

### Core Tenets
1. **Frame-Deterministic Purity**: All animation states, particles, camera positions, and character bobbing are pure mathematical functions of Remotion's `frame`, `fps`, and immutable props. No unseeded random timers, asynchronous layout shifts, or browser clock drift are permitted.
2. **Modular Recombination**: Characters and environments are composed from discrete vector parts connected via explicit socket coordinates rather than rigid pre-baked sprites or skeletal deformation rigs.
3. **2.5D Multi-Plane Parallax**: True depth staging is achieved by placing layers along a continuous depth axis $z \in [0.1, 2.0]$. Virtual camera movements dynamically scale displacement and perspective zoom proportionally to depth relative to a focal plane ($z_{\text{focal}} = 1.0$).
4. **Agent-First Discoverability**: The entire catalog of assets, presets, sockets, and camera trajectories can be introspected programmatically via CLI in structured JSON format (`npm run agent:discover -- --json`).

```
┌────────────────────────────────────────────────────────┐
│                   SceneManifest (JSON)                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  SceneRenderer (React)                 │
├──────────────────────────┬─────────────────────────────┤
│   Camera25D (Context)    │  Displacement, Zoom, Bounds │
├──────────────────────────┼─────────────────────────────┤
│   Environment (Layers)   │  Depth-scaled Parallax      │
├──────────────────────────┼─────────────────────────────┤
│   Characters (Solver)    │  Socket-Plug Attachment     │
├──────────────────────────┼─────────────────────────────┤
│   Atmospheric Effects    │  Deterministic PRNG Particles│
├──────────────────────────┼─────────────────────────────┤
│   Dialog Overlay         │  Timed Subtitle Banners     │
└──────────────────────────┴─────────────────────────────┘
```

---

## 2. Coordinate System & Geometry Conventions

PeerPro uses a standardized 2D Cartesian screen coordinate system:
- **Canvas Viewport**: $1920 \times 1080$ pixels (16:9 Full HD).
- **Origin $(0, 0)$**: Top-left corner of the canvas.
- **Positive X**: Advances rightward ($0 \to 1920$).
- **Positive Y**: Advances downward ($0 \to 1080$).
- **Normalized Anchors**: Expressed as $(\text{anchor}_x, \text{anchor}_y) \in [0.0, 1.0]$. For instance, $(0.5, 1.0)$ indicates bottom-center (standard for standing characters, buildings, and trees).

### Depth Planes ($z$)
- **$z < 1.0$ (Background)**: Moves slower than the camera. Example: Distant sky plate at $z = 0.2$ moves at 20% of camera travel speed.
- **$z = 1.0$ (Focal Plane / Midground)**: Moves 1:1 with camera travel. This is where primary character staging and roadways occur.
- **$z > 1.0$ (Foreground)**: Moves faster than the camera. Example: Foreground cherry blossom tree at $z = 1.5$ moves at 150% of camera travel speed, creating powerful cinematic parallax.

---

## 3. Character Assembly & Socket-Plug Math

Characters in PeerPro are constructed from modular SVG parts using socket-to-plug geometric alignment.

### Attachment Math
When attaching a child part (e.g. Head) to a parent part (e.g. Body):
$$\Delta X = \text{ParentSocket}_x - \text{ChildPlug}_x + \text{Offset}_x$$
$$\Delta Y = \text{ParentSocket}_y - \text{ChildPlug}_y + \text{Offset}_y$$

Where:
- $\text{ParentSocket}$ is defined in the parent's asset manifest in local pixels (e.g., `neck: { x: 150, y: 95 }` on the blazer body).
- $\text{ChildPlug}$ is defined in the child's asset manifest in local pixels (e.g., `neck_socket: { x: 120, y: 240 }` on the head base).

### Slot Hierarchy
1. **Root Part (`rootPart`)**: The base body (e.g., `starter-char-body-01` or `starter-char-body-02-hoodie`). Anchored at $(0.5, 1.0)$ so character position $(x, y)$ precisely designates where feet touch the ground.
2. **Head (`head`)**: Plugs into the body's `neck` socket.
3. **Face Features**:
   - `eyes`: Plugs into head's `eyes` socket.
   - `mouth`: Plugs into head's `mouth` socket.
4. **Hair**:
   - `hairFront`: Plugs into head's `hair` socket (rendered in front of face).
   - `hairBack`: Plugs into head's `hair` socket (rendered behind body).

### Variant Overrides
Characters define variant maps in `CharacterDefinition.variants`:
```typescript
variants: {
  casual: {
    name: 'Casual Streetwear',
    overrides: {
      rootPart: 'starter-char-body-02-hoodie',
      hairFront: 'starter-char-hair-spiky',
      eyes: 'starter-char-eyes-wink',
      mouth: 'starter-char-mouth-smile',
    },
  },
}
```

### View Angles & Angle Compatibility
To prevent visual dissonance (such as attaching a front-facing head to a turned 3/4 body), PeerPro enforces formal view angle contracts via `AssetViewAngle = 'front' | 'three_quarter' | 'profile' | 'back'`:
- `verifyAngleCompatibility`: The character solver checks that attached child parts match the view angle of the parent body. Angle mismatches throw actionable errors in strict mode (`strictAngle: true`).
- 3/4 perspective assets (`starter-char-body-01-three-quarter`, `starter-char-head-01-three-quarter`, `starter-char-eyes-three-quarter`, etc.) provide authentic anime staging for multi-character conversational scenes.

### Ground Contact Shadows
Characters are anchored at $(0.5, 1.0)$ in local space. The `Character` component automatically renders a ground contact shadow (`showShadow = true`, default) directly beneath the character's feet using a smooth radial gradient:
$$\text{Shadow}(x, y) = \text{radial-gradient}(\text{ellipse}, \text{rgba}(15, 23, 42, 0.45) \to 0\%)$$
This grounds characters naturally to whatever ground baseline $Y$ they are placed on ($Y \approx 920$), eliminating the "floating cardboard" defect.


---

## 4. Virtual Camera & Parallax Physics

The 2.5D virtual camera is implemented via `Camera25D.tsx` and `computeCameraState`.

### Parallax Formula
For a virtual camera displacement $(C_x, C_y)$ and zoom $Z_{\text{cam}}$:
$$\Delta X(z) = -C_x \times \frac{z}{z_{\text{focal}}}$$
$$\Delta Y(z) = -C_y \times \frac{z}{z_{\text{focal}}}$$
$$\text{Scale}(z) = 1.0 + (Z_{\text{cam}} - 1.0) \times \frac{z}{z_{\text{focal}}}$$

### Camera Presets
- `static`: Completely stationary camera ($C_x = 0, C_y = 0, \text{zoom} = 1.0$).
- `slow-push-in`: Smooth cubic zoom in from 1.0 to 1.12.
- `slow-pull-out`: Smooth cubic zoom out from 1.12 to 1.0.
- `pan-left-to-right`: Smooth horizontal pan from $-80\text{px}$ to $+80\text{px}$ with subtle mid-pan zoom breathing.
- `pan-right-to-left`: Reverse horizontal pan from $+80\text{px}$ to $-80\text{px}$.
- `tilt-up` / `tilt-down`: Vertical cinematic tilt.
- `tracking`: Compound cinematic camera tracking.

### Safety Clamping & Overscan Bleed
To ensure virtual camera shifts never expose black edges beyond the viewport:
1. `computeCameraState` strictly clamps horizontal travel to $\pm 150\text{px}$, vertical travel to $\pm 80\text{px}$, and zoom between $0.9\text{x}$ and $1.25\text{x}$.
2. Background plates (e.g. `sky-dusk.svg`) utilize an oversized canvas ($2200 \times 900$) providing $140\text{px}$ horizontal bleed on both edges.
3. Ground roadway layers utilize horizontal scaling (`scale: [1.15, 1.0]`) providing $144\text{px}$ bleed on each side.

---

## 5. Procedural Animation Primitives

PeerPro replaces bulky keyframe libraries with pure mathematical animation functions:

### 1. Breathing Bobbing & Expansion
```typescript
const { offsetY, scaleY } = computeBreathing(frame, fps, {
  frequency: 0.5,    // 0.5 cycles per second (2.0s per breath cycle)
  amplitude: 3.5,    // 3.5px vertical bobbing
  scaleYAmount: 0.008, // 0.8% subtle chest scale expansion
});
```

### 2. Stance Sway / Head Tilt
```typescript
const tiltAngle = computeHeadTilt(frame, fps, {
  frequency: 0.35,  // 0.35 Hz natural sway
  maxAngle: 1.8,    // Clamped strictly to [-1.8 deg, +1.8 deg]
});
```

### 3. Facial Expression Scheduling
```typescript
const expression = resolveExpressionSchedule(frame, [
  { startFrame: 0, eyes: 'starter-char-eyes-neutral', mouth: 'starter-char-mouth-closed' },
  { startFrame: 40, eyes: 'starter-char-eyes-wink', mouth: 'starter-char-mouth-smile' },
  { startFrame: 85, eyes: 'starter-char-eyes-wide', mouth: 'starter-char-mouth-closed' },
]);
```

### 4. Deterministic Atmospheric Particles
`DriftingPetals` and `RainEffect` use the seeded **Mulberry32 PRNG** algorithm and toroidal wrapping:
$$x_{\text{particle}} = ((x_{\text{init}} + \text{frame} \cdot v_x + \Delta X_{\text{parallax}}) \bmod W_{\text{wrap}}) - \text{offset}$$
This ensures particles wrap seamlessly on screen without popping or resetting, regardless of positive or negative camera movement.

---

## 6. Declarative Scene System

Scenes are defined in clean, declarative JSON manifests compliant with `schemas/scene-definition.schema.json`.

```json
{
  "id": "sample-scene",
  "name": "Sample Scene",
  "canvas": { "width": 1920, "height": 1080, "fps": 30, "durationInFrames": 120 },
  "camera": { "preset": "pan-left-to-right", "intensity": 1.0 },
  "environment": { "preset": "japanese-street-corner" },
  "characters": [
    {
      "id": "hero",
      "characterId": "student-ren",
      "variant": "default",
      "position": { "x": 840, "y": 920 },
      "animation": {
        "breathing": { "frequency": 0.5, "amplitude": 3.5 },
        "expressionSchedule": [
          { "startFrame": 0, "eyes": "starter-char-eyes-neutral" },
          { "startFrame": 45, "eyes": "starter-char-eyes-wink", "mouth": "starter-char-mouth-smile" }
        ]
      }
    }
  ],
  "effects": [{ "type": "petals", "count": 28, "depth": 1.3 }],
  "dialog": [
    { "id": "d1", "speaker": "Ren", "text": "See you after class!", "startFrame": 20, "endFrame": 80 }
  ]
}
```

Render directly via:
```bash
npx tsx scripts/render-scene.ts scenes/my-scene.json out/my-scene.mp4
```
