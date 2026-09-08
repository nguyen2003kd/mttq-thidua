/* eslint-disable */
import type { WebLoginDataSessionTokenType } from './webLoginDataSessionTokenType.ts';

export type WebLoginDataSession = {
  id: string;
  expires_at: string;
  refresh_expires_at: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: WebLoginDataSessionTokenType;
};
