/* eslint-disable */
import type { UserPublic } from './userPublic.ts';
import type { WebLoginDataSession } from './webLoginDataSession.ts';

/**
 * @nullable
 */
export type WebLoginData = {
  user: UserPublic;
  session: WebLoginDataSession;
  access_token?: string;
  refresh_token?: string;
} | null;
