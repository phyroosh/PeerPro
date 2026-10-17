import fs from 'fs';
import path from 'path';
import { BenchmarkEntry } from './types';
import defaultBaselines from './baselines.json';

const baselinesJsonPath = path.resolve(__dirname, 'baselines.json');

/**
 * Curated catalog of the 10 Standard PeerPro Benchmarks.
 * These benchmarks represent the complete creative capability stack of PeerPro:
 * from character modularity, environment layout, and 2.5D parallax to
 * 11-action animations, optical cinematics, AI agent scene orchestration, and audio lip-sync.
 */
export const STANDARD_BENCHMARKS: BenchmarkEntry[] = [
  {
    id: 'B1_CHARACTER',
    name: 'Character Builder & Socket Hierarchy',
    compositionId: 'CharacterShowcase',
    frame: 30,
    category: 'character',
    maxRenderTimeMs: 5000,
    description: 'Validates 4 modular character presets, socket alignment, depth-order, and blink cycles.',
  },
  {
    id: 'B2_ENVIRONMENT',
    name: 'Multi-Plane Environment Grammar',
    compositionId: 'EnvironmentShowcase',
    frame: 40,
    category: 'environment',
    maxRenderTimeMs: 5000,
    description: 'Validates Tokyo street corner parallax planes, sky gradients, and building layer hierarchy.',
  },
  {
    id: 'B3_PARALLAX',
    name: '2.5D Parallax Camera & Particles',
    compositionId: 'ParallaxTest',
    frame: 60,
    category: 'parallax',
    maxRenderTimeMs: 5000,
    description: 'Validates multi-plane camera projection math, HUD coordinate overlays, and floating sakura particles.',
  },
  {
    id: 'B4_STYLE',
    name: '2-Tier Cel-Shading & Perspective',
    compositionId: 'StyleShowcase',
    frame: 60,
    category: 'style',
    maxRenderTimeMs: 5000,
    description: 'Validates high-fidelity line weights, cast shadows, eye catchlights, and 3/4 angle styling.',
  },
  {
    id: 'B5_CUTOUT',
    name: 'Articulated Cutout Forward Kinematics',
    compositionId: 'CutoutRigShowcase',
    frame: 60,
    category: 'rigging',
    maxRenderTimeMs: 5000,
    description: 'Validates hierarchical bone transforms, torso/head/arm/leg rotations, and secondary overlap motion.',
  },
  {
    id: 'B6_CLASSROOM',
    name: 'Indoor Classroom Grammar & Furniture',
    compositionId: 'ClassroomShowcase',
    frame: 60,
    category: 'environment',
    maxRenderTimeMs: 5000,
    description: 'Validates indoor blackboard, student desks, wooden floor perspective, and window natural lighting.',
  },
  {
    id: 'B7_ACTION',
    name: '11-Action Vocabulary & Blend Trees',
    compositionId: 'ActionShowcase',
    frame: 52,
    category: 'animation',
    maxRenderTimeMs: 5000,
    description: 'Validates Japanese polite bow action, anticipation curves, Hermite easing, and settling physics.',
  },
  {
    id: 'B8_CINEMATOGRAPHY',
    name: 'Multi-Shot Sequence & Optical Bokeh',
    compositionId: 'CinematicSequenceShowcase',
    frame: 105,
    category: 'cinematography',
    maxRenderTimeMs: 6000,
    description: 'Validates shot transitions, letterbox bars, circle of confusion depth-of-field, and handheld drift.',
  },
  {
    id: 'B9_AGENT',
    name: 'AI Agent Scene Manifest & Composition',
    compositionId: 'AgentScene',
    frame: 45,
    category: 'agent',
    maxRenderTimeMs: 5000,
    description: 'Validates declarative JSON scene execution, dialogue overlays, and auto-correct visual composition.',
  },
  {
    id: 'B10_AUDIO',
    name: 'Audio Narrative & Viseme Lip-Sync',
    compositionId: 'AudioNarrativeShowcase',
    frame: 45,
    category: 'audio',
    maxRenderTimeMs: 5000,
    description: 'Validates speech cadence viseme mouth switching, multi-track audio meters, and volume ducking indicators.',
  },
];

/**
 * Loads golden SHA-256 baselines from baselines.json (or returns embedded fallback).
 */
export function loadBaselines(): Record<string, string> {
  try {
    if (fs.existsSync(baselinesJsonPath)) {
      const content = fs.readFileSync(baselinesJsonPath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Fall back to imported defaultBaselines
  }
  return defaultBaselines as Record<string, string>;
}

/**
 * Saves updated golden SHA-256 baselines to baselines.json.
 */
export function saveBaselines(baselines: Record<string, string>): void {
  fs.writeFileSync(baselinesJsonPath, JSON.stringify(baselines, null, 2) + '\n', 'utf8');
}

/**
 * Returns the benchmark catalog populated with current golden baseline SHA-256 hashes.
 */
export function getBenchmarkCatalog(): BenchmarkEntry[] {
  const baselines = loadBaselines();
  return STANDARD_BENCHMARKS.map((entry) => ({
    ...entry,
    goldenSha256: baselines[entry.id] || entry.goldenSha256,
  }));
}

/**
 * Finds a single benchmark by its ID.
 */
export function findBenchmarkById(id: string): BenchmarkEntry | undefined {
  return getBenchmarkCatalog().find((entry) => entry.id === id);
}
