/* eslint-disable */
import type { ErrorMessages } from './errorMessages.ts';

export interface Error {
  field: string;
  code: string;
  messages: ErrorMessages;
}
