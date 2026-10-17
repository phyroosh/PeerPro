import { SceneManifest, SceneCharacterInstance } from '../scene/types';
import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import { defaultCharacterPresets } from '../characters/presets';
import { defaultEnvironmentPresets } from '../environments/presets';
import { CharacterDefinition } from '../characters/types';
import { EnvironmentDefinition } from '../environments/types';
import {
  CompositionReport,
  CompositionIssue,
  CompositionScoreBreakdown,
  CharacterBoundingBox,
  RemediationRecipe,
} from './types';

export interface AnalyzerOptions {
  registry?: AssetRegistry;
  characterPresets?: Record<string, CharacterDefinition>;
  environmentPresets?: Record<string, EnvironmentDefinition>;
  letterbox?: 'none' | 'cinemascope' | 'anamorphic' | 'custom';
}

/**
 * Pure, frame-deterministic mathematical composition analyzer.
 * Evaluates scene staging, framing, headroom, grounding, depth alignment, and safe zones.
 */
export function analyzeSceneComposition(
  manifest: SceneManifest,
  options: AnalyzerOptions = {}
): CompositionReport {
  const issues: CompositionIssue[] = [];
  const recommendations: string[] = [];

  const width = manifest.canvas?.width ?? 1920;
  const height = manifest.canvas?.height ?? 1080;
  const duration = manifest.canvas?.durationInFrames ?? 150;

  const letterbox = options.letterbox ?? 'none';
  const matteHeight = letterbox === 'cinemascope' ? Math.round((height - width / 2.39) / 2) : 0;
  const visibleTop = matteHeight;
  const visibleBottom = height - matteHeight;
  const visibleHeight = visibleBottom - visibleTop;

  // Environment floor level
  let floorY = 920;
  const envPreset = manifest.environment?.preset;
  if (envPreset) {
    if (envPreset.includes('classroom')) {
      floorY = 920;
    } else if (envPreset.includes('street')) {
      floorY = 940;
    }
  }

  // Camera settings
  const focalDepth = manifest.camera?.focalDepth ?? 1.0;
  const dofConfig = manifest.camera?.depthOfField;
  const dofAperture = dofConfig?.aperture ?? 1.0;
  const dofMaxBlur = dofConfig?.maxBlur ?? 8.0;
  const hasShallowDoF = !!(dofConfig && dofAperture >= 0.4 && dofMaxBlur > 0);

  const characterBounds: CharacterBoundingBox[] = [];

  // Analyze each placed character
  if (manifest.characters && manifest.characters.length > 0) {
    manifest.characters.forEach((char: SceneCharacterInstance) => {
      const scale = char.scale ?? 1.0;
      const charDepth = char.depth ?? 1.0;
      const posX = char.position.x;
      const posY = char.position.y;

      // Estimated standard bounding box for PeerPro character rig (approx 200w x 580h at scale 1.0)
      const approxCharWidth = 200 * scale;
      const approxCharHeight = 580 * scale;
      const headY = posY - approxCharHeight + 40 * scale; // top of hair
      const feetY = posY + 20 * scale;                    // bottom of shoes
      const charLeft = posX - approxCharWidth / 2;
      const charRight = posX + approxCharWidth / 2;

      const headroom = headY - visibleTop;
      const headroomRatio = Math.max(0, headroom / visibleHeight);

      characterBounds.push({
        characterId: char.id,
        x: posX,
        y: posY,
        width: approxCharWidth,
        height: approxCharHeight,
        headY,
        feetY,
        depth: charDepth,
        headroomRatio,
      });

      // 1. Headroom & Letterbox Clipping
      if (headY < visibleTop) {
        const clipDistance = Math.round(visibleTop - headY);
        issues.push({
          code: letterbox !== 'none' ? 'LETTERBOX_HEAD_CLIPPED' : 'TOP_VIEWPORT_CLIPPED',
          category: 'headroom',
          severity: 'error',
          characterId: char.id,
          message: `Character "${char.id}" head is clipped by ${clipDistance}px beyond top visible boundary (y=${Math.round(headY)}, visibleTop=${visibleTop}).`,
          details: { headY, visibleTop, clipDistance },
          remediation: {
            recipeId: letterbox !== 'none' ? 'CORRECT_LETTERBOX_CLIPPING' : 'CORRECT_HEADROOM',
            description: `Lower character Y coordinate by ${clipDistance + 20}px to restore headroom inside safe zone.`,
            parameters: {
              characterId: char.id,
              targetY: Math.round(posY + clipDistance + 25),
            },
          },
        });
      } else if (headroomRatio < 0.05) {
        issues.push({
          code: 'HEADROOM_TOO_TIGHT',
          category: 'headroom',
          severity: 'warning',
          characterId: char.id,
          message: `Character "${char.id}" has tight headroom (${(headroomRatio * 100).toFixed(1)}% of frame). Minimum recommended is 8%.`,
          details: { headroomRatio },
          remediation: {
            recipeId: 'CORRECT_HEADROOM',
            description: `Shift character Y down to achieve optimal 14% headroom.`,
            parameters: {
              characterId: char.id,
              targetY: Math.round(visibleTop + visibleHeight * 0.14 + approxCharHeight - 40 * scale),
            },
          },
        });
      } else if (headroomRatio > 0.32) {
        issues.push({
          code: 'HEADROOM_EXCESSIVE',
          category: 'headroom',
          severity: 'warning',
          characterId: char.id,
          message: `Character "${char.id}" has excessive headroom (${(headroomRatio * 100).toFixed(1)}% of frame). Character appears diminutive.`,
          details: { headroomRatio },
          remediation: {
            recipeId: 'CORRECT_HEADROOM',
            description: `Adjust character position or scale up to fill cinematic frame balance.`,
            parameters: {
              characterId: char.id,
              suggestedScale: Number((scale * 1.15).toFixed(2)),
            },
          },
        });
      }

      // 2. Grounding Analysis (Floor horizon contact)
      const groundingDelta = Math.round(feetY - floorY);
      if (groundingDelta < -35) {
        // Floating above floor
        const floatDistance = Math.abs(groundingDelta);
        issues.push({
          code: 'CHARACTER_FLOATING',
          category: 'grounding',
          severity: 'error',
          characterId: char.id,
          message: `Character "${char.id}" is floating ${floatDistance}px above the floor horizon (feetY=${Math.round(feetY)}, floorY=${floorY}).`,
          details: { feetY, floorY, floatDistance },
          remediation: {
            recipeId: 'CORRECT_GROUNDING',
            description: `Ground character feet directly onto environment floor line at y=${floorY}.`,
            parameters: {
              characterId: char.id,
              targetY: Math.round(floorY - 20 * scale),
            },
          },
        });
      } else if (groundingDelta > 50) {
        // Sunk below floor
        issues.push({
          code: 'CHARACTER_SUNKEN',
          category: 'grounding',
          severity: 'warning',
          characterId: char.id,
          message: `Character "${char.id}" is sunken ${groundingDelta}px below the floor horizon.`,
          details: { feetY, floorY, groundingDelta },
          remediation: {
            recipeId: 'CORRECT_GROUNDING',
            description: `Raise character Y coordinate to place feet on floor line.`,
            parameters: {
              characterId: char.id,
              targetY: Math.round(floorY - 20 * scale),
            },
          },
        });
      }

      // 3. Horizontal Viewport Safety & Rule-of-Thirds
      if (charLeft < 80) {
        issues.push({
          code: 'LEFT_VIEWPORT_SPILL',
          category: 'safe_zone',
          severity: 'warning',
          characterId: char.id,
          message: `Character "${char.id}" extends within ${Math.round(charLeft)}px of left viewport edge.`,
          details: { charLeft },
        });
      } else if (charRight > width - 80) {
        issues.push({
          code: 'RIGHT_VIEWPORT_SPILL',
          category: 'safe_zone',
          severity: 'warning',
          characterId: char.id,
          message: `Character "${char.id}" extends within ${Math.round(width - charRight)}px of right viewport edge.`,
          details: { charRight, width },
        });
      }

      // 4. Depth-of-Field & Optical Focus Alignment
      if (hasShallowDoF && dofConfig) {
        const depthDiff = Math.abs(charDepth - focalDepth);
        const blurRadius = Math.min(depthDiff * dofAperture * 10, dofMaxBlur);

        if (blurRadius > 2.5) {
          const isSpeaker = manifest.dialog?.some((d) => d.characterId === char.id);
          const isSoleCharacter = manifest.characters?.length === 1;

          if (isSpeaker || isSoleCharacter) {
            issues.push({
              code: 'SUBJECT_OUT_OF_FOCUS',
              category: 'depth_focus',
              severity: 'error',
              characterId: char.id,
              message: `Speaking hero character "${char.id}" is optically blurred (${blurRadius.toFixed(1)}px blur) because depth (${charDepth}) diverges from camera focalDepth (${focalDepth}).`,
              details: { charDepth, focalDepth, blurRadius },
              remediation: {
                recipeId: 'CORRECT_DOF_FOCUS',
                description: `Align camera focalDepth to match character depth plane (${charDepth}).`,
                parameters: {
                  targetFocalDepth: charDepth,
                },
              },
            });
          }
        }
      }

      // 5. Action Clip Timeline Boundaries
      if (char.animation?.actions) {
        char.animation.actions.forEach((clip, index) => {
          if (clip.startFrame + clip.durationInFrames > duration) {
            const overflow = clip.startFrame + clip.durationInFrames - duration;
            issues.push({
              code: 'ACTION_OVERFLOWS_SCENE',
              category: 'timeline',
              severity: 'warning',
              characterId: char.id,
              message: `Action clip "${clip.action}" [index ${index}] extends ${overflow} frames beyond scene duration (${duration}).`,
              details: { clip, duration, overflow },
              remediation: {
                recipeId: 'CORRECT_ACTION_TIMING',
                description: `Trim clip duration to ${duration - clip.startFrame} frames to fit within scene bounds.`,
                parameters: {
                  characterId: char.id,
                  actionIndex: index,
                  targetDurationInFrames: duration - clip.startFrame,
                },
              },
            });
          }
        });
      }
    });
  } else {
    issues.push({
      code: 'NO_CHARACTERS_STAGED',
      category: 'framing',
      severity: 'warning',
      message: 'Scene manifest contains no character instances.',
    });
  }

  // Calculate scores per category (0 to 100)
  const categoryIssues = (cat: string) => issues.filter((i) => i.category === cat);
  const calcCatScore = (cat: string): number => {
    const list = categoryIssues(cat);
    let s = 100;
    for (const item of list) {
      if (item.severity === 'error') s -= 30;
      else if (item.severity === 'warning') s -= 12;
      else s -= 4;
    }
    return Math.max(0, Math.min(100, s));
  };

  const scoreBreakdown: CompositionScoreBreakdown = {
    framing: calcCatScore('framing'),
    headroom: calcCatScore('headroom'),
    grounding: calcCatScore('grounding'),
    depthFocus: calcCatScore('depth_focus'),
    safeZones: calcCatScore('safe_zone'),
    coherence: calcCatScore('angle_coherence'),
  };

  // Weighted overall score
  const overallScore = Math.round(
    scoreBreakdown.framing * 0.15 +
      scoreBreakdown.headroom * 0.25 +
      scoreBreakdown.grounding * 0.25 +
      scoreBreakdown.depthFocus * 0.2 +
      scoreBreakdown.safeZones * 0.15
  );

  const hasErrors = issues.some((i) => i.severity === 'error');
  const passed = overallScore >= 80 && !hasErrors;

  // Generate high-level recommendations
  if (issues.length === 0) {
    recommendations.push('Excellent composition! Golden headroom, grounded feet, and sharp focal alignment.');
  } else {
    issues.forEach((issue) => {
      if (issue.remediation) {
        recommendations.push(issue.remediation.description);
      }
    });
  }

  return {
    sceneId: manifest.id,
    overallScore,
    passed,
    scoreBreakdown,
    characterBounds,
    issues,
    recommendations,
  };
}
