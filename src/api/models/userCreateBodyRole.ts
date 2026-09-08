/* eslint-disable */

export type UserCreateBodyRole = typeof UserCreateBodyRole[keyof typeof UserCreateBodyRole];


export const UserCreateBodyRole = {
  user: 'user',
  admin: 'admin',
  system_admin: 'system_admin',
} as const;
