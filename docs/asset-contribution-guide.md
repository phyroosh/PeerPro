# PeerPro Asset Contribution & Packaging Guide

## 1. Directory Structure

PeerPro organizes assets into modular, versioned asset packs under `asset-packs/`:

```
PeerPro/
├── asset-packs/
│   └── starter-kit/
│       └── manifest.json            <-- Pack metadata & asset definitions
└── public/
    └── peerpro-assets/
        └── starter/
            ├── body-01.svg          <-- Vector graphic files
            ├── head-01.svg
            └── ...
```

---

## 2. SVG Technical Constraints

To ensure frame-deterministic rendering, cross-platform compatibility, and clean headless rendering:

1. **Standard `viewBox`**: Every SVG file must declare an explicit `viewBox="0 0 W H"` and matching `width="W"` and `height="H"` attributes.
2. **Transparent Alpha**: Character parts and props must maintain transparent backgrounds (`hasAlpha: true`). Background sky plates should declare `hasAlpha: false`.
3. **No External Dependencies**:
   - **No linked bitmap images**: Do not embed `<image xlink:href="http...">`. All graphics must be purely mathematical vector paths (`<path>`, `<rect>`, `<circle>`, `<line>`, `<polygon>`).
   - **No external fonts**: Text must be converted to vector glyphs / paths (`<path>`).
4. **Scoped Definitions**:
   - Gradients, filters, and patterns must be defined inside `<defs>` with unique IDs.
5. **Sanitization**: Remove editor metadata (e.g. Adobe Illustrator, Inkscape, or Figma tags) before committing.

---

## 3. Anchor Points & Pivots

Every asset in PeerPro must declare a normalized anchor point:
$$(\text{anchor}_x, \text{anchor}_y) \in [0.0, 1.0]$$

| Asset Category | Standard Anchor | Rationale |
| :--- | :--- | :--- |
| `base_body` | `(0.5, 1.0)` | Bottom-center: Feet align directly to the ground plane $y$. |
| `head` | `(0.5, 0.5)` | Center pivot for natural rotational sway. |
| `eyes` / `mouth` | `(0.5, 0.5)` | Center alignment with facial sockets. |
| `hair` | `(0.5, 0.5)` | Snaps to head hair socket. |
| `facade` / `prop` | `(0.5, 1.0)` | Bottom-center: Foundations rest on ground sidewalk. |
| `sky` | `(0.5, 0.0)` | Top-center: Covers sky hemisphere with overscan bleed. |

---

## 4. Sockets & Plugs Reference

Sockets and plugs enable modular parts to snap together mathematically without manual adjustments:

```
[Body Part]
  └─ Socket: "neck" (x: 150, y: 95)
       │
       ▼ Snaps to
[Head Part]
  ├─ Plug: "neck_socket" (x: 120, y: 240)
  ├─ Socket: "eyes" (x: 120, y: 135)  ──────►  [Eyes] Plug: "eyes_socket" (x: 80, y: 30)
  ├─ Socket: "mouth" (x: 120, y: 195) ──────►  [Mouth] Plug: "mouth_socket" (x: 30, y: 15)
  └─ Socket: "hair" (x: 120, y: 70)   ──────►  [Hair] Plug: "hair_socket" (x: 130, y: 75)
```

### Standard Socket Identifiers
- **Body (`base_body`)**:
  - `attachmentSockets.neck`: Coordinates of the neck attachment point.
  - `attachmentSockets.shoulder_left` / `shoulder_right`: Arm attachment points.
- **Head (`head`)**:
  - `attachmentSockets.neck_socket`: Coordinates that align with the body's `neck`.
  - `attachmentSockets.eyes`: Placement point for eye assets.
  - `attachmentSockets.mouth`: Placement point for mouth assets.
  - `attachmentSockets.hair`: Placement point for hair bangs or wigs.
- **Eyes (`eyes`)**:
  - `attachmentSockets.eyes_socket`: Anchor matching the head's `eyes` socket.
- **Mouth (`mouth`)**:
  - `attachmentSockets.mouth_socket`: Anchor matching the head's `mouth` socket.
- **Hair (`hair`)**:
  - `attachmentSockets.hair_socket`: Anchor matching the head's `hair` socket.

---

## 5. Authoring `manifest.json`

Each pack requires a `manifest.json` adhering to `schemas/asset-manifest.schema.json`:

```json
{
  "$schema": "../../schemas/asset-manifest.schema.json",
  "packId": "my-custom-pack",
  "name": "My Custom Asset Pack",
  "version": "1.0.0",
  "styleFamily": "anime-clean-v1",
  "description": "Custom character clothing and prop extensions.",
  "assets": [
    {
      "id": "my-char-hoodie",
      "name": "Streetwear Hoodie",
      "kind": "character_part",
      "category": "base_body",
      "path": "peerpro-assets/my-pack/hoodie.svg",
      "format": "svg",
      "dimensions": { "width": 300, "height": 600 },
      "hasAlpha": true,
      "style": { "family": "anime-clean-v1" },
      "anchor": { "x": 0.5, "y": 1.0 },
      "attachmentSockets": {
        "neck": { "x": 150, "y": 95 }
      },
      "capabilities": ["scalable", "flip_x"],
      "tags": ["character", "body", "hoodie"],
      "provenance": {
        "source": "original",
        "license": "MIT",
        "author": "Your Name"
      }
    }
  ]
}
```

---

## 6. Validation & Documentation Build Pipeline

Whenever assets are added, modified, or reorganized, run the validation toolchain:

### 1. Validate All Manifests and Physical Files
```bash
npm run assets:validate
```
Verifies file existence, directory traversal protection, anchor bounds, and schema validity.

### 2. Refresh Asset Index & Documentation
```bash
npm run assets:index
```
Automatically regenerates:
- `schemas/asset-index.json` (machine-readable index).
- `docs/asset-index.md` (markdown table documentation).

### 3. Build Visual Contact Sheet
```bash
npm run assets:contact-sheet
```
Generates a vector contact sheet visual grid at `out/contact-sheet.svg`.
