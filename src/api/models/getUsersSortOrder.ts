/* eslint-disable */

export type GetUsersSortOrder = typeof GetUsersSortOrder[keyof typeof GetUsersSortOrder];


export const GetUsersSortOrder = {
  asc: 'asc',
  desc: 'desc',
} as const;
