#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { defaultVoiceoverService } from '../src/core/voiceover/service';
import { defaultVoiceoverRegistry } from '../src/core/voiceover/registry';
import {
  VoiceFilterOptions,
  VoiceoverGender,
  VoiceoverPresetName,
  VoiceoverProviderId,
} from '../src/core/voiceover/types';
import { VOICEOVER_PRESETS } from '../src/core/voiceover/presets';
import { SceneManifest } from '../src/core/scene/types';
import { validateSceneManifest } from '../src/core/scene/validator';
import { defaultAssetRegistry } from '../src/core/assets/registry';
import { AssetPackManifest } from '../src/core/assets/types';

const projectRoot = path.resolve(__dirname, '..');
const starterManifestPath = path.join(projectRoot, 'asset-packs', 'starter-kit', 'manifest.json');
if (fs.existsSync(starterManifestPath)) {
  const manifest: AssetPackManifest = JSON.parse(fs.readFileSync(starterManifestPath, 'utf8'));
  defaultAssetRegistry.registerPack(manifest, { validate: false });
}

function printHelp() {
  console.log(`
===================================================================
  PeerPro Voiceover CLI — Microsoft Edge Neural TTS Integration
===================================================================
Commands:
  list              List and filter available neural voices
    --lang <locale>      Filter by locale (e.g. en, en-US, ja, es)
    --gender <gender>    Filter by gender (Male, Female)
    --search <term>      Search voice name, locale, or ID
    --refresh            Bypass disk cache and refresh from service
    --limit <n>          Maximum results to print (default: 25)
    --json               Output machine-readable JSON

  preview           Generate and listen to a voice preview sample
    --voice <id>         Voice ID (e.g. en-US-JennyNeural, ja-JP-NanamiNeural)
    --preset <name>      Speech preset (natural-narration, calm-storytelling, energetic-narration, reflective-narration)
    --rate <rate>        Speaking rate (e.g. +0%, -10%, +15%)
    --pitch <pitch>      Voice pitch (e.g. +0Hz, -4Hz, +6Hz)
    --volume <vol>       Speech volume (e.g. +0%, -5%, +5%)
    --text <sample>      Custom preview sample text
    --json               Output machine-readable JSON

  synthesize        Generate narration audio file from text
    --text <script>      Narration script (required)
    --out <path>         Output file path (.wav or .mp3)
    --voice <id>         Voice ID (default: en-US-JennyNeural)
    --preset <name>      Speech preset
    --rate <rate>        Speaking rate
    --pitch <pitch>      Voice pitch
    --volume <vol>       Speech volume
    --provider <id>      Provider (edge-tts, espeak)

  sync-scene        Generate voiceovers for all dialog lines in a scene JSON
    <scene.json>         Path to scene definition manifest
    --out <path>         Output path for updated scene (default: overwrites in-place or adds -with-audio)
    --voice <id>         Default voice for dialogue lines
    --preset <name>      Default preset for dialogue lines
    --json               Output summary JSON

Examples:
  npx tsx scripts/voiceover.ts list --lang en-US
  npx tsx scripts/voiceover.ts preview --voice en-US-JennyNeural --preset natural-narration
  npx tsx scripts/voiceover.ts sync-scene scenes/agent-dialog-scene.json --out scenes/agent-dialog-scene-audio.json
`);
}

async function handleList(args: string[]) {
  const isJson = args.includes('--json');
  const refresh = args.includes('--refresh');

  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const locale = getArg('--lang') || getArg('--locale');
  const gender = getArg('--gender') as VoiceoverGender | undefined;
  const search = getArg('--search');
  const limitStr = getArg('--limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 25;

  const filter: VoiceFilterOptions = {
    locale,
    gender,
    search,
    refresh,
  };

  try {
    const voices = await defaultVoiceoverService.discoverVoices(filter);

    if (isJson) {
      console.log(JSON.stringify(voices, null, 2));
      return;
    }

    console.log(`Discovered ${voices.length} matching voices:\n`);
    console.log(
      ` ${'VOICE ID'.padEnd(30)} | ${'LOCALE'.padEnd(10)} | ${'GENDER'.padEnd(8)} | DISPLAY NAME`
    );
    console.log(''.padEnd(85, '-'));

    const displaySet = voices.slice(0, limit);
    for (const v of displaySet) {
      console.log(
        ` ${v.id.padEnd(30)} | ${v.locale.padEnd(10)} | ${v.gender.padEnd(8)} | ${v.displayName}`
      );
    }

    if (voices.length > limit) {
      console.log(`\n... and ${voices.length - limit} more voices. Use --limit <n> or --search to narrow down.`);
    }
  } catch (err: any) {
    console.error(`Error discovering voices: ${err.message}`);
    process.exit(1);
  }
}

async function handlePreview(args: string[]) {
  const isJson = args.includes('--json');

  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const voice = getArg('--voice');
  const preset = getArg('--preset') as VoiceoverPresetName | undefined;
  const text = getArg('--text');
  const rate = getArg('--rate');
  const pitch = getArg('--pitch');
  const volume = getArg('--volume');

  try {
    console.log(`Generating preview for voice "${voice || 'en-US-JennyNeural'}"...`);
    const result = await defaultVoiceoverService.previewVoice({
      voice,
      preset,
      text,
      parameters: { rate, pitch, volume },
      format: 'wav',
    });

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('✅ Voice preview ready:');
    console.log(`  Voice:      ${result.voice}`);
    console.log(`  Provider:   ${result.provider}`);
    console.log(`  Duration:   ${result.durationSeconds.toFixed(2)}s`);
    console.log(`  Cached:     ${result.cacheHit ? 'Yes' : 'No'}`);
    console.log(`  Parameters: Rate=${result.parameters.rate}, Pitch=${result.parameters.pitch}, Vol=${result.parameters.volume}`);
    console.log(`  Sample:     "${result.sampleText}"`);
    console.log(`  File:       ${result.previewFilePath}`);
  } catch (err: any) {
    console.error(`Voice preview generation failed: ${err.message}`);
    process.exit(1);
  }
}

async function handleSynthesize(args: string[]) {
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const text = getArg('--text');
  if (!text) {
    console.error('Error: Missing required --text argument.');
    process.exit(1);
  }

  const voice = getArg('--voice');
  const outPath = getArg('--out');
  const preset = getArg('--preset') as VoiceoverPresetName | undefined;
  const rate = getArg('--rate');
  const pitch = getArg('--pitch');
  const volume = getArg('--volume');
  const provider = getArg('--provider') as VoiceoverProviderId | undefined;

  try {
    console.log(`Synthesizing text using ${provider || 'edge-tts'} (${voice || 'en-US-JennyNeural'})...`);
    const result = await defaultVoiceoverService.generateVoiceover({
      text,
      voice,
      outputPath: outPath ? path.resolve(process.cwd(), outPath) : undefined,
      preset,
      parameters: { rate, pitch, volume },
      providerId: provider,
      format: 'wav',
    });

    console.log('✅ Synthesis complete:');
    console.log(`  Audio File: ${result.audioFilePath}`);
    console.log(`  Duration:   ${result.durationSeconds.toFixed(2)}s (${result.durationInFrames} frames @ ${result.fps}fps)`);
    console.log(`  Cached:     ${result.cacheHit ? 'Yes' : 'No'}`);
  } catch (err: any) {
    console.error(`Synthesis failed: ${err.message}`);
    process.exit(1);
  }
}

async function handleSyncScene(args: string[]) {
  const nonFlagArgs = args.filter((a) => !a.startsWith('--'));
  const sceneArg = nonFlagArgs[0];

  if (!sceneArg) {
    console.error('Error: Missing required path to scene.json.');
    process.exit(1);
  }

  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const isJson = args.includes('--json');
  const outArg = getArg('--out');
  const defaultVoice = getArg('--voice');
  const defaultPreset = getArg('--preset') as VoiceoverPresetName | undefined;

  const scenePath = path.resolve(process.cwd(), sceneArg);
  if (!fs.existsSync(scenePath)) {
    console.error(`Error: Scene file not found: ${scenePath}`);
    process.exit(1);
  }

  let sceneJson: SceneManifest;
  try {
    sceneJson = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
  } catch (err: any) {
    console.error(`Error reading scene JSON: ${err.message}`);
    process.exit(1);
  }

  const validation = validateSceneManifest(sceneJson);
  if (!validation.valid) {
    console.error('Scene manifest validation failed:');
    validation.errors.forEach((e) => console.error(`- [${e.code}] ${e.field}: ${e.message}`));
    process.exit(1);
  }

  try {
    console.log(`Synchronizing voiceovers for scene "${sceneJson.id}"...`);
    const syncResult = await defaultVoiceoverService.applyVoiceoverToScene(sceneJson, {
      defaultVoice,
      defaultPreset,
    });

    const outPath = outArg
      ? path.resolve(process.cwd(), outArg)
      : scenePath;

    fs.writeFileSync(outPath, JSON.stringify(syncResult.manifest, null, 2), 'utf8');

    if (isJson) {
      console.log(JSON.stringify(syncResult, null, 2));
      return;
    }

    console.log('✅ Scene voiceover synchronization complete:');
    console.log(`  Saved Manifest:     ${outPath}`);
    console.log(`  Dialogue Lines:     ${syncResult.lineResults.length}`);
    console.log(`  Voiceover Tracks:   ${syncResult.generatedTracks.length}`);
    console.log(`  Total VO Duration:  ${syncResult.totalVoiceoverDurationSeconds.toFixed(2)}s (${syncResult.totalVoiceoverDurationFrames} frames)`);
    console.log(`  Canvas Expanded:    ${syncResult.canvasDurationExpanded ? 'Yes' : 'No'}`);
    console.log('\nGenerated Audio Tracks:');
    syncResult.lineResults.forEach((lr) => {
      console.log(`  - [${lr.dialogId}] "${lr.text.slice(0, 30)}..." -> frames ${lr.startFrame} to ${lr.endFrame} (${lr.durationInFrames} frames) [${lr.voice}]`);
    });
  } catch (err: any) {
    console.error(`Scene voiceover synchronization failed: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  const subArgs = args.slice(1);
  switch (command) {
    case 'list':
    case 'voices':
      await handleList(subArgs);
      break;
    case 'preview':
      await handlePreview(subArgs);
      break;
    case 'synthesize':
    case 'synth':
      await handleSynthesize(subArgs);
      break;
    case 'sync-scene':
    case 'sync':
      await handleSyncScene(subArgs);
      break;
    default:
      console.error(`Unknown command: "${command}". Run with --help for usage.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
