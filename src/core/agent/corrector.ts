import { SceneManifest } from '../scene/types';
import { analyzeSceneComposition, AnalyzerOptions } from './analyzer';
import {
  CompositionReport,
  CorrectedSceneResult,
  RemediationRecipe,
} from './types';

export interface CorrectorOptions extends AnalyzerOptions {
  autoApplyAll?: boolean;
}

/**
 * Pure, deterministic self-correction engine.
 * Takes a flawed SceneManifest, evaluates composition defects, and applies validated mathematical remediation recipes.
 */
export function autoCorrectScene(
  manifest: SceneManifest,
  report?: CompositionReport,
  options: CorrectorOptions = {}
): CorrectedSceneResult {
  // Deep clone manifest to guarantee purity
  const corrected: SceneManifest = JSON.parse(JSON.stringify(manifest));
  const changeLog: string[] = [];
  const appliedRecipes: RemediationRecipe[] = [];

  // Generate analysis report if not supplied
  const activeReport = report ?? analyzeSceneComposition(corrected, options);
  const originalScore = activeReport.overallScore;

  // Process all issues with remediation recipes
  for (const issue of activeReport.issues) {
    if (!issue.remediation) continue;

    const recipe = issue.remediation;
    const params = recipe.parameters;

    switch (recipe.recipeId) {
      case 'CORRECT_HEADROOM':
      case 'CORRECT_GROUNDING':
      case 'CORRECT_LETTERBOX_CLIPPING': {
        const charId = params.characterId as string;
        const targetY = params.targetY as number | undefined;
        const suggestedScale = params.suggestedScale as number | undefined;

        if (corrected.characters) {
          const char = corrected.characters.find((c) => c.id === charId);
          if (char) {
            if (targetY !== undefined) {
              const prevY = char.position.y;
              char.position.y = targetY;
              changeLog.push(
                `[${recipe.recipeId}] Character "${charId}" Y position adjusted from ${prevY} to ${targetY}. (${recipe.description})`
              );
              appliedRecipes.push(recipe);
            } else if (suggestedScale !== undefined) {
              const prevScale = char.scale ?? 1.0;
              char.scale = suggestedScale;
              changeLog.push(
                `[${recipe.recipeId}] Character "${charId}" scale adjusted from ${prevScale} to ${suggestedScale}. (${recipe.description})`
              );
              appliedRecipes.push(recipe);
            }
          }
        }
        break;
      }

      case 'CORRECT_DOF_FOCUS': {
        const targetFocalDepth = params.targetFocalDepth as number;
        if (corrected.camera) {
          const prevFocalDepth = corrected.camera.focalDepth ?? 1.0;
          corrected.camera.focalDepth = targetFocalDepth;
          changeLog.push(
            `[CORRECT_DOF_FOCUS] Camera focalDepth snapped from ${prevFocalDepth} to ${targetFocalDepth} to focus on hero character.`
          );
          appliedRecipes.push(recipe);
        }
        break;
      }

      case 'CORRECT_ACTION_TIMING': {
        const charId = params.characterId as string;
        const actionIndex = params.actionIndex as number;
        const targetDuration = params.targetDurationInFrames as number;

        if (corrected.characters) {
          const char = corrected.characters.find((c) => c.id === charId);
          if (char?.animation?.actions && char.animation.actions[actionIndex]) {
            const clip = char.animation.actions[actionIndex];
            const prevDur = clip.durationInFrames;
            clip.durationInFrames = targetDuration;
            changeLog.push(
              `[CORRECT_ACTION_TIMING] Character "${charId}" action "${clip.action}" duration trimmed from ${prevDur} to ${targetDuration} frames.`
            );
            appliedRecipes.push(recipe);
          }
        }
        break;
      }
    }
  }

  // Re-run composition analysis on the corrected manifest
  const finalReport = analyzeSceneComposition(corrected, options);
  const improvedScore = finalReport.overallScore;

  return {
    sceneId: manifest.id,
    originalScore,
    improvedScore,
    appliedRecipes,
    manifest: corrected,
    changeLog,
  };
}
