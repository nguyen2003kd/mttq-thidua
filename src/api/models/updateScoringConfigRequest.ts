/* eslint-disable */
import type { ScoringConfigLevelPayload } from './scoringConfigLevelPayload.ts';

export interface UpdateScoringConfigRequest {
  /** @nullable */
  name?: string | null;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  levels?: ScoringConfigLevelPayload[] | null;
}
