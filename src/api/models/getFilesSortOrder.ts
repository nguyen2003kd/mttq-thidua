/* eslint-disable */

export type GetFilesSortOrder = typeof GetFilesSortOrder[keyof typeof GetFilesSortOrder];


export const GetFilesSortOrder = {
  asc: 'asc',
  desc: 'desc',
} as const;
