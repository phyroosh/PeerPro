import { LipSyncKeyframe, LipSyncViseme, SpeechCadenceOptions } from './types';
import { SceneDialogLine } from '../scene/types';

const DEFAULT_CLOSED_ASSET = 'starter-char-mouth-closed';
const DEFAULT_OPEN_ASSET = 'starter-char-mouth-smile';
const DEFAULT_SMILE_ASSET = 'starter-char-mouth-smile-v2';

/**
 * Pure, frame-deterministic speech-to-mouth scheduler.
 * Translates dialog text and timeline bounds into rhythmic anime mouth flap cycles and pauses.
 */
export function computeLipSyncSchedule(
  dialog: SceneDialogLine,
  fps = 30,
  options: SpeechCadenceOptions = {}
): LipSyncKeyframe[] {
  const closedAsset = options.defaultClosedAsset ?? DEFAULT_CLOSED_ASSET;
  const openAsset = options.defaultOpenAsset ?? DEFAULT_OPEN_ASSET;
  const smileAsset = options.defaultSmileAsset ?? DEFAULT_SMILE_ASSET;

  const keyframes: LipSyncKeyframe[] = [];
  const startFrame = dialog.startFrame;
  const endFrame = dialog.endFrame;
  const totalFrames = endFrame - startFrame;

  if (totalFrames <= 0) {
    return [{ frame: startFrame, viseme: 'closed', mouthAssetId: closedAsset }];
  }

  // Pre-speech: closed mouth
  keyframes.push({ frame: Math.max(0, startFrame - 1), viseme: 'closed', mouthAssetId: closedAsset });

  // Tokenize text into words and punctuation
  const words = dialog.text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    keyframes.push({ frame: startFrame, viseme: 'closed', mouthAssetId: closedAsset });
    return keyframes;
  }

  // Flap cycle duration in frames (at 3.5Hz, 30fps / 3.5 ≈ 8.5 frames per flap)
  const flapFreq = options.flapFrequency ?? 3.5;
  const flapCycleFrames = Math.max(4, Math.round(fps / flapFreq));
  const openDuration = Math.max(2, Math.round(flapCycleFrames * 0.45));
  const smileDuration = Math.max(2, Math.round(flapCycleFrames * 0.35));

  let currentFrame = startFrame;
  const framesPerWord = Math.max(flapCycleFrames, Math.floor(totalFrames / words.length));

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    const isLastWord = w === words.length - 1;
    const hasPunctuation = /[.,!?;:]$/.test(word);
    const isExclamation = word.includes('!') || word.includes('?');

    const wordEndFrame = isLastWord ? endFrame : Math.min(endFrame, currentFrame + framesPerWord);
    const wordSpeakingFrames = hasPunctuation ? Math.max(flapCycleFrames, (wordEndFrame - currentFrame) - 4) : (wordEndFrame - currentFrame);

    let flapLocal = 0;
    while (currentFrame + flapLocal < currentFrame + wordSpeakingFrames) {
      const flapStart = currentFrame + flapLocal;

      // 1. Mouth opens
      keyframes.push({
        frame: flapStart,
        viseme: 'open',
        mouthAssetId: openAsset,
      });

      // 2. Mouth transitions to smile / half-open
      const smileStart = flapStart + openDuration;
      if (smileStart < currentFrame + wordSpeakingFrames) {
        keyframes.push({
          frame: smileStart,
          viseme: 'smile',
          mouthAssetId: smileAsset,
        });
      }

      // 3. Mouth closes before next syllable
      const closeStart = flapStart + openDuration + smileDuration;
      if (closeStart < currentFrame + wordSpeakingFrames) {
        keyframes.push({
          frame: closeStart,
          viseme: 'closed',
          mouthAssetId: closedAsset,
        });
      }

      flapLocal += flapCycleFrames;
    }

    // Word boundary pause
    if (hasPunctuation) {
      const pauseFrame = currentFrame + wordSpeakingFrames;
      keyframes.push({
        frame: pauseFrame,
        viseme: isExclamation ? 'smile' : 'closed',
        mouthAssetId: isExclamation ? smileAsset : closedAsset,
      });
    }

    currentFrame = wordEndFrame;
  }

  // Final settle after speech completes
  keyframes.push({
    frame: endFrame,
    viseme: dialog.text.includes('!') ? 'smile' : 'closed',
    mouthAssetId: dialog.text.includes('!') ? smileAsset : closedAsset,
  });

  // Sort and deduplicate by frame
  keyframes.sort((a, b) => a.frame - b.frame);
  const deduped: LipSyncKeyframe[] = [];
  for (const kf of keyframes) {
    if (deduped.length > 0 && deduped[deduped.length - 1].frame === kf.frame) {
      deduped[deduped.length - 1] = kf;
    } else {
      deduped.push(kf);
    }
  }

  return deduped;
}

/**
 * Pure function evaluating the active viseme and mouth asset ID at any arbitrary timeline frame.
 */
export function evaluateLipSyncAtFrame(
  frame: number,
  schedule: LipSyncKeyframe[],
  defaultAsset = DEFAULT_CLOSED_ASSET
): { viseme: LipSyncViseme; mouthAssetId: string } {
  if (!schedule || schedule.length === 0) {
    return { viseme: 'closed', mouthAssetId: defaultAsset };
  }

  let active = schedule[0];
  for (const kf of schedule) {
    if (kf.frame <= frame) {
      active = kf;
    } else {
      break;
    }
  }

  return { viseme: active.viseme, mouthAssetId: active.mouthAssetId };
}
