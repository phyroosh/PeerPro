export type ChallengeCategory =
  | 'location'
  | 'continuity'
  | 'spatial'
  | 'interaction'
  | 'cinematography'
  | 'limitation';

export type ChallengeStatus = 'PASS' | 'FAIL' | 'IDENTIFIED_GAP';

export interface ChallengeDefinition {
  id: string;
  title: string;
  category: ChallengeCategory;
  prompt: string;
  expectedOutcome: string;
  scenePath?: string;
  compositionId?: string;
  frameToInspect: number;
}

export interface ChallengeScore {
  toolDiscovery: number;
  apiCorrectness: number;
  visualQuality: number;
  determinism: number;
  repairBehavior: number;
  honestLimitation: number;
  overallScore: number;
}

export interface ChallengeResult {
  id: string;
  title: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  scores: ChallengeScore;
  outputStills: string[];
  compositionScore?: number;
  diagnosticLogs: string[];
  observedGaps: string[];
}

export interface RankedGap {
  rank: number;
  title: string;
  impact: string;
  affectedChallenges: string[];
  recommendation: string;
}

export interface GeneralizationSuiteReport {
  timestamp: string;
  nodeVersion: string;
  totalChallenges: number;
  passedCount: number;
  gapCount: number;
  failedCount: number;
  averageScore: number;
  results: ChallengeResult[];
  rankedGaps: RankedGap[];
}
