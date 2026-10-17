# PeerPro — AI-Agent 2.5D Animation Playground

PeerPro is a local, code-first 2.5D animation toolkit built on **Remotion**, **React**, and **TypeScript**. It provides AI coding agents with modular building blocks to assemble characters and environments, manipulate layers with anchors/pivots, apply deterministic camera movements and parallax, and render frame-accurate videos.

---

## Getting Started

### Prerequisites
- **Node.js**: v22.x or later
- **npm**: v10.x or later
- **FFmpeg**: Installed and available on system PATH
- **Google Chrome / Chromium**: Installed for headless video rendering

### Installation
```bash
npm install
```

### Type Checking & Build
```bash
npm run build
```

### Preview in Remotion Studio
```bash
npm run dev
```
Opens Remotion Studio in your browser at `http://localhost:3000`.

### Rendering
- **Render Still Image (Frame 45):**
  ```bash
  npm run render:still
  ```
- **Render 5-second MP4 Video Clip:**
  ```bash
  npm run render:video
  ```
Output files are generated in `out/`.
