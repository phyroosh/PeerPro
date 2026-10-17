# PeerPro — Next-Moves Roadmap
## From a working toolkit to a powerful AI animation playground

**Purpose:** Plan the next moves after the current PeerPro implementation pass (Phases 0–10). This roadmap deliberately does not change the work currently underway. It defines what to inspect first, what to improve next, how to reach much stronger visual results, and which advanced features should wait until the evidence says they are needed.

**Product vision:** An AI coding agent receives a creative goal, explores PeerPro's available assets and capabilities, assembles characters and worlds from compatible building blocks, directs their animation, inspects the rendered result, corrects problems, and produces a coherent scene—without having to invent the entire animation system from scratch.

**Core principle:** PeerPro supplies capabilities and knowledge; the agent retains creative freedom. Do not turn PeerPro into a rigid video-making pipeline, a giant prompt, or a folder of unstructured images.

---

# 1. What “the highest level” should mean

PeerPro is not successful merely because TypeScript builds or a Remotion render completes. The real test is whether an agent can **create a visually coherent and controllable animated world from reusable components**.

The long-term target is for an agent to be able to:

1. Discover what assets and tools exist without reading the whole codebase.
2. Assemble a new character from compatible components and preserve that character across multiple shots.
3. Construct different locations—such as streets, classrooms, bedrooms, rooftops, and city corners—from modular assets.
4. Place, group, layer, transform, and animate objects using clear, predictable interfaces.
5. Direct camera movement and 2.5D depth without exposing layer edges or breaking composition.
6. Compose original scenes rather than choosing only from predefined templates.
7. Preview actual frames, notice visible defects, revise its work, and render a verified result.
8. Clearly report missing capabilities instead of pretending unsupported work succeeded.

The ultimate experience should feel like giving an animator a capable software environment, an organized art department, reusable animation tools, and practical training—then allowing the animator to make creative decisions.

## Two separate quality dimensions

Always evaluate these separately:

- **Toolkit quality:** APIs, asset compatibility, transforms, animation determinism, diagnostics, discoverability, rendering reliability.
- **Art quality:** appeal of the artwork, design consistency, character identity, environment richness, composition, motion quality, lighting, and storytelling.

A successful MVP can prove toolkit quality using simple SVGs. It cannot prove production-level visual quality until PeerPro has a coherent, good-looking asset pack and has been tested on demanding scenes. Do not confuse these milestones.

---

# 2. While the current coding-agent run is in progress

Do not keep expanding the implementation scope while the coding agent is already building Phases 0–10. Let that pass finish, then assess what it actually produced.

The useful work to do in parallel is planning and collecting creative references—not adding more code requirements mid-run.

## Prepare a visual target pack

Collect a small set of reference images that communicate the intended look. Choose references for:

- character design and facial proportions;
- line art, shading, and color palette;
- city/building design and perspective;
- cinematic framing and depth;
- the desired amount of motion and atmospheric detail.

Use them as **style and quality references**, not as artwork to copy directly. The first PeerPro production kit should have one defined visual family instead of mixing incompatible styles.

## Write down the target use cases

Use a short list of representative creative requests to keep development anchored in the product vision:

1. Assemble a teenage character from parts; change only hairstyle, expression, or clothing while preserving identity.
2. Construct two visibly different Japanese street layouts from the same environment pack.
3. Place the character in one street and make a short shot with foreground/midground/background parallax.
4. Create a quiet bedroom scene with subtle character and environmental motion.
5. Build a three-shot sequence where the same character remains visually consistent.
6. Respond gracefully when a requested pose, asset, or movement does not yet exist.

These requests become the acceptance tests for future development.

---

# 3. The first move after Phases 0–10: audit the actual result

## Phase 11 — Reality Check, Visual Audit, and Baseline Benchmark

**Priority: P0 — do this before adding features.**

The purpose is to find the difference between what the implementation claims to support and what it can really do.

### Actions

- Read the actual `implementation-status.md`, source code, public API, schemas, examples, and PeerPro `SKILL.md` produced by the agent.
- Install from the documented clean setup path where feasible, using the existing package manager and lockfile.
- Run the documented typecheck, tests, asset validation, Studio preview, still render, and clip render.
- Inspect actual images/frames and the rendered video; do not accept console output as proof of visual quality.
- Test an invalid asset ID, an incompatible character part, an unknown animation preset, and a camera movement that approaches scene boundaries.
- Run the representative use cases listed above and record exactly what succeeds, partially succeeds, or fails.
- Check whether every capability described in the skill really exists and whether all documented examples use real imports and asset IDs.

### Deliverables

- `docs/quality/peerpro-v1-audit.md` or equivalent.
- A baseline benchmark project and retained preview frames/render.
- A prioritized defect list: blockers, visual weaknesses, usability gaps, and future ideas.

### Exit gate

Do not proceed to feature expansion until the starter project can be installed, discovered, previewed, and rendered from the documented instructions, and the team knows which visual defects are real.

---

# 4. Build a coherent asset-production system

## Phase 12 — Asset Quality, Compatibility, and Style System

**Priority: P0 — highest leverage for better final videos.**

The current MVP intentionally uses small proof assets. The next leap should not be “add 500 random assets.” It should be “create one genuinely useful, visually coherent asset family that the agent can combine reliably.”

---

# 5. Upgrade the character system from assembly to acting

## Phase 13 — Character Continuity and Cutout-Rig Foundation

**Priority: P1 — start after asset contracts and baseline are stable.**

The character system must do more than place unrelated images on top of each other. It should preserve identity and support believable, controllable actions.

---

# 6. Upgrade from placing buildings to constructing believable places

## Phase 14 — Environment Kits and World-Building Grammar

**Priority: P1.**

The agent should be able to build different locations out of reusable components while maintaining perspective and visual consistency.

---

# 7. Upgrade from animated properties to reusable character and scene motion

## Phase 15 — Animation Actions, Timeline Composition, and Motion Quality

**Priority: P1.**

PeerPro should give the agent a vocabulary of actions, while allowing it to adjust or write custom frame-driven animations when needed.

---

# 8. Make the camera and layers feel like a directed shot

## Phase 16 — Cinematography, Depth, Occlusion, and Compositing

**Priority: P1/P2, depending on the baseline.**

---

# 9. Make the AI agent better at using the playground

## Phase 17 — Agent Discovery, Visual Feedback, and Self-Correction

**Priority: P0/P1 — do not postpone discoverability and feedback.**

---

# 10. Optional: audio and narrative timing

## Phase 18 — Voiceover, Sound, and Shot Timing Integration

**Priority: P2 — add when the intended videos need it.**

---

# 11. Validate improvement instead of guessing

## Phase 19 — Benchmark Suite, Visual Regression, and Release Gates

**Priority: P0, then ongoing.**

---

# 12. Advanced capabilities: only after evidence supports them

## Phase 20 — Optional extensions

---

# 13. Recommended priority order

| Priority | Work | Why it matters |
|---|---|---|
| P0 | Reality audit + baseline scene review | Establish what actually works. |
| P0 | Coherent, polished asset kit and compatibility metadata | The visual ceiling depends heavily on usable assets. |
| P0 | Agent discovery + render/inspect/correct loop | The agent needs to understand capabilities and judge outcomes. |
| P1 | Character continuity and cutout-rig foundation | Turns static recombination into reusable acting. |
| P1 | Environment kits and world-building grammar | Enables genuinely different places from shared parts. |
| P1 | Reusable action library | Reduces repeated low-level animation code. |
| P1 | Camera/depth/compositing refinement | Makes shots feel spatial and intentionally directed. |
| P0 ongoing | Benchmarking and regression checks | Prevents improvements from breaking working capabilities. |
| P2 | Audio/narrative timing | Add when target projects need it. |
| Conditional | Advanced 3D, IK, GUI, MCP, broad asset generation | Only when a real constraint justifies the cost. |
