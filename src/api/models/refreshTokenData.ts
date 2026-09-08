/* eslint-disable */
import type { RefreshTokenDataSession } from './refreshTokenDataSession.ts';
import type { RefreshTokenDataTokenType } from './refreshTokenDataTokenType.ts';

/**
 * @nullable
 */
export type RefreshTokenData = {
  session: RefreshTokenDataSession;
  access_token?: string;
  refresh_token?: string;
  token_type?: RefreshTokenDataTokenType;
} | null;
