# PeerPro Coordinate & Transform Conventions

This document establishes the canonical mathematical rules, coordinate spaces, and transformation pipelines used across PeerPro.

---

## 1. Canvas Space (Viewport)

All compositions and scene builders share a unified 2D screen coordinate system:

- **Reference Resolution:** `1920 x 1080` pixels (16:9 aspect ratio).
- **Default Frame Rate:** `30 fps`.
- **Origin `(0, 0)`:** Top-Left corner of the viewport.
  - Horizontal Axis (`X`): Extends from `0` (left edge) to `1920` (right edge). Positive direction is **right**.
  - Vertical Axis (`Y`): Extends from `0` (top edge) to `1080` (bottom edge). Positive direction is **down**.
- **Aspect Scaling:** If a composition renders at `1280x720` or `3840x2160`, coordinate transformations scale proportionally via Remotion's canvas context.

```
(0, 0) -----------------------------> +X (1920)
  |
  |      Screen Space / Viewport
  |
  v
 +Y (1080)
```

---

## 2. Asset Space & Normalized Anchors

Every asset defines a bounding box with design dimensions `[width, height]` and a normalized anchor `[anchor.x, anchor.y]`:

- **Normalized Bounds:** `0.0 <= anchor.x <= 1.0`, `0.0 <= anchor.y <= 1.0`.
- **Anchor Semantics:**
  - `(0.0, 0.0)`: Top-Left corner. Standard for background plates, full-screen textures, and sky planes.
  - `(0.5, 0.5)`: Bounding box center. Standard for floating props, particles, and head/face parts.
  - `(0.5, 1.0)`: Bottom-Center. Standard for grounded objects, buildings, streetlamps, trees, and standing character base bodies.

### Transform Pivot Equation
When an asset is placed at screen coordinate `(x, y)` with scale `s` and rotation `θ`, the rendered transform origin in CSS / SVG space is:
$$\text{Pivot}_X = \text{anchor}_X \times \text{width}$$
$$\text{Pivot}_Y = \text{anchor}_Y \times \text{height}$$
$$\text{Transform} = \text{translate}(x - \text{Pivot}_X, y - \text{Pivot}_Y) \cdot \text{scale}(s) \cdot \text{rotate}(\theta)$$

---

## 3. Attachment Socket Mathematics

Characters and modular props attach parts using explicit socket plugs rather than manual pixel offsets.

### Socket Definition
- A **Parent Asset** (e.g., `body`) declares **sockets** (e.g., `neck: { x: 150, y: 30 }`, `shoulder_left: { x: 75, y: 70 }`). Coordinates are in the parent's native design pixels relative to the parent's top-left `(0, 0)`.
- A **Child Asset** (e.g., `head`) declares a **matching plug** (e.g., `neck_socket: { x: 120, y: 220 }`).

### Socket Alignment Equation
To mount the child onto the parent:
$$\text{ChildPos}_X = \text{ParentPos}_X + (\text{ParentSocket}_X - \text{ParentAnchor}_X \times \text{ParentWidth}) \times s_{\text{parent}} - (\text{ChildPlug}_X - \text{ChildAnchor}_X \times \text{ChildWidth}) \times s_{\text{child}}$$
$$\text{ChildPos}_Y = \text{ParentPos}_Y + (\text{ParentSocket}_Y - \text{ParentAnchor}_Y \times \text{ParentHeight}) \times s_{\text{parent}} - (\text{ChildPlug}_Y - \text{ChildAnchor}_Y \times \text{ChildHeight}) \times s_{\text{child}}$$

This guarantees that swapping hairstyles, expressions, or clothing parts automatically maintains millimeter-accurate alignment regardless of overall character scaling.

---

## 4. 2.5D Depth Planes & Parallax Math

In PeerPro's 2.5D environment, layers reside on virtual depth planes `z`.

### Depth Plane Convention

| Depth Value ($z$) | Plane Role | Relative Speed to Camera | Visual Examples |
|---|---|---|---|
| $0.0 < z < 0.4$ | Distant Background | Very slow ($10\% - 40\%$) | Sky, clouds, distant mountain horizon |
| $0.4 \le z < 0.9$ | Mid-Background | Moderate ($40\% - 90\%$) | Distant city skyline, back buildings |
| $z = 1.0$ | **Focal Plane (Midground)** | **1:1 ($100\%$)** | Character, pavement, primary interactive shop |
| $1.1 \le z < 1.6$ | Mid-Foreground | Faster ($110\% - 160\%$) | Streetlamps, parked bicycles, road signage |
| $1.6 \le z \le 2.5$ | Extreme Foreground | Very fast ($160\% - 250\%$) | Framing tree branches, raindrops near lens |

### Parallax Displacement Formula
For a virtual camera moving by vector $\Delta \mathbf{C} = (\Delta C_x, \Delta C_y)$ and zoom factor $Z_{\text{cam}}$:
$$\text{ScreenShift}_X(z) = - \Delta C_x \times z$$
$$\text{ScreenShift}_Y(z) = - \Delta C_y \times z$$
$$\text{LayerScale}(z) = s_{\text{layer}} \times (1 + (Z_{\text{cam}} - 1) \times z)$$

---

## 5. Overscan & Safe Frame Boundaries

Because parallax shifts background layers slower and foreground layers faster during camera pans, asset layers can expose empty canvas edges if drawn exactly at $1920 \times 1080$.

### Overscan Margins
- **Background Plates ($z < 0.5$):** Must include a minimum **15% overscan** (design width $\ge 2200\text{px}$, height $\ge 1240\text{px}$).
- **Camera Displacement Clamp:** Camera presets enforce maximum travel limits:
  $$\max(|\Delta C_x|) \le 150\text{px}$$
  $$\max(|\Delta C_y|) \le 80\text{px}$$
  $$\max(Z_{\text{cam}}) \le 1.25$$
- Layer clipping is tested deterministically at frames $t = 0$, $t = \frac{\text{duration}}{2}$, and $t = \text{duration}$.
