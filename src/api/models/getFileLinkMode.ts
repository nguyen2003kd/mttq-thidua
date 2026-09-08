/* eslint-disable */

export type GetFileLinkMode = typeof GetFileLinkMode[keyof typeof GetFileLinkMode];


export const GetFileLinkMode = {
  view: 'view',
  download: 'download',
} as const;
