#!/usr/bin/env tsx
/**
 * scripts/inspect-cinematic-intent.ts
 *
 * PeerPro Shot Direction and Cinematic Intent Inspector CLI
 * Solves high-level shot intents into concrete camera framing, evaluates composition criteria
 * (headroom, lead room, safe areas, scale ratios), and outputs detailed diagnostics.
 *
 * Usage:
 *   npx tsx scripts/inspect-cinematic-intent.ts [--preset=name] [--json]
 */

import fs from 'fs';
import path from 'path';
import {
  defaultShotIntentPresets,
  formatCompositionReport,
  resolveCinematicIntent,
  ShotIntentSpec,
  validateShotComposition,
  WIDE_ESTABLISHING_PRESET,
} from '../src/core/cinematography';

function parseArgs(): {
  inputPath?: string;
  presetName?: string;
  isJson: boolean;
} {
  const args = process.argv.slice(2);
  let inputPath: string | undefined;
  let presetName: string | undefined;
  let isJson = false;

  for (const arg of args) {
    if (arg === '--json') {
      isJson = true;
    } else if (arg.startsWith('--preset=')) {
      presetName = arg.substring('--preset='.length);
    } else if (!arg.startsWith('--') && !inputPath) {
      inputPath = arg;
    }
  }

  return { inputPath, presetName, isJson };
}

function main(): void {
  const { inputPath, presetName, isJson } = parseArgs();

  let spec: ShotIntentSpec;

  if (inputPath) {
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: Intent specification file not found at ${resolvedPath}`);
      process.exit(1);
    }
    spec = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } else if (presetName && defaultShotIntentPresets[presetName]) {
    spec = defaultShotIntentPresets[presetName];
  } else {
    spec = WIDE_ESTABLISHING_PRESET;
  }

  const solution = resolveCinematicIntent(spec);
  const report = validateShotComposition(solution, spec);

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          spec,
          solution,
          report,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(formatCompositionReport(report));
  console.log('--- SOLVED FRAMING PARAMETERS ---');
  console.log(`  * Shot Intent:        ${solution.intent.toUpperCase()}`);
  console.log(`  * Camera Preset:      ${solution.camera.preset}`);
  console.log(`  * Camera Zoom:        ${solution.debugTelemetry.computedZoom.toFixed(2)}x`);
  console.log(`  * Focal Depth:        ${solution.camera.focalDepth ?? 1.0}`);
  console.log(`  * DoF Enabled:        ${solution.camera.depthOfField?.enabled ? `YES (Aperture: ${solution.camera.depthOfField.aperture}, MaxBlur: ${solution.camera.depthOfField.maxBlur}px)` : 'NO'}`);
  console.log(`  * Camera Shake:       ${solution.camera.shake?.enabled ? `YES (Freq: ${solution.camera.shake.frequency}Hz, Amp: ${solution.camera.shake.amplitudeX}px)` : 'NO'}`);
  console.log(`  * Primary Subject:    ${solution.subject.characterId}`);
  console.log(`  * Subject Position:   (${solution.subject.position.x}px, ${solution.subject.position.y}px)`);
  console.log(`  * Subject Scale:      ${solution.subject.scale.toFixed(2)}`);
  console.log(`  * Target Headroom:    ${solution.debugTelemetry.targetHeadroomPx.toFixed(1)}px`);
  console.log(`  * Lead Room Vector:   ${solution.debugTelemetry.leadRoomDirection.toUpperCase()}`);
  if (solution.secondarySubject) {
    console.log(`  * Secondary Subject:  ${solution.secondarySubject.characterId} at (${solution.secondarySubject.position.x}px, ${solution.secondarySubject.position.y}px) scale: ${solution.secondarySubject.scale.toFixed(2)}`);
  }
  console.log('================================================================================');

  if (!report.valid) {
    process.exit(1);
  }
}

main();
