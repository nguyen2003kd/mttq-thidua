/* eslint-disable */
import type { Error } from './error.ts';
import type { RefreshTokenData } from './refreshTokenData.ts';

export interface RefreshTokenResponse {
  success: boolean;
  data?: RefreshTokenData | null;
  /** @nullable */
  trace_id: string | null;
  timestamp: string;
  /** @nullable */
  errors: Error[] | null;
}
