/* eslint-disable */
import type { MobileLoginDataTokenType } from './mobileLoginDataTokenType.ts';
import type { UserPublic } from './userPublic.ts';

/**
 * @nullable
 */
export type MobileLoginData = {
  user: UserPublic;
  access_token: string;
  refresh_token: string;
  token_type: MobileLoginDataTokenType;
} | null;
