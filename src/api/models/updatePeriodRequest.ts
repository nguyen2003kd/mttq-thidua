/* eslint-disable */
import type { PeriodStatus } from './periodStatus.ts';

export interface UpdatePeriodRequest {
  startYear?: number;
  endYear?: number;
  /** @nullable */
  name?: string | null;
  status?: PeriodStatus;
  scoringConfigId?: string;
  maxBonusPointPerPeriod?: number;
  maxBonusPointPerCriteria?: number;
}
