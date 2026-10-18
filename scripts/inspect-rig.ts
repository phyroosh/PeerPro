#!/usr/bin/env tsx
/**
 * scripts/inspect-rig.ts
 *
 * PeerPro Character Rig & Performance Inspector CLI
 * Inspects character rig profiles, joint limits, compatibility with action clips,
 * and deterministic clip evaluations.
 *
 * Usage:
 *   npx tsx scripts/inspect-rig.ts [characterId] [--clip=<clipId>] [--json]
 */

import { defaultCharacterPresets } from '../src/core/characters/presets';
import {
  getRigProfileDefinition,
  inferRigProfile,
  RIG_PROFILES,
} from '../src/core/characters/rigs/profiles';
import {
  STARTER_ACTION_LIBRARY,
  getActionClip,
} from '../src/core/characters/rigs/clips';
import { validateRigCompatibility } from '../src/core/characters/rigs/validator';
import { evaluatePerformanceClips } from '../src/core/characters/rigs/evaluator';

function parseArgs(args: string[]): {
  characterId?: string;
  clipId?: string;
  json: boolean;
} {
  let characterId: string | undefined;
  let clipId: string | undefined;
  let json = false;

  for (const arg of args) {
    if (arg === '--json') {
      json = true;
    } else if (arg.startsWith('--clip=')) {
      clipId = arg.substring('--clip='.length);
    } else if (!arg.startsWith('--')) {
      characterId = arg;
    }
  }

  return { characterId, clipId, json };
}

function main(): void {
  const { characterId, clipId, json } = parseArgs(process.argv.slice(2));

  // If no character ID specified, list all available presets and rig profiles
  if (!characterId) {
    const summary = Object.values(defaultCharacterPresets).map((char) => {
      const profile = inferRigProfile(char);
      const rigDef = getRigProfileDefinition(profile);
      return {
        id: char.id,
        name: char.name,
        rigProfile: profile,
        capabilities: rigDef.capabilities,
        joints: rigDef.supportedJoints,
      };
    });

    if (json) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log('===============================================================');
    console.log('          PeerPro Character Rig Profile Directory              ');
    console.log('===============================================================');
    console.log(`Discovered ${summary.length} character presets:\n`);

    for (const item of summary) {
      console.log(`• [${item.id}] ${item.name}`);
      console.log(`  - Rig Profile:  ${item.rigProfile}`);
      console.log(`  - Joints:       ${item.joints.join(', ')}`);
      console.log(`  - Capabilities: ${item.capabilities.join(', ')}`);
      console.log('');
    }

    console.log('Use: npx tsx scripts/inspect-rig.ts <characterId> [--clip=<clipId>]');
    return;
  }

  const character = defaultCharacterPresets[characterId];
  if (!character) {
    console.error(`Error: Character preset "${characterId}" not found.`);
    console.error(`Available presets: ${Object.keys(defaultCharacterPresets).join(', ')}`);
    process.exit(1);
  }

  const rigProfile = inferRigProfile(character);
  const rigDef = getRigProfileDefinition(rigProfile);

  // Evaluate compatibility with all starter clips
  const clipReports = Object.values(STARTER_ACTION_LIBRARY).map((clip) => {
    return validateRigCompatibility(character, clip);
  });

  if (json) {
    console.log(
      JSON.stringify(
        {
          character: {
            id: character.id,
            name: character.name,
            styleFamily: character.styleFamily,
            rigProfile,
          },
          rigDefinition: rigDef,
          clipCompatibility: clipReports,
        },
        null,
        2
      )
    );
    return;
  }

  console.log('===============================================================');
  console.log(`       Character Rig Diagnostics: ${character.name}       `);
  console.log('===============================================================');
  console.log(`ID:           ${character.id}`);
  console.log(`Rig Profile:  ${rigProfile} (${rigDef.name})`);
  console.log(`Style Family: ${character.styleFamily}`);
  console.log(`Description:  ${rigDef.description}`);
  console.log('');

  console.log('--- Joint Limits & Safety Bounds ---');
  for (const [joint, limit] of Object.entries(rigDef.jointLimits)) {
    console.log(
      `  • ${joint.padEnd(14)} : [${limit.min}${limit.unit === 'degrees' ? '°' : 'px'}, ${limit.max}${limit.unit === 'degrees' ? '°' : 'px'}] (rest: ${limit.rest})`
    );
  }
  console.log('');

  console.log('--- Action Clip Compatibility Matrix (10 Starter Clips) ---');
  for (const rep of clipReports) {
    const icon = rep.compatible ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE';
    const issues = rep.compatible
      ? 'OK'
      : rep.errors.join('; ');
    console.log(`  ${icon.padEnd(16)} | ${rep.clipId.padEnd(20)} | ${issues}`);
  }
  console.log('');

  // If a specific clip is requested for simulation
  if (clipId) {
    console.log(`--- Clip Simulation & Evaluation: ${clipId} ---`);
    let clip;
    try {
      clip = getActionClip(clipId);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }

    const report = validateRigCompatibility(character, clip);
    if (!report.compatible) {
      console.log(`⚠️ Warning: Simulating incompatible clip on this rig.`);
      for (const err of report.errors) {
        console.log(`   - ${err}`);
      }
    }

    const testFrames = [0, 15, 30, 45, 60];
    console.log('\nEvaluated Frame Telemetry:');
    for (const f of testFrames) {
      const state = evaluatePerformanceClips(rigProfile, f, [
        {
          clip,
          startFrame: 0,
          durationInFrames: clip.durationInFrames,
          intensity: 1.0,
        },
      ]);

      const jointStr = Object.entries(state.jointRotations)
        .map(([j, val]) => `${j}=${val.toFixed(1)}°`)
        .join(', ');

      const clampStr = state.isClamped ? ' [CLAMPED]' : '';
      console.log(
        `  Frame ${f.toString().padStart(2)}: progress=${state.clipProgress.toFixed(2)} | joints: { ${jointStr} } | rootY=${state.rootOffset.y.toFixed(1)}px${clampStr}`
      );
    }
  }

  console.log('===============================================================');
}

main();
