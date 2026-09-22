/* eslint-disable */
import type { PeriodStatus } from './periodStatus.ts';

export interface CreatePeriodRequest {
  startYear?: number;
  endYear?: number;
  /** @nullable */
  name?: string | null;
  status?: PeriodStatus;
}
