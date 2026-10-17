# PeerPro — Frontier Roadmap
## Phases 21–32: From a capable playground to an extensible animation environment for AI agents

**Status:** Proposed next roadmap, intended to follow `PeerPro_Implementation_Plan.md` (Phases 0–10) and `PeerPro_Next_Moves_Roadmap.md` (Phases 11–20).

**Product vision:** PeerPro gives AI coding agents a discoverable set of visual assets, composable construction tools, animation capabilities, and practical knowledge. The agent uses those capabilities to build characters, construct environments, direct shots, and create original animated scenes—without having to reinvent the underlying animation technology for every project.

**Important framing:** This roadmap does not assume every future capability is mandatory. Implement the phases in order, but use their acceptance gates to prove the value of each step. If a phase reveals that its intended capability already exists and works well, document the evidence and close the phase without duplicating it. If a real project exposes a foundational defect, fix that defect before proceeding.

---

# 1. What the next stage should achieve

Phases 0–20 establish the initial toolkit, asset system, agent-facing discovery, animation capabilities, rendering workflow, and benchmarks. The next stage should deepen the parts that let an agent create more complex scenes with less low-level hand-authoring.

PeerPro should progressively enable an agent to:

1. Find a relevant capability or asset by describing the need, rather than knowing internal filenames.
2. Build assets into structurally valid characters and environments, not merely layer unrelated images.
3. Express spatial intent—such as “place this prop on the desk” or “make the character look toward the window”—through explicit, inspectable interfaces.
4. Create coordinated actions and character-object interactions, instead of animating every property independently.
5. Direct a shot using subject, composition, movement, and emotional intent while retaining creative freedom.
6. Diagnose visible problems with evidence and make targeted repairs.
7. Reuse styles, characters, worlds, action libraries, and custom capability packs across projects without accidental drift.
8. Extend PeerPro with new asset types and animation capabilities without modifying unrelated core systems.

The goal is **not** to make the AI agent follow a rigid cinematic recipe. The goal is to make more creative actions possible, more discoverable, more composable, and easier to verify.

## Keep these three quality dimensions separate

- **Technical capability:** The tools work, interfaces are coherent, animation is deterministic, and scenes render reliably.
- **Visual quality:** Assets are appealing and compatible; composition, motion, continuity, and depth look intentional.
- **Creative generalization:** A fresh agent can use the toolkit to solve a novel task rather than only reproduce an example.

A phase should report which dimension it improves. Do not treat a passing TypeScript check as evidence that a visual or creative problem has been solved.

---

# 2. Global execution rules for Phases 21–32

Apply these rules to every phase:

1. **Execute only the assigned phase.** Do not silently begin later phases or bundle several phases into one coding pass.
2. Inspect the current repository, Git status, current status report, existing contracts, public interfaces, benchmark outputs, and rendered examples before making changes.
3. Verify whether a requested capability already exists. Extend it only if the evidence shows a real gap; do not build a competing second system.
4. Preserve the existing package manager, Remotion setup, working architecture, and unrelated local changes.
5. Keep the core runtime provider-agnostic. PeerPro may accept AI-generated assets or use optional adapters, but must not depend on one image model, cloud service, or agent vendor to remain usable.
6. Prefer explicit typed APIs, validated data contracts, stable IDs, and observable errors over hidden conventions or magic behavior.
7. Keep critical animation frame-driven and deterministic. Re-rendering the same frame with the same inputs must not change its state. Seed any procedural variation and store the seed in project data.
8. Keep all advanced systems opt-in and composable. A simple scene should not need a full rig, world graph, action graph, or 3D renderer.
9. Do not create asset quantities for vanity. A small, polished, compatible library is more useful than a huge inconsistent one.
10. Test code, inspect visual outputs, and document the commands actually run. Do not claim a screenshot, clip, or benchmark was inspected if it was not.
11. For each phase, update the project's implementation status and the relevant API documentation, examples, and tests.
12. At phase completion, stop and report: **Changed**, **Verification**, **Acceptance criteria PASS/FAIL**, **Known limitations**, and **Recommended next phase**.

## Standard execution prompt

> You are implementing PeerPro. Read the current implementation status, the relevant source code, the skill, the public API, and the assigned phase card below. Implement **only this phase**. First verify whether its intended capability already exists; if it does, prove that with code references and tests rather than rebuilding it. Preserve working behavior and unrelated changes. Use small, typed, composable changes. Run the appropriate tests and inspect actual rendered output where the phase affects visuals. Update the status report and relevant docs/examples. Mark every acceptance criterion PASS or FAIL using evidence, list actual commands and results, report known limitations honestly, and stop for review.

---

# Phase 21 — Creative Generalization Challenge

**Priority:** P0 — first phase of this roadmap.  
**Purpose:** Test whether PeerPro can handle genuinely new creative requests, not only the examples used to build it.

This is a focused capability assessment, not a repeat of the old implementation audit. Use the existing benchmark tooling wherever possible.

## Tasks

1. Create a challenge set of at least six new prompts that combine capabilities in combinations not already covered by existing tests.
2. Include these challenge types:
   - a character appears in a newly arranged location;
   - the same character appears in multiple shots with changed pose/expression but retained identity;
   - a scene requires an object to be spatially related to another object;
   - a character must look at, approach, or interact with a target;
   - a camera move must preserve readable composition across multiple depth layers;
   - a request requires an asset or behavior that does not exist, so the agent must identify the gap rather than fake a success.
3. Run each prompt with a fresh agent context or the closest repeatable equivalent. Give the agent only the normal PeerPro skill, documented interfaces, and project assets.
4. Save the prompt, source changes, asset/scene definitions, preview frames, rendered clips where appropriate, and a short result report.
5. Score each challenge separately for tool discovery, correct use of APIs, visual quality, determinism, repair behavior, and honest limitation reporting.
6. Create a prioritized gap list grounded in observed failures. Do not implement the fixes in this phase.

## Deliverables

- `docs/quality/creative-generalization-suite.md` or equivalent.
- A result matrix with evidence for each challenge.
- A ranked list of the three to five gaps that most limit open-ended creation.

## Acceptance gate

A fresh agent has attempted every challenge; each result has evidence; gaps are ranked by impact rather than convenience. The team can distinguish missing capability from poor instructions, missing assets, and a visual-quality defect.

## Do not do

- Do not rebuild benchmark infrastructure already present.
- Do not add features before the gap list is completed.
- Do not mark a challenge successful merely because a render completed.

---

# Phase 22 — Asset Foundry and Pack Ingestion

**Priority:** P1, or P0 if asset onboarding is currently manual and error-prone.  
**Purpose:** Make adding good assets a repeatable workflow, whether they are hand-created, purchased with appropriate rights, procedurally generated, or produced with an AI image tool.

PeerPro does not need to own an image-generation model. It needs a stable way to turn candidate artwork into verified, indexed, reusable assets.

## Tasks

1. Define an asset-ingestion lifecycle: `candidate → inspected → normalized → metadata-complete → compatibility-tested → approved`.
2. Provide a command or script to register a new asset with a stable ID, asset type, source path, intended role, visual style, view/perspective, and provenance/licence status.
3. Automate checks where possible: readable file, supported format, dimensions, alpha channel, empty/near-empty image, likely transparent padding, naming collisions, missing metadata, and invalid references.
4. Generate previews/contact sheets with IDs and important metadata overlaid.
5. Provide a place for asset-specific information such as pivots, attachment points, silhouette bounds, baseline, compatible family, scale convention, or supported actions.
6. Allow optional human review for subjective quality and compatibility. The pipeline should not falsely declare visual style consistency based on metadata alone.
7. Record asset source and transformations so a pack can be maintained and audited later.
8. Keep the ingestion interface independent of any particular image-generation vendor. A future adapter can create candidates, but the asset pack must still work if that provider is unavailable.

## Deliverables

- An asset-ingestion command or API.
- Asset pack manifest and validation documentation.
- Contact-sheet/preview output.
- At least one newly ingested asset used successfully in a real scene.

## Acceptance gate

A developer or agent can add an asset through the documented process and receive actionable validation errors. The asset becomes discoverable through the current capability index and can be previewed in a real composition.

## Do not do

- Do not require every asset to pass through an AI model.
- Do not automatically approve subjective visual quality.
- Do not break existing stable asset IDs without a migration plan.

---

# Phase 23 — Scene Graph and Spatial Constraints

**Priority:** P1.  
**Purpose:** Let an agent express spatial intent instead of manually guessing every pixel coordinate.

A scene graph describes what exists and how entities relate. A constraint layer lets the agent express relationships that can be solved or validated.

## Tasks

1. Define a typed scene graph that can represent entities, parent-child relationships, local transforms, visual bounds, layer/depth, and references to assets or reusable components.
2. Distinguish rendering order from simulated depth. They are related but not identical in a 2.5D scene.
3. Establish named coordinate spaces and conversion rules: composition, scene/world, parent-local, character-local, and screen coordinates as applicable.
4. Support a small, useful set of constraints, such as:
   - attach child to named anchor;
   - align left/right/center or top/bottom;
   - place on a ground line or surface;
   - keep inside a safe region;
   - place in front of/behind another entity;
   - maintain a target offset;
   - look toward a named target when the entity supports gaze.
5. Give constraints priorities and clear failure behavior. Conflicting constraints must be reported rather than silently producing arbitrary results.
6. Provide a scene-graph report showing entity IDs, parents, transforms, bounds, constraints, and unresolved relationships.
7. Ensure the graph can coexist with custom React code; it must not force every creative composition into a restrictive declarative format.

## Deliverables

- Scene graph types/schema and coordinate conventions.
- Constraint evaluation/validation utilities.
- A diagnostic report for a sample scene.
- At least two examples built from spatial relationships rather than hard-coded absolute positions alone.

## Acceptance gate

An agent can make a meaningful spatial change—such as moving a desk while keeping a book on it—without manually updating every child coordinate. Invalid or conflicting constraints produce clear diagnostics. The same graph yields deterministic results at render time.

## Do not do

- Do not implement a full physics engine.
- Do not invent a general-purpose CAD solver.
- Do not remove access to direct positions when they are the simplest valid choice.

---

# Phase 24 — Character Performance System

**Priority:** P1.  
**Purpose:** Move from assembling a character to directing a character's performance using the supported rig types.

This phase should build on the current character continuity and cutout-rig foundation. Do not create a universal rig that assumes every art style or asset family has the same anatomy.

## Tasks

1. Formalize supported rig profiles and their capabilities. Examples might include face-only, upper-body cutout, full-body cutout, and pose-swapped illustration.
2. Define named poses and animation clips with explicit duration, pivots, joint/part transforms, supported rig type, and optional constraints.
3. Add a compact starter pose/action library: neutral, look left/right, look up/down, blink, breathing, small head turn, simple arm gesture, sit/stand pose swap, and simple walk cycle only for rigs that support it.
4. Support blending or crossfading between compatible poses/clips where feasible. Avoid abrupt interpolation between incompatible structures.
5. Preserve character identity through a stable character definition that references parts, color/style attributes, and approved variants.
6. Add rig preview/test compositions that display pivots, joint limits, and the actual asset pieces.
7. Report unsupported movements explicitly. A pose-based character must not claim to perform continuous full-body acting unless it has assets for that motion.

## Deliverables

- Rig profile contract.
- Pose and clip format.
- A small tested library of reusable actions.
- A rig preview example and compatibility tests.

## Acceptance gate

The same character can perform at least three distinct supported actions in different shots while retaining identity and avoiding obvious joint separation or visual drift. All animation is deterministic and each action declares its supported rig family.

## Do not do

- Do not attempt general mesh deformation for every asset.
- Do not promise realistic anatomy or motion from incompatible source illustrations.
- Do not make advanced IK mandatory for all characters.

---

# Phase 25 — Character–Object Interaction Toolkit

**Priority:** P1/P2, selected according to actual creative requests.  
**Purpose:** Enable meaningful relationships between characters and props, rather than merely placing them near each other.

## Tasks

1. Define explicit interaction anchors on characters and props (for example, hand grips, handle points, seat positions, or gaze targets) when the asset supports them.
2. Provide interaction helpers for a carefully bounded first set of actions: look at, approach, point toward, pick up/set down a simple prop, hold an object at an anchor, sit at a supported seat, and pass an object between two compatible characters.
3. Represent the intended interaction as data or a reusable action function with start/end conditions, frame ranges, target IDs, and supported character/prop capabilities.
4. Coordinate transforms so a held object follows the hand/anchor during the action instead of drifting independently.
5. Use a clear staging fallback if the exact interaction is unsupported. For example, a pose swap may be acceptable for a stylized shot; pretending it is a continuous reach is not.
6. Add test scenes for successful interactions and deliberately incompatible assets.
7. Keep interactions deterministic and inspectable at representative frames.

## Deliverables

- Interaction contracts/helpers.
- Compatibility checks for character and prop anchors.
- At least two example interactions, including one object-hand relationship.
- Tests for missing anchors and unsupported combinations.

## Acceptance gate

An agent can stage a supported interaction with only a small number of high-level parameters. The object remains attached through the relevant frames, the result can be scrubbed deterministically, and unsupported combinations fail clearly.

## Do not do

- Do not build full rigid-body physics or collision simulation.
- Do not guarantee finger-level grasp realism from low-detail cutouts.
- Do not support arbitrary human-to-human contact without suitable assets and tests.

---

# Phase 26 — Environment Layout and World Composition

**Priority:** P1.  
**Purpose:** Expand environment construction from layered scenery into reusable, spatially coherent places.

## Tasks

1. Define reusable environment prefabs such as storefronts, street corners, classroom desk clusters, rooftops, room corners, and background skyline groups.
2. Document each kit's view convention, scale, ground line, perspective, allowed camera direction, and supported depth behavior.
3. Add layout helpers for repeated and rule-guided placement—such as building rows, street furniture spacing, trees along a road, desks in a classroom, or objects arranged around a room.
4. Support deterministic variation through explicit seeds and recorded parameters. Variation should create different arrangements without changing an asset's identity or style unpredictably.
5. Allow semantic layout instructions such as “leave the center clear for the character,” “keep the storefront behind the sidewalk,” or “place foreground objects near the frame edge but outside the subject's face.” Convert supported instructions into concrete constraints and report those that cannot be satisfied.
6. Validate layout bounds, perspective compatibility, ground-plane consistency, and camera coverage where feasible.
7. Keep handcrafted placement available when procedural layout does not serve the shot.

## Deliverables

- A small reusable prefab library.
- Layout helpers and seeded variation.
- A report/preview of entity positions and depth.
- Two meaningfully different locations built from at least one shared kit.

## Acceptance gate

An agent can produce two distinct but coherent environments from shared assets by changing layout parameters and selected prefabs. The arrangement is reproducible from stored inputs and is visually checked at the intended camera framing.

## Do not do

- Do not generate a whole city map system unless the target projects need traversable worlds.
- Do not make all environments procedural.
- Do not mix incompatible perspective families silently.

---

# Phase 27 — Action Graph and Timeline Orchestration

**Priority:** P1.  
**Purpose:** Allow an agent to coordinate many small actions into a readable performance without manually managing every animation property.

Phase 15 provided reusable animation primitives; this phase composes them into sequences and parallel behaviors.

## Tasks

1. Define an action graph or equivalent typed structure supporting sequential actions, concurrent actions, delays, dependencies, loops, and optional triggers.
2. Specify which timing inputs use frames, seconds, or normalized progress. Convert at defined boundaries and avoid ambiguous time units.
3. Support shared scene timing and relative actions: for example, “start the head turn after the character notices the photograph, while rain continues throughout.”
4. Define behavior for interruptions, overlapping writes to the same property, conflicting actions, and actions whose prerequisites are not met.
5. Provide explicit composition rules for blending compatible actions and prioritizing mutually exclusive ones.
6. Add timeline diagnostics that display each action's target, properties, start/end frames, dependencies, and conflicts.
7. Keep the action graph optional; low-level frame-driven React code remains available for unusual or highly bespoke scenes.

## Deliverables

- Action graph schema/runtime or typed helper layer.
- Conflict and timing diagnostics.
- Examples combining at least three concurrent/sequential actions.
- Frame determinism tests.

## Acceptance gate

A fresh agent can coordinate a small character performance and ongoing environment motion through high-level actions, understand the calculated timing, and render reproducibly. Conflicting property ownership is detected or resolved by documented rules.

## Do not do

- Do not invent a large custom scripting language if a typed object graph is sufficient.
- Do not hide timing conversions or conflict resolution.
- Do not require action graphs for simple animations.

---

# Phase 28 — Shot Direction and Cinematic Intent

**Priority:** P1/P2.  
**Purpose:** Give agents tools for expressing why a camera move or composition is being used, not just how many pixels it moves.

This is a helper layer for creative intent, not a fixed film-making formula.

## Tasks

1. Define a small vocabulary of shot intents, such as establishing, wide, medium, close-up, insert/detail, over-the-shoulder, reveal, follow, and hold. Allow custom intents and free-form scene code.
2. Let an intent specify subjects, relative prominence, desired negative space, screen region, camera target, safe bounds, and optional depth emphasis.
3. Provide helpers for subject framing and camera paths, while exposing the actual computed camera values for debugging.
4. Support shot-specific composition constraints and safe margins; warn when the subject is cropped, obscured, too small, or competes with key text/props where measurable.
5. Support transitions motivated by scene content or movement without forcing every adjacent pair of shots to share a transition.
6. Provide examples where the same assets support different emotional effects through composition and motion choices.
7. Preserve the director's ability to override every suggested default.

## Deliverables

- Typed shot-intent contract and camera/framing helpers.
- At least three distinct shots using the same character/environment assets.
- Diagnostics for measurable composition violations.

## Acceptance gate

An agent can request a supported shot intent and get a useful, inspectable starting composition; it can then customize the framing. The system does not pretend to judge subjective emotion perfectly, and user/code overrides remain possible.

## Do not do

- Do not hard-code one camera grammar for all genres.
- Do not convert subjective aesthetics into false numerical certainty.
- Do not make a camera preset a substitute for actual composition review.

---

# Phase 29 — Visual Diagnostics Workbench

**Priority:** P1.  
**Purpose:** Make invisible implementation mistakes visible to the agent and developer quickly.

This is not necessarily a graphical animation editor. It can be built primarily from renderable debug overlays, reports, and scripts.

## Tasks

1. Provide a debug mode that can overlay asset bounds, pivots, attachment points, rig joints, ground lines, depth planes, camera-safe regions, and constraint targets.
2. Allow diagnostic rendering of a selected frame, frame range, scene, or animation action.
3. Generate a scene inventory showing entity ID, type, asset ID, bounds, parent, depth/order, active actions, and referenced files.
4. Produce contact sheets at strategically selected frames (start, key action, end, and suspicious points) rather than rendering every frame unnecessarily.
5. Add a lightweight report for missing files, out-of-bounds content, likely clipping, excessive layer overlap, invalid anchors, and unknown capabilities.
6. Ensure debug overlays can never accidentally appear in the final render unless explicitly requested.
7. Keep the outputs machine-readable where practical so an agent can act on them.

## Deliverables

- Debug overlay mode.
- Scene inventory/report generator.
- Selected-frame/contact-sheet rendering command.
- Tests proving debug elements are disabled in production output by default.

## Acceptance gate

A developer or agent can identify the location and type of a deliberately introduced anchor, bounds, or depth error using the diagnostics without searching the entire codebase manually.

## Do not do

- Do not start a large GUI editor unless these diagnostics prove insufficient.
- Do not rely only on logs when a visual overlay would reveal the issue.

---

# Phase 30 — Evidence-Backed Visual Repair Loop

**Priority:** P1.  
**Purpose:** Improve the quality of the agent's correction process by making repair steps targeted, repeatable, and verifiable.

Phase 17 established a visual feedback loop. This phase formalizes defect classification and evidence so that the agent does not make many speculative changes at once.

## Tasks

1. Define a practical visual-defect taxonomy: missing asset, invalid anchor, part misalignment, bad scale, exposed background edge, depth-order mistake, composition issue, abrupt motion, pose discontinuity, visual-style mismatch, timing issue, and performance/render error.
2. For each defect type, document the evidence that can reveal it and which subsystem is likely responsible.
3. Create a repair-report format: observed issue, affected entity/frame range, probable cause, proposed change, expected result, and verification procedure.
4. Teach the agent to make one high-impact correction at a time when feasible, then render the relevant frames again to confirm the fix.
5. Preserve before/after frames and the specific source/configuration changes that produced the improvement.
6. Separate objective failures that can be automated from subjective judgments requiring model or human review.
7. Add a stop condition: after a bounded number of unsuccessful repair attempts, the agent should report the blocker and alternatives instead of looping indefinitely.

## Deliverables

- Visual defect taxonomy and repair report schema.
- Updated skill instructions for evidence-backed repair.
- At least three deliberately introduced defects diagnosed and repaired in benchmark scenes.

## Acceptance gate

The agent can detect or correctly report at least three supported defect types, apply a targeted change, and demonstrate the result with before/after frames. It stops rather than claiming success when a problem remains unresolved.

## Do not do

- Do not claim automated semantic vision if the workflow merely relies on a human/agent reading a screenshot.
- Do not let the agent perform unlimited render–edit loops.
- Do not optimize only for prettier still frames while ignoring temporal defects.

---

# Phase 31 — Style Packs, Continuity Contracts, and Project State

**Priority:** P1.  
**Purpose:** Preserve coherent visual identity across many assets, scenes, and projects.

## Tasks

1. Define versioned style packs that can describe palette, line weight, shading approach, perspective family, nominal scale, edge/outline treatment, and intended mood. Only include attributes relevant to the art style.
2. Allow assets and character definitions to declare which style pack and version they conform to, with compatibility and migration rules.
3. Formalize reusable project entities: characters, locations, props, costumes/outfits, and environment variants with stable IDs.
4. Track scene-specific changes separately from canonical identity. A character may change clothes or expression without silently changing their defining design.
5. Support a project manifest that records style-pack versions, asset-pack versions, seeds, scene definitions, and relevant runtime versions.
6. Provide a consistency report that identifies missing references, mixed style families, incompatible asset versions, and accidental duplicate identities where detectable.
7. Keep user-provided preferences local to the relevant project unless the user explicitly asks for broader reuse; do not infer or store personal preferences from unrelated content.

## Deliverables

- Versioned style-pack and project-manifest contracts.
- Migration/compatibility rules for asset-pack updates.
- A multi-shot continuity example with one reusable character, one location, and at least one variant.

## Acceptance gate

A project can be reopened or rendered in a fresh session with the same intended assets, style versions, and procedural seed. A character's appearance changes only where the scene definition explicitly permits it.

## Do not do

- Do not require every project to use the same style pack.
- Do not silently update pinned assets to incompatible versions.
- Do not use a style consistency score as proof of artistic quality.

---

# Phase 32 — PeerPro Extension SDK and Capability Packs

**Priority:** P2, unless external contributors or multiple project teams already need extensions.  
**Purpose:** Let PeerPro grow without requiring every new behavior to modify the core toolkit.

## Tasks

1. Define what an extension can contribute: asset packs, scene components, animation primitives, rig profiles, action definitions, validation rules, debug reports, or examples.
2. Create a minimal extension manifest with stable ID, version, PeerPro API compatibility range, dependencies, contributed capabilities, and license/provenance details.
3. Establish a registration/discovery mechanism that allows the agent to list and inspect extension capabilities before using them.
4. Provide one example extension developed outside the core implementation.
5. Add compatibility checks and actionable errors for missing or conflicting dependencies.
6. Document extension safety boundaries. Loading arbitrary code must be an explicit project action; do not silently execute untrusted packages.
7. Keep extension APIs intentionally small until a real second or third extension reveals what needs to be generalized.

## Deliverables

- Extension manifest/schema and discovery contract.
- One working external-style extension example.
- Compatibility checks and authoring documentation.

## Acceptance gate

A developer can add a new capability pack through the documented extension interface without editing core files, and a fresh agent can discover and use it from its declared manifest.

## Do not do

- Do not build a public marketplace or remote package server yet.
- Do not create an elaborate plugin framework before one simple extension works.
- Do not execute untrusted extension code automatically.

---

# 3. Recommended priority after Phase 21

Do not blindly treat every phase as equally urgent. Use the creative-generalization results to choose what gives the biggest practical gain.

| Priority | Phase | Why it matters |
|---|---|---|
| P0 | 21 — Creative Generalization Challenge | Reveals whether PeerPro works for new tasks, not only known examples. |
| P1 | 22 — Asset Foundry | Improves the reliability and scalability of the visual building blocks. |
| P1 | 23 — Scene Graph and Spatial Constraints | Lets agents express relationships instead of managing every coordinate manually. |
| P1 | 24 — Character Performance | Makes reusable characters capable of more than static assembly. |
| P1/P2 | 25 — Character–Object Interaction | Adds meaningful, coordinated actions when target scenes need them. |
| P1 | 26 — Environment Layout | Enables multiple spatially coherent worlds from modular parts. |
| P1 | 27 — Action Graph | Coordinates complex motion while retaining deterministic timing. |
| P1/P2 | 28 — Shot Direction | Makes camera/composition tools aware of subjects and creative intent. |
| P1 | 29 — Visual Diagnostics | Speeds up diagnosis of hard-to-see layout and rig problems. |
| P1 | 30 — Visual Repair Loop | Makes iteration evidence-backed and bounded. |
| P1 | 31 — Style and Continuity Contracts | Preserves identity and reproducibility over longer projects. |
| Conditional | 32 — Extension SDK | Add when there is a real need to ship capabilities independently. |

**Dependency note:** Phases 23–27 are related. If the current scene/character architecture cannot express spatial relationships cleanly, establish that foundation before adding interaction or action orchestration. Phase 29 can be brought forward if debugging is slowing all other work. Phase 32 should remain last unless multiple independent capability packs already exist.

---

# 4. Completion standard for this roadmap

PeerPro has reached a strong frontier milestone when a fresh AI agent can receive a novel request such as:

> Build a short 2.5D scene featuring a consistent teenage character in a rainy Japanese street. Assemble the character from compatible parts, construct the location from modular assets, stage a simple character–prop interaction, combine character actions with environmental motion, direct a readable camera move, inspect diagnostics, repair visible defects, and render a repeatable result.

The evidence should include:

- the user prompt and agent's chosen assets/capabilities;
- character, scene, and project definitions;
- source composition and rendered clip;
- selected preview frames, including at least one meaningful action moment;
- diagnostics and a repair report if corrections were needed;
- actual commands and test results;
- a clear list of unsupported requests or remaining visual limitations.

The target is **not** universal perfect animation. The target is increasing creative freedom, composability, visual coherence, and reliable correction with each version.

---

# 5. References to consult during implementation

Use current official documentation and installed-project conventions at implementation time, rather than trusting stale examples.

- Remotion Agent Skills: https://github.com/remotion-dev/skills
- Remotion animation math: https://www.remotion.dev/docs/animation-math
- Remotion assets: https://www.remotion.dev/docs/assets
- Remotion ThreeCanvas (optional 3D integration): https://www.remotion.dev/docs/three-canvas

Remotion's frame-based animation model remains important for determinism and scrubbing. Three-dimensional integration is an optional extension, not a prerequisite for this roadmap.
