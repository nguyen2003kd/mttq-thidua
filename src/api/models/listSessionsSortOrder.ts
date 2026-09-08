/* eslint-disable */

export type ListSessionsSortOrder = typeof ListSessionsSortOrder[keyof typeof ListSessionsSortOrder];


export const ListSessionsSortOrder = {
  asc: 'asc',
  desc: 'desc',
} as const;
