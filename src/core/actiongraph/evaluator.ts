import { CharacterPoseName } from '../characters/types';
import { resolveCharacterPose } from '../characters/poses';
import { defaultCharacterPresets } from '../characters/presets';
import { CharacterActionName } from '../animation/types';
import { evaluateSingleAction, RawActionState } from '../animation/actions';
import {
  CharacterAnchorContext,
  resolveCharacterAnchor,
} from '../interactions/anchors';
import { solveInteraction } from '../interactions/solver';
import { InteractionDefinition, ResolvedInteraction } from '../interactions/types';
import {
  EvaluatedActionGraphState,
  EvaluatedCharacterState,
  ResolvedActionNode,
  ResolvedTimeline,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mapClipIdToActionName(clipId?: string): CharacterActionName {
  if (!clipId) return 'idle';
  const clean = clipId.toLowerCase().trim();
  if (clean.includes('wave')) return 'wave';
  if (clean.includes('bow')) return 'bow';
  if (clean.includes('talk') || clean.includes('speech')) return 'talk';
  if (clean.includes('point')) return 'point';
  if (clean.includes('nod')) return 'nod';
  if (clean.includes('shake')) return 'shake_head';
  if (clean.includes('shrug')) return 'shrug';
  if (clean.includes('think')) return 'think';
  if (clean.includes('surprise')) return 'surprise';
  if (clean.includes('walk')) return 'walk_cycle';
  return 'idle';
}

export interface EvaluateActionGraphOptions {
  baseEntities?: Record<string, {
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number;
    flipX?: boolean;
    pose?: CharacterPoseName;
    characterDefId?: string;
  }>;
}

/**
 * Pure mathematical evaluator for ActionGraph timelines.
 * Calculates exact character poses, joint rotations, spatial offsets,
 * dynamic interactions, and property track conflict winners for any frame.
 */
export function evaluateActionGraph(
  timeline: ResolvedTimeline,
  frame: number,
  options: EvaluateActionGraphOptions = {}
): EvaluatedActionGraphState {
  const fps = timeline.fps ?? 30;
  const baseEntities = options.baseEntities ?? {};

  // 1. Determine active nodes at current frame
  const activeNodes: ResolvedActionNode[] = [];
  const activeNodeIds: string[] = [];

  for (const node of timeline.nodes) {
    if (frame >= node.absoluteStartFrame && frame < node.absoluteEndFrame) {
      activeNodes.push(node);
      activeNodeIds.push(node.id);
    }
  }

  // 2. Resolve Active Property Ownership (Winners & Blends)
  const activeProperties: Record<string, string> = {}; // trackKey -> winningNodeId
  const activeSegmentsByTrack: Record<string, { nodeId: string; priority: number; startFrame: number }[]> = {};

  for (const [trackKey, segments] of Object.entries(timeline.propertyTracks)) {
    const activeSegs = segments.filter(
      (s) => frame >= s.startFrame && frame < s.endFrame
    );
    if (activeSegs.length > 0) {
      activeSegmentsByTrack[trackKey] = activeSegs;
      // Sort active segments: highest priority wins; if tied, later startFrame wins
      activeSegs.sort(
        (a, b) => b.priority - a.priority || b.startFrame - a.startFrame
      );
      activeProperties[trackKey] = activeSegs[0].nodeId;
    }
  }

  // 3. Identify all characters involved
  const characterIds = new Set<string>();

  // Add characters from baseEntities
  for (const entityId of Object.keys(baseEntities)) {
    if (
      entityId.startsWith('student') ||
      entityId.startsWith('char') ||
      defaultCharacterPresets[entityId]
    ) {
      characterIds.add(entityId);
    }
  }

  // Add characters from nodes
  for (const node of timeline.nodes) {
    if (
      node.targetId.startsWith('student') ||
      node.targetId.startsWith('char') ||
      defaultCharacterPresets[node.targetId] ||
      node.actionType === 'clip' ||
      node.actionType === 'pose' ||
      node.actionType === 'expression'
    ) {
      characterIds.add(node.targetId);
    }
    if (node.interactionDef?.characterId) {
      characterIds.add(node.interactionDef.characterId);
    }
    if (node.interactionDef?.secondaryCharacterId) {
      characterIds.add(node.interactionDef.secondaryCharacterId);
    }
  }

  // If no characters identified yet, provide fallback default 'student-articulated'
  if (characterIds.size === 0) {
    characterIds.add('student-articulated');
  }

  // 4. Initialize Evaluated Character States
  const characters: Record<string, EvaluatedCharacterState> = {};

  for (const charId of characterIds) {
    const base = baseEntities[charId] ?? {};
    const defaultPose = base.pose ?? 'idle';
    const poseRes = resolveCharacterPose(defaultPose);

    characters[charId] = {
      characterId: charId,
      pose: defaultPose,
      jointRotations: {},
      rootOffset: {
        x: base.x ?? 0,
        y: base.y ?? 0,
        rotation: base.rotation ?? 0,
        scale: base.scale ?? 1.0,
      },
      partOverrides: { ...poseRes.overrides },
      expression: {},
      activeNodeIds: [],
    };
  }

  // 5. Evaluate Character Action Nodes
  // Separate nodes by character and evaluate
  for (const node of activeNodes) {
    const charState = characters[node.targetId];
    if (charState) {
      charState.activeNodeIds.push(node.id);
    }

    const localFrame = frame - node.absoluteStartFrame;
    const dur = node.effectiveDurationInFrames;
    const progress = dur > 0 ? clamp(localFrame / dur, 0, 1) : 0;

    // Compute blend envelope if specified
    const blendIn = node.blendInFrames ?? 0;
    const blendOut = node.blendOutFrames ?? 0;
    let blendWeight = 1.0;

    if (blendIn > 0 && localFrame < blendIn) {
      blendWeight = Math.min(blendWeight, localFrame / blendIn);
    }
    const remainingFrames = dur - localFrame;
    if (blendOut > 0 && remainingFrames < blendOut) {
      blendWeight = Math.min(blendWeight, remainingFrames / blendOut);
    }
    blendWeight = clamp(blendWeight, 0, 1);

    // Apply depending on actionType
    switch (node.actionType) {
      case 'pose': {
        if (node.pose && charState) {
          const trackKey = `${node.targetId}.pose`;
          if (!activeProperties[trackKey] || activeProperties[trackKey] === node.id) {
            charState.pose = node.pose;
            const poseRes = resolveCharacterPose(node.pose);
            Object.assign(charState.partOverrides, poseRes.overrides);
          }
        }
        break;
      }

      case 'expression': {
        if (node.expression && charState) {
          const trackKey = `${node.targetId}.expression`;
          if (!activeProperties[trackKey] || activeProperties[trackKey] === node.id) {
            if (node.expression.eyes) {
              charState.expression.eyes = node.expression.eyes;
              charState.partOverrides.eyes = node.expression.eyes;
            }
            if (node.expression.mouth) {
              charState.expression.mouth = node.expression.mouth;
              charState.partOverrides.mouth = node.expression.mouth;
            }
          }
        }
        break;
      }

      case 'transform': {
        if (node.transform && charState) {
          const trackKey = `${node.targetId}.transform`;
          if (!activeProperties[trackKey] || activeProperties[trackKey] === node.id) {
            if (node.transform.x !== undefined) {
              charState.rootOffset.x = lerp(
                charState.rootOffset.x,
                node.transform.x,
                blendWeight
              );
            }
            if (node.transform.y !== undefined) {
              charState.rootOffset.y = lerp(
                charState.rootOffset.y,
                node.transform.y,
                blendWeight
              );
            }
            if (node.transform.rotation !== undefined) {
              charState.rootOffset.rotation = lerp(
                charState.rootOffset.rotation,
                node.transform.rotation,
                blendWeight
              );
            }
            if (node.transform.scale !== undefined) {
              charState.rootOffset.scale = lerp(
                charState.rootOffset.scale,
                node.transform.scale,
                blendWeight
              );
            }
          }
        }
        break;
      }

      case 'clip': {
        if (charState) {
          const actionName = mapClipIdToActionName(node.clipId);
          const rawState = evaluateSingleAction(
            actionName,
            progress,
            frame,
            fps,
            (node.options?.intensity as number) ?? 1.0,
            node.options as any
          );

          // Evaluate joint rotations
          for (const [joint, rotVal] of Object.entries(rawState.jointRotations)) {
            const trackKey = `${node.targetId}.jointRotations.${joint}`;
            const isWinner = !activeProperties[trackKey] || activeProperties[trackKey] === node.id;
            const policy = node.conflictPolicy ?? 'override';

            if (isWinner || policy === 'blend') {
              const currentVal = charState.jointRotations[joint] ?? 0;
              if (policy === 'blend' && !isWinner) {
                // Crossfade blend with winner
                charState.jointRotations[joint] = lerp(currentVal, rotVal, blendWeight * 0.5);
              } else {
                charState.jointRotations[joint] = lerp(currentVal, rotVal, blendWeight);
              }
            }
          }

          // Evaluate root offset delta
          const rootTrackKey = `${node.targetId}.rootOffset`;
          if (!activeProperties[rootTrackKey] || activeProperties[rootTrackKey] === node.id) {
            charState.rootOffset.y += rawState.rootOffset.y * blendWeight;
            charState.rootOffset.rotation += rawState.rootOffset.rotation * blendWeight;
          }

          // Evaluate discrete pose & partOverrides if dominant
          const poseTrackKey = `${node.targetId}.pose`;
          if (!activeProperties[poseTrackKey] || activeProperties[poseTrackKey] === node.id) {
            if (rawState.pose && rawState.pose !== 'idle') {
              charState.pose = rawState.pose;
              Object.assign(charState.partOverrides, rawState.partOverrides);
            }
            if (rawState.expressionCue) {
              if (rawState.expressionCue.eyes) {
                charState.expression.eyes = rawState.expressionCue.eyes;
                charState.partOverrides.eyes = rawState.expressionCue.eyes;
              }
              if (rawState.expressionCue.mouth) {
                charState.expression.mouth = rawState.expressionCue.mouth;
                charState.partOverrides.mouth = rawState.expressionCue.mouth;
              }
            }
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // 6. Evaluate Interactions
  const interactions: Record<string, ResolvedInteraction> = {};

  for (const node of activeNodes) {
    if (node.actionType === 'interaction' && node.interactionDef) {
      const charId = node.interactionDef.characterId || node.targetId;
      const charDef =
        defaultCharacterPresets[charId] ||
        defaultCharacterPresets['student-articulated'] ||
        defaultCharacterPresets['student-ren-v2'];

      const charState = characters[charId];
      const charAnchorContext: CharacterAnchorContext = {
        x: charState?.rootOffset.x ?? 0,
        y: charState?.rootOffset.y ?? 0,
        scale: charState?.rootOffset.scale ?? 1.0,
        flipX: baseEntities[charId]?.flipX ?? false,
        rootOffsetY: 0,
        jointRotations: charState?.jointRotations ?? {},
        activePartOverrides: charState?.partOverrides ?? {},
      };

      const fullDef: InteractionDefinition = {
        id: node.id,
        type: node.interactionDef.type ?? 'hold_prop',
        characterId: charId,
        targetId: node.interactionDef.targetId ?? 'target-prop',
        secondaryCharacterId: node.interactionDef.secondaryCharacterId,
        startFrame: node.absoluteStartFrame,
        durationInFrames: node.effectiveDurationInFrames,
        characterAnchor: node.interactionDef.characterAnchor,
        targetAnchor: node.interactionDef.targetAnchor,
        secondaryAnchor: node.interactionDef.secondaryAnchor,
        transitionFrames: node.interactionDef.transitionFrames,
        holdLayer: node.interactionDef.holdLayer,
        surfaceY: node.interactionDef.surfaceY,
        options: node.interactionDef.options,
      };

      const resolved = solveInteraction(fullDef, charDef, charAnchorContext, frame);
      interactions[node.id] = resolved;
    }
  }

  return {
    frame,
    characters,
    interactions,
    activeNodeIds,
    activeProperties,
  };
}
