/* eslint-disable */
import type { EmulationClassificationStatus } from './emulationClassificationStatus.ts';

export interface UpdateEmulationClassificationRequest {
  /** @nullable */
  scopeCode?: string | null;
  assessmentYear?: number;
  /** @nullable */
  code?: string | null;
  /** @nullable */
  name?: string | null;
  minPoint?: number;
  maxPoint?: number;
  includeMin?: boolean;
  includeMax?: boolean;
  sortOrder?: number;
  status?: EmulationClassificationStatus;
}
