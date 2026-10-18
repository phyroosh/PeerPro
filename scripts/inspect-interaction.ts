#!/usr/bin/env tsx
/**
 * scripts/inspect-interaction.ts
 *
 * PeerPro Character–Object Interaction Inspector CLI
 * Simulates, validates, and diagnoses character-prop interactions and verifies
 * zero-drift forward kinematics tracking across animation frames.
 *
 * Usage:
 *   npx tsx scripts/inspect-interaction.ts [--character=id] [--prop=id] [--type=interactionType] [--json]
 */

import { defaultCharacterPresets } from '../src/core/characters/presets';
import { InteractionType, InteractionDefinition } from '../src/core/interactions/types';
import { solveInteraction } from '../src/core/interactions/solver';
import { validateInteractionCompatibility } from '../src/core/interactions/validator';
import { resolveCharacterAnchor, resolvePropSocketOffset } from '../src/core/interactions/anchors';

function parseArgs(args: string[]): {
  characterId: string;
  propId: string;
  type: InteractionType;
  json: boolean;
} {
  let characterId = 'student-articulated';
  let propId = 'starter-prop-umbrella';
  let type: InteractionType = 'hold_prop';
  let json = false;

  for (const arg of args) {
    if (arg === '--json') {
      json = true;
    } else if (arg.startsWith('--character=')) {
      characterId = arg.substring('--character='.length);
    } else if (arg.startsWith('--prop=')) {
      propId = arg.substring('--prop='.length);
    } else if (arg.startsWith('--type=')) {
      type = arg.substring('--type='.length) as InteractionType;
    }
  }

  return { characterId, propId, type, json };
}

function main(): void {
  const { characterId, propId, type, json } = parseArgs(process.argv.slice(2));

  const character = defaultCharacterPresets[characterId];
  if (!character) {
    console.error(`Error: Character preset "${characterId}" not found.`);
    process.exit(1);
  }

  const interaction: InteractionDefinition = {
    id: `cli-interaction-${type}`,
    type,
    characterId,
    targetId: propId,
    startFrame: 0,
    durationInFrames: 60,
    characterAnchor: 'hand_right',
    targetAnchor: 'grip',
    transitionFrames: 20,
    holdLayer: 'in_front_of',
  };

  const report = validateInteractionCompatibility(interaction, character);

  // Simulate across 5 frames with sinusoidal arm waving and breathing
  const testFrames = [0, 15, 30, 45, 60];
  const frameTelemetry = testFrames.map((f) => {
    // Oscillating arm wave and vertical breathing displacement
    const armWaveAngle = Math.sin((f / 60) * Math.PI * 2 * 2.0) * 16.0;
    const breathY = Math.sin((f / 60) * Math.PI * 2) * 2.5;

    const context = {
      x: 960,
      y: 890,
      scale: 1.0,
      flipX: false,
      rootOffsetY: breathY,
      jointRotations: {
        armRight: armWaveAngle,
        headTilt: -1.5,
      },
      activePartOverrides: {
        armsRight: 'starter-char-arm-01-right-wave',
      },
    };

    const resolved = solveInteraction(interaction, character, context, f);

    // Verify delta between Hand Anchor and Prop Grip Socket
    const hand = resolveCharacterAnchor(character, 'hand_right', context);
    const propOffset = resolvePropSocketOffset(propId, 'grip');
    const computedGripX = resolved.targetTransform.x + propOffset.x;
    const computedGripY = resolved.targetTransform.y + propOffset.y;

    const driftX = Math.abs(hand.x - computedGripX);
    const driftY = Math.abs(hand.y - computedGripY);

    return {
      frame: f,
      armAngle: armWaveAngle,
      breathY,
      handPos: { x: Number(hand.x.toFixed(2)), y: Number(hand.y.toFixed(2)) },
      propPos: { x: Number(resolved.targetTransform.x.toFixed(2)), y: Number(resolved.targetTransform.y.toFixed(2)) },
      propRotation: Number(resolved.targetTransform.rotation.toFixed(2)),
      driftX: Number(driftX.toFixed(4)),
      driftY: Number(driftY.toFixed(4)),
      isAttached: resolved.isAttached,
      carrierId: resolved.carrierId,
    };
  });

  if (json) {
    console.log(
      JSON.stringify(
        {
          interaction,
          compatibility: report,
          simulation: frameTelemetry,
        },
        null,
        2
      )
    );
    return;
  }

  console.log('===============================================================');
  console.log('       PeerPro Character–Object Interaction Diagnostics        ');
  console.log('===============================================================');
  console.log(`Interaction Type:  ${type}`);
  console.log(`Character:         ${character.name} (${character.id})`);
  console.log(`Target Prop:       ${propId}`);
  console.log(`Rig Compatibility: ${report.compatible ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE'}`);
  if (!report.compatible) {
    console.log(`Errors:            ${report.errors.join('; ')}`);
  }
  if (report.warnings.length > 0) {
    console.log(`Warnings:          ${report.warnings.join('; ')}`);
  }
  console.log('');

  console.log('--- Multi-Frame FK Tracking & Zero-Drift Verification ---');
  for (const row of frameTelemetry) {
    const driftStatus = row.driftX < 0.01 && row.driftY < 0.01 ? '⚡ 0.00px (PERFECT)' : `⚠️ ${row.driftX}px`;
    console.log(
      `  Frame ${row.frame.toString().padStart(2)}: ArmRot=${row.armAngle.toFixed(1).padStart(5)}° | Hand=(${row.handPos.x}, ${row.handPos.y}) | Prop=(${row.propPos.x}, ${row.propPos.y}) | Drift=${driftStatus}`
    );
  }
  console.log('===============================================================');
}

main();
