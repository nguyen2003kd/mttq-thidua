/* eslint-disable */
import type { ScoringConfigLevelPayload } from './scoringConfigLevelPayload.ts';

export interface CreateScoringConfigRequest {
  /** @nullable */
  name?: string | null;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  levels?: ScoringConfigLevelPayload[] | null;
}
